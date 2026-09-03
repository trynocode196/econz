const mongoose = require('mongoose');

const CrmActivitySchema = new mongoose.Schema({
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrmDeal', required: true },
  type: { type: String, enum: ['note', 'task', 'stage_change', 'email', 'file'], default: 'note' },
  content: { type: String, default: '' },
  taskData: {
    taskType: { type: String, default: 'To do' },
    name: { type: String, default: '' },
    dueDate: { type: String },
    dueTime: { type: String },
    isDone: { type: Boolean, default: false },
    isHighPriority: { type: Boolean, default: false },
    notes: { type: String, default: '' }
  },
  stageData: {
    from: String,
    to: String
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CrmActivity', CrmActivitySchema);
