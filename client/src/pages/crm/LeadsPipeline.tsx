import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, RotateCw, GitBranch,
  Building2, Calendar, Kanban, Filter, User,
  Eye, Download, ArrowRight, Layers, DollarSign,
  TrendingUp, CheckCircle, Clock, X, ChevronRight
} from 'lucide-react';
import { getCrmDeals, getCrmDealOwners, createCrmDeal, changeDealStage } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useCrmStages, getStageColor } from './crmStages';
import CrmStageManagerDrawer from './CrmStageManagerDrawer';

interface Deal {
  _id: string;
  name: string;
  stage: string;
  amount?: number;
  currency: string;
  closeDate?: string;
  contact?: { name?: string; email?: string; phone?: string };
  company?: { name?: string };
  owner?: { _id: string; name: string; profilePicture?: string };
  nextTask?: any;
  createdAt: string;
}

const STAGE_THEMES: Record<string, { bg: string; darkBg: string; borderTop: string; headerColor: string; badgeBg: string; badgeBorder: string; badgeColor: string }> = {
  'New Lead': {
    bg: '#f8fafc',
    darkBg: 'rgba(15, 28, 52, 0.45)',
    borderTop: '#94a3b8',
    headerColor: '#475569',
    badgeBg: '#ffffff',
    badgeBorder: '#cbd5e1',
    badgeColor: '#64748b'
  },
  'First Email Sent': {
    bg: '#ecfeff',
    darkBg: 'rgba(6, 182, 212, 0.05)',
    borderTop: '#06b6d4',
    headerColor: '#0e7490',
    badgeBg: '#cffafe',
    badgeBorder: '#a5f3fc',
    badgeColor: '#0891b2'
  },
  'Meeting Scheduled': {
    bg: '#faf5ff',
    darkBg: 'rgba(139, 92, 246, 0.05)',
    borderTop: '#8b5cf6',
    headerColor: '#6b21a8',
    badgeBg: '#f3e8ff',
    badgeBorder: '#e9d5ff',
    badgeColor: '#7c3aed'
  },
  'Meeting done': {
    bg: '#eff6ff',
    darkBg: 'rgba(59, 130, 246, 0.05)',
    borderTop: '#3b82f6',
    headerColor: '#1d4ed8',
    badgeBg: '#dbeafe',
    badgeBorder: '#bfdbfe',
    badgeColor: '#2563eb'
  },
  'Quotation sent': {
    bg: '#fefce8',
    darkBg: 'rgba(251, 191, 36, 0.05)',
    borderTop: '#f59e0b',
    headerColor: '#854d0e',
    badgeBg: '#fef3c7',
    badgeBorder: '#fde68a',
    badgeColor: '#d97706'
  },
  'In negotiation': {
    bg: '#fff7ed',
    darkBg: 'rgba(234, 88, 12, 0.05)',
    borderTop: '#ea580c',
    headerColor: '#9a3412',
    badgeBg: '#ffedd5',
    badgeBorder: '#fed7aa',
    badgeColor: '#c2410c'
  },
  'Won': {
    bg: '#f0fdf4',
    darkBg: 'rgba(16, 185, 129, 0.05)',
    borderTop: '#10b981',
    headerColor: '#166534',
    badgeBg: '#dcfce7',
    badgeBorder: '#bbf7d0',
    badgeColor: '#059669'
  },
  'Lost': {
    bg: '#fef2f2',
    darkBg: 'rgba(239, 68, 68, 0.05)',
    borderTop: '#ef4444',
    headerColor: '#991b1b',
    badgeBg: '#fee2e2',
    badgeBorder: '#fecaca',
    badgeColor: '#dc2626'
  }
};

const getStageTheme = (stageName: string, fallbackColor: string) => {
  return STAGE_THEMES[stageName] || {
    bg: '#f8fafc',
    darkBg: 'rgba(15, 28, 52, 0.45)',
    borderTop: fallbackColor || '#0284c7',
    headerColor: '#334155',
    badgeBg: '#f1f5f9',
    badgeBorder: '#e2e8f0',
    badgeColor: '#475569'
  };
};

