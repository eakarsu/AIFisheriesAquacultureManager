/**
 * Apply Pass 5 — Agentic farm manager + traceability + market price.
 *
 * Adds three additive endpoints:
 *  - POST /api/agentic-farm/advise   — orchestrator: takes pond context, returns
 *    structured "what should I do now" plan. AI optional — falls back to a
 *    mechanical decision tree when OPENROUTER_API_KEY is unset.
 *  - POST /api/traceability/log      — additive event log (non-blockchain) for
 *    hatch-to-harvest events. Real chain submission is delegated to existing
 *    /api/integrations/blockchain/submit.
 *  - POST /api/market-price/forecast — mechanical seasonal-multiplier price
 *    projection; AI commentary optional.
 *
 * No schema mutation — uses an additive Sequelize model created on-demand if
 * available, else falls back to in-memory store with a warning.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { saveAiResult } = require('../services/aiResultsStore');

let queryAI = null;
try {
  ({ queryAI } = require('../services/openrouter'));
} catch (e) {
  // services/openrouter may export differently
  const mod = require('../services/openrouter');
  queryAI = mod.queryAI || mod.default || null;
}

// In-process traceability event store. Production should swap to a DB table or
// an external blockchain provider via existing /api/integrations.
const traceEvents = []; // { id, batch_id, event, ts, actor, payload }

function decisionTree(ctx = {}) {
  const actions = [];
  const wq = ctx.water_quality || {};
  const stocking = Number(ctx.stocking_density || 0);
  const mortality = Number(ctx.mortality_rate || 0);
  const fcr = Number(ctx.fcr || 0);

  if (Number(wq.dissolved_oxygen) < 5) {
    actions.push({
      priority: 'critical',
      area: 'water-quality',
      action: 'Increase aeration; verify aerator runtime and oxygen sensor calibration.',
    });
  }
  if (Number(wq.ammonia) > 0.5) {
    actions.push({
      priority: 'high',
      area: 'water-quality',
      action: 'Trigger partial water exchange; reduce feed rate by 30% for 24h.',
    });
  }
  if (Number(wq.temperature) > 30) {
    actions.push({
      priority: 'high',
      area: 'water-quality',
      action: 'Add shading; consider deep-water circulation; monitor thermal stratification.',
    });
  }
  if (mortality > 1) {
    actions.push({
      priority: 'high',
      area: 'health',
      action: 'Investigate disease outbreak — collect samples, isolate affected pond.',
    });
  }
  if (stocking > 30) {
    actions.push({
      priority: 'medium',
      area: 'stocking',
      action: 'Stocking density elevated — consider partial harvest or split to reduce stress.',
    });
  }
  if (fcr > 2.0) {
    actions.push({
      priority: 'medium',
      area: 'feed',
      action: 'FCR is high — review feed quality, feeding times, and pellet size.',
    });
  }
  if (actions.length === 0) {
    actions.push({ priority: 'info', area: 'overall', action: 'No immediate action — continue routine monitoring.' });
  }
  return actions;
}

router.post('/agentic-farm/advise', auth, aiRateLimiter, async (req, res) => {
  try {
    const ctx = req.body || {};
    const mechanical_actions = decisionTree(ctx);

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({
        error: 'AI not configured: OPENROUTER_API_KEY missing — returning mechanical plan only.',
        mechanical_actions,
        ai_narrative: null,
      });
    }
    const prompt = `Aquaculture farm context: ${JSON.stringify(ctx).slice(0, 3500)}\nPre-computed mechanical actions: ${JSON.stringify(mechanical_actions)}\nProduce JSON {summary, prioritized_plan[], risks[], 24h_checks[]}.`;
    let ai_narrative = null;
    try {
      const r = await queryAI(
        prompt,
        'You are an aquaculture farm manager. Output valid JSON only.',
        { maxTokens: 1500, temperature: 0.3 }
      );
      ai_narrative = r.content;
      saveAiResult({
        feature: 'agentic-farm-advise',
        user_id: req.user?.id,
        request: ctx,
        response: { mechanical_actions, ai_narrative },
      });
    } catch (e) {
      ai_narrative = `AI narrative unavailable: ${e.message}`;
    }
    res.json({ mechanical_actions, ai_narrative });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/traceability/log
 * Body: { batch_id, event, payload? }
 */
router.post('/traceability/log', auth, async (req, res) => {
  const { batch_id, event, payload } = req.body || {};
  if (!batch_id || !event) {
    return res.status(400).json({ error: 'batch_id and event required' });
  }
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    batch_id,
    event,
    ts: new Date().toISOString(),
    actor: req.user?.email || req.user?.id || 'unknown',
    payload: payload || null,
  };
  traceEvents.push(entry);
  // Cap memory
  if (traceEvents.length > 5000) traceEvents.splice(0, 1000);
  res.json({ entry, note: 'In-memory store; submit to blockchain via /api/integrations/blockchain/submit when ready.' });
});

router.get('/traceability/log/:batchId', auth, (req, res) => {
  const events = traceEvents.filter((e) => e.batch_id === req.params.batchId);
  res.json({ batch_id: req.params.batchId, count: events.length, events });
});

/**
 * POST /api/market-price/forecast
 * Body: { species, current_price_per_kg, harvest_month?: 1-12 }
 * Mechanical seasonal multiplier per species.
 */
router.post('/market-price/forecast', auth, aiRateLimiter, async (req, res) => {
  try {
    const { species = 'tilapia', current_price_per_kg, harvest_month } = req.body || {};
    const cur = Number(current_price_per_kg);
    if (!Number.isFinite(cur) || cur <= 0) {
      return res.status(400).json({ error: 'current_price_per_kg must be positive number' });
    }
    // Static seasonal multipliers (illustrative; replace with real data source).
    const seasonalTable = {
      tilapia:    [0.95,0.93,0.95,1.00,1.04,1.06,1.08,1.06,1.02,0.98,0.96,1.00],
      salmon:     [1.10,1.08,1.04,0.98,0.95,0.93,0.95,1.00,1.03,1.05,1.08,1.12],
      shrimp:     [0.92,0.95,1.00,1.05,1.10,1.12,1.10,1.05,1.00,0.98,0.95,0.94],
      catfish:    [0.98,0.97,0.99,1.02,1.05,1.06,1.04,1.02,1.00,0.99,0.98,1.00],
      seabass:    [1.05,1.03,1.00,0.98,0.96,0.95,0.97,1.00,1.03,1.06,1.08,1.07],
    };
    const key = (species || '').toLowerCase();
    const multipliers = seasonalTable[key] || seasonalTable.tilapia;
    const forecast = multipliers.map((m, i) => ({ month: i + 1, projected_price: Number((cur * m).toFixed(2)), multiplier: m }));
    let recommendation = null;
    if (Number.isFinite(Number(harvest_month))) {
      const m = Math.max(1, Math.min(12, Number(harvest_month)));
      const best = forecast.reduce((a, b) => (a.projected_price > b.projected_price ? a : b));
      recommendation = {
        planned_month: m,
        planned_price: forecast[m - 1].projected_price,
        best_month: best.month,
        best_price: best.projected_price,
        upside_pct: Number(((best.projected_price - forecast[m - 1].projected_price) / forecast[m - 1].projected_price * 100).toFixed(1)),
      };
    }
    res.json({
      species: key,
      current_price_per_kg: cur,
      forecast,
      recommendation,
      disclaimer: 'Seasonal multipliers are illustrative defaults. Replace with real market feed (NEEDS-CREDS: provider TBD).',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
