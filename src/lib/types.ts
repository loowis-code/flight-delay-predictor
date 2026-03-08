export type RiskLevel = 'low' | 'medium' | 'high' | 'very-high'

export type DataQuality = 'good' | 'limited' | 'insufficient'

export interface RiskFactor {
    name: string
    risk: RiskLevel
    detail: string
    weight: number
}

export interface DelayStats {
    avgDelay: number
    delayRate: number
    p90Delay: number
    sampleSize: number
}

export interface PredictionResult {
    overallRisk: number
    riskLevel: RiskLevel
    factors: RiskFactor[]
    dataQuality: DataQuality
    stats: DelayStats
}

export interface FlightInfo {
    flightNumber: string
    airlineIcao: string
    airlineName: string
    originIcao: string
    originIata: string
    destinationIcao: string
    destinationIata: string
    scheduledDeparture: string
    scheduledArrival: string
}

export interface AirportInfo {
    icao: string
    iata: string
    name: string
    city: string
    country: string
    latitude: number
    longitude: number
    timezone: string
}

export interface RouteDelayStats {
    airlineIcao: string
    originIcao: string
    destinationIcao: string
    month: number
    dayOfWeek: number
    timeBucket: string
    totalFlights: number
    delayedFlights: number
    avgDelayMinutes: number
    p50DelayMinutes: number
    p90DelayMinutes: number
    cancelledFlights: number
    dataYear: number
}

export interface HistoricalStats {
    routeStats: RouteDelayStats[]
    airlineStats: RouteDelayStats[]
    originAirportStats: RouteDelayStats[]
    destinationAirportStats: RouteDelayStats[]
}

export interface PredictionPageData {
    flight: FlightInfo
    prediction: PredictionResult
    originAirport: AirportInfo | null
    destinationAirport: AirportInfo | null
}
