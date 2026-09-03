const mongoose = require('mongoose');

const CrmStageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#8A8177' },
  order: { type: Number, default: 0 },
  kind: { type: String, enum: ['open', 'won', 'lost'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('CrmStage', CrmStageSchema);
