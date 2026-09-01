import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, ArrowRight, Globe } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@econz.cloud');
  const [password, setPassword] = useState('password');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', true);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      showToast('Successfully entered orbit!');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid login credentials', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (roleEmail) => {
    if (isSubmitting) return;

    setEmail(roleEmail);
    setPassword('password');
    setIsSubmitting(true);

    try {
      await login(roleEmail, 'password');
      showToast('Successfully entered orbit!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message;
      if (!err.response) {
        showToast('Cannot reach server. Start the API on port 5000.', true);
      } else {
        showToast(message || 'Demo login failed. Run database seed if users are missing.', true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Dark/Light mode toggle */}
      <button 
        onClick={toggle}
        className="theme-toggle-btn"
        title="Toggle Dark Mode"
      >
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Grid Pattern and Glow Effects */}
      <div className="bg-grid-pattern" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}></div>
      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>

      {/* 3D Orbiting Planets Animation */}
      <div className="orbit-container">
        {/* Ring 1 - Cyan */}
        <div className="orbit-plane" style={{ width: '500px', height: '500px' }}>
          <div className="orbit-ring-el orbit-ring-1" style={{ animation: 'spinOrbit 15s linear infinite' }}>
            <div className="orbit-planet" style={{
              top: '0', left: '50%', transform: 'translate(-50%, -50%)',
              width: '24px', height: '24px',
              background: 'radial-gradient(circle at 30% 30%, #a5f3fc 0%, #06b6d4 40%, #164e63 80%, #083344 100%)',
              boxShadow: '0 0 25px #06b6d4, inset -2px -2px 5px rgba(0,0,0,0.5), inset 2px 2px 5px rgba(255,255,255,0.4)'
            }}></div>
          </div>
        </div>

        {/* Ring 2 - Indigo */}
        <div className="orbit-plane" style={{ width: '800px', height: '800px' }}>
          <div className="orbit-ring-el orbit-ring-2" style={{ animation: 'spinReverse 30s linear infinite' }}>
            <div className="orbit-planet" style={{
              bottom: '14.6%', right: '14.6%', transform: 'translate(50%, 50%)',
              width: '32px', height: '32px',
              background: 'radial-gradient(circle at 30% 30%, #c7d2fe 0%, #4f46e5 40%, #312e81 80%, #1e1b4b 100%)',
              boxShadow: '0 0 35px #4f46e5, inset -2px -2px 6px rgba(0,0,0,0.6), inset 2px 2px 6px rgba(255,255,255,0.4)'
            }}></div>
          </div>
        </div>

        {/* Ring 3 - Purple */}
        <div className="orbit-plane" style={{ width: '1200px', height: '1200px' }}>
          <div className="orbit-ring-el orbit-ring-3" style={{ animation: 'spinOrbit 45s linear infinite' }}>
            <div className="orbit-planet" style={{
              top: '50%', left: '0', transform: 'translate(-50%, -50%)',
              width: '20px', height: '20px',
              background: 'radial-gradient(circle at 30% 30%, #e9d5ff 0%, #9333ea 40%, #581c87 80%, #3b0764 100%)',
              boxShadow: '0 0 20px #9333ea, inset -2px -2px 4px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.4)'
            }}></div>
          </div>
        </div>
      </div>

      {/* Orbit Logo & Title header block */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '1.5rem',
        flexShrink: 0
      }}>
        {/* Globe circular container */}
        <div className="glass-panel-login" style={{
          height: '6rem', width: '6rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 20px 50px -12px rgba(14,165,233,0.3)', marginBottom: '1.5rem', position: 'relative',
          transition: 'transform 0.5s', borderRadius: '2rem'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom right, rgba(2, 132, 199, 0.1), transparent)',
            borderRadius: '2rem'
          }}></div>
          <Globe size={48} className="text-brand" style={{ position: 'relative', zIndex: 10 }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: dark ? 'white' : 'var(--slate-900)',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          lineHeight: 1.1
        }}>
          econz <span style={{
            color: 'var(--text-accent)'
          }}>orbit</span>
        </h1>
        
        {/* Subtitle */}
        <p style={{
          color: dark ? 'rgba(186, 230, 253, 0.6)' : 'var(--slate-500)',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          marginTop: '0.75rem'
        }}>
          Cloud Promise Delivered
        </p>
      </div>

      {/* Login Card Panel */}
      <div className="glass-panel-login" style={{
        padding: '2.5rem 2rem',
        borderRadius: '2.5rem',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 10,
        margin: '0 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        flexShrink: 0
      }}>
        {/* Inputs Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label className="field-label" style={{ margin: '0 0 0 0.25rem' }}>Work Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label className="field-label" style={{ margin: '0 0 0 0.25rem' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary"
            style={{ 
              marginTop: '0.5rem',
              padding: '1rem', 
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--brand-600), var(--violet-500))',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-xl)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>{isSubmitting ? 'Entering Orbit...' : 'Enter Orbit'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo role quick-login */}
        <div style={{
          marginTop: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Demo login
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDemoLogin('admin@econz.cloud')}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              Admin
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDemoLogin('manager@econz.cloud')}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              Manager
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDemoLogin('sales@econz.cloud')}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
