import { Link } from '@tanstack/react-router'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <Link to="/">
                    <span className={styles.logo}>
                        Flight Delay Predictor
                        <span className={styles.logoAccent}>v1</span>
                    </span>
                </Link>
            </header>
            <main className={styles.main}>{children}</main>
            <footer className={styles.footer}>
                Predictions based on historical Eurocontrol data. Not a
                guarantee.
            </footer>
        </div>
    )
}
