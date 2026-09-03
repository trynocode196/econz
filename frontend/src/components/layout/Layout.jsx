import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import NotificationBell from '../notifications/NotificationBell';

export default function Layout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-0)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          fontSize: '1.25rem', fontWeight: 800,
          color: 'var(--text-primary)',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          Econz Orbit
        </div>
        <div style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: 'var(--text-muted)',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>

      {/* Mobile overlay — only visible on mobile when open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar — single instance, CSS controls visibility */}
      <div className="desktop-sidebar-wrapper">
        <Sidebar />
      </div>

      {/* Mobile sidebar — separate fixed panel, only rendered when open */}
      {sidebarOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 100, display: 'flex'
        }}>
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className="app-main">
        {/* Mobile-only top bar */}
        <header className="app-header">
          <span style={{
            fontWeight: 800, fontSize: '1rem',
            color: 'var(--text-primary)',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            Econz Orbit
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <NotificationBell placement="header" />
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', padding: '0.5rem',
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center'
              }}
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <main className="main-scroll fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
