import type { PredictionPageData } from '~/lib/types'
import { calculateRisk } from '~/helpers/risk-calculator'
import { lookupFlight } from './flight-lookup'
import { getAirportInfo, getHistoricalStats } from './historical-stats'

export async function getPrediction(
    flightNumber: string,
    date: string,
): Promise<PredictionPageData> {
    const flight = await lookupFlight(flightNumber, date)

    if (!flight) {
        throw new Error(
            `Flight ${flightNumber} not found for date ${date}. Check the flight number and try again.`,
        )
    }

    const [historicalStats, originAirport, destinationAirport] =
        await Promise.all([
            getHistoricalStats(
                flight.airlineIcao,
                flight.originIcao,
                flight.destinationIcao,
            ),
            getAirportInfo(flight.originIcao),
            getAirportInfo(flight.destinationIcao),
        ])

    const flightDate = new Date(date)
    const scheduledHour = flight.scheduledDeparture
        ? new Date(flight.scheduledDeparture).getHours()
        : 12

    const prediction = calculateRisk(historicalStats, flightDate, scheduledHour)

    return {
        flight,
        prediction,
        originAirport,
        destinationAirport,
    }
}
