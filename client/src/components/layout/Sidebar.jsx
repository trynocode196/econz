import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  Headset
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  if (!user) return null;

  // Determine navigation items based on role
  const getNavItems = () => {
    const role = user.role;
    if (role === 'Admin') {
      return [
        { to: '/dashboard', label: 'DASHBOARD', icon: Globe },
        { to: '/create-order', label: 'CREATE ORDER', icon: PlusCircle },
        { to: '/quotes', label: 'DOCUMENTS', icon: FileText },
        { to: '/customers', label: 'CUSTOMERS', icon: Users },
        { to: '/products', label: 'PRODUCT CATALOG', icon: Tag },
        { to: '/margin', label: 'MARGIN', icon: Layers },
        { to: '/documents-deal', label: 'DOCUMENTS DEAL', icon: FileText },
        { to: '/teams', label: 'TEAMS', icon: Shield },
        { to: '/agents', label: 'AGENTS', icon: Headset },
      ];
    } else if (role === 'Manager') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: PieChart },
        { to: '/create-order', label: 'Create Order', icon: PlusCircle },
        { to: '/quotes', label: 'Team Documents', icon: FileText },
        { to: '/customers', label: 'Customers', icon: Users },
      ];
    } else {
      // Sales
      return [
        { to: '/dashboard', label: 'Dashboard', icon: Home },
        { to: '/create-order', label: 'Create Order', icon: PlusCircle },
        { to: '/customers', label: 'Customers', icon: List },
        { to: '/quotes', label: 'My Documents', icon: FileText },
      ];
    }
  };

  const navItems = getNavItems();
  const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  const displayName = user.name && user.name.length > 10 
    ? user.name.slice(0, 10) + '...' 
    : user.name || '';

  return (
    <aside className="app-sidebar">
      <div className="sidebar-glow"></div>
      
      {/* Brand Header */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Globe size={20} />
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
      
      {/* User Card Footer */}
      <div className="sidebar-footer">
        <div className="user-card" style={{ padding: '0.75rem 0.625rem', gap: '0.5rem' }}>
          <div className="user-avatar">{avatarLetter}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate" title={user.name}>{displayName}</p>
            <p className="text-[10px] uppercase font-bold text-brand-200 truncate">{user.role}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center', flexShrink: 0 }}>
            <button 
              onClick={toggle} 
              className="btn-ghost" 
              style={{ color: 'var(--brand-200)', padding: '0.25rem' }} 
              title="Toggle Dark Mode"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={logout} 
              className="btn-ghost" 
              style={{ color: 'var(--brand-200)', padding: '0.25rem' }} 
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
