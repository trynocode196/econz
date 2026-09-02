import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, ArrowRight, Globe, Lock, Mail, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('admin@econz.cloud');
  const [password, setPassword] = useState('password');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, user } = useAuth();
  const { showToast } = useToast();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Load Google Identity Services SDK
  useEffect(() => {
    const loadGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        initializeGSI();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGSI;
      document.body.appendChild(script);
    };

    const initializeGSI = async () => {
      try {
        let clientId = '171082207472-qotdfg7ul94pmk94gshds124.apps.googleusercontent.com';
        try {
          const cfgRes = await api.get('/auth/google/config');
          if (cfgRes.data?.clientId) clientId = cfgRes.data.clientId;
        } catch (e) {
          // fallback
        }

        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              if (response.credential) {
                try {
                  setGoogleLoading(true);
                  await loginWithGoogle({ credential: response.credential });
                  showToast('Google authentication successful! Entered orbit.');
                  navigate('/dashboard');
                } catch (err) {
                  showToast(err.response?.data?.message || 'Google authentication failed', true);
                } finally {
                  setGoogleLoading(false);
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error initializing Google Sign-In:', err);
      }
    };

    loadGoogleGSI();
  }, [loginWithGoogle, navigate, showToast]);

  const handleGoogleCustomClick = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);

    try {
      let clientId = '171082207472-qotdfg7ul94pmk94gshds124.apps.googleusercontent.com';
      try {
        const cfgRes = await api.get('/auth/google/config');
        if (cfgRes.data?.clientId) clientId = cfgRes.data.clientId;
      } catch (e) {}

      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile https://www.googleapis.com/auth/documents.readonly',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                await loginWithGoogle({ accessToken: tokenResponse.access_token });
                showToast('Google authentication successful! Entered orbit.');
                navigate('/dashboard');
              } catch (err) {
                showToast(err.response?.data?.message || 'Google authentication failed', true);
              } finally {
                setGoogleLoading(false);
              }
            } else {
              setGoogleLoading(false);
            }
          },
          error_callback: () => {
            setGoogleLoading(false);
            showToast('Google Sign-In was cancelled or popup blocked', true);
          }
        });
        client.requestAccessToken();
      } else if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt();
        setGoogleLoading(false);
      } else {
        // Fallback standard Google OAuth window
        const redirect = `${window.location.origin}/dashboard`;
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=token&scope=${encodeURIComponent('openid email profile https://www.googleapis.com/auth/documents.readonly')}`;
        window.location.href = authUrl;
      }
    } catch (err) {
      showToast('Could not initialize Google authentication', true);
      setGoogleLoading(false);
    }
  };

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
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '1rem',
        flexShrink: 0
      }}>
        {/* Globe circular container */}
        <div className="glass-panel-login" style={{
          height: '5.5rem', width: '5.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 20px 50px -12px rgba(14,165,233,0.3)', marginBottom: '1.25rem', position: 'relative',
          transition: 'transform 0.5s', borderRadius: '1.75rem'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom right, rgba(2, 132, 199, 0.1), transparent)',
            borderRadius: '1.75rem'
          }}></div>
          <Globe size={42} className="text-brand" style={{ position: 'relative', zIndex: 10 }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: dark ? 'white' : 'var(--slate-900)',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          lineHeight: 1.1
        }}>
          econz <span style={{ color: 'var(--text-accent)' }}>orbit</span>
        </h1>
        
        {/* Subtitle */}
        <p style={{
          color: dark ? 'rgba(186, 230, 253, 0.6)' : 'var(--slate-500)',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          marginTop: '0.5rem'
        }}>
          Cloud Promise Delivered
        </p>
      </div>

      {/* Login Card Panel */}
      <div className="glass-panel-login" style={{
        padding: '2.25rem 2rem',
        borderRadius: '2rem',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 10,
        margin: '0 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        flexShrink: 0
      }}>

        {/* Google OAuth Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleCustomClick}
            disabled={googleLoading || isSubmitting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              background: dark ? '#1e293b' : '#ffffff',
              color: dark ? '#ffffff' : '#1e293b',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease'
            }}
            className="hover:scale-[1.01] active:scale-[0.99]"
          >
            {/* Google Colorful G Icon */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            <span>{googleLoading ? 'Connecting Google API...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle, #e2e8f0)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase' }}>or sign in with password</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle, #e2e8f0)' }}></div>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label className="field-label" style={{ margin: '0 0 0 0.25rem' }}>Work Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="user@econz.cloud"
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
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary"
            style={{ 
              marginTop: '0.5rem',
              padding: '0.85rem', 
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
          marginTop: '0.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Demo Quick-Login
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDemoLogin('admin@econz.cloud')}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.85rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              Admin
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDemoLogin('manager@econz.cloud')}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.85rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              Manager
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDemoLogin('sales@econz.cloud')}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.85rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
