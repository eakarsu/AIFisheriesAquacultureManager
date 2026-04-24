const express = require('express');
const router = express.Router();
const { RegulatoryRecord } = require('../models');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');

router.use(auth);

// GET /api/regulatory
router.get('/', async (req, res) => {
  try {
    const records = await RegulatoryRecord.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching regulatory records:', err);
    res.status(500).json({ error: 'Failed to fetch regulatory records' });
  }
});

// GET /api/regulatory/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await RegulatoryRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Regulatory record not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching regulatory record:', err);
    res.status(500).json({ error: 'Failed to fetch regulatory record' });
  }
});

// POST /api/regulatory
router.post('/', async (req, res) => {
  try {
    const record = await RegulatoryRecord.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating regulatory record:', err);
    res.status(500).json({ error: 'Failed to create regulatory record' });
  }
});

// PUT /api/regulatory/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await RegulatoryRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Regulatory record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating regulatory record:', err);
    res.status(500).json({ error: 'Failed to update regulatory record' });
  }
});

// DELETE /api/regulatory/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await RegulatoryRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Regulatory record not found' });
    await record.destroy();
    res.json({ message: 'Regulatory record deleted successfully' });
  } catch (err) {
    console.error('Error deleting regulatory record:', err);
    res.status(500).json({ error: 'Failed to delete regulatory record' });
  }
});

// POST /api/regulatory/:id/check - AI compliance check
router.post('/:id/check', async (req, res) => {
  try {
    const record = await RegulatoryRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Regulatory record not found' });

    const systemPrompt = `You are an expert fisheries and aquaculture regulatory compliance specialist. Analyze regulatory records and provide detailed compliance assessments, risk identification, and remediation strategies based on current aquaculture industry regulations and best practices.`;

    const prompt = `Analyze the following regulatory record and provide a compliance assessment:

Regulation Name: ${record.regulation_name}
Authority: ${record.authority}
Compliance Status: ${record.compliance_status}
Due Date: ${record.due_date}
Description: ${record.description}
Penalty Amount: $${record.penalty_amount}
Category: ${record.category}
Notes: ${record.notes || 'N/A'}

Please provide:
1. Current compliance status assessment
2. Risk level analysis
3. Potential penalties and consequences
4. Remediation steps if non-compliant
5. Timeline for achieving compliance
6. Preventive measures for future compliance`;

    const analysis = await queryAI(prompt, systemPrompt);
    res.json({ analysis, record });
  } catch (err) {
    console.error('Error checking compliance:', err);
    res.status(500).json({ error: 'Failed to check compliance' });
  }
});

module.exports = router;
