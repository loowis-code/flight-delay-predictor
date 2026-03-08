import { createFileRoute } from '@tanstack/react-router'
import Layout from '~/components/Layout/Layout'
import SearchForm from '~/components/SearchForm/SearchForm'

export const Route = createFileRoute('/')({
    component: HomePage,
    head: () => ({
        meta: [{ title: 'Flight Delay Predictor — Check Your Flight Risk' }],
    }),
})

function HomePage() {
    return (
        <Layout>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    Will your flight be delayed?
                </h1>
                <p
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1.125rem',
                        maxWidth: '500px',
                        margin: '0 auto',
                    }}
                >
                    Enter a European flight number and date to get a delay risk
                    prediction based on historical data.
                </p>
            </div>
            <SearchForm />
        </Layout>
    )
}
