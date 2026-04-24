const express = require('express');
const router = express.Router();
const { FeedRecord } = require('../models');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');

router.use(auth);

// GET /api/feed-records
router.get('/', async (req, res) => {
  try {
    const records = await FeedRecord.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching feed records:', err);
    res.status(500).json({ error: 'Failed to fetch feed records' });
  }
});

// GET /api/feed-records/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await FeedRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Feed record not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching feed record:', err);
    res.status(500).json({ error: 'Failed to fetch feed record' });
  }
});

// POST /api/feed-records
router.post('/', async (req, res) => {
  try {
    const record = await FeedRecord.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating feed record:', err);
    res.status(500).json({ error: 'Failed to create feed record' });
  }
});

// PUT /api/feed-records/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await FeedRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Feed record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating feed record:', err);
    res.status(500).json({ error: 'Failed to update feed record' });
  }
});

// DELETE /api/feed-records/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await FeedRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Feed record not found' });
    await record.destroy();
    res.json({ message: 'Feed record deleted successfully' });
  } catch (err) {
    console.error('Error deleting feed record:', err);
    res.status(500).json({ error: 'Failed to delete feed record' });
  }
});

// POST /api/feed-records/:id/optimize - AI feed optimization
router.post('/:id/optimize', async (req, res) => {
  try {
    const record = await FeedRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Feed record not found' });

    const systemPrompt = `You are an expert aquaculture nutritionist specializing in fish feed optimization. Analyze feeding data and provide detailed recommendations for optimal feeding schedules, protein content adjustments, feed conversion improvements, and cost optimization strategies.`;

    const prompt = `Analyze the following feed record and provide optimization recommendations:

Species: ${record.species}
Feed Type: ${record.feed_type}
Quantity: ${record.quantity_kg} kg
Feeding Time: ${record.feeding_time}
Protein Content: ${record.protein_content}%
Cost Per Kg: $${record.cost_per_kg}
Pond ID: ${record.pond_id}
Notes: ${record.notes || 'N/A'}

Please provide:
1. Optimal feeding schedule recommendations
2. Protein content adjustment suggestions
3. Feed conversion ratio optimization
4. Cost optimization strategies
5. Alternative feed type suggestions
6. Seasonal feeding adjustments`;

    const analysis = await queryAI(prompt, systemPrompt);
    res.json({ analysis, record });
  } catch (err) {
    console.error('Error optimizing feed:', err);
    res.status(500).json({ error: 'Failed to optimize feed' });
  }
});

module.exports = router;
