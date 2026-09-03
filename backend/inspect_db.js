const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected');
  const prods = await Product.find({});
  console.log('Total Products in DB:', prods.length);
  prods.forEach(p => {
    console.log(`\nProduct [key: "${p.key}", name: "${p.name}", icon: "${p.icon}", color: "${p.color}", category: "${p.category}"]`);
    console.log(`  Families count: ${p.families?.length}`);
    p.families?.forEach(f => {
      console.log(`    - Family: "${f.name}" (${f.skus?.length} SKUs)`);
    });
  });
  await mongoose.disconnect();
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
