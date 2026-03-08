import { test, expect } from '@playwright/test'

test.describe('Flight Delay Predictor', () => {
    test('homepage loads with search form', async ({ page }) => {
        await page.goto('/')
        await expect(
            page.getByText('Will your flight be delayed?'),
        ).toBeVisible()
        await expect(page.getByLabel('Flight Number')).toBeVisible()
        await expect(page.getByLabel('Date')).toBeVisible()
        await expect(
            page.getByRole('button', { name: /predict/i }),
        ).toBeVisible()
    })

    test('validates empty flight number', async ({ page }) => {
        await page.goto('/')
        await page.getByRole('button', { name: /predict/i }).click()
        await expect(page.getByText('Flight number is required')).toBeVisible()
    })

    test('validates invalid flight number format', async ({ page }) => {
        await page.goto('/')
        await page.getByLabel('Flight Number').fill('INVALID')
        await page.getByRole('button', { name: /predict/i }).click()
        await expect(
            page.getByText(/invalid flight number format/i),
        ).toBeVisible()
    })

    test('validates empty date', async ({ page }) => {
        await page.goto('/')
        await page.getByLabel('Flight Number').fill('BA123')
        await page.getByRole('button', { name: /predict/i }).click()
        await expect(page.getByText('Date is required')).toBeVisible()
    })

    test('navigates to prediction page on valid input', async ({ page }) => {
        await page.goto('/')
        await page.getByLabel('Flight Number').fill('BA123')

        const tomorrow = new Date(Date.now() + 86400000)
            .toISOString()
            .split('T')[0]
        await page.getByLabel('Date').fill(tomorrow)
        await page.getByRole('button', { name: /predict/i }).click()

        await expect(page).toHaveURL(/\/prediction\/BA123\//)
    })

    test('404 page renders for unknown routes', async ({ page }) => {
        await page.goto('/some-nonexistent-route')
        await expect(page.getByText('404')).toBeVisible()
        await expect(page.getByRole('link', { name: /go home/i })).toBeVisible()
    })
})
