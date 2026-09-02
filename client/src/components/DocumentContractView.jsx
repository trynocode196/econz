import React from 'react';

export default function DocumentContractView({
  refId = 'ORD-TEMP',
  executionDate,
  customerName = 'CLIENT',
  companyShortName = '',
  orderPan = '',
  taxIdType = 'PAN',
  orderAddress = '',
  pocName = '',
  pocDesignation = '',
  pocEmail = '',
  pocMobile = '',
  entity = 'India',
  currency = 'INR',
  billTo = 'Direct',
  dealType = 'Renewal',
  templateName = 'Google Workspace Business Plus Business Associated Services',
  skus = [],
  subtotal = 0,
  taxAmount = 0,
  taxName = 'GST (18%)',
  finalContractValue = 0,
  econzSignerName = 'Srikar M',
  econzSignerTitle = 'Head - Revenue Operations',
  customClauses = ''
}) {
  const getCurrencySymbol = (curr = 'INR') => {
    switch (curr) {
      case 'USD': return '$';
      case 'AED': return 'د.إ ';
      case 'GBP': return '£';
      case 'EUR': return '€';
      case 'INR':
      default: return '₹';
    }
  };

  const sym = getCurrencySymbol(currency);
  const clientSignerName = pocName || customerName?.toUpperCase() || 'AUTHORIZED SIGNATORY';
  const clientSignerTitle = pocDesignation || 'Project Manager';
  const displayDate = executionDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Underlined Dual Signature Block
  const renderSignatureSection = (isAnnexure = false) => (
    <div style={{ border: '1px solid #0284c7', marginBottom: '2.5rem', background: '#ffffff' }}>
      {/* Header Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0284c7', color: '#ffffff' }}>
        <div style={{ padding: '0.45rem 1rem', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.3)' }}>
          For and on behalf of CLIENT
        </div>
        <div style={{ padding: '0.45rem 1rem', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
          For and on behalf of ECONZ IT SERVICES PRIVATE LIMITED
        </div>
      </div>

      {/* Content Columns with Underlines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '1rem 1.25rem', gap: '2rem', fontSize: '11px', color: '#1e293b' }}>
        {/* Left Column: Client */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div>
            <div style={{ color: '#475569', fontSize: '10px' }}>Signature:</div>
            <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>Signature:</div>
            <div style={{ borderBottom: '1px solid #94a3b8', height: '14px', width: '90%' }}></div>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ color: '#475569', fontSize: '10px' }}>Full Name:</div>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', marginTop: '0.15rem' }}>{clientSignerName}</div>
            <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ color: '#475569', fontSize: '10px' }}>Title:</div>
            <div style={{ fontWeight: 700, marginTop: '0.15rem' }}>{clientSignerTitle}</div>
            <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
          </div>

          {!isAnnexure && (
            <div style={{ marginTop: '0.25rem' }}>
              <div style={{ color: '#475569', fontSize: '10px' }}>Date:</div>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>Signature:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', height: '14px', width: '90%' }}></div>
            </div>
          )}
        </div>

        {/* Right Column: Econz */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div>
            <div style={{ color: '#475569', fontSize: '10px' }}>Signature:</div>
            <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>Signature:</div>
            <div style={{ borderBottom: '1px solid #94a3b8', height: '14px', width: '90%' }}></div>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ color: '#475569', fontSize: '10px' }}>Full Name:</div>
            <div style={{ fontWeight: 800, marginTop: '0.15rem' }}>{econzSignerName}</div>
            <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ color: '#475569', fontSize: '10px' }}>Title:</div>
            <div style={{ fontWeight: 700, marginTop: '0.15rem' }}>{econzSignerTitle}</div>
            <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
          </div>

          {!isAnnexure && (
            <div style={{ marginTop: '0.25rem' }}>
              <div style={{ color: '#475569', fontSize: '10px' }}>Date:</div>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>Signature:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', height: '14px', width: '90%' }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const thStyle = {
    background: '#0284c7',
    color: '#ffffff',
    padding: '0.45rem 0.5rem',
    fontSize: '10px',
    fontWeight: 700,
    textAlign: 'left',
    borderRight: '1px solid #ffffff'
  };

  const tdStyle = {
    padding: '0.55rem 0.65rem',
    fontSize: '11px',
    color: '#1e293b',
    borderRight: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'middle'
  };

  return (
    <div 
      style={{
        background: '#ffffff',
        color: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        maxWidth: '920px',
        width: '100%',
        margin: '0 auto',
        padding: '3.5rem 4rem',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: '0.875rem',
        lineHeight: '1.65'
      }}
    >
      {/* Document Title & Subtitle */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.35rem',
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          margin: '0 0 0.35rem 0'
        }}>
          MASTER SALES AND SERVICES AGREEMENT
        </h1>
        <p style={{
          fontSize: '0.85rem',
          fontStyle: 'italic',
          color: '#475569',
          margin: 0
        }}>
          ({templateName})
        </p>
      </div>

      {/* Info Box Bar (Light Blue Header) */}
      <div style={{
        background: '#e0f2fe',
        border: '1px solid #bae6fd',
        borderRadius: '4px',
        padding: '0.65rem 1.25rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        marginBottom: '1.75rem',
        fontSize: '0.85rem',
        color: '#0f172a'
      }}>
        <div>
          Agreement No.: <strong>{refId}</strong>
        </div>
        <div>
          Execution Date : <strong>{displayDate}</strong>
        </div>
      </div>

      {/* Preamble & Parties */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'justify', marginBottom: '1.5rem', fontSize: '11px', lineHeight: '1.7' }}>
        <p style={{ margin: 0 }}>
          This Master Sales and Services Agreement ("<strong>Agreement</strong>") is entered into by and between:
        </p>
        <p style={{ margin: 0 }}>
          <strong>ECONZ IT SERVICES PRIVATE LIMITED</strong>, a company incorporated under the Companies Act, 1956, CIN: U72900KA2011PTC061924, with its registered office at Ground Floor, No. 58, HM Towers, Brigade Road, Bengaluru, Karnataka - 560001, India (hereinafter referred to as "<strong>Econz</strong>") which expression shall, unless repugnant to the context or meaning thereof, be deemed to include its directors, partners, officers, authorized personnel, successors, and permitted assigns; AND
        </p>
        <p style={{ margin: 0 }}>
          <strong>{customerName ? customerName.toUpperCase() : 'CLIENT'}</strong>, a company incorporated under the Companies Act, 1956/2013, having {taxIdType || 'PAN/GSTIN'}: <strong>{orderPan || '—'}</strong>, with its registered office at <strong>{orderAddress || '—'}</strong> (hereinafter referred to as "<strong>Client</strong>") which expression shall, unless repugnant to the context or meaning thereof, be deemed to include its directors, partners, officers, authorized personnel, successors, and permitted assigns.
        </p>
        <p style={{ margin: 0 }}>
          Econz and Client are hereinafter individually referred to as a "<strong>Party</strong>" and collectively as the "<strong>Parties</strong>".
        </p>
      </div>

      {/* RECITALS */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          RECITALS
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}>
            <strong>A.</strong> Econz is a Google Cloud Premier Partner and an authorised reseller of Google Workspace / Google Cloud Platform, and other OEM products, including Microsoft and Amazon Web Services, engaged in providing cloud solutions and associated professional services to clients.
          </p>
          <p style={{ margin: 0 }}>
            <strong>B.</strong> The Client is engaged in the business of <strong>Information Technology (IT) & Software</strong> and is desirous of availing the Services provided by Econz.
          </p>
          <p style={{ margin: 0, fontWeight: 700 }}>
            BY EXECUTING THIS AGREEMENT, THE CLIENT CONSENTS TO BE BOUND BY ITS TERMS AND CONDITIONS, AND THE AUTHORISED SIGNATORY OF THE CLIENT REPRESENTS THAT THEY ARE DULY AUTHORISED TO EXECUTE THIS AGREEMENT ON BEHALF OF THE CLIENT.
          </p>
          {customClauses && customClauses.trim() && (
            <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Additional Special Terms:</p>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{customClauses}</p>
            </div>
          )}
        </div>
      </div>

      {/* 1. DEFINITIONS */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          1. DEFINITIONS
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}>
            <strong>1.1 "Billing Data"</strong> shall mean and include the Client's name, registered office address, Permanent Account Number (PAN), Goods and Services Tax Identification Number (GSTIN), the contact number of the SPOC, and the Permanent Account Number (PAN) of the authorized signatory of the Client, which are collected by Econz solely for the purpose of billing and Know Your Customer (KYC) requirements as mandated by the regulations in India.
          </p>
          <p style={{ margin: 0 }}>
            <strong>1.2 "Fees"</strong> means the charges payable by the Client to Econz as set out under schedule A1 of Annexure A.
          </p>
          <p style={{ margin: 0 }}>
            <strong>1.3 "OEM"</strong> means original equipment manufacturers, including Google Workspace Business whose products are resold by Econz.
          </p>
          <p style={{ margin: 0 }}>
            <strong>1.4 "Services"</strong> means the resale of OEM products, associated professional services, billing, and technical support as described in this Agreement and under schedule A2 and A3 of Annexure A.
          </p>
          <p style={{ margin: 0 }}>
            <strong>1.5 "SPOC"</strong> means the Single Point of Contact designated by each Party for the purposes of this Agreement.
          </p>
          <p style={{ margin: 0 }}>
            <strong>1.6 "Term"</strong> has the meaning assigned in Clause 3.
          </p>
        </div>
      </div>

      {/* 2. SCOPE OF SERVICES */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          2. SCOPE OF SERVICES
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}>
            <strong>2.1</strong> Econz agrees to resell OEM products and provide associated Services to the Client on an as-required, non-exclusive basis as set out in this Agreement and under Annexure A of this Agreement. Econz acts solely as a reseller and billing partner of the OEMs. Except for Billing Data, Econz shall have no access to, and shall not process or store, any Client data. In the event any Client data is accessed and/or processed, it shall be stored exclusively by the relevant OEM in accordance with that OEM's applicable terms and policies.
          </p>
          <p style={{ margin: 0 }}>
            <strong>2.2</strong> Each OEM's current terms of Service's and service level agreements are incorporated by reference and govern the Client's use of the respective OEM products. Econz shall notify the Client of any material changes to OEM terms with at least fifteen (15) days' written notice. The Client must accept the applicable OEM terms of service upon login.
          </p>
          <p style={{ margin: 0 }}>
            <strong>2.3</strong> The Services shall include any additional tasks that the Parties may mutually agree to in writing from time to time. Any additional Services agreed shall be documented in a written order form or amendment signed by both Parties.
          </p>
          <p style={{ margin: 0 }}>
            <strong>2.4</strong> The Client must ensure and provide Econz with complete and uninterrupted access to the domain name credentials for OEM provisioning.
          </p>
          <p style={{ margin: 0 }}>
            <strong>2.5</strong> Except with respect to any service-related and pricing-related terms expressly set out under the respective schedule/s mentioned in Annexure A, in the event of any inconsistency or conflict between the terms of this Agreement and any schedule/s mentioned under Annexure A, the terms of this Agreement shall prevail.
          </p>
        </div>
      </div>

      {/* 3. EFFECTIVE DATE AND TERM */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          3. EFFECTIVE DATE AND TERM
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>3.1</strong> The effective date of this Agreement shall be the date on which Econz first provides Services to the Client ("Effective Date").</p>
          <p style={{ margin: 0 }}><strong>3.2</strong> This Agreement shall remain in full force and effect for the subscription duration, or until the expiry or termination of the last active schedule under Annexure A, whichever is later ("Term"). Each schedule under Annexure A shall independently specify the product-specific term applicable to that product line.</p>
          <p style={{ margin: 0 }}><strong>3.3</strong> Unless either Party provides written notice of non-renewal prior to the expiry of the term, this Agreement shall automatically renew for successive periods of one (1) year.</p>
        </div>
      </div>

      {/* 4. FEES, INVOICING, AND PAYMENTS */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          4. FEES, INVOICING, AND PAYMENTS
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>4.1</strong> The Client shall pay Econz the Fees set out in schedule A1 of Annexure A.</p>
          <p style={{ margin: 0 }}><strong>4.2</strong> Econz will issue invoices to the Client in accordance with the billing frequency agreed under schedule A1 of Annexure A.</p>
          <p style={{ margin: 0 }}><strong>4.3</strong> The Client must pay each invoice within credit terms from the date of the invoice. Payments must be made via electronic bank transfer (NEFT/RTGS/Wire) to Econz's designated bank account.</p>
          <p style={{ margin: 0 }}><strong>4.4</strong> Overdue payments shall accrue interest at 1.5% per month, or the maximum rate permitted by law, whichever is higher, calculated daily from the due date until paid in full.</p>
          <p style={{ margin: 0 }}><strong>4.5</strong> All Fees are exclusive of applicable taxes. The Client is responsible for Goods and Services Tax (GST) and all other applicable statutory levies.</p>
          <p style={{ margin: 0 }}><strong>4.6</strong> If the Client is required by law to deduct withholding tax, it must provide valid TDS certificates within forty-five (45) days of the end of the relevant quarter.</p>
          <p style={{ margin: 0 }}><strong>4.7</strong> All Fees paid are non-refundable, except as expressly provided otherwise in this Agreement.</p>
        </div>
      </div>

      {/* 5. REPRESENTATIONS, WARRANTIES, AND COMPLIANCE */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          5. REPRESENTATIONS, WARRANTIES, AND COMPLIANCE
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>5.1</strong> Each Party represents and warrants that it is duly incorporated, validly existing, and has full corporate power to execute and perform this Agreement.</p>
          <p style={{ margin: 0 }}><strong>5.2</strong> Econz represents and warrants that it is an authorised reseller of the OEMs and will provide the Services in a professional and workmanlike manner.</p>
          <p style={{ margin: 0 }}><strong>5.3</strong> The Client warrants that it will comply with all applicable OEM terms and policies and will not use the Services for any unlawful purpose.</p>
          <p style={{ margin: 0 }}><strong>5.4</strong> EXCEPT AS EXPRESSLY PROVIDED IN THIS AGREEMENT, ECONZ DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>
        </div>
      </div>

      {/* 6. CONFIDENTIALITY */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          6. CONFIDENTIALITY
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>6.1</strong> "Confidential Information" means all non-public information disclosed by one Party to the other, directly or indirectly, in writing, orally, or by inspection.</p>
          <p style={{ margin: 0 }}><strong>6.2</strong> Each Party shall protect the other Party's Confidential Information with the same degree of care it uses for its own confidential information, but not less than reasonable care.</p>
          <p style={{ margin: 0 }}><strong>6.3</strong> Confidential Information may be disclosed only to employees, contractors, and legal/financial advisors who have a need to know and are bound by confidentiality obligations.</p>
          <p style={{ margin: 0 }}><strong>6.4</strong> The obligations of confidentiality shall survive for three (3) years after the termination or expiry of this Agreement.</p>
        </div>
      </div>

      {/* 7. INTELLECTUAL PROPERTY RIGHTS */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          7. INTELLECTUAL PROPERTY RIGHTS
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>7.1</strong> All intellectual property rights in OEM products remain the exclusive property of the respective OEMs or their licensors.</p>
          <p style={{ margin: 0 }}><strong>7.2</strong> Each Party retains all rights in its pre-existing intellectual property, trademarks, trade names, and logos.</p>
        </div>
      </div>

      {/* 8. DATA PROTECTION AND PRIVACY */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          8. DATA PROTECTION AND PRIVACY
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>8.1</strong> Econz will process Billing Data solely for billing, KYC, and regulatory compliance purposes in accordance with applicable data protection laws, including the Digital Personal Data Protection Act, 2023.</p>
          <p style={{ margin: 0 }}><strong>8.2</strong> Client data hosted on OEM infrastructure is governed exclusively by the relevant OEM's data protection agreements and privacy policies.</p>
          <p style={{ margin: 0 }}><strong>8.3</strong> Econz implements reasonable technical and organizational security measures to protect Billing Data against unauthorized access, loss, or alteration.</p>
        </div>
      </div>

      {/* 9. INDEMNIFICATION AND LIMITATION OF LIABILITY */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          9. INDEMNIFICATION AND LIMITATION OF LIABILITY
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>9.1</strong> The Client shall indemnify, defend, and hold harmless Econz, its directors, officers, and employees against any third-party claims arising from the Client's breach of OEM terms, misuse of Services, or infringement of intellectual property.</p>
          <p style={{ margin: 0 }}><strong>9.2</strong> Econz shall indemnify the Client against direct damages resulting from Econz's gross negligence or wilful misconduct.</p>
          <p style={{ margin: 0 }}><strong>9.3</strong> NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITY.</p>
          <p style={{ margin: 0 }}><strong>9.4</strong> ECONZ'S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL BE LIMITED TO THE TOTAL FEES PAID BY THE CLIENT TO ECONZ IN THE THREE (3) MONTHS PRECEDING THE CLAIM.</p>
          <p style={{ margin: 0 }}><strong>9.5</strong> Econz shall have no liability for OEM service disruptions, downtime, or OEM policy changes.</p>
        </div>
      </div>

      {/* 10. TERMINATION */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          10. TERMINATION
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>10.1</strong> Either Party may terminate this Agreement for material breach if the breaching Party fails to cure the breach within thirty (30) days of receiving written notice.</p>
          <p style={{ margin: 0 }}><strong>10.2</strong> Econz may suspend or terminate Services immediately if the Client fails to pay any invoice within thirty (30) days of the due date.</p>
          <p style={{ margin: 0 }}><strong>10.3</strong> Either Party may terminate immediately if the other Party becomes insolvent, enters bankruptcy, or ceases business operations.</p>
          <p style={{ margin: 0 }}><strong>10.4</strong> Upon termination, the Client must immediately pay all outstanding invoices and amounts due up to the effective date of termination.</p>
        </div>
      </div>

      {/* 11. DISPUTE RESOLUTION AND GOVERNING LAW */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          11. DISPUTE RESOLUTION AND GOVERNING LAW
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}>
            <strong>11.1</strong> This Agreement shall be governed by and construed in accordance with the laws of <strong>{entity === 'UAE' ? 'Dubai, UAE (DIFC)' : (entity === 'UK' ? 'London, UK' : entity === 'US' ? 'Delaware, USA' : 'New Delhi, India')}</strong>.
          </p>
          <p style={{ margin: 0 }}>
            <strong>11.2</strong> Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be {entity === 'UAE' ? 'Dubai' : (entity === 'UK' ? 'London' : entity === 'US' ? 'Delaware' : 'New Delhi')}. The language of arbitration shall be English.
          </p>
        </div>
      </div>

      {/* 12. FORCE MAJEURE */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          12. FORCE MAJEURE
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}>
            <strong>12.1</strong> Neither Party shall be liable for failure or delay in performing its obligations (other than payment obligations) if caused by events beyond its reasonable control, including acts of God, war, pandemic, government actions, power failures, internet/telecommunications outages, or OEM service failures.
          </p>
        </div>
      </div>

      {/* 13. GENERAL PROVISIONS */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          13. GENERAL PROVISIONS
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>13.1 Entire Agreement:</strong> This Agreement, including Annexure A and all schedules, constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, or agreements.</p>
          <p style={{ margin: 0 }}><strong>13.2 Amendments:</strong> No amendment to this Agreement shall be valid unless made in writing and signed by authorised representatives of both Parties.</p>
          <p style={{ margin: 0 }}><strong>13.3 Severability:</strong> If any provision is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>
          <p style={{ margin: 0 }}><strong>13.4 Assignment:</strong> Neither Party may assign this Agreement without the prior written consent of the other Party, except to an affiliate or in connection with a merger or acquisition.</p>
          <p style={{ margin: 0 }}><strong>13.5 Notices:</strong> All notices must be in writing and delivered by email, registered post, or courier to the addresses specified in this Agreement.</p>
          <p style={{ margin: 0 }}><strong>13.6 Relationship:</strong> The Parties are independent contractors. Nothing in this Agreement creates a partnership, joint venture, or agency relationship.</p>
          <p style={{ margin: 0 }}><strong>13.7 Counterparts:</strong> This Agreement may be executed in counterparts, including electronic signatures, each of which shall be deemed an original.</p>
          <p style={{ margin: 0 }}><strong>13.8 Survival:</strong> Clauses 4, 6, 7, 8, 9, 11, and 13 shall survive the termination or expiry of this Agreement.</p>
          <p style={{ margin: 0 }}><strong>13.9 Non-Solicitation:</strong> Neither Party shall solicit the other Party's employees during the Term and for one (1) year thereafter without prior written consent.</p>
        </div>
      </div>

      {/* MASTER SIGNATURE SECTION */}
      <div style={{ marginTop: '2rem' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', color: '#0f172a' }}>
          IN WITNESS WHEREOF, the Parties hereto have caused this Master Sales and Services Agreement to be executed by their duly authorised representatives:
        </p>
        {renderSignatureSection(false)}
      </div>

      {/* PAGE BREAK / ANNEXURE A */}
      <div style={{ borderTop: '2px dashed #94a3b8', paddingTop: '2.5rem', marginTop: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
            ANNEXURE A
          </h2>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7', margin: 0 }}>
            COMMERCIAL TERMS & PRICING SCHEDULE
          </p>
        </div>

        {/* A.1 Customer Details */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '0.45rem 0.75rem', marginBottom: '0.75rem', borderLeft: '3px solid #0284c7' }}>
            A.1 CUSTOMER DETAILS & ENTITY INFORMATION
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem', fontSize: '11px', color: '#334155' }}>
            <div><strong>Entity:</strong> Econz {entity}</div>
            <div><strong>Company Name:</strong> {customerName || '—'}</div>
            <div><strong>Short Name:</strong> {companyShortName || '—'}</div>
            <div><strong>{taxIdType || 'Tax ID'}:</strong> {orderPan || '—'}</div>
            <div><strong>Billing Type:</strong> {billTo}</div>
            <div><strong>Deal Type:</strong> {dealType}</div>
            <div><strong>SPOC / Contact:</strong> {pocName || '—'} ({pocDesignation || 'Manager'})</div>
            <div><strong>SPOC Email:</strong> {pocEmail || '—'}</div>
            <div><strong>SPOC Phone:</strong> {pocMobile || '—'}</div>
            <div><strong>Address:</strong> {orderAddress || '—'}</div>
          </div>
        </div>

        {/* A.2 Commercial Table */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '0.45rem 0.75rem', marginBottom: '0.75rem', borderLeft: '3px solid #0284c7' }}>
            A.2 SUBSCRIPTIONS & ORDERED SERVICES
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr>
                  <th style={thStyle}>SKU / Product</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Quantity</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Unit Price ({currency})</th>
                  <th style={thStyle}>Commitment Type</th>
                  <th style={thStyle}>Payment Frequency</th>
                  <th style={thStyle}>Credit Terms</th>
                  <th style={{ ...thStyle, textAlign: 'right', borderRight: 'none' }}>Total ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {skus.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      No product SKUs added to this order.
                    </td>
                  </tr>
                ) : (
                  skus.map((s, idx) => {
                    const lineTotal = (parseFloat(s.sellPrice) || 0) * (parseInt(s.qty) || 1);
                    return (
                      <tr key={idx} style={{ background: idx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                          {s.domain && (
                            <div style={{ fontSize: '9px', color: '#0284c7', marginTop: '0.1rem' }}>
                              Domain: {s.domain}
                            </div>
                          )}
                          {s.code && (
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              Code: {s.code}
                            </div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>
                          {s.qty || 1}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          {sym}{parseFloat(s.sellPrice || 0)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={tdStyle}>
                          {s.subPlan || s.commitmentType || '12 Months'}
                        </td>
                        <td style={tdStyle}>
                          {s.paymentPlan || s.paymentFrequency || 'Yearly'}
                        </td>
                        <td style={tdStyle}>
                          {s.creditTerms || s.creditLimit || '0 Days'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#0f172a', borderRight: 'none' }}>
                          {sym}{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Subtotal Row */}
                <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={6} style={{ padding: '0.65rem 0.75rem', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>
                    Subtotal ACV:
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, fontSize: '11px', textAlign: 'right', color: '#0f172a' }}>
                    {sym}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Tax Row */}
                <tr style={{ background: '#f1f5f9' }}>
                  <td colSpan={6} style={{ padding: '0.5rem 0.75rem', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>
                    {taxName}:
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, fontSize: '11px', textAlign: 'right', color: '#0f172a' }}>
                    {sym}{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Grand Total Row */}
                <tr style={{ background: '#e0f2fe', borderTop: '2px solid #0284c7' }}>
                  <td colSpan={6} style={{ padding: '0.75rem', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', textAlign: 'right', color: '#0369a1' }}>
                    Grand Total (Final Contract Value):
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 800, fontSize: '13px', textAlign: 'right', color: '#0369a1' }}>
                    {sym}{finalContractValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* A.3 Payment Terms */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '0.45rem 0.75rem', marginBottom: '0.75rem', borderLeft: '3px solid #0284c7' }}>
            A.3 PAYMENT SCHEDULE & CURRENCY TERMS
          </h3>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.6', textAlign: 'justify' }}>
            <p style={{ margin: '0 0 0.35rem 0' }}>
              Invoicing will be raised according to the payment frequency agreed above in <strong>{currency}</strong>.
              All invoices must be paid within credit terms from the date of invoice.
            </p>
            <p style={{ margin: 0 }}>
              Payment Mode: Electronic Bank Wire / NEFT / RTGS to the designated bank account of <strong>ECONZ IT SERVICES PRIVATE LIMITED</strong>.
            </p>
          </div>
        </div>

        {/* A.4–A.7 Live Documentation Links */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '0.45rem 0.75rem', marginBottom: '0.75rem', borderLeft: '3px solid #0284c7' }}>
            A.4 EXTERNAL REFERENCES & SERVICE TERMS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '11px' }}>
            <div>
              <strong>A.4 Master Documentation:</strong>{' '}
              <a 
                href="https://docs.google.com/document/d/1l-xD3xvxc3iUxWbDmycyN_NCfwzxwu4SatpLJN_BB2Q/edit?tab=t.0" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                https://docs.google.com/document/d/1l-xD3xvxc3iUxWbDmycyN_NCfwzxwu4SatpLJN_BB2Q/edit
              </a>
            </div>
            <div>
              <strong>A.5 Google Cloud Agreement:</strong>{' '}
              <a 
                href="https://cloud.google.com/terms" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline' }}
              >
                https://cloud.google.com/terms
              </a>
            </div>
            <div>
              <strong>A.6 Google Service Level Agreement:</strong>{' '}
              <a 
                href="https://workspace.google.com/terms/sla.html" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline' }}
              >
                https://workspace.google.com/terms/sla.html
              </a>
            </div>
            <div>
              <strong>A.7 Google Acceptable Use Policy:</strong>{' '}
              <a 
                href="https://workspace.google.com/terms/use_policy.html" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline' }}
              >
                https://workspace.google.com/terms/use_policy.html
              </a>
            </div>
          </div>
        </div>

        {/* Annexure A Signature */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', color: '#0f172a' }}>
            FOR AND ON BEHALF OF PARTIES FOR ANNEXURE A:
          </p>
          {renderSignatureSection(true)}
        </div>
      </div>
    </div>
  );
}
