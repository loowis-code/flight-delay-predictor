import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import Layout from '~/components/Layout/Layout'
import RiskScore from '~/components/RiskScore/RiskScore'
import FactorBreakdown from '~/components/FactorBreakdown/FactorBreakdown'
import FlightDetails from '~/components/FlightDetails/FlightDetails'
import { getPrediction } from '~/lib/server/prediction'
import { validateFlightNumber, validateDate } from '~/helpers/validation'

const fetchPrediction = createServerFn({ method: 'GET' })
    .inputValidator((input: { flightNumber: string; date: string }) => {
        const flight = validateFlightNumber(input.flightNumber)
        if (!flight.valid) throw new Error(flight.error)
        const date = validateDate(input.date)
        if (!date.valid) throw new Error(date.error)
        return { flightNumber: flight.normalized, date: date.date }
    })
    .handler(async ({ data }) => {
        return getPrediction(data.flightNumber, data.date)
    })

export const Route = createFileRoute('/prediction/$flightNumber/$date')({
    loader: async ({ params }) => {
        return fetchPrediction({
            data: {
                flightNumber: params.flightNumber,
                date: params.date,
            },
        })
    },
    component: PredictionPage,
    errorComponent: PredictionError,
    head: ({ params }) => ({
        meta: [
            {
                title: `${params.flightNumber} — Delay Risk Prediction`,
            },
        ],
    }),
})

function PredictionPage() {
    const data = Route.useLoaderData()

    return (
        <Layout>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link
                    to="/"
                    style={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textDecoration: 'underline',
                    }}
                >
                    &larr; New search
                </Link>
            </div>

            <div
                style={{
                    display: 'grid',
                    gap: '2rem',
                    gridTemplateColumns: '1fr',
                    maxWidth: '720px',
                    margin: '0 auto',
                }}
            >
                <RiskScore
                    score={data.prediction.overallRisk}
                    riskLevel={data.prediction.riskLevel}
                    dataQuality={data.prediction.dataQuality}
                />

                <FlightDetails
                    flight={data.flight}
                    originAirport={data.originAirport}
                    destinationAirport={data.destinationAirport}
                    stats={data.prediction.stats}
                />

                <FactorBreakdown factors={data.prediction.factors} />
            </div>
        </Layout>
    )
}

function PredictionError({ error }: { error: Error }) {
    return (
        <Layout>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link
                    to="/"
                    style={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textDecoration: 'underline',
                    }}
                >
                    &larr; New search
                </Link>
            </div>

            <div
                style={{
                    background: 'var(--bg-card)',
                    border: '3px solid var(--border)',
                    boxShadow: '4px 4px 0px var(--shadow-color)',
                    padding: '2rem',
                    textAlign: 'center',
                    maxWidth: '480px',
                    margin: '2rem auto',
                }}
            >
                <h2 style={{ marginBottom: '0.75rem' }}>
                    Could not load prediction
                </h2>
                <p
                    style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '1.5rem',
                    }}
                >
                    {error.message ||
                        'An unexpected error occurred. Please try again.'}
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
                    Try Again
                </Link>
            </div>
        </Layout>
    )
}
