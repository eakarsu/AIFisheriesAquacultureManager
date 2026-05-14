const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { AiResult } = require('../models');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.feature) where.feature = req.query.feature;
    if (req.query.entity_type) where.entity_type = req.query.entity_type;
    if (req.query.entity_id) where.entity_id = req.query.entity_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.mine === 'true' && req.user?.id) where.user_id = req.user.id;

    const { rows, count } = await AiResult.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    res.json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 1 },
    });
  } catch (e) {
    console.error('List ai_results error:', e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await AiResult.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
