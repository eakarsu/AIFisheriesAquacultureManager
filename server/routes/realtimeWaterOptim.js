// Real-time water quality optimization: IoT data, auto-adjust aeration/feeding.
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

// POST /api/realtime-water-optim/decide { pond_id, do_mg_l, temp_c, ph, ammonia_mg_l }
router.post('/decide', authenticate, async (req, res) => {
  try {
    const { pond_id, do_mg_l, temp_c, ph, ammonia_mg_l } = req.body || {};
    if (!pond_id) return res.status(400).json({ error: 'pond_id required' });
    const actions = [];
    if (Number(do_mg_l) < 5) actions.push({ device: 'aerator', action: 'turn_on', reason: 'Low DO' });
    if (Number(do_mg_l) > 9) actions.push({ device: 'aerator', action: 'turn_off', reason: 'Sufficient DO' });
    if (Number(temp_c) > 30) actions.push({ device: 'shade_screen', action: 'deploy', reason: 'High temperature' });
    if (Number(ammonia_mg_l) > 0.5) actions.push({ device: 'water_exchange', action: 'increase', reason: 'High ammonia' });
    if (Number(ph) < 6.5) actions.push({ device: 'buffer_dispenser', action: 'add_lime', reason: 'Low pH' });
    if (Number(ph) > 9) actions.push({ device: 'buffer_dispenser', action: 'add_acid', reason: 'High pH' });
    return res.json({ pond_id, actions });
  } catch (e) {
    return res.status(500).json({ error: 'decide failed' });
  }
});

module.exports = router;
