const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for logged-in user with unread count
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const userId = req.user._id;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId, isRead: false })
    ]);

    res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all unread notifications as read for logged-in user
 * @access  Private
 */
router.patch('/read-all', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, notification });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete single notification
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

module.exports = router;
