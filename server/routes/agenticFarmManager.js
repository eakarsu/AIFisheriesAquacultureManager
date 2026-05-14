// Agentic farm manager: "50,000 fish, water temp rising" investigator/recommender.
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

async function callLLM(prompt, system) {
  // TODO: configure credentials — OPENROUTER_API_KEY
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: 1200 }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.choices?.[0]?.message?.content;
}

// POST /api/agentic-farm-manager/recommend { pond_id, fish_count, water_temp_c, do_mg_l, ph, ammonia_mg_l }
router.post('/recommend', authenticate, aiRateLimiter, async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.pond_id) return res.status(400).json({ error: 'pond_id required' });
    const issues = [];
    if (Number(b.water_temp_c) > 28) issues.push('high_temperature');
    if (Number(b.do_mg_l) < 5) issues.push('low_dissolved_oxygen');
    if (Number(b.ph) < 6.5 || Number(b.ph) > 8.5) issues.push('ph_out_of_range');
    if (Number(b.ammonia_mg_l) > 0.5) issues.push('high_ammonia');
    const system = 'You are an aquaculture specialist. Output JSON {"interventions":[{"action":"...","priority":"high|med|low","why":"..."}],"feed_adjustment":"..."}.';
    let parsed;
    try {
      const raw = await callLLM(JSON.stringify({ ...b, detected_issues: issues }), system);
      try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    } catch (e) {
      parsed = { interventions: issues.map(i => ({ action: `address_${i}`, priority: 'high', why: 'rule-based fallback' })) };
    }
    return res.json({ pond_id: b.pond_id, detected_issues: issues, recommendation: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'recommend failed' });
  }
});

module.exports = router;
