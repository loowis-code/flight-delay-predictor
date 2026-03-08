import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { validateFlightNumber, validateDate, getTimeBucket } from './validation'

describe('validateFlightNumber', () => {
    it('accepts valid 2-letter + number formats', () => {
        expect(validateFlightNumber('BA123')).toEqual({
            valid: true,
            normalized: 'BA123',
        })
        expect(validateFlightNumber('FR1234')).toEqual({
            valid: true,
            normalized: 'FR1234',
        })
        expect(validateFlightNumber('EW1')).toEqual({
            valid: true,
            normalized: 'EW1',
        })
    })

    it('accepts valid 3-letter + number formats', () => {
        expect(validateFlightNumber('BAW123')).toEqual({
            valid: true,
            normalized: 'BAW123',
        })
    })

    it('normalizes lowercase to uppercase', () => {
        expect(validateFlightNumber('ba123')).toEqual({
            valid: true,
            normalized: 'BA123',
        })
    })

    it('normalizes whitespace', () => {
        expect(validateFlightNumber('BA 123')).toEqual({
            valid: true,
            normalized: 'BA123',
        })
        expect(validateFlightNumber(' FR1234 ')).toEqual({
            valid: true,
            normalized: 'FR1234',
        })
    })

    it('rejects empty input', () => {
        const result = validateFlightNumber('')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Flight number is required')
    })

    it('rejects numbers only', () => {
        const result = validateFlightNumber('1234')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid')
    })

    it('rejects letters only', () => {
        const result = validateFlightNumber('ABCDE')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid')
    })

    it('rejects single letter prefix', () => {
        const result = validateFlightNumber('B123')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid')
    })

    it('rejects 5-digit flight numbers', () => {
        const result = validateFlightNumber('BA12345')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid')
    })

    it('rejects special characters', () => {
        const result = validateFlightNumber('BA-123')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid')
    })
})

describe('validateDate', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-06-15'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('accepts today', () => {
        const result = validateDate('2025-06-15')
        expect(result.valid).toBe(true)
        expect(result.date).toBe('2025-06-15')
    })

    it('accepts a date within 30 days', () => {
        const result = validateDate('2025-07-01')
        expect(result.valid).toBe(true)
        expect(result.date).toBe('2025-07-01')
    })

    it('rejects empty input', () => {
        const result = validateDate('')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Date is required')
    })

    it('rejects past dates', () => {
        const result = validateDate('2025-06-01')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('past')
    })

    it('rejects dates more than 30 days out', () => {
        const result = validateDate('2025-08-01')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('30 days')
    })

    it('rejects invalid date strings', () => {
        const result = validateDate('not-a-date')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Invalid date')
    })
})

describe('getTimeBucket', () => {
    it('returns morning for 5-11', () => {
        expect(getTimeBucket(5)).toBe('morning')
        expect(getTimeBucket(9)).toBe('morning')
        expect(getTimeBucket(11)).toBe('morning')
    })

    it('returns afternoon for 12-16', () => {
        expect(getTimeBucket(12)).toBe('afternoon')
        expect(getTimeBucket(14)).toBe('afternoon')
        expect(getTimeBucket(16)).toBe('afternoon')
    })

    it('returns evening for 17-21', () => {
        expect(getTimeBucket(17)).toBe('evening')
        expect(getTimeBucket(19)).toBe('evening')
        expect(getTimeBucket(21)).toBe('evening')
    })

    it('returns night for 22-4', () => {
        expect(getTimeBucket(22)).toBe('night')
        expect(getTimeBucket(0)).toBe('night')
        expect(getTimeBucket(3)).toBe('night')
        expect(getTimeBucket(4)).toBe('night')
    })
})
