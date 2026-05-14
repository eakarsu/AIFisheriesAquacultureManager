// Traceability blockchain: track fish from hatch to consumer.
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const authenticate = require('../middleware/auth');

let CHAIN = [{ index: 0, prev_hash: '0', payload: { event: 'genesis' }, hash: '0' }];

function nextHash(prev, payload) {
  return crypto.createHash('sha256').update(prev + JSON.stringify(payload)).digest('hex');
}

// POST /api/traceability-chain/log { batch_id, event: 'hatch'|'transfer'|'feed'|'harvest'|'sell', details }
router.post('/log', authenticate, async (req, res) => {
  try {
    const { batch_id, event, details } = req.body || {};
    if (!batch_id || !event) return res.status(400).json({ error: 'batch_id + event required' });
    const prev = CHAIN[CHAIN.length - 1];
    const payload = { batch_id, event, details: details || null, actor_id: req.user?.id, ts: new Date().toISOString() };
    const hash = nextHash(prev.hash, payload);
    CHAIN.push({ index: CHAIN.length, prev_hash: prev.hash, payload, hash });
    return res.json({ index: CHAIN.length - 1, hash });
  } catch (e) {
    return res.status(500).json({ error: 'log failed' });
  }
});

// GET /api/traceability-chain/batch/:batch_id
router.get('/batch/:batch_id', authenticate, async (req, res) => {
  const entries = CHAIN.filter(c => c.payload?.batch_id === req.params.batch_id);
  return res.json({ batch_id: req.params.batch_id, events: entries });
});

module.exports = router;
