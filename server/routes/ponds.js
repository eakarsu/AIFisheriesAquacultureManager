const express = require('express');
const router = express.Router();
const { Pond } = require('../models');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/ponds
router.get('/', async (req, res) => {
  try {
    const records = await Pond.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching ponds:', err);
    res.status(500).json({ error: 'Failed to fetch ponds' });
  }
});

// GET /api/ponds/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await Pond.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Pond not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching pond:', err);
    res.status(500).json({ error: 'Failed to fetch pond' });
  }
});

// POST /api/ponds
router.post('/', async (req, res) => {
  try {
    const record = await Pond.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating pond:', err);
    res.status(500).json({ error: 'Failed to create pond' });
  }
});

// PUT /api/ponds/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await Pond.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Pond not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating pond:', err);
    res.status(500).json({ error: 'Failed to update pond' });
  }
});

// DELETE /api/ponds/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await Pond.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Pond not found' });
    await record.destroy();
    res.json({ message: 'Pond deleted successfully' });
  } catch (err) {
    console.error('Error deleting pond:', err);
    res.status(500).json({ error: 'Failed to delete pond' });
  }
});

module.exports = router;
