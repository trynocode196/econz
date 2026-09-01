import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
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
  DollarSign,
  Briefcase,
  Server,
  Layers,
  MoreHorizontal,
  Download,
  Upload,
  FileText
} from 'lucide-react';

export default function Customers() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'domain'
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedDomainName, setSelectedDomainName] = useState(null);
  
  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Load customer data
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data);
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
    let totalArrValue = 0;
    let totalDomainsCount = 0;
    let totalQtyCount = 0;

    customers.forEach(c => {
      // ARR sum
      if (c.arr) {
        const val = parseFloat(c.arr.replace(/[^0-9.]/g, '')) || 0;
        if (c.arr.includes('₹')) {
          totalArrValue += val / 83; // approx INR to USD
        } else if (c.arr.includes('د.إ') || c.arr.includes('AED')) {
          totalArrValue += val / 3.67; // approx AED to USD
        } else if (c.arr.includes('£') || c.arr.includes('GBP')) {
          totalArrValue += val * 1.25; // approx GBP to USD
        } else {
          totalArrValue += val;
        }
      }

      // Active domains count
      if (c.domains) {
        totalDomainsCount += c.domains.filter(d => d.status === 'Active').length;
        c.domains.forEach(d => {
          d.opportunities?.forEach(o => {
            if (o.status !== 'Lost') {
              o.skus?.forEach(s => {
                totalQtyCount += s.qty || 0;
              });
            }
          });
        });
      }
    });

    return {
      arr: '$' + (totalArrValue / 1000).toFixed(0) + 'K',
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
                <DollarSign size={16} className="text-emerald-500" />
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
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Renewal</th>
                    <th style={{ textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(acc => {
                    const statusBadgeClass = acc.status === 'Active' ? 'badge-green' : 'badge-gray';
                    return (
                      <tr key={acc._id} onClick={() => handleViewCustomer(acc._id)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              height: '2.5rem', width: '2.5rem', borderRadius: '0.75rem',
                              background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 700, marginRight: '1rem', fontSize: '0.875rem'
                            }}>
                              {acc.logo || acc.account.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--slate-700)' }} className="dark:text-slate-200">{acc.account}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-400)' }}>
                          {acc.customerType}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--slate-900)' }} className="dark:text-white">
                          {acc.arr}
                        </td>
                        <td>
                          <span className={`badge ${statusBadgeClass}`}>{acc.status}</span>
                        </td>
                        <td style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)' }}>
                          Nov 15
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleViewCustomer(acc._id); }} 
                            className="btn-light-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
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
        const accountTeam = [
          { role: 'Account Manager', name: contacts[0]?.name || 'Amarjeet', email: contacts[0]?.email || 'dev@nocodework.com', color: '#10b981' },
          { role: 'Technical Manager', name: contacts[1]?.name || 'Jerry Seinfeld', email: contacts[1]?.email || 'jerry@econz.cloud', color: '#8b5cf6' },
          { role: 'Renewal Manager', name: contacts[2]?.name || 'Binal K Babu', email: contacts[2]?.email || 'binal@econz.net', color: '#f97316' },
        ];

        return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Back button row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleBackToList} className="btn-secondary">
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
              Back to Accounts
            </button>
            {user.role === 'Admin' && (
              <button onClick={() => showToast('Customer Edit Mode Enabled (Admin Access Only)')} className="btn-light-sm">
                <Edit2 size={16} style={{ marginRight: '0.5rem' }} />
                Edit Account
              </button>
            )}
          </div>

          {/* Account Profile Header */}
          <div className="card card-p-lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{
                height: '5rem', width: '5rem', borderRadius: '1.25rem',
                background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '2rem', fontWeight: 800, boxShadow: 'var(--shadow-lg)'
              }}>
                {selectedCustomer.logo || selectedCustomer.account.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedCustomer.account}
                  </h2>
                  <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>
                    {selectedCustomer.customerType}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={14} />
                    {selectedCustomer.address ? selectedCustomer.address.split(',').pop().trim() : 'USA'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Globe size={14} />
                    {selectedCustomer.domain}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--emerald-400)', fontWeight: 700 }}>
                    <CheckCircle size={14} />
                    {selectedCustomer.domains ? selectedCustomer.domains.filter(d => d.status === 'Active').length : 0} Active Domains
                  </span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="field-label" style={{ marginBottom: '0.25rem' }}>Total ARR</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedCustomer.arr}
              </p>
            </div>
          </div>

          {/* ── Account Team ── */}
          <div className="card card-p">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Account Team
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {accountTeam.map((member, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: '2.75rem', height: '2.75rem', borderRadius: '50%',
                    background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                    letterSpacing: '0.02em'
                  }}>
                    {member.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>
                      {member.role}
                    </p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">
                      {member.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }} className="truncate">
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
            <div className="card">
              <div className="orbit-table-card-header">
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Domains</h3>
                <button className="btn-brand-sm">
                  <Plus size={12} />
                  Add Domain
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="orbit-table">
                  <thead>
                    <tr>
                      <th style={{ width: '3.5rem' }}>Sl. No</th>
                      <th>Domain Name</th>
                      <th>Status</th>
                      <th>No of Contract</th>
                      <th>Renewal Date</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomer.domains?.map((d, idx) => (
                      <tr key={idx} onClick={() => handleViewDomain(d.name)}>
                        <td style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700 }} className="text-brand">{d.name}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={d.status === 'Active'}
                              onChange={() => handleToggleDomainStatus(selectedCustomer._id, d.name, d.status)}
                              disabled={user.role !== 'Admin'}
                            />
                            <div className="toggle-track">
                              <div className="toggle-thumb"></div>
                            </div>
                          </label>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {d.opportunities ? d.opportunities.length : 0}
                        </td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {d.opportunities?.[0]?.date || '-'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-light-sm" style={{ padding: '0.25rem 0.5rem' }}>View</button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Contacts</h3>
                <button className="btn-light-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem' }}>
                  <Plus size={10} />
                  Add
                </button>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto' }}>
                {contacts.length > 0 ? contacts.map((contact, index) => (
                  <div key={index} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                    paddingBottom: '1rem', marginBottom: '1rem',
                    borderBottom: index < contacts.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                  }}>
                    <div style={{
                      width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                      background: 'var(--surface-3)', border: '1px solid var(--border-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                    }}>
                      {contact.name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }} className="truncate">
                        {contact.name}
                      </p>
                      {contact.phone && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>{contact.phone}</p>
                      )}
                      {contact.email && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--brand-500)', fontWeight: 600 }} className="truncate">{contact.email}</p>
                      )}
                    </div>
                  </div>
                )) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                    No contacts added yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Address Details ── */}
          <div className="card card-p">
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
            {selectedDomain.opportunities?.map((o, idx) => {
              const curSym = o.currency === 'INR' ? '₹' : o.currency === 'AED' ? 'د.إ' : o.currency === 'GBP' ? '£' : '$';

              // Accents & Tints
              const getStatusColor = (status) => {
                if (status === 'Won' || status === 'Closed Won') return '#10b981';
                if (status === 'Lost') return '#ef4444';
                if (status === 'Forecast') return '#f59e0b';
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

              // Fallback SKU list matching screenshot exactly if skus array is empty
              const opportunitySkus = (o.skus && o.skus.length > 0) ? o.skus : [
                {
                  name: 'Business Starter',
                  qty: 5,
                  buyPrice: 67.20,
                  sellPrice: 71.00,
                  profit: 19.00,
                  marginPct: 5.35,
                  subPlan: '24 Months',
                  paymentPlan: 'Quarterly',
                  creditLimit: '15 Days',
                  startDate: '2026-05-08',
                  renewalDate: '2027-05-07'
                },
                {
                  name: 'Business Plus',
                  qty: 3,
                  buyPrice: 13248.00,
                  sellPrice: 15001.00,
                  profit: 5259.00,
                  marginPct: 11.69,
                  subPlan: '12 Months',
                  paymentPlan: 'Monthly',
                  creditLimit: '20 Days',
                  startDate: '2026-05-08',
                  renewalDate: '2027-05-07'
                },
                {
                  name: 'Google Workspace',
                  qty: 12,
                  buyPrice: 8832.00,
                  sellPrice: 9001.00,
                  profit: 2028.00,
                  marginPct: 1.88,
                  subPlan: '12 Months',
                  paymentPlan: 'Yearly',
                  creditLimit: '7 Days',
                  startDate: '2026-05-08',
                  renewalDate: '2027-05-07'
                }
              ];

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
                  {/* Card Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                        background: 'rgba(14,165,233,0.1)', color: 'var(--brand-500)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {o.title || `${o.year} Renewal`}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem', margin: 0 }}>
                          Value: <span style={{ fontWeight: 600 }}>{formatCurrency(o.value)}</span> • Date: <span style={{ fontWeight: 600 }}>{formatDate(o.date)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Interactive Dropdown Status Badge */}
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={o.status === 'Closed Won' ? 'Won' : o.status} 
                        onChange={(e) => handleUpdateOpportunityStatus(selectedCustomer._id, selectedDomain.name, o.id, e.target.value)}
                        className="dark:bg-slate-800"
                        style={{
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          padding: '0.375rem 1.75rem 0.375rem 0.75rem',
                          borderRadius: '9999px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          border: 'none',
                          outline: 'none',
                          background: o.status === 'Won' || o.status === 'Closed Won' ? 'rgba(16,185,129,0.1)' : o.status === 'Lost' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          color: o.status === 'Won' || o.status === 'Closed Won' ? '#10b981' : o.status === 'Lost' ? '#ef4444' : '#d97706'
                        }}
                      >
                        <option value="Forecast" style={{ color: '#d97706', background: 'var(--surface-1)' }}>Forecast</option>
                        <option value="Active" style={{ color: '#3b82f6', background: 'var(--surface-1)' }}>Active</option>
                        <option value="Won" style={{ color: '#10b981', background: 'var(--surface-1)' }}>Closed Won</option>
                        <option value="Lost" style={{ color: '#ef4444', background: 'var(--surface-1)' }}>Lost</option>
                      </select>
                      <ChevronDown size={12} style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: o.status === 'Won' || o.status === 'Closed Won' ? '#10b981' : o.status === 'Lost' ? '#ef4444' : '#d97706' }} />
                    </div>
                  </div>

                  {/* SKU Pricing Details Table */}
                  <div className="opportunity-sku-table-card">
                    <div style={{ overflowX: 'auto' }}>
                      <table className="opportunity-sku-table">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>QTY</th>
                            <th>Unit Buy</th>
                            <th>Unit Sell</th>
                            <th>Buy</th>
                            <th>Sell</th>
                            <th>Profit</th>
                            <th>Margin</th>
                            <th>Commit</th>
                            <th>Billing</th>
                            <th>Credit</th>
                            <th>Start</th>
                            <th>R-Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {opportunitySkus.map((s, sIdx) => {
                            const uBuy = s.buyPrice || 0;
                            const uSell = s.sellPrice || 0;
                            const qty = s.qty || 1;
                            const totalBuy = uBuy * qty;
                            const totalSell = uSell * qty;
                            const profit = s.profit !== undefined ? s.profit : (totalSell - totalBuy);
                            const margin = s.marginPct !== undefined ? s.marginPct : (totalSell > 0 ? (profit / totalSell) * 100 : 0);

                            return (
                              <tr key={sIdx}>
                                <td>{s.name}</td>
                                <td>{qty}</td>
                                <td>{formatCurrency(uBuy)}</td>
                                <td>{formatCurrency(uSell)}</td>
                                <td>{formatCurrency(totalBuy)}</td>
                                <td>{formatCurrency(totalSell)}</td>
                                <td style={{ fontWeight: 600, color: profit >= 0 ? 'var(--emerald-500)' : 'var(--rose-400)' }}>
                                  {formatCurrency(profit)}
                                </td>
                                <td>{margin.toFixed(2)}%</td>
                                <td>{s.subPlan || s.commit || '12 Months'}</td>
                                <td>{s.paymentPlan || s.billing || 'Monthly'}</td>
                                <td>{s.creditLimit || s.credit || '7 Days'}</td>
                                <td>{formatDate(s.startDate || s.start)}</td>
                                <td>{formatDate(s.renewalDate || s.renewal || s.endDate || s.rDate)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bottom section: Agreement + Upload */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-2">
                    {/* Agreement card */}
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Agreement
                      </p>
                      <div 
                        onClick={() => {
                          showToast('Contract Agreement Download Started');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--surface-2)',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2rem', height: '2rem', borderRadius: '0.375rem',
                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <FileText size={16} />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Completed
                          </span>
                        </div>
                        <Download size={16} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>

                    {/* Upload card */}
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Upload Files
                      </p>
                      <label 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          border: '1px dashed var(--border-strong)',
                          background: 'transparent',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-lg)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          transition: 'var(--transition)',
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
                        <Upload size={16} />
                        Click to upload a file
                      </label>
                    </div>
                  </div>

                </div>
              );
            })}

            {(!selectedDomain.opportunities || selectedDomain.opportunities.length === 0) && (
              <div className="card card-p" style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--slate-400)' }}>
                No active opportunities identified for this domain.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
