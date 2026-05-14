const express = require('express');
const router = express.Router();
const { DiseaseRecord, Pond } = require('../models');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAI, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

router.use(auth);

// Whitelist columns to avoid mass-assignment via Model.create(req.body).
const ALLOWED = [
  'species', 'disease_name', 'pond_id', 'severity', 'symptoms', 'treatment',
  'diagnosis_date', 'status', 'notes', 'image_url',
];
function pick(body) {
  const out = {};
  for (const k of ALLOWED) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

// GET /api/diseases (paginated)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { rows, count } = await DiseaseRecord.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    res.json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 1 },
    });
  } catch (err) {
    console.error('Error fetching disease records:', err);
    res.status(500).json({ error: 'Failed to fetch disease records' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await DiseaseRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Disease record not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching disease record:', err);
    res.status(500).json({ error: 'Failed to fetch disease record' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = pick(req.body);
    data.user_id = req.user?.id || null;
    const record = await DiseaseRecord.create(data);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating disease record:', err);
    res.status(500).json({ error: 'Failed to create disease record' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await DiseaseRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Disease record not found' });
    if (req.user?.role !== 'admin' && record.user_id && record.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await record.update(pick(req.body));
    res.json(record);
  } catch (err) {
    console.error('Error updating disease record:', err);
    res.status(500).json({ error: 'Failed to update disease record' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await DiseaseRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Disease record not found' });
    if (req.user?.role !== 'admin' && record.user_id && record.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await record.destroy();
    res.json({ message: 'Disease record deleted successfully' });
  } catch (err) {
    console.error('Error deleting disease record:', err);
    res.status(500).json({ error: 'Failed to delete disease record' });
  }
});

// POST /api/diseases/:id/diagnose - AI disease diagnosis
router.post('/:id/diagnose', aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const record = await DiseaseRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Disease record not found' });

    const systemPrompt = `You are an expert fish pathologist and aquaculture disease specialist. Respond with STRICT JSON only.`;
    const prompt = `Analyze the following disease record:

Species: ${record.species}
Disease Name: ${record.disease_name}
Pond ID: ${record.pond_id}
Severity: ${record.severity}
Symptoms: ${record.symptoms}
Current Treatment: ${record.treatment || 'None'}
Diagnosis Date: ${record.diagnosis_date}
Status: ${record.status}
Notes: ${record.notes || 'N/A'}

Return JSON of shape:
{
  "diagnosis": "string",
  "progression": "string",
  "treatment_protocol": { "medications": [{ "name": "...", "dosage": "...", "duration": "..." }], "instructions": "..." },
  "containment": "string",
  "pond_impact": "string",
  "prevention": ["string"],
  "monitoring": ["string"]
}`;

    const ai = await queryAI(prompt, systemPrompt);
    const parsed = parseAIJson(ai.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'diseases.diagnose',
      user_id: req.user?.id,
      entity_type: 'disease_record',
      entity_id: record.id,
      input: { species: record.species, symptoms: record.symptoms, severity: record.severity },
      output: parsed,
      raw: ai.content,
      model: ai.model,
      tokens_in: ai.usage?.prompt_tokens || null,
      tokens_out: ai.usage?.completion_tokens || null,
      duration_ms: duration,
    });

    res.json({ analysis: ai.content, parsed, record, model: ai.model });
  } catch (err) {
    console.error('Error diagnosing disease:', err);
    res.status(500).json({ error: 'Failed to diagnose disease' });
  }
});

// POST /api/diseases/cross-pond-risk
router.post('/cross-pond-risk', aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const records = await DiseaseRecord.findAll({ order: [['createdAt', 'DESC']], limit: 50 });
    const ponds = await Pond.findAll();

    const systemPrompt = `You are an aquaculture epidemiologist specializing in fish disease transmission. Respond with STRICT JSON only.`;
    const userMessage = `Analyze cross-pond disease risk:

Ponds: ${JSON.stringify(ponds.map((p) => ({ id: p.id, name: p.name, location: p.location, water_type: p.water_type })))}

Disease Records (last 50):
${records.map((r) => `Pond ${r.pond_id}: ${r.disease_name} (${r.severity}) — Species: ${r.species} — Status: ${r.status}`).join('\n') || 'No disease records'}

Return JSON of shape:
{
  "risk_heatmap": [{ "pond_id": number, "risk_level": "high|medium|low", "active_diseases": ["..."], "transmission_risk": "high|medium|low", "recommended_action": "..." }],
  "transmission_corridors": ["..."],
  "outbreak_probability": "high|medium|low",
  "priority_quarantine_ponds": [number],
  "prevention_measures": ["..."],
  "summary": "..."
}`;

    const ai = await queryAI(userMessage, systemPrompt);
    const parsed = parseAIJson(ai.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'diseases.cross_pond_risk',
      user_id: req.user?.id,
      entity_type: 'disease_record',
      input: { pond_count: ponds.length, record_count: records.length },
      output: parsed,
      raw: ai.content,
      model: ai.model,
      tokens_in: ai.usage?.prompt_tokens || null,
      tokens_out: ai.usage?.completion_tokens || null,
      duration_ms: duration,
    });

    res.json({ analysis: ai.content, parsed });
  } catch (err) {
    console.error('Error generating cross-pond risk:', err);
    res.status(500).json({ error: 'Failed to generate cross-pond risk analysis' });
  }
});

module.exports = router;
