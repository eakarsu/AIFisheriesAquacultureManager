const express = require('express');
const router = express.Router();
const { Species } = require('../models');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/species
router.get('/', async (req, res) => {
  try {
    const records = await Species.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching species:', err);
    res.status(500).json({ error: 'Failed to fetch species' });
  }
});

// GET /api/species/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await Species.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Species not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching species:', err);
    res.status(500).json({ error: 'Failed to fetch species' });
  }
});

// POST /api/species
router.post('/', async (req, res) => {
  try {
    const record = await Species.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating species:', err);
    res.status(500).json({ error: 'Failed to create species' });
  }
});

// PUT /api/species/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await Species.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Species not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating species:', err);
    res.status(500).json({ error: 'Failed to update species' });
  }
});

// DELETE /api/species/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await Species.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Species not found' });
    await record.destroy();
    res.json({ message: 'Species deleted successfully' });
  } catch (err) {
    console.error('Error deleting species:', err);
    res.status(500).json({ error: 'Failed to delete species' });
  }
});

module.exports = router;
