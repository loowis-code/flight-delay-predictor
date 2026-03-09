# Flight Delay Predictor

Predicts flight delay risk for European flights. Enter a flight number and date, get a composite risk score with a breakdown of contributing factors.

**Live:** https://flight-delay-predictor.loowis.co.uk

## Stack

- **Framework:** TanStack Start (file-based routing)
- **Runtime:** Cloudflare Workers
- **Database:** Supabase (PostgreSQL)
- **Flight Data:** AviationStack API (free tier, 100 req/month)
- **Styling:** CSS Modules, neobrutalist design
- **Testing:** Vitest (unit), Playwright (E2E)

## How It Works

1. User enters a flight number (e.g. BA463) and a date
2. Flight number is resolved to airline + route via AviationStack (cached for 7 days)
3. Historical delay stats are fetched from Supabase (aggregated Eurocontrol data)
4. A composite risk score (0-100) is calculated from weighted factors:
    - Route history (40%)
    - Airline punctuality (25%)
    - Time of day (15%)
    - Day of week (10%)
    - Seasonal pattern (10%)
5. Results page shows the risk score, factor breakdown, and flight details

## Setup

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .dev.vars.example .dev.vars

# Run database migration (in Supabase SQL editor)
# → scripts/migrations/001-initial-schema.sql

# Seed sample data
source .dev.vars && npx tsx scripts/seed-data.ts
source .dev.vars && npx tsx scripts/seed-reverse-routes.ts

# Start dev server
npm run dev
```

### Environment Variables

| Variable                | Description                       |
| ----------------------- | --------------------------------- |
| `SUPABASE_URL`          | Supabase project URL              |
| `SUPABASE_SERVICE_KEY`  | Supabase service role key         |
| `AVIATIONSTACK_API_KEY` | AviationStack API key (free tier) |

## Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start dev server on port 3000            |
| `npm run build`      | Build for production (Vite + TypeScript) |
| `npm run deploy`     | Build and deploy to Cloudflare Workers   |
| `npm run lint`       | Run ESLint                               |
| `npm run format`     | Check Prettier formatting                |
| `npm run format:fix` | Fix Prettier formatting                  |
| `npm run test`       | Run unit tests                           |
| `npm run test:e2e`   | Run Playwright E2E tests                 |

## Project Structure

```
src/
  routes/           # File-based routes (pages + server functions)
  components/       # React components with co-located CSS Modules
  lib/              # Database client, types
  lib/server/       # Server-side data functions
  helpers/          # Pure utilities (risk calculator, validation)
  styles/           # Global CSS with design tokens
scripts/
  migrations/       # SQL migrations (run manually in Supabase)
  seed-data.ts      # Seed airports + route delay stats
  import-eurocontrol.ts  # Import real Eurocontrol CSV data
e2e/                # Playwright E2E tests
```

## Current Status: PoC Complete

The proof of concept is functional with seeded sample data covering 10 European airports and common routes. See `docs/mvp-plan.md` for the next phase.
