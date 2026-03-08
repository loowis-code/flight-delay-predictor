import type { DataQuality, RiskLevel } from '~/lib/types'
import styles from './RiskScore.module.css'

interface RiskScoreProps {
    score: number
    riskLevel: RiskLevel
    dataQuality: DataQuality
}

const riskColors: Record<RiskLevel, string> = {
    low: 'var(--color-mint)',
    medium: 'var(--color-peach)',
    high: 'var(--color-rose)',
    'very-high': 'var(--color-lavender)',
}

const riskLabels: Record<RiskLevel, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    'very-high': 'Very High Risk',
}

const badgeStyles: Record<RiskLevel, string> = {
    low: styles.badgeLow,
    medium: styles.badgeMedium,
    high: styles.badgeHigh,
    'very-high': styles.badgeVeryHigh,
}

const qualityLabels: Record<DataQuality, string> = {
    good: 'Good data coverage',
    limited: 'Limited data available',
    insufficient: 'Insufficient data — prediction may be unreliable',
}

const qualityStyles: Record<DataQuality, string> = {
    good: styles.qualityGood,
    limited: styles.qualityLimited,
    insufficient: styles.qualityInsufficient,
}

export default function RiskScore({
    score,
    riskLevel,
    dataQuality,
}: RiskScoreProps) {
    return (
        <div className={styles.container}>
            <div
                className={styles.riskCircle}
                style={{ background: riskColors[riskLevel] }}
            >
                <span className={styles.score}>{score}</span>
                <span className={styles.outOf}>/ 100</span>
            </div>
            <span className={`${styles.badge} ${badgeStyles[riskLevel]}`}>
                {riskLabels[riskLevel]}
            </span>
            <span className={styles.explainer}>
                Composite risk index based on historical patterns — not a delay
                probability
            </span>
            <span
                className={`${styles.dataQuality} ${qualityStyles[dataQuality]}`}
            >
                {qualityLabels[dataQuality]}
            </span>
        </div>
    )
}
