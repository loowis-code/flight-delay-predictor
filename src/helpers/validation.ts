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

const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/

export function validateDate(input: string): {
    valid: boolean
    date: string
    error?: string
} {
    if (!input) {
        return { valid: false, date: '', error: 'Date is required' }
    }

    const match = DATE_REGEX.exec(input.trim())
    if (!match) {
        return { valid: false, date: input, error: 'Invalid date' }
    }

    const [, yyyy, mm, dd] = match
    const year = parseInt(yyyy)
    const month = parseInt(mm)
    const day = parseInt(dd)

    // Validate ranges
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return { valid: false, date: input, error: 'Invalid date' }
    }

    // Use UTC to avoid timezone shifts
    const date = new Date(Date.UTC(year, month - 1, day))
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return { valid: false, date: input, error: 'Invalid date' }
    }

    const now = new Date()
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    const maxUtc = todayUtc + 30 * 24 * 60 * 60 * 1000

    if (date.getTime() < todayUtc) {
        return {
            valid: false,
            date: input,
            error: 'Date cannot be in the past',
        }
    }

    if (date.getTime() > maxUtc) {
        return {
            valid: false,
            date: input,
            error: 'Date must be within the next 30 days',
        }
    }

    return { valid: true, date: `${yyyy}-${mm}-${dd}` }
}

export function getTimeBucket(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
}
