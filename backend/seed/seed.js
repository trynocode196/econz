require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Template = require('../models/Template');
const Quote = require('../models/Quote');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  await User.deleteMany({});
  await Customer.deleteMany({});
  await Product.deleteMany({});
  await Template.deleteMany({});
  await Quote.deleteMany({});

  // Users — use create() so pre-save hook hashes passwords (insertMany skips it)
  await User.create([
    { name: 'Alex Admin', email: 'admin@econz.cloud', password: 'password', role: 'Admin' },
    { name: 'Morgan Manager', email: 'manager@econz.cloud', password: 'password', role: 'Manager' },
    { name: 'Lindsay Smith', email: 'sales@econz.cloud', password: 'password', role: 'Sales' },
  ]);
  console.log('✅ Users seeded');

  // Templates
  await Template.insertMany([
    { name: 'GWS Standard (India)', desc: 'Master agreement for Google Workspace sales in India. Includes GST clauses.', icon: 'file-text', color: 'brand', entity: 'India' },
    { name: 'GCP Enterprise (India)', desc: 'For large GCP commitments in India. Includes SLA and support terms.', icon: 'cloud', color: 'blue', entity: 'India' },
    { name: 'GWS Standard (UAE)', desc: 'UAE-specific Workspace agreement with VAT and DIFC jurisdiction clauses.', icon: 'globe', color: 'emerald', entity: 'UAE' },
    { name: 'GWS Standard (UK)', desc: 'UK-specific Workspace agreement governed by English law.', icon: 'briefcase', color: 'purple', entity: 'UK' },
  ]);
  console.log('✅ Templates seeded');

  // Products
  await Product.insertMany([
    {
      key: 'GWS', name: 'Google Workspace', icon: 'mail', color: 'red', category: 'Productivity',
      families: [
        {
          name: 'Business Starter', desc: 'Entry-level workspace for small teams',
          skus: [
            { name: 'Business Starter - Annual', code: 'GWS-BS-ANN', prices: { INR: { commit: 125, flexi: 150 }, USD: { commit: 6, flexi: 7.2 }, AED: { commit: 22, flexi: 26 }, GBP: { commit: 4.6, flexi: 5.5 } } },
            { name: 'Business Starter - Monthly', code: 'GWS-BS-MON', prices: { INR: { commit: 150, flexi: 180 }, USD: { commit: 7.2, flexi: 8.6 }, AED: { commit: 26, flexi: 32 }, GBP: { commit: 5.5, flexi: 6.6 } } },
          ]
        },
        {
          name: 'Business Standard', desc: 'Advanced features for growing businesses',
          skus: [
            { name: 'Business Standard - Annual', code: 'GWS-BSD-ANN', prices: { INR: { commit: 672, flexi: 806 }, USD: { commit: 12, flexi: 14.4 }, AED: { commit: 44, flexi: 53 }, GBP: { commit: 9.2, flexi: 11 } } },
            { name: 'Business Standard - Monthly', code: 'GWS-BSD-MON', prices: { INR: { commit: 806, flexi: 967 }, USD: { commit: 14.4, flexi: 17.3 }, AED: { commit: 53, flexi: 64 }, GBP: { commit: 11, flexi: 13.2 } } },
          ]
        },
        {
          name: 'Business Plus', desc: 'Premium features with enhanced security',
          skus: [
            { name: 'Business Plus - Annual', code: 'GWS-BP-ANN', prices: { INR: { commit: 1344, flexi: 1613 }, USD: { commit: 18, flexi: 21.6 }, AED: { commit: 66, flexi: 79 }, GBP: { commit: 13.8, flexi: 16.6 } } },
          ]
        },
        {
          name: 'Enterprise', desc: 'Full enterprise suite with advanced controls',
          skus: [
            { name: 'Enterprise Starter', code: 'GWS-ENT-S', prices: { INR: { commit: 1680, flexi: 2016 }, USD: { commit: 20, flexi: 24 }, AED: { commit: 73, flexi: 88 }, GBP: { commit: 15.4, flexi: 18.5 } } },
            { name: 'Enterprise Standard', code: 'GWS-ENT-SD', prices: { INR: { commit: 2688, flexi: 3226 }, USD: { commit: 30, flexi: 36 }, AED: { commit: 110, flexi: 132 }, GBP: { commit: 23, flexi: 27.6 } } },
            { name: 'Enterprise Plus', code: 'GWS-ENT-P', prices: { INR: { commit: 3360, flexi: 4032 }, USD: { commit: 42, flexi: 50.4 }, AED: { commit: 154, flexi: 185 }, GBP: { commit: 32.3, flexi: 38.7 } } },
          ]
        }
      ]
    },
    {
      key: 'GCP', name: 'Google Cloud', icon: 'cloud', color: 'blue', category: 'Infrastructure',
      families: [
        {
          name: 'Committed Use', desc: 'Committed use discounts for predictable workloads',
          skus: [
            { name: 'GCP Committed 1 Year', code: 'GCP-CUD-1Y', prices: { INR: { commit: 8400, flexi: 0 }, USD: { commit: 100, flexi: 0 }, AED: { commit: 367, flexi: 0 }, GBP: { commit: 77, flexi: 0 } } },
            { name: 'GCP Committed 3 Year', code: 'GCP-CUD-3Y', prices: { INR: { commit: 5880, flexi: 0 }, USD: { commit: 70, flexi: 0 }, AED: { commit: 257, flexi: 0 }, GBP: { commit: 54, flexi: 0 } } },
          ]
        },
        {
          name: 'Support Plans', desc: 'Google Cloud support tiers',
          skus: [
            { name: 'Enhanced Support', code: 'GCP-SUP-ENH', prices: { INR: { commit: 42000, flexi: 50400 }, USD: { commit: 500, flexi: 600 }, AED: { commit: 1835, flexi: 2202 }, GBP: { commit: 385, flexi: 462 } } },
            { name: 'Premium Support', code: 'GCP-SUP-PRM', prices: { INR: { commit: 420000, flexi: 504000 }, USD: { commit: 5000, flexi: 6000 }, AED: { commit: 18350, flexi: 22020 }, GBP: { commit: 3850, flexi: 4620 } } },
          ]
        }
      ]
    },
    {
      key: 'AppSheet', name: 'AppSheet', icon: 'layout', color: 'amber', category: 'No-Code App',
      families: [
        {
          name: 'AppSheet Core', desc: 'No-code app building platform',
          skus: [
            { name: 'AppSheet Core', code: 'AS-CORE', prices: { INR: { commit: 420, flexi: 504 }, USD: { commit: 5, flexi: 6 }, AED: { commit: 18.4, flexi: 22 }, GBP: { commit: 3.85, flexi: 4.62 } } },
            { name: 'AppSheet Enterprise', code: 'AS-ENT', prices: { INR: { commit: 1680, flexi: 2016 }, USD: { commit: 20, flexi: 24 }, AED: { commit: 73.4, flexi: 88 }, GBP: { commit: 15.4, flexi: 18.5 } } },
          ]
        }
      ]
    }
  ]);
  console.log('✅ Products seeded');

  // Customers
  await Customer.insertMany([
    {
      account: 'Acme Corp', industry: 'Technology', customerType: 'Reseller',
      arr: '$120,000', status: 'Active', logo: 'A', domain: 'acmecorp.com',
      address: 'San Francisco, CA, USA', pan: 'AAACM1234C',
      contacts: [{ name: 'John Smith', email: 'john@acmecorp.com', phone: '+1-555-0101', role: 'CTO' }],
      domains: [
        { name: 'acmecorp.com', product: 'GWS', status: 'Active', segment: 'Corporate', opportunities: [{ id: 'RNWL-1001', year: 2026, title: 'Auto-Renewal: Business Standard - Annual', status: 'Forecast', value: 14400, date: '1/15/2026', skus: [], createdBy: 'Alex Admin', currency: 'USD' }] },
        { name: 'acme-dev.com', product: 'GCP', status: 'Active', segment: 'Developer', opportunities: [] },
      ],
      createdBy: users[0]._id,
    },
    {
      account: 'TechVentures Ltd', industry: 'Finance', customerType: 'Direct',
      arr: '₹85,00,000', status: 'Active', logo: 'T', domain: 'techventures.in',
      address: 'Mumbai, Maharashtra, India', pan: 'AATPL5678B',
      contacts: [{ name: 'Priya Sharma', email: 'priya@techventures.in', phone: '+91-9876543210', role: 'VP IT' }],
      domains: [
        { name: 'techventures.in', product: 'GWS', status: 'Active', segment: 'Enterprise', opportunities: [{ id: 'RNWL-1002', year: 2026, title: 'Auto-Renewal: Enterprise Standard', status: 'Forecast', value: 1200000, date: '3/1/2026', skus: [], createdBy: 'Lindsay Smith', currency: 'INR' }] },
      ],
      createdBy: users[2]._id,
    },
    {
      account: 'Dubai Dynamics', industry: 'Retail', customerType: 'Partner',
      arr: 'د.إ250,000', status: 'Active', logo: 'D', domain: 'dubaidynamics.ae',
      address: 'Dubai, UAE', pan: '',
      contacts: [{ name: 'Ahmed Al-Rashid', email: 'ahmed@dubaidynamics.ae', phone: '+971-50-1234567', role: 'IT Director' }],
      domains: [
        { name: 'dubaidynamics.ae', product: 'GWS', status: 'Active', segment: 'Corporate', opportunities: [] },
      ],
      createdBy: users[0]._id,
    },
    {
      account: 'GlobalEdge UK', industry: 'Consulting', customerType: 'Direct',
      arr: '£45,000', status: 'Inactive', logo: 'G', domain: 'globaledge.co.uk',
      address: 'London, UK', pan: '',
      contacts: [{ name: 'Sarah Brown', email: 'sarah@globaledge.co.uk', phone: '+44-20-1234567', role: 'CEO' }],
      domains: [],
      createdBy: users[0]._id,
    },
  ]);
  console.log('✅ Customers seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('Login credentials:');
  console.log('  Admin:   admin@econz.cloud   / password');
  console.log('  Manager: manager@econz.cloud / password');
  console.log('  Sales:   sales@econz.cloud   / password');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
