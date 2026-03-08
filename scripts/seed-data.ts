/**
 * Seed sample airport and route delay data for local development.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variable',
    )
    process.exit(1)
}

const db = createClient(supabaseUrl, supabaseKey)

const airports = [
    {
        icao: 'EGLL',
        iata: 'LHR',
        name: 'Heathrow Airport',
        city: 'London',
        country: 'United Kingdom',
        latitude: 51.4706,
        longitude: -0.4619,
        timezone: 'Europe/London',
    },
    {
        icao: 'LFPG',
        iata: 'CDG',
        name: 'Charles de Gaulle Airport',
        city: 'Paris',
        country: 'France',
        latitude: 49.0097,
        longitude: 2.5479,
        timezone: 'Europe/Paris',
    },
    {
        icao: 'EDDF',
        iata: 'FRA',
        name: 'Frankfurt Airport',
        city: 'Frankfurt',
        country: 'Germany',
        latitude: 50.0379,
        longitude: 8.5622,
        timezone: 'Europe/Berlin',
    },
    {
        icao: 'LEMD',
        iata: 'MAD',
        name: 'Adolfo Suárez Madrid–Barajas Airport',
        city: 'Madrid',
        country: 'Spain',
        latitude: 40.4983,
        longitude: -3.5676,
        timezone: 'Europe/Madrid',
    },
    {
        icao: 'EHAM',
        iata: 'AMS',
        name: 'Amsterdam Airport Schiphol',
        city: 'Amsterdam',
        country: 'Netherlands',
        latitude: 52.3105,
        longitude: 4.7683,
        timezone: 'Europe/Amsterdam',
    },
    {
        icao: 'LIRF',
        iata: 'FCO',
        name: 'Leonardo da Vinci–Fiumicino Airport',
        city: 'Rome',
        country: 'Italy',
        latitude: 41.8003,
        longitude: 12.2389,
        timezone: 'Europe/Rome',
    },
    {
        icao: 'EIDW',
        iata: 'DUB',
        name: 'Dublin Airport',
        city: 'Dublin',
        country: 'Ireland',
        latitude: 53.4213,
        longitude: -6.2701,
        timezone: 'Europe/Dublin',
    },
    {
        icao: 'EGPH',
        iata: 'EDI',
        name: 'Edinburgh Airport',
        city: 'Edinburgh',
        country: 'United Kingdom',
        latitude: 55.95,
        longitude: -3.3725,
        timezone: 'Europe/London',
    },
    {
        icao: 'LPPT',
        iata: 'LIS',
        name: 'Humberto Delgado Airport',
        city: 'Lisbon',
        country: 'Portugal',
        latitude: 38.7813,
        longitude: -9.1359,
        timezone: 'Europe/Lisbon',
    },
    {
        icao: 'EGKK',
        iata: 'LGW',
        name: 'Gatwick Airport',
        city: 'London',
        country: 'United Kingdom',
        latitude: 51.1537,
        longitude: -0.1821,
        timezone: 'Europe/London',
    },
]

// Sample route delay stats for common European routes
// Covers various airlines, months, days, time buckets to give the calculator data to work with
const routeStats = [
    // BA: London Heathrow → Madrid (moderate delays)
    ...generateRouteStats('BAW', 'EGLL', 'LEMD', 0.22, 14, 8, 32),
    // BA: London Heathrow → Paris CDG (low delays)
    ...generateRouteStats('BAW', 'EGLL', 'LFPG', 0.12, 7, 4, 18),
    // FR: Dublin → Edinburgh (Ryanair, higher delays)
    ...generateRouteStats('RYR', 'EIDW', 'EGPH', 0.35, 22, 15, 48),
    // FR: Dublin → London Gatwick
    ...generateRouteStats('RYR', 'EIDW', 'EGKK', 0.28, 18, 11, 40),
    // LH: Frankfurt → Amsterdam (low delays)
    ...generateRouteStats('DLH', 'EDDF', 'EHAM', 0.15, 9, 5, 22),
    // LH: Frankfurt → Rome
    ...generateRouteStats('DLH', 'EDDF', 'LIRF', 0.2, 12, 7, 28),
    // IB: Madrid → Lisbon (moderate)
    ...generateRouteStats('IBE', 'LEMD', 'LPPT', 0.25, 16, 10, 35),
    // KL: Amsterdam → London Heathrow
    ...generateRouteStats('KLM', 'EHAM', 'EGLL', 0.18, 11, 6, 25),
    // AZ: Rome → Paris CDG (higher delays)
    ...generateRouteStats('ITY', 'LIRF', 'LFPG', 0.32, 20, 13, 42),
    // TP: Lisbon → Paris CDG
    ...generateRouteStats('TAP', 'LPPT', 'LFPG', 0.24, 15, 9, 34),
]

function generateRouteStats(
    airlineIcao: string,
    originIcao: string,
    destinationIcao: string,
    baseDelayRate: number,
    baseAvgDelay: number,
    baseP50: number,
    baseP90: number,
) {
    const rows = []
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
        0: 1.1, // Monday
        1: 0.9,
        2: 0.85,
        3: 0.95,
        4: 1.15, // Friday
        5: 1.0,
        6: 1.1, // Sunday
    }

    // Generate a subset — 3 months, all days, 2 time buckets
    for (const month of [3, 6, 12]) {
        for (let day = 0; day < 7; day++) {
            for (let ti = 0; ti < 2; ti++) {
                const mMul = monthMultipliers[month] ?? 1
                const dMul = dayMultipliers[day] ?? 1
                const tMul = timeBucketMultipliers[ti]

                const delayRate = Math.min(
                    baseDelayRate * mMul * dMul * tMul,
                    0.95,
                )
                const totalFlights = 30 + Math.floor(Math.random() * 40)
                const delayedFlights = Math.round(totalFlights * delayRate)

                rows.push({
                    airline_icao: airlineIcao,
                    origin_icao: originIcao,
                    destination_icao: destinationIcao,
                    month,
                    day_of_week: day,
                    time_bucket: timeBuckets[ti],
                    total_flights: totalFlights,
                    delayed_flights: delayedFlights,
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
    console.log('Seeding airports...')
    const { error: airportError } = await db
        .from('airports')
        .upsert(airports, { onConflict: 'icao' })
    if (airportError) throw airportError
    console.log(`  Inserted ${airports.length} airports`)

    console.log('Seeding route delay stats...')
    // Batch in chunks of 500
    for (let i = 0; i < routeStats.length; i += 500) {
        const chunk = routeStats.slice(i, i + 500)
        const { error } = await db.from('route_delay_stats').upsert(chunk, {
            onConflict:
                'airline_icao,origin_icao,destination_icao,month,day_of_week,time_bucket,data_year',
        })
        if (error) throw error
    }
    console.log(`  Inserted ${routeStats.length} route delay stat rows`)

    console.log('Done!')
}

main().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
})
