const mongoose = require('mongoose');

const CrmDealSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  stage: { type: String, default: 'New Lead' },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  closeDate: { type: String },
  contact: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  company: {
    name: { type: String, default: '' }
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isWon: { type: Boolean, default: false },
  isLost: { type: Boolean, default: false },
  lostReason: { type: String, default: '' },
  stageHistory: [{
    from: String,
    to: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }],
  nextTask: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('CrmDeal', CrmDealSchema);
