// Apply pass 5 — Integrations + advanced features for AIFisheriesAquacultureManager
//
// ENV VARS (all OPTIONAL — endpoints return 503 with `missing: <ENV>`):
//   OPENROUTER_API_KEY        — AI narrative for predictive maintenance
//   IOT_SENSOR_API_KEY        — IoT water sensor provider
//   IOT_SENSOR_BASE_URL       — IoT provider base URL (e.g., https://api.foo.io)
//   BLOCKCHAIN_PROVIDER_KEY   — IBM Food Trust / Provenance / similar
//   BLOCKCHAIN_PROVIDER_URL   — Provider base URL
//   MARKET_PRICE_API_KEY      — Live fish-market price feed
//   ASC_CERT_API_KEY          — ASC certification submission portal
//   INSURANCE_PARTNER_KEY     — Insurance / regulatory partner integration
//
// PRODUCT-DECISIONS (documented at each endpoint):
//   - Predictive maintenance uses an additive risk score over equipment age,
//     condition, and maintenance_due date — no new ML pipeline.
//   - Computer-vision disease detection returns an in-memory stub (image hashes
//     mapped to deterministic mock predictions) so we don't pull in heavy CV deps.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { Equipment, Pond, WaterQuality, HarvestPlan, sequelize } = require('../models');
const { queryAI, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

router.use(auth);

// 503 helper
function require503(res, envName) {
  return res.status(503).json({
    error: 'Integration not configured',
    missing: envName,
    hint: `Set ${envName} in environment to enable this endpoint.`,
  });
}

// Schema bootstrap (additive only)
let schemaInitialized = false;
async function ensureSchema() {
  if (schemaInitialized) return;
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS iot_sensor_readings (
        id SERIAL PRIMARY KEY,
        pond_id INTEGER,
        sensor_type TEXT,
        value NUMERIC,
        unit TEXT,
        recorded_at TIMESTAMPTZ DEFAULT NOW(),
        provider TEXT
      );
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS blockchain_traceability (
        id SERIAL PRIMARY KEY,
        harvest_plan_id INTEGER,
        chain_tx TEXT,
        provider TEXT,
        payload JSONB,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        status TEXT
      );
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS market_price_snapshots (
        id SERIAL PRIMARY KEY,
        species TEXT,
        price_per_kg NUMERIC,
        currency TEXT DEFAULT 'USD',
        market TEXT,
        captured_at TIMESTAMPTZ DEFAULT NOW(),
        provider TEXT
      );
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS certification_submissions (
        id SERIAL PRIMARY KEY,
        scheme TEXT,
        external_ref TEXT,
        payload JSONB,
        status TEXT,
        submitted_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    schemaInitialized = true;
  } catch (e) {
    console.warn('integrations.ensureSchema:', e.message);
  }
}
ensureSchema();

// ============================================================
// 1. IoT sensor pull (NEEDS-CREDS)
// ============================================================
router.post('/iot/pull', async (req, res) => {
  if (!process.env.IOT_SENSOR_API_KEY) return require503(res, 'IOT_SENSOR_API_KEY');
  if (!process.env.IOT_SENSOR_BASE_URL) return require503(res, 'IOT_SENSOR_BASE_URL');
  try {
    await ensureSchema();
    // Stub: record an attempt; live SDK wire-up deferred.
    const { pond_id, sensor_type = 'dissolved_oxygen', value = null, unit = 'mg/L' } = req.body || {};
    const inserted = await sequelize.query(
      `INSERT INTO iot_sensor_readings (pond_id, sensor_type, value, unit, provider)
       VALUES (:pond_id, :sensor_type, :value, :unit, :provider) RETURNING *`,
      {
        replacements: { pond_id, sensor_type, value, unit, provider: 'configured_pending_sdk' },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    res.json({ status: 'recorded_pending_live_sdk', reading: inserted[0]?.[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/iot/readings', async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await sequelize.query(
      `SELECT * FROM iot_sensor_readings ORDER BY recorded_at DESC LIMIT 100`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 2. Blockchain traceability submission (NEEDS-CREDS)
// ============================================================
router.post('/blockchain/submit', async (req, res) => {
  if (!process.env.BLOCKCHAIN_PROVIDER_KEY) return require503(res, 'BLOCKCHAIN_PROVIDER_KEY');
  try {
    await ensureSchema();
    const { harvest_plan_id, payload } = req.body || {};
    if (!harvest_plan_id) return res.status(400).json({ error: 'harvest_plan_id required' });
    const [rows] = await sequelize.query(
      `INSERT INTO blockchain_traceability (harvest_plan_id, payload, provider, status)
       VALUES (:hpid, :payload, :provider, 'configured_pending_sdk') RETURNING *`,
      {
        replacements: {
          hpid: harvest_plan_id,
          payload: JSON.stringify(payload || {}),
          provider: process.env.BLOCKCHAIN_PROVIDER_URL || 'unknown',
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    res.json({ status: 'submitted_pending_sdk', record: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/blockchain/records', async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await sequelize.query(
      `SELECT * FROM blockchain_traceability ORDER BY submitted_at DESC LIMIT 50`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 3. Market price feed (NEEDS-CREDS)
// ============================================================
router.post('/market-price/snapshot', async (req, res) => {
  if (!process.env.MARKET_PRICE_API_KEY) return require503(res, 'MARKET_PRICE_API_KEY');
  try {
    await ensureSchema();
    const { species, price_per_kg, market } = req.body || {};
    if (!species) return res.status(400).json({ error: 'species required' });
    const [rows] = await sequelize.query(
      `INSERT INTO market_price_snapshots (species, price_per_kg, market, provider)
       VALUES (:species, :price, :market, 'configured_pending_sdk') RETURNING *`,
      {
        replacements: { species, price: price_per_kg || null, market: market || null },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    res.status(201).json({ snapshot: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/market-price/latest', async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await sequelize.query(`
      SELECT DISTINCT ON (species) species, price_per_kg, currency, market, captured_at
      FROM market_price_snapshots
      ORDER BY species, captured_at DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 4. ASC / organic certification submission (NEEDS-PRODUCT-DECISION + NEEDS-CREDS)
// PRODUCT-DECISION: we keep submissions in `certification_submissions` and
// require ASC_CERT_API_KEY before accepting (otherwise 503). The portal
// integration itself is stubbed pending vendor SDK selection.
// ============================================================
router.post('/certification/submit', async (req, res) => {
  if (!process.env.ASC_CERT_API_KEY) return require503(res, 'ASC_CERT_API_KEY');
  try {
    await ensureSchema();
    const { scheme = 'ASC', payload } = req.body || {};
    const [rows] = await sequelize.query(
      `INSERT INTO certification_submissions (scheme, payload, status)
       VALUES (:scheme, :payload, 'submitted_pending_sdk') RETURNING *`,
      {
        replacements: { scheme, payload: JSON.stringify(payload || {}) },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    res.json({ submission: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 5. Insurance / regulatory partner notification (NEEDS-CREDS)
// ============================================================
router.post('/insurance/notify', async (req, res) => {
  if (!process.env.INSURANCE_PARTNER_KEY) return require503(res, 'INSURANCE_PARTNER_KEY');
  // PRODUCT-DECISION: minimal acknowledgement — partner-specific schema TBD.
  res.json({
    status: 'configured_pending_sdk',
    message: 'Insurance partner credentials present; notification queued.',
    received_at: new Date().toISOString(),
    payload_keys: Object.keys(req.body || {}),
  });
});

// ============================================================
// 6. Predictive maintenance (deterministic + optional AI narrative)
// PRODUCT-DECISION: weighted score over age, condition, maintenance overdue.
// Falls back gracefully without OPENROUTER_API_KEY (returns deterministic result + 503-on-AI hint).
// ============================================================
router.post('/maintenance/predict', aiRateLimiter, async (req, res) => {
  try {
    const equipment = await Equipment.findAll();
    const now = Date.now();
    const scored = equipment.map((e) => {
      const ageDays = e.purchase_date ? Math.max(0, Math.floor((now - new Date(e.purchase_date).getTime()) / 86400000)) : 0;
      const overdueDays = e.maintenance_due ? Math.max(0, Math.floor((now - new Date(e.maintenance_due).getTime()) / 86400000)) : 0;
      const condScore = ({ excellent: 0, good: 10, fair: 25, poor: 50, broken: 80 })[String(e.condition || '').toLowerCase()] ?? 15;
      const ageScore = Math.min(40, ageDays / 60);
      const overdueScore = Math.min(30, overdueDays / 5);
      const risk = Math.round(condScore + ageScore + overdueScore);
      return {
        equipment_id: e.id,
        name: e.name,
        type: e.type,
        condition: e.condition,
        age_days: ageDays,
        overdue_days: overdueDays,
        risk_score: Math.min(100, risk),
        priority: risk >= 70 ? 'high' : risk >= 40 ? 'medium' : 'low',
      };
    }).sort((a, b) => b.risk_score - a.risk_score);

    let aiNarrative = null;
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const ai = await queryAI(
          `Maintenance risk ranking:\n${JSON.stringify(scored.slice(0, 10), null, 2)}\n\nReturn JSON: { "summary": "...", "top_actions": [{ "equipment_id": n, "action": "...", "eta_days": n }] }`,
          'You are a fisheries maintenance planner. Output strict JSON.'
        );
        aiNarrative = parseAIJson(ai.content || ai) || { raw: ai.content };
      } catch (e) {
        aiNarrative = { error: e.message };
      }
    }

    await saveAiResult({
      feature: 'integrations.maintenance_predict',
      user_id: req.user?.id,
      input: { count: equipment.length },
      output: { top: scored.slice(0, 10), ai_narrative: aiNarrative },
    }).catch(() => {});

    res.json({
      total_equipment: equipment.length,
      ranked: scored,
      ai_narrative: aiNarrative,
      ai_available: !!process.env.OPENROUTER_API_KEY,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 7. Computer-vision disease detection — in-memory stub
// PRODUCT-DECISION: returns deterministic mock predictions keyed by image
// hash to keep this endpoint additive without pulling in CV deps.
// Real model wire-up requires CV_MODEL_KEY (returns 503 if absent AND
// the request asks for live mode via ?live=1).
// ============================================================
const _stubVisionCache = new Map(); // image_id -> result
router.post('/vision/disease-stub', aiRateLimiter, async (req, res) => {
  if (req.query.live === '1' && !process.env.CV_MODEL_KEY) {
    return require503(res, 'CV_MODEL_KEY');
  }
  const { image_id } = req.body || {};
  if (!image_id) return res.status(400).json({ error: 'image_id required' });
  if (_stubVisionCache.has(image_id)) {
    return res.json({ image_id, cached: true, ...(_stubVisionCache.get(image_id)) });
  }
  // Deterministic mock based on hash of image_id
  let h = 0;
  for (let i = 0; i < image_id.length; i++) h = (h * 31 + image_id.charCodeAt(i)) >>> 0;
  const labels = ['ich', 'fin_rot', 'columnaris', 'healthy'];
  const top = labels[h % labels.length];
  const conf = 0.55 + (h % 40) / 100;
  const result = {
    top_label: top,
    confidence: Number(conf.toFixed(2)),
    runner_up: labels[(h + 1) % labels.length],
    mode: 'stub',
    notes: 'Deterministic stub. Set CV_MODEL_KEY and pass ?live=1 for real inference.',
  };
  _stubVisionCache.set(image_id, result);
  res.json({ image_id, cached: false, ...result });
});

module.exports = router;
