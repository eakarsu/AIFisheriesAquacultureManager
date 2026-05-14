// Market price forecasting: predict prices, optimize harvest timing.
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

const BASE_PRICE = { salmon: 9.5, tilapia: 4.0, shrimp: 12.0, trout: 8.5, sea_bass: 14.0 };
const SEASONAL = { 0: 1.1, 1: 1.1, 2: 1.05, 3: 1.0, 4: 0.95, 5: 0.9, 6: 0.9, 7: 0.95, 8: 1.0, 9: 1.05, 10: 1.15, 11: 1.2 };

// POST /api/market-price-forecast/predict { species, months_ahead?:6 }
router.post('/predict', authenticate, async (req, res) => {
  try {
    const { species, months_ahead = 6 } = req.body || {};
    if (!species || !BASE_PRICE[species]) return res.status(400).json({ error: `species must be one of ${Object.keys(BASE_PRICE).join(',')}` });
    const now = new Date();
    const projection = [];
    for (let i = 0; i < Math.min(Number(months_ahead), 24); i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = d.getMonth();
      const price = BASE_PRICE[species] * (SEASONAL[month] || 1);
      projection.push({ month: d.toISOString().slice(0, 7), price_per_kg: Math.round(price * 100) / 100 });
    }
    const best = projection.reduce((a, b) => (a.price_per_kg > b.price_per_kg ? a : b));
    return res.json({ species, projection, optimal_harvest_window: best });
  } catch (e) {
    return res.status(500).json({ error: 'predict failed' });
  }
});

module.exports = router;
