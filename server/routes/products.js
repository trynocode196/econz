const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', protect, async (req, res) => {
  try {
    const products = await Product.find().sort({ key: 1 });
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:key', protect, async (req, res) => {
  try {
    const product = await Product.findOne({ key: req.params.key });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:key', protect, roleCheck('Admin'), async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate({ key: req.params.key }, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Add family
router.post('/:key/families', protect, roleCheck('Admin'), async (req, res) => {
  try {
    const product = await Product.findOne({ key: req.params.key });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.families.push(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Add SKU to family
router.post('/:key/families/:famIndex/skus', protect, roleCheck('Admin'), async (req, res) => {
  try {
    const product = await Product.findOne({ key: req.params.key });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.families[parseInt(req.params.famIndex)].skus.push(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Update SKU price
router.put('/:key/families/:famIndex/skus/:skuIndex', protect, roleCheck('Admin'), async (req, res) => {
  try {
    const product = await Product.findOne({ key: req.params.key });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const sku = product.families[parseInt(req.params.famIndex)].skus[parseInt(req.params.skuIndex)];
    Object.assign(sku, req.body);
    product.markModified('families');
    await product.save();
    res.json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
