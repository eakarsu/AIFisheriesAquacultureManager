const express = require('express');
const router = express.Router();
const { FeedInventory } = require('../models');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/feed-inventory
router.get('/', async (req, res) => {
  try {
    const records = await FeedInventory.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching feed inventory:', err);
    res.status(500).json({ error: 'Failed to fetch feed inventory' });
  }
});

// GET /api/feed-inventory/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await FeedInventory.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Feed inventory not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching feed inventory:', err);
    res.status(500).json({ error: 'Failed to fetch feed inventory' });
  }
});

// POST /api/feed-inventory
router.post('/', async (req, res) => {
  try {
    const record = await FeedInventory.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating feed inventory:', err);
    res.status(500).json({ error: 'Failed to create feed inventory' });
  }
});

// PUT /api/feed-inventory/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await FeedInventory.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Feed inventory not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating feed inventory:', err);
    res.status(500).json({ error: 'Failed to update feed inventory' });
  }
});

// DELETE /api/feed-inventory/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await FeedInventory.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Feed inventory not found' });
    await record.destroy();
    res.json({ message: 'Feed inventory deleted successfully' });
  } catch (err) {
    console.error('Error deleting feed inventory:', err);
    res.status(500).json({ error: 'Failed to delete feed inventory' });
  }
});

module.exports = router;
