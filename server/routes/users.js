const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', protect, roleCheck('Admin', 'Manager'), async (req, res) => {
  try { res.json(await User.find().select('-password').sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, roleCheck('Admin', 'Manager'), async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email?.toLowerCase()?.trim() });
    if (exists) return res.status(400).json({ message: 'Email already in use' });
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || '',
      designation: req.body.designation || 'Customer Success Account Management Team',
      role: req.body.role || 'Manager',
      status: req.body.status || 'Active',
      accessLevels: req.body.accessLevels || ['Sales Team'],
      reportingManagers: req.body.reportingManagers || [],
      password: req.body.password || 'password'
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', protect, roleCheck('Admin', 'Manager'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (req.body.email && req.body.email.toLowerCase().trim() !== user.email) {
      const exists = await User.findOne({ email: req.body.email.toLowerCase().trim() });
      if (exists && exists._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Email is already in use by another user' });
      }
      user.email = req.body.email.toLowerCase().trim();
    }

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.designation !== undefined) user.designation = req.body.designation;
    if (req.body.status !== undefined) user.status = req.body.status;
    if (req.body.accessLevels !== undefined) user.accessLevels = req.body.accessLevels;
    if (req.body.reportingManagers !== undefined) user.reportingManagers = req.body.reportingManagers;
    if (req.body.password) user.password = req.body.password;

    await user.save();
    res.json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', protect, roleCheck('Admin', 'Manager'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
