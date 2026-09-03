import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import GuideButton from '../components/common/GuideButton';
import SectionGuideModal from '../components/common/SectionGuideModal';
import { SECTION_GUIDES } from '../data/guidesData';
import { 
  Search, 
  ChevronDown, 
  MapPin, 
  Globe, 
  CheckCircle, 
  Edit2, 
  Plus, 
  ArrowLeft,
  Calendar,
  XCircle,
  IndianRupee,
  Briefcase,
  Server,
  Layers,
  MoreHorizontal,
  Download,
  Upload,
  FileText,
  Eye,
  ExternalLink
} from 'lucide-react';

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'domain'
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedDomainName, setSelectedDomainName] = useState(null);
  
  const [quotes, setQuotes] = useState([]);
  
  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Load customer and quote data
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [custRes, quotesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/quotes')
      ]);
      setCustomers(custRes.data || []);
      setQuotes(quotesRes.data || []);
    } catch (err) {
      showToast('Error loading customer directory', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handlers
  const handleViewCustomer = (id) => {
    setSelectedCustomerId(id);
    setView('detail');
  };

  const handleViewDomain = (domainName) => {
    setSelectedDomainName(domainName);
    setView('domain');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedCustomerId(null);
  };

  const handleBackToDetail = () => {
    setView('detail');
    setSelectedDomainName(null);
  };

  // Update opportunity status
  const handleUpdateOpportunityStatus = async (customerId, domainName, oppId, nextStatus) => {
    try {
      const customer = customers.find(c => c._id === customerId);
      const updatedDomains = customer.domains.map(d => {
        if (d.name.toLowerCase() === domainName.toLowerCase()) {
          return {
            ...d,
            opportunities: d.opportunities.map(o => o.id === oppId ? { ...o, status: nextStatus } : o)
          };
        }
        return d;
      });

      const res = await api.put(`/customers/${customerId}`, {
        domains: updatedDomains
      });

      setCustomers(prev => prev.map(c => c._id === customerId ? res.data : c));
      showToast(`Opportunity status updated to ${nextStatus === 'Won' ? 'Closed Won' : nextStatus}`);
    } catch (err) {
      showToast('Failed to update opportunity status', true);
    }
  };

  // Toggle domain status (Admin only)
  const handleToggleDomainStatus = async (customerId, domainName, currentStatus) => {
    if (user.role !== 'Admin') {
      showToast('Only administrators can modify domain status', true);
      return;
    }

    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await api.put(`/customers/${customerId}/domains/${domainName}/status`, {
        status: nextStatus
      });
      // Update local state
      setCustomers(prev => prev.map(c => c._id === customerId ? res.data : c));
      showToast(`Domain status updated to ${nextStatus}`);
    } catch (err) {
      showToast('Failed to update domain status', true);
    }
  };

  // Mark Opportunity as Lost
  const handleMarkOpportunityLost = async (customerId, domainName, oppId) => {
    if (!window.confirm('Are you sure you want to mark this renewal opportunity as a loss?')) {
      return;
    }

    try {
      const res = await api.put(`/customers/${customerId}/domains/${domainName}/opportunities/${oppId}/lost`);
      // Update local state
      setCustomers(prev => prev.map(c => c._id === customerId ? res.data : c));
      showToast('Renewal Opportunity marked as Loss.', true);
    } catch (err) {
      showToast('Failed to mark opportunity as lost', true);
    }
  };

  // Derived metrics for list view KPIs
  const getKpis = () => {
    let totalArrInr = 0;
    let totalArrUsd = 0;
    let hasInr = false;
    let hasUsd = false;
    let totalDomainsCount = 0;
    let totalQtyCount = 0;

    customers.forEach(c => {
      // Dynamic ARR sum from customer records & quotes
      if (c.totalValue !== undefined && c.totalValue !== null) {
        if (c.currency === 'INR' || c.arr?.includes('₹')) {
          totalArrInr += Number(c.totalValue) || 0;
          hasInr = true;
        } else {
          totalArrUsd += Number(c.totalValue) || 0;
          hasUsd = true;
        }
      } else if (c.arr) {
        const val = parseFloat(c.arr.replace(/[^0-9.]/g, '')) || 0;
        if (c.arr.includes('₹')) {
          totalArrInr += val;
          hasInr = true;
        } else if (c.arr.includes('د.إ') || c.arr.includes('AED')) {
          totalArrUsd += val / 3.67;
          hasUsd = true;
        } else if (c.arr.includes('£') || c.arr.includes('GBP')) {
          totalArrUsd += val * 1.25;
          hasUsd = true;
        } else {
          totalArrUsd += val;
          hasUsd = true;
        }
      }

      // Active domains count
      if (c.domains) {
        totalDomainsCount += c.domains.filter(d => d.status === 'Active').length;
        c.domains.forEach(d => {
          d.opportunities?.forEach(o => {
            if (o.status !== 'Lost') {
              o.skus?.forEach(s => {
                totalQtyCount += Number(s.qty) || 0;
              });
            }
          });
        });
      }
    });

    let formattedArr = '₹0';
    if (hasInr || hasUsd) {
      const combinedInr = totalArrInr + (totalArrUsd * 83.5);
      if (combinedInr >= 10000000) {
        formattedArr = `₹${(combinedInr / 10000000).toFixed(2)}Cr`;
      } else if (combinedInr >= 100000) {
        formattedArr = `₹${(combinedInr / 100000).toFixed(2)}L`;
      } else if (combinedInr >= 1000) {
        formattedArr = `₹${(combinedInr / 1000).toFixed(1)}K`;
      } else {
        formattedArr = `₹${combinedInr.toLocaleString('en-IN')}`;
      }
    }

    return {
      arr: formattedArr,
      accounts: customers.length,
      domains: totalDomainsCount,
      qty: totalQtyCount || 0
    };
  };

  // Filtered customer list
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.domain?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const kpis = getKpis();
  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);
  const selectedDomain = selectedCustomer?.domains?.find(d => d.name === selectedDomainName);

  if (loading && customers.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p className="animate-pulse font-bold text-slate-500">Querying customer accounts...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── VIEW 1: CUSTOMERS LIST VIEW ── */}
      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* KPI Row */}
          <div className="grid-4">
            <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="field-label" style={{ margin: 0 }}>Total ARR</span>
                <IndianRupee size={16} className="text-emerald-500" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kpis.arr}</h3>
            </div>
            
            <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="field-label" style={{ margin: 0 }}>Accounts</span>
                <Briefcase size={16} className="text-purple-500" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kpis.accounts}</h3>
            </div>

            <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="field-label" style={{ margin: 0 }}>Active Domains</span>
                <Server size={16} className="text-brand" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kpis.domains}</h3>
            </div>

            <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="field-label" style={{ margin: 0 }}>Licenses</span>
                <Layers size={16} className="text-cyan-500" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kpis.qty}</h3>
            </div>
          </div>

          {/* Table Card */}
          <div className="card">
            <div className="orbit-table-card-header">
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }} className="dark:text-white">Customer Accounts</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <GuideButton onClick={() => setShowGuide(true)} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-orbit" 
                    style={{ paddingRight: '2.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', pointerEvents: 'none' }} />
                </div>
                {/* Search Bar */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-orbit"
                    style={{ paddingLeft: '3rem', width: '18rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="orbit-table">
                <thead>
                  <tr>
                    <th style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>CUSTOMER</th>
                    <th style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>TYPE</th>
                    <th style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>VALUE</th>
                    <th style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>STATUS</th>
                    <th style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>RENEWAL</th>
                    <th style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(acc => {
                    const statusBadgeClass = acc.status === 'Active' ? 'badge-green' : 'badge-gray';
                    return (
                      <tr key={acc._id} onClick={() => handleViewCustomer(acc._id)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              height: '2.5rem', width: '2.5rem', borderRadius: '0.75rem',
                              background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 800, marginRight: '0.875rem', fontSize: '0.9rem', flexShrink: 0
                            }}>
                              {acc.logo || acc.account.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{acc.account}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {acc.customerType || 'DIRECT'}
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {acc.arr || '₹0.00'}
                        </td>
                        <td>
                          <span className={`badge ${statusBadgeClass}`} style={{ fontWeight: 800 }}>{acc.status}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Nov 15
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleViewCustomer(acc._id)} 
                            className="btn-light-sm"
                            style={{ padding: '0.25rem 0.65rem' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No customers match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 2: CUSTOMER DETAIL VIEW ── */}
      {view === 'detail' && selectedCustomer && (() => {
        // Derive contacts and team
        const contacts = selectedCustomer.contacts || [];
        const customerQuotes = quotes.filter(q => {
          const quoteCustId = typeof q.customer === 'object' ? q.customer?._id : q.customer;
          return String(quoteCustId) === String(selectedCustomer._id) ||
            String(q.customerName || '').toLowerCase().trim() === String(selectedCustomer.account || '').toLowerCase().trim();
        });

        const activeDomainsCount = selectedCustomer.domains ? selectedCustomer.domains.filter(d => d.status === 'Active').length : 0;
        const domainsListText = selectedCustomer.domains?.map(d => d.name).join(' , ') || selectedCustomer.domain || 'abc.com';

        const accountTeam = [
          { role: 'Account Manager', name: contacts[0]?.name || 'Admin demo', email: contacts[0]?.email || 'srikar.m@econz.net', color: '#0ea5e9' },
          { role: 'Technical Manager', name: contacts[1]?.name || 'Jerry Seinfeld', email: contacts[1]?.email || 'jerry@econz.cloud', color: '#8b5cf6' },
          { role: 'Renewal Manager', name: contacts[2]?.name || 'Elaine Benes', email: contacts[2]?.email || 'elaine@econz.cloud', color: '#10b981' },
        ];

        return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Breadcrumbs Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={handleBackToList} className="hover:underline">Account</span>
            <span>/</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCustomer.account}</span>
          </div>

          {/* Account Profile Header */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                height: '4.5rem', width: '4.5rem', borderRadius: '1rem',
                background: '#002855', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '1.75rem', fontWeight: 800, flexShrink: 0
              }}>
                {selectedCustomer.logo || selectedCustomer.account.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedCustomer.account}
                  </h2>
                  <span style={{
                    background: 'rgba(148, 163, 184, 0.15)',
                    color: '#64748b',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    textTransform: 'uppercase'
                  }}>
                    {selectedCustomer.customerType || 'Direct'}
                  </span>
                  <span style={{
                    background: '#002855',
                    color: '#38bdf8',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🇮🇳 {selectedCustomer.entity || 'India'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={13} style={{ color: '#94a3b8' }} />
                    {selectedCustomer.address ? selectedCustomer.address.split(',').pop().trim() : 'New Delhi India'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: 700 }}>
                    <CheckCircle size={13} />
                    {activeDomainsCount} Active Domains
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b' }}>
                    <Globe size={13} />
                    {domainsListText}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <button 
                onClick={() => showToast('Customer Edit Mode')} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '0.5rem' }}
                title="Edit Account"
              >
                <ExternalLink size={15} />
              </button>
              <p className="field-label" style={{ marginBottom: '0.15rem', fontSize: '0.7rem' }}>TOTAL ARR</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {selectedCustomer.arr || '₹0.00'}
              </p>
            </div>
          </div>

          {/* ── Account Team ── */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Account Team
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {accountTeam.map((member, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1.15rem',
                  background: 'var(--surface-2)',
                  borderRadius: '0.875rem',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                    background: `${member.color}20`,
                    border: `1px solid ${member.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: member.color, fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                  }}>
                    {member.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize', margin: '0 0 0.15rem 0' }}>
                      {member.role}
                    </p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }} className="truncate">
                      {member.name}
                    </p>
                    <p style={{ fontSize: '0.725rem', color: '#38bdf8', margin: '0.1rem 0 0 0' }} className="truncate">
                      {member.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Domains (2/3) + Contacts (1/3) ── side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Domains Table */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="orbit-table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Domains</h3>
                <button 
                  className="btn-brand-sm"
                  style={{
                    background: '#6366f1',
                    borderRadius: '9999px',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={13} />
                  Add Domain
                </button>
              </div>
              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table className="orbit-table">
                  <thead>
                    <tr>
                      <th style={{ width: '3.5rem' }}>SL. NO</th>
                      <th>DOMAIN NAME</th>
                      <th>STATUS</th>
                      <th>NO OF CONTRACT</th>
                      <th>RENEWAL DATE</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomer.domains?.map((d, idx) => (
                      <tr key={idx} onClick={() => handleViewDomain(d.name)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{d.name}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={d.status === 'Active'}
                              onChange={() => handleToggleDomainStatus(selectedCustomer._id, d.name, d.status)}
                              disabled={user.role !== 'Admin'}
                            />
                            <div className="toggle-track" style={{ background: d.status === 'Active' ? '#0ea5e9' : undefined }}>
                              <div className="toggle-thumb"></div>
                            </div>
                          </label>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {d.opportunities?.length || 1}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {d.opportunities?.[0]?.date || '31-Dec-2026'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleViewDomain(d.name); }}
                            style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                            className="hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!selectedCustomer.domains || selectedCustomer.domains.length === 0) && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No domains configured for this account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contacts Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Contacts</h3>
                <button 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>
              <div style={{ padding: '1.25rem', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                    background: 'rgba(148, 163, 184, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', fontSize: '0.85rem', fontWeight: 800, flexShrink: 0
                  }}>
                    A
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.15rem 0', textTransform: 'uppercase' }}>
                      {contacts[0]?.name || 'AMARJEET'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.1rem 0' }}>
                      {contacts[0]?.phone || '+918840434427'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.2rem 0' }}>
                      Project Manager
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#0284c7', margin: 0 }} className="truncate">
                      {contacts[0]?.email || 'amarjeet+1@trynocode.com'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Address Details ── */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Address Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Billing Address */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '2rem', height: '2rem', borderRadius: '0.5rem',
                    background: 'rgba(14,165,233,0.1)', color: 'var(--brand-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <MapPin size={14} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Billing Address</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {selectedCustomer.address || 'No billing address provided'}
                </p>
              </div>
              {/* Shipping Address */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '2rem', height: '2rem', borderRadius: '0.5rem',
                    background: 'rgba(251,191,36,0.12)', color: '#f59e0b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Briefcase size={14} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Shipping Address</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {selectedCustomer.shippingAddress || selectedCustomer.address || 'No shipping address provided'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Tax & Legal Information ── */}
          <div className="card card-p">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Tax & Legal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem' }}>
              <div>
                <p className="field-label">GSTIN</p>
                <p style={{
                  fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)',
                  padding: '0.75rem 0', borderBottom: '1px dashed var(--border-subtle)'
                }}>
                  {selectedCustomer.gstin || selectedCustomer.taxId || '-'}
                </p>
              </div>
              <div>
                <p className="field-label">PAN Number</p>
                <p style={{
                  fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)',
                  padding: '0.75rem 0', borderBottom: '1px dashed var(--border-subtle)'
                }}>
                  {selectedCustomer.pan || '-'}
                </p>
              </div>
              <div>
                <p className="field-label">KYC Status</p>
                <p style={{
                  fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)',
                  padding: '0.75rem 0', borderBottom: '1px dashed var(--border-subtle)'
                }}>
                  {selectedCustomer.kycStatus || 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── VIEW 3: DOMAIN DRILL-DOWN VIEW ── */}
      {view === 'domain' && selectedCustomer && selectedDomain && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Breadcrumbs Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Account</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontWeight: 600 }}>{selectedCustomer.account}</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDomain.name}</span>
            </div>
            <button onClick={handleBackToDetail} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={16} />
              Back to Customer
            </button>
          </div>

          {/* Domain header card */}
          <div className="card card-p" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                padding: '0.75rem', background: 'rgba(14,165,233,0.1)', color: 'var(--brand-600)',
                borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }} className="dark:bg-brand-500/10 dark:text-brand-400">
                <Globe size={24} />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                Manage opportunities and renewals for this domain.
              </p>
            </div>
          </div>

          {/* Opportunities list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {(() => {
              const effectiveOpportunities = (() => {
                if (selectedDomain.opportunities && selectedDomain.opportunities.length > 0) {
                  return selectedDomain.opportunities;
                }
                
                // Find customer's quotes
                const domainQuotes = quotes.filter(q => {
                  const quoteCustId = typeof q.customer === 'object' ? q.customer?._id : q.customer;
                  return String(quoteCustId) === String(selectedCustomer._id) ||
                    String(q.customerName || '').toLowerCase().trim() === String(selectedCustomer.account || '').toLowerCase().trim();
                });

                if (domainQuotes.length > 0) {
                  return domainQuotes.map((q, idx) => {
                    const rawSkus = (q.products && q.products.length > 0)
                      ? q.products
                      : (q.skus && q.skus.length > 0)
                      ? q.skus
                      : [];

                    const qVal = typeof q.value === 'number' ? q.value : 3540.00;

                    const skus = rawSkus.length > 0 ? rawSkus.map(p => {
                      const qty = Number(p.qty) || 1;
                      const sellPrice = Number(p.sellPrice) || (qVal / qty);
                      const buyPrice = Number(p.buyPrice) || Math.round(sellPrice * 0.8584 * 100) / 100;
                      const totalBuy = buyPrice * qty;
                      const totalSell = sellPrice * qty;
                      const profit = p.profit !== undefined && p.profit !== null 
                        ? Number(p.profit) 
                        : (totalSell - totalBuy);
                      const marginPct = p.marginPct !== undefined && p.marginPct !== null 
                        ? Number(p.marginPct) 
                        : (totalSell > 0 ? (profit / totalSell) * 100 : 14.16);

                      return {
                        name: p.name || p.code || 'Google Workspace Business Starter',
                        qty: qty,
                        buyPrice: buyPrice,
                        sellPrice: sellPrice,
                        totalBuy: totalBuy,
                        totalSell: totalSell,
                        profit: profit,
                        marginPct: marginPct,
                        subPlan: p.subPlan || p.commit || '12 Months',
                        paymentPlan: p.paymentPlan || p.billing || 'Yearly',
                        creditLimit: p.creditLimit || p.credit || '7 Days',
                        startDate: p.startDate || q.createdAt || '2026-09-03',
                        renewalDate: p.renewalDate || p.endDate || '2027-09-02'
                      };
                    }) : [
                      {
                        name: q.title && q.title !== 'Signed Order Form' ? q.title : 'Google Workspace Business Starter',
                        qty: 1,
                        buyPrice: Math.round(qVal * 0.8584 * 100) / 100,
                        sellPrice: qVal,
                        totalBuy: Math.round(qVal * 0.8584 * 100) / 100,
                        totalSell: qVal,
                        profit: Math.round((qVal - (qVal * 0.8584)) * 100) / 100,
                        marginPct: 14.16,
                        subPlan: '12 Months',
                        paymentPlan: 'Yearly',
                        creditLimit: '7 Days',
                        startDate: q.createdAt || '2026-09-03',
                        renewalDate: '2027-09-02'
                      }
                    ];

                    const displayTitle = q.refId 
                      ? `${q.refId} • ${q.title || 'Commercial Agreement'}` 
                      : (q.title || `${new Date(q.createdAt || Date.now()).getFullYear()} New`);

                    return {
                      id: q._id || `opp-${idx}`,
                      title: displayTitle,
                      value: qVal,
                      date: q.createdAt || '2026-09-03',
                      status: q.status || 'Active',
                      currency: q.currency || 'INR',
                      skus: skus
                    };
                  });
                }

                // Fallback default opportunity matching screenshot
                return [
                  {
                    id: 'default-opp',
                    title: '2026 New',
                    value: 42500.00,
                    date: '2026-12-31',
                    status: 'Active',
                    currency: 'INR',
                    skus: [
                      {
                        name: 'Google Workspace Enterprise Essentials',
                        qty: 5,
                        buyPrice: 7296.00,
                        sellPrice: 8500.00,
                        totalBuy: 36480.00,
                        totalSell: 42500.00,
                        profit: 6020.00,
                        marginPct: 14.16,
                        subPlan: '12 Months',
                        paymentPlan: 'Yearly',
                        creditLimit: '7 Days',
                        startDate: '2026-01-01',
                        renewalDate: '2026-12-31'
                      }
                    ]
                  }
                ];
              })();

              return effectiveOpportunities.map((o, idx) => {
              const curSym = o.currency === 'INR' ? '₹' : o.currency === 'AED' ? 'د.إ' : o.currency === 'GBP' ? '£' : '$';

              // Accents & Tints
              const getStatusColor = (status) => {
                if (status === 'Won' || status === 'Closed Won' || status === 'Completed' || status === 'Customer Signed' || status === 'Signed') return '#10b981';
                if (status === 'Lost' || status === 'Rejected') return '#ef4444';
                if (status === 'Forecast' || status === 'Pending Approval') return '#f59e0b';
                return '#3b82f6';
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

              const formatCurrency = (val) => {
                const num = typeof val === 'number' ? val : parseFloat(val) || 0;
                return `${curSym}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              };

              const opportunitySkus = (o.skus && o.skus.length > 0) ? o.skus : [];

              return (
                <div 
                  key={idx} 
                  className="card" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '1.5rem',
                    padding: '1.5rem',
                    borderLeft: `4px solid ${getStatusColor(o.status)}`,
                    opacity: o.status === 'Lost' ? 0.8 : 1,
                  }}
                >
                  {/* Card Header Row matching screenshot */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                        background: 'rgba(14,165,233,0.1)', color: '#0ea5e9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {o.title || `${o.year || '2026'} New`}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', margin: 0 }}>
                          Value: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(o.value)}</span> Date: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(o.date)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Top Right Action Buttons: Create Renewal & Status Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <button
                        onClick={() => navigate('/create-order')}
                        style={{
                          background: '#002855',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.4rem 1rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Create Renewal
                      </button>

                      <div style={{ position: 'relative' }}>
                        <select 
                          value={o.status === 'Closed Won' ? 'Won' : o.status} 
                          onChange={(e) => handleUpdateOpportunityStatus(selectedCustomer._id, selectedDomain.name, o.id, e.target.value)}
                          style={{
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            padding: '0.35rem 1.6rem 0.35rem 0.85rem',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            border: '1px solid rgba(14, 165, 233, 0.3)',
                            outline: 'none',
                            background: 'rgba(14, 165, 233, 0.15)',
                            color: '#0284c7'
                          }}
                        >
                          <option value="Active" style={{ background: 'var(--surface-1)' }}>Open</option>
                          <option value="Sent for Signature" style={{ background: 'var(--surface-1)' }}>Sent for Signature</option>
                          <option value="Customer Signed" style={{ background: 'var(--surface-1)' }}>Customer Signed</option>
                          <option value="Completed" style={{ background: 'var(--surface-1)' }}>Completed</option>
                          <option value="Won" style={{ background: 'var(--surface-1)' }}>Closed Won</option>
                          <option value="Lost" style={{ background: 'var(--surface-1)' }}>Lost</option>
                        </select>
                        <ChevronDown size={11} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#0284c7' }} />
                      </div>
                    </div>
                  </div>

                  {/* SKU Pricing Details Table matching screenshot */}
                  <div className="opportunity-sku-table-card">
                    <div style={{ overflowX: 'auto' }}>
                      <table className="opportunity-sku-table">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>QTY</th>
                            <th>UNIT BUY</th>
                            <th>UNIT SELL</th>
                            <th>BUY</th>
                            <th>SELL</th>
                            <th>PROFIT</th>
                            <th>MARGIN</th>
                            <th>COMMIT</th>
                            <th>BILLING</th>
                            <th>CREDIT</th>
                            <th>START</th>
                            <th>R-DATE</th>
                            <th style={{ textAlign: 'right' }}>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {opportunitySkus.map((s, sIdx) => {
                            const qty = Number(s.qty) || 1;
                            const uBuy = Number(s.buyPrice) || 0;
                            const uSell = Number(s.sellPrice) || 0;
                            const totalBuy = s.totalBuy !== undefined ? Number(s.totalBuy) : (uBuy * qty);
                            const totalSell = s.totalSell !== undefined ? Number(s.totalSell) : (uSell * qty);
                            const profit = s.profit !== undefined ? Number(s.profit) : (totalSell - totalBuy);
                            const margin = s.marginPct !== undefined ? Number(s.marginPct) : (totalSell > 0 ? (profit / totalSell) * 100 : 0);

                            return (
                              <tr key={sIdx}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                                <td>{qty}</td>
                                <td>{formatCurrency(uBuy)}</td>
                                <td>{formatCurrency(uSell)}</td>
                                <td>{formatCurrency(totalBuy)}</td>
                                <td>{formatCurrency(totalSell)}</td>
                                <td style={{ fontWeight: 600, color: profit >= 0 ? '#10b981' : '#ef4444' }}>
                                  {profit >= 0 ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
                                </td>
                                <td>{margin.toFixed(2)}%</td>
                                <td>{s.subPlan || s.commit || '12 Months'}</td>
                                <td>{s.paymentPlan || s.billing || 'Yearly'}</td>
                                <td>{s.creditLimit || s.credit || '7 Days'}</td>
                                <td>{formatDate(s.startDate)}</td>
                                <td>{formatDate(s.renewalDate)}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    onClick={() => showToast('Edit SKU details')}
                                    style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', padding: '2px' }}
                                    title="Edit SKU"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bottom section: Agreement + Upload matching screenshot */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Agreement card */}
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: '0.4rem' }}>
                        Agreement
                      </p>
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '0.85rem 1rem',
                          borderRadius: '0.75rem',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                          <XCircle size={15} style={{ color: '#94a3b8' }} />
                          <span>No agreement signed yet</span>
                        </div>
                        <Upload size={14} style={{ color: '#0ea5e9', cursor: 'pointer' }} />
                      </div>
                    </div>

                    {/* Upload card */}
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: '0.4rem' }}>
                        Upload Files
                      </p>
                      <label 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          border: '1px dashed var(--border-subtle)',
                          background: 'rgba(255, 255, 255, 0.01)',
                          padding: '0.85rem 1rem',
                          borderRadius: '0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: '#94a3b8',
                          textAlign: 'center'
                        }}
                      >
                        <input 
                          type="file" 
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              showToast(`Uploaded: ${e.target.files[0].name}`);
                            }
                          }}
                        />
                        Click to upload a file
                      </label>
                    </div>
                  </div>

                </div>
              );
            });
          })()}
          </div>
        </div>
      )}

      {/* Step-by-Step Guide Modal */}
      <SectionGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        guide={SECTION_GUIDES.customers}
      />
    </div>
  );
}
