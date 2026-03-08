import { describe, expect, it } from 'vitest'
import { calculateRisk } from './risk-calculator'
import type { HistoricalStats, RouteDelayStats } from '~/lib/types'

function makeStats(overrides: Partial<RouteDelayStats> = {}): RouteDelayStats {
    return {
        airlineIcao: 'BAW',
        originIcao: 'EGLL',
        destinationIcao: 'LEMD',
        month: 6,
        dayOfWeek: 2,
        timeBucket: 'morning',
        totalFlights: 200,
        delayedFlights: 40,
        avgDelayMinutes: 12,
        p50DelayMinutes: 8,
        p90DelayMinutes: 30,
        cancelledFlights: 2,
        dataYear: 2024,
        ...overrides,
    }
}

function makeHistoricalStats(
    overrides: Partial<HistoricalStats> = {},
): HistoricalStats {
    return {
        routeStats: [],
        airlineStats: [],
        originAirportStats: [],
        destinationAirportStats: [],
        ...overrides,
    }
}

describe('calculateRisk', () => {
    it('returns a result with all required fields', () => {
        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [makeStats()],
                airlineStats: [makeStats()],
            }),
            new Date('2025-06-18'),
            10,
        )

        expect(result).toHaveProperty('overallRisk')
        expect(result).toHaveProperty('riskLevel')
        expect(result).toHaveProperty('factors')
        expect(result).toHaveProperty('dataQuality')
        expect(result).toHaveProperty('stats')
        expect(result.overallRisk).toBeGreaterThanOrEqual(0)
        expect(result.overallRisk).toBeLessThanOrEqual(100)
        expect(['low', 'medium', 'high', 'very-high']).toContain(
            result.riskLevel,
        )
    })

    it('returns low risk for a route with very few delays', () => {
        const stats = makeStats({
            totalFlights: 500,
            delayedFlights: 25,
            avgDelayMinutes: 3,
            p50DelayMinutes: 0,
            p90DelayMinutes: 8,
        })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [stats],
                airlineStats: [stats],
            }),
            new Date('2025-03-12'),
            9,
        )

        expect(result.overallRisk).toBeLessThan(30)
        expect(result.riskLevel).toBe('low')
    })

    it('returns high risk for a route with frequent delays', () => {
        const stats = makeStats({
            totalFlights: 300,
            delayedFlights: 180,
            avgDelayMinutes: 35,
            p50DelayMinutes: 25,
            p90DelayMinutes: 60,
        })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [stats],
                airlineStats: [stats],
            }),
            new Date('2025-07-15'),
            18,
        )

        expect(result.overallRisk).toBeGreaterThan(50)
        expect(['high', 'very-high']).toContain(result.riskLevel)
    })

    it('returns medium risk for a route with moderate delays', () => {
        const stats = makeStats({
            totalFlights: 400,
            delayedFlights: 100,
            avgDelayMinutes: 15,
            p50DelayMinutes: 10,
            p90DelayMinutes: 35,
        })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [stats],
                airlineStats: [stats],
            }),
            new Date('2025-05-10'),
            14,
        )

        expect(result.overallRisk).toBeGreaterThanOrEqual(25)
        expect(result.overallRisk).toBeLessThan(75)
    })

    it('includes at least 3 contributing factors', () => {
        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [makeStats()],
                airlineStats: [makeStats()],
            }),
            new Date('2025-06-18'),
            10,
        )

        expect(result.factors.length).toBeGreaterThanOrEqual(3)
    })

    it('always includes time of day, day of week, and seasonal factors', () => {
        const result = calculateRisk(
            makeHistoricalStats(),
            new Date('2025-06-18'),
            10,
        )

        const names = result.factors.map((f) => f.name)
        expect(names).toContain('Time of Day')
        expect(names).toContain('Day of Week')
        expect(names).toContain('Seasonal Pattern')
    })

    it('omits route history factor when no route data exists', () => {
        const result = calculateRisk(
            makeHistoricalStats(),
            new Date('2025-06-18'),
            10,
        )

        const names = result.factors.map((f) => f.name)
        expect(names).not.toContain('Route History')
    })

    it('omits airline factor when no airline data exists', () => {
        const result = calculateRisk(
            makeHistoricalStats(),
            new Date('2025-06-18'),
            10,
        )

        const names = result.factors.map((f) => f.name)
        expect(names).not.toContain('Airline Punctuality')
    })

    it('includes route history when route data is present', () => {
        const result = calculateRisk(
            makeHistoricalStats({ routeStats: [makeStats()] }),
            new Date('2025-06-18'),
            10,
        )

        const names = result.factors.map((f) => f.name)
        expect(names).toContain('Route History')
    })

    it('includes airline factor when airline data is present', () => {
        const result = calculateRisk(
            makeHistoricalStats({ airlineStats: [makeStats()] }),
            new Date('2025-06-18'),
            10,
        )

        const names = result.factors.map((f) => f.name)
        expect(names).toContain('Airline Punctuality')
    })

    it('returns good data quality with sufficient data', () => {
        const routeStats = makeStats({ totalFlights: 150 })
        const airlineStats = makeStats({ totalFlights: 600 })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [routeStats],
                airlineStats: [airlineStats],
            }),
            new Date('2025-06-18'),
            10,
        )

        expect(result.dataQuality).toBe('good')
    })

    it('returns limited data quality with moderate data', () => {
        const routeStats = makeStats({ totalFlights: 50 })
        const airlineStats = makeStats({ totalFlights: 80 })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [routeStats],
                airlineStats: [airlineStats],
            }),
            new Date('2025-06-18'),
            10,
        )

        expect(result.dataQuality).toBe('limited')
    })

    it('returns insufficient data quality with very little data', () => {
        const routeStats = makeStats({ totalFlights: 5 })
        const airlineStats = makeStats({ totalFlights: 10 })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [routeStats],
                airlineStats: [airlineStats],
            }),
            new Date('2025-06-18'),
            10,
        )

        expect(result.dataQuality).toBe('insufficient')
    })

    it('handles empty historical stats gracefully', () => {
        const result = calculateRisk(
            makeHistoricalStats(),
            new Date('2025-06-18'),
            10,
        )

        expect(result.overallRisk).toBeGreaterThanOrEqual(0)
        expect(result.overallRisk).toBeLessThanOrEqual(100)
        expect(result.factors.length).toBeGreaterThanOrEqual(3)
        expect(result.dataQuality).toBe('insufficient')
    })

    it('uses evening time bucket for evening flights', () => {
        const stats = makeStats({ timeBucket: 'evening' })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [stats],
                airlineStats: [stats],
            }),
            new Date('2025-06-18'),
            19,
        )

        const timeFactor = result.factors.find((f) => f.name === 'Time of Day')
        expect(timeFactor).toBeDefined()
        expect(timeFactor!.detail.toLowerCase()).toContain('evening')
    })

    it('uses morning time bucket for morning flights', () => {
        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [makeStats({ timeBucket: 'morning' })],
            }),
            new Date('2025-06-18'),
            8,
        )

        const timeFactor = result.factors.find((f) => f.name === 'Time of Day')
        expect(timeFactor).toBeDefined()
        expect(timeFactor!.detail.toLowerCase()).toContain('morning')
    })

    it('handles Friday as higher risk day', () => {
        // 2025-06-20 is a Friday
        const result = calculateRisk(
            makeHistoricalStats(),
            new Date('2025-06-20'),
            10,
        )

        const dayFactor = result.factors.find((f) => f.name === 'Day of Week')
        expect(dayFactor).toBeDefined()
        expect(dayFactor!.detail).toContain('Friday')
    })

    it('handles summer month as peak travel season', () => {
        const result = calculateRisk(
            makeHistoricalStats(),
            new Date('2025-07-15'),
            10,
        )

        const seasonFactor = result.factors.find(
            (f) => f.name === 'Seasonal Pattern',
        )
        expect(seasonFactor).toBeDefined()
        expect(seasonFactor!.detail).toContain('July')
        expect(seasonFactor!.detail).toContain('peak')
    })

    it('handles quiet month (e.g. March)', () => {
        const result = calculateRisk(
            makeHistoricalStats(),
            new Date('2025-03-12'),
            10,
        )

        const seasonFactor = result.factors.find(
            (f) => f.name === 'Seasonal Pattern',
        )
        expect(seasonFactor).toBeDefined()
        expect(seasonFactor!.detail).toContain('March')
        expect(seasonFactor!.detail).toContain('quieter')
    })

    it('populates stats with route data when available', () => {
        const stats = makeStats({
            totalFlights: 300,
            delayedFlights: 60,
            avgDelayMinutes: 10.5,
            p90DelayMinutes: 28,
        })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [stats],
                airlineStats: [makeStats({ totalFlights: 1000 })],
            }),
            new Date('2025-06-18'),
            10,
        )

        expect(result.stats.avgDelay).toBe(10.5)
        expect(result.stats.delayRate).toBe(0.2)
        expect(result.stats.p90Delay).toBe(28)
        expect(result.stats.sampleSize).toBe(1300)
    })

    it('falls back to airline stats when no route data', () => {
        const airlineStats = makeStats({
            totalFlights: 500,
            delayedFlights: 100,
            avgDelayMinutes: 8,
            p90DelayMinutes: 22,
        })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [],
                airlineStats: [airlineStats],
            }),
            new Date('2025-06-18'),
            10,
        )

        expect(result.stats.avgDelay).toBe(8)
        expect(result.stats.delayRate).toBe(0.2)
    })

    it('handles multiple route stat rows (aggregation)', () => {
        const row1 = makeStats({
            totalFlights: 100,
            delayedFlights: 10,
            avgDelayMinutes: 5,
            p90DelayMinutes: 15,
            month: 1,
        })
        const row2 = makeStats({
            totalFlights: 100,
            delayedFlights: 30,
            avgDelayMinutes: 20,
            p90DelayMinutes: 45,
            month: 7,
        })

        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [row1, row2],
                airlineStats: [row1, row2],
            }),
            new Date('2025-04-10'),
            10,
        )

        // Aggregated delay rate: 40/200 = 0.2
        expect(result.stats.delayRate).toBe(0.2)
        // Weighted avg: (5*100 + 20*100)/200 = 12.5
        expect(result.stats.avgDelay).toBe(12.5)
    })

    it('each factor has a valid weight', () => {
        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [makeStats()],
                airlineStats: [makeStats()],
            }),
            new Date('2025-06-18'),
            10,
        )

        for (const factor of result.factors) {
            expect(factor.weight).toBeGreaterThan(0)
            expect(factor.weight).toBeLessThanOrEqual(1)
        }
    })

    it('each factor has a non-empty detail string', () => {
        const result = calculateRisk(
            makeHistoricalStats({
                routeStats: [makeStats()],
                airlineStats: [makeStats()],
            }),
            new Date('2025-06-18'),
            10,
        )

        for (const factor of result.factors) {
            expect(factor.detail.length).toBeGreaterThan(0)
        }
    })
})
