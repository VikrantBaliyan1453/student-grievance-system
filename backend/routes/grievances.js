const express = require('express');
const router = express.Router();
const Grievance = require('../models/Grievance');
const auth = require('../middleware/auth');

// POST /api/grievances — submit
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const grievance = await Grievance.create({ title, description, category, userId: req.user.id });
    res.status(201).json(grievance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/grievances — all (user's own)
router.get('/', auth, async (req, res) => {
  try {
    const grievances = await Grievance.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(grievances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/grievances/search?title=xyz
router.get('/search', auth, async (req, res) => {
  try {
    const { title } = req.query;
    const results = await Grievance.find({
      userId: req.user.id,
      title: { $regex: title, $options: 'i' }
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/grievances/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const grievance = await Grievance.findOne({ _id: req.params.id, userId: req.user.id });
    if (!grievance) return res.status(404).json({ message: 'Not found' });
    res.json(grievance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/grievances/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await Grievance.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/grievances/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Grievance.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;