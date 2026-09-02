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
  const totalAmount = skus.reduce((sum, item) => sum + ((item.sellPrice || 0) * (item.qty || 1)), 0);

  const sigTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8rem',
    border: '1px solid #cbd5e1',
    margin: '1rem 0 1.5rem 0'
  };

  const sigHeaderStyle = {
    background: '#f1f5f9',
    borderBottom: '1px solid #cbd5e1',
    padding: '0.45rem 0.75rem',
    fontWeight: 700,
    color: '#334155'
  };

  const sigCellStyle = {
    borderBottom: '1px solid #e2e8f0',
    padding: '0.45rem 0.75rem',
    color: '#334155',
    verticalAlign: 'top'
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'justify', marginBottom: '1.5rem' }}>
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
          <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem 0' }}>
            RECITALS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', textAlign: 'justify' }}>
            <p style={{ margin: 0 }}>
              <strong>A.</strong> Econz is a Google Cloud Premier Partner and an authorised reseller of Google Workspace / Google Cloud Platform, and other OEM products, including Microsoft and Amazon Web Services, engaged in providing cloud solutions and associated professional services to clients.
            </p>
            <p style={{ margin: 0 }}>
              <strong>B.</strong> The Client is engaged in the business of <strong>Information Technology (IT) & Software</strong> and is desirous of availing the Services provided by Econz.
            </p>
            <p style={{ margin: 0, fontWeight: 700 }}>
              BY EXECUTING THIS AGREEMENT, THE CLIENT CONSENTS TO BE BOUND BY ITS TERMS AND CONDITIONS, AND THE AUTHORISED SIGNATORY OF THE CLIENT REPRESENTS THAT THEY ARE DULY AUTHORISED TO EXECUTE THIS AGREEMENT ON BEHALF OF THE CLIENT.
            </p>
          </div>
        </div>

        {/* 1. DEFINITIONS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem 0' }}>
            1. DEFINITIONS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', textAlign: 'justify' }}>
            <p style={{ margin: 0 }}>
              <strong>1.1 "Billing Data"</strong> shall mean and include the Client's name, registered office address, Permanent Account Number (PAN), Goods and Services Tax Identification Number (GSTIN), the contact number of the SPOC, and the Permanent Account Number (PAN) of the authorized signatory of the Client, which are collected by Econz solely for the purpose of billing and Know Your Customer (KYC) requirements as mandated by the regulations in India.
            </p>
            <p style={{ margin: 0 }}>
              <strong>1.2 "Fees"</strong> means the charges payable by the Client to Econz as set out under schedule A1 of Annexure A.
            </p>
          </div>
        </div>

        {/* Custom Clauses if present */}
        {quote.documentCustomClauses && quote.documentCustomClauses.trim() && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem 0' }}>
              SPECIAL TERMS & CONDITIONS
            </h2>
            <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
              {quote.documentCustomClauses}
            </div>
          </div>
        )}

        {/* Signatures Section */}
        <div style={{ marginTop: '2rem' }}>
          <table style={sigTableStyle}>
            <thead>
              <tr>
                <th style={{ ...sigHeaderStyle, width: '22%', borderRight: '1px solid #cbd5e1' }}>Party</th>
                <th style={{ ...sigHeaderStyle, width: '39%', borderRight: '1px solid #cbd5e1' }}>Econz</th>
                <th style={{ ...sigHeaderStyle, width: '39%' }}>Client</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...sigCellStyle, fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>Entity Name</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>ECONZ IT SERVICES PRIVATE LIMITED</td>
                <td style={{ ...sigCellStyle, fontWeight: 700 }}>{quote.customerName?.toUpperCase() || 'TRYNOCODE'}</td>
              </tr>
              <tr>
                <td style={{ ...sigCellStyle, fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>Signature</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0', height: '44px' }}></td>
                <td style={{ ...sigCellStyle }}></td>
              </tr>
              <tr>
                <td style={{ ...sigCellStyle, fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>Name</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>Karthik Keshava Murthy</td>
                <td style={{ ...sigCellStyle, fontWeight: 700 }}>{quote.pocName || 'Pranav'}</td>
              </tr>
              <tr>
                <td style={{ ...sigCellStyle, fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>Designation</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>Director</td>
                <td style={{ ...sigCellStyle, color: '#0284c7', fontWeight: 700 }}>{quote.pocDesignation || 'Authorized Signatory'}</td>
              </tr>
              <tr>
                <td style={{ ...sigCellStyle, fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>Date</td>
                <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>{quote.documentExecutionDate || '—'}</td>
                <td style={{ ...sigCellStyle }}>{quote.documentExecutionDate || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ANNEXURE A: SCOPE OF SERVICES & PRICING */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px dashed #e2e8f0' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, textAlign: 'center', textTransform: 'uppercase', color: '#0f172a', margin: '0 0 1.25rem 0' }}>
            ANNEXURE A — SCOPE OF SERVICES & COMMERCIALS
          </h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155' }}>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700 }}>SKU / Product Description</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Plan / Term</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>Qty</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>Unit Price ({quote.currency || 'INR'})</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {skus.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                    No products / SKUs attached.
                  </td>
                </tr>
              ) : (
                skus.map((sku, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{sku.name || sku.code}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>{sku.subPlan || '12 Months'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>{sku.qty || 1}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>{sym}{(sku.sellPrice || 0).toFixed(2)}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{sym}{((sku.sellPrice || 0) * (sku.qty || 1)).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={4} style={{ padding: '0.75rem', textAlign: 'right', textTransform: 'uppercase' }}>
                  Total Contract Value:
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#0284c7', fontSize: '0.9rem' }}>
                  {sym}{totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

    </div>
  );
}
