const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', protect, async (req, res) => {
  try { res.json(await Template.find().sort({ createdAt: 1 })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, roleCheck('Admin'), async (req, res) => {
  try {
    const tmpl = new Template(req.body);
    await tmpl.save();
    res.status(201).json(tmpl);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', protect, roleCheck('Admin'), async (req, res) => {
  try {
    const tmpl = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tmpl) return res.status(404).json({ message: 'Template not found' });
    res.json(tmpl);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', protect, roleCheck('Admin'), async (req, res) => {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
