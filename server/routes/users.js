const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// @route GET /api/users
router.get('/', protect, roleCheck('Admin', 'Manager'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/users (Create User - Admin/Manager only)
router.post('/', protect, roleCheck('Admin', 'Manager'), async (req, res) => {
  try {
    const { name, email, password, role, entity, phone, designation, status, accessLevels, reportingManagers } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: 'A user with this email address already exists' });
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password || 'password123',
      role: role || 'Sales',
      entity: entity || 'India',
      phone: phone || '',
      designation: designation || 'Customer Success Account Management Team',
      status: status || 'Active',
      accessLevels: accessLevels || ['Sales Team', 'Quotes', 'Customers'],
      reportingManagers: reportingManagers || []
    });

    await user.save();
    res.status(201).json(user.toJSON());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route PUT /api/users/:id
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

    if (req.body.name !== undefined) user.name = req.body.name.trim();
    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.entity !== undefined) user.entity = req.body.entity;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.designation !== undefined) user.designation = req.body.designation;
    if (req.body.status !== undefined) user.status = req.body.status;
    if (req.body.accessLevels !== undefined) user.accessLevels = req.body.accessLevels;
    if (req.body.reportingManagers !== undefined) user.reportingManagers = req.body.reportingManagers;
    
    // If Admin updates password
    if (req.body.password && req.body.password.trim()) {
      user.password = req.body.password.trim();
    }

    await user.save();
    res.json(user.toJSON());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route DELETE /api/users/:id
router.delete('/:id', protect, roleCheck('Admin', 'Manager'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own administrator account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
