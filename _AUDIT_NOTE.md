# Audit Apply Notes — AIFisheriesAquacultureManager

Audit source: `_AUDIT/reports/batch_03.md` (#30). Audit verdict: template-clone, 0 AI endpoints.

## Reality check

Audit understates AI coverage. The codebase already has:
- `diseaseDetection.js` — `/:id/diagnose`, `/cross-pond-risk`
- `feedOptimization.js` — `/:id/optimize`
- `waterQuality.js` — `/:id/analyze`
- `growthAnalysis.js` — `/:id/analyze`
- `harvestPlan.js` — `/:id/predict`, `/optimize-schedule`
- `fishStock.js` — analysis endpoint

So the "missing AI counterparts" `/disease-detect`, `/water-quality-optimize`, `/feed-optimize`, `/harvest-predict`, `/growth-forecast` are effectively present.

## Implementations applied

1. New file `server/routes/sustainability.js` — `POST /api/sustainability/score`
   - Deterministic 0-100 score across mortality, FCR, water quality, stocking density.
   - Optional AI narrative with strengths, weaknesses, recommendations, ASC certification readiness.
   - Persists via existing `saveAiResult`.
   - Wired into `index.js`. Syntax-checked via `node --check`.

This addresses the `/sustainability-score` audit gap and the "Sustainability certification" custom feature.

## Backlog (prioritized)

### Mechanical
- `/mortality-predict` — short ML predictor over recent water quality + density (would expand sustainability route).
- Real-time sensor monitoring dashboard endpoint (sensors.js exists).

### Needs creds / external
- IoT integration with real water sensors.
- Blockchain traceability provider (e.g., IBM Food Trust).
- Market price feed.

### Needs product decision
- ASC/organic certification submission workflow.
- Insurance / regulatory partner integrations.

### Custom features
- Computer vision disease monitoring (visionDisease.js exists; needs trained model).
- Predictive maintenance for equipment.

## Apply pass 3 (frontend)
- Stack: CRA-React (client) + Express (server). JWT via axios interceptor in `services/api.js`.
- Action: UPDATED-FE — wired the orphaned Sustainability page.
- Modified: `client/src/App.js` (import + route for `/sustainability`), `client/src/components/Layout.js` (added 🌱 Sustainability Score sidebar entry under AI features).
- `pages/Sustainability.js` already existed and called `POST /api/sustainability/score`; it was reachable in code but not routed/navigable. Now both. 503/no-key surfaces in the form's error div via `err.response.data.error`.
- Backend `sustainabilityRoutes` confirmed registered at `/api/sustainability` in `server/index.js`.
- Syntax: `node --check` PASS on both modified files.

## Apply pass 4 (mechanical backlog)

Two of the items from the prior "Backlog → Mechanical" list shipped this pass:

| # | Backend | Frontend | Notes |
|---|---------|----------|-------|
| 1 | `POST /api/sustainability/mortality-predict` (extends `routes/sustainability.js`) | `client/src/pages/MortalityPredict.js` + sidebar `/mortality-predict` | 7- or 30-day mortality forecast from recent water-quality, density, historic mortality. Deterministic numeric core; AI narrative best-effort; **503** when `OPENROUTER_API_KEY` is missing (deterministic body still returned). |
| 2 | `GET /api/sensors/monitor` and `POST /api/sensors/monitor-summary` (extend `routes/sensors.js`) | `client/src/pages/SensorMonitor.js` + sidebar `/sensor-monitor` | Real-time monitoring dashboard: rolling means + open alerts. AI summary endpoint returns strict-JSON narrative; **503** on missing key. |

Reused `queryAI`/`parseAIJson`/`saveAiResult`/`aiRateLimiter`/`auth`. No new deps. All four files `node --check` clean. Smoke test: backend started on :4001, login OK, `/api/sensors/monitor` HTTP 200, `/api/sustainability/mortality-predict` HTTP 200 (AI fallback path exercised), `/api/sensors/monitor-summary` HTTP 502 against placeholder key (AI provider error path), all expected.

Items still on backlog (no longer "Mechanical"): see "Needs creds / external" and "Needs product decision" sections above — unchanged.
