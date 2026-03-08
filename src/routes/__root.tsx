/// <reference types="vite/client" />
import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRoute,
} from '@tanstack/react-router'
import * as React from 'react'
import globalsCss from '~/styles/globals.css?url'

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                name: 'description',
                content:
                    'Predict flight delay risk for European flights based on historical data, airline performance, and route statistics.',
            },
            { title: 'Flight Delay Predictor' },
        ],
        links: [
            { rel: 'stylesheet', href: globalsCss },
            {
                rel: 'preconnect',
                href: 'https://fonts.googleapis.com',
            },
            {
                rel: 'preconnect',
                href: 'https://fonts.gstatic.com',
                crossOrigin: 'anonymous',
            },
        ],
    }),
    shellComponent: RootDocument,
    component: RootComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <Scripts />
            </body>
        </html>
    )
}

function RootComponent() {
    return <Outlet />
}
