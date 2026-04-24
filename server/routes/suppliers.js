const express = require('express');
const router = express.Router();
const { Supplier } = require('../models');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/suppliers
router.get('/', async (req, res) => {
  try {
    const records = await Supplier.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await Supplier.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Supplier not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching supplier:', err);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// POST /api/suppliers
router.post('/', async (req, res) => {
  try {
    const record = await Supplier.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await Supplier.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Supplier not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await Supplier.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Supplier not found' });
    await record.destroy();
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

module.exports = router;
