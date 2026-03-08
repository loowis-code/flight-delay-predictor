import type {
    DataQuality,
    DelayStats,
    HistoricalStats,
    PredictionResult,
    RiskFactor,
    RiskLevel,
    RouteDelayStats,
} from '~/lib/types'
import { getTimeBucket } from './validation'

const WEIGHTS = {
    routeHistory: 0.4,
    airlinePunctuality: 0.25,
    timeOfDay: 0.15,
    dayOfWeek: 0.1,
    seasonalPattern: 0.1,
}

function riskLevelFromScore(score: number): RiskLevel {
    if (score < 25) return 'low'
    if (score < 50) return 'medium'
    if (score < 75) return 'high'
    return 'very-high'
}

function delayRateToRisk(delayRate: number): number {
    if (delayRate <= 0.1) return 10
    if (delayRate <= 0.2) return 25
    if (delayRate <= 0.35) return 50
    if (delayRate <= 0.5) return 70
    return 90
}

function avgDelayToRisk(avgDelay: number): number {
    if (avgDelay <= 5) return 10
    if (avgDelay <= 10) return 25
    if (avgDelay <= 20) return 50
    if (avgDelay <= 35) return 70
    return 90
}

function aggregateStats(rows: RouteDelayStats[]): {
    delayRate: number
    avgDelay: number
    p90Delay: number
    totalFlights: number
} {
    if (rows.length === 0) {
        return { delayRate: 0, avgDelay: 0, p90Delay: 0, totalFlights: 0 }
    }

    let totalFlights = 0
    let totalDelayed = 0
    let weightedAvgDelay = 0
    let weightedP90 = 0

    for (const row of rows) {
        totalFlights += row.totalFlights
        totalDelayed += row.delayedFlights
        weightedAvgDelay += row.avgDelayMinutes * row.totalFlights
        weightedP90 += row.p90DelayMinutes * row.totalFlights
    }

    return {
        delayRate: totalFlights > 0 ? totalDelayed / totalFlights : 0,
        avgDelay: totalFlights > 0 ? weightedAvgDelay / totalFlights : 0,
        p90Delay: totalFlights > 0 ? weightedP90 / totalFlights : 0,
        totalFlights,
    }
}

function computeRouteHistoryFactor(
    stats: RouteDelayStats[],
): RiskFactor | null {
    if (stats.length === 0) return null

    const agg = aggregateStats(stats)
    const score = Math.round(
        delayRateToRisk(agg.delayRate) * 0.6 +
            avgDelayToRisk(agg.avgDelay) * 0.4,
    )

    const pct = Math.round(agg.delayRate * 100)

    return {
        name: 'Route History',
        risk: riskLevelFromScore(score),
        detail: `${pct}% of flights on this route are delayed (avg ${Math.round(agg.avgDelay)} min)`,
        weight: WEIGHTS.routeHistory,
    }
}

function computeAirlineFactor(stats: RouteDelayStats[]): RiskFactor | null {
    if (stats.length === 0) return null

    const agg = aggregateStats(stats)
    const score = Math.round(
        delayRateToRisk(agg.delayRate) * 0.5 +
            avgDelayToRisk(agg.avgDelay) * 0.5,
    )

    const pct = Math.round(agg.delayRate * 100)

    return {
        name: 'Airline Punctuality',
        risk: riskLevelFromScore(score),
        detail: `This airline has a ${pct}% delay rate across all routes`,
        weight: WEIGHTS.airlinePunctuality,
    }
}

function computeTimeOfDayFactor(
    stats: RouteDelayStats[],
    scheduledHour: number,
): RiskFactor {
    const bucket = getTimeBucket(scheduledHour)

    const bucketStats = stats.filter((s) => s.timeBucket === bucket)

    if (bucketStats.length === 0) {
        const baseScore =
            bucket === 'morning'
                ? 15
                : bucket === 'afternoon'
                  ? 35
                  : bucket === 'evening'
                    ? 50
                    : 25

        return {
            name: 'Time of Day',
            risk: riskLevelFromScore(baseScore),
            detail: `${capitalize(bucket)} flights have ${riskLevelFromScore(baseScore)} delay risk historically`,
            weight: WEIGHTS.timeOfDay,
        }
    }

    const agg = aggregateStats(bucketStats)
    const score = Math.round(delayRateToRisk(agg.delayRate))

    return {
        name: 'Time of Day',
        risk: riskLevelFromScore(score),
        detail: `${capitalize(bucket)} flights are delayed ${Math.round(agg.delayRate * 100)}% of the time`,
        weight: WEIGHTS.timeOfDay,
    }
}

