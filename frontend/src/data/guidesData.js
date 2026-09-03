/**
 * Comprehensive Step-by-Step Guides for All Sections of Econz Orbit
 */

export const SECTION_GUIDES = {
  nda: {
    sectionId: 'nda',
    sectionTitle: 'NDA Repository',
    steps: [
      {
        title: 'Centralized NDA Document Repository',
        subtitle: 'Overview & Document Management',
        content: `The NDA module centralizes all Non-Disclosure Agreements created across your organization. It allows you to monitor agreement statuses, track electronic signatures via BoldSign, and download PDF or Google Docs copies anytime.`,
        bullets: [
          'Live Status Tracking — instantly view if an NDA is "Sent for Signature", "Customer Signed", or "Completed".',
          'Instant Search — filter NDAs by reference ID, customer company name, POC email, or creator.',
          '+ Create NDA — launch the order flow to issue a new Mutual Non-Disclosure Agreement.'
        ]
      },
      {
        title: 'Real-Time Signature Progress',
        subtitle: 'Dual-Party Electronic Signing Workflow',
        content: `Every NDA follows a strict 2-step electronic signature sequence via BoldSign with email OTP authentication.`,
        bullets: [
          'Step 1 (Client Signer) — The customer receives an email with an OTP to review and sign Page 5.',
          'Step 2 (Econz Authority) — Once the client signs, the status automatically updates to "Customer Signed" and routes to Econz Management.',
          'Completed State — Once both parties sign, the status updates to "Completed" and the finalized signed agreement PDF is generated.'
        ]
      },
      {
        title: 'Action Controls & File Downloads',
        subtitle: 'Quick actions for each agreement',
        content: `Each row in the table provides quick action buttons to manage and access the agreement:`,
        bullets: [
          'PDF Download — view or download the legally formatted 5-page PDF document.',
          'DOC Download — open the generated Google Doc file directly in your browser.',
          'Signature Reminder — trigger an instant email reminder to the client signer if pending.'
        ]
      }
    ]
  },

  createNda: {
    sectionId: 'create-nda',
    sectionTitle: 'Create NDA',
    steps: [
      {
        title: 'Deal Settings & Currency Selection',
        subtitle: 'Configure Entity & Currency',
        content: `Start by selecting the operating Econz entity and transaction currency. Selecting an existing account will automatically pre-fill customer profile details.`,
        bullets: [
          'Search Accounts — auto-fills company name, short name, address, tax ID, and signing authority.',
          'Econz Entity — choose India (IN), UAE (AE), United Kingdom (GB), or United States (US).',
          'Currency — select INR, AED, GBP, or USD.'
        ]
      },
      {
        title: 'Customer KYC & Tax Identification',
        subtitle: 'PAN, GST, or VAT Verification',
        content: `Enter and verify the customer\'s legal identification. For Indian entities, you can toggle between PAN and GST and run live KYC validation.`,
        bullets: [
          'PAN / GST Toggle — seamlessly switch between PAN (10-digit) and GST (15-digit) verification.',
          'Live Verification — verify registered business name and legal address directly from the tax portal.',
          'Industry Selector — choose or type industry classification with intelligent autocomplete.'
        ]
      },
      {
        title: 'Signing Authority & Notification',
        subtitle: 'POC Details & Multi-recipient CC',
        content: `Specify the authorized signatory who will receive and execute the electronic signature via BoldSign.`,
        bullets: [
          'POC Full Name & Email — primary signatory who will receive the Email OTP signature request.',
          'International Phone Input — select country dial code with flag dropdown and mobile number.',
          'Designation Autocomplete — type-ahead suggestions for executive roles (Director, CEO, VP, Project Manager).',
          'CC Email Recipients — add multiple internal or client emails to receive completion notifications.'
        ]
      },
      {
        title: 'Google Docs & BoldSign Dispatch',
        subtitle: 'Automated templating & signature dispatch',
        content: `Clicking "Generate & Send NDA" executes the complete automated generation pipeline:`,
        bullets: [
          'Template Copying — copies master Google Doc template (1bFHpf1GH-fYX882YUfGJY_LCYTKEgHaVs6I7FCDPztk).',
          'Parameter Replacement — injects agreement number, company name, address, GST/PAN, industry, and signer names.',
          'BoldSign Multipart Dispatch — uploads the document with Page 5 signature coordinates and initiates signer workflows.'
        ]
      }
    ]
  },

  quotes: {
    sectionId: 'quotes',
    sectionTitle: 'Quotes & Agreements',
    steps: [
      {
        title: 'Commercial Quotes Dashboard',
        subtitle: 'Manage Sales Contracts & GWS Proposals',
        content: `The Quotes dashboard gives your team complete visibility over all sales proposals, contract terms, SKU pricing, and deal values.`,
        bullets: [
          'Live Status Indicators — filter by Draft, Under Review, Sent for Signature, Customer Signed, or Approved.',
          'Value Breakdown — inspect annualized contract values (ARR), SKU volumes, and applicable taxes.',
          'Quick Search — locate any proposal by Reference ID, Account name, or Sales Owner.'
        ]
      },
      {
        title: 'Contract Preview & Actions',
        subtitle: 'Inspection, Edits, and Reminders',
        content: `Manage individual commercial agreements with intuitive one-click tools:`,
        bullets: [
          'Document Preview — inspect the complete 12-page legal agreement with SKU pricing tables and Google Cloud annexures.',
          'Send Signature — initiate BoldSign dual-sign workflow with Email OTP authentication.',
          'Export PDF — download clean, high-resolution PDFs generated with exact legal terminology.'
        ]
      }
    ]
  },

  createOrder: {
    sectionId: 'create-order',
    sectionTitle: 'Create Order / Quote',
    steps: [
      {
        title: 'Account Selection & Deal Scope',
        subtitle: 'Customer Info & Entity Alignment',
        content: `Define the customer account, commercial entity, and deal timeline for this sales order.`,
        bullets: [
          'Account Auto-fill — search existing customers to auto-populate company address, tax ID, and POC contacts.',
          'Entity & Currency — set billing entity (India, UAE, UK, US) and currency.',
          'Agreement Term — select commitment duration (1 Year, 2 Years, 3 Years).'
        ]
      },
      {
        title: 'Product Catalog & SKU Configuration',
        subtitle: 'Google Workspace, Cloud, and Support SKUs',
        content: `Add line items from the built-in product catalog or configure custom SKU offerings.`,
        bullets: [
          'SKU Selection — Google Workspace Business Starter, Standard, Plus, Enterprise, GCP Commitment, or 24/7 SLA Support.',
          'Dynamic Pricing — enter unit buy price, sell price, margins, and quantities with real-time tax calculation.',
          'Billing Cycle — configure Monthly, Quarterly, or Annual prepayment terms.'
        ]
      },
      {
        title: '12-Page Contract Generation',
        subtitle: 'Comprehensive Legal & Commercial Schedules',
        content: `Review commercial summaries, tax calculations (GST 18% / VAT 5%), and signature signatories before finalizing.`,
        bullets: [
          'Dual Signatories — configure Client Signer (Signer 1) and Econz Authority (Signer 2).',
          'BoldSign Electronic Dispatch — dispatches agreement directly to customer inbox for instant digital execution.'
        ]
      }
    ]
  },

  customers: {
    sectionId: 'customers',
    sectionTitle: 'Customers Directory',
    steps: [
      {
        title: 'Centralized Customer CRM',
        subtitle: 'Accounts, Contacts & Deal History',
        content: `The Customers directory maintains master records for every account, their registered addresses, tax IDs, and authorized signing personnel.`,
        bullets: [
          'Unified Account View — inspect associated Quotes, NDAs, and active subscriptions per customer.',
          'KYC Verification — track verified GST, PAN, and international VAT numbers.',
          'Add Customer — create new accounts manually or via quotation workflows.'
        ]
      },
      {
        title: 'Account Detail Inspection',
        subtitle: 'Deep dive into account relationships',
        content: `Click on any customer account to view complete activity logs, signing authority histories, and active contract commitments.`,
        bullets: [
          'Primary & Secondary POCs — view designated signing authorities and notification recipients.',
          'Historical Quotations — view past and active proposals with deal value metrics.'
        ]
      }
    ]
  },

  dashboard: {
    sectionId: 'dashboard',
    sectionTitle: 'Executive Dashboard',
    steps: [
      {
        title: 'Real-Time Revenue & Pipeline KPIs',
        subtitle: 'Business performance at a glance',
        content: `The executive dashboard aggregates key business metrics across all quotes, customer acquisitions, and signed agreements.`,
        bullets: [
          'Total ARR & Pipeline — track annualized revenue values, closed deals, and pending approvals.',
          'Agreement Funnel — visual breakdown of Draft, Sent, Signed, and Completed contracts.',
          'Quick Shortcuts — rapid access to + Create Quote, + Create NDA, and Customer CRM.'
        ]
      },
      {
        title: 'Recent Activity & Approval Queue',
        subtitle: 'Monitor live operational workflows',
        content: `Keep track of live contract signing events, manager discount approvals, and KYC verifications in real-time.`,
        bullets: [
          'Approval Alerts — managers can approve or reject requested custom pricing discounts with one click.',
          'Recent Signatures — instant notification when a customer completes their BoldSign signing step.'
        ]
      }
    ]
  },

  productCatalog: {
    sectionId: 'products',
    sectionTitle: 'Product Catalog',
    steps: [
      {
        title: 'Google Cloud & Workspace SKU Master',
        subtitle: 'Manage Products, SKUs & Master Rates',
        content: `Configure master SKU listings, Google Workspace tiers, Cloud compute resources, and premium support add-ons.`,
        bullets: [
          'SKU Categories — Google Workspace, GCP, Support SLAs, Migration Services.',
          'Default Pricing — set baseline list price, partner buy price, and suggested retail margins.',
          'Instant Search — filter products by SKU code, tier, or product family.'
        ]
      }
    ]
  },

  margin: {
    sectionId: 'margin',
    sectionTitle: 'Margin Calculator',
    steps: [
      {
        title: 'Deal Profitability & Margin Optimization',
        subtitle: 'Analyze pricing margins & profit targets',
        content: `Calculate real-time gross margins, net profit yields, and partner incentive rebates across multi-tier deals.`,
        bullets: [
          'Cost vs Sell Price Analysis — simulate discount impacts on gross margin percentages.',
          'Currency Conversion — compute cross-border exchange rates (INR, AED, GBP, USD).',
          'Approval Triggers — highlights when margins drop below organizational thresholds requiring VP approval.'
        ]
      }
    ]
  },

  teams: {
    sectionId: 'teams',
    sectionTitle: 'Teams & Governance',
    steps: [
      {
        title: 'Sales Teams & Territory Management',
        subtitle: 'Organize reps, managers & territories',
        content: `Manage sales teams, regional territories, and approval hierarchies across your organizational structure.`,
        bullets: [
          'Team Structure — group reps under regional managers (India, UAE, UK, US).',
          'Performance Tracking — monitor closed deal volume, win rates, and active proposals per team.'
        ]
      }
    ]
  },

  users: {
    sectionId: 'users',
    sectionTitle: 'User Management',
    steps: [
      {
        title: 'User Accounts & Access Permissions',
        subtitle: 'Role-Based Access Control (RBAC)',
        content: `Administer user logins, permission levels, and secure authentication policies.`,
        bullets: [
          'Role Hierarchy — Admin (full governance), Manager (approvals & team visibility), Sales Rep (proposal creation).',
          'User Invites — invite new team members with secure initial credentials.',
          'Audit Logs — monitor login histories and document generation activities.'
        ]
      }
    ]
  },

  settings: {
    sectionId: 'settings',
    sectionTitle: 'Settings & Integrations',
    steps: [
      {
        title: 'System Settings & API Keys',
        subtitle: 'Integrations & Cloud Services',
        content: `Manage integration credentials, email dispatchers, and signature service connectors.`,
        bullets: [
          'BoldSign Integration — configure electronic signature API keys, webhooks, and default signers.',
          'Google Workspace / Drive API — connect Google Docs templates for automated contract templating.',
          'Company Profile — set corporate registered addresses, CIN numbers, and default bank details.'
        ]
      }
    ]
  },

  templates: {
    sectionId: 'templates',
    sectionTitle: 'Agreement Templates',
    steps: [
      {
        title: 'Master Contract Templates Library',
        subtitle: 'Manage standard legal agreement forms',
        content: `Configure master contract templates for GWS, Google Cloud, Support, and Mutual Non-Disclosure Agreements.`,
        bullets: [
          'Master Forms — maintain standardized legal clauses, payment terms, and confidentiality annexures.',
          'Add Template — administrators can add custom contract formats and agreement templates.',
          'One-click Usage — selected templates automatically populate throughout the Create Order wizard.'
        ]
      }
    ]
  }
};
