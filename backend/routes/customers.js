const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// GET all customers with dynamic ARR and quote metrics
router.get('/', protect, async (req, res) => {
  try {
    const [customers, quotes] = await Promise.all([
      Customer.find().sort({ createdAt: -1 }).lean(),
      Quote.find().select('customer customerName value currency status refId title createdAt').lean()
    ]);

    const quotesByCustomerId = new Map();
    const quotesByCustomerName = new Map();

    quotes.forEach(q => {
      if (q.customer) {
        const cId = String(q.customer);
        if (!quotesByCustomerId.has(cId)) quotesByCustomerId.set(cId, []);
        quotesByCustomerId.get(cId).push(q);
      }
      if (q.customerName) {
        const cName = q.customerName.toLowerCase().trim();
        if (!quotesByCustomerName.has(cName)) quotesByCustomerName.set(cName, []);
        quotesByCustomerName.get(cName).push(q);
      }
    });

    const enrichedCustomers = customers.map(c => {
      const cQuotes = quotesByCustomerId.get(String(c._id)) || 
                      quotesByCustomerName.get(String(c.account || '').toLowerCase().trim()) || 
                      [];

      let totalVal = 0;
      let primaryCurr = c.entity === 'UAE' ? 'AED' : c.entity === 'UK' ? 'GBP' : c.entity === 'US' ? 'USD' : 'INR';

      if (cQuotes.length > 0) {
        cQuotes.forEach(q => {
          totalVal += (Number(q.value) || 0);
          if (q.currency) primaryCurr = q.currency;
        });

        const sym = primaryCurr === 'INR' ? '₹' : primaryCurr === 'AED' ? 'د.إ' : primaryCurr === 'GBP' ? '£' : '$';
        c.arr = `${sym}${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        c.totalValue = totalVal;
        c.currency = primaryCurr;
        c.quotesCount = cQuotes.length;
      }

      return c;
    });

    res.json(enrichedCustomers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single customer
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create customer
router.post('/', protect, async (req, res) => {
  try {
    const customer = new Customer({ ...req.body, createdBy: req.user._id });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update customer
router.put('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update domain status
router.put('/:id/domains/:domainName/status', protect, roleCheck('Admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const domain = customer.domains.find(d => d.name === req.params.domainName);
    if (!domain) return res.status(404).json({ message: 'Domain not found' });
    domain.status = req.body.status;
    await customer.save();
    res.json(customer);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT mark opportunity as lost
router.put('/:id/domains/:domainName/opportunities/:oppId/lost', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    const domain = customer.domains.find(d => d.name === req.params.domainName);
    const opp = domain?.opportunities.find(o => o.id === req.params.oppId);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    opp.status = 'Lost';
    await customer.save();
    res.json(customer);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE customer (Admin only)
router.delete('/:id', protect, roleCheck('Admin'), async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
