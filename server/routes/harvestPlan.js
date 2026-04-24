const express = require('express');
const router = express.Router();
const { HarvestPlan } = require('../models');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');

router.use(auth);

// GET /api/harvest-plans
router.get('/', async (req, res) => {
  try {
    const records = await HarvestPlan.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching harvest plans:', err);
    res.status(500).json({ error: 'Failed to fetch harvest plans' });
  }
});

// GET /api/harvest-plans/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await HarvestPlan.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Harvest plan not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching harvest plan:', err);
    res.status(500).json({ error: 'Failed to fetch harvest plan' });
  }
});

// POST /api/harvest-plans
router.post('/', async (req, res) => {
  try {
    const record = await HarvestPlan.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating harvest plan:', err);
    res.status(500).json({ error: 'Failed to create harvest plan' });
  }
});

// PUT /api/harvest-plans/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await HarvestPlan.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Harvest plan not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating harvest plan:', err);
    res.status(500).json({ error: 'Failed to update harvest plan' });
  }
});

// DELETE /api/harvest-plans/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await HarvestPlan.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Harvest plan not found' });
    await record.destroy();
    res.json({ message: 'Harvest plan deleted successfully' });
  } catch (err) {
    console.error('Error deleting harvest plan:', err);
    res.status(500).json({ error: 'Failed to delete harvest plan' });
  }
});

// POST /api/harvest-plans/:id/predict - AI harvest timing prediction
router.post('/:id/predict', async (req, res) => {
  try {
    const record = await HarvestPlan.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Harvest plan not found' });

    const systemPrompt = `You are an expert aquaculture harvest planning specialist. Analyze harvest data and provide detailed predictions for optimal harvest timing, market price forecasts, yield estimations, and logistics recommendations for maximizing profitability.`;

    const prompt = `Analyze the following harvest plan and provide predictions and recommendations:

Species: ${record.species}
Pond ID: ${record.pond_id}
Planned Date: ${record.planned_date}
Estimated Weight: ${record.estimated_weight_kg} kg
Actual Weight: ${record.actual_weight_kg || 'Not yet harvested'} kg
Market Price: $${record.market_price}/kg
Status: ${record.status}
Notes: ${record.notes || 'N/A'}

Please provide:
1. Optimal harvest timing recommendation
2. Market price prediction and trends
3. Yield estimation and confidence interval
4. Revenue projections
5. Logistics and processing recommendations
6. Post-harvest handling suggestions`;

    const analysis = await queryAI(prompt, systemPrompt);
    res.json({ analysis, record });
  } catch (err) {
    console.error('Error predicting harvest:', err);
    res.status(500).json({ error: 'Failed to predict harvest' });
  }
});

module.exports = router;
