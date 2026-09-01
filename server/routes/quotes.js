const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const currSymbols = { INR: '₹', USD: '$', AED: 'د.إ', GBP: '£' };

const toPlain = (doc) => {
  if (!doc) return null;
  if (typeof doc.toJSON === 'function') return doc.toJSON();
  return { ...doc };
};

/** Attach linked customer for edit form (mock DB has no populate) */
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
    if (!sku.domain) return;

    let dom = customer.domains.find((d) => d.name.toLowerCase() === sku.domain.toLowerCase());
    if (!dom) {
      customer.domains.push({
        name: sku.domain,
        product: sku.name?.split(' ')[0] || '',
        status: 'Active',
        segment: 'Corporate',
        opportunities: [],
      });
      dom = customer.domains[customer.domains.length - 1];
    }

    const nextYear = new Date().getFullYear() + 1;
    dom.opportunities.push({
      id: 'RNWL-' + Math.floor(1000 + Math.random() * 9000),
      year: nextYear,
      title: `Order: ${sku.name}`,
      status: 'Forecast',
      value: (parseFloat(sku.sellPrice) || 0) * (parseInt(sku.qty, 10) || 0),
      date: new Date(new Date().setFullYear(nextYear)).toLocaleDateString(),
      skus: [sku],
      createdBy: userName,
      currency: body.currency,
    });
  });
}

// GET all quotes (Documents section — all orders visible)
router.get('/', protect, async (req, res) => {
  try {
    const quotes = await Quote.find()
      .populate('createdBy', 'name email role')
      .populate('customer', 'account companyShortName industry')
      .sort({ createdAt: -1 });

    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single quote (includes customer for edit form)
router.get('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('customer', 'account companyShortName industry contacts address pan entity taxIdType customerType domain');
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

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

    const quote = new Quote({
      ...req.body,
      customer: customer._id,
      products: productLines,
      skus: productLines,
      requiresApproval,
      createdBy: req.user._id,
    });
    await quote.save();

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

    res.status(201).json({ quote: populated, customer });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update quote (full edit or status-only)
router.put('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
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
    res.json(payload);
  } catch (err) {
    res.status(400).json({ message: err.message });
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

module.exports = router;
