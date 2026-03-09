# MVP Plan

## Goal

Improve prediction accuracy with weather data, polish the UX, and harden the app for real usage.

---

## 1. UX: Two-Step Flight Search

**Current:** User types flight number + manually picks a date.
**Target:** User types flight number → app shows a list of upcoming dates the flight operates → user picks one.

### Tasks

- [ ] Add AviationStack schedule/timetable lookup (or infer operating days from the flights endpoint)
- [ ] Create a `FlightDatePicker` component that displays selectable future dates as cards/chips
- [ ] Update the search flow: homepage → enter flight number → show date options → navigate to prediction
- [ ] Cache schedule data in a new `flight_schedule_cache` table (longer TTL since schedules are stable)
- [ ] Remove the manual date input from `SearchForm`

### Considerations

- AviationStack free tier is 100 req/month — schedule lookups need aggressive caching
- May need to evaluate alternative APIs (AeroDataBox, FlightAware) if quota is too tight

---

## 2. Weather Integration

**Data source:** Open-Meteo API (free, no key required)

### Tasks

- [ ] Create `src/lib/server/weather.ts` — fetch weather forecast for origin + destination airports
- [ ] Add `weather_cache` table (migration `002-weather-cache.sql`):
    ```sql
    CREATE TABLE weather_cache (
        airport_icao VARCHAR(4) NOT NULL,
        forecast_time TIMESTAMP NOT NULL,
        temperature NUMERIC(5,2),
        wind_speed NUMERIC(5,2),
        precipitation NUMERIC(5,2),
        visibility NUMERIC(8,2),
        weather_code INT,
        raw_response JSONB,
        cached_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY(airport_icao, forecast_time)
    );
    ```
- [ ] Add weather types to `src/lib/types.ts`
- [ ] Integrate weather fetch into `prediction.ts` orchestrator
- [ ] Add `computeWeatherFactor()` to risk calculator with logic:
    - Wind speed >40 km/h → high risk
    - Precipitation >5mm/h → high risk
    - Visibility <1000m → high risk
    - Thunderstorm weather codes → very high risk
    - Combine origin + destination (worse of two dominates)
- [ ] Rebalance risk weights:
    - Route history: 30%
    - Airline punctuality: 20%
    - Weather: 25%
    - Time of day: 10%
    - Day of week: 8%
    - Seasonal pattern: 7%
- [ ] Create `WeatherCard` component showing conditions at both airports
- [ ] Add unit tests for weather risk calculation

### Architecture Change

Refactor `calculateRisk` to accept a context object instead of positional args:

```ts
interface RiskContext {
    historicalStats: HistoricalStats
    flightDate: Date
    scheduledHour: number
    weather?: WeatherData
}
```

---

## 3. Security Hardening

Issues identified in the PoC analysis that must be fixed for MVP.

### Tasks

- [ ] **Supabase RLS:** Enable Row Level Security on all tables. Use anon key for read-only queries (route stats, airports), service key only for writes (cache upserts) and scripts
- [ ] **Rate limiting:** Add Cloudflare rate limiting rules to protect AviationStack quota and prevent abuse
- [ ] **API quota tracking:** Track AviationStack calls in DB, return cached-only results when near limit, show user a message
- [ ] **Runtime validation:** Add Zod schemas to validate AviationStack API responses at runtime
- [ ] **HTTP → HTTPS:** Document AviationStack HTTP limitation clearly, or upgrade to paid plan
- [ ] **Error sanitization:** Wrap external API errors in user-friendly messages, don't expose status codes

---

## 4. UI Polish

### Tasks

- [ ] **Loading states:** Add `pendingComponent` to the prediction route with skeleton loaders
- [ ] **Responsive design:** Mobile-first layout, test on small screens
- [ ] **Error boundaries:** Graceful error states with retry options on each section
- [ ] **Recent searches:** Store in localStorage, show on homepage
- [ ] **Airport info:** Display airport name, city, country more prominently
- [ ] **Fix hardcoded colors:** Replace `#fff` in SearchForm CSS with `var(--bg-card)`

---

## 5. Data Quality

### Tasks

- [ ] **Import real Eurocontrol data:** Download from ansperformance.eu, run through `import-eurocontrol.ts`
- [ ] **Expand airport reference data:** Import full European airport list from OurAirports dataset
- [ ] **Add API endpoint:** `src/routes/api/predict.ts` — JSON API for programmatic access
- [ ] **Shareable results:** Add Open Graph meta tags to prediction pages

---

## 6. Testing

### Tasks

- [ ] **Server module unit tests:** Add tests for `flight-lookup.ts`, `historical-stats.ts`, `prediction.ts` with mocked Supabase/fetch
- [ ] **Weather calculation tests:** Extensive tests for weather risk scenarios
- [ ] **E2E tests:** Expand to cover prediction results rendering, error states, loading states
- [ ] **Generate Supabase types:** Run `supabase gen types typescript` to replace `as` casts with proper types

---

## 7. Operational

### Tasks

- [ ] **Alternative flight API:** Evaluate AeroDataBox or FlightAware as AviationStack alternatives (higher free tier limits)
- [ ] **In-memory cache:** Add LRU cache or Cloudflare KV in front of Supabase for hot flight numbers
- [ ] **Update `compatibility_date`** in `wrangler.jsonc` to a recent date
- [ ] **Fix `toLocaleTimeString`:** Use explicit UTC formatting for Cloudflare Workers compatibility

---

## Verification

After completing MVP:

1. `npm run build` — passes
2. `npm run lint` — no errors
3. `npm run format` — passes
4. `npm run test` — all unit tests pass (including weather scenarios)
5. `npm run test:e2e` — all E2E tests pass
6. Manual test: search for flights, verify weather data appears, check mobile layout
7. Deploy to Cloudflare Workers and test production
