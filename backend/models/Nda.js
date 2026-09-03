const mongoose = require('mongoose');

const NdaSchema = new mongoose.Schema({
  refId: { type: String, required: true, unique: true },
  entity: { type: String, default: 'India' },
  currency: { type: String, default: 'INR' },
  companyName: { type: String, required: true },
  companyShortName: String,
  gstOrPan: String,
  industry: { type: String, default: 'Information Technology (IT) & Software' },
  companyAddress: String,
  pocName: { type: String, required: true },
  pocEmail: { type: String, required: true },
  pocMobile: String,
  pocDesignation: { type: String, default: 'Project Manager' },
  ccEmail: String,
  adminName: { type: String, default: 'Moby K Babu' },
  adminEmail: { type: String, default: 'shaista.a@econz.net' },
  status: { 
    type: String, 
    enum: ['Draft', 'Sent for Signature', 'Customer Signed', 'Completed', 'Approved', 'Rejected'], 
    default: 'Sent for Signature' 
  },
  googleDocId: String,
  googleDocUrl: String,
  pdfUrl: String,
  docUrl: String,
  boldsignDocumentId: String,
  boldsignStatus: String,
  boldsignResponse: Object,
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creatorEmail: String
}, { timestamps: true });

module.exports = mongoose.model('Nda', NdaSchema);
