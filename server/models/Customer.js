const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
});

const OpportunitySchema = new mongoose.Schema({
  id: String,
  year: Number,
  title: String,
  status: { type: String, enum: ['Forecast', 'Active', 'Lost', 'Won'], default: 'Forecast' },
  value: Number,
  date: String,
  skus: Array,
  createdBy: String,
  currency: String,
});

const DomainSchema = new mongoose.Schema({
  name: String,
  product: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  segment: String,
  opportunities: [OpportunitySchema],
});

const QuoteRefSchema = new mongoose.Schema({
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  refId: String,
  title: String,
  status: String,
  value: Number,
  currency: String,
  dealType: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const CustomerSchema = new mongoose.Schema({
  account: { type: String, required: true },
  companyShortName: String,
  industry: String,
  taxIdType: String,
  entity: String,
  customerType: {
    type: String,
    enum: ['Direct', 'Reseller', 'Nuclei', 'Agent', 'Customer', 'Partner'],
    default: 'Direct',
  },
  arr: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  logo: String,
  domain: String,
  address: String,
  pan: String,
  contacts: [ContactSchema],
  domains: [DomainSchema],
  quotes: [QuoteRefSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
