const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: String,
  icon: { type: String, default: 'file-text' },
  color: { type: String, default: 'brand' },
  entity: { type: String, enum: ['India', 'UAE', 'UK', 'Global'], default: 'India' },
  clauses: [String],
}, { timestamps: true });

module.exports = mongoose.model('Template', TemplateSchema);
