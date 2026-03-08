import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    retries: 1,
    workers: 1,
    use: {
        baseURL: 'http://localhost:3000',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
    webServer: {
        command: 'E2E_TEST_MODE=true npm run dev',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },
})
