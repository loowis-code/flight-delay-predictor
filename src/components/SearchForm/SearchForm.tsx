import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { validateDate, validateFlightNumber } from '~/helpers/validation'
import styles from './SearchForm.module.css'

export default function SearchForm() {
    const navigate = useNavigate()
    const [flightNumber, setFlightNumber] = useState('')
    const [date, setDate] = useState('')
    const [errors, setErrors] = useState<{
        flightNumber?: string
        date?: string
    }>({})

    const today = new Date().toISOString().split('T')[0]
    const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const flightResult = validateFlightNumber(flightNumber)
        const dateResult = validateDate(date)

        const newErrors: { flightNumber?: string; date?: string } = {}
        if (!flightResult.valid) newErrors.flightNumber = flightResult.error
        if (!dateResult.valid) newErrors.date = dateResult.error

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setErrors({})
        navigate({
            to: '/prediction/$flightNumber/$date',
            params: {
                flightNumber: flightResult.normalized,
                date: dateResult.date,
            },
        })
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="flight-number">
                    Flight Number
                </label>
                <input
                    id="flight-number"
                    className={`${styles.input} ${errors.flightNumber ? styles.inputError : ''}`}
                    type="text"
                    placeholder="e.g. BA123"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    autoComplete="off"
                    autoFocus
                />
                {errors.flightNumber && (
                    <span className={styles.error}>{errors.flightNumber}</span>
                )}
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="date">
                    Date
                </label>
                <input
                    id="date"
                    className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={today}
                    max={maxDate}
                />
                {errors.date && (
                    <span className={styles.error}>{errors.date}</span>
                )}
            </div>

            <button className={styles.button} type="submit">
                Predict Delay Risk
            </button>
        </form>
    )
}
