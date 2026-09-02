import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Send, 
  Download, 
  Search,
  FileText,
  RefreshCw,
  Pencil,
  X
} from 'lucide-react';

/** Board columns — aligned with Quote model statuses + friendly display names */
const DOCUMENT_STATUS_COLUMNS = [
  'Draft',
  'Pending Approval',
  'Approved',
  'Sent for Signature',
  'Customer Signed',
  'Rejected',
  'Completed',
];

const COLUMN_THEMES = {
  'Draft': {
    lightBg: 'rgba(241, 245, 249, 0.5)',
    darkBg: 'rgba(15, 28, 52, 0.4)',
    border: 'var(--border-subtle)',
    accent: '#64748b',
    badgeBg: 'var(--surface-3)',
    badgeText: 'var(--text-secondary)'
  },
  'Pending Approval': {
    lightBg: 'rgba(254, 243, 199, 0.4)',
    darkBg: 'rgba(251, 191, 36, 0.03)',
    border: 'rgba(245, 158, 11, 0.12)',
    accent: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#d97706'
  },
  'Approved': {
    lightBg: 'rgba(204, 251, 241, 0.35)',
    darkBg: 'rgba(34, 211, 238, 0.03)',
    border: 'rgba(34, 211, 238, 0.12)',
    accent: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    badgeText: '#0891b2'
  },
  'Sent for Signature': {
    lightBg: 'rgba(239, 246, 255, 0.4)',
    darkBg: 'rgba(59, 130, 246, 0.03)',
    border: 'rgba(59, 130, 246, 0.12)',
    accent: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#2563eb'
  },
  'Customer Signed': {
    lightBg: 'rgba(250, 245, 255, 0.4)',
    darkBg: 'rgba(139, 92, 246, 0.03)',
    border: 'rgba(139, 92, 246, 0.12)',
    accent: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
    badgeText: '#7c3aed'
  },
  'Rejected': {
    lightBg: 'rgba(254, 226, 226, 0.35)',
    darkBg: 'rgba(239, 68, 68, 0.03)',
    border: 'rgba(239, 68, 68, 0.12)',
    accent: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeText: '#dc2626'
  },
  'Completed': {
    lightBg: 'rgba(209, 250, 229, 0.35)',
    darkBg: 'rgba(16, 185, 129, 0.03)',
    border: 'rgba(16, 185, 129, 0.12)',
    accent: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#059669'
  }
};

