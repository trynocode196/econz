import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Eye, 
  Search, 
  CheckCircle, 
  XCircle, 
  Send, 
  FileText, 
  X, 
  Pencil, 
  Download,
  RotateCw,
  Layers,
  Check
} from 'lucide-react';

const BOARD_COLUMNS = [
  {
    key: 'Draft',
    label: 'DRAFT',
    bg: '#f8fafc',
    darkBg: 'rgba(15, 28, 52, 0.4)',
    borderTop: '#94a3b8',
    headerColor: '#475569',
    badgeBg: '#ffffff',
    badgeBorder: '#cbd5e1',
    badgeColor: '#64748b'
  },
  {
    key: 'Pending Approval',
    label: 'PENDING APPROVAL',
    bg: '#fefce8',
    darkBg: 'rgba(251, 191, 36, 0.04)',
    borderTop: '#f59e0b',
    headerColor: '#854d0e',
    badgeBg: '#fef3c7',
    badgeBorder: '#fde68a',
    badgeColor: '#d97706'
  },
  {
    key: 'Approved',
    label: 'APPROVED',
    bg: '#ecfeff',
    darkBg: 'rgba(6, 182, 212, 0.04)',
    borderTop: '#06b6d4',
    headerColor: '#0e7490',
    badgeBg: '#cffafe',
    badgeBorder: '#a5f3fc',
    badgeColor: '#0891b2'
  },
  {
    key: 'Sent for Signature',
    label: 'SENT FOR SIGNATURE',
    bg: '#eff6ff',
    darkBg: 'rgba(59, 130, 246, 0.04)',
    borderTop: '#3b82f6',
    headerColor: '#1d4ed8',
    badgeBg: '#dbeafe',
    badgeBorder: '#bfdbfe',
    badgeColor: '#2563eb'
  },
  {
    key: 'Customer Signed',
    label: 'CUSTOMER SIGNED',
    bg: '#faf5ff',
    darkBg: 'rgba(139, 92, 246, 0.04)',
    borderTop: '#8b5cf6',
    headerColor: '#6b21a8',
    badgeBg: '#f3e8ff',
    badgeBorder: '#e9d5ff',
    badgeColor: '#7c3aed'
  },
  {
    key: 'Rejected',
    label: 'REJECTED',
    bg: '#fef2f2',
    darkBg: 'rgba(239, 68, 68, 0.04)',
    borderTop: '#ef4444',
    headerColor: '#991b1b',
    badgeBg: '#fee2e2',
    badgeBorder: '#fecaca',
    badgeColor: '#dc2626'
  },
  {
    key: 'Completed',
    label: 'COMPLETED',
    bg: '#f0fdf4',
    darkBg: 'rgba(16, 185, 129, 0.04)',
    borderTop: '#10b981',
    headerColor: '#166534',
    badgeBg: '#dcfce7',
    badgeBorder: '#bbf7d0',
    badgeColor: '#059669'
  }
];

const STATUS_CONFIG = {
  'Approved': {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0'
  },
  'Pending Approval': {
    bg: '#ffedd5',
    color: '#c2410c',
    border: '#fed7aa'
  },
  'Draft': {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0'
  },
  'Sent for Signature': {
    bg: '#dbeafe',
    color: '#1d4ed8',
    border: '#bfdbfe'
  },
  'Customer Signed': {
    bg: '#f3e8ff',
    color: '#7e22ce',
    border: '#e9d5ff'
  },
  'Completed': {
    bg: '#d1fae5',
    color: '#047857',
    border: '#a7f3d0'
  },
  'Rejected': {
    bg: '#fee2e2',
    color: '#b91c1c',
    border: '#fecaca'
  }
};

