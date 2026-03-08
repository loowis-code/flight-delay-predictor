/**
 * Import Eurocontrol delay data into Supabase PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/import-eurocontrol.ts <csv-file>
 *
 * Expected CSV columns (from ansperformance.eu punctuality data):
 *   YEAR, MONTH_NUM, FLT_DATE, AIRLINE_ICAO, ADEP (origin ICAO), ADES (destination ICAO),
 *   FLT_DEP_SCHED_TIME, DEP_DELAY_MINUTES, ARR_DELAY_MINUTES
 *
 * The script aggregates individual flights into the route_delay_stats table
 * grouped by airline + route + month + day_of_week + time_bucket + year.
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

interface FlightRow {
    year: number
    month: number
    date: string
    airlineIcao: string
    originIcao: string
    destinationIcao: string
    scheduledTime: string
    depDelayMinutes: number
    arrDelayMinutes: number
}

function getTimeBucket(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
}

function parseCsvLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    fields.push(current.trim())
    return fields
}

function parseRow(headers: string[], fields: string[]): FlightRow | null {
    const get = (name: string) => {
        const idx = headers.indexOf(name)
        return idx >= 0 ? fields[idx] : ''
    }

    const year = parseInt(get('YEAR'))
    const month = parseInt(get('MONTH_NUM'))
    const date = get('FLT_DATE')
    const airlineIcao = get('AIRLINE_ICAO')
    const originIcao = get('ADEP')
    const destinationIcao = get('ADES')
    const scheduledTime = get('FLT_DEP_SCHED_TIME')
    const depDelay = parseFloat(get('DEP_DELAY_MINUTES'))
    const arrDelay = parseFloat(get('ARR_DELAY_MINUTES'))

    if (!airlineIcao || !originIcao || !destinationIcao) return null
    if (isNaN(year) || isNaN(month)) return null

    return {
        year,
        month,
        date,
        airlineIcao,
        originIcao,
        destinationIcao,
        scheduledTime,
        depDelayMinutes: isNaN(depDelay) ? 0 : depDelay,
        arrDelayMinutes: isNaN(arrDelay) ? 0 : arrDelay,
    }
}

interface AggKey {
    airlineIcao: string
    originIcao: string
    destinationIcao: string
    month: number
    dayOfWeek: number
    timeBucket: string
    dataYear: number
}

interface AggValue {
    totalFlights: number
    delayedFlights: number
    cancelledFlights: number
    delays: number[]
}

async function main() {
    const csvPath = process.argv[2]
    if (!csvPath) {
        console.error('Usage: npx tsx scripts/import-eurocontrol.ts <csv-file>')
        process.exit(1)
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    if (!supabaseUrl || !supabaseKey) {
        console.error(
            'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variable',
        )
        process.exit(1)
    }

    console.log(`Reading ${csvPath}...`)
    const content = readFileSync(csvPath, 'utf-8')
    const lines = content.split('\n').filter((l) => l.trim())

    if (lines.length < 2) {
        console.error('CSV file is empty or has no data rows')
        process.exit(1)
    }

    const headers = parseCsvLine(lines[0])
    console.log(`Headers: ${headers.join(', ')}`)

    // Aggregate flights into buckets
    const aggregates = new Map<string, AggValue>()

    let parsed = 0
    let skipped = 0

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCsvLine(lines[i])
        const row = parseRow(headers, fields)

        if (!row) {
            skipped++
            continue
        }

        const flightDate = new Date(row.date)
        const dayOfWeek = isNaN(flightDate.getTime())
            ? 0
            : (flightDate.getDay() + 6) % 7

        let hour = 12
        if (row.scheduledTime) {
            const timeParts = row.scheduledTime.split(':')
            if (timeParts.length >= 1) {
                const h = parseInt(timeParts[0])
                if (!isNaN(h)) hour = h
            }
        }

        const key: AggKey = {
            airlineIcao: row.airlineIcao,
            originIcao: row.originIcao,
            destinationIcao: row.destinationIcao,
            month: row.month,
            dayOfWeek,
            timeBucket: getTimeBucket(hour),
            dataYear: row.year,
        }

        const keyStr = JSON.stringify(key)
        const existing = aggregates.get(keyStr) ?? {
            totalFlights: 0,
            delayedFlights: 0,
            cancelledFlights: 0,
            delays: [],
        }

        existing.totalFlights++
        const delay = Math.max(row.depDelayMinutes, row.arrDelayMinutes)
        existing.delays.push(delay)
        if (delay > 15) existing.delayedFlights++

        aggregates.set(keyStr, existing)
        parsed++
    }

    console.log(
        `Parsed ${parsed} flights, skipped ${skipped}, ${aggregates.size} aggregate buckets`,
    )

    // Insert into database
    const db = createClient(supabaseUrl, supabaseKey)
    let inserted = 0

    // Batch upserts in chunks of 500
    const rows: Record<string, unknown>[] = []

    for (const [keyStr, value] of aggregates) {
        const key = JSON.parse(keyStr) as AggKey

        const sorted = value.delays.sort((a, b) => a - b)
        const avg = sorted.reduce((sum, d) => sum + d, 0) / sorted.length || 0
        const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0
        const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0

        rows.push({
            airline_icao: key.airlineIcao,
            origin_icao: key.originIcao,
            destination_icao: key.destinationIcao,
            month: key.month,
            day_of_week: key.dayOfWeek,
            time_bucket: key.timeBucket,
            total_flights: value.totalFlights,
            delayed_flights: value.delayedFlights,
            avg_delay_minutes: Math.round(avg * 100) / 100,
            p50_delay_minutes: Math.round(p50 * 100) / 100,
            p90_delay_minutes: Math.round(p90 * 100) / 100,
            cancelled_flights: value.cancelledFlights,
            data_year: key.dataYear,
        })

        if (rows.length >= 500) {
            const { error } = await db.from('route_delay_stats').upsert(rows, {
                onConflict:
                    'airline_icao,origin_icao,destination_icao,month,day_of_week,time_bucket,data_year',
            })
            if (error) throw error
            inserted += rows.length
            console.log(`Inserted ${inserted}/${aggregates.size} rows...`)
            rows.length = 0
        }
    }

    // Flush remaining rows
    if (rows.length > 0) {
        const { error } = await db.from('route_delay_stats').upsert(rows, {
            onConflict:
                'airline_icao,origin_icao,destination_icao,month,day_of_week,time_bucket,data_year',
        })
        if (error) throw error
        inserted += rows.length
    }

    console.log(`Done! Inserted ${inserted} rows into route_delay_stats.`)
}

main().catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
})
