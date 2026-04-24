const express = require('express');
const router = express.Router();
const { Equipment } = require('../models');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/equipment
router.get('/', async (req, res) => {
  try {
    const records = await Equipment.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// GET /api/equipment/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await Equipment.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Equipment not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// POST /api/equipment
router.post('/', async (req, res) => {
  try {
    const record = await Equipment.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating equipment:', err);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// PUT /api/equipment/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await Equipment.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Equipment not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating equipment:', err);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// DELETE /api/equipment/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await Equipment.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Equipment not found' });
    await record.destroy();
    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    console.error('Error deleting equipment:', err);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

module.exports = router;
