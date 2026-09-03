const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { generateAndStoreAgreementDoc } = require('../services/googleDocsService');
const { 
  sendBoldSignDocument, 
  getBoldSignDocumentProperties, 
  downloadBoldSignSignedPdf, 
  saveSignedPdfToDisk 
} = require('../services/boldSignService');
const { sendDocumentNotification } = require('../services/notificationService');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const currSymbols = { INR: '₹', USD: '$', AED: 'د.إ', GBP: '£' };

const toPlain = (doc) => {
  if (!doc) return null;
  if (typeof doc.toJSON === 'function') return doc.toJSON();
  return { ...doc };
};

/** Attach linked customer for edit form */
async function attachCustomerToQuote(quote) {
  const plain = toPlain(quote);
  if (!plain) return null;

  const customerId = plain.customer?._id || plain.customer;
  if (customerId) {
    const customerDoc = await Customer.findById(customerId);
    if (customerDoc) {
      const full = toPlain(customerDoc);
      const partial =
        plain.customer && typeof plain.customer === 'object' ? plain.customer : {};
      plain.customer = { ...full, ...partial };
    }
  }

  return plain;
}

/** Resolve SKU codes from product catalog by name */
async function enrichProductLines(lines = []) {
  if (!lines.length) return [];

  const products = await Product.find();
  const codeByName = new Map();
  products.forEach((p) => {
    p.families?.forEach((f) => {
      f.skus?.forEach((s) => {
        if (s.name) codeByName.set(s.name.toLowerCase(), s.code || '');
      });
    });
  });

  return lines.map((line) => ({
    ...line,
    code: line.code || codeByName.get(String(line.name || '').toLowerCase()) || '',
  }));
}

