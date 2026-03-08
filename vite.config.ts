import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
    define: {
        __E2E_TEST_MODE__: JSON.stringify(process.env.E2E_TEST_MODE === 'true'),
    },
    server: {
        port: 3000,
    },
    plugins: [
        cloudflare({ viteEnvironment: { name: 'ssr' } }),
        tsConfigPaths({ projects: ['./tsconfig.json'] }),
        tanstackStart(),
        viteReact(),
    ],
})
