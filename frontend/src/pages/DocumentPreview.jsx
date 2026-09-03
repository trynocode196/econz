import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Send, 
  Pencil, 
  Download, 
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  FileCheck
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
  const [syncing, setSyncing] = useState(false);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await api.get(`/quotes/${id}`);
      setQuote(res.data);
    } catch (err) {
      showToast('Failed to load contract document', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // Periodic auto-check when in 'Sent for Signature' status
  useEffect(() => {
    if (!quote || quote.status !== 'Sent for Signature' || !quote.boldSignDocumentId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.post(`/quotes/${id}/sync-boldsign`);
        if (res.data?.quote) {
          if (res.data.quote.status !== 'Sent for Signature') {
            setQuote(res.data.quote);
            showToast('Document has been signed by customer! Updated PDF fetched.', 'success');
          }
        }
      } catch (e) {
        // silent polling catch
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [quote, id, showToast]);

  const handleSyncBoldSign = async () => {
    setSyncing(true);
    try {
      const res = await api.post(`/quotes/${id}/sync-boldsign`);
      if (res.data?.quote) {
        setQuote(res.data.quote);
        if (res.data.status === 'Customer Signed') {
          showToast('Customer signed document! Signed PDF successfully replaced.', 'success');
        } else {
          showToast(`Signature status synced: ${res.data.boldSignStatus || res.data.status}`, 'info');
        }
      }
    } catch (err) {
      showToast('Failed to sync BoldSign status', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSendViaBoldSign = async () => {
    setSending(true);
    try {
      const res = await api.post(`/quotes/${id}/send-boldsign`);
      showToast('Template copied, variables replaced in Google Docs, and sent via BoldSign!', 'success');
      if (res.data?.quote) {
        setQuote(res.data.quote);
      } else {
        setQuote(prev => prev ? {
          ...prev,
          status: 'Sent for Signature',
          boldSignDocumentId: res.data?.boldSignDocumentId,
          documentUrl: res.data?.documentUrl,
          pdfUrl: res.data?.pdfUrl
        } : prev);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to dispatch BoldSign agreement', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPDF = () => {
    if (quote?.pdfUrl) {
      window.open(quote.pdfUrl, '_blank');
    } else {
      window.print();
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

  const isSigned = quote.status === 'Customer Signed' || quote.status === 'Signed' || quote.status === 'Completed';
  const isSent = quote.status === 'Sent for Signature';

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
      
      {/* Top Header Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Linked Google Doc Button */}
          {quote.documentUrl && (
            <a
              href={quote.documentUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '0.65rem',
                border: '1px solid #93c5fd',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '0.85rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <FileText size={15} color="#2563eb" />
              <span>Document File (Google Doc)</span>
              <ExternalLink size={12} />
            </a>
          )}

          {/* Linked PDF File Button (Direct or Replaced with Signed PDF) */}
          {quote.pdfUrl && (
            <a
              href={quote.pdfUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '0.65rem',
                border: isSigned ? '1px solid #86efac' : '1px solid #fecaca',
                background: isSigned ? '#f0fdf4' : '#fef2f2',
                color: isSigned ? '#15803d' : '#dc2626',
                fontSize: '0.85rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              {isSigned ? <FileCheck size={15} color="#16a34a" /> : <Download size={15} color="#dc2626" />}
              <span>{isSigned ? 'Signed PDF File' : 'PDF File'}</span>
              <ExternalLink size={12} />
            </a>
          )}

          {/* Sync Signature Status Button (visible when Sent for Signature) */}
          {isSent && quote.boldSignDocumentId && (
            <button
              type="button"
              onClick={handleSyncBoldSign}
              disabled={syncing}
              title="Check if customer has signed in BoldSign"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem',
                borderRadius: '0.65rem',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-1)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Checking...' : 'Sync Signature'}</span>
            </button>
          )}

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

          {/* HIDE EDIT BUTTON AFTER SIGNED */}
          {!isSigned && (
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
          )}

          {/* SEND VIA BOLDSIGN / STATUS BADGES */}
          {(!quote.boldSignDocumentId && !isSent && !isSigned) ? (
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
          ) : isSigned ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '0.65rem',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.85rem',
                fontWeight: 800
              }}
            >
              <FileCheck size={16} color="#059669" />
              <span>Customer Signed ✓</span>
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  borderRadius: '0.65rem',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}
              >
                <CheckCircle size={15} color="#0284c7" />
                <span>Sent for Signature</span>
              </span>

              <button
                type="button"
                onClick={handleSendViaBoldSign}
                disabled={sending}
                title="Resend signing invitation email via BoldSign"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.65rem',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.75 : 1,
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                }}
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>{sending ? 'Sending via BoldSign...' : 'Resend Via BoldSign'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Document Paper Sheet */}
      <DocumentContractView
        refId={quote.refId}
        executionDate={quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
        customerName={quote.customerName || quote.customer?.account || 'Client Name'}
        companyShortName={quote.companyShortName || quote.customer?.companyShortName}
        orderPan={quote.orderPan || quote.customer?.pan}
        taxIdType={quote.taxIdType || quote.customer?.taxIdType || 'PAN'}
        orderAddress={quote.orderAddress || quote.customer?.address}
        pocName={quote.pocName || quote.customer?.contacts?.[0]?.name}
        pocDesignation={quote.pocDesignation || quote.customer?.contacts?.[0]?.role}
        pocEmail={quote.pocEmail || quote.customer?.contacts?.[0]?.email}
        pocMobile={quote.pocMobile || quote.customer?.contacts?.[0]?.phone}
        entity={quote.entity || quote.customer?.entity || 'India'}
        currency={quote.currency || 'INR'}
        billTo={quote.billTo || quote.customer?.customerType || 'Direct'}
        dealType={quote.dealType || 'Annual'}
        templateName={quote.templateTitle || quote.template || 'Google Workspace Business Plus Business Associated Services'}
        skus={skus}
        subtotal={subtotal}
        taxAmount={gstAmt}
        taxName={taxName}
        finalContractValue={quote.value || grandTotal}
        econzSignerName={quote.econzSignerName || 'Srikar M'}
        econzSignerTitle={quote.econzSignerTitle || 'Head - Revenue Operations'}
      />

    </div>
  );
}
