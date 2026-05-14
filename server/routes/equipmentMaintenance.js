// Predictive maintenance: schedule equipment servicing before failures.
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { Equipment } = require('../models');

// GET /api/equipment-maintenance/recommendations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const items = await Equipment.findAll({ limit: 500 });
    const recs = items.map(e => {
      const last = e.last_serviced_at || e.lastServicedAt;
      const months = last ? (Date.now() - new Date(last).getTime()) / (30 * 86400000) : 99;
      const interval = Number(e.service_interval_months || 6);
      const due = months >= interval;
      return { equipment_id: e.id, name: e.name, months_since_service: Math.round(months * 10) / 10, due_now: due, urgency: months > interval * 1.5 ? 'high' : due ? 'medium' : 'low' };
    }).sort((a, b) => (a.urgency === 'high' ? -1 : 1) - (b.urgency === 'high' ? -1 : 1));
    return res.json({ count: recs.length, recommendations: recs });
  } catch (e) {
    return res.status(500).json({ error: 'recommendations failed' });
  }
});

module.exports = router;
