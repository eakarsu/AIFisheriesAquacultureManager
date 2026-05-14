const express = require('express');
const router = express.Router();
const { HarvestPlan, GrowthRecord, Pond } = require('../models');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAI, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

router.use(auth);

const ALLOWED = [
  'species', 'pond_id', 'planned_date', 'estimated_weight_kg',
  'actual_weight_kg', 'market_price', 'status', 'notes',
];
function pick(body) {
  const out = {};
  for (const k of ALLOWED) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

// GET /api/harvest-plans (paginated)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { rows, count } = await HarvestPlan.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    res.json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 1 },
    });
  } catch (err) {
    console.error('Error fetching harvest plans:', err);
    res.status(500).json({ error: 'Failed to fetch harvest plans' });
  }
});

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

router.post('/', async (req, res) => {
  try {
    const record = await HarvestPlan.create(pick(req.body));
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating harvest plan:', err);
    res.status(500).json({ error: 'Failed to create harvest plan' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await HarvestPlan.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Harvest plan not found' });
    await record.update(pick(req.body));
    res.json(record);
  } catch (err) {
    console.error('Error updating harvest plan:', err);
    res.status(500).json({ error: 'Failed to update harvest plan' });
  }
});

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

// POST /api/harvest-plans/:id/predict
router.post('/:id/predict', aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const record = await HarvestPlan.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Harvest plan not found' });

    const systemPrompt = `You are an expert aquaculture harvest planning specialist. Respond with STRICT JSON only.`;
    const prompt = `Analyze the harvest plan and provide predictions:

Species: ${record.species}
Pond ID: ${record.pond_id}
Planned Date: ${record.planned_date}
Estimated Weight: ${record.estimated_weight_kg} kg
Actual Weight: ${record.actual_weight_kg || 'Not yet harvested'} kg
Market Price: $${record.market_price}/kg
Status: ${record.status}
Notes: ${record.notes || 'N/A'}

Return JSON of shape:
{
  "optimal_date": "YYYY-MM-DD",
  "market_price_forecast_per_kg": number,
  "yield_estimate_kg": number,
  "yield_confidence_pct": number,
  "revenue_projection_usd": number,
  "logistics": "string",
  "post_harvest": "string"
}`;

    const ai = await queryAI(prompt, systemPrompt);
    const parsed = parseAIJson(ai.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'harvest_plans.predict',
      user_id: req.user?.id,
      entity_type: 'harvest_plan',
      entity_id: record.id,
      input: { species: record.species, planned_date: record.planned_date },
      output: parsed,
      raw: ai.content,
      model: ai.model,
      tokens_in: ai.usage?.prompt_tokens || null,
      tokens_out: ai.usage?.completion_tokens || null,
      duration_ms: duration,
    });

    res.json({ analysis: ai.content, parsed, record, model: ai.model });
  } catch (err) {
    console.error('Error predicting harvest:', err);
    res.status(500).json({ error: 'Failed to predict harvest' });
  }
});

// POST /api/harvest-plans/optimize-schedule
router.post('/optimize-schedule', aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const [plans, growthRecords, ponds] = await Promise.all([
      HarvestPlan.findAll({ where: { status: 'planned' }, order: [['planned_date', 'ASC']] }),
      GrowthRecord.findAll({ order: [['sample_date', 'DESC']], limit: 30 }),
      Pond.findAll(),
    ]);

    const systemPrompt = `You are an expert aquaculture harvest scheduling specialist. Respond with STRICT JSON only.`;
    const userMessage = `Optimize harvest schedule:

Current Plans: ${JSON.stringify(plans.map((p) => ({ id: p.id, species: p.species, pond_id: p.pond_id, planned_date: p.planned_date, estimated_weight_kg: p.estimated_weight_kg, market_price: p.market_price })))}

Recent Growth Records: ${JSON.stringify(growthRecords.map((g) => ({ species: g.species, pond_id: g.pond_id, avg_weight_g: g.avg_weight_g, survival_rate: g.survival_rate, feed_conversion_ratio: g.feed_conversion_ratio })))}

Ponds: ${JSON.stringify(ponds.map((p) => ({ id: p.id, name: p.name, capacity: p.capacity, current_stock: p.current_stock })))}

Return JSON of shape:
{
  "optimal_schedule": [{ "pond_id": number, "species": "string", "recommended_harvest_date": "YYYY-MM-DD", "estimated_yield_kg": number, "estimated_revenue": number, "confidence": "high|medium|low", "rationale": "string" }],
  "total_estimated_revenue": number,
  "scheduling_conflicts": ["string"],
  "capacity_recommendations": ["string"],
  "summary": "string"
}`;

    const ai = await queryAI(userMessage, systemPrompt);
    const parsed = parseAIJson(ai.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'harvest_plans.optimize_schedule',
      user_id: req.user?.id,
      entity_type: 'harvest_plan',
      input: { plans_count: plans.length, ponds_count: ponds.length },
      output: parsed,
      raw: ai.content,
      model: ai.model,
      tokens_in: ai.usage?.prompt_tokens || null,
      tokens_out: ai.usage?.completion_tokens || null,
      duration_ms: duration,
    });

    res.json({ analysis: ai.content, parsed });
  } catch (err) {
    console.error('Error optimizing harvest schedule:', err);
    res.status(500).json({ error: 'Failed to optimize harvest schedule' });
  }
});

module.exports = router;
