import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Send, 
  Pencil, 
  Download, 
  Loader2
} from 'lucide-react';
import DocumentContractView from '../components/DocumentContractView';

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
  const subtotal = skus.reduce((sum, s) => sum + ((parseFloat(s.sellPrice) || 0) * (parseInt(s.qty) || 1)), 0);
  const isIndia = quote.currency === 'INR' || quote.entity === 'India';
  const isUK = quote.currency === 'GBP' || quote.entity === 'UK';
  const taxRate = isIndia ? 0.18 : (isUK ? 0.05 : 0.0);
  const taxName = isIndia ? 'GST (18%)' : (isUK ? 'VAT (5%)' : 'Tax (0%)');
  const gstAmt = subtotal * taxRate;
  const grandTotal = subtotal + gstAmt;

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

      {/* Main Document Paper Sheet */}
      <DocumentContractView
        refId={quote.refId}
        executionDate={quote.documentExecutionDate}
        customerName={quote.customerName}
        companyShortName={quote.companyShortName}
        orderPan={quote.orderPan}
        taxIdType={quote.taxIdType}
        orderAddress={quote.orderAddress}
        pocName={quote.pocName}
        pocDesignation={quote.pocDesignation}
        pocEmail={quote.pocEmail}
        pocMobile={quote.pocMobile}
        entity={quote.entity}
        currency={quote.currency}
        billTo={quote.billTo}
        dealType={quote.dealType}
        templateName={quote.templateTitle || 'Google Workspace Business Plus Business Associated Services'}
        skus={skus}
        subtotal={subtotal}
        taxAmount={gstAmt}
        taxName={taxName}
        finalContractValue={grandTotal}
        econzSignerName={quote.econzSignerName || 'Srikar M'}
        econzSignerTitle={quote.econzSignerTitle || 'Head - Revenue Operations'}
        customClauses={quote.documentCustomClauses}
      />
    </div>
  );
}
