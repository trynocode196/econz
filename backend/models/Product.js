const mongoose = require('mongoose');

const SkuSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  priceManually: { type: Boolean, default: false },
  prices: {
    INR: { commit: { type: Number, default: 0 }, flexi: { type: Number, default: 0 } },
    USD: { commit: { type: Number, default: 0 }, flexi: { type: Number, default: 0 } },
    AED: { commit: { type: Number, default: 0 }, flexi: { type: Number, default: 0 } },
    GBP: { commit: { type: Number, default: 0 }, flexi: { type: Number, default: 0 } },
  },
});

const FamilySchema = new mongoose.Schema({
  name: String,
  desc: String,
  skus: [SkuSchema],
});

const ProductSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  name: String,
  icon: String,
  color: String,
  category: String,
  families: [FamilySchema],
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
