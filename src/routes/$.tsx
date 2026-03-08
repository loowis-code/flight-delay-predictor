import { createFileRoute, Link } from '@tanstack/react-router'
import Layout from '~/components/Layout/Layout'

export const Route = createFileRoute('/$')({
    component: NotFound,
})

function NotFound() {
    return (
        <Layout>
            <div
                style={{
                    textAlign: 'center',
                    padding: '4rem 0',
                }}
            >
                <h1
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '4rem',
                        marginBottom: '0.5rem',
                    }}
                >
                    404
                </h1>
                <p
                    style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '2rem',
                    }}
                >
                    This page does not exist.
                </p>
                <Link
                    to="/"
                    style={{
                        display: 'inline-block',
                        background: 'var(--color-sky)',
                        border: '3px solid var(--border)',
                        boxShadow: '4px 4px 0px var(--shadow-color)',
                        padding: '0.75rem 1.5rem',
                        fontWeight: 700,
                    }}
                >
                    Go Home
                </Link>
            </div>
        </Layout>
    )
}