export default function Quotes() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('table'); // Default to Table
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotes');
      const data = Array.isArray(res.data) ? res.data : res.data?.quote ? [res.data.quote] : [];
      setQuotes(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error loading documents', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes, location.pathname]);

  // Search filter
  const getFilteredQuotes = () => {
    const filtered = quotes.filter(q => {
      const qId = q.refId || '';
      const qCust = q.customerName || '';
      const qTitle = q.title || '';
      const query = searchQuery.toLowerCase();
      return (
        qId.toLowerCase().includes(query) ||
        qCust.toLowerCase().includes(query) ||
        qTitle.toLowerCase().includes(query)
      );
    });
    return filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  };

  const filteredQuotes = getFilteredQuotes();

  // Helper for currencies
  const getCurrencySymbol = (curr) => {
    const symbols = { INR: '₹', USD: '$', AED: 'د.إ', GBP: '£' };
    return symbols[curr] || '$';
  };

  const formatValue = (value, currency) => {
    const sym = getCurrencySymbol(currency);
    const val = typeof value === 'number' ? value : parseFloat(value) || 0;
    return `${sym}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const resolveColumn = (status) => {
    if (!status) return 'Draft';
    const s = status.trim().toLowerCase();

    const aliases = {
      draft: 'Draft',
      'pending approval': 'Pending Approval',
      pending_approval: 'Pending Approval',
      approved: 'Approved',
      sent: 'Sent for Signature',
      'sent for signature': 'Sent for Signature',
      sent_for_signature: 'Sent for Signature',
      signed: 'Customer Signed',
      'customer signed': 'Customer Signed',
      customer_signed: 'Customer Signed',
      rejected: 'Rejected',
      archived: 'Completed',
      completed: 'Completed',
      lost: 'Completed',
    };

    if (aliases[s]) return aliases[s];

    const found = DOCUMENT_STATUS_COLUMNS.find((col) => col.toLowerCase() === s);
    return found || 'Draft';
  };

  // Backend workflows
  const handleApprove = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/quotes/${id}`, { status: 'Approved' });
      setQuotes(prev => prev.map(q => q._id === id ? res.data : q));
      showToast(`Order Form Approved! Notification dispatched.`);
    } catch (err) {
      showToast('Failed to approve order', true);
    }
  };

  const handleReject = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/quotes/${id}`, { status: 'Rejected' });
      setQuotes(prev => prev.map(q => q._id === id ? res.data : q));
      showToast('Order Form Rejected. Email notification sent.', true);
    } catch (err) {
      showToast('Failed to reject order', true);
    }
  };

  const handleSendForSignature = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/quotes/${id}`, { status: 'Sent for Signature' });
      setQuotes(prev => prev.map(q => q._id === id ? res.data : q));
      showToast('Contract dispatched via DocuSign workflow.');
    } catch (err) {
      showToast('Failed to send signature request', true);
    }
  };

  const handleOpenPreview = (id) => {
    navigate(`/quotes/${id}/preview`);
  };

  const handleClosePreview = () => {
    setSelectedQuoteId(null);
    setShowPreviewModal(false);
  };

  const handleEditOrder = (id) => {
    handleClosePreview();
    navigate(`/quotes/${id}/edit`);
  };

  const handleDownloadPDF = (q) => {
    showToast('PDF compilation initialized. Downloading...');

    const lines = [
      `Econz Order Form ${q.refId}`,
      '',
      `Customer: ${q.customerName}`,
      `PAN/GSTIN: ${q.orderPan || '—'}`,
      `Address: ${q.orderAddress || '—'}`,
      `Execution Date: ${q.documentExecutionDate || '—'}`,
      `POC: ${q.pocName || '—'} (${q.pocDesignation || '—'})`,
      `Value: ${getCurrencySymbol(q.currency)}${q.value}`,
      `Status: ${q.status}`,
    ];
    if (q.documentCustomClauses?.trim()) {
      lines.push('', 'Additional Clauses:', q.documentCustomClauses);
    }

    const element = document.createElement('a');
    const file = new Blob([lines.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Econz_Order_Form_${q.refId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getPreviewClauses = (q) => {
    const entity = q.entity || 'India';
    const jurisdiction = entity === 'UAE' ? 'Dubai, UAE (DIFC)' : (entity === 'UK' ? 'London, UK' : 'New Delhi, India');
    const taxName = entity === 'UAE' ? 'VAT (5%)' : (entity === 'UK' ? 'VAT (20%)' : 'GST (18%)');

    return (
      <div style={{ marginTop: '2rem', fontSize: '10px', color: '#475569', textAlign: 'justify', lineHeight: '1.4' }}>
        <h4 style={{ fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
          Master Terms & Conditions ({q.template || 'Standard Template'})
        </h4>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>1. Scope of Services:</strong> Econz IT Services shall provision, configure, and maintain billing services for Google Cloud/Workspace licenses as detailed in the SKU table above.
        </p>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>2. Financial Terms:</strong> Customer agrees to make payment of invoices in {q.currency} within the agreed credit limit. All rates are exclusive of applicable taxes ({taxName}) which will be added at billing.
        </p>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>3. Government Jurisdiction:</strong> This Agreement and any disputes arising out of it shall be governed and interpreted under the laws of {jurisdiction}.
        </p>
        
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', gap: '3rem' }}>
          <div style={{ width: '50%', borderTop: '1px solid #94a3b8', paddingTop: '0.5rem' }}>
            <p style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '9px' }}>For Econz IT Services:</p>
            <p style={{ color: '#64748b', fontSize: '8px', marginTop: '1.5rem' }}>Authorized Signatory</p>
          </div>
          <div style={{ width: '50%', borderTop: '1px solid #94a3b8', paddingTop: '0.5rem' }}>
            <p style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '9px' }}>For {q.customerName}:</p>
            <p style={{ color: '#64748b', fontSize: '8px', marginTop: '1.5rem' }}>Authorized Customer Signatory</p>
          </div>
        </div>
      </div>
    );
  };

  const renderCardActions = (q, col) => {
    const stopProp = (action) => (e) => {
      e.stopPropagation();
      action();
    };

    return (
      <div className="kanban-card-actions" onClick={(e) => e.stopPropagation()}>
        {col === 'Draft' && (
          <button onClick={stopProp(() => handleEditOrder(q._id))} className="kanban-card-action-btn" title="Edit order">
            <Pencil size={14} />
          </button>
        )}
        {col === 'Pending Approval' && (user.role === 'Admin' || user.role === 'Manager') && (
          <>
            <button onClick={stopProp(() => handleApprove(q._id))} className="kanban-card-action-btn" title="Approve" style={{ color: '#10b981' }}>
              <CheckCircle size={14} />
            </button>
            <button onClick={stopProp(() => handleReject(q._id))} className="kanban-card-action-btn" title="Reject" style={{ color: '#ef4444' }}>
              <XCircle size={14} />
            </button>
          </>
        )}
        {col === 'Approved' && (
          <>
            <button onClick={stopProp(() => handleSendForSignature(q._id))} className="kanban-card-action-btn" title="Send signature" style={{ color: '#3b82f6' }}>
              <Send size={14} />
            </button>
            <button onClick={stopProp(() => handleDownloadPDF(q))} className="kanban-card-action-btn" title="Download PDF" style={{ color: '#0ea5e9' }}>
              <Download size={14} />
            </button>
          </>
        )}
        {(col === 'Sent for Signature' || col === 'Customer Signed' || col === 'Completed') && (
          <button onClick={stopProp(() => handleDownloadPDF(q))} className="kanban-card-action-btn" title="Download PDF" style={{ color: '#0ea5e9' }}>
            <Download size={14} />
          </button>
        )}
      </div>
    );
  };

  const selectedQuote = quotes.find(q => q._id === selectedQuoteId);

  if (loading && quotes.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p className="animate-pulse font-bold text-slate-500">Connecting to transaction database...</p>
      </div>
    );
  }

  return (
    <div className="quotes-container fade-in">
      <style>{`
        /* ============================================================
           QUOTES PAGE CUSTOM STYLES
           ============================================================ */
        .quotes-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
          padding: 0.5rem 0;
        }
        .quotes-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .quotes-search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .quotes-search-icon {
          position: absolute;
          left: 1.25rem;
          color: var(--text-muted);
        }
        .quotes-search-input {
          padding: 0.75rem 1rem 0.75rem 3rem;
          width: 18rem;
          border-radius: 9999px;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--input-text);
          font-weight: 600;
          font-family: inherit;
          font-size: 0.875rem;
          outline: none;
          transition: var(--transition);
        }
        .quotes-search-input:focus {
          border-color: var(--brand-500);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
        }
        body.dark .quotes-search-input:focus {
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.12);
        }
        .quotes-toggle-pills {
          display: flex;
          background: var(--surface-3);
          border: 1px solid var(--border-subtle);
          padding: 0.25rem;
          border-radius: 9999px;
          gap: 0.25rem;
        }
        .quotes-toggle-btn {
          padding: 0.5rem 1.25rem;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          background: transparent;
          color: var(--text-secondary);
          transition: var(--transition);
        }
        .quotes-toggle-btn.active {
          background: var(--surface-1);
          color: var(--text-primary);
          box-shadow: var(--shadow-soft);
        }
        body.dark .quotes-toggle-btn.active {
          background: var(--surface-4);
          color: #22d3ee;
        }

        /* Kanban Board Styles */
        .kanban-scroll-container {
          display: flex;
          gap: 1.25rem;
          overflow-x: auto;
          flex: 1;
          padding-bottom: 1.5rem;
          align-items: stretch;
          height: calc(100vh - 12.5rem);
        }

        .kanban-col-wrapper {
          width: 21rem;
          flex-shrink: 0;
          border-radius: 1.25rem;
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-subtle);
          transition: var(--transition);
        }

        .kanban-col-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding: 0 0.5rem;
        }

        .kanban-col-title {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-primary);
        }

        .kanban-col-badge {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .kanban-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          overflow-y: auto;
          flex: 1;
          padding-right: 0.25rem;
        }

        /* Premium Card Styles */
        .kanban-card-premium {
          background: var(--surface-1);
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-soft);
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
          overflow: hidden;
        }
        .kanban-card-premium:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md), 0 4px 20px rgba(0, 0, 0, 0.03);
          border-color: var(--border-default);
        }
        body.dark .kanban-card-premium:hover {
          box-shadow: var(--shadow-md), 0 0 15px rgba(34, 211, 238, 0.1);
        }

        .kanban-card-accent-border {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }

        .kanban-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .kanban-card-id {
          font-family: monospace;
          font-weight: 700;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .kanban-card-value {
          font-weight: 800;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .kanban-card-middle {
          margin: 0.125rem 0;
        }
        .kanban-card-customer {
          font-size: 0.875rem;
          font-weight: 800;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.02em;
          line-height: 1.3;
        }

        .kanban-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.25rem;
        }
        .kanban-card-sku {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-accent);
        }
        .kanban-card-date {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        /* Empty state */
        .kanban-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          padding: 3rem 1rem;
          text-align: center;
          color: var(--text-muted);
        }
        .kanban-empty-text {
          font-style: italic;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .kanban-card-actions {
          display: flex;
          gap: 0.375rem;
          align-items: center;
        }
        .kanban-card-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.375rem;
          transition: var(--transition);
        }
        .kanban-card-action-btn:hover {
          background: var(--surface-3);
          color: var(--brand-500);
        }
      `}</style>

      {/* Header Row */}
      <div className="quotes-header-row">
        <div>
          <h1 className="section-title">Order Forms & Contracts</h1>
          <p className="section-sub">Centralized document repository.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={fetchQuotes}
            className="btn-secondary"
            title="Refresh database"
            style={{ padding: '0.75rem', borderRadius: '50%' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Table/Board pills */}
          <div className="quotes-toggle-pills">
            <button 
              onClick={() => setViewType('table')} 
              className={`quotes-toggle-btn ${viewType === 'table' ? 'active' : ''}`}
            >
              Table
            </button>
            <button 
              onClick={() => setViewType('kanban')} 
              className={`quotes-toggle-btn ${viewType === 'kanban' ? 'active' : ''}`}
            >
              Board
            </button>
          </div>

          {/* Search Box */}
          <div className="quotes-search-input-wrapper">
            <Search size={16} className="quotes-search-icon" />
            <input 
              type="text" 
              placeholder="Type here..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="quotes-search-input"
            />
          </div>
        </div>
      </div>

      {/* ── VIEW 1: TABLE VIEW ── */}
      {viewType === 'table' && (
        <div className="card fade-in-scale" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table className="orbit-table">
              <thead>
                <tr>
                  <th>ID / REF</th>
                  <th>CREATION DATE</th>
                  <th>CUSTOMER</th>
                  <th>TITLE</th>
                  <th>VALUE</th>
                  <th>STATUS</th>
                  <th>CREATED BY</th>
                  <th style={{ textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(q => {
                  let badgeClass = 'badge-gray';
                  const s = resolveColumn(q.status);
                  if (s === 'Pending Approval') badgeClass = 'badge-orange';
                  else if (s === 'Approved') badgeClass = 'badge-blue';
                  else if (s === 'Sent for Signature') badgeClass = 'badge-purple';
                  else if (s === 'Signed' || s === 'Customer Signed') badgeClass = 'badge-purple';
                  else if (s === 'Rejected') badgeClass = 'badge-red';
                  else if (s === 'Archived' || s === 'Completed') badgeClass = 'badge-green';
                  else if (s === 'Lost') badgeClass = 'badge-red';
                  else if (s === 'Sent') badgeClass = 'badge-cyan';

                  return (
                    <tr key={q._id} onClick={() => handleOpenPreview(q._id)}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{q.refId}</td>
                      <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{formatDate(q.createdAt)}</td>
                      <td style={{ fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{q.customerName}</td>
                      <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{q.title}</td>
                      <td style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{formatValue(q.value, q.currency)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`badge ${badgeClass}`} style={{ whiteSpace: 'nowrap' }}>{s}</span>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {q.createdBy?.name || 'Lindsay Smith'}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                          <button onClick={() => handleOpenPreview(q._id)} className="btn-ghost" title="View document">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleEditOrder(q._id)} className="btn-ghost" title="Edit order">
                            <Pencil size={16} />
                          </button>
                          {s === 'Pending Approval' && (user.role === 'Admin' || user.role === 'Manager') && (
                            <>
                              <button onClick={() => handleApprove(q._id)} className="btn-ghost" style={{ color: '#10b981' }} title="Approve">
                                <CheckCircle size={16} />
                              </button>
                              <button onClick={() => handleReject(q._id)} className="btn-ghost" style={{ color: '#ef4444' }} title="Reject">
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          
                          {s === 'Approved' && (
                            <button onClick={() => handleSendForSignature(q._id)} className="btn-ghost" style={{ color: '#3b82f6' }} title="Send for DocuSign">
                              <Send size={16} />
                            </button>
                          )}
                          {(s === 'Sent for Signature' || s === 'Signed' || s === 'Customer Signed' || s === 'Approved' || s === 'Completed') && (
                            <button onClick={() => handleDownloadPDF(q)} className="btn-ghost" style={{ color: '#0ea5e9' }} title="Download PDF">
                              <Download size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredQuotes.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No order records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {filteredQuotes.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Showing Results <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {Math.min(currentPage * itemsPerPage, filteredQuotes.length)} out of {filteredQuotes.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ 
                    width: '2rem', height: '2rem', borderRadius: '50%', border: 'none', 
                    background: currentPage === 1 ? 'var(--surface-3)' : 'var(--brand-500)', 
                    color: currentPage === 1 ? 'var(--text-muted)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  &larr;
                </button>
                <div style={{ 
                  width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--brand-800)', 
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' 
                }}>
                  {currentPage}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage * itemsPerPage >= filteredQuotes.length}
                  style={{ 
                    width: '2rem', height: '2rem', borderRadius: '50%', border: 'none', 
                    background: currentPage * itemsPerPage >= filteredQuotes.length ? 'var(--surface-3)' : 'var(--brand-500)', 
                    color: currentPage * itemsPerPage >= filteredQuotes.length ? 'var(--text-muted)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage * itemsPerPage >= filteredQuotes.length ? 'not-allowed' : 'pointer'
                  }}
                >
                  &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 2: KANBAN BOARD ── */}
      {viewType === 'kanban' && (
        <div className="kanban-scroll-container custom-scrollbar">
          {DOCUMENT_STATUS_COLUMNS.map(col => {
            const columnQuotes = filteredQuotes.filter(q => resolveColumn(q.status) === col);
            const theme = COLUMN_THEMES[col] || COLUMN_THEMES['Draft'];
            const isDark = document.body.classList.contains('dark');
            const colBg = isDark ? theme.darkBg : theme.lightBg;

            return (
              <div 
                key={col} 
                className="kanban-col-wrapper"
                style={{
                  background: colBg,
                  borderColor: theme.border,
                  borderTop: `4px solid ${theme.accent}`
                }}
              >
                {/* Column Header */}
                <div className="kanban-col-header-row">
                  <h3 className="kanban-col-title">{col}</h3>
                  <span 
                    className="kanban-col-badge"
                    style={{
                      background: theme.badgeBg,
                      color: theme.badgeText
                    }}
                  >
                    {columnQuotes.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="kanban-cards-stack custom-scrollbar">
                  {columnQuotes.map(q => {
                    return (
                      <div 
                        key={q._id}
                        onClick={() => handleOpenPreview(q._id)}
                        className="kanban-card-premium"
                      >
                        <div 
                          className="kanban-card-accent-border"
                          style={{ background: theme.accent }}
                        />
                        
                        <div className="kanban-card-top">
                          <span className="kanban-card-id">{q.refId}</span>
                          <span className="kanban-card-value">{formatValue(q.value, q.currency)}</span>
                        </div>
                        
                        <div className="kanban-card-middle">
                          <h4 className="kanban-card-customer truncate">{q.customerName}</h4>
                        </div>

                        <div className="kanban-card-bottom">
                          <span className="kanban-card-sku">
                            <span>{q.title || 'GWS New'}</span>
                            <span style={{ marginLeft: '0.375rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{formatDate(q.createdAt)}</span>
                          </span>
                          {renderCardActions(q, col)}
                        </div>
                      </div>
                    );
                  })}
                  {columnQuotes.length === 0 && (
                    <div className="kanban-empty-state">
                      <p className="kanban-empty-text">No items</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CONTRACT PREVIEW DETAILS MODAL ── */}
      {showPreviewModal && selectedQuote && (
        <div className="modal-overlay" onClick={handleClosePreview}>
          <div 
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px', width: '95%', display: 'flex', flexDirection: 'column', height: '90vh', overflow: 'hidden' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Document Preview</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedQuote.refId}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleEditOrder(selectedQuote._id)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                >
                  <Pencil size={14} />
                  Edit Document
                </button>
                <button
                  type="button"
                  onClick={() => { handleSendForSignature(selectedQuote._id); handleClosePreview(); }}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#0284c7', padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                >
                  <Send size={14} />
                  Send Via BoldSign
                </button>
                <button type="button" onClick={handleClosePreview} className="btn-ghost" title="Close" style={{ padding: '0.5rem' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--border-subtle)' }}>
              <div id="documentToExport" className="doc-preview" style={{ background: 'white', padding: '3rem 3.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '800px', display: 'flex', flexDirection: 'column', color: '#1e293b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                
                {/* Document Header Title */}
                <h1 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  MASTER SALES AND SERVICES AGREEMENT
                </h1>
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                  ( Business Associated Services )
                </p>

                {/* Agreement Details Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', border: '1px solid #bae6fd' }}>
                  <tbody>
                    <tr style={{ background: '#f0f9ff' }}>
                      <td style={{ padding: '0.625rem 1rem', border: '1px solid #bae6fd', fontSize: '11px', color: '#0369a1', width: '50%' }}>
                        Agreement No.: <strong>{selectedQuote.refId}</strong>
                      </td>
                      <td style={{ padding: '0.625rem 1rem', border: '1px solid #bae6fd', fontSize: '11px', color: '#0369a1', width: '50%' }}>
                        Execution Date :{' '}
                        <strong>{selectedQuote.documentExecutionDate || '—'}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Legal Body - Intro */}
                <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <p>This Master Sales and Services Agreement ("<strong>Agreement</strong>") is entered into by and between:</p>
                  <p>
                    <strong>ECONZ IT SERVICES PRIVATE LIMITED</strong>, a company incorporated under the Companies Act, 1956, CIN: U72900KA2011PTC061924, with its registered office at Ground Floor, No. 58, HM Towers, Brigade Road, Bengaluru, Karnataka - 560001, India (hereinafter referred to as "<strong>Econz</strong>") which expression shall, unless repugnant to the context or meaning thereof, be deemed to include its directors, partners, officers, authorized personnel, successors, and permitted assigns; AND
                  </p>
                  <p>
                    <strong>{selectedQuote.customerName?.toUpperCase()}</strong>, a company incorporated under the Companies Act, 1956/2013, having PAN/GSTIN: <strong>{selectedQuote.orderPan || 'PAN/GSTIN Pending'}</strong>, with its registered office at <strong>{selectedQuote.orderAddress || 'Registered Office Address Pending'}</strong> (hereinafter referred to as "<strong>Client</strong>") which expression shall, unless repugnant to the context or meaning thereof, be deemed to include its directors, partners, officers, authorized personnel, successors, and permitted assigns.
                  </p>
                  <p>Econz and Client are hereinafter individually referred to as a "<strong>Party</strong>" and collectively as the "<strong>Parties</strong>".</p>
                </div>

                {/* RECITALS */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    RECITALS
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>A.</strong> Econz is a Google Cloud Premier Partner and an authorised reseller of Google Workspace / Google Cloud Platform, and other OEM products, including Microsoft and Amazon Web Services, engaged in providing cloud solutions and associated professional services to clients.</p>
                    <p><strong>B.</strong> The Client is engaged in the business of and is desirous of availing the Services provided by Econz.</p>
                    <p style={{ fontWeight: 600 }}>BY EXECUTING THIS AGREEMENT, THE CLIENT CONSENTS TO BE BOUND BY ITS TERMS AND CONDITIONS, AND THE AUTHORISED SIGNATORY OF THE CLIENT REPRESENTS THAT THEY ARE DULY AUTHORISED TO EXECUTE THIS AGREEMENT ON BEHALF OF THE CLIENT.</p>
                    {selectedQuote.documentCustomClauses?.trim() && (
                      <div className="document-custom-clauses">
                        <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Additional Terms:</p>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{selectedQuote.documentCustomClauses}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. DEFINITIONS */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    1. DEFINITIONS
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>1.1 "Billing Data"</strong> shall mean and include the Client's name, registered office address, Permanent Account Number (PAN), Goods and Services Tax Identification Number (GSTIN), the contact number of the SPOC, and the Permanent Account Number (PAN) of the authorized signatory of the Client, which are collected by Econz solely for the purpose of billing and Know Your Customer (KYC) requirements as mandated by the regulations in India.</p>
                    <p><strong>1.2 "Fees"</strong> means the charges payable by the Client to Econz as set out under schedule A1 of Annexure A.</p>
                    <p><strong>1.3 "OEM"</strong> means original equipment manufacturers, including Google Workspace Business whose products are resold by Econz.</p>
                    <p><strong>1.4 "Services"</strong> means the resale of OEM products, associated professional services, billing, and technical support as described in this Agreement and under schedule A2 and A3 of Annexure A.</p>
                    <p><strong>1.5 "SPOC"</strong> means the Single Point of Contact designated by each Party for the purposes of this Agreement.</p>
                    <p><strong>1.6 "Term"</strong> has the meaning assigned in Clause 3.</p>
                  </div>
                </div>

                {/* 2. SCOPE OF SERVICES */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    2. SCOPE OF SERVICES
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>2.1</strong> Econz agrees to resell OEM products and provide associated Services to the Client on an as-required, non-exclusive basis as set out in this Agreement and under Annexure A of this Agreement. Econz acts solely as a reseller and billing partner of the OEMs. Except for Billing Data, Econz shall have no access to, and shall not process or store, any Client data. In the event any Client data is accessed and/or processed, it shall be stored exclusively by the relevant OEM in accordance with that OEM's applicable terms and policies.</p>
                    <p><strong>2.2</strong> Each OEM's current terms of Service's and service level agreements are incorporated by reference and govern the Client's use of the respective OEM products. Econz shall notify the Client of any material changes to OEM terms with at least fifteen (15) days' written notice. The Client must accept the applicable OEM terms of service upon login.</p>
                    <p><strong>2.3</strong> The Services shall include any additional tasks that the Parties may mutually agree to in writing from time to time. Any additional Services agreed shall be documented in a written order form or amendment signed by both Parties.</p>
                    <p><strong>2.4</strong> The Client must ensure and provide Econz with complete and uninterrupted access to the domain name credentials for OEM provisioning.</p>
                    <p><strong>2.5</strong> Except with respect to any service-related and pricing-related terms expressly set out under the respective schedule/s mentioned in Annexure A, in the event of any inconsistency or conflict between the terms of this Agreement and any schedule/s mentioned under Annexure A, the terms of this Agreement shall prevail.</p>
                  </div>
                </div>

                {/* 3. EFFECTIVE DATE AND TERM */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    3. EFFECTIVE DATE AND TERM
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>3.1</strong> The effective date of this Agreement shall be the date on which Econz first provides Services to the Client, which shall be ("Effective Date").</p>
                    <p><strong>3.2</strong> This Agreement shall remain in full force and effect for a period of Months from the Effective Date, or until the expiry or termination of the last active schedule under Annexure A, whichever is later ("Term"). Each schedule under Annexure A shall independently specify the product-specific term applicable to that product line.</p>
                    <p><strong>3.3</strong> Unless either Party provides written notice of non-renewal at least <strong>Yearly</strong> prior to the expiry of the term, this Agreement shall automatically renew for successive periods of one (1) year.</p>
                  </div>
                </div>

                {/* 4. FEES, INVOICING, AND PAYMENTS */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    4. FEES, INVOICING, AND PAYMENTS
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>4.1</strong> The Client shall pay fees as set both in schedule A1 of Annexure A for the Services rendered by Econz. All Fees are exclusive of applicable taxes, including GST, which shall be levied at the then-applicable statutory rates.</p>
                    <p><strong>4.2</strong> Econz shall raise invoices in advance for all OEM products being resold. The Client shall make payment within the date of receipt of the invoice. Econz shall issue a tax invoice with applicable IDS rates.</p>
                    <p><strong>4.3</strong> Any additional gateway charges (credit/debit card or digital payment platforms) or bank transaction charges shall be borne by the Client.</p>
                    <p><strong>4.4</strong> In the event of failure or delay in payment beyond the stipulated due date, late payment charges shall accrue at the rate of one and a half percent (1.5%) per month on the outstanding amount, until the date of actual receipt of the delayed payment by Econz.</p>
                    <p><strong>4.5</strong> In event of non-payment beyond thirty (30) days from the invoice due date, Econz shall issue a written notice of suspension to the Client. In the event the Client fails to clear outstanding dues within fifteen (15) days of such notice, Econz shall be entitled to suspend access to the Services and, thereafter, to terminate the licence.</p>
                    <p><strong>4.6</strong> Where the Client has committed to a specific product, stock keeping units ("SKU"), or user count for a defined period as mentioned under schedule A1 of Annexure A, the Client shall remain liable to pay for the entire committed quantity and period, irrespective of any mid-term reduction, termination, or suspension of the licence/s.</p>
                    <p><strong>4.7</strong> In the event of any conflict between the general payment terms in this Clause 4 and the product-specific payment terms as mentioned under schedule A1 of Annexure A, the terms of schedule A1 of Annexure A shall prevail solely with respect to product-specific billing mechanics.</p>
                  </div>
                </div>

                {/* 5. REPRESENTATIONS AND WARRANTIES */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    5. REPRESENTATIONS AND WARRANTIES
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>5.1</strong> Each Party represents and warrants that: (a) it has full legal capacity and authority to enter into this Agreement; (b) this Agreement has been approved and executed by its duly authorised signatory; (c) it is duly incorporated, organized, and validly existing under applicable laws; and (d) it shall comply with all applicable laws, regulations, and governmental requirements in the jurisdictions of its operation throughout the Term.</p>
                    <p><strong>5.2</strong> The Client shall provide Econz with all documentation required for empanelment, KYC, or be registered as approved at the time of onboarding of the Client.</p>
                    <p><strong>5.3</strong> Neither Party shall take any action that could have an adverse effect on the name, reputation, or public image of the other Party.</p>
                    <p><strong>5.4</strong> The Parties shall ensure to fully and promptly observe and comply with such general and specific regulations, instructions, or requirements from time to time, consistent with the terms of this Agreement and the Annexures hereto.</p>
                  </div>
                </div>

                {/* 6. CONFIDENTIALITY OBLIGATIONS */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    6. CONFIDENTIALITY OBLIGATIONS
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>6.1 "Confidential Information"</strong> shall mean and include any non-public business, technical, financial or product related information disclosed by the disclosing Party, or the end customer in connection with the Agreement, including trade secrets, Confidential Information respecting Intellectual Property Rights, inventions, products, data, algorithms, designs, know-how, techniques, systems, processes, software programs, works of authorship, customer lists, projects, plans and proposals and any notes, memoranda, reports, lists, records, drawings, sketches, specifications, data, documentation, and any information of any third party to whom disclosing Party is under an obligation to keep confidential.</p>
                    <p><strong>6.2</strong> The receiving Party shall hold the disclosing Party's Confidential Information in strict confidence, use it solely for the purposes of this Agreement and disclose it only to those employees or authorised personnel who have a need to know and who are bound by confidentiality obligations no less protective than those in this Clause 6.</p>
                    <p><strong>6.3</strong> Confidentiality obligations and restrictions shall not apply to Confidential Information that: (a) is or becomes publicly known through no fault of the receiving Party; (b) was already in the receiving Party's possession free of any confidentiality obligation at the time of disclosure; (c) is lawfully received from a third party free of any restriction; (d) is independently developed by the receiving Party without use of the Confidential Information; or (e) is required to be disclosed by applicable law, court order, or governmental authority.</p>
                    <p><strong>6.4</strong> The obligations of this Clause 6 shall survive for a period of one (1) year following the termination or expiry of this Agreement.</p>
                  </div>
                </div>

                {/* 7. INTELLECTUAL PROPERTY RIGHTS */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    7. INTELLECTUAL PROPERTY RIGHTS
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>7.1</strong> Each Party retains sole and exclusive ownership of all intellectual property rights in its pre-existing works, technology, software, data, and materials. No rights, title, or interest in either Party's intellectual property is transferred or licensed to the other Party under this Agreement except to the limited extent expressly necessary to perform the Services.</p>
                    <p><strong>7.2</strong> OEM products remain the exclusive intellectual property of the respective OEM and are governed solely by the applicable OEM terms of service.</p>
                  </div>
                </div>

                {/* 8. DATA PRIVACY */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    8. DATA PRIVACY
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>8.1</strong> Econz hereby agrees to take all necessary precautions to protect the Client's Confidential Information, Billing Data, and the KYC details of the authorized signatory of the Client, and implement reasonable security practices and measures that are commensurate with respect to the Confidential Information disclosure for the purpose of this Agreement.</p>
                    <p><strong>8.2</strong> Econz shall take all reasonable steps to protect the confidential information provided by the Client from loss, misuse, and unauthorized access, disclosure, alteration, or destruction solely by Econz or its employees. Econz shall comply with all the regulations provided under the Information Technology Act 2000, Information Technology Rules, 2011 and Digital Personal Data Protection Act, 2023.</p>
                    <p><strong>8.3</strong> The provisions under Clauses 8.1 and 8.2 shall apply only if the Client provides Econz with privileged access to the Client data.</p>
                  </div>
                </div>

                {/* 9. INDEMNITY AND LIMITATION OF LIABILITY */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    9. INDEMNITY AND LIMITATION OF LIABILITY
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>9.1</strong> Without prejudice to any other rights and remedies available to the Parties under this Agreement or law, either Party shall mutually indemnify, defend, and hold harmless the other Party and its directors, officers, employees, and permitted assigns against any claims, damages, liabilities, losses, penalties, costs, and proceedings arising from infringement, breach, negligence, fraud, misrepresentation, or unauthorized act.</p>
                    <p><strong>9.2</strong> In no event shall either Party be liable to the other for any special, incidental, consequential, indirect, or punitive damages, including loss of profits, loss of revenue, loss of data, loss of goodwill, business interruption, or cost of substitute products or services.</p>
                    <p><strong>9.3</strong> Notwithstanding any other provision, either Party's total aggregate liability to the other Party for direct damages arising under or in connection with any schedule under Annexure A shall not exceed the total Fees paid by the Client to Econz during the six (06) months immediately preceding the event giving rise to the claim under the respective schedule/s of Annexure A.</p>
                    <p><strong>9.4</strong> No claim, regardless of form, arising under or in connection with this Agreement may be brought by either Party more than three (3) years after the date on which the cause of action occurred.</p>
                    <p><strong>9.5</strong> Econz shall have no liability for any loss, damage, or disruption to the Client's IT environment resulting from alterations, additions, repairs, or maintenance carried out by any party other than by Econz's authorized personnel.</p>
                  </div>
                </div>

                {/* 10. TERMINATION AND CONSEQUENCES */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    10. TERMINATION AND CONSEQUENCES
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>10.1</strong> Either Party may terminate this Agreement and all active schedules under Annexure A immediately upon written notice if the other Party commits a material breach and fails to remedy such breach within thirty (30) days, becomes insolvent, discontinues business operations, or delays payment beyond the timelines stipulated in Clause 4.</p>
                    <p><strong>10.2</strong> Where the Client has opted for a committed subscription and terminates the Agreement or any schedule prior to the expiry of the committed term, Econz shall invoice the Client for the true-up amount.</p>
                    <p><strong>10.3</strong> Upon termination or expiry of this Agreement or any schedule under Annexure A, the Client shall remain obligated to pay all amounts due to Econz for the Services rendered, including all charges accrued up to the date on which the relevant OEM suspends or terminates access to the Client, the provisions of Clauses 4.5 and 4.6, Clause 6, Clause 7, Clause 8, Clause 9, and this Clause 10.3 shall survive the termination or expiry of this Agreement.</p>
                    <p><strong>10.4</strong> Upon expiry or termination, either Party shall promptly return to the other all property, documentation, and confidential information of the disclosing Party in its possession.</p>
                  </div>
                </div>

                {/* 11. DISPUTE RESOLUTION, GOVERNING LAW AND JURISDICTION */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    11. DISPUTE RESOLUTION, GOVERNING LAW AND JURISDICTION
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>11.1</strong> The Parties shall first attempt to resolve any dispute through mutual consultation. If unresolved within thirty (30) days, either Party may resort to arbitration, wherein the Parties shall mutually appoint a sole arbitrator, in accordance with the Indian Arbitration and Conciliation Act, 1996. The seat for arbitration shall be Bengaluru, Karnataka, and the language of arbitration shall be English.</p>
                    <p><strong>11.2</strong> This Agreement and all matters arising under it shall be governed by and construed in accordance with the laws of India. The Parties submit to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.</p>
                  </div>
                </div>

                {/* 12. FORCE MAJEURE */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    12. FORCE MAJEURE
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>12.1</strong> Neither Party shall be liable for any delay or failure to perform its obligations under the Agreement to the extent that such delay or failure is caused by circumstances beyond the Party's reasonable control, including acts of God, natural disasters, war, civil unrest, epidemic or pandemic, acts of government, or power or internet outages.</p>
                  </div>
                </div>

                {/* 13. GENERAL PROVISIONS */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.25rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    13. GENERAL PROVISIONS
                  </h3>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p><strong>13.1 Non-Solicitation:</strong> During the Term and for one (01) year thereafter, neither Party shall directly or indirectly solicit, recruit, or offer employment to any employee of the other Party without prior written consent.</p>
                    <p><strong>13.2 Publicity:</strong> Either Party may use, with prior written consent, the other Party's name and logo in connection with this Agreement in accordance with applicable trademark guidelines.</p>
                    <p><strong>13.3 Relationship:</strong> Nothing in this Agreement creates a relationship of principal and agent, and employer and employee, partnership, or joint venture between the Parties.</p>
                    <p><strong>13.4 Assignment:</strong> Neither Party may assign this Agreement or any rights or obligations hereunder without the prior written consent of the other Party.</p>
                    <p><strong>13.5 Notice:</strong> All notices under this Agreement shall be in writing in English and delivered by personal delivery, confirmed email, commercial courier, or registered post.</p>
                    <p><strong>13.6 Waiver:</strong> No failure or delay by either Party in exercising any right under this Agreement shall constitute a waiver of that right or any other right.</p>
                    <p><strong>13.7 Severability:</strong> If any provision of this Agreement is held to be invalid or unenforceable, such provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.</p>
                    <p><strong>13.8 Entire Agreement:</strong> This Agreement, including all Annexures, constitutes the entire agreement between the Parties with respect to its subject matter.</p>
                    <p><strong>13.9 Counterparts:</strong> This Agreement may be executed in counterparts, including electronic or digital signatures, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument.</p>
                  </div>
                </div>

                {/* IN WITNESS WHEREOF */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify' }}>
                    <strong>IN WITNESS WHEREOF</strong>, the Parties have caused this Agreement to be executed by their duly authorised representatives as of the Execution Date first written above.
                  </p>
                </div>

                {/* ── SIGNATURE BLOCKS ── */}
                {(() => {
                  const sigHeaderStyle = { background: '#0e7490', color: 'white', padding: '0.5rem 1rem', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' };
                  const sigCellStyle = { padding: '0.5rem 1rem', fontSize: '10px', color: '#334155', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' };
                  const sigLabelStyle = { ...sigCellStyle, fontWeight: 600, width: '25%' };
                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #0e7490', marginBottom: '2.5rem' }}>
                      <thead>
                        <tr>
                          <th colSpan={2} style={{ ...sigHeaderStyle, borderRight: '1px solid rgba(255,255,255,0.3)' }}>For and on behalf of CLIENT</th>
                          <th colSpan={2} style={sigHeaderStyle}>For and on behalf of CLIENT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['Signature:', 'Signature:'].map((_, ri) => (
                          <tr key={`sig-row-${ri}`}>
                            <td style={sigLabelStyle}>{ri === 0 ? 'Signature:' : 'Signature:'}</td>
                            <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                            <td style={sigLabelStyle}>Signature:</td>
                            <td style={sigCellStyle}>&nbsp;</td>
                          </tr>
                        ))}
                        <tr>
                          <td style={sigLabelStyle}>Full Name:</td>
                          <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0', fontWeight: 700 }}>{selectedQuote.customerName?.toUpperCase() || ''}</td>
                          <td style={sigLabelStyle}>Full Name:</td>
                          <td style={{ ...sigCellStyle, fontWeight: 700 }}>{selectedQuote.pocName || ''}</td>
                        </tr>
                        <tr>
                          <td style={sigLabelStyle}>Title:</td>
                          <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                          <td style={{ ...sigLabelStyle, color: '#0284c7' }}>Title:</td>
                          <td style={{ ...sigCellStyle, color: '#0284c7', fontWeight: 700 }}>{selectedQuote.pocDesignation || 'Head - Revenue Operations'}</td>
                        </tr>
                        <tr>
                          <td style={sigLabelStyle}>Date:</td>
                          <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                          <td style={sigLabelStyle}>Date:</td>
                          <td style={sigCellStyle}>&nbsp;</td>
                        </tr>
                        <tr>
                          <td style={sigLabelStyle}>Signature:</td>
                          <td style={{ ...sigCellStyle, borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                          <td style={sigLabelStyle}>Signature:</td>
                          <td style={sigCellStyle}>&nbsp;</td>
                        </tr>
                      </tbody>
                    </table>
                  );
                })()}

                {/* ── ANNEXURE A ── */}
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Annexure A</h2>
                  <p style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginBottom: '1.5rem' }}>Commercial Terms, Pricing &amp; Product-Specific Conditions</p>
                </div>

                <p style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7', textAlign: 'justify', marginBottom: '1.5rem' }}>
                  This Annexure A forms an integral part of the Reseller Services Agreement executed between the Parties and sets out the commercial terms specific to the OEM products and Services selected by the Client.
                </p>

                {/* A1. Licence & Pricing Details */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                    A1. Licence &amp; Pricing Details
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#0e7490', color: 'white' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 700 }}>SKU / Product</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Quantity</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>Unit Price ({selectedQuote.currency || 'INR'})</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Commitment Type</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Payment Frequency</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedQuote.products || selectedQuote.skus)?.map((sku, idx) => (
                        <tr key={`a1-${idx}`} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 1 ? '#f8fafc' : 'white' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{sku.name}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>{sku.qty}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{getCurrencySymbol(selectedQuote.currency)}{sku.sellPrice?.toFixed(2)}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>{sku.subPlan || 'Annual Commit'}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>{sku.billingCycle || 'Monthly'}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{getCurrencySymbol(selectedQuote.currency)}{(sku.sellPrice * sku.qty)?.toFixed(2)}</td>
                        </tr>
                      ))}
                      {(() => {
                        const skus = selectedQuote.products || selectedQuote.skus || [];
                        const subtotal = skus.reduce((sum, s) => sum + ((parseFloat(s.sellPrice) || 0) * (parseInt(s.qty) || 0)), 0);
                        const gstRate = 0.18;
                        const gstAmt = subtotal * gstRate;
                        const grandTotal = subtotal + gstAmt;
                        const sym = getCurrencySymbol(selectedQuote.currency);
                        const summaryCell = { padding: '0.4rem 0.5rem', textAlign: 'right', fontSize: '10px', color: '#475569', border: 'none' };
                        return (
                          <>
                            <tr style={{ borderTop: '1px solid #e2e8f0' }}>
                              <td colSpan={5} style={{ ...summaryCell }}>Subtotal :</td>
                              <td style={{ ...summaryCell, fontWeight: 600, color: '#1e293b' }}>{sym}{subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td colSpan={5} style={{ ...summaryCell }}>Gst @ 18% :</td>
                              <td style={{ ...summaryCell, fontWeight: 600, color: '#1e293b' }}>{sym}{gstAmt.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                              <td colSpan={5} style={{ ...summaryCell, fontWeight: 800, fontSize: '11px', color: '#0e7490' }}>Grand Total :</td>
                              <td style={{ ...summaryCell, fontWeight: 800, fontSize: '11px', color: '#0e7490' }}>{sym}{grandTotal.toFixed(2)}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* A2. Professional Services */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                    A2. Professional Services (if applicable)
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#0e7490', color: 'white' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 700 }}>Service</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Quantity</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>Unit Price ({selectedQuote.currency || 'INR'})</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Commitment Type</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Payment Frequency</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No professional services attached to this contract</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* A2 Notes */}
                <p style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                  Note: GST at 18% is applicable on all Fees. Commitment types: Flexi / Annual Commit / 2-Year Commit / 3-Year Commit. Payment Frequency: Monthly / Quarterly / Half-Yearly / Annual.
                </p>
                <p style={{ fontSize: '10px', color: '#334155', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'justify' }}>
                  Details of any Econz professional or managed services (data migration, deployment, training, managed support) shall be documented in a separate Statement of Work (SOW) appended to this Annexure A, which shall include scope, timelines, deliverables, payment milestones, and acceptance criteria.
                </p>

                {/* A3. Technical Support Services */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                    A3. Technical Support Services
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#0e7490', color: 'white' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 700 }}>Service</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Quantity</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>Unit Price ({selectedQuote.currency || 'INR'})</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Commitment Type</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Payment Frequency</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No technical support services attached to this contract</td></tr>
                    </tbody>
                  </table>
                </div>

                <p style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                  Note: GST at 18% is applicable on all Fees. Commitment types: Flexi / Annual Commit / 2-Year Commit / 3-Year Commit. Payment Frequency: Monthly / Quarterly / Half-Yearly / Annual.
                </p>

                {/* A4-A7 Reference Links */}
                <div style={{ fontSize: '10px', color: '#334155', lineHeight: '2', marginBottom: '2rem' }}>
                  <p><strong>A4. Econz Technical Support Guidelines</strong></p>
                  <p style={{ color: '#0284c7', wordBreak: 'break-all' }}>https://docs.google.com/document/d/...</p>
                  <p style={{ marginTop: '0.5rem' }}><strong>A5. Google Workspace Service Level Agreement</strong></p>
                  <p style={{ color: '#0284c7' }}>https://workspace.google.com/intl/en/terms/sla.html</p>
                  <p style={{ marginTop: '0.5rem' }}><strong>A6. Google Workspace Terms of Service</strong></p>
                  <p style={{ color: '#0284c7' }}>https://workspace.google.com/terms/premier_terms_at_in_billing.html</p>
                  <p style={{ marginTop: '0.5rem' }}><strong>A7. Google Workspace Features</strong></p>
                  <p>Google Workspace Business Editions: <span style={{ color: '#0284c7' }}>https://support.google.com/a/answer/6043385</span></p>
                  <p>Google Workspace Enterprise Editions: <span style={{ color: '#0284c7' }}>https://support.google.com/a/answer/7284269</span></p>
                </div>

                {/* ── EXECUTION OF ANNEXURE A ── */}
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', textAlign: 'center' }}>
                    Execution of Annexure A
                  </h3>

                  {(() => {
                    const exSigHeader = { background: '#0e7490', color: 'white', padding: '0.5rem 1rem', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' };
                    const exSigCell = { padding: '0.5rem 1rem', fontSize: '10px', color: '#334155', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' };
                    const exSigLabel = { ...exSigCell, fontWeight: 600, width: '25%' };
                    return (
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #0e7490' }}>
                        <thead>
                          <tr>
                            <th colSpan={2} style={{ ...exSigHeader, borderRight: '1px solid rgba(255,255,255,0.3)' }}>For and on behalf of CLIENT</th>
                            <th colSpan={2} style={exSigHeader}>For and on behalf of CLIENT</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={exSigLabel}>Signature:</td>
                            <td style={{ ...exSigCell, borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                            <td style={exSigLabel}>Signature:</td>
                            <td style={exSigCell}>&nbsp;</td>
                          </tr>
                          <tr>
                            <td style={exSigLabel}>Signature:</td>
                            <td style={{ ...exSigCell, borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                            <td style={exSigLabel}>Signature:</td>
                            <td style={exSigCell}>&nbsp;</td>
                          </tr>
                          <tr>
                            <td style={exSigLabel}>Full Name:</td>
                            <td style={{ ...exSigCell, borderRight: '1px solid #e2e8f0', fontWeight: 700 }}>{selectedQuote.customerName?.toUpperCase() || ''}</td>
                            <td style={exSigLabel}>Full Name:</td>
                            <td style={{ ...exSigCell, fontWeight: 700 }}>{selectedQuote.pocName || ''}</td>
                          </tr>
                          <tr>
                            <td style={exSigLabel}>Title:</td>
                            <td style={{ ...exSigCell, borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                            <td style={{ ...exSigLabel, color: '#0284c7' }}>Title:</td>
                            <td style={{ ...exSigCell, color: '#0284c7', fontWeight: 700 }}>{selectedQuote.pocDesignation || 'Head - Revenue Operations'}</td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })()}
                </div>

              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', flexShrink: 0 }}>
              <button type="button" onClick={handleClosePreview} className="btn-secondary">
                Close
              </button>
              <button type="button" onClick={() => handleDownloadPDF(selectedQuote)} className="btn-secondary">
                <Download size={14} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
