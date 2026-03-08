import type { RiskFactor, RiskLevel } from '~/lib/types'
import styles from './FactorBreakdown.module.css'

interface FactorBreakdownProps {
    factors: RiskFactor[]
}

const badgeStyles: Record<RiskLevel, string> = {
    low: styles.badgeLow,
    medium: styles.badgeMedium,
    high: styles.badgeHigh,
    'very-high': styles.badgeVeryHigh,
}

export default function FactorBreakdown({ factors }: FactorBreakdownProps) {
    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>Contributing Factors</h2>
            {factors.map((factor) => (
                <div key={factor.name} className={styles.factor}>
                    <span className={styles.factorName}>{factor.name}</span>
                    <span className={styles.factorDetail}>{factor.detail}</span>
                    <span
                        className={`${styles.badge} ${badgeStyles[factor.risk]}`}
                    >
                        {factor.risk}
                    </span>
                </div>
            ))}
        </div>
    )
}
