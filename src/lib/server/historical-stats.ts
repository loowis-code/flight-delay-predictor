import { getDb } from '~/lib/db'
import type { AirportInfo, HistoricalStats, RouteDelayStats } from '~/lib/types'

function mapRow(row: Record<string, unknown>): RouteDelayStats {
    return {
        airlineIcao: row.airline_icao as string,
        originIcao: row.origin_icao as string,
        destinationIcao: row.destination_icao as string,
        month: row.month as number,
        dayOfWeek: row.day_of_week as number,
        timeBucket: row.time_bucket as string,
        totalFlights: row.total_flights as number,
        delayedFlights: row.delayed_flights as number,
        avgDelayMinutes: Number(row.avg_delay_minutes),
        p50DelayMinutes: Number(row.p50_delay_minutes),
        p90DelayMinutes: Number(row.p90_delay_minutes),
        cancelledFlights: (row.cancelled_flights as number) ?? 0,
        dataYear: row.data_year as number,
    }
}

export async function getHistoricalStats(
    airlineIcao: string,
    originIcao: string,
    destinationIcao: string,
): Promise<HistoricalStats> {
    const db = getDb()

    const [routeRes, airlineRes, originRes, destRes] = await Promise.all([
        db
            .from('route_delay_stats')
            .select('*')
            .eq('airline_icao', airlineIcao)
            .eq('origin_icao', originIcao)
            .eq('destination_icao', destinationIcao),
        db
            .from('route_delay_stats')
            .select('*')
            .eq('airline_icao', airlineIcao),
        db.from('route_delay_stats').select('*').eq('origin_icao', originIcao),
        db
            .from('route_delay_stats')
            .select('*')
            .eq('destination_icao', destinationIcao),
    ])

    return {
        routeStats: (routeRes.data ?? []).map(mapRow),
        airlineStats: (airlineRes.data ?? []).map(mapRow),
        originAirportStats: (originRes.data ?? []).map(mapRow),
        destinationAirportStats: (destRes.data ?? []).map(mapRow),
    }
}

export async function getAirportInfo(
    icao: string,
): Promise<AirportInfo | null> {
    const db = getDb()

    const { data } = await db
        .from('airports')
        .select('*')
        .eq('icao', icao)
        .single()

    if (!data) return null

    return {
        icao: data.icao,
        iata: data.iata,
        name: data.name,
        city: data.city,
        country: data.country,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        timezone: data.timezone,
    }
}
