const express = require('express');
const router = express.Router();
const { FinancialRecord } = require('../models');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/financial
router.get('/', async (req, res) => {
  try {
    const records = await FinancialRecord.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching financial records:', err);
    res.status(500).json({ error: 'Failed to fetch financial records' });
  }
});

// GET /api/financial/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await FinancialRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Financial record not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching financial record:', err);
    res.status(500).json({ error: 'Failed to fetch financial record' });
  }
});

// POST /api/financial
router.post('/', async (req, res) => {
  try {
    const record = await FinancialRecord.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating financial record:', err);
    res.status(500).json({ error: 'Failed to create financial record' });
  }
});

// PUT /api/financial/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await FinancialRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Financial record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating financial record:', err);
    res.status(500).json({ error: 'Failed to update financial record' });
  }
});

// DELETE /api/financial/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await FinancialRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Financial record not found' });
    await record.destroy();
    res.json({ message: 'Financial record deleted successfully' });
  } catch (err) {
    console.error('Error deleting financial record:', err);
    res.status(500).json({ error: 'Failed to delete financial record' });
  }
});

module.exports = router;