/** Upsert customer by account name; returns unsaved customer document */
async function upsertCustomerFromOrder(body, userId) {
  const customerName = String(body.customerName || '').trim();
  if (!customerName) throw new Error('Customer name is required');

  let customer = await Customer.findOne({
    account: { $regex: new RegExp(`^${escapeRegex(customerName)}$`, 'i') },
  });

  const sym = currSymbols[body.currency] || '$';
  const contact = {
    name: body.pocName,
    email: body.pocEmail,
    phone: body.pocMobile,
    role: body.pocDesignation,
  };

  const fields = {
    account: customerName,
    companyShortName: body.companyShortName || '',
    industry: body.industry || body.orderIndustry || '',
    taxIdType: body.taxIdType || '',
    entity: body.entity || '',
    customerType: body.billTo || 'Direct',
    arr: sym + (body.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    domain: body.skus?.[0]?.domain || body.products?.[0]?.domain || '',
    address: body.orderAddress || '',
    pan: body.orderPan || '',
  };

  if (!customer) {
    customer = new Customer({
      ...fields,
      status: 'Active',
      logo: customerName.charAt(0).toUpperCase(),
      contacts: contact.name ? [contact] : [],
      domains: [],
      quotes: [],
      createdBy: userId,
    });
  } else {
    Object.assign(customer, fields);
    if (contact.name || contact.email) {
      const existingIdx = customer.contacts.findIndex(
        (c) => c.email && contact.email && c.email.toLowerCase() === contact.email.toLowerCase()
      );
      if (existingIdx >= 0) {
        customer.contacts[existingIdx].name = contact.name || customer.contacts[existingIdx].name;
        customer.contacts[existingIdx].phone = contact.phone || customer.contacts[existingIdx].phone;
        customer.contacts[existingIdx].role = contact.role || customer.contacts[existingIdx].role;
      } else if (contact.name) {
        customer.contacts.push(contact);
      }
    }
  }

  return customer;
}

function syncDomainsFromProducts(customer, productLines, body, userName) {
  if (!productLines?.length) return;

  productLines.forEach((sku) => {
    const dName = String(sku.domain || body.domain || '').trim();
    if (!dName) return;

    if (!customer.domains) customer.domains = [];
    const exists = customer.domains.some((d) => d.name.toLowerCase() === dName.toLowerCase());

    if (!exists) {
      customer.domains.push({
        name: dName,
        service: sku.name || 'Cloud Service',
        status: 'Active',
        assignedTo: userName || 'Sales Rep',
        assignedDate: new Date().toISOString(),
      });
    }
  });
}

/** Helper to dispatch Google Docs Copy + batchUpdate + BoldSign Send */
async function processQuoteBoldSignDispatch(quote, req) {
  const googleAccessToken = req.headers['x-google-access-token'] || req.body?.googleAccessToken || req.user?.googleAccessToken || null;
  const docResult = await generateAndStoreAgreementDoc(quote, googleAccessToken);

  quote.status = 'Sent for Signature';
  quote.templateId = docResult.templateId;
  quote.googleDocId = docResult.docId;
  quote.documentUrl = docResult.documentUrl;
  quote.pdfUrl = docResult.pdfUrl;

  const isUAE = quote.entity === 'UAE' || quote.currency === 'AED';
  const adminName = isUAE ? 'Econz' : 'Srikar M';
  const adminEmail = isUAE ? 'shaista.a@econz.net' : 'srikar.m@econz.net';

  try {
    let pdfBuffer = null;
    if (googleAccessToken && docResult.docId && !docResult.docId.includes('_')) {
      try {
        const pdfExportRes = await fetch(`https://www.googleapis.com/drive/v3/files/${docResult.docId}/export?mimeType=application/pdf`, {
          headers: { Authorization: `Bearer ${googleAccessToken}` }
        });
        if (pdfExportRes.ok) {
          const arrayBuf = await pdfExportRes.arrayBuffer();
          pdfBuffer = Buffer.from(arrayBuf);
        }
      } catch (exportErr) {
        console.warn('PDF export notice:', exportErr.message);
      }
    }

    const clientEmail = quote.pocEmail || quote.customer?.contacts?.[0]?.email || 'amarjeet@trynocode.com';
    const clientName = quote.pocName || quote.customer?.contacts?.[0]?.name || quote.customerName || 'Client Signer';

    const boldSignRes = await sendBoldSignDocument({
      title: quote.title || `${quote.refId} Commercial Agreement`,
      message: 'Please review and sign the commercial agreement with Econz.',
      signer_name: clientName,
      signer_email: clientEmail,
      admin_name: adminName,
      admin_email: adminEmail,
      cc_email: quote.ccEmail || '',
      file_url: docResult.pdfUrl,
      fileBuffer: pdfBuffer,
      product_category: quote.templateTitle || quote.template || quote.products?.[0]?.name || '',
      entity: quote.entity || 'India',
      quoteData: quote
    });
    quote.boldSignDocumentId = boldSignRes?.document_id || `BS-${Date.now()}`;
  } catch (bsErr) {
    console.warn('BoldSign dispatch warning:', bsErr.message);
    quote.boldSignDocumentId = `BS-${Date.now()}`;
  }

  await quote.save();

  if (quote.customer) {
    await Customer.updateOne(
      { _id: quote.customer, 'quotes.quoteId': quote._id },
      {
        $set: {
          'quotes.$.status': quote.status,
          'quotes.$.documentUrl': quote.documentUrl,
          'quotes.$.pdfUrl': quote.pdfUrl,
          'quotes.$.boldSignDocumentId': quote.boldSignDocumentId
        },
      }
    );
  }

  return quote;
}

async function syncSingleBoldSignQuote(quote) {
  if (!quote.boldSignDocumentId || quote.boldSignDocumentId.startsWith('BS-')) {
    return quote;
  }

  // Final statuses that cannot change further
  const finalStatuses = ['Completed', 'Declined', 'Revoked', 'Expired', 'Rejected'];
  if (finalStatuses.includes(quote.status) && quote.isSigned) {
    return quote;
  }

  try {
    const props = await getBoldSignDocumentProperties(quote.boldSignDocumentId);
    if (!props || !props.status) return quote;

    const bsStatus = props.status; // 'Completed', 'Signed', 'Declined', 'Revoked', 'Expired', 'Sent', 'InProgress'
    const signers = props.signerDetails || [];
    
    // Find customer signer (order 1 or matching email)
    const customerSigner = signers.find(s =>
      (s.signerEmail && s.signerEmail.toLowerCase() === (quote.pocEmail || '').toLowerCase()) ||
      (s.order === 1)
    ) || signers[0];

    const isCustomerSigned = customerSigner?.status === 'Completed' ||
                             customerSigner?.status === 'Signed' ||
                             bsStatus === 'Completed' ||
                             bsStatus === 'Signed';

    let statusChanged = false;

    if (isCustomerSigned) {
      if (quote.status !== 'Customer Signed' || !quote.isSigned || !quote.signedPdfUrl) {
        quote.status = 'Customer Signed';
        quote.isSigned = true;
        statusChanged = true;

        try {
          const pdfBuffer = await downloadBoldSignSignedPdf(quote.boldSignDocumentId);
          if (pdfBuffer && pdfBuffer.length > 0) {
            const localPdfPath = saveSignedPdfToDisk(quote.refId, pdfBuffer);
            if (localPdfPath) {
              const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
              quote.pdfUrl = `${baseUrl}${localPdfPath}`;
              quote.signedPdfUrl = `${baseUrl}${localPdfPath}`;
            }
          }
        } catch (downloadErr) {
          console.warn('[BoldSign Sync] Signed PDF download notice:', downloadErr.message);
        }
      }
    } else if (bsStatus === 'Declined') {
      if (quote.status !== 'Declined') {
        quote.status = 'Declined';
        statusChanged = true;
      }
    } else if (bsStatus === 'Revoked') {
      if (quote.status !== 'Revoked') {
        quote.status = 'Revoked';
        statusChanged = true;
      }
    } else if (bsStatus === 'Expired') {
      if (quote.status !== 'Expired') {
        quote.status = 'Expired';
        statusChanged = true;
      }
    } else if (bsStatus === 'Sent' || bsStatus === 'InProgress') {
      if (quote.status !== 'Sent for Signature') {
        quote.status = 'Sent for Signature';
        statusChanged = true;
      }
    }

    if (statusChanged) {
      await quote.save();
      if (quote.customer) {
        await Customer.updateOne(
          { _id: quote.customer, 'quotes.quoteId': quote._id },
          {
            $set: {
              'quotes.$.status': quote.status,
              'quotes.$.pdfUrl': quote.pdfUrl,
              'quotes.$.signedPdfUrl': quote.signedPdfUrl
            }
          }
        );
      }
    }
  } catch (err) {
    console.warn(`[BoldSign Sync] Error syncing quote ${quote.refId}:`, err.message);
  }

  return quote;
}

/**
 * Build Quote visibility filter based on user role:
 * - Admin: Show all quotes created by all users.
 * - Manager: Show quotes created by current manager + users reporting to them.
 * - Sales: Show only quotes created by the currently logged-in sales user.
 * - Customer: Show only quotes created by the currently logged-in customer user.
 */
async function buildQuoteVisibilityFilter(user) {
  if (!user) return { _id: null };

  const role = user.role || 'Sales';

  // Admin: Full access to all quotes
  if (role === 'Admin') {
    return {};
  }

  // Manager: Quotes created by this manager + any subordinates assigned/reporting to them
  if (role === 'Manager') {
    const subordinates = await User.find({
      $or: [
        { 'reportingManagers.id': String(user._id) },
        { 'reportingManagers.email': user.email }
      ]
    }).select('_id');

    const allowedUserIds = [user._id, ...subordinates.map(u => u._id)];
    return { createdBy: { $in: allowedUserIds } };
  }

  // Sales: Only quotes created by this sales rep
  if (role === 'Sales') {
    return { createdBy: user._id };
  }

  // Customer: Only quotes created by this customer
  if (role === 'Customer') {
    return { createdBy: user._id };
  }

  // Default fallback for any other role
  return { createdBy: user._id };
}

// GET all quotes
router.get('/', protect, async (req, res) => {
  try {
    const filter = await buildQuoteVisibilityFilter(req.user);

    const quotes = await Quote.find(filter)
      .populate('createdBy', 'name email role')
      .populate('customer', 'account companyShortName industry contacts address pan entity taxIdType customerType domain')
      .sort({ createdAt: -1 });

    // Sync active BoldSign documents in parallel without blocking failures
    await Promise.allSettled(quotes.map(q => syncSingleBoldSignQuote(q)));

    const payloads = await Promise.all(quotes.map(q => attachCustomerToQuote(q)));
    res.json(payloads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single quote
router.get('/:id', protect, async (req, res) => {
  try {
    const visibilityFilter = await buildQuoteVisibilityFilter(req.user);
    const query = { _id: req.params.id, ...visibilityFilter };

    let quote = await Quote.findOne(query)
      .populate('createdBy', 'name email role')
      .populate('customer', 'account companyShortName industry contacts address pan entity taxIdType customerType domain');
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    // Sync single quote on individual view if active
    if (quote.boldSignDocumentId && !quote.boldSignDocumentId.startsWith('BS-')) {
      await syncSingleBoldSignQuote(quote);
    }

    const payload = await attachCustomerToQuote(quote);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create quote: upsert customer → create quote → link quote on customer
router.post('/', protect, async (req, res) => {
  try {
    const rawLines = req.body.products?.length ? req.body.products : req.body.skus || [];
    const productLines = await enrichProductLines(rawLines);

    const customer = await upsertCustomerFromOrder(req.body, req.user._id);

    const requiresApproval = productLines.some((s) => s.requiresApproval);

    let quote = new Quote({
      ...req.body,
      customer: customer._id,
      products: productLines,
      skus: productLines,
      requiresApproval,
      createdBy: req.user._id,
    });
    await quote.save();

    // Auto-dispatch BoldSign if status is 'Sent for Signature'
    if (quote.status === 'Sent for Signature') {
      quote = await processQuoteBoldSignDispatch(quote, req);
    }

    if (!customer.quotes) customer.quotes = [];
    customer.quotes.push({
      quoteId: quote._id,
      refId: quote.refId,
      title: quote.title,
      status: quote.status,
      value: quote.value,
      currency: quote.currency,
      dealType: quote.dealType,
      createdAt: quote.createdAt,
    });

    syncDomainsFromProducts(customer, productLines, req.body, req.user.name);
    await customer.save();

    const populated = await Quote.findById(quote._id)
      .populate('customer', 'account companyShortName')
      .populate('createdBy', 'name email role');

    // Trigger Notification for Quote Creation
    const actorName = req.user?.name || 'A team member';
    sendDocumentNotification({
      type: 'QUOTE_CREATED',
      title: 'New Quote Created',
      message: `Quote #${quote.refId} was created by ${actorName}.`,
      relatedType: 'Quote',
      refId: quote.refId,
      relatedDocId: quote._id,
      actorUser: req.user,
      creatorId: quote.createdBy
    }).catch(err => console.error('[Quote Notification Error]:', err));

    res.status(201).json({ quote: populated, customer });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update quote (full edit or status-only)
router.put('/:id', protect, async (req, res) => {
  try {
    let quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const isFullUpdate =
      req.body.customerName ||
      req.body.products?.length ||
      req.body.skus?.length;

    if (isFullUpdate) {
      const rawLines = req.body.products?.length ? req.body.products : req.body.skus || [];
      const productLines = rawLines.length ? await enrichProductLines(rawLines) : quote.products || [];

      const customer = await upsertCustomerFromOrder(req.body, req.user._id);
      const requiresApproval = productLines.some((s) => s.requiresApproval);

      Object.assign(quote, {
        ...req.body,
        refId: req.body.refId || quote.refId,
        customer: customer._id,
        products: productLines,
        skus: productLines,
        requiresApproval,
      });
      await quote.save();

      // Auto-dispatch BoldSign if updated to 'Sent for Signature'
      if (req.body.status === 'Sent for Signature' || quote.status === 'Sent for Signature') {
        quote = await processQuoteBoldSignDispatch(quote, req);
      }

      const quoteIdx = customer.quotes?.findIndex(
        (q) => String(q.quoteId) === String(quote._id)
      );
      if (quoteIdx >= 0) {
        customer.quotes[quoteIdx].refId = quote.refId;
        customer.quotes[quoteIdx].title = quote.title;
        customer.quotes[quoteIdx].status = quote.status;
        customer.quotes[quoteIdx].value = quote.value;
        customer.quotes[quoteIdx].currency = quote.currency;
        customer.quotes[quoteIdx].dealType = quote.dealType;
      }

      syncDomainsFromProducts(customer, productLines, req.body, req.user.name);
      await customer.save();
    } else {
      Object.assign(quote, req.body);
      await quote.save();

      if (req.body.status === 'Sent for Signature' || quote.status === 'Sent for Signature') {
        quote = await processQuoteBoldSignDispatch(quote, req);
      }

      if (quote.customer && (req.body.status || req.body.value !== undefined)) {
        await Customer.updateOne(
          { _id: quote.customer, 'quotes.quoteId': quote._id },
          {
            $set: {
              'quotes.$.status': quote.status,
              'quotes.$.value': quote.value,
            },
          }
        );
      }
    }

    const populated = await Quote.findById(quote._id)
      .populate('createdBy', 'name email role')
      .populate('customer', 'account companyShortName industry contacts address pan entity taxIdType customerType domain');
    const payload = await attachCustomerToQuote(populated);

    // Trigger Notification for Quote Update
    const actorName = req.user?.name || 'A team member';
    sendDocumentNotification({
      type: 'QUOTE_UPDATED',
      title: 'Quote Updated',
      message: `Quote #${quote.refId} was updated by ${actorName}.`,
      relatedType: 'Quote',
      refId: quote.refId,
      relatedDocId: quote._id,
      actorUser: req.user,
      creatorId: quote.createdBy
    }).catch(err => console.error('[Quote Notification Error]:', err));

    res.json(payload);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route POST /api/quotes/:id/send-boldsign
router.post('/:id/send-boldsign', protect, async (req, res) => {
  try {
    let quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    quote = await processQuoteBoldSignDispatch(quote, req);

    const populated = await Quote.findById(quote._id)
      .populate('createdBy', 'name email role')
      .populate('customer', 'account companyShortName industry contacts address pan entity taxIdType customerType domain');
    const payload = await attachCustomerToQuote(populated);
    res.json({
      success: true,
      message: 'Agreement copied, placeholders replaced, and sent via BoldSign successfully!',
      templateId: quote.templateId,
      googleDocId: quote.googleDocId,
      boldSignDocumentId: quote.boldSignDocumentId,
      documentUrl: quote.documentUrl,
      pdfUrl: quote.pdfUrl,
      quote: payload
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PATCH /api/quotes/:id/status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    let quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const newStatus = req.body.status || 'Sent for Signature';
    quote.status = newStatus;

    if (newStatus === 'Sent for Signature') {
      quote = await processQuoteBoldSignDispatch(quote, req);
    } else {
      await quote.save();
    }

    const populated = await Quote.findById(quote._id)
      .populate('createdBy', 'name email role')
      .populate('customer', 'account companyShortName industry contacts address pan entity taxIdType customerType domain');
    const payload = await attachCustomerToQuote(populated);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE quote (Admin only)
router.delete('/:id', protect, roleCheck('Admin'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (quote?.customer) {
      await Customer.updateOne(
        { _id: quote.customer },
        { $pull: { quotes: { quoteId: quote._id } } }
      );
    }
    await Quote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quote deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/quotes/:id/sync-boldsign
// Checks BoldSign for signature completion and replaces PDF file with signed version
router.post('/:id/sync-boldsign', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    if (!quote.boldSignDocumentId || quote.boldSignDocumentId.startsWith('BS-')) {
      return res.json({ success: false, message: 'No active BoldSign document attached', quote });
    }

    const props = await getBoldSignDocumentProperties(quote.boldSignDocumentId);
    const docStatus = props?.status;

    if (docStatus === 'Completed' || docStatus === 'Signed') {
      quote.status = 'Customer Signed';
      quote.isSigned = true;

      const pdfBuffer = await downloadBoldSignSignedPdf(quote.boldSignDocumentId);
      if (pdfBuffer) {
        const localPdfPath = saveSignedPdfToDisk(quote.refId, pdfBuffer);
        if (localPdfPath) {
          const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
          quote.pdfUrl = `${baseUrl}${localPdfPath}`;
          quote.signedPdfUrl = `${baseUrl}${localPdfPath}`;
        }
      }
      await quote.save();

      if (quote.customer) {
        await Customer.updateOne(
          { _id: quote.customer, 'quotes.quoteId': quote._id },
          {
            $set: {
              'quotes.$.status': quote.status,
              'quotes.$.pdfUrl': quote.pdfUrl,
              'quotes.$.signedPdfUrl': quote.signedPdfUrl
            }
          }
        );
      }
    }

    const populated = await Quote.findById(quote._id)
      .populate('createdBy', 'name email role')
      .populate('customer', 'account companyShortName industry contacts address pan entity taxIdType customerType domain');
    const payload = await attachCustomerToQuote(populated);

    res.json({
      success: true,
      status: quote.status,
      boldSignStatus: docStatus || 'InProgress',
      pdfUrl: quote.pdfUrl,
      quote: payload
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
