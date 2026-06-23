const express = require('express');
const auth = require('../middleware/auth');
const Record = require('../models/Record');

const router = express.Router();

// GET /api/records - 取得自己的記錄
router.get('/', auth, async (req, res) => {
  try {
    const records = await Record.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/records - 新增
router.post('/', auth, async (req, res) => {
  try {
    const { type, category, amount, note } = req.body;
    if (!type || !category || typeof amount !== 'number') {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const rec = await Record.create({ userId: req.user.id, type, category, amount, note });
    res.json(rec);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/records/:id - 刪除（僅限擁有者）
router.delete('/:id', auth, async (req, res) => {
  try {
    const rec = await Record.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Not found' });
    if (rec.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await rec.remove();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
