const express = require('express');
const router = express.Router();
const { Employee } = require('../models');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/employees
router.get('/', async (req, res) => {
  try {
    const records = await Employee.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/employees/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await Employee.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Employee not found' });
    res.json(record);
  } catch (err) {
    console.error('Error fetching employee:', err);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST /api/employees
router.post('/', async (req, res) => {
  try {
    const record = await Employee.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await Employee.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Employee not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await Employee.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Employee not found' });
    await record.destroy();
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
