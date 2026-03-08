import type { AirportInfo, DelayStats, FlightInfo } from '~/lib/types'
import styles from './FlightDetails.module.css'

interface FlightDetailsProps {
    flight: FlightInfo
    originAirport: AirportInfo | null
    destinationAirport: AirportInfo | null
    stats: DelayStats
}

function formatTime(dateStr: string): string {
    try {
        const d = new Date(dateStr)
        return d.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return '--:--'
    }
}

export default function FlightDetails({
    flight,
    originAirport,
    destinationAirport,
    stats,
}: FlightDetailsProps) {
    return (
        <div className={styles.card}>
            <h2 className={styles.heading}>Flight Details</h2>

            <div className={styles.route}>
                <div className={styles.airport}>
                    <div className={styles.iata}>
                        {flight.originIata || flight.originIcao}
                    </div>
                    <div className={styles.airportName}>
                        {originAirport?.city ?? originAirport?.name ?? ''}
                    </div>
                </div>
                <span className={styles.arrow}>&rarr;</span>
                <div className={styles.airport}>
                    <div className={styles.iata}>
                        {flight.destinationIata || flight.destinationIcao}
                    </div>
                    <div className={styles.airportName}>
                        {destinationAirport?.city ??
                            destinationAirport?.name ??
                            ''}
                    </div>
                </div>
            </div>

            <div className={styles.details}>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Airline</span>
                    <span className={styles.detailValue}>
                        {flight.airlineName}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Flight</span>
                    <span className={styles.detailValue}>
                        {flight.flightNumber}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Departure</span>
                    <span className={styles.detailValue}>
                        {flight.scheduledDeparture
                            ? formatTime(flight.scheduledDeparture)
                            : '--:--'}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Arrival</span>
                    <span className={styles.detailValue}>
                        {flight.scheduledArrival
                            ? formatTime(flight.scheduledArrival)
                            : '--:--'}
                    </span>
                </div>
            </div>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <div className={styles.statValue}>
                        {Math.round(stats.delayRate * 100)}%
                    </div>
                    <div className={styles.statLabel}>Delay Rate</div>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statValue}>{stats.avgDelay}m</div>
                    <div className={styles.statLabel}>Avg Delay</div>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statValue}>{stats.p90Delay}m</div>
                    <div className={styles.statLabel}>P90 Delay</div>
                </div>
                <div className={styles.stat}>
                    <div className={styles.statValue}>
                        {stats.sampleSize.toLocaleString()}
                    </div>
                    <div className={styles.statLabel}>Sample Size</div>
                </div>
            </div>
        </div>
    )
}
