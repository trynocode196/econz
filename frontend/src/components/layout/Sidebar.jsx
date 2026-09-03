import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import EconzLogo from '../EconzLogo';
import NotificationBell from '../notifications/NotificationBell';
import { 
  PieChart, 
  PlusCircle, 
  FileText, 
  Users, 
  Tag, 
  Layout, 
  Shield, 
  Home, 
  List, 
  Sun, 
  Moon, 
  LogOut,
  Globe,
  Layers,
  Headset,
  Kanban,
  UserPlus,
  Settings,
  FileCheck
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  // Determine navigation items based on role
  const getNavItems = () => {
    const role = user.role;
    if (role === 'Admin') {
      return [
        { to: '/dashboard', label: 'DASHBOARD', icon: Globe },
        { to: '/create-order', label: 'CREATE ORDER', icon: PlusCircle },
        { to: '/quotes', label: 'DOCUMENTS', icon: FileText },
        { to: '/crm', label: 'CRM', icon: Kanban },
        { to: '/customers', label: 'CUSTOMERS', icon: Users },
        { to: '/products', label: 'PRODUCT CATALOG', icon: Tag },
        { to: '/margin', label: 'MARGIN', icon: Layers },
        { to: '/documents-deal', label: 'DOCUMENTS DEAL', icon: FileText },
        { to: '/nda', label: 'NDA', icon: FileCheck },
        { to: '/teams', label: 'TEAMS', icon: Shield },
        { to: '/agents', label: 'AGENTS', icon: Headset },
      ];
    } else if (role === 'Manager') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: PieChart },
        { to: '/create-order', label: 'Create Order', icon: PlusCircle },
        { to: '/crm', label: 'CRM Leads & Deals', icon: Kanban },
        { to: '/quotes', label: 'Team Documents', icon: FileText },
        { to: '/nda', label: 'NDA', icon: FileCheck },
        { to: '/customers', label: 'Customers', icon: Users },
      ];
    } else {
      // Sales
      return [
        { to: '/dashboard', label: 'Dashboard', icon: Home },
        { to: '/create-order', label: 'Create Order', icon: PlusCircle },
        { to: '/crm', label: 'CRM Leads & Deals', icon: Kanban },
        { to: '/customers', label: 'Customers', icon: List },
        { to: '/quotes', label: 'My Documents', icon: FileText },
        { to: '/nda', label: 'NDA', icon: FileCheck },
      ];
    }
  };

  const navItems = getNavItems();
  const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  const roleText = user.role || 'Admin';

  return (
    <aside className="app-sidebar">
      <div className="sidebar-glow"></div>
      
      {/* Brand Header with Econz Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ background: 'transparent', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EconzLogo size={28} />
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight block text-white">Orbit</span>
          <span className="text-[10px] font-bold text-brand-200 uppercase tracking-widest">Econz Cloud</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      
      {/* User Card & Logout Footer */}
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.75rem 0.85rem 2rem 0.85rem' }}>
        {/* User Profile Pill matching requested layout */}
        <div 
          className="user-card" 
          style={{ 
            padding: '0.625rem 0.75rem', 
            borderRadius: '1rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name} 
              style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.65rem', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => navigate('/settings')}
            />
          ) : (
            <div 
              className="user-avatar" 
              style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.65rem', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => navigate('/settings')}
            >
              {avatarLetter}
            </div>
          )}
          
          <div className="flex-1 min-w-0" style={{ cursor: 'pointer' }} onClick={() => navigate('/settings')}>
            <p className="text-sm font-bold text-white truncate" style={{ lineHeight: 1.2 }}>
              {user.name || 'User'}
            </p>
            <p className="text-[11px] font-medium text-sky-400 truncate" style={{ marginTop: '0.15rem', opacity: 0.9 }}>
              {roleText}
            </p>
          </div>

          <NotificationBell placement="sidebar" />

          <button 
            type="button"
            onClick={() => navigate('/settings')} 
            title="My Settings"
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            className="hover:text-white hover:bg-white/10"
          >
            <Settings size={15} />
          </button>
        </div>

        {/* Dedicated Sidebar Log Out Button */}
        <button
          type="button"
          onClick={logout}
          className="nav-btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '0.75rem',
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: '0.06em',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
            e.currentTarget.style.color = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#f87171';
          }}
        >
          <LogOut size={15} />
          <span>LOG OUT</span>
        </button>
      </div>
    </aside>
  );
}
