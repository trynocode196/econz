import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Send, 
  Pencil, 
  Download, 
  ArrowLeft, 
  Loader2,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function DocumentPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchQuote = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/quotes/${id}`);
      setQuote(res.data);
    } catch (err) {
      showToast('Document not found', 'error');
      navigate('/quotes');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleSendViaBoldSign = async () => {
    if (!quote) return;
    try {
      setSending(true);
      await api.patch(`/quotes/${quote._id}/status`, { status: 'Sent for Signature' });
      showToast('Document sent via BoldSign successfully!', 'success');
      setQuote(prev => prev ? { ...prev, status: 'Sent for Signature' } : prev);
    } catch (err) {
      showToast('Failed to send document via BoldSign', 'error');
    } finally {
      setSending(false);
    }
  };

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

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '450px' }}>
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    );
  }

  if (!quote) return null;

  const skus = quote.products || quote.skus || [];
  const sym = getCurrencySymbol(quote.currency);
  const subtotal = skus.reduce((sum, s) => sum + ((parseFloat(s.sellPrice) || 0) * (parseInt(s.qty) || 1)), 0);
  const gstRate = 0.18;
  const gstAmt = subtotal * gstRate;
  const grandTotal = subtotal + gstAmt;

  const sigHeaderStyle = { background: '#0e7490', color: 'white', padding: '0.5rem 1rem', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' };
  const sigCellStyle = { padding: '0.55rem 1rem', fontSize: '11px', color: '#334155', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' };
  const sigLabelStyle = { ...sigCellStyle, fontWeight: 600, width: '25%' };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', paddingBottom: '3rem' }}>
      
      {/* Top Header Bar Matching Reference Screenshot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Left: Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
          <button
            type="button"
            onClick={() => navigate('/quotes')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
              padding: 0,
              fontSize: '1rem'
            }}
          >
            Document Preview
          </button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {quote.refId}
          </span>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleDownloadPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '0.65rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/quotes/${quote._id}/edit`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.25rem',
              borderRadius: '0.65rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <Pencil size={15} />
            <span>Edit Document</span>
          </button>

          <button
            type="button"
            onClick={handleSendViaBoldSign}
            disabled={sending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.35rem',
              borderRadius: '0.65rem',
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
            }}
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            <span>Send Via BoldSign</span>
          </button>
        </div>
      </div>

      {/* Main Document Paper Sheet (A4-Style White Canvas) */}
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
            ({quote.templateTitle || 'Google Workspace Business Plus Business Associated Services'})
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
            Agreement No.: <strong>{quote.refId}</strong>
          </div>
          <div>
            Execution Date : <strong>{quote.documentExecutionDate || '—'}</strong>
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
            <strong>{quote.customerName ? quote.customerName.toUpperCase() : 'TRYNOCODE'}</strong>, a company incorporated under the Companies Act, 1956/2013, having PAN/GSTIN: <strong>{quote.orderPan || 'DTYPA6073H'}</strong>, with its registered office at <strong>{quote.orderAddress || 'New Delhi India'}</strong> (hereinafter referred to as "<strong>Client</strong>") which expression shall, unless repugnant to the context or meaning thereof, be deemed to include its directors, partners, officers, authorized personnel, successors, and permitted assigns.
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
            {quote.documentCustomClauses && quote.documentCustomClauses.trim() && (
              <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Additional Special Terms:</p>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{quote.documentCustomClauses}</p>
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
            <p style={{ margin: 0 }}>
              <strong>3.1</strong> The effective date of this Agreement shall be the date on which Econz first provides Services to the Client, which shall be ("Effective Date").
            </p>
            <p style={{ margin: 0 }}>
              <strong>3.2</strong> This Agreement shall remain in full force and effect for a period of Months from the Effective Date, or until the expiry or termination of the last active schedule under Annexure A, whichever is later ("Term"). Each schedule under Annexure A shall independently specify the product-specific term applicable to that product line.
            </p>
            <p style={{ margin: 0 }}>
              <strong>3.3</strong> Unless either Party provides written notice of non-renewal at least <strong>Yearly</strong> prior to the expiry of the term, this Agreement shall automatically renew for successive periods of one (1) year.
            </p>
          </div>
        </div>

        {/* 4. FEES, INVOICING, AND PAYMENTS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            4. FEES, INVOICING, AND PAYMENTS
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>
              <strong>4.1</strong> The Client shall pay fees as set both in schedule A1 of Annexure A for the Services rendered by Econz. All Fees are exclusive of applicable taxes, including GST, which shall be levied at the then-applicable statutory rates.
            </p>
            <p style={{ margin: 0 }}>
              <strong>4.2</strong> Econz shall raise invoices in advance for all OEM products being resold. The Client shall make payment within the date of receipt of the invoice. Econz shall issue a tax invoice with applicable IDS rates.
            </p>
            <p style={{ margin: 0 }}>
              <strong>4.3</strong> Any additional gateway charges (credit/debit card or digital payment platforms) or bank transaction charges shall be borne by the Client.
            </p>
            <p style={{ margin: 0 }}>
              <strong>4.4</strong> In the event of failure or delay in payment beyond the stipulated due date, late payment charges shall accrue at the rate of one and a half percent (1.5%) per month on the outstanding amount, until the date of actual receipt of the delayed payment by Econz.
            </p>
            <p style={{ margin: 0 }}>
              <strong>4.5</strong> In event of non-payment beyond thirty (30) days from the invoice due date, Econz shall issue a written notice of suspension to the Client. In the event the Client fails to clear outstanding dues within fifteen (15) days of such notice, Econz shall be entitled to suspend access to the Services and, thereafter, to terminate the licence.
            </p>
            <p style={{ margin: 0 }}>
              <strong>4.6</strong> Where the Client has committed to a specific product, stock keeping units ("SKU"), or user count for a defined period as mentioned under schedule A1 of Annexure A, the Client shall remain liable to pay for the entire committed quantity and period, irrespective of any mid-term reduction, termination, or suspension of the licence/s.
            </p>
            <p style={{ margin: 0 }}>
              <strong>4.7</strong> In the event of any conflict between the general payment terms in this Clause 4 and the product-specific payment terms as mentioned under schedule A1 of Annexure A, the terms of schedule A1 of Annexure A shall prevail solely with respect to product-specific billing mechanics.
            </p>
          </div>
        </div>

        {/* 5. REPRESENTATIONS AND WARRANTIES */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            5. REPRESENTATIONS AND WARRANTIES
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>
              <strong>5.1</strong> Each Party represents and warrants that: (a) it has full legal capacity and authority to enter into this Agreement; (b) this Agreement has been approved and executed by its duly authorised signatory; (c) it is duly incorporated, organized, and validly existing under applicable laws; and (d) it shall comply with all applicable laws, regulations, and governmental requirements in the jurisdictions of its operation throughout the Term.
            </p>
            <p style={{ margin: 0 }}>
              <strong>5.2</strong> The Client shall provide Econz with all documentation required for empanelment, KYC, or be registered as approved at the time of onboarding of the Client.
            </p>
            <p style={{ margin: 0 }}>
              <strong>5.3</strong> Neither Party shall take any action that could have an adverse effect on the name, reputation, or public image of the other Party.
            </p>
            <p style={{ margin: 0 }}>
              <strong>5.4</strong> The Parties shall ensure to fully and promptly observe and comply with such general and specific regulations, instructions, or requirements from time to time, consistent with the terms of this Agreement and the Annexures hereto.
            </p>
          </div>
        </div>

        {/* 6. CONFIDENTIALITY OBLIGATIONS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            6. CONFIDENTIALITY OBLIGATIONS
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>
              <strong>6.1 "Confidential Information"</strong> shall mean and include any non-public business, technical, financial or product related information disclosed by the disclosing Party, or the end customer in connection with the Agreement, including trade secrets, Confidential Information respecting Intellectual Property Rights, inventions, products, data, algorithms, designs, know-how, techniques, systems, processes, software programs, works of authorship, customer lists, projects, plans and proposals and any notes, memoranda, reports, lists, records, drawings, sketches, specifications, data, documentation, and any information of any third party to whom disclosing Party is under an obligation to keep confidential.
            </p>
            <p style={{ margin: 0 }}>
              <strong>6.2</strong> The receiving Party shall hold the disclosing Party's Confidential Information in strict confidence, use it solely for the purposes of this Agreement and disclose it only to those employees or authorised personnel who have a need to know and who are bound by confidentiality obligations no less protective than those in this Clause 6.
            </p>
            <p style={{ margin: 0 }}>
              <strong>6.3</strong> Confidentiality obligations and restrictions shall not apply to Confidential Information that: (a) is or becomes publicly known through no fault of the receiving Party; (b) was already in the receiving Party's possession free of any confidentiality obligation at the time of disclosure; (c) is lawfully received from a third party free of any restriction; (d) is independently developed by the receiving Party without use of the Confidential Information; or (e) is required to be disclosed by applicable law, court order, or governmental authority.
            </p>
            <p style={{ margin: 0 }}>
              <strong>6.4</strong> The obligations of this Clause 6 shall survive for a period of one (1) year following the termination or expiry of this Agreement.
            </p>
          </div>
        </div>

        {/* 7. INTELLECTUAL PROPERTY RIGHTS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            7. INTELLECTUAL PROPERTY RIGHTS
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>
              <strong>7.1</strong> Each Party retains sole and exclusive ownership of all intellectual property rights in its pre-existing works, technology, software, data, and materials. No rights, title, or interest in either Party's intellectual property is transferred or licensed to the other Party under this Agreement except to the limited extent expressly necessary to perform the Services.
            </p>
            <p style={{ margin: 0 }}>
              <strong>7.2</strong> OEM products remain the exclusive intellectual property of the respective OEM and are governed solely by the applicable OEM terms of service.
            </p>
          </div>
        </div>

        {/* 8. DATA PRIVACY */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            8. DATA PRIVACY
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>
              <strong>8.1</strong> Econz hereby agrees to take all necessary precautions to protect the Client's Confidential Information, Billing Data, and the KYC details of the authorized signatory of the Client, and implement reasonable security practices and measures that are commensurate with respect to the Confidential Information disclosure for the purpose of this Agreement.
            </p>
            <p style={{ margin: 0 }}>
              <strong>8.2</strong> Econz shall take all reasonable steps to protect the confidential information provided by the Client from loss, misuse, and unauthorized access, disclosure, alteration, or destruction solely by Econz or its employees. Econz shall comply with all the regulations provided under the Information Technology Act 2000, Information Technology Rules, 2011 and Digital Personal Data Protection Act, 2023.
            </p>
            <p style={{ margin: 0 }}>
              <strong>8.3</strong> The provisions under Clauses 8.1 and 8.2 shall apply only if the Client provides Econz with privileged access to the Client data.
            </p>
          </div>
        </div>

        {/* 9. INDEMNITY AND LIMITATION OF LIABILITY */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            9. INDEMNITY AND LIMITATION OF LIABILITY
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>
              <strong>9.1</strong> Without prejudice to any other rights and remedies available to the Parties under this Agreement or law, either Party shall mutually indemnify, defend, and hold harmless the other Party and its directors, officers, employees, and permitted assigns against any claims, damages, liabilities, losses, penalties, costs, and proceedings arising from infringement, breach, negligence, fraud, misrepresentation, or unauthorized act.
            </p>
            <p style={{ margin: 0 }}>
              <strong>9.2</strong> In no event shall either Party be liable to the other for any special, incidental, consequential, indirect, or punitive damages, including loss of profits, loss of revenue, loss of data, loss of goodwill, business interruption, or cost of substitute products or services.
            </p>
            <p style={{ margin: 0 }}>
              <strong>9.3</strong> Notwithstanding any other provision, either Party's total aggregate liability to the other Party for direct damages arising under or in connection with any schedule under Annexure A shall not exceed the total Fees paid by the Client to Econz during the six (06) months immediately preceding the event giving rise to the claim under the respective schedule/s of Annexure A.
            </p>
            <p style={{ margin: 0 }}>
              <strong>9.4</strong> No claim, regardless of form, arising under or in connection with this Agreement may be brought by either Party more than three (3) years after the date on which the cause of action occurred.
            </p>
            <p style={{ margin: 0 }}>
              <strong>9.5</strong> Econz shall have no liability for any loss, damage, or disruption to the Client's IT environment resulting from alterations, additions, repairs, or maintenance carried out by any party other than by Econz's authorized personnel.
            </p>
          </div>
        </div>

        {/* 10. TERMINATION AND CONSEQUENCES */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            10. TERMINATION AND CONSEQUENCES
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>
              <strong>10.1</strong> Either Party may terminate this Agreement and all active schedules under Annexure A immediately upon written notice if the other Party commits a material breach and fails to remedy such breach within thirty (30) days, becomes insolvent, discontinues business operations, or delays payment beyond the timelines stipulated in Clause 4.
            </p>
            <p style={{ margin: 0 }}>
              <strong>10.2</strong> Where the Client has opted for a committed subscription and terminates the Agreement or any schedule prior to the expiry of the committed term, Econz shall invoice the Client for the true-up amount.
            </p>
            <p style={{ margin: 0 }}>
              <strong>10.3</strong> Upon termination or expiry of this Agreement or any schedule under Annexure A, the Client shall remain obligated to pay all amounts due to Econz for the Services rendered, including all charges accrued up to the date on which the relevant OEM suspends or terminates access to the Client, the provisions of Clauses 4.5 and 4.6, Clause 6, Clause 7, Clause 8, Clause 9, and this Clause 10.3 shall survive the termination or expiry of this Agreement.
            </p>
            <p style={{ margin: 0 }}>
              <strong>10.4</strong> Upon expiry or termination, either Party shall promptly return to the other all property, documentation, and confidential information of the disclosing Party in its possession.
            </p>
          </div>
        </div>

        {/* 11. DISPUTE RESOLUTION, GOVERNING LAW AND JURISDICTION */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            11. DISPUTE RESOLUTION, GOVERNING LAW AND JURISDICTION
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>
              <strong>11.1</strong> The Parties shall first attempt to resolve any dispute through mutual consultation. If unresolved within thirty (30) days, either Party may resort to arbitration, wherein the Parties shall mutually appoint a sole arbitrator, in accordance with the Indian Arbitration and Conciliation Act, 1996. The seat for arbitration shall be Bengaluru, Karnataka, and the language of arbitration shall be English.
            </p>
            <p style={{ margin: 0 }}>
              <strong>11.2</strong> This Agreement and all matters arising under it shall be governed by and construed in accordance with the laws of India. The Parties submit to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
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
              <strong>12.1</strong> Neither Party shall be liable for any delay or failure to perform its obligations under the Agreement to the extent that such delay or failure is caused by circumstances beyond the Party's reasonable control, including acts of God, natural disasters, war, civil unrest, epidemic or pandemic, acts of government, or power or internet outages.
            </p>
          </div>
        </div>

        {/* 13. GENERAL PROVISIONS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            13. GENERAL PROVISIONS
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}><strong>13.1 Non-Solicitation:</strong> During the Term and for one (01) year thereafter, neither Party shall directly or indirectly solicit, recruit, or offer employment to any employee of the other Party without prior written consent.</p>
            <p style={{ margin: 0 }}><strong>13.2 Publicity:</strong> Either Party may use, with prior written consent, the other Party's name and logo in connection with this Agreement in accordance with applicable trademark guidelines.</p>
            <p style={{ margin: 0 }}><strong>13.3 Relationship:</strong> Nothing in this Agreement creates a relationship of principal and agent, and employer and employee, partnership, or joint venture between the Parties.</p>
            <p style={{ margin: 0 }}><strong>13.4 Assignment:</strong> Neither Party may assign this Agreement or any rights or obligations hereunder without the prior written consent of the other Party.</p>
            <p style={{ margin: 0 }}><strong>13.5 Notice:</strong> All notices under this Agreement shall be in writing in English and delivered by personal delivery, confirmed email, commercial courier, or registered post.</p>
            <p style={{ margin: 0 }}><strong>13.6 Waiver:</strong> No failure or delay by either Party in exercising any right under this Agreement shall constitute a waiver of that right or any other right.</p>
            <p style={{ margin: 0 }}><strong>13.7 Severability:</strong> If any provision of this Agreement is held to be invalid or unenforceable, such provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.</p>
            <p style={{ margin: 0 }}><strong>13.8 Entire Agreement:</strong> This Agreement, including all Annexures, constitutes the entire agreement between the Parties with respect to its subject matter.</p>
            <p style={{ margin: 0 }}><strong>13.9 Counterparts:</strong> This Agreement may be executed in counterparts, including electronic or digital signatures, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument.</p>
          </div>
        </div>

        {/* IN WITNESS WHEREOF */}
        <div style={{ marginBottom: '1.5rem', fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify' }}>
          <p style={{ margin: 0 }}>
            <strong>IN WITNESS WHEREOF</strong>, the Parties have caused this Agreement to be executed by their duly authorised representatives as of the Execution Date first written above.
          </p>
        </div>

        {/* Signature Blocks */}
        <div style={{ marginBottom: '2.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #0e7490' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ ...sigHeaderStyle, borderRight: '1px solid rgba(255,255,255,0.3)' }}>For and on behalf of ECONZ</th>
                <th colSpan={2} style={sigHeaderStyle}>For and on behalf of CLIENT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={sigLabelStyle}>Signature:</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0', height: '36px' }}>&nbsp;</td>
                <td style={sigLabelStyle}>Signature:</td>
                <td style={{ ...sigCellStyle, height: '36px' }}>&nbsp;</td>
              </tr>
              <tr>
                <td style={sigLabelStyle}>Full Name:</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0', fontWeight: 700 }}>Karthik Keshava Murthy</td>
                <td style={sigLabelStyle}>Full Name:</td>
                <td style={{ ...sigCellStyle, fontWeight: 700 }}>{quote.pocName || quote.customerName?.toUpperCase() || ''}</td>
              </tr>
              <tr>
                <td style={sigLabelStyle}>Title:</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>Director</td>
                <td style={{ ...sigLabelStyle, color: '#0284c7' }}>Title:</td>
                <td style={{ ...sigCellStyle, color: '#0284c7', fontWeight: 700 }}>{quote.pocDesignation || 'Authorized Signatory'}</td>
              </tr>
              <tr>
                <td style={sigLabelStyle}>Date:</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>{quote.documentExecutionDate || '—'}</td>
                <td style={sigLabelStyle}>Date:</td>
                <td style={sigCellStyle}>{quote.documentExecutionDate || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── ANNEXURE A ── */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Annexure A</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', margin: '0 0 1.5rem 0' }}>Commercial Terms, Pricing &amp; Product-Specific Conditions</p>
        </div>

        <p style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', marginBottom: '1.5rem' }}>
          This Annexure A forms an integral part of the Reseller Services Agreement executed between the Parties and sets out the commercial terms specific to the OEM products and Services selected by the Client.
        </p>

        {/* A1. Licence & Pricing Details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            A1. Licence &amp; Pricing Details
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#0e7490', color: 'white' }}>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 700 }}>SKU / Product</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Quantity</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>Unit Price ({quote.currency || 'INR'})</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Commitment Type</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Payment Frequency</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {skus.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                    No products attached to this order.
                  </td>
                </tr>
              ) : (
                skus.map((sku, idx) => (
                  <tr key={`a1-${idx}`} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 1 ? '#f8fafc' : 'white' }}>
                    <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>{sku.name || sku.code}</td>
                    <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>{sku.qty || 1}</td>
                    <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>{sym}{(sku.sellPrice || 0).toFixed(2)}</td>
                    <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>{sku.subPlan || 'Annual Commit'}</td>
                    <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>{sku.billingCycle || 'Monthly'}</td>
                    <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{sym}{((sku.sellPrice || 0) * (sku.qty || 1)).toFixed(2)}</td>
                  </tr>
                ))
              )}
              {skus.length > 0 && (
                <>
                  <tr style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <td colSpan={5} style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontSize: '11px', color: '#475569', fontWeight: 600 }}>Subtotal :</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{sym}{subtotal.toFixed(2)}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={5} style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontSize: '11px', color: '#475569', fontWeight: 600 }}>GST @ 18% :</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{sym}{gstAmt.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #cbd5e1', background: '#f1f5f9' }}>
                    <td colSpan={5} style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '12px', color: '#0e7490', textTransform: 'uppercase' }}>Grand Total :</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '12px', color: '#0e7490' }}>{sym}{grandTotal.toFixed(2)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* A2. Professional Services */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            A2. Professional Services (if applicable)
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#0e7490', color: 'white' }}>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 700 }}>Service</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Quantity</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>Unit Price ({quote.currency || 'INR'})</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Commitment Type</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Payment Frequency</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No professional services attached to this contract</td></tr>
            </tbody>
          </table>
        </div>

        {/* A3. Technical Support Services */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            A3. Technical Support Services
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#0e7490', color: 'white' }}>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 700 }}>Service</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Quantity</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>Unit Price ({quote.currency || 'INR'})</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Commitment Type</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Payment Frequency</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No technical support services attached to this contract</td></tr>
            </tbody>
          </table>
        </div>

        {/* A4-A7 Reference Links */}
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '2', marginBottom: '2rem' }}>
          <p style={{ margin: 0 }}><strong>A4. Econz Technical Support Guidelines</strong></p>
          <p style={{ color: '#0284c7', wordBreak: 'break-all', margin: 0 }}>https://docs.google.com/document/d/1w893pL2oU_z-42...</p>
          <p style={{ marginTop: '0.5rem', marginBottom: 0 }}><strong>A5. Google Workspace Service Level Agreement</strong></p>
          <p style={{ color: '#0284c7', margin: 0 }}>https://workspace.google.com/intl/en/terms/sla.html</p>
          <p style={{ marginTop: '0.5rem', marginBottom: 0 }}><strong>A6. Google Workspace Terms of Service</strong></p>
          <p style={{ color: '#0284c7', margin: 0 }}>https://workspace.google.com/terms/premier_terms_at_in_billing.html</p>
          <p style={{ marginTop: '0.5rem', marginBottom: 0 }}><strong>A7. Google Workspace Features</strong></p>
          <p style={{ margin: 0 }}>Google Workspace Business Editions: <span style={{ color: '#0284c7' }}>https://support.google.com/a/answer/6043385</span></p>
          <p style={{ margin: 0 }}>Google Workspace Enterprise Editions: <span style={{ color: '#0284c7' }}>https://support.google.com/a/answer/7284269</span></p>
        </div>

        {/* Execution of Annexure A Signature Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', textAlign: 'center', textTransform: 'uppercase' }}>
            Execution of Annexure A
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #0e7490' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ ...sigHeaderStyle, borderRight: '1px solid rgba(255,255,255,0.3)' }}>For and on behalf of ECONZ</th>
                <th colSpan={2} style={sigHeaderStyle}>For and on behalf of CLIENT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={sigLabelStyle}>Signature:</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0', height: '36px' }}>&nbsp;</td>
                <td style={sigLabelStyle}>Signature:</td>
                <td style={{ ...sigCellStyle, height: '36px' }}>&nbsp;</td>
              </tr>
              <tr>
                <td style={sigLabelStyle}>Full Name:</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0', fontWeight: 700 }}>Karthik Keshava Murthy</td>
                <td style={sigLabelStyle}>Full Name:</td>
                <td style={{ ...sigCellStyle, fontWeight: 700 }}>{quote.pocName || quote.customerName?.toUpperCase() || ''}</td>
              </tr>
              <tr>
                <td style={sigLabelStyle}>Title:</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>Director</td>
                <td style={{ ...sigLabelStyle, color: '#0284c7' }}>Title:</td>
                <td style={{ ...sigCellStyle, color: '#0284c7', fontWeight: 700 }}>{quote.pocDesignation || 'Authorized Signatory'}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
