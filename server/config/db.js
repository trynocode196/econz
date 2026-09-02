const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Seed Data definition for the mock database
const mockDB = {
  User: [
    { 
      _id: '6655c65f9000000000000001', 
      name: 'Amarjeet', 
      email: 'amarjeetkumar437610@gmail.com', 
      password: 'password', 
      role: 'Manager', 
      phone: '', 
      designation: 'Customer Success Account Management Team', 
      status: 'Active', 
      accessLevels: ['Sales Team', 'Technical Team'], 
      reportingManagers: [] 
    },
    { 
      _id: '6655c65f9000000000000002', 
      name: 'Asmita', 
      email: 'asmita@trynocode.com', 
      password: 'password', 
      role: 'Manager', 
      phone: '', 
      designation: 'Customer Success Account Management Team', 
      status: 'Active', 
      accessLevels: ['Finance Team', 'Customer Success Team'], 
      reportingManagers: [] 
    },
    { 
      _id: '6655c65f9000000000000003', 
      name: 'Pranav S', 
      email: 'pranav.s@econz.net', 
      password: 'password', 
      role: 'Manager', 
      phone: '', 
      designation: 'Customer Success Account Management Team', 
      status: 'Active', 
      accessLevels: ['Technical Team', 'Revenue Operation Team'], 
      reportingManagers: [] 
    },
    { 
      _id: '6655c65f9000000000000004', 
      name: 'Amarjeet', 
      email: 'dev@nocodework.com', 
      password: 'password', 
      role: 'Manager', 
      phone: '', 
      designation: 'Customer Success Account Management Team', 
      status: 'Active', 
      accessLevels: ['Technical Team'], 
      reportingManagers: [] 
    },
    { 
      _id: '6655c65f9000000000000005', 
      name: 'Pranav', 
      email: 'impswaroop@gmail.com', 
      password: 'password', 
      role: 'User', 
      phone: '+919731781817', 
      designation: 'Customer Success Account Management Team', 
      status: 'Active', 
      accessLevels: ['Sales Team'], 
      reportingManagers: [] 
    },
    { 
      _id: '6655c65f9000000000000006', 
      name: 'Er AMARJEET', 
      email: 'ak437610@gmail.com', 
      password: 'password', 
      role: 'Manager', 
      phone: '', 
      designation: 'Customer Success Account Management Team', 
      status: 'Active', 
      accessLevels: ['Sales Team', 'Finance Team', 'Technical Team'], 
      reportingManagers: [] 
    },
    { 
      _id: '6655c65f9000000000000007', 
      name: 'Sagar', 
      email: 'sagar@trynocode.com', 
      password: 'password', 
      role: 'Customer', 
      phone: '+917828654232', 
      designation: 'Customer Success Account Management Team', 
      status: 'Active', 
      accessLevels: ['Sales Team'], 
      reportingManagers: [] 
    },
    { 
      _id: '6655c65f9000000000000008', 
      name: 'Alex Admin', 
      email: 'admin@econz.cloud', 
      password: 'password', 
      role: 'Admin', 
      phone: '+919876543210', 
      designation: 'Chief Technology Officer', 
      status: 'Active', 
      accessLevels: ['Sales Team', 'Finance Team', 'Technical Team', 'Revenue Operation Team'], 
      reportingManagers: [] 
    },
  ],
  Template: [
    { _id: '6655c65f9000000000000004', name: 'GWS Standard (India)', desc: 'Master agreement for Google Workspace sales in India. Includes GST clauses.', icon: 'file-text', color: 'brand', entity: 'India' },
    { _id: '6655c65f9000000000000005', name: 'GCP Enterprise (India)', desc: 'For large GCP commitments in India. Includes SLA and support terms.', icon: 'cloud', color: 'blue', entity: 'India' },
    { _id: '6655c65f9000000000000006', name: 'GWS Standard (UAE)', desc: 'UAE-specific Workspace agreement with VAT and DIFC jurisdiction clauses.', icon: 'globe', color: 'emerald', entity: 'UAE' },
    { _id: '6655c65f9000000000000007', name: 'GWS Standard (UK)', desc: 'UK-specific Workspace agreement governed by English law.', icon: 'briefcase', color: 'purple', entity: 'UK' },
  ],
  Product: [
    {
      _id: '6655c65f9000000000000008',
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
      _id: '6655c65f9000000000000009',
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
      _id: '6655c65f900000000000000a',
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
  ],
  Customer: [
    {
      _id: '6655c65f900000000000000b',
      account: 'Acme Corp', industry: 'Technology', customerType: 'Reseller',
      arr: '$120,000', status: 'Active', logo: 'A', domain: 'acmecorp.com',
      address: 'San Francisco, CA, USA', pan: 'AAACM1234C',
      contacts: [{ name: 'John Smith', email: 'john@acmecorp.com', phone: '+1-555-0101', role: 'CTO' }],
      domains: [
        { name: 'acmecorp.com', product: 'GWS', status: 'Active', segment: 'Corporate', opportunities: [{ id: 'RNWL-1001', year: 2026, title: 'Auto-Renewal: Business Standard - Annual', status: 'Forecast', value: 14400, date: '1/15/2026', skus: [], createdBy: 'Alex Admin', currency: 'USD' }] },
        { name: 'acme-dev.com', product: 'GCP', status: 'Active', segment: 'Developer', opportunities: [] },
      ],
      createdBy: '6655c65f9000000000000001'
    },
    {
      _id: '6655c65f900000000000000c',
      account: 'TechVentures Ltd', industry: 'Finance', customerType: 'Direct',
      arr: '₹85,00,000', status: 'Active', logo: 'T', domain: 'techventures.in',
      address: 'Mumbai, Maharashtra, India', pan: 'AATPL5678B',
      contacts: [{ name: 'Priya Sharma', email: 'priya@techventures.in', phone: '+91-9876543210', role: 'VP IT' }],
      domains: [
        { name: 'techventures.in', product: 'GWS', status: 'Active', segment: 'Enterprise', opportunities: [{ id: 'RNWL-1002', year: 2026, title: 'Auto-Renewal: Enterprise Standard', status: 'Forecast', value: 1200000, date: '3/1/2026', skus: [], createdBy: 'Lindsay Smith', currency: 'INR' }] },
      ],
      createdBy: '6655c65f9000000000000003'
    },
    {
      _id: '6655c65f900000000000000d',
      account: 'Dubai Dynamics', industry: 'Retail', customerType: 'Partner',
      arr: 'د.إ250,000', status: 'Active', logo: 'D', domain: 'dubaidynamics.ae',
      address: 'Dubai, UAE', pan: '',
      contacts: [{ name: 'Ahmed Al-Rashid', email: 'ahmed@dubaidynamics.ae', phone: '+971-50-1234567', role: 'IT Director' }],
      domains: [
        { name: 'dubaidynamics.ae', product: 'GWS', status: 'Active', segment: 'Corporate', opportunities: [] },
      ],
      createdBy: '6655c65f9000000000000001'
    },
    {
      _id: '6655c65f900000000000000e',
      account: 'GlobalEdge UK', industry: 'Consulting', customerType: 'Direct',
      arr: '£45,000', status: 'Inactive', logo: 'G', domain: 'globaledge.co.uk',
      address: 'London, UK', pan: '',
      contacts: [{ name: 'Sarah Brown', email: 'sarah@globaledge.co.uk', phone: '+44-20-1234567', role: 'CEO' }],
      domains: [],
      createdBy: '6655c65f9000000000000001'
    }
  ],
  Quote: [
    {
      _id: '6655c65f9000000000000010',
      refId: 'ORD-23128404',
      customerName: 'Trynocode',
      title: 'GWS New',
      value: 2360,
      currency: 'INR',
      status: 'Approved',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-08-27T10:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Business Starter - Annual', code: 'GWS-BS-ANN', qty: 10, listPrice: 150, sellPrice: 125, profit: 25, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000011',
      refId: 'ORD-63401216',
      customerName: 'Trynocode',
      title: 'GWS New',
      value: 0,
      currency: 'INR',
      status: 'Pending Approval',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-07-03T10:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Business Standard - Monthly', code: 'GWS-BSD-MON', qty: 5, listPrice: 806, sellPrice: 672, profit: 134, subPlan: 'Monthly' }]
    },
    {
      _id: '6655c65f9000000000000012',
      refId: 'ORD-84967738',
      customerName: 'Trynocode UAE',
      title: 'GWS New',
      value: 360.25,
      currency: 'AED',
      status: 'Approved',
      dealType: 'PSNB',
      billTo: 'Partner',
      createdAt: new Date('2026-07-01T10:00:00Z'),
      createdBy: '6655c65f9000000000000008',
      products: [{ name: 'Business Starter - Annual', code: 'GWS-BS-ANN', qty: 15, listPrice: 26, sellPrice: 22, profit: 4, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000013',
      refId: 'ORD-13025127',
      customerName: 'Trynocode UAE',
      title: 'GWS New',
      value: 5740.00,
      currency: 'AED',
      status: 'Approved',
      dealType: 'PSNB',
      billTo: 'Partner',
      createdAt: new Date('2026-06-30T10:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Enterprise Standard', code: 'GWS-ENT-SD', qty: 50, listPrice: 132, sellPrice: 110, profit: 22, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000014',
      refId: 'ORD-40740250',
      customerName: 'Trynocode',
      title: 'GWS New',
      value: 4130.00,
      currency: 'INR',
      status: 'Approved',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-06-29T10:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Business Standard - Annual', code: 'GWS-BSD-ANN', qty: 6, listPrice: 806, sellPrice: 672, profit: 134, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000015',
      refId: 'ORD-62683669',
      customerName: 'nocodework',
      title: 'GWS New',
      value: 17700.00,
      currency: 'INR',
      status: 'Approved',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-06-26T10:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Business Plus - Annual', code: 'GWS-BP-ANN', qty: 12, listPrice: 1613, sellPrice: 1344, profit: 269, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000016',
      refId: 'ORD 03502963',
      customerName: 'nocodework',
      title: 'GWS New',
      value: 4720.00,
      currency: 'INR',
      status: 'Pending Approval',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-06-26T09:30:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Business Starter - Annual', code: 'GWS-BS-ANN', qty: 25, listPrice: 150, sellPrice: 125, profit: 25, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000017',
      refId: 'ORD 31977811',
      customerName: 'Trynocode',
      title: 'GWS New',
      value: 24780.00,
      currency: 'INR',
      status: 'Approved',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-06-26T08:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Enterprise Standard', code: 'GWS-ENT-SD', qty: 8, listPrice: 3226, sellPrice: 2688, profit: 538, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000018',
      refId: 'ORD-70552641',
      customerName: 'Trynocode',
      title: 'GWS New',
      value: 5192.00,
      currency: 'INR',
      status: 'Pending Approval',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-06-24T10:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Business Standard - Annual', code: 'GWS-BSD-ANN', qty: 7, listPrice: 806, sellPrice: 672, profit: 134, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000019',
      refId: 'ORD-96816207',
      customerName: 'Trynocode',
      title: 'GWS New',
      value: 2124.00,
      currency: 'INR',
      status: 'Approved',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-06-16T10:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Business Starter - Annual', code: 'GWS-BS-ANN', qty: 9, listPrice: 150, sellPrice: 125, profit: 25, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000030',
      refId: 'ORD-8130',
      customerName: 'TRYNOCODE',
      title: 'Signed Order Form',
      value: 2301.00,
      currency: 'INR',
      status: 'Sent for Signature',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-05-29T10:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Google Workspace Starter', code: 'GWS-BS-ANN', qty: 10, listPrice: 150, sellPrice: 125, profit: 25, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000031',
      refId: 'ORD-5157',
      customerName: 'TRYNOCODE',
      title: 'Signed Order Form',
      value: 75000.00,
      currency: 'AED',
      status: 'Sent for Signature',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-05-29T11:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Google Cloud Platform Commitment', code: 'GCP-CUD-1Y', qty: 1, listPrice: 84000, sellPrice: 75000, profit: 9000, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000032',
      refId: 'ORD-2069',
      customerName: 'TRYNOCODE',
      title: 'Signed Order Form',
      value: 3200.00,
      currency: 'INR',
      status: 'Sent for Signature',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-05-29T12:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Business Standard', code: 'GWS-BSD-ANN', qty: 5, listPrice: 806, sellPrice: 672, profit: 134, subPlan: '12 Months' }]
    },
    {
      _id: '6655c65f9000000000000033',
      refId: 'ORD-3171',
      customerName: 'TRYNOCODE',
      title: 'Signed Order Form',
      value: 27600.00,
      currency: 'INR',
      status: 'Sent for Signature',
      dealType: 'PSNB',
      billTo: 'Direct',
      createdAt: new Date('2026-05-29T13:00:00Z'),
      createdBy: '6655c65f9000000000000001',
      products: [{ name: 'Business Plus', code: 'GWS-BP-ANN', qty: 20, listPrice: 1613, sellPrice: 1344, profit: 269, subPlan: '12 Months' }]
    },
  ],
  Margin: [
    { _id: '6655c65f9000000000000020', country: 'India', psnb: 12, bt: 3, renewal: 7 },
    { _id: '6655c65f9000000000000021', country: 'UAE', psnb: 15, bt: 5, renewal: 8 },
    { _id: '6655c65f9000000000000022', country: 'UK', psnb: 10, bt: 4, renewal: 6 },
    { _id: '6655c65f9000000000000023', country: 'USA', psnb: 14, bt: 4, renewal: 8 }
  ],
  CrmStage: [
    { _id: '6655c65f9000000000000040', name: 'New Lead', color: '#8A8177', order: 0, kind: 'open' },
    { _id: '6655c65f9000000000000041', name: 'First Email Sent', color: '#2AA9C4', order: 1, kind: 'open' },
    { _id: '6655c65f9000000000000042', name: 'Meeting Scheduled', color: '#8B5CF6', order: 2, kind: 'open' },
    { _id: '6655c65f9000000000000043', name: 'Meeting done', color: '#4C6FE7', order: 3, kind: 'open' },
    { _id: '6655c65f9000000000000044', name: 'Quotation sent', color: '#E8A23D', order: 4, kind: 'open' },
    { _id: '6655c65f9000000000000045', name: 'In negotiation', color: '#3B5BDB', order: 5, kind: 'open' },
    { _id: '6655c65f9000000000000046', name: 'Won', color: '#1F8A4C', order: 6, kind: 'won' },
    { _id: '6655c65f9000000000000047', name: 'Lost', color: '#D84A5B', order: 7, kind: 'lost' },
  ],
  CrmDeal: [
    {
      _id: '6655c65f9000000000000050',
      name: 'Acme Corp Cloud Expansion',
      stage: 'New Lead',
      amount: 45000,
      currency: 'USD',
      closeDate: '2026-10-15',
      contact: { name: 'John Smith', email: 'john@acmecorp.com', phone: '+1-555-0101' },
      company: { name: 'Acme Corp' },
      owner: '6655c65f9000000000000001',
      isWon: false,
      isLost: false,
      createdAt: new Date('2026-08-20T10:00:00Z')
    },
    {
      _id: '6655c65f9000000000000051',
      name: 'TechVentures Google Workspace Enterprise',
      stage: 'First Email Sent',
      amount: 18000,
      currency: 'USD',
      closeDate: '2026-09-30',
      contact: { name: 'Priya Sharma', email: 'priya@techventures.in' },
      company: { name: 'TechVentures Ltd' },
      owner: '6655c65f9000000000000001',
      isWon: false,
      isLost: false,
      createdAt: new Date('2026-08-22T10:00:00Z')
    },
    {
      _id: '6655c65f9000000000000052',
      name: 'Dubai Dynamics Infrastructure Migration',
      stage: 'Meeting Scheduled',
      amount: 65000,
      currency: 'USD',
      closeDate: '2026-11-01',
      contact: { name: 'Ahmed Al-Rashid', email: 'ahmed@dubaidynamics.ae' },
      company: { name: 'Dubai Dynamics' },
      owner: '6655c65f9000000000000001',
      isWon: false,
      isLost: false,
      createdAt: new Date('2026-08-25T10:00:00Z')
    },
    {
      _id: '6655c65f9000000000000053',
      name: 'GlobalEdge UK Security & Archiving',
      stage: 'Quotation sent',
      amount: 22000,
      currency: 'USD',
      closeDate: '2026-09-15',
      contact: { name: 'Sarah Brown', email: 'sarah@globaledge.co.uk' },
      company: { name: 'GlobalEdge UK' },
      owner: '6655c65f9000000000000001',
      isWon: false,
      isLost: false,
      createdAt: new Date('2026-08-15T10:00:00Z')
    },
    {
      _id: '6655c65f9000000000000054',
      name: 'Trynocode Annual AppSheet Licensing',
      stage: 'Won',
      amount: 32000,
      currency: 'USD',
      closeDate: '2026-08-28',
      contact: { name: 'Pranav', email: 'impswaroop@gmail.com' },
      company: { name: 'Trynocode' },
      owner: '6655c65f9000000000000001',
      isWon: true,
      isLost: false,
      createdAt: new Date('2026-08-01T10:00:00Z')
    }
  ],
  CrmActivity: []
};

// Helper function to match mongodb-like queries in memory
function matchQuery(item, query) {
  if (!query) return true;
  for (let key in query) {
    let val = query[key];
    if (val === undefined) continue;

    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof RegExp)) {
      if (val.$regex) {
        let regex = val.$regex instanceof RegExp ? val.$regex : new RegExp(val.$regex, 'i');
        if (!regex.test(item[key])) return false;
      }
    } else if (val instanceof RegExp) {
      if (!val.test(item[key])) return false;
    } else if (typeof val === 'string' && typeof item[key] === 'string') {
      if (item[key].toLowerCase() !== val.toLowerCase()) return false;
    } else {
      let itemVal = String(item[key]);
      let queryVal = String(val);
      if (itemVal !== queryVal) return false;
    }
  }
  return true;
}

/** Wrap in-memory records so findOne/findById return objects with .save() like Mongoose documents */
function wrapMockDocument(modelName, data) {
  if (!data) return null;

  const doc = { ...data };
  const modified = new Set();

  doc.isModified = function(field) {
    if (!field) return modified.size > 0;
    return modified.has(field);
  };

  doc.markModified = function(field) {
    modified.add(field);
  };

  doc.save = async function() {
    let results = mockDB[modelName] || [];

    if (modelName === 'User' && (modified.has('password') || this.password)) {
      const plain = !String(this.password || '').startsWith('$2');
      if (plain) {
        this.password = await bcrypt.hash(this.password, 12);
      }
    }

    let item = { ...this };
    if (!item._id) {
      item._id = new mongoose.Types.ObjectId().toString();
      this._id = item._id;
    }

    const idx = results.findIndex((r) => String(r._id) === String(item._id));
    if (idx !== -1) {
      results[idx] = { ...results[idx], ...item };
      Object.assign(this, results[idx]);
    } else {
      results.push(item);
      Object.assign(this, item);
    }

    modified.clear();
    return this;
  };

  if (modelName === 'User') {
    doc.comparePassword = async function(cand) {
      if (cand === this.password) return true;
      try {
        return await bcrypt.compare(cand, this.password);
      } catch {
        return false;
      }
    };
    doc.toJSON = function() {
      const obj = { ...this };
      delete obj.password;
      delete obj.save;
      delete obj.isModified;
      delete obj.markModified;
      delete obj.comparePassword;
      return obj;
    };
  }

  return doc;
}

function setupMockDB() {
  // Pre-load all schemas to compile models in Mongoose
  require('../models/User');
  require('../models/Customer');
  require('../models/Product');
  require('../models/Template');
  require('../models/Quote');
  require('../models/Margin');
  require('../models/CrmDeal');
  require('../models/CrmStage');
  require('../models/CrmActivity');

  const models = ['User', 'Customer', 'Product', 'Template', 'Quote', 'Margin', 'CrmDeal', 'CrmStage', 'CrmActivity'];

  models.forEach(modelName => {
    const Model = mongoose.model(modelName);

    Model.find = function(query) {
      let results = [...(mockDB[modelName] || [])];
      if (query) {
        results = results.filter(item => matchQuery(item, query));
      }
      
      const mockQuery = {
        sort: function(sortOpts) {
          if (sortOpts && typeof sortOpts === 'object') {
            const field = Object.keys(sortOpts)[0];
            const order = sortOpts[field];
            results.sort((a, b) => {
              if (a[field] < b[field]) return -order;
              if (a[field] > b[field]) return order;
              return 0;
            });
          }
          return this;
        },
        select: function() { return this; },
        populate: function() { return this; },
        then: function(resolve) { resolve(results); },
        catch: function(reject) {},
      };
      mockQuery[Symbol.toStringTag] = 'Promise';
      return mockQuery;
    };

    Model.findOne = function(query) {
      let results = mockDB[modelName] || [];
      const raw = results.find(item => matchQuery(item, query)) || null;
      const found = wrapMockDocument(modelName, raw);

      const mockQuery = {
        select: function() { return this; },
        populate: function() { return this; },
        then: function(resolve) { resolve(found); },
        catch: function(reject) {},
      };
      mockQuery[Symbol.toStringTag] = 'Promise';
      return mockQuery;
    };

    Model.findById = function(id) {
      let results = mockDB[modelName] || [];
      const raw = results.find(item => String(item._id) === String(id)) || null;
      let doc = raw ? { ...raw } : null;

      const mockQuery = {
        select: function() { return this; },
        populate: function(path) {
          const pathName = typeof path === 'string' ? path : path?.path;
          if (!doc || !pathName) return this;

          if (modelName === 'Quote' && pathName === 'customer' && doc.customer) {
            const custId = doc.customer._id || doc.customer;
            const custRaw = (mockDB.Customer || []).find((c) => String(c._id) === String(custId));
            if (custRaw) doc.customer = { ...custRaw };
          }
          if (pathName === 'createdBy' && doc.createdBy) {
            const userId = doc.createdBy._id || doc.createdBy;
            const userRaw = (mockDB.User || []).find((u) => String(u._id) === String(userId));
            if (userRaw) doc.createdBy = { ...userRaw };
          }
          return this;
        },
        then: function(resolve) {
          resolve(wrapMockDocument(modelName, doc));
        },
        catch: function(reject) {},
      };
      mockQuery[Symbol.toStringTag] = 'Promise';
      return mockQuery;
    };

    Model.findByIdAndUpdate = function(id, update, options) {
      let results = mockDB[modelName] || [];
      let idx = results.findIndex(item => String(item._id) === String(id));
      let found = null;
      if (idx !== -1) {
        results[idx] = { ...results[idx], ...update };
        found = results[idx];
      }
      const mockQuery = {
        then: function(resolve) { resolve(found); },
        catch: function(reject) {},
      };
      mockQuery[Symbol.toStringTag] = 'Promise';
      return mockQuery;
    };

    Model.findOneAndUpdate = function(query, update, options) {
      let results = mockDB[modelName] || [];
      let found = results.find(item => matchQuery(item, query));
      if (found) {
        Object.assign(found, update);
      }
      const mockQuery = {
        then: function(resolve) { resolve(found); },
        catch: function(reject) {},
      };
      mockQuery[Symbol.toStringTag] = 'Promise';
      return mockQuery;
    };

    Model.findByIdAndDelete = function(id) {
      let results = mockDB[modelName] || [];
      let idx = results.findIndex(item => String(item._id) === String(id));
      let found = null;
      if (idx !== -1) {
        found = results.splice(idx, 1)[0];
      }
      const mockQuery = {
        then: function(resolve) { resolve(found); },
        catch: function(reject) {},
      };
      mockQuery[Symbol.toStringTag] = 'Promise';
      return mockQuery;
    };

    Model.insertMany = async function(arr) {
      let results = mockDB[modelName] || [];
      const instances = [];
      for (let data of arr) {
        let item = { ...data };
        if (!item._id) {
          item._id = new mongoose.Types.ObjectId().toString();
        }
        if (!item.createdAt) {
          item.createdAt = new Date();
        }
        item.updatedAt = new Date();
        results.push(item);
        instances.push(item);
      }
      return instances;
    };

    Model.deleteMany = async function() {
      mockDB[modelName] = [];
      return { deletedCount: 0 };
    };

    Model.prototype.save = async function() {
      try {
        await this.validate();
      } catch (err) {
        throw err;
      }
      
      let results = mockDB[modelName] || [];
      
      if (modelName === 'User' && this.isModified && this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
      }
      
      if (!this.createdAt) {
        this.createdAt = new Date();
      }
      this.updatedAt = new Date();
      
      let item = this.toObject();
      if (!item._id) {
        item._id = new mongoose.Types.ObjectId().toString();
        this._id = item._id;
      }
      
      item.createdAt = this.createdAt;
      item.updatedAt = this.updatedAt;
      
      let idx = results.findIndex(r => String(r._id) === String(item._id));
      if (idx !== -1) {
        results[idx] = { ...results[idx], ...item };
      } else {
        results.push(item);
      }
      return this;
    };
  });
}

let lastError = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // fail fast in 5 seconds to fallback to mock database
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    lastError = error.message;
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.log('⚠️ Entering In-Memory Mock Database Mode...');
    setupMockDB();
  }
};

connectDB.getLastError = () => lastError;

module.exports = connectDB;
