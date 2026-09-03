const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'QUOTE_CREATED',
      'QUOTE_UPDATED',
      'NDA_CREATED',
      'NDA_UPDATED',
      'GENERAL'
    ],
    required: true,
    default: 'GENERAL'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedType: {
    type: String,
    enum: ['Quote', 'Nda', 'Customer', 'User', 'General'],
    default: 'General'
  },
  relatedDocId: {
    type: mongoose.Schema.Types.ObjectId
  },
  refId: {
    type: String,
    default: ''
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actorName: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
