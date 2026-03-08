import { getDb } from '~/lib/db'
import type { FlightInfo } from '~/lib/types'

interface AviationStackFlight {
    airline: {
        icao: string
        name: string
    }
    departure: {
        icao: string
        iata: string
        scheduled: string
    }
    arrival: {
        icao: string
        iata: string
        scheduled: string
    }
}

interface AviationStackResponse {
    data: AviationStackFlight[]
    error?: { code: string; message: string }
}

export async function lookupFlight(
    flightNumber: string,
    date: string,
): Promise<FlightInfo | null> {
    const db = getDb()

    // Check cache — route info is stable, so match on flight number only (any recent date)
    const { data: cached } = await db
        .from('flight_lookup_cache')
        .select('*')
        .eq('flight_number', flightNumber)
        .gt(
            'cached_at',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .limit(1)

    if (cached && cached.length > 0) {
        const row = cached[0]
        return {
            flightNumber,
            airlineIcao: row.airline_icao,
            airlineName: row.airline_name,
            originIcao: row.origin_icao,
            originIata: row.origin_iata,
            destinationIcao: row.destination_icao,
            destinationIata: row.destination_iata,
            scheduledDeparture: row.scheduled_departure,
            scheduledArrival: row.scheduled_arrival,
        }
    }

    // Call AviationStack API
    const apiKey = process.env.AVIATIONSTACK_API_KEY
    if (!apiKey) {
        throw new Error('Missing AVIATIONSTACK_API_KEY environment variable')
    }

    // Free tier doesn't support flight_date filter, so we fetch by flight number only
    const url = `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(apiKey)}&flight_iata=${encodeURIComponent(flightNumber)}`

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`AviationStack API error: ${response.status}`)
    }

    const data = (await response.json()) as AviationStackResponse

    if (data.error) {
        throw new Error(`AviationStack error: ${data.error.message}`)
    }

    if (!data.data || data.data.length === 0) {
        return null
    }

    // Use the first result — route info is the same regardless of date
    const flight = data.data[0]
    const flightInfo: FlightInfo = {
        flightNumber,
        airlineIcao: flight.airline.icao,
        airlineName: flight.airline.name,
        originIcao: flight.departure.icao,
        originIata: flight.departure.iata,
        destinationIcao: flight.arrival.icao,
        destinationIata: flight.arrival.iata,
        scheduledDeparture: flight.departure.scheduled,
        scheduledArrival: flight.arrival.scheduled,
    }

    // Cache the result (upsert)
    await db.from('flight_lookup_cache').upsert(
        {
            flight_number: flightNumber,
            lookup_date: date,
            airline_icao: flightInfo.airlineIcao,
            airline_name: flightInfo.airlineName,
            origin_icao: flightInfo.originIcao,
            origin_iata: flightInfo.originIata,
            destination_icao: flightInfo.destinationIcao,
            destination_iata: flightInfo.destinationIata,
            scheduled_departure: flightInfo.scheduledDeparture,
            scheduled_arrival: flightInfo.scheduledArrival,
            raw_response: data.data[0],
            cached_at: new Date().toISOString(),
        },
        { onConflict: 'flight_number,lookup_date' },
    )

    return flightInfo
}
