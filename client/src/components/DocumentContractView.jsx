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
  templateName,
  skus = [],
  subtotal = 0,
  taxAmount = 0,
  taxName,
  finalContractValue = 0,
  econzSignerName,
  econzSignerTitle,
  customClauses = ''
}) {
  const isUAE = entity === 'UAE' || currency === 'AED';
  const isUK = entity === 'UK' || currency === 'GBP';
  const isUS = entity === 'US' || currency === 'USD';

  const getCurrencySymbol = (curr = 'INR') => {
    switch (curr) {
      case 'USD': return '$';
      case 'AED': return 'AED ';
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

  // Default Signers per Entity
  const defaultEconzSignerName = isUAE ? 'Bhuinka Ahuja' : (econzSignerName || 'Srikar M');
  const defaultEconzSignerTitle = isUAE ? 'Head - Cloud Solutions and Strategic Growth' : (econzSignerTitle || 'Head - Revenue Operations');
  const econzLegalEntityName = isUAE
    ? 'ECONZ IT CLOUD SERVICE AND DATACENTERS PROVIDERS L.L.C S.O.C'
    : 'ECONZ IT SERVICES PRIVATE LIMITED';

  const effectiveTaxName = taxName || (isUAE ? 'VAT @ 5%' : (isUK ? 'VAT (5%)' : (currency === 'INR' ? 'GST (18%)' : 'Tax (0%)')));
  const effectiveTemplateTitle = templateName || (isUAE
    ? 'Google Workspace Enterprise Essentials Business Associated Services'
    : 'Google Workspace Business Plus Business Associated Services');

  // Underlined Dual Signature Block
  const renderSignatureSection = (isAnnexure = false) => (
    <div style={{ border: '1px solid #0284c7', marginBottom: '2.5rem', background: '#ffffff' }}>
      {/* Header Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0284c7', color: '#ffffff' }}>
        <div style={{ padding: '0.45rem 1rem', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.3)' }}>
          For and on behalf of CLIENT
        </div>
        <div style={{ padding: '0.45rem 1rem', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
          For and on behalf of {econzLegalEntityName}
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
            <div style={{ fontWeight: 800, marginTop: '0.15rem' }}>{defaultEconzSignerName}</div>
            <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ color: '#475569', fontSize: '10px' }}>Title:</div>
            <div style={{ fontWeight: 700, marginTop: '0.15rem' }}>{defaultEconzSignerTitle}</div>
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
          ( {effectiveTemplateTitle} )
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

        {isUAE ? (
          <>
            <p style={{ margin: 0 }}>
              <strong>ECONZ IT CLOUD SERVICE AND DATACENTERS PROVIDERS L.L.C S.O.C</strong>, a limited liability company duly incorporated and registered under the laws of the United Arab Emirates, having Trade License No.: <strong>998347</strong>, with its registered office at 1804, 18th Floor, Burjuman Business Tower, Khalid Bin Walid Road, Dubai, United Arab Emirates (hereinafter referred to as "<strong>Econz</strong>") which expression shall, unless repugnant to the context or meaning thereof, be deemed to include its directors, partners, officers, authorized personnel, successors, and permitted assigns; AND
            </p>
            <p style={{ margin: 0 }}>
              <strong>{customerName ? customerName.toUpperCase() : 'CLIENT'}</strong>, a company duly incorporated and registered under the laws of the United Arab Emirates, having Trade License No.: <strong>{orderPan || '123456'}</strong>, with its registered office at <strong>{orderAddress || 'Dubai, United Arab Emirates'}</strong> (hereinafter referred to as "<strong>Client</strong>") which expression shall, unless repugnant to the context or meaning thereof, be deemed to include its directors, partners, officers, authorized personnel, successors, and permitted assigns.
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: 0 }}>
              <strong>ECONZ IT SERVICES PRIVATE LIMITED</strong>, a company incorporated under the Companies Act, 1956, CIN: U72900KA2011PTC061924, with its registered office at Ground Floor, No. 58, HM Towers, Brigade Road, Bengaluru, Karnataka - 560001, India (hereinafter referred to as "<strong>Econz</strong>") which expression shall, unless repugnant to the context or meaning thereof, be deemed to include its directors, partners, officers, authorized personnel, successors, and permitted assigns; AND
            </p>
            <p style={{ margin: 0 }}>
              <strong>{customerName ? customerName.toUpperCase() : 'CLIENT'}</strong>, a company incorporated under the Companies Act, 1956/2013, having {taxIdType || 'PAN/GSTIN'}: <strong>{orderPan || '—'}</strong>, with its registered office at <strong>{orderAddress || '—'}</strong> (hereinafter referred to as "<strong>Client</strong>") which expression shall, unless repugnant to the context or meaning thereof, be deemed to include its directors, partners, officers, authorized personnel, successors, and permitted assigns.
            </p>
          </>
        )}

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
            BY EXECUTING THIS AGREEMENT, THE CLIENT CONSENTS TO BE BOUND BY ITS TERMS AND CONDITIONS, AND THE AUTHORIZED SIGNATORY OF THE CLIENT REPRESENTS THAT THEY ARE DULY AUTHORIZED TO EXECUTE THIS AGREEMENT ON BEHALF OF THE CLIENT.
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
            <strong>1.1 "Billing Data"</strong> shall mean and include the Client's name, registered office address, {isUAE ? 'Trade License Number, Value Added Tax Registration Number (TRN)' : 'Permanent Account Number (PAN), Goods and Services Tax Identification Number (GSTIN)'}, the contact number of the SPOC, and {isUAE ? 'any other identification details of the authorized signatory of the Client' : 'the Permanent Account Number (PAN) of the authorized signatory of the Client'}, which are collected by Econz solely for the purpose of billing and Know Your Customer (KYC) requirements as mandated by the applicable regulations in {isUAE ? 'the UAE' : 'India'}.
          </p>
          <p style={{ margin: 0 }}>
            <strong>1.2 "Fees"</strong> means the charges payable by the Client to Econz as set out under schedule A1 of Annexure A.
          </p>
          <p style={{ margin: 0 }}>
            <strong>1.3 "OEM"</strong> means original equipment manufacturers, including Google, Microsoft, and Amazon Web Services whose products are resold by Econz.
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
          <p style={{ margin: 0 }}><strong>3.2</strong> This Agreement shall remain in full force and effect for a period of {skus[0]?.subPlan || '24 Months'} from the Effective Date, or until the expiry or termination of the last active schedule under Annexure A, whichever is later ("Term"). Each schedule under Annexure A shall independently specify the product-specific term applicable to that product line.</p>
          <p style={{ margin: 0 }}><strong>3.3</strong> Unless either Party provides written notice of non-renewal at least {skus[0]?.paymentPlan || 'Quarterly'} prior to the expiry of the Term, this Agreement shall automatically renew for successive periods of one (1) year.</p>
        </div>
      </div>

      {/* 4. FEES, INVOICING, AND PAYMENTS */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          4. FEES, INVOICING, AND PAYMENTS
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isUAE ? (
            <>
              <p style={{ margin: 0 }}><strong>4.1</strong> The Client shall pay Fees as set forth in schedule A1 of Annexure A for the Services rendered by Econz. All Fees are exclusive of applicable taxes, including Value Added Tax (VAT) at the applicable rate under Federal Decree-Law No. 8 of 2017 on Value Added Tax (as amended), which shall be levied at the then-applicable statutory rates.</p>
              <p style={{ margin: 0 }}><strong>4.2</strong> Econz shall issue invoices in advance for all OEM products being resold. The Client shall make payment within <strong>{skus[0]?.creditTerms || '10 Days'}</strong> from the date of receipt of the invoice. Econz shall issue a tax invoice in accordance with the UAE VAT Law and the Executive Regulations issued thereunder.</p>
              <p style={{ margin: 0 }}><strong>4.3</strong> Any additional gateway charges (credit/debit card or digital payment platform) or bank transaction charges shall be borne by the Client.</p>
              <p style={{ margin: 0 }}><strong>4.4</strong> In the event of failure or delay in payment beyond the stipulated due date, late payment charges shall accrue at the rate of one and a half percent (1.5%) per month on the outstanding amount, until the date of actual receipt of the delayed payment by Econz.</p>
              <p style={{ margin: 0 }}><strong>4.5</strong> In the event of non-payment beyond thirty (30) days from the invoice due date, Econz shall issue a written notice of suspension to the Client. If the Client fails to clear outstanding dues within fifteen (15) days of such notice, Econz shall be entitled to suspend access to the Services and, thereafter, to terminate the Services.</p>
              <p style={{ margin: 0 }}><strong>4.6</strong> Where the Client has committed to a specific product, stock keeping units ("SKU") or user count for a defined period as mentioned under schedule A1 of Annexure A, the Client shall remain liable to pay for the entire committed quantity and period, irrespective of any mid-term reduction, termination, or suspension of the licenses.</p>
              <p style={{ margin: 0 }}><strong>4.7</strong> In the event of any conflict between the general payment terms in this Clause 4 and the product-specific payment terms as mentioned under schedule A1 of Annexure A, the terms of schedule A1 of Annexure A shall prevail solely with respect to product-specific billing mechanics.</p>
            </>
          ) : (
            <>
              <p style={{ margin: 0 }}><strong>4.1</strong> The Client shall pay Econz the Fees set out in schedule A1 of Annexure A.</p>
              <p style={{ margin: 0 }}><strong>4.2</strong> Econz will issue invoices to the Client in accordance with the billing frequency agreed under schedule A1 of Annexure A.</p>
              <p style={{ margin: 0 }}><strong>4.3</strong> The Client must pay each invoice within credit terms from the date of the invoice. Payments must be made via electronic bank transfer (NEFT/RTGS/Wire) to Econz's designated bank account.</p>
              <p style={{ margin: 0 }}><strong>4.4</strong> Overdue payments shall accrue interest at 1.5% per month, or the maximum rate permitted by law, whichever is higher, calculated daily from the due date until paid in full.</p>
              <p style={{ margin: 0 }}><strong>4.5</strong> All Fees are exclusive of applicable taxes. The Client is responsible for Goods and Services Tax (GST) and all other applicable statutory levies.</p>
              <p style={{ margin: 0 }}><strong>4.6</strong> If the Client is required by law to deduct withholding tax, it must provide valid TDS certificates within forty-five (45) days of the end of the relevant quarter.</p>
              <p style={{ margin: 0 }}><strong>4.7</strong> All Fees paid are non-refundable, except as expressly provided otherwise in this Agreement.</p>
            </>
          )}
        </div>
      </div>

      {/* 5. REPRESENTATIONS AND WARRANTIES */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          5. REPRESENTATIONS AND WARRANTIES
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>5.1</strong> Each Party represents and warrants that: (a) it has full legal capacity and authority to enter into this Agreement; (b) this Agreement has been approved and executed by its duly authorized signatory; (c) it is duly incorporated, organized, and validly existing under applicable laws; and (d) it shall comply with all applicable laws, statutes, regulations, and governmental requirements in the jurisdiction(s) of its operation throughout the Term.</p>
          <p style={{ margin: 0 }}><strong>5.2</strong> The Client shall provide Econz with all documentation required for empanelment, KYC, or tax registration purposes ({isUAE ? 'including Trade License, TRN certificate, Emirates ID or passport copy of the authorized signatory, Memorandum of Association, Value Added Tax Identification Number (VATIN) and any other documents as required by applicable UAE law' : 'including PAN, GSTIN certificate, PAN card copy of authorized signatory, Certificate of Incorporation'}) at the time of onboarding of the Client.</p>
          <p style={{ margin: 0 }}><strong>5.3</strong> Neither Party shall take any action that would have an adverse effect on the name, reputation, or public image of the other Party.</p>
          <p style={{ margin: 0 }}><strong>5.4</strong> The Parties shall ensure to fully and promptly observe and comply with such general and specific regulations, instructions, or requirements from time to time, consistent with the terms of this Agreement and the Annexures hereto.</p>
        </div>
      </div>

      {/* 6. CONFIDENTIALITY OBLIGATIONS */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          6. CONFIDENTIALITY OBLIGATIONS
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>6.1 "Confidential Information"</strong> shall mean and include any non-public business, technical, financial or product-related information disclosed by the disclosing Party to the receiving Party in connection with this Agreement, including trade secrets, Confidential Information respecting Intellectual Property Rights, inventions, products, data, algorithms, designs, know-how, techniques, systems, processes, software programs, works of authorship, customer lists, projects, plans and proposals and any notes, memoranda, reports, lists, records, drawings, sketches, specifications, data, documentation, and any information of any third party to whom disclosing Party is under an obligation to keep confidential.</p>
          <p style={{ margin: 0 }}><strong>6.2</strong> The receiving Party shall hold the disclosing Party's Confidential Information in strict confidence, use it solely for the purposes of this Agreement, and disclose it only to those employees or authorized personnel who have a need to know and who are bound by confidentiality obligations no less protective than those in this Clause 6.</p>
          <p style={{ margin: 0 }}><strong>6.3</strong> Confidentiality obligations and restrictions shall not apply to Confidential Information that: (a) is or becomes publicly known through no fault of the receiving Party; (b) was already in the receiving Party's possession free of any confidentiality obligation at the time of disclosure; (c) is lawfully received from a third party free of any restriction; (d) is independently developed by the receiving Party without use of the Confidential Information; or (e) is required to be disclosed by applicable law, court order, or governmental authority.</p>
          <p style={{ margin: 0 }}><strong>6.4</strong> The obligations of this Clause 6 shall survive for a period of one (1) year following the termination or expiry of this Agreement.</p>
        </div>
      </div>

      {/* 7. INTELLECTUAL PROPERTY RIGHTS */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          7. INTELLECTUAL PROPERTY RIGHTS
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>7.1</strong> Each Party retains sole and exclusive ownership of all intellectual property rights in its pre-existing works, technology, software, data, and materials. No rights, title, or interest in either Party's intellectual property is transferred or licensed to the other Party under this Agreement except to the limited extent expressly necessary to perform the Services.</p>
          <p style={{ margin: 0 }}><strong>7.2</strong> OEM products remain the exclusive intellectual property of the respective OEM and are governed solely by the applicable OEM terms of service.</p>
        </div>
      </div>

      {/* 8. DATA PRIVACY */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          8. DATA PRIVACY
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>8.1</strong> Econz hereby agrees to take all necessary precautions to protect the Client's Confidential Information, Billing Data, and the KYC details of the authorized signatory/ies of the Client, and implement reasonable security practices and measures that are commensurate with respect to the Confidential Information disclosure for the purpose of this Agreement.</p>
          <p style={{ margin: 0 }}><strong>8.2</strong> Econz shall take all reasonable steps to protect the Confidential Information provided by the Client from loss, misuse, and unauthorized access, disclosure, alteration, or destruction, solely by Econz or its employees. Econz shall comply with all applicable data protection and privacy laws and regulations of {isUAE ? 'the UAE, including without limitation Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL)' : 'India, including the Digital Personal Data Protection Act, 2023'} and any regulations or guidelines issued thereunder, with regard to the protection of the Client's personal data or Confidential Information from time to time.</p>
          <p style={{ margin: 0 }}><strong>8.3</strong> The provisions under Clauses 8.1 and 8.2 shall apply only if the Client provides Econz with privileged access to the Client data.</p>
        </div>
      </div>

      {/* 9. INDEMNITY AND LIMITATION OF LIABILITY */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          9. INDEMNITY AND LIMITATION OF LIABILITY
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>9.1</strong> Without prejudice to any other rights and remedies available to the Parties under this Agreement or law, either Party shall indemnify, defend, and hold harmless the other Party and its directors, officers, employees, and permitted assigns against any claims, damages, liabilities, losses, penalties, costs, and proceedings, arising from infringement, breach, negligence, fraud, misrepresentation, or unauthorized act.</p>
          <p style={{ margin: 0 }}><strong>9.2</strong> In no event shall either Party be liable to the other for any special, incidental, consequential, indirect, or punitive damages, including loss of profits, loss of revenue, loss of data, loss of goodwill, business interruption, or cost of substitute products or services.</p>
          <p style={{ margin: 0 }}><strong>9.3</strong> Notwithstanding any other provision, either Party's total aggregate liability to the other Party for direct damages arising under or in connection with any schedule under Annexure A shall not exceed the total Fees paid by the Client to Econz during the six (06) months immediately preceding the event giving rise to the claim under the respective schedule/s of Annexure A.</p>
          <p style={{ margin: 0 }}><strong>9.4</strong> No claim, regardless of form, arising under or in connection with this Agreement may be brought by either Party more than three (3) years after the date on which the cause of action occurred.</p>
          <p style={{ margin: 0 }}><strong>9.5</strong> Econz shall have no liability for any loss, damage, or disruption to the Client's IT environment resulting from alterations, additions, repairs, or maintenance carried out by any party other than by Econz's authorized personnel.</p>
        </div>
      </div>

      {/* 10. TERMINATION AND CONSEQUENCES */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          10. TERMINATION AND CONSEQUENCES
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>10.1</strong> Either Party may terminate this Agreement and all active schedules under Annexure A immediately upon written notice if the other Party commits a material breach and fails to remedy such breach within thirty (30) days, becomes insolvent, discontinues business operations, or delays payment beyond the timelines stipulated in Clause 4.</p>
          <p style={{ margin: 0 }}><strong>10.2</strong> Where the Client has opted for a committed subscription (annual commit, two year commit, or three year commit) and terminates this Agreement or any schedule under this Agreement prior to the expiry of the committed term, Econz shall invoice the Client for the true-up amount, being the number of seats/licenses at the date of termination (or the committed quantity under schedule A1 of Annexure A, whichever is higher), multiplied by the annual price of the applicable SKU for the remaining committed period. The true-up amount shall be payable within thirty (30) days of the invoice date. Where the Client has opted for flexible billing, no true-up applies, and the Client may discontinue Services upon clearing all dues outstanding to the date of disconnection.</p>
          <p style={{ margin: 0 }}><strong>10.3</strong> Upon termination or expiry of this Agreement or any schedule under Annexure A, the Client shall remain obligated to pay all amounts due to Econz for the Services rendered, including all charges accrued up to the date on which the relevant OEM suspends or terminates access to the Client. The provisions of Clauses 4.5 and 4.6 (Fees, Invoicing and Payments), Clause 6 (Confidentiality), Clause 7 (Intellectual Property Rights), Clause 8 (Data Privacy), Clause 9 (Indemnity and Limitation of Liability), and this Clause 10.3 shall survive the termination or expiry of this Agreement.</p>
          <p style={{ margin: 0 }}><strong>10.4</strong> Upon expiry or termination, either Party shall promptly return to the other all property, documentation, and Confidential Information of the disclosing Party in its possession.</p>
        </div>
      </div>

      {/* 11. DISPUTE RESOLUTION, GOVERNING LAW AND JURISDICTION */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          11. DISPUTE RESOLUTION, GOVERNING LAW AND JURISDICTION
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isUAE ? (
            <>
              <p style={{ margin: 0 }}>
                <strong>11.1</strong> The Parties shall first attempt to resolve any dispute through mutual consultation. If unresolved within thirty (30) days, either Party may resort to arbitration, wherein the Parties shall mutually appoint a sole arbitrator, in accordance with the <strong>UAE Federal Arbitration Law (Federal Law No. 6 of 2018 on Arbitration, as amended)</strong>. The arbitral award shall be final and binding and may be entered as a judgment in any court of competent jurisdiction. The seat for arbitration shall be <strong>Dubai, United Arab Emirates</strong>, and the language of arbitration shall be English.
              </p>
              <p style={{ margin: 0 }}>
                <strong>11.2</strong> This Agreement and all matters arising under it shall be governed by and construed in accordance with the <strong>laws of the United Arab Emirates</strong>, including the applicable Federal laws and, where relevant, the laws of the Emirate of Dubai. The Parties submit to the exclusive jurisdiction of the competent courts of the United Arab Emirates.
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                <strong>11.1</strong> This Agreement shall be governed by and construed in accordance with the laws of <strong>{isUK ? 'London, UK' : (isUS ? 'Delaware, USA' : 'New Delhi, India')}</strong>.
              </p>
              <p style={{ margin: 0 }}>
                <strong>11.2</strong> Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be {isUK ? 'London' : (isUS ? 'Delaware' : 'New Delhi')}. The language of arbitration shall be English.
              </p>
            </>
          )}
        </div>
      </div>

      {/* 12. FORCE MAJEURE */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          12. FORCE MAJEURE
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}>
            <strong>12.1</strong> Neither Party shall be liable for any delay or failure to perform its obligations under this Agreement to the extent that such delay or failure is caused by circumstances beyond that Party's reasonable control, including acts of God, natural disasters, war, civil unrest, epidemic or pandemic, acts of government, or power or internet outages.
          </p>
        </div>
      </div>

      {/* 13. GENERAL PROVISIONS */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          13. GENERAL PROVISIONS
        </h2>
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0 }}><strong>13.1 Non-Solicitation:</strong> During the Term and for one (01) year thereafter, neither Party shall directly or indirectly solicit, recruit, or offer employment to any employee of the other Party without prior written consent.</p>
          <p style={{ margin: 0 }}><strong>13.2 Publicity:</strong> Either Party may use, with prior written consent, the other Party's name and logo in connection with this Agreement in accordance with applicable trademark guidelines.</p>
          <p style={{ margin: 0 }}><strong>13.3 Relationship:</strong> Nothing in this Agreement creates a relationship of principal and agent, employer and employee, partnership, or joint venture between the Parties.</p>
          <p style={{ margin: 0 }}><strong>13.4 Assignment:</strong> Neither Party may assign this Agreement or any rights or obligations hereunder without the prior written consent of the other Party.</p>
          <p style={{ margin: 0 }}><strong>13.5 Notices:</strong> All notices under this Agreement shall be in writing in English and delivered by personal delivery, confirmed email, commercial courier, or registered post.</p>
          <p style={{ margin: 0 }}><strong>13.6 Waiver:</strong> No failure or delay by either Party in exercising any right under this Agreement shall constitute a waiver of that right or any other right.</p>
          <p style={{ margin: 0 }}><strong>13.7 Severability:</strong> If any provision of this Agreement is held to be invalid or unenforceable, such provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.</p>
          <p style={{ margin: 0 }}><strong>13.8 Entire Agreement:</strong> This Agreement, including all Annexures, constitutes the entire agreement between the Parties with respect to its subject matter.</p>
          <p style={{ margin: 0 }}><strong>13.9 Counterparts:</strong> This Agreement may be executed in counterparts, including electronic or digital signatures, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument.</p>
        </div>
      </div>

      {/* MASTER SIGNATURE SECTION */}
      <div style={{ marginTop: '2rem' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', color: '#0f172a' }}>
          IN WITNESS WHEREOF, the Parties have caused this Agreement to be executed by their duly authorized representatives as of the Execution Date first written above:
        </p>
        {renderSignatureSection(false)}
      </div>

      {/* PAGE BREAK / ANNEXURE A */}
      <div style={{ borderTop: '2px dashed #94a3b8', paddingTop: '2.5rem', marginTop: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
            Annexure A
          </h2>
          <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#475569', margin: 0 }}>
            Commercial Terms, Pricing & Product-Specific Conditions
          </p>
          <p style={{ fontSize: '10px', color: '#64748b', marginTop: '0.35rem' }}>
            This Annexure A forms an integral part of the Reseller Services Agreement executed between the Parties and sets out the commercial terms specific to the OEM products and Services selected by the Client.
          </p>
        </div>

        {/* A1. Licence & Pricing Details */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            A1. Licence & Pricing Details
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
                  <th style={{ ...thStyle, textAlign: 'right', borderRight: 'none' }}>Total</th>
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
                              {s.domain}
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
                          {parseFloat(s.sellPrice || 0)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={tdStyle}>
                          {s.subPlan || s.commitmentType || '24 Months'}
                        </td>
                        <td style={tdStyle}>
                          {s.paymentPlan || s.paymentFrequency || 'Quarterly'}
                        </td>
                        <td style={tdStyle}>
                          {s.creditTerms || s.creditLimit || '10 Days'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#0f172a', borderRight: 'none' }}>
                          {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Subtotal Row */}
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={6} style={{ padding: '0.55rem 0.75rem', fontWeight: 700, fontSize: '11px', textAlign: 'right' }}>
                    Subtotal :
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, fontSize: '11px', textAlign: 'right', color: '#0f172a' }}>
                    {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Tax Row */}
                <tr style={{ background: '#f8fafc' }}>
                  <td colSpan={6} style={{ padding: '0.5rem 0.75rem', fontWeight: 700, fontSize: '11px', textAlign: 'right' }}>
                    {effectiveTaxName} :
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, fontSize: '11px', textAlign: 'right', color: '#0f172a' }}>
                    {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Grand Total Row */}
                <tr style={{ background: '#ffffff', borderTop: '2px solid #0f172a' }}>
                  <td colSpan={6} style={{ padding: '0.75rem', fontWeight: 800, fontSize: '12px', textAlign: 'right', color: '#0f172a' }}>
                    Grand Total :
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 800, fontSize: '13px', textAlign: 'right', color: '#0f172a' }}>
                    {sym} {finalContractValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}/-
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* A2. Professional Services */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            A2. Professional Services (if applicable)
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}>
            <thead>
              <tr>
                <th style={thStyle}>Service</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Quantity</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Unit Price ({currency})</th>
                <th style={thStyle}>Commitment Type</th>
                <th style={thStyle}>Payment Frequency</th>
                <th style={thStyle}>Credit Terms</th>
                <th style={{ ...thStyle, textAlign: 'right', borderRight: 'none' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '0.75rem' }}>
                  Standard Onboarding & Deployment Included
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '9px', color: '#64748b', fontStyle: 'italic', margin: '0 0 0.35rem 0' }}>
            Note: {isUAE ? 'VAT at 5%' : 'Applicable taxes'} is applicable on all fees. Commitments types: Flexi | Annual Commit | 2-Year Commit | 3-Year Commit. Payment frequency: Monthly | Quarterly | Half-Yearly | Annual.
          </p>
          <p style={{ fontSize: '9px', color: '#64748b', margin: 0 }}>
            Details of any Econz professional or managed services (data migration, deployment, training, managed support) shall be documented in a separate Statement of Work (SOW) appended to this Annexure A, which shall include scope, timelines, deliverables, payment milestones, and acceptance criteria.
          </p>
        </div>

        {/* A3. Technical Support Services */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            A3. Technical Support Services
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}>
            <thead>
              <tr>
                <th style={thStyle}>Service</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Quantity</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Unit Price ({currency})</th>
                <th style={thStyle}>Commitment Type</th>
                <th style={thStyle}>Payment Frequency</th>
                <th style={thStyle}>Credit Terms</th>
                <th style={{ ...thStyle, textAlign: 'right', borderRight: 'none' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '0.75rem' }}>
                  Google Premier 24x7 Tier-1 & Tier-2 Support Included
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '9px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
            Note: {isUAE ? 'VAT at 5%' : 'Applicable taxes'} is applicable on all fees. Commitments types: Flexi | Annual Commit | 2-Year Commit | 3-Year Commit. Payment frequency: Monthly | Quarterly | Half-Yearly | Annual.
          </p>
        </div>

        {/* A4–A7 External References & Links */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '10px' }}>
            <div>
              <strong>A4. Econz Technical Support Guidelines</strong><br />
              <a 
                href="https://docs.google.com/document/d/1l-xD3xvxc3iUxWbDmycyN_NCfwzxwu4SatpLJN_BB2Q/edit#tab=t.0" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                https://docs.google.com/document/d/1l-xD3xvxc3iUxWbDmycyN_NCfwzxwu4SatpLJN_BB2Q/edit#tab=t.0
              </a>
            </div>
            <div>
              <strong>A5. Google Workspace Service Level Agreement</strong><br />
              <a 
                href="https://workspace.google.com/intl/en/terms/sla.html" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline' }}
              >
                https://workspace.google.com/intl/en/terms/sla.html
              </a>
            </div>
            <div>
              <strong>A6. Google Workspace Terms of Service</strong><br />
              <a 
                href="https://workspace.google.com/terms/premier_terms_all_in_billing.html" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline' }}
              >
                https://workspace.google.com/terms/premier_terms_all_in_billing.html
              </a>
            </div>
            <div>
              <strong>A7. Google Workspace Features</strong><br />
              <span style={{ color: '#475569' }}>Google Workspace Business Editions: </span>
              <a 
                href="https://support.google.com/a/answer/6043385?hl=en" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline' }}
              >
                https://support.google.com/a/answer/6043385?hl=en
              </a><br />
              <span style={{ color: '#475569' }}>Google Workspace Enterprise Editions: </span>
              <a 
                href="https://support.google.com/a/answer/7326969?hl=en&ref_topic=4388487" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'underline' }}
              >
                https://support.google.com/a/answer/7326969?hl=en&ref_topic=4388487
              </a>
            </div>
          </div>
        </div>

        {/* Execution of Annexure A Signature */}
        <div>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            Execution of Annexure A
          </h3>
          {renderSignatureSection(true)}
        </div>
      </div>
    </div>
  );
}
