import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import EconzLogo from '../components/EconzLogo';
import {
  UserPlus,
  UserCheck,
  Briefcase,
  Mail,
  Building,
  Globe,
  Loader2,
  ArrowLeft,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function AdminSignup() {
  const { setSession } = useAuth();
  const { showToast } = useToast();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Admin');
  const [entity, setEntity] = useState('India');
  const [designation, setDesignation] = useState('System Administrator');
  const [reportingManagerId, setReportingManagerId] = useState('');

  const [managers, setManagers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch managers for Sales assignment
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await api.get('/auth/managers');
        if (Array.isArray(res.data)) {
          setManagers(res.data);
          if (res.data.length > 0 && !reportingManagerId) {
            setReportingManagerId(res.data[0]._id);
          }
        }
      } catch (err) {
        console.warn('Could not load managers:', err.message);
      }
    };

    fetchManagers();
  }, []);

  // Update default designation when role changes
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'Admin') {
      setDesignation('System Administrator');
    } else if (newRole === 'Manager') {
      setDesignation('Cloud Solutions Delivery Lead');
    } else if (newRole === 'Sales') {
      setDesignation('Cloud Solutions Specialist');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      showToast('Please enter full name', true);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid Google Workspace email address', true);
      return;
    }

    if (role === 'Sales' && !reportingManagerId && managers.length > 0) {
      showToast('Please select an assigned Reporting Manager for this Sales representative', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        entity,
        designation: designation.trim(),
        reportingManagerId: role === 'Sales' ? reportingManagerId : undefined
      };

      const res = await api.post('/auth/admin/signup', payload);
      
      // Auto-set 12-hour session
      if (res.data?.token && res.data?.user) {
        setSession(res.data.token, res.data.user);
      }

      showToast(res.data?.message || 'Account created successfully!');
      
      // Redirect directly to dashboard without asking
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user account', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-bg" style={{ minHeight: '100vh', padding: '2rem 1rem', overflowY: 'auto' }}>
      {/* Theme Toggle */}
      <button 
        onClick={toggle} 
        className="theme-toggle-btn" 
        title="Toggle Dark Mode"
        style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 50 }}
      >
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Grid Pattern and Glow Effects */}
      <div className="bg-grid-pattern" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}></div>
      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>

      <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Top Header Logo */}
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div className="glass-panel-login" style={{
            height: '5rem', width: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '1.5rem', marginBottom: '0.85rem', padding: '0.65rem',
            boxShadow: '0 20px 40px -10px rgba(14,165,233,0.3)'
          }}>
            <EconzLogo size={46} />
          </div>

          <h1 style={{
            fontSize: '2.1rem',
            fontWeight: 800,
            color: dark ? 'white' : 'var(--slate-900)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>
            econz <span style={{ color: 'var(--text-accent)' }}>orbit</span>
          </h1>
          <p style={{
            color: dark ? 'rgba(186, 230, 253, 0.7)' : 'var(--slate-500)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            marginTop: '0.35rem'
          }}>
            Create User Account
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="glass-panel-login" style={{
          padding: '2.25rem 2rem',
          borderRadius: '2rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.08)'
        }}>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Full Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Srikar M"
                  required
                  className="login-input"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
                <UserCheck size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Google Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Google Workspace Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@econz.net"
                  required
                  className="login-input"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Role & Entity Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Role Level <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="login-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Manager">Manager (Team Access)</option>
                  <option value="Sales">Sales (Sales Representative)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Operating Entity <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="login-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <option value="India">India (Econz IT Services Pvt Ltd)</option>
                  <option value="UAE">UAE (Econz IT Cloud Service L.L.C)</option>
                  <option value="UK">United Kingdom (UK)</option>
                  <option value="US">United States (US)</option>
                  <option value="Global">Global</option>
                </select>
              </div>
            </div>

            {/* Job Title / Designation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Designation / Job Title
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. System Administrator"
                  className="login-input"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
                <Briefcase size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Conditional Manager Assignment (when Role === Sales) */}
            {role === 'Sales' && (
              <div style={{
                padding: '1rem',
                borderRadius: '1rem',
                background: 'rgba(2, 132, 199, 0.06)',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Assigned Reporting Manager <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={reportingManagerId}
                  onChange={(e) => setReportingManagerId(e.target.value)}
                  className="login-input"
                  style={{ width: '100%', cursor: 'pointer', background: 'var(--surface-1)' }}
                >
                  {managers.length === 0 ? (
                    <option value="">No active managers found</option>
                  ) : (
                    managers.map((mgr) => (
                      <option key={mgr._id} value={mgr._id}>
                        {mgr.name} ({mgr.email}) · {mgr.role}
                      </option>
                    ))
                  )}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Quotes and orders created by this sales user will be visible to the selected manager.
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                marginTop: '0.5rem',
                padding: '0.9rem',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--brand-600), var(--violet-500))',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.75 : 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 25px -5px rgba(2,132,199,0.4)'
              }}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account & Enter Orbit'}</span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>

            {/* Bottom SSO Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>12-Hour Active Session Granted</span>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
