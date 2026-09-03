const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

const csvPath = path.resolve(__dirname, 'public/signed_contracts/Product list (2).csv');
const content = fs.readFileSync(csvPath, 'utf8');

function parseCSV(text) {
  const p = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    if (c === '"' && inQuotes && next === '"') {
      row[row.length - 1] += '"';
      i++;
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') p.push(row);
  return p;
}

const parsed = parseCSV(content);
const headers = parsed[0].map(h => h.trim());
const rows = parsed.slice(1).filter(r => r.some(cell => cell.trim().length > 0));

console.log(`Parsed ${rows.length} rows from CSV`);

// Build SKUs mapping
const usedCodes = new Set();
function getUniqueCode(code, name, index) {
  let cleanCode = (code || '').trim();
  if (!cleanCode) {
    cleanCode = `SKU-${name.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase().slice(0, 20)}-${index}`;
  }
  let finalCode = cleanCode;
  let counter = 1;
  while (usedCodes.has(finalCode)) {
    finalCode = `${cleanCode}-${counter++}`;
  }
  usedCodes.add(finalCode);
  return finalCode;
}

// Product Containers
const productsMap = {
  'GWS': {
    key: 'GWS',
    name: 'Google Workspace',
    icon: 'mail',
    color: 'red',
    category: 'Productivity',
    familiesMap: {}
  },
  'GCP': {
    key: 'GCP',
    name: 'Google Cloud',
    icon: 'cloud',
    color: 'blue',
    category: 'Infrastructure',
    familiesMap: {}
  },
  'MICROSOFT': {
    key: 'MICROSOFT',
    name: 'Microsoft 365',
    icon: 'layout',
    color: 'indigo',
    category: 'Productivity',
    familiesMap: {}
  },
  'GWS_SERVICES': {
    key: 'GWS_SERVICES',
    name: 'GWS Services & Support',
    icon: 'briefcase',
    color: 'emerald',
    category: 'Services & Support',
    familiesMap: {}
  },
  'APPSHEET': {
    key: 'APPSHEET',
    name: 'AppSheet',
    icon: 'layout',
    color: 'amber',
    category: 'No-Code App',
    familiesMap: {}
  },
  'OTHER': {
    key: 'OTHER',
    name: 'Domains & Other Products',
    icon: 'globe',
    color: 'purple',
    category: 'Domains & Other',
    familiesMap: {}
  }
};

rows.forEach((r, idx) => {
  const rowObj = {};
  headers.forEach((h, i) => {
    rowObj[h] = (r[i] || '').trim();
  });

  const category = rowObj.category || '';
  const subCategory = rowObj.product_sub_category || category || 'General';
  const name = rowObj.name;
  if (!name) return;

  const skuCode = getUniqueCode(rowObj.code, name, idx + 1);
  const priceManually = (rowObj.price_manually || '').trim().toLowerCase() === 'yes' || (rowObj.price_manually || '').trim().toLowerCase() === 'true';

  const sku = {
    name,
    code: skuCode,
    priceManually,
    prices: {
      INR: {
        commit: parseFloat(rowObj.commit_price_inr) || 0,
        flexi: parseFloat(rowObj.flex_price_inr) || 0,
      },
      USD: {
        commit: parseFloat(rowObj.commit_price_usd) || 0,
        flexi: parseFloat(rowObj.flex_price_usd) || 0,
      },
      AED: {
        commit: parseFloat(rowObj.commit_price_uae) || 0,
        flexi: parseFloat(rowObj.flex_price_uae) || 0,
      },
      GBP: {
        commit: parseFloat(rowObj.commit_price_uk) || 0,
        flexi: parseFloat(rowObj.flex_price_uk) || 0,
      }
    }
  };

  // Determine which top-level product this belongs to
  let targetProductKey = 'GWS';
  let targetFamilyName = category || subCategory;

  if (category === 'Google Cloud Plans' || name.toLowerCase().includes('google cloud') || category.toLowerCase().includes('cloud plans')) {
    targetProductKey = 'GCP';
    targetFamilyName = 'Google Cloud Plans';
  } else if (category === 'Microsoft' || name.toLowerCase().startsWith('microsoft') || name.toLowerCase().startsWith('m365') || name.toLowerCase().startsWith('o365') || name.toLowerCase().startsWith('entra') || name.toLowerCase().startsWith('visio') || name.toLowerCase().startsWith('planner') || name.toLowerCase().startsWith('power bi') || name.toLowerCase().startsWith('exchange') || name.toLowerCase().startsWith('onedrive') || name.toLowerCase().startsWith('defender')) {
    targetProductKey = 'MICROSOFT';
    targetFamilyName = 'Microsoft 365 & Apps';
  } else if (category.includes('Professional Services') || category.includes('Support Package')) {
    targetProductKey = 'GWS_SERVICES';
    targetFamilyName = category;
  } else if (name.toLowerCase().includes('appsheet') || category.toLowerCase().includes('appsheet')) {
    targetProductKey = 'APPSHEET';
    targetFamilyName = 'AppSheet Core & Enterprise';
  } else if (category.includes('Domain') || category.includes('Zoho') || name.toLowerCase().includes('zoho') || name.toLowerCase().includes('domain')) {
    targetProductKey = 'OTHER';
    targetFamilyName = category || 'Other Products';
  } else {
    // Google Workspace family
    targetProductKey = 'GWS';
    targetFamilyName = category || 'Google Workspace';
  }

  const prod = productsMap[targetProductKey];
  if (!prod.familiesMap[targetFamilyName]) {
    prod.familiesMap[targetFamilyName] = {
      name: targetFamilyName,
      desc: `${targetFamilyName} plans and license options`,
      skus: []
    };
  }
  prod.familiesMap[targetFamilyName].skus.push(sku);
});

async function importAll() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected');

  // 1. Remove old products
  const deleteResult = await Product.deleteMany({});
  console.log(`Deleted ${deleteResult.deletedCount} old products from database.`);

  // 2. Insert new structured products
  const productsToInsert = Object.values(productsMap)
    .filter(p => Object.keys(p.familiesMap).length > 0)
    .map(p => ({
      key: p.key,
      name: p.name,
      icon: p.icon,
      color: p.color,
      category: p.category,
      families: Object.values(p.familiesMap)
    }));

  let totalSkus = 0;
  for (const prod of productsToInsert) {
    const created = await Product.create(prod);
    const prodSkus = created.families.reduce((acc, f) => acc + f.skus.length, 0);
    totalSkus += prodSkus;
    console.log(`✅ Created Product "${created.name}" [key: ${created.key}] with ${created.families.length} families and ${prodSkus} SKUs`);
  }

  console.log(`\n🎉 Successfully imported ${productsToInsert.length} products with ${totalSkus} total SKUs into MongoDB!`);
  await mongoose.disconnect();
  process.exit(0);
}

importAll().catch(e => {
  console.error('Import error:', e);
  process.exit(1);
});
