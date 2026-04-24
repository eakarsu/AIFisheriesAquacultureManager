const express = require('express');
const router = express.Router();
const { WaterQuality } = require('../models');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');

router.use(auth);

// GET /api/water-quality
router.get('/', async (req, res) => {
  try {
    const records = await WaterQuality.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching water quality records:', err);
    res.status(500).json({ error: 'Failed to fetch water quality records' });
  }
});

// GET /api/water-quality/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await WaterQuality.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Water quality record not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching water quality record:', err);
    res.status(500).json({ error: 'Failed to fetch water quality record' });
  }
});

// POST /api/water-quality
router.post('/', async (req, res) => {
  try {
    const record = await WaterQuality.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating water quality record:', err);
    res.status(500).json({ error: 'Failed to create water quality record' });
  }
});

// PUT /api/water-quality/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await WaterQuality.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Water quality record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating water quality record:', err);
    res.status(500).json({ error: 'Failed to update water quality record' });
  }
});

// DELETE /api/water-quality/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await WaterQuality.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Water quality record not found' });
    await record.destroy();
    res.json({ message: 'Water quality record deleted successfully' });
  } catch (err) {
    console.error('Error deleting water quality record:', err);
    res.status(500).json({ error: 'Failed to delete water quality record' });
  }
});

// POST /api/water-quality/:id/analyze - AI water quality analysis
router.post('/:id/analyze', async (req, res) => {
  try {
    const record = await WaterQuality.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Water quality record not found' });

    const systemPrompt = `You are an expert aquaculture water quality specialist. Analyze water parameters and provide detailed assessments of water conditions, identify potential issues, and recommend corrective actions to maintain optimal conditions for fish health and growth.`;

    const prompt = `Analyze the following water quality data and provide a comprehensive assessment:

Pond ID: ${record.pond_id}
Temperature: ${record.temperature}°C
pH Level: ${record.ph_level}
Dissolved Oxygen: ${record.dissolved_oxygen} mg/L
Ammonia: ${record.ammonia} mg/L
Nitrite: ${record.nitrite} mg/L
Nitrate: ${record.nitrate} mg/L
Turbidity: ${record.turbidity} NTU
Test Date: ${record.test_date}
Status: ${record.status}

Please provide:
1. Overall water quality assessment
2. Parameter-by-parameter analysis (identify any out-of-range values)
3. Potential risks to fish health
4. Corrective actions needed
5. Preventive measures
6. Recommended testing frequency`;

    const analysis = await queryAI(prompt, systemPrompt);
    res.json({ analysis, record });
  } catch (err) {
    console.error('Error analyzing water quality:', err);
    res.status(500).json({ error: 'Failed to analyze water quality' });
  }
});

module.exports = router;
