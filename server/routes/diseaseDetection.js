const express = require('express');
const router = express.Router();
const { DiseaseRecord } = require('../models');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');

router.use(auth);

// GET /api/diseases
router.get('/', async (req, res) => {
  try {
    const records = await DiseaseRecord.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching disease records:', err);
    res.status(500).json({ error: 'Failed to fetch disease records' });
  }
});

// GET /api/diseases/:id
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

// POST /api/diseases
router.post('/', async (req, res) => {
  try {
    const record = await DiseaseRecord.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating disease record:', err);
    res.status(500).json({ error: 'Failed to create disease record' });
  }
});

// PUT /api/diseases/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await DiseaseRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Disease record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating disease record:', err);
    res.status(500).json({ error: 'Failed to update disease record' });
  }
});

// DELETE /api/diseases/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await DiseaseRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Disease record not found' });
    await record.destroy();
    res.json({ message: 'Disease record deleted successfully' });
  } catch (err) {
    console.error('Error deleting disease record:', err);
    res.status(500).json({ error: 'Failed to delete disease record' });
  }
});

// POST /api/diseases/:id/diagnose - AI disease diagnosis
router.post('/:id/diagnose', async (req, res) => {
  try {
    const record = await DiseaseRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Disease record not found' });

    const systemPrompt = `You are an expert fish pathologist and aquaculture disease specialist. Analyze disease symptoms and records to provide accurate diagnoses, treatment protocols, and prevention strategies for common and uncommon fish diseases in aquaculture settings.`;

    const prompt = `Analyze the following disease record and provide a comprehensive diagnosis and treatment plan:

Species: ${record.species}
Disease Name: ${record.disease_name}
Pond ID: ${record.pond_id}
Severity: ${record.severity}
Symptoms: ${record.symptoms}
Current Treatment: ${record.treatment || 'None'}
Diagnosis Date: ${record.diagnosis_date}
Status: ${record.status}
Notes: ${record.notes || 'N/A'}

Please provide:
1. Detailed disease diagnosis and confirmation
2. Disease progression assessment
3. Recommended treatment protocol (medications, dosages, duration)
4. Quarantine and containment measures
5. Impact on other fish in the pond
6. Prevention strategies for future outbreaks
7. Environmental factors to monitor`;

    const analysis = await queryAI(prompt, systemPrompt);
    res.json({ analysis, record });
  } catch (err) {
    console.error('Error diagnosing disease:', err);
    res.status(500).json({ error: 'Failed to diagnose disease' });
  }
});

module.exports = router;