function computeDayOfWeekFactor(
    stats: RouteDelayStats[],
    dayOfWeek: number,
): RiskFactor {
    const dayNames = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ]
    const dayName = dayNames[dayOfWeek] ?? 'Unknown'

    const dayStats = stats.filter((s) => s.dayOfWeek === dayOfWeek)

    if (dayStats.length === 0) {
        const baseScore =
            dayOfWeek === 4 || dayOfWeek === 6 ? 40 : dayOfWeek === 0 ? 35 : 20

        return {
            name: 'Day of Week',
            risk: riskLevelFromScore(baseScore),
            detail: `${dayName} flights have ${riskLevelFromScore(baseScore)} delay risk`,
            weight: WEIGHTS.dayOfWeek,
        }
    }

    const agg = aggregateStats(dayStats)
    const score = Math.round(delayRateToRisk(agg.delayRate))

    return {
        name: 'Day of Week',
        risk: riskLevelFromScore(score),
        detail: `${dayName} flights are delayed ${Math.round(agg.delayRate * 100)}% of the time`,
        weight: WEIGHTS.dayOfWeek,
    }
}

function computeSeasonalFactor(
    stats: RouteDelayStats[],
    month: number,
): RiskFactor {
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ]
    const monthName = monthNames[month - 1] ?? 'Unknown'

    const monthStats = stats.filter((s) => s.month === month)

    if (monthStats.length === 0) {
        const peakMonths = [6, 7, 8, 12]
        const baseScore = peakMonths.includes(month) ? 45 : 20

        return {
            name: 'Seasonal Pattern',
            risk: riskLevelFromScore(baseScore),
            detail: `${monthName} is ${peakMonths.includes(month) ? 'a peak travel month' : 'typically a quieter month'}`,
            weight: WEIGHTS.seasonalPattern,
        }
    }

    const agg = aggregateStats(monthStats)
    const score = Math.round(delayRateToRisk(agg.delayRate))

    return {
        name: 'Seasonal Pattern',
        risk: riskLevelFromScore(score),
        detail: `${monthName} flights are delayed ${Math.round(agg.delayRate * 100)}% of the time`,
        weight: WEIGHTS.seasonalPattern,
    }
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function assessDataQuality(
    routeStats: RouteDelayStats[],
    airlineStats: RouteDelayStats[],
): DataQuality {
    const routeFlights = routeStats.reduce((sum, s) => sum + s.totalFlights, 0)
    const airlineFlights = airlineStats.reduce(
        (sum, s) => sum + s.totalFlights,
        0,
    )

    if (routeFlights >= 100 && airlineFlights >= 500) return 'good'
    if (routeFlights >= 20 || airlineFlights >= 100) return 'limited'
    return 'insufficient'
}

export function calculateRisk(
    historicalStats: HistoricalStats,
    flightDate: Date,
    scheduledHour: number,
): PredictionResult {
    const month = flightDate.getMonth() + 1
    const dayOfWeek = (flightDate.getDay() + 6) % 7 // Convert to Mon=0, Sun=6

    const allStats = [
        ...historicalStats.routeStats,
        ...historicalStats.airlineStats,
        ...historicalStats.originAirportStats,
        ...historicalStats.destinationAirportStats,
    ]

    const factors: RiskFactor[] = []

    const routeFactor = computeRouteHistoryFactor(historicalStats.routeStats)
    if (routeFactor) factors.push(routeFactor)

    const airlineFactor = computeAirlineFactor(historicalStats.airlineStats)
    if (airlineFactor) factors.push(airlineFactor)

    factors.push(computeTimeOfDayFactor(allStats, scheduledHour))
    factors.push(computeDayOfWeekFactor(allStats, dayOfWeek))
    factors.push(computeSeasonalFactor(allStats, month))

    // Calculate overall risk as weighted average
    let totalWeight = 0
    let weightedScore = 0

    for (const factor of factors) {
        const factorScore =
            factor.risk === 'low'
                ? 15
                : factor.risk === 'medium'
                  ? 37
                  : factor.risk === 'high'
                    ? 62
                    : 85

        weightedScore += factorScore * factor.weight
        totalWeight += factor.weight
    }

    const overallRisk =
        totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 50

    // Compute aggregate stats for the response
    const routeAgg = aggregateStats(historicalStats.routeStats)
    const airlineAgg = aggregateStats(historicalStats.airlineStats)

    const stats: DelayStats = {
        avgDelay:
            routeAgg.totalFlights > 0
                ? Math.round(routeAgg.avgDelay * 10) / 10
                : Math.round(airlineAgg.avgDelay * 10) / 10,
        delayRate:
            routeAgg.totalFlights > 0
                ? Math.round(routeAgg.delayRate * 1000) / 1000
                : Math.round(airlineAgg.delayRate * 1000) / 1000,
        p90Delay:
            routeAgg.totalFlights > 0
                ? Math.round(routeAgg.p90Delay * 10) / 10
                : Math.round(airlineAgg.p90Delay * 10) / 10,
        sampleSize: routeAgg.totalFlights + airlineAgg.totalFlights,
    }

    return {
        overallRisk,
        riskLevel: riskLevelFromScore(overallRisk),
        factors,
        dataQuality: assessDataQuality(
            historicalStats.routeStats,
            historicalStats.airlineStats,
        ),
        stats,
    }
}
