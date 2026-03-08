/**
 * Seed reverse direction routes so cached flights match.
 * Run after seed-data.ts.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-reverse-routes.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const db = createClient(supabaseUrl, supabaseKey)

function generateRouteStats(
    airlineIcao: string,
    originIcao: string,
    destinationIcao: string,
    baseDelayRate: number,
    baseAvgDelay: number,
    baseP50: number,
    baseP90: number,
) {
    const rows: Record<string, unknown>[] = []
    const timeBuckets = ['morning', 'afternoon', 'evening', 'night']
    const timeBucketMultipliers = [0.8, 1.0, 1.3, 0.9]
    const monthMultipliers: Record<number, number> = {
        1: 1.1,
        2: 1.0,
        3: 0.9,
        4: 0.85,
        5: 0.9,
        6: 1.15,
        7: 1.3,
        8: 1.35,
        9: 1.0,
        10: 0.9,
        11: 0.95,
        12: 1.2,
    }
    const dayMultipliers: Record<number, number> = {
        0: 1.1,
        1: 0.9,
        2: 0.85,
        3: 0.95,
        4: 1.15,
        5: 1.0,
        6: 1.1,
    }

    for (const month of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        for (let day = 0; day < 7; day++) {
            for (let ti = 0; ti < timeBuckets.length; ti++) {
                const mMul = monthMultipliers[month] ?? 1
                const dMul = dayMultipliers[day] ?? 1
                const tMul = timeBucketMultipliers[ti]

                const delayRate = Math.min(
                    baseDelayRate * mMul * dMul * tMul,
                    0.95,
                )
                const totalFlights = 30 + Math.floor(Math.random() * 40)

                rows.push({
                    airline_icao: airlineIcao,
                    origin_icao: originIcao,
                    destination_icao: destinationIcao,
                    month,
                    day_of_week: day,
                    time_bucket: timeBuckets[ti],
                    total_flights: totalFlights,
                    delayed_flights: Math.round(totalFlights * delayRate),
                    avg_delay_minutes:
                        Math.round(baseAvgDelay * mMul * dMul * tMul * 100) /
                        100,
                    p50_delay_minutes:
                        Math.round(baseP50 * mMul * dMul * tMul * 100) / 100,
                    p90_delay_minutes:
                        Math.round(baseP90 * mMul * dMul * tMul * 100) / 100,
                    cancelled_flights: Math.floor(Math.random() * 3),
                    data_year: 2024,
                })
            }
        }
    }
    return rows
}

async function main() {
    // Reverse of existing routes + full month/timebucket coverage
    const routes = [
        // BA463: MAD → LHR (LEMD → EGLL)
        generateRouteStats('BAW', 'LEMD', 'EGLL', 0.24, 15, 9, 34),
        // Reverse: CDG → LHR
        generateRouteStats('BAW', 'LFPG', 'EGLL', 0.14, 8, 5, 20),
        // Reverse: EDI → DUB
        generateRouteStats('RYR', 'EGPH', 'EIDW', 0.33, 21, 14, 45),
        // Reverse: LGW → DUB
        generateRouteStats('RYR', 'EGKK', 'EIDW', 0.26, 17, 10, 38),
        // Reverse: AMS → FRA
        generateRouteStats('DLH', 'EHAM', 'EDDF', 0.14, 8, 5, 20),
        // Reverse: FCO → FRA
        generateRouteStats('DLH', 'LIRF', 'EDDF', 0.19, 11, 7, 26),
    ]

    const allRows = routes.flat()
    console.log(`Seeding ${allRows.length} reverse route stats...`)

    for (let i = 0; i < allRows.length; i += 500) {
        const chunk = allRows.slice(i, i + 500)
        const { error } = await db.from('route_delay_stats').upsert(chunk, {
            onConflict:
                'airline_icao,origin_icao,destination_icao,month,day_of_week,time_bucket,data_year',
        })
        if (error) throw error
        console.log(
            `  Inserted ${Math.min(i + 500, allRows.length)}/${allRows.length}`,
        )
    }

    console.log('Done!')
}

main().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
})
