const FLIGHT_NUMBER_REGEX = /^[A-Z]{2,3}\d{1,4}$/

export function validateFlightNumber(input: string): {
    valid: boolean
    normalized: string
    error?: string
} {
    const normalized = input.trim().toUpperCase().replace(/\s+/g, '')

    if (!normalized) {
        return { valid: false, normalized, error: 'Flight number is required' }
    }

    if (!FLIGHT_NUMBER_REGEX.test(normalized)) {
        return {
            valid: false,
            normalized,
            error: 'Invalid flight number format (e.g. BA123, FR1234)',
        }
    }

    return { valid: true, normalized }
}

export function validateDate(input: string): {
    valid: boolean
    date: string
    error?: string
} {
    if (!input) {
        return { valid: false, date: '', error: 'Date is required' }
    }

    const date = new Date(input)
    if (isNaN(date.getTime())) {
        return { valid: false, date: input, error: 'Invalid date' }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 30)

    if (date < today) {
        return {
            valid: false,
            date: input,
            error: 'Date cannot be in the past',
        }
    }

    if (date > maxDate) {
        return {
            valid: false,
            date: input,
            error: 'Date must be within the next 30 days',
        }
    }

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')

    return { valid: true, date: `${yyyy}-${mm}-${dd}` }
}

export function getTimeBucket(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
}
