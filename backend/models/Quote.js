const mongoose = require('mongoose');

const SkuLineSchema = new mongoose.Schema({
  domain: String,
  name: String,
  code: String,
  qty: { type: Number, default: 1 },
  subPlan: { type: String, default: '12 Months' },
  paymentPlan: { type: String, default: 'Yearly' },
  creditLimit: { type: String, default: '30 Days' },
  startDate: String,
  endDate: String,
  renewalDate: String,
  listPrice: Number,
  partnerDiscRate: Number,
  partnerDiscAmt: Number,
  priceAfterPartnerDisc: Number,
  googleDiscPct: Number,
  googleDiscAmt: Number,
  buyPrice: Number,
  sellPrice: Number,
  profit: Number,
  marginPct: Number,
  custDiscPct: Number,
  requiresApproval: { type: Boolean, default: false },
});

const QuoteSchema = new mongoose.Schema({
  refId: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  companyShortName: String,
  taxIdType: String,
  title: String,
  value: { type: Number, default: 0 },
  currency: { type: String, enum: ['INR', 'USD', 'AED', 'GBP'], default: 'USD' },
  dealType: { type: String, enum: ['PSNB', 'BT', 'Renewal'], default: 'PSNB' },
  billTo: {
    type: String,
    enum: ['Direct', 'Reseller', 'Nuclei', 'Agent', 'Customer', 'Partner'],
    default: 'Direct',
  },
  template: String,
  entity: String,
  status: {
    type: String,
    enum: [
      'Draft',
      'Pending Approval',
      'Approved',
      'Sent',
      'Sent for Signature',
      'Signed',
      'Customer Signed',
      'Rejected',
      'Archived',
      'Completed',
      'Lost',
    ],
    default: 'Draft',
  },
  /** Line-item product list for the order */
  products: [SkuLineSchema],
  skus: [SkuLineSchema],
  requiresApproval: { type: Boolean, default: false },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pocName: String,
  pocEmail: String,
  pocMobile: String,
  pocDesignation: String,
  orderAddress: String,
  orderPan: String,
  orderIndustry: String,
  documentExecutionDate: String,
  documentCustomClauses: String,
  documentUrl: String,
  pdfUrl: String,
  googleDocId: String,
  templateId: String,
  boldSignDocumentId: String,
}, { timestamps: true });

QuoteSchema.pre('save', function (next) {
  if (!this.refId) {
    this.refId = 'ORD-' + Date.now().toString().slice(-6);
  }
  if ((!this.products || this.products.length === 0) && this.skus?.length) {
    this.products = this.skus;
  }
  if ((!this.skus || this.skus.length === 0) && this.products?.length) {
    this.skus = this.products;
  }
  next();
});

module.exports = mongoose.model('Quote', QuoteSchema);
