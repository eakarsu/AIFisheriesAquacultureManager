// ============================================================
// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated Gap-feature endpoints (lean v0).
// TODO: configure credentials (set OPENROUTER_API_KEY).
// ============================================================
const express = require('express');
const router = express.Router();

let _gfReady = false;
async function ensureGapTable(pool) {
  if (_gfReady || !pool) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      user_id INT,
      input JSONB,
      output JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    _gfReady = true;
  } catch (_) { /* tolerant of missing DB */ }
}

async function callAI(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, status: 503, error: 'AI service unavailable. Set OPENROUTER_API_KEY (TODO: configure credentials).' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return { ok: r.ok, status: r.status, text, raw: data };
  } catch (e) {
    return { ok: false, status: 500, error: String(e.message || e) };
  }
}

function buildHandler(slug, label, hint) {
  return async (req, res) => {
    const body = req.body || {};
    const userId = req.user?.id || null;
    const prompt = `Feature: ${label}\nContext hint: ${hint}\nUser input:\n${JSON.stringify(body, null, 2)}\n\nProduce a concise, actionable response.`;
    const ai = await callAI(prompt);
    try {
      const pool = req.app.locals.pool || req.app.get('pool') || null;
      if (pool) {
        await ensureGapTable(pool);
        await pool.query('INSERT INTO gap_features(slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
          [slug, userId, body, { text: ai.text || ai.error || null }]);
      }
    } catch (_) { /* tolerant */ }
    if (!ai.ok) return res.status(ai.status || 500).json({ error: ai.error || ai.text || `Upstream error (${ai.status})`, slug });
    res.json({ slug, label, result: ai.text });
  };
}

router.post('/gap-ai-endpoints-are-sparse-2-surfaced-most-route-files-act', buildHandler('gap-ai-ai-endpoints-are-sparse-2-surfaced-most-route-files-act', 'AI endpoints are sparse (2 surfaced) — most route files act', 'AI endpoints are sparse (2 surfaced) — most route files act as data stores; missing the actual ML inference layer'));
router.post('/gap-no-traceability-blockchain-agent', buildHandler('gap-ai-no-traceability-blockchain-agent', 'No traceability blockchain agent', 'No traceability blockchain agent'));
router.post('/gap-no-market-price-forecasting-agent', buildHandler('gap-ai-no-market-price-forecasting-agent', 'No market-price forecasting agent', 'No market-price forecasting agent'));
router.post('/gap-no-predictive-maintenance-for-equipment', buildHandler('gap-ai-no-predictive-maintenance-for-equipment', 'No predictive-maintenance for equipment', 'No predictive-maintenance for equipment'));
router.post('/gap-limited-real-time-sensor-streaming-only-polled-data-store', buildHandler('gap-non-limited-real-time-sensor-streaming-only-polled-data-store', 'Limited real-time sensor streaming (only polled data store)', 'Limited real-time sensor streaming (only polled data store)'));
router.post('/gap-no-feeding-schedule-automation-rules-engine', buildHandler('gap-non-no-feeding-schedule-automation-rules-engine', 'No feeding-schedule automation (rules engine)', 'No feeding-schedule automation (rules engine)'));
router.post('/gap-no-harvest-workflow-lifecycle-endpoint', buildHandler('gap-non-no-harvest-workflow-lifecycle-endpoint', 'No harvest workflow lifecycle endpoint', 'No harvest workflow lifecycle endpoint'));
router.post('/gap-no-asc-organic-certification-tracking', buildHandler('gap-non-no-asc-organic-certification-tracking', 'No ASC/organic certification tracking', 'No ASC/organic certification tracking'));

module.exports = router;
