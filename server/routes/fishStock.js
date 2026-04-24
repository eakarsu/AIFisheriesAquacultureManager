const express = require('express');
const router = express.Router();
const { FishStock } = require('../models');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');

router.use(auth);

// GET /api/fish-stocks
router.get('/', async (req, res) => {
  try {
    const records = await FishStock.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching fish stocks:', err);
    res.status(500).json({ error: 'Failed to fetch fish stocks' });
  }
});

// GET /api/fish-stocks/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await FishStock.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Fish stock not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching fish stock:', err);
    res.status(500).json({ error: 'Failed to fetch fish stock' });
  }
});

// POST /api/fish-stocks
router.post('/', async (req, res) => {
  try {
    const record = await FishStock.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating fish stock:', err);
    res.status(500).json({ error: 'Failed to create fish stock' });
  }
});

// PUT /api/fish-stocks/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await FishStock.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Fish stock not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating fish stock:', err);
    res.status(500).json({ error: 'Failed to update fish stock' });
  }
});

// DELETE /api/fish-stocks/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await FishStock.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Fish stock not found' });
    await record.destroy();
    res.json({ message: 'Fish stock deleted successfully' });
  } catch (err) {
    console.error('Error deleting fish stock:', err);
    res.status(500).json({ error: 'Failed to delete fish stock' });
  }
});

// POST /api/fish-stocks/:id/analyze - AI population modeling analysis
router.post('/:id/analyze', async (req, res) => {
  try {
    const record = await FishStock.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Fish stock not found' });

    const systemPrompt = `You are an expert fisheries biologist and aquaculture population modeling specialist. Analyze fish stock data and provide detailed population predictions, growth models, carrying capacity estimates, and sustainability assessments. Include specific recommendations for stock management.`;

    const prompt = `Analyze the following fish stock data and provide a comprehensive population modeling analysis:

Species: ${record.species}
Population Count: ${record.population_count}
Pond ID: ${record.pond_id}
Average Weight: ${record.avg_weight} kg
Health Status: ${record.health_status}
Mortality Rate: ${record.mortality_rate}%
Stocking Date: ${record.stocking_date}
Notes: ${record.notes || 'N/A'}

Please provide:
1. Population growth projections (30, 60, 90 days)
2. Carrying capacity assessment
3. Mortality risk analysis
4. Sustainability assessment
5. Specific management recommendations
6. Optimal harvesting timeline`;

    const analysis = await queryAI(prompt, systemPrompt);
    res.json({ analysis, record });
  } catch (err) {
    console.error('Error analyzing fish stock:', err);
    res.status(500).json({ error: 'Failed to analyze fish stock' });
  }
});

module.exports = router;