export default function LeadsPipeline() {
  const navigate = useNavigate();
  const stages = useCrmStages();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [isStageDrawerOpen, setIsStageDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load deals
  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCrmDeals();
      setDeals(res.data);
    } catch (err) {
      toast.error('Failed to load CRM deals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Handle stage change drag & drop
  const handleDropDeal = async (dealId: string, newStage: string) => {
    try {
      setDeals(prev => prev.map(d => d._id === dealId ? { ...d, stage: newStage } : d));
      await changeDealStage(dealId, newStage);
      toast.success(`Deal moved to ${newStage}`);
    } catch (err) {
      toast.error('Failed to update stage');
      fetchDeals();
    }
  };

  // Format helpers
  const formatCurrency = (amount?: number, curr: string = 'USD') => {
    if (amount === undefined || amount === null) return '$0.00';
    const sym = curr === 'INR' ? '₹' : curr === 'AED' ? 'د.إ' : '$';
    if (curr === 'AED') {
      return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${sym}`;
    }
    return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return '29-May-2026';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return format(d, 'dd-MMM-yyyy');
    } catch {
      return dateStr;
    }
  };

  // Filtered deals
  const filteredDeals = deals.filter(deal => {
    if (stageFilter !== 'all' && deal.stage !== stageFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (deal.name && deal.name.toLowerCase().includes(q)) ||
      (deal.company?.name && deal.company.name.toLowerCase().includes(q)) ||
      (deal.contact?.name && deal.contact.name.toLowerCase().includes(q)) ||
      (deal.stage && deal.stage.toLowerCase().includes(q))
    );
  });

  // Calculate top KPI metrics
  const totalDealsCount = deals.length;
  const openDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  const wonRevenue = deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', height: '100%' }}>
      
      {/* Top Header Section (Matching Order Forms & Contracts Header) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '0.2rem' }}>
            CRM Leads & Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage pipeline stages, lead tracking, and deal workflows.
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
            title="Refresh Pipeline"
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
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-orbit"
              style={{ paddingLeft: '2.35rem', height: '2.5rem', fontSize: '0.85rem', borderRadius: 'var(--radius-lg)' }}
            />
          </div>

          {/* Stages Drawer Button */}
          <button
            type="button"
            onClick={() => setIsStageDrawerOpen(true)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '2.5rem', padding: '0 1rem', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <GitBranch size={15} />
            <span>Stages</span>
          </button>

          {/* New Deal Button */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '2.5rem', padding: '0 1.25rem', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--surface-1)', borderRadius: '1rem', padding: '1rem 1.25rem', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Deals</span>
          <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{openDeals.length}</p>
        </div>
        <div style={{ background: 'var(--surface-1)', borderRadius: '1rem', padding: '1rem 1.25rem', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pipeline Value</span>
          <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>{formatCurrency(pipelineValue)}</p>
        </div>
        <div style={{ background: 'var(--surface-1)', borderRadius: '1rem', padding: '1rem 1.25rem', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Won Revenue</span>
          <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{formatCurrency(wonRevenue)}</p>
        </div>
        <div style={{ background: 'var(--surface-1)', borderRadius: '1rem', padding: '1rem 1.25rem', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Deals</span>
          <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{totalDealsCount}</p>
        </div>
      </div>

      {/* BOARD VIEW (Styled Exactly like the Order Forms & Contracts Board) */}
      {viewMode === 'board' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${stages.length}, minmax(210px, 1fr))`,
          gap: '0.875rem',
          alignItems: 'stretch',
          overflowX: 'auto',
          paddingBottom: '1rem',
          minHeight: 'calc(100vh - 300px)'
        }}>
          {stages.map(stage => {
            const theme = getStageTheme(stage.name, stage.color);
            const stageDeals = filteredDeals.filter(d => d.stage === stage.name);

            return (
              <div
                key={stage._id || stage.name}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dealId = e.dataTransfer.getData('dealId');
                  if (dealId) handleDropDeal(dealId, stage.name);
                }}
                style={{
                  background: theme.bg,
                  borderRadius: '1.25rem',
                  border: `1px solid ${theme.badgeBorder}`,
                  borderTop: `4px solid ${stage.color || theme.borderTop}`,
                  padding: '1.125rem 0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                  minHeight: '520px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
                className="dark:border-opacity-30 dark:bg-slate-900/40"
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem 0.5rem 0.25rem' }}>
                  <span style={{
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    color: theme.headerColor,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}>
                    {stage.name}
                  </span>
                  
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: theme.badgeBg,
                    border: `1px solid ${theme.badgeBorder}`,
                    color: theme.badgeColor,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {stageDeals.length}
                  </span>
                </div>

                {/* Column Deals List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {stageDeals.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No items
                      </span>
                    </div>
                  ) : (
                    stageDeals.map(deal => (
                      <div
                        key={deal._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('dealId', deal._id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => navigate(`/crm/deals/${deal._id}`)}
                        style={{
                          background: '#ffffff',
                          borderRadius: '0.875rem',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          borderLeft: `3.5px solid ${stage.color || '#0284c7'}`,
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
                        {/* Top: Tag / Ref + Amount */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>
                            {deal.contact?.name || deal.company?.name || 'LEAD'}
                          </span>
                          <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a' }} className="dark:text-white">
                            {formatCurrency(deal.amount, deal.currency)}
                          </span>
                        </div>

                        {/* Company / Deal Name */}
                        <div style={{
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          letterSpacing: '-0.01em',
                          textTransform: 'uppercase',
                          marginTop: '0.125rem'
                        }} className="dark:text-white">
                          {deal.company?.name || deal.name}
                        </div>

                        {/* Bottom: Date & Link action */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '0.25rem',
                          paddingTop: '0.35rem',
                          borderTop: '1px solid var(--border-subtle)'
                        }}>
                          <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 500 }}>
                            {deal.name} • {formatDateStr(deal.closeDate || deal.createdAt)}
                          </span>
                          <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={14} />
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
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>DEAL NAME</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>COMPANY</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CONTACT</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>STAGE</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AMOUNT</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CLOSE DATE</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading && deals.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}>⏳</div>
                      Loading deals pipeline...
                    </td>
                  </tr>
                ) : filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No deals found.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal, index) => {
                    const stageColor = getStageColor(deal.stage);
                    const isLastRow = index === filteredDeals.length - 1;

                    return (
                      <tr 
                        key={deal._id}
                        style={{ 
                          borderBottom: isLastRow ? 'none' : '1px solid var(--border-subtle)',
                          transition: 'background 0.15s ease',
                          cursor: 'pointer'
                        }}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        onClick={() => navigate(`/crm/deals/${deal._id}`)}
                      >
                        <td style={{ padding: '1.125rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {deal.name}
                        </td>
                        <td style={{ padding: '1.125rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {deal.company?.name || '-'}
                        </td>
                        <td style={{ padding: '1.125rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {deal.contact?.name || deal.contact?.email || '-'}
                        </td>
                        <td style={{ padding: '1.125rem 1.5rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.3rem 0.85rem',
                            borderRadius: '9999px',
                            background: `${stageColor}1a`,
                            color: stageColor,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            border: `1px solid ${stageColor}40`
                          }}>
                            {deal.stage}
                          </span>
                        </td>
                        <td style={{ padding: '1.125rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatCurrency(deal.amount, deal.currency)}
                        </td>
                        <td style={{ padding: '1.125rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {formatDateStr(deal.closeDate || deal.createdAt)}
                        </td>
                        <td style={{ padding: '1.125rem 1.5rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/crm/deals/${deal._id}`);
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
                            title="View Deal"
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

      {/* Stage Manager Drawer */}
      <CrmStageManagerDrawer
        isOpen={isStageDrawerOpen}
        onClose={() => setIsStageDrawerOpen(false)}
        onChanged={fetchDeals}
      />

      {/* Create Deal Modal */}
      {isCreateModalOpen && (
        <CreateDealModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            fetchDeals();
            setIsCreateModalOpen(false);
          }}
        />
      )}

    </div>
  );
}

// Inline Create Deal Modal with Orbit Theme
function CreateDealModal({ onClose, onCreated }: { onClose: () => void; onCreated: (deal: Deal) => void }) {
  const stages = useCrmStages();
  const [name, setName] = useState('');
  const [stage, setStage] = useState(stages[0]?.name || 'New Lead');
  const [amount, setAmount] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Deal name is required');
      return;
    }
    try {
      setSaving(true);
      const res = await createCrmDeal({
        name: name.trim(),
        stage,
        amount: amount ? Number(amount) : 0,
        company: { name: companyName.trim() },
        contact: { name: contactName.trim(), email: contactEmail.trim() },
        closeDate: closeDate || undefined
      });
      toast.success('Deal created successfully');
      onCreated(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create deal');
    } finally {
      setSaving(false);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--surface-1)',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          border: '1px solid var(--border-subtle)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-2)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Create New Deal
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Add a prospective lead or deal to your pipeline
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Deal Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp Cloud Expansion"
              className="input-orbit"
              style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="input-orbit"
                style={{ width: '100%', minHeight: '2.75rem', padding: '0.5rem 0.85rem', fontSize: '0.875rem', cursor: 'pointer', lineHeight: 1.5 }}
              >
                {stages.map(s => (
                  <option key={s._id || s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25000"
                className="input-orbit"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className="input-orbit"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Estimated Close Date
              </label>
              <input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="input-orbit"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Contact Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Smith"
                className="input-orbit"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="john@acmecorp.com"
                className="input-orbit"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ padding: '0.6rem 1.75rem', fontSize: '0.875rem', fontWeight: 700 }}
            >
              {saving ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
