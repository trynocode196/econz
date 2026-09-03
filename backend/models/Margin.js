const mongoose = require('mongoose');

const MarginSchema = new mongoose.Schema({
  country: { type: String, default: 'India', required: true, unique: true },
  psnb: { type: Number, default: 12 },
  bt: { type: Number, default: 3 },
  renewal: { type: Number, default: 7 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Margin', MarginSchema);
