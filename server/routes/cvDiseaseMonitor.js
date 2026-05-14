// Computer vision disease monitoring: analyse fish images for signs.
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

async function visionCheck(image_url, base64) {
  // TODO: configure credentials — OPENAI_API_KEY (vision)
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const content = [
    { type: 'text', text: 'Inspect a fish/pond image for signs of disease (lesions, fin rot, discolouration, abnormal behaviour). JSON {"detected":bool,"diseases":["..."],"severity":"low|med|high","next_steps":["..."]}.' },
    image_url ? { type: 'image_url', image_url: { url: image_url } } : { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
  ];
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content }], max_tokens: 400 }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.choices?.[0]?.message?.content;
}

// POST /api/cv-disease-monitor/inspect { pond_id, image_url? base64? }
router.post('/inspect', authenticate, aiRateLimiter, async (req, res) => {
  try {
    const { pond_id, image_url, image_base64 } = req.body || {};
    if (!pond_id || (!image_url && !image_base64)) return res.status(400).json({ error: 'pond_id + image required' });
    const raw = await visionCheck(image_url, image_base64);
    if (!raw) return res.status(503).json({ error: 'Vision API not configured' });
    let parsed;
    try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    return res.json({ pond_id, result: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'inspect failed' });
  }
});

module.exports = router;
