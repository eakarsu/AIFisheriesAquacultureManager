const express = require('express');
const router = express.Router();

router.post('/score', (req, res) => {
  const body = req.body || {};
  const biomass = Number(body.planned_biomass_kg || 0);
  const licensed = Number(body.licensed_biomass_kg || 1);
  const disease = Number(body.disease_risk_score || 0);
  const water = Number(body.water_quality_score || 80);
  const utilization = biomass / Math.max(licensed, 1);
  const score = Math.max(0, Math.min(100, Math.round(100 - utilization * 35 - disease * 0.4 - Math.max(0, 70 - water) * 0.8)));
  res.json({
    site: body.site || 'site',
    permit_score: score,
    permit_band: score >= 75 ? 'ready' : score >= 50 ? 'conditions needed' : 'hold',
    actions: [
      utilization > 0.9 ? 'Reduce stocking plan below licensed biomass buffer.' : 'Biomass utilization is within permit buffer.',
      disease > 50 ? 'Attach disease mitigation plan.' : 'Disease score does not trigger extra permit evidence.',
      water < 70 ? 'Add recent water quality evidence.' : 'Water quality evidence is acceptable.',
    ],
    generated_at: new Date().toISOString(),
  });
});

module.exports = router;
