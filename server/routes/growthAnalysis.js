const express = require('express');
const router = express.Router();
const { GrowthRecord } = require('../models');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');

router.use(auth);

// GET /api/growth-records
router.get('/', async (req, res) => {
  try {
    const records = await GrowthRecord.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching growth records:', err);
    res.status(500).json({ error: 'Failed to fetch growth records' });
  }
});

// GET /api/growth-records/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await GrowthRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Growth record not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching growth record:', err);
    res.status(500).json({ error: 'Failed to fetch growth record' });
  }
});

// POST /api/growth-records
router.post('/', async (req, res) => {
  try {
    const record = await GrowthRecord.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating growth record:', err);
    res.status(500).json({ error: 'Failed to create growth record' });
  }
});

// PUT /api/growth-records/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await GrowthRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Growth record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating growth record:', err);
    res.status(500).json({ error: 'Failed to update growth record' });
  }
});

// DELETE /api/growth-records/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await GrowthRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Growth record not found' });
    await record.destroy();
    res.json({ message: 'Growth record deleted successfully' });
  } catch (err) {
    console.error('Error deleting growth record:', err);
    res.status(500).json({ error: 'Failed to delete growth record' });
  }
});

// POST /api/growth-records/:id/analyze - AI growth rate analysis
router.post('/:id/analyze', async (req, res) => {
  try {
    const record = await GrowthRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Growth record not found' });

    const systemPrompt = `You are an expert aquaculture growth analyst specializing in fish growth modeling, feed conversion optimization, and production efficiency. Provide detailed growth projections, identify bottlenecks, and suggest data-driven optimization strategies.`;

    const prompt = `Analyze the following growth record and provide comprehensive growth analysis:

Species: ${record.species}
Pond ID: ${record.pond_id}
Sample Date: ${record.sample_date}
Average Weight: ${record.avg_weight_g} g
Average Length: ${record.avg_length_cm} cm
Feed Conversion Ratio: ${record.feed_conversion_ratio}
Survival Rate: ${record.survival_rate}%
Notes: ${record.notes || 'N/A'}

Please provide:
1. Growth rate assessment compared to species benchmarks
2. Growth projections (30, 60, 90 days)
3. Feed conversion ratio analysis and optimization
4. Weight-length relationship assessment
5. Survival rate analysis
6. Recommendations for improving growth performance
7. Optimal market size timeline`;

    const analysis = await queryAI(prompt, systemPrompt);
    res.json({ analysis, record });
  } catch (err) {
    console.error('Error analyzing growth:', err);
    res.status(500).json({ error: 'Failed to analyze growth' });
  }
});

module.exports = router;
