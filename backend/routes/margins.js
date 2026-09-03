const express = require('express');
const router = express.Router();
const Margin = require('../models/Margin');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// GET margins for a specific country or all
router.get('/', protect, async (req, res) => {
  try {
    const country = req.query.country || 'India';
    let margin = await Margin.findOne({ country });
    if (!margin) {
      margin = new Margin({ country, psnb: 12, bt: 3, renewal: 7 });
      await margin.save();
    }
    res.json(margin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update margins
router.put('/', protect, roleCheck('Admin', 'Manager'), async (req, res) => {
  try {
    const country = req.body.country || 'India';
    let margin = await Margin.findOne({ country });
    if (!margin) {
      margin = new Margin({ country });
    }

    if (req.body.psnb !== undefined) margin.psnb = Number(req.body.psnb);
    if (req.body.bt !== undefined) margin.bt = Number(req.body.bt);
    if (req.body.renewal !== undefined) margin.renewal = Number(req.body.renewal);
    if (req.user && req.user._id) margin.updatedBy = req.user._id;

    await margin.save();
    res.json(margin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