export default function DocumentsDeal() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board'); // 'table' | 'board'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected deal for detailed view modal
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotes');
      setDeals(res.data);
    } catch (err) {
      showToast('Error loading documents & deals', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Helpers
  const getCurrencySymbol = (curr) => {
    const symbols = { INR: '₹', USD: '$', AED: 'د.إ', GBP: '£' };
    return symbols[curr] || '₹';
  };

  const formatValue = (value, currency) => {
    const sym = getCurrencySymbol(currency);
    const val = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (currency === 'AED') {
      return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${sym}`;
    }
    return `${sym}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '29-May-2026';
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

  const getCreatorName = (deal) => {
    if (deal.createdBy && typeof deal.createdBy === 'object') {
      return deal.createdBy.name || 'Amarjeet';
    }
    return deal.createdBy || 'Amarjeet';
  };

  // Status update
  const handleUpdateStatus = async (dealId, newStatus) => {
    try {
      setIsUpdatingStatus(true);
      const res = await api.put(`/quotes/${dealId}`, { status: newStatus });
      setDeals(prev => prev.map(d => d._id === dealId ? res.data : d));
      if (selectedDeal && selectedDeal._id === dealId) {
        setSelectedDeal(res.data);
      }
      showToast(`Document status updated to ${newStatus}`);
    } catch (err) {
      showToast('Failed to update status', true);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filter deals by search
  const filteredDeals = deals.filter(deal => {
    const q = searchQuery.toLowerCase();
    const refId = (deal.refId || '').toLowerCase();
    const customer = (deal.customerName || '').toLowerCase();
    const title = (deal.title || '').toLowerCase();
    const status = (deal.status || '').toLowerCase();
    const creator = getCreatorName(deal).toLowerCase();
    return (
      refId.includes(q) ||
      customer.includes(q) ||
      title.includes(q) ||
      status.includes(q) ||
      creator.includes(q)
    );
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', height: '100%' }}>
      
      {/* Top Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '0.2rem' }}>
            Order Forms & Contracts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Centralized document repository.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchDeals}
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-1)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'transform 0.15s ease'
            }}
            title="Refresh documents"
          >
            <RotateCw size={15} />
          </button>

          {/* Table / Board Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-3)',
            borderRadius: '0.75rem',
            padding: '0.25rem',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.4rem 1.15rem',
                borderRadius: '0.55rem',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: viewMode === 'table' ? 'var(--surface-1)' : 'transparent',
                color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              style={{
                padding: '0.4rem 1.15rem',
                borderRadius: '0.55rem',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: viewMode === 'board' ? 'var(--surface-1)' : 'transparent',
                color: viewMode === 'board' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'board' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Board
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Type here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-orbit"
              style={{ paddingLeft: '2.35rem', height: '2.5rem', fontSize: '0.85rem', borderRadius: 'var(--radius-lg)' }}
            />
          </div>
        </div>
      </div>

      {/* BOARD VIEW (Exact 7 Columns Matching Screenshot) */}
      {viewMode === 'board' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(200px, 1fr))',
          gap: '0.875rem',
          alignItems: 'stretch',
          overflowX: 'auto',
          paddingBottom: '1rem',
          minHeight: 'calc(100vh - 220px)'
        }}>
          {BOARD_COLUMNS.map(col => {
            const colDeals = filteredDeals.filter(d => {
              const s = (d.status || 'Draft').trim().toLowerCase();
              return s === col.key.toLowerCase();
            });

            return (
              <div 
                key={col.key}
                style={{
                  background: col.bg,
                  borderRadius: '1.25rem',
                  border: `1px solid ${col.badgeBorder}`,
                  borderTop: `4px solid ${col.borderTop}`,
                  padding: '1.125rem 0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                  minHeight: '520px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
                className="dark:border-opacity-30"
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem 0.5rem 0.25rem' }}>
                  <span style={{
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    color: col.headerColor,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}>
                    {col.label}
                  </span>
                  
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: col.badgeBg,
                    border: `1px solid ${col.badgeBorder}`,
                    color: col.badgeColor,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {colDeals.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {colDeals.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No Items
                      </span>
                    </div>
                  ) : (
                    colDeals.map(deal => (
                      <div
                        key={deal._id || deal.refId}
                        onClick={() => setSelectedDeal(deal)}
                        style={{
                          background: '#ffffff',
                          borderRadius: '0.875rem',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          padding: '1rem 0.875rem',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                        className="hover:shadow-md hover:-translate-y-0.5 dark:bg-slate-800 dark:border-slate-700"
                      >
                        {/* Top: REF + Value */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>
                            {deal.refId}
                          </span>
                          <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a' }} className="dark:text-white">
                            {formatValue(deal.value, deal.currency)}
                          </span>
                        </div>

                        {/* Customer Name */}
                        <div style={{
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          letterSpacing: '-0.01em',
                          textTransform: 'uppercase',
                          marginTop: '0.125rem'
                        }} className="dark:text-white">
                          {deal.customerName}
                        </div>

                        {/* Bottom: Signed Order Form + Date & Icon */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '0.25rem',
                          paddingTop: '0.35rem'
                        }}>
                          <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 500 }}>
                            {deal.title || 'Signed Order Form'} {formatDate(deal.createdAt)}
                          </span>
                          <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                            <Download size={14} />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="card" style={{ 
          padding: 0, 
          overflow: 'hidden', 
          borderRadius: '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>ID / REF</th>
                  <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>CREATION DATE</th>
                  <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>CUSTOMER</th>
                  <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>TITLE</th>
                  <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>VALUE</th>
                  <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>CREATED BY</th>
                  <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', whiteSpace: 'nowrap' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading && deals.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}>⏳</div>
                      Loading documents repository...
                    </td>
                  </tr>
                ) : filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No documents found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal, index) => {
                    const statusStyle = STATUS_CONFIG[deal.status] || STATUS_CONFIG['Draft'];
                    const isLastRow = index === filteredDeals.length - 1;

                    return (
                      <tr 
                        key={deal._id || deal.refId}
                        style={{ 
                          borderBottom: isLastRow ? 'none' : '1px solid var(--border-subtle)',
                          transition: 'background 0.15s ease',
                          cursor: 'pointer'
                        }}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        onClick={() => setSelectedDeal(deal)}
                      >
                        <td style={{ padding: '0.85rem 1.15rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {deal.refId || 'ORD-NEW'}
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(deal.createdAt || deal.documentExecutionDate)}
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {deal.customerName}
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {deal.title || 'GWS New'}
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {formatValue(deal.value, deal.currency)}
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.3rem 0.85rem',
                            borderRadius: '9999px',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            border: `1px solid ${statusStyle.border}`,
                            whiteSpace: 'nowrap'
                          }}>
                            {deal.status || 'Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {getCreatorName(deal)}
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/quotes/${deal._id}/preview`);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#0ea5e9',
                              cursor: 'pointer',
                              padding: '0.35rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '0.375rem'
                            }}
                            title="View Document Details"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          DOCUMENT DEAL DETAIL & PREVIEW MODAL
          ========================================================= */}
      {selectedDeal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setSelectedDeal(null)}
        >
          <div 
            style={{
              background: 'var(--surface-1)',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth: '780px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--surface-2)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedDeal.refId || 'ORD-PREVIEW'}
                  </h2>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: STATUS_CONFIG[selectedDeal.status]?.bg || '#f1f5f9',
                    color: STATUS_CONFIG[selectedDeal.status]?.color || '#475569',
                    border: `1px solid ${STATUS_CONFIG[selectedDeal.status]?.border || '#e2e8f0'}`
                  }}>
                    {selectedDeal.status || 'Draft'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  Created on {formatDate(selectedDeal.createdAt)} by {getCreatorName(selectedDeal)}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/quotes/${selectedDeal._id}/edit`)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <Pencil size={14} />
                  Edit Order
                </button>
                <button 
                  onClick={() => setSelectedDeal(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
              
              {/* Top Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '1.25rem',
                background: 'var(--surface-2)',
                borderRadius: '0.875rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Customer</span>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{selectedDeal.customerName}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Deal Title</span>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{selectedDeal.title || 'GWS New'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Deal Value</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>{formatValue(selectedDeal.value, selectedDeal.currency)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Billing Mode</span>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{selectedDeal.billTo || 'Direct'}</p>
                </div>
              </div>

              {/* Products / SKUs breakdown */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16} /> Products & SKU Lines
                </h4>
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                        <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 700 }}>SKU / Product</th>
                        <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 700 }}>Plan</th>
                        <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Sell Price</th>
                        <th style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((selectedDeal.products && selectedDeal.products.length > 0) ? selectedDeal.products : (selectedDeal.skus || [])).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.name || 'Google Workspace'}
                            {item.code && <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.code}</span>}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{item.subPlan || '12 Months'}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>{item.qty || 1}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatValue(item.sellPrice || item.listPrice || 0, selectedDeal.currency)}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatValue((item.sellPrice || item.listPrice || 0) * (item.qty || 1), selectedDeal.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Workflow Action Buttons */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Document Lifecycle Action
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {selectedDeal.status !== 'Approved' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedDeal._id, 'Approved')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '0.625rem',
                        border: 'none',
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle size={15} />
                      Approve Deal
                    </button>
                  )}

                  {selectedDeal.status !== 'Sent for Signature' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedDeal._id, 'Sent for Signature')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '0.625rem',
                        border: 'none',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Send size={15} />
                      Send for Signature
                    </button>
                  )}

                  {selectedDeal.status !== 'Customer Signed' && selectedDeal.status !== 'Completed' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedDeal._id, 'Customer Signed')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '0.625rem',
                        border: 'none',
                        background: '#8b5cf6',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={15} />
                      Mark Customer Signed
                    </button>
                  )}

                  {selectedDeal.status !== 'Completed' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedDeal._id, 'Completed')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '0.625rem',
                        border: 'none',
                        background: '#059669',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle size={15} />
                      Mark Completed
                    </button>
                  )}

                  {selectedDeal.status !== 'Rejected' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedDeal._id, 'Rejected')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '0.625rem',
                        border: '1px solid #ef4444',
                        background: 'transparent',
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <XCircle size={15} />
                      Reject
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedDeal(null)}
                className="btn-secondary"
                style={{ padding: '0.5rem 1.75rem', fontSize: '0.9rem' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
