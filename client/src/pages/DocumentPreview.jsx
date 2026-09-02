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

  const clientName = quote.pocName || quote.customerName?.toUpperCase() || 'AMARJEET';
  const clientTitle = quote.pocDesignation || 'Project Manager';
  const econzSignerName = quote.econzSignerName || 'Srikar M';
  const econzSignerTitle = quote.econzSignerTitle || 'Head - Revenue Operations';

  // Underlined Signature Box Component
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
            <div style={{ fontWeight: 800, textTransform: 'uppercase', marginTop: '0.15rem' }}>{clientName}</div>
            <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ color: '#475569', fontSize: '10px' }}>Title:</div>
            <div style={{ fontWeight: 700, marginTop: '0.15rem' }}>{clientTitle}</div>
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
              <strong>2.3</strong> The Services shall include any additional tasks that the Parties may mutually agree to in writing from time to time. Any additional Services agreed shall be documented in a written order form or amendment signed by both Parties.</p>
            <p style={{ margin: 0 }}>
              <strong>2.4</strong> The Client must ensure and provide Econz with complete and uninterrupted access to the domain name credentials for OEM provisioning.</p>
            <p style={{ margin: 0 }}>
              <strong>2.5</strong> Except with respect to any service-related and pricing-related terms expressly set out under the respective schedule/s mentioned in Annexure A, in the event of any inconsistency or conflict between the terms of this Agreement and any schedule/s mentioned under Annexure A, the terms of this Agreement shall prevail.</p>
          </div>
        </div>

        {/* 3. EFFECTIVE DATE AND TERM */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            3. EFFECTIVE DATE AND TERM
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}><strong>3.1</strong> The effective date of this Agreement shall be the date on which Econz first provides Services to the Client, which shall be ("Effective Date").</p>
            <p style={{ margin: 0 }}><strong>3.2</strong> This Agreement shall remain in full force and effect for a period of Months from the Effective Date, or until the expiry or termination of the last active schedule under Annexure A, whichever is later ("Term"). Each schedule under Annexure A shall independently specify the product-specific term applicable to that product line.</p>
            <p style={{ margin: 0 }}><strong>3.3</strong> Unless either Party provides written notice of non-renewal at least <strong>Yearly</strong> prior to the expiry of the term, this Agreement shall automatically renew for successive periods of one (1) year.</p>
          </div>
        </div>

        {/* 4. FEES, INVOICING, AND PAYMENTS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            4. FEES, INVOICING, AND PAYMENTS
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}><strong>4.1</strong> The Client shall pay fees as set both in schedule A1 of Annexure A for the Services rendered by Econz. All Fees are exclusive of applicable taxes, including GST, which shall be levied at the then-applicable statutory rates.</p>
            <p style={{ margin: 0 }}><strong>4.2</strong> Econz shall raise invoices in advance for all OEM products being resold. The Client shall make payment within the date of receipt of the invoice. Econz shall issue a tax invoice with applicable IDS rates.</p>
            <p style={{ margin: 0 }}><strong>4.3</strong> Any additional gateway charges (credit/debit card or digital payment platforms) or bank transaction charges shall be borne by the Client.</p>
            <p style={{ margin: 0 }}><strong>4.4</strong> In the event of failure or delay in payment beyond the stipulated due date, late payment charges shall accrue at the rate of one and a half percent (1.5%) per month on the outstanding amount, until the date of actual receipt of the delayed payment by Econz.</p>
            <p style={{ margin: 0 }}><strong>4.5</strong> In event of non-payment beyond thirty (30) days from the invoice due date, Econz shall issue a written notice of suspension to the Client. In the event the Client fails to clear outstanding dues within fifteen (15) days of such notice, Econz shall be entitled to suspend access to the Services and, thereafter, to terminate the licence.</p>
            <p style={{ margin: 0 }}><strong>4.6</strong> Where the Client has committed to a specific product, stock keeping units ("SKU"), or user count for a defined period as mentioned under schedule A1 of Annexure A, the Client shall remain liable to pay for the entire committed quantity and period, irrespective of any mid-term reduction, termination, or suspension of the licence/s.</p>
            <p style={{ margin: 0 }}><strong>4.7</strong> In the event of any conflict between the general payment terms in this Clause 4 and the product-specific payment terms as mentioned under schedule A1 of Annexure A, the terms of schedule A1 of Annexure A shall prevail solely with respect to product-specific billing mechanics.</p>
          </div>
        </div>

        {/* 5-13. OTHER CLAUSES */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            5. REPRESENTATIONS AND WARRANTIES
          </h2>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify' }}>
            <p style={{ margin: 0 }}><strong>5.1</strong> Each Party represents and warrants that: (a) it has full legal capacity and authority to enter into this Agreement; (b) this Agreement has been approved and executed by its duly authorised signatory; (c) it is duly incorporated, organized, and validly existing under applicable laws; and (d) it shall comply with all applicable laws, regulations, and governmental requirements.</p>
          </div>
        </div>

        {/* IN WITNESS WHEREOF Statement */}
        <div style={{ marginBottom: '1.25rem', fontSize: '11px', color: '#1e293b', lineHeight: '1.7', textAlign: 'justify' }}>
          <p style={{ margin: 0 }}>
            <strong>IN WITNESS WHEREOF</strong>, the Parties have caused this Agreement to be executed by their duly authorised representatives as of the Execution Date first written above.
          </p>
        </div>

        {/* Master Agreement Underlined Signature Block */}
        {renderSignatureSection(false)}

        {/* ── ANNEXURE A ── */}
        <div style={{ textAlign: 'center', marginBottom: '0.5rem', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>Annexure A</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', margin: '0 0 1.5rem 0' }}>Commercial Terms, Pricing &amp; Product-Specific Conditions</p>
        </div>

        <p style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', marginBottom: '1.5rem' }}>
          This Annexure A forms an integral part of the Reseller Services Agreement executed between the Parties and sets out the commercial terms specific to the OEM products and Services selected by the Client.
        </p>

        {/* A1. Licence & Pricing Details Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            A1. Licence &amp; Pricing Details
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '22%' }}>SKU / Product</th>
                <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Quantity</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'right' }}>Unit Price ({quote.currency || 'INR'})</th>
                <th style={{ ...thStyle, width: '15%', textAlign: 'center' }}>Commitment Type</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'center' }}>Payment Frequency</th>
                <th style={{ ...thStyle, width: '11%', textAlign: 'center' }}>Credit Terms</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'right', borderRight: 'none' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {skus.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                    No products attached to this contract.
                  </td>
                </tr>
              ) : (
                skus.map((sku, idx) => (
                  <tr key={`a1-${idx}`} style={{ background: '#ffffff' }}>
                    <td style={{ ...tdStyle }}>
                      <div style={{ fontWeight: 700 }}>{sku.name || 'Google Workspace Business Plus'}</div>
                      <div style={{ color: '#0284c7', textDecoration: 'underline', fontSize: '10px', marginTop: '0.15rem' }}>
                        {sku.domain || quote.customerDomain || 'abc.in'}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{sku.qty || 1}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{sym}{(sku.sellPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{sku.subPlan || '12 Months'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{sku.billingCycle || 'Yearly'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{sku.creditLimit || '10 Days'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, borderRight: 'none' }}>
                      {sym}{((sku.sellPrice || 0) * (sku.qty || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
              {skus.length > 0 && (
                <>
                  <tr>
                    <td colSpan={6} style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontSize: '11px', color: '#64748b', border: 'none' }}>Subtotal :</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#1e293b', border: 'none', borderRight: '1px solid #cbd5e1' }}>
                      {sym}{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontSize: '11px', color: '#64748b', border: 'none' }}>Gst @ 18% :</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#1e293b', border: 'none', borderRight: '1px solid #cbd5e1' }}>
                      {sym}{gstAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={6} style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#0284c7' }}>Grand Total :</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#0284c7', borderRight: '1px solid #cbd5e1' }}>
                      {sym}{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* A2. Professional Services Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            A2. Professional Services (if applicable)
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '22%' }}>Service</th>
                <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Quantity</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'right' }}>Unit Price ({quote.currency || 'INR'})</th>
                <th style={{ ...thStyle, width: '15%', textAlign: 'center' }}>Commitment Type</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'center' }}>Payment Frequency</th>
                <th style={{ ...thStyle, width: '11%', textAlign: 'center' }}>Credit Terms</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'right', borderRight: 'none' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', borderRight: 'none' }}>
                  No professional services attached to this contract
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '9.5px', color: '#94a3b8', margin: '0.5rem 0 0.35rem 0', fontStyle: 'italic' }}>
            Note: GST at 18% is applicable on all Fees. Commitment types: Flexi | Annual Commit | 2-Year Commit | 3-Year Commit. Payment frequency: Monthly | Quarterly | Half-Yearly | Annual.
          </p>
          <p style={{ fontSize: '10px', color: '#334155', lineHeight: '1.6', margin: 0, textAlign: 'justify' }}>
            Details of any Econz professional or managed services (data migration, deployment, training, managed support) shall be documented in a separate Statement of Work (SOW) appended to this Annexure A, which shall include scope, timelines, deliverables, payment milestones, and acceptance criteria.
          </p>
        </div>

        {/* A3. Technical Support Services Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            A3. Technical Support Services
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '22%' }}>Service</th>
                <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Quantity</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'right' }}>Unit Price ({quote.currency || 'INR'})</th>
                <th style={{ ...thStyle, width: '15%', textAlign: 'center' }}>Commitment Type</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'center' }}>Payment Frequency</th>
                <th style={{ ...thStyle, width: '11%', textAlign: 'center' }}>Credit Terms</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'right', borderRight: 'none' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', borderRight: 'none' }}>
                  No technical support services attached to this contract
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '9.5px', color: '#94a3b8', margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
            Note: GST at 18% is applicable on all Fees. Commitment types: Flexi | Annual Commit | 2-Year Commit | 3-Year Commit. Payment frequency: Monthly | Quarterly | Half-Yearly | Annual.
          </p>
        </div>

        {/* A4-A7 Reference Links */}
        <div style={{ fontSize: '10.5px', color: '#334155', lineHeight: '2', marginBottom: '2rem' }}>
          <p style={{ margin: 0 }}><strong>A4. Econz Technical Support Guidelines</strong></p>
          <p style={{ color: '#0284c7', wordBreak: 'break-all', margin: 0 }}>https://docs.google.com/document/d/1l-xD3xvxc3iUxWhDmycyN_NClwzxwu45atpLJN_II82Q/edit?tab=t.0</p>
          <p style={{ marginTop: '0.5rem', marginBottom: 0 }}><strong>A5. Google Workspace Service Level Agreement</strong></p>
          <p style={{ color: '#0284c7', margin: 0 }}>https://workspace.google.com/intl/en/terms/sla.html</p>
          <p style={{ marginTop: '0.5rem', marginBottom: 0 }}><strong>A6. Google Workspace Terms of Service</strong></p>
          <p style={{ color: '#0284c7', margin: 0 }}>https://workspace.google.com/terms/premier_terms_at_in_billing.html</p>
          <p style={{ marginTop: '0.5rem', marginBottom: 0 }}><strong>A7. Google Workspace Features</strong></p>
          <p style={{ margin: 0 }}>Google Workspace Business Editions: <span style={{ color: '#0284c7' }}>https://support.google.com/a/answer/6043385?hl=en</span></p>
          <p style={{ margin: 0 }}>Google Workspace Enterprise Editions: <span style={{ color: '#0284c7' }}>https://support.google.com/a/answer/7284269?hl=en&ref_topic=4425947</span></p>
        </div>

        {/* Execution of Annexure A */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem' }}>
            Execution of Annexure A
          </h3>
          {renderSignatureSection(true)}
        </div>

      </div>

    </div>
  );
}
