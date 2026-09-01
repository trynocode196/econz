import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import RevenueChart from '../components/charts/RevenueChart';
import DonutChart from '../components/charts/DonutChart';
import { 
  DollarSign, 
  Briefcase, 
  Users, 
  Mail, 
  Plus, 
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArr: 4250000,
    activePipeline: 48,
    totalCustomers: 142,
    monthlyDocs: 24,
    pendingSignature: 8,
    contractsSigned: 11,
    signedValue: 142000,
    productMix: [65, 35],
    revenueData: [180, 210, 240, 235, 260, 280]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch real data from server to override default stats
        const [customersRes, quotesRes] = await Promise.all([
          api.get('/customers'),
          api.get('/quotes')
        ]);

        const customers = customersRes.data;
        const quotes = quotesRes.data;

        // Calculate dynamic values
        // Parse ARR strings like "$120,000" or "₹85,00,000" or "د.إ250,000" to USD approximation
        let totalArrCalculated = 0;
        customers.forEach(c => {
          if (!c.arr) return;
          const val = parseFloat(c.arr.replace(/[^0-9.]/g, '')) || 0;
          if (c.arr.includes('₹')) {
            totalArrCalculated += val / 83; // approx INR to USD
          } else if (c.arr.includes('د.إ') || c.arr.includes('AED')) {
            totalArrCalculated += val / 3.67; // approx AED to USD
          } else if (c.arr.includes('£') || c.arr.includes('GBP')) {
            totalArrCalculated += val * 1.25; // approx GBP to USD
          } else {
            totalArrCalculated += val; // USD
          }
        });

        const activeDeals = quotes.filter(q => q.status === 'Pending Approval' || q.status === 'Approved' || q.status === 'Sent for Signature').length;
        const totalCust = customers.length;
        
        // Sales statistics
        const myQuotes = quotes.filter(q => q.createdBy?._id === user._id || q.createdBy === user._id);
        const myPending = myQuotes.filter(q => q.status === 'Sent for Signature' || q.status === 'Pending Approval').length;
        const mySigned = myQuotes.filter(q => q.status === 'Active' || q.status === 'Approved' || q.status === 'Customer Signed' || q.status === 'Completed' || q.status === 'Signed').length;
        const mySignedVal = myQuotes.filter(q => q.status === 'Active' || q.status === 'Approved' || q.status === 'Customer Signed' || q.status === 'Completed' || q.status === 'Signed').reduce((acc, q) => acc + (q.value || 0), 0);

        // Product mix calculation from quotes
        let gwsCount = 0;
        let gcpCount = 0;
        quotes.forEach(q => {
          q.skus?.forEach(s => {
            if (s.name?.toUpperCase().includes('WORKSPACE') || s.name?.toUpperCase().includes('GWS')) gwsCount += s.qty || 1;
            if (s.name?.toUpperCase().includes('CLOUD') || s.name?.toUpperCase().includes('GCP')) gcpCount += s.qty || 1;
          });
        });
        const totalProducts = gwsCount + gcpCount || 1;
        const productMixCalculated = [
          Math.round((gwsCount / totalProducts) * 100) || 65,
          Math.round((gcpCount / totalProducts) * 100) || 35
        ];

        setStats({
          totalArr: totalArrCalculated > 0 ? totalArrCalculated : 4250000,
          activePipeline: activeDeals > 0 ? activeDeals : 48,
          totalCustomers: totalCust > 0 ? totalCust : 142,
          monthlyDocs: myQuotes.length > 0 ? myQuotes.length : 24,
          pendingSignature: myQuotes.length > 0 ? myPending : 8,
          contractsSigned: myQuotes.length > 0 ? mySigned : 11,
          signedValue: mySignedVal > 0 ? mySignedVal : 142000,
          productMix: productMixCalculated,
          revenueData: [180, 210, 240, 235, 260, 280] // static trend or can be computed if historical data is available
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        // Fallback to static mock stats if server API fails (e.g. initial setup)
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const isAdminOrManager = user.role === 'Admin' || user.role === 'Manager';

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p className="animate-pulse font-bold text-slate-500">Retrieving operational telemetry...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {isAdminOrManager ? (
        // ADMIN / MANAGER DASHBOARD: "Mission Control"
        <>
          <div className="section-header">
            <div>
              <h1 className="section-title">Mission Control</h1>
              <p className="section-sub">Overview of Econz Revenue Operations</p>
            </div>
            <button className="btn-secondary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Last 30 Days
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid-3">
            <div className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div className="icon-box dark:bg-emerald-500/10 dark:text-emerald-400" style={{ background: 'var(--brand-50)', color: 'var(--brand-500)' }}>
                  <DollarSign size={24} />
                </div>
                <span className="badge badge-green">+18.2%</span>
              </div>
              <h3 style={{ color: 'var(--slate-400)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Total ARR
              </h3>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em' }} className="dark:text-white">
                ${(stats.totalArr / 1000000).toFixed(2)}M
              </h2>
            </div>

            <div className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div className="icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--indigo-500)' }}>
                  <Briefcase size={24} />
                </div>
              </div>
              <h3 style={{ color: 'var(--slate-400)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Active Pipeline
              </h3>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em' }} className="dark:text-white">
                {stats.activePipeline} Deals
              </h2>
            </div>

            <div className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div className="icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <Users size={24} />
                </div>
              </div>
              <h3 style={{ color: 'var(--slate-400)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Total Customers
              </h3>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em' }} className="dark:text-white">
                {stats.totalCustomers}
              </h2>
            </div>
          </div>

          {/* Charts Row — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', width: '100%', minWidth: 0 }}>
            <div className="card card-p" style={{ minHeight: '360px', minWidth: 0 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                Revenue Growth
              </h3>
              <div style={{ height: '260px', position: 'relative', width: '100%', overflow: 'hidden' }}>
                <RevenueChart data={stats.revenueData} />
              </div>
            </div>
            <div className="card card-p" style={{ minHeight: '360px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                Product Mix
              </h3>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', overflow: 'hidden' }}>
                <DonutChart data={stats.productMix} />
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800 }} className="text-brand">{stats.productMix[0]}%</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>GWS Mix</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', flexShrink: 0 }}></span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GWS ({stats.productMix[0]}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }}></span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GCP ({stats.productMix[1]}%)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // SALES DASHBOARD: "Sales Cockpit"
        <>
          <div className="section-header">
            <div>
              <h1 className="section-title">Sales Cockpit</h1>
              <p className="section-sub">Manage your deals and performance</p>
            </div>
          </div>

          <div className="grid-3">
            {/* Sales Profile Card */}
            <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8rem', background: 'linear-gradient(to bottom right, var(--brand-900), var(--brand-700))' }}></div>
              <div style={{
                height: '6rem', width: '6rem', borderRadius: '1.5rem', background: 'white', padding: '0.375rem', boxShadow: 'var(--shadow-lg)',
                marginBottom: '1rem', marginTop: '3.5rem', position: 'relative', zIndex: 10
              }} className="dark:bg-slate-800">
                <div style={{ height: '100%', width: '100%', background: 'var(--slate-50)', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-400)' }} className="dark:bg-slate-700 dark:text-slate-300">
                  {user.name ? user.name.split(' ').map(x => x.charAt(0)).join('').toUpperCase() : 'LS'}
                </div>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }} className="dark:text-white">{user.name}</h2>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--brand-600)', marginBottom: '1.5rem' }} className="dark:text-brand-400">Google Cloud Sales Specialist</p>
              
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'var(--slate-50)', borderRadius: '1.25rem' }} className="dark:bg-slate-900/50">
                  <Mail size={16} style={{ marginRight: '0.75rem', color: 'var(--slate-400)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-600)' }} className="dark:text-slate-300 truncate">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Sales Stats Box 1 */}
            <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Monthly Documents
                </p>
                <h3 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '1rem' }} className="dark:text-white">
                  {stats.monthlyDocs}
                </h3>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#f97316', background: 'rgba(249, 115, 22, 0.1)', width: 'fit-content', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                {stats.pendingSignature} Pending Signature
              </div>
            </div>

            {/* Sales Stats Box 2 */}
            <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contracts Signed
                </p>
                <h3 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '1rem' }} className="dark:text-white">
                  {stats.contractsSigned}
                </h3>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', width: 'fit-content', padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
                ${(stats.signedValue / 1000).toFixed(0)}k Value
              </div>
            </div>
          </div>

          {/* Quick Create Quote Form CTA */}
          <div style={{
            background: 'var(--brand-900)',
            padding: '2.5rem',
            borderRadius: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create New Order Form</h3>
              <p style={{ color: 'var(--brand-200)', fontSize: '0.875rem', fontWeight: 500 }}>Generate a unified contract for a new prospect.</p>
            </div>
            <button 
              onClick={() => navigate('/create-order')} 
              className="btn-secondary" 
              style={{
                position: 'relative', zIndex: 10,
                background: 'white', color: 'var(--brand-900)',
                padding: '1rem 2rem', borderRadius: '1rem',
                fontWeight: 700, display: 'flex', alignItems: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'pointer'
              }}
            >
              <Plus size={20} style={{ marginRight: '0.5rem' }} />
              Start Wizard
            </button>
            <div style={{ position: 'absolute', right: 0, bottom: 0, width: '16rem', height: '16rem', background: 'rgba(14, 165, 233, 0.2)', borderRadius: '50%', filter: 'blur(40px)', margin: '-2.5rem -2.5rem 0 0' }}></div>
          </div>
        </>
      )}
    </div>
  );
}
