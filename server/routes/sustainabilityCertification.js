// Sustainability certification: ASC / organic certification support.
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

const REQUIREMENTS = {
  ASC: ['feed_traceability', 'water_quality_records', 'fish_welfare_audit', 'effluent_compliance', 'worker_rights_audit'],
  organic: ['feed_organic_certified', 'no_synthetic_pesticides', 'no_antibiotics_prophylactic', 'biodiversity_plan'],
};

// POST /api/sustainability-cert/check { standard, evidence:{requirement: bool} }
router.post('/check', authenticate, async (req, res) => {
  try {
    const { standard, evidence = {} } = req.body || {};
    if (!standard || !REQUIREMENTS[standard]) return res.status(400).json({ error: `standard must be one of ${Object.keys(REQUIREMENTS).join(',')}` });
    const reqs = REQUIREMENTS[standard];
    const missing = reqs.filter(r => !evidence[r]);
    return res.json({ standard, total: reqs.length, met: reqs.length - missing.length, missing, certifiable: missing.length === 0 });
  } catch (e) {
    return res.status(500).json({ error: 'check failed' });
  }
});

module.exports = router;
