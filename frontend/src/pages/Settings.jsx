import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, COLOR_THEMES } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import SectionGuideModal from '../components/common/SectionGuideModal';
import { SECTION_GUIDES } from '../data/guidesData';
import { 
  User, 
  Settings as SettingsIcon, 
  Pencil, 
  ExternalLink, 
  FileText, 
  X, 
  LogOut, 
  Shield, 
  Upload, 
  Check, 
  Save, 
  Moon, 
  Sun, 
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';

export default function Settings() {
  const { user, login, logout } = useAuth();
  const { 
    dark, 
    toggle, 
    setMode, 
    colorTheme, 
    setColorTheme, 
    customAccent, 
    setCustomAccent, 
    uiScale, 
    setUiScale 
  } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'customization'
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Edit form state
  const [name, setName] = useState(user?.name || '');
  const [designation, setDesignation] = useState(user?.designation || (user?.role === 'Admin' ? 'Senior Developer' : user?.role || ''));
  const [phone, setPhone] = useState(user?.phone || '+91 8960197124');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '8874035001');
  const [entity, setEntity] = useState(user?.entity || 'India');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const userIdShort = user?._id ? user._id.slice(-4) : '1018';
  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  const joinDate = user?.dateOfJoining || 'December 6, 2021';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.put('/auth/profile', {
        name,
        designation,
        phone,
        emergencyContact,
        entity,
        avatar
      });
      // Update local auth storage
      const token = localStorage.getItem('token');
      if (token && res.data.user) {
        login(token, res.data.user);
      }
      showToast('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1080px', margin: '0 auto', width: '100%', paddingBottom: '1rem' }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            My Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Personal info, contact, and documents
          </p>
        </div>

        <button 
          type="button"
          onClick={() => setShowGuide(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.95rem',
            borderRadius: '9999px',
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <HelpCircle size={14} style={{ color: dark ? '#38bdf8' : '#0284c7' }} />
          <span>Guide</span>
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: dark ? 'rgba(15, 23, 42, 0.6)' : 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.875rem',
        padding: '0.25rem',
        gap: '0.25rem',
        width: 'fit-content'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '0.65rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s ease',
            background: activeTab === 'profile' ? (dark ? 'rgba(30, 41, 59, 0.8)' : 'var(--surface-2)') : 'transparent',
            color: activeTab === 'profile' ? '#f97316' : 'var(--text-secondary)'
          }}
        >
          <User size={15} />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customization')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '0.65rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s ease',
            background: activeTab === 'customization' ? (dark ? 'rgba(30, 41, 59, 0.8)' : 'var(--surface-2)') : 'transparent',
            color: activeTab === 'customization' ? '#f97316' : 'var(--text-secondary)'
          }}
        >
          <SettingsIcon size={15} />
          <span>Customization</span>
        </button>
      </div>

      {/* ── TAB 1: PROFILE ── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 1. Main Profile Banner Card */}
          <div 
            style={{
              background: dark ? 'rgba(15, 23, 42, 0.75)' : 'var(--surface-1)',
              borderRadius: '1.25rem',
              border: '1px solid var(--border-subtle)',
              padding: '1.75rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user?.name} 
                  style={{ width: '4.25rem', height: '4.25rem', borderRadius: '1rem', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} 
                />
              ) : (
                <div style={{
                  width: '4.25rem',
                  height: '4.25rem',
                  borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #0284c7, #8b5cf6)',
                  color: '#ffffff',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.3)'
                }}>
                  {avatarLetter}
                </div>
              )}

              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                  {user?.name || 'Amarjeet'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.2rem' }}>
                  {user?.role || 'Admin'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#f97316',
                    fontFamily: 'monospace',
                    background: 'rgba(249, 115, 22, 0.08)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '0.4rem',
                    border: '1px solid rgba(249, 115, 22, 0.2)'
                  }}>
                    {user?.email || 'amarjeet@trynocode.com'}
                  </span>

                  <span style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    background: dark ? 'rgba(255,255,255,0.04)' : 'var(--surface-2)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '0.4rem',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    ID: {userIdShort}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: dark ? 'rgba(255,255,255,0.05)' : 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Edit Profile"
              className="hover:text-sky-400 hover:border-sky-500/40"
            >
              <Pencil size={17} />
            </button>
          </div>

          {/* 2. Two-Column Information Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }} className="grid-2">
            
            {/* Personal Details */}
            <div style={{
              background: dark ? 'rgba(15, 23, 42, 0.75)' : 'var(--surface-1)',
              borderRadius: '1.25rem',
              border: '1px solid var(--border-subtle)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                PERSONAL DETAILS
              </h3>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Team Location</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {user?.entity || 'India'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date of Joining</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {joinDate}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{
              background: dark ? 'rgba(15, 23, 42, 0.75)' : 'var(--surface-1)',
              borderRadius: '1.25rem',
              border: '1px solid var(--border-subtle)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                CONTACT INFORMATION
              </h3>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Phone Number</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {user?.phone || '+91 8960197124'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Emergency Contact</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {user?.emergencyContact || '8874035001'}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Account Section */}
          <div style={{
            background: dark ? 'rgba(15, 23, 42, 0.75)' : 'var(--surface-1)',
            borderRadius: '1.25rem',
            border: '1px solid var(--border-subtle)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              ACCOUNT
            </h3>

            <div>
              <button
                type="button"
                onClick={logout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.65rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                className="hover:bg-red-500/20"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CUSTOMIZATION (APPEARANCE & THEME) ── */}
      {activeTab === 'customization' && (
        <div style={{
          background: dark ? 'rgba(15, 23, 42, 0.75)' : 'var(--surface-1)',
          borderRadius: '1.25rem',
          border: '1px solid var(--border-subtle)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)'
        }}>
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', border: '2px solid #f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', background: '#f97316' }} />
            </div>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              APPEARANCE & THEME
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }} className="grid-2">
            
            {/* ── LEFT COLUMN: APPEARANCE & UI SCALE ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Appearance Mode */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, marginBottom: '0.85rem' }}>
                  APPEARANCE
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-2">
                  {/* Light Mode Card */}
                  <div
                    onClick={() => setMode('light')}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.875rem',
                      border: !dark ? '2px solid #f97316' : '1px solid var(--border-subtle)',
                      background: !dark ? (dark ? 'rgba(249, 115, 22, 0.08)' : '#ffffff') : (dark ? 'rgba(255,255,255,0.02)' : 'var(--surface-2)'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      boxShadow: !dark ? '0 4px 14px rgba(249, 115, 22, 0.15)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.65rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      flexShrink: 0
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        Light
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Gray canvas · white cards
                      </p>
                    </div>

                    {!dark && (
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        color: '#f97316'
                      }}>
                        <Check size={16} />
                      </div>
                    )}
                  </div>

                  {/* Dark Mode Card */}
                  <div
                    onClick={() => setMode('dark')}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.875rem',
                      border: dark ? '2px solid #f97316' : '1px solid var(--border-subtle)',
                      background: dark ? 'rgba(15, 23, 42, 0.9)' : 'var(--surface-2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      boxShadow: dark ? '0 4px 14px rgba(249, 115, 22, 0.15)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.65rem',
                      background: '#090d16',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      flexShrink: 0
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        Dark
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Deep canvas · lifted cards
                      </p>
                    </div>

                    {dark && (
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        color: '#f97316'
                      }}>
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 600, marginTop: '0.65rem' }}>
                  Quick toggle light / dark
                </p>
              </div>

              {/* UI Scale */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, marginBottom: '0.35rem' }}>
                  UI SCALE
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Scales text, spacing, icons, and layout across the whole app — dashboard, sidebar, tables, and every screen.
                </p>

                {/* Scale Slider Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Scale
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#f97316',
                    background: 'rgba(249, 115, 22, 0.1)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '0.35rem'
                  }}>
                    {uiScale}%
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="80"
                  max="115"
                  step="1"
                  value={uiScale}
                  onChange={(e) => setUiScale(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    accentColor: '#f97316',
                    cursor: 'pointer'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '0.85rem' }}>
                  <span>80%</span>
                  <span>115%</span>
                </div>

                {/* Presets */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { label: 'Compact · 85%', val: 85 },
                    { label: 'Default · 100%', val: 100 },
                    { label: 'Large · 110%', val: 110 }
                  ].map(p => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setUiScale(p.val)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: uiScale === p.val ? '1px solid #f97316' : '1px solid var(--border-subtle)',
                        background: uiScale === p.val ? 'rgba(249, 115, 22, 0.1)' : 'var(--surface-2)',
                        color: uiScale === p.val ? '#f97316' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: COLOR THEME & DYNAMIC ACCENT ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Color Theme Swatches */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, marginBottom: '0.35rem' }}>
                  COLOR THEME
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Backgrounds stay the same. Accents, buttons, and active states update across the app.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem'
                }}>
                  {COLOR_THEMES.map(themeItem => {
                    const isSelected = colorTheme === themeItem.id;
                    return (
                      <div
                        key={themeItem.id}
                        onClick={() => setColorTheme(themeItem.id)}
                        style={{
                          borderRadius: '0.75rem',
                          border: isSelected ? '2px solid #f97316' : '1px solid var(--border-subtle)',
                          background: isSelected ? (dark ? 'rgba(249, 115, 22, 0.08)' : 'rgba(249, 115, 22, 0.04)') : (dark ? 'rgba(255,255,255,0.02)' : 'var(--surface-2)'),
                          padding: '0.85rem 0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '1.75rem',
                          height: '1.75rem',
                          borderRadius: '50%',
                          background: themeItem.hex,
                          boxShadow: `0 2px 8px ${themeItem.hex}60`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>

                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {themeItem.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Custom Color */}
              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, marginBottom: '0.75rem' }}>
                  DYNAMIC COLOR
                </h4>

                <div style={{
                  background: dark ? 'rgba(255,255,255,0.02)' : 'var(--surface-2)',
                  border: colorTheme === 'custom' ? '2px solid #f97316' : '1px solid var(--border-subtle)',
                  borderRadius: '0.875rem',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '0.65rem',
                      background: dark ? 'rgba(255,255,255,0.06)' : 'var(--surface-1)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      <Pencil size={15} />
                    </div>

                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        Custom accent
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        System softens hover, active, and button tints automatically
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => {
                        setCustomAccent(e.target.value);
                        setColorTheme('custom');
                      }}
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'transparent'
                      }}
                    />
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      background: dark ? 'rgba(255,255,255,0.05)' : 'var(--surface-1)',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.35rem'
                    }}>
                      {customAccent}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {isEditingProfile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--surface-1)',
            borderRadius: '1.25rem',
            border: '1px solid var(--border-default)',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Edit Profile Information
              </h3>
              <button 
                onClick={() => setIsEditingProfile(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="field-label field-required">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-orbit"
                  required
                />
              </div>

              <div>
                <label className="field-label">Designation / Title</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="input-orbit"
                  placeholder="Senior Developer"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-2">
                <div>
                  <label className="field-label">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-orbit"
                    placeholder="+91 8960197124"
                  />
                </div>

                <div>
                  <label className="field-label">Emergency Contact</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="input-orbit"
                    placeholder="8874035001"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Team Location / Entity</label>
                <input
                  type="text"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="input-orbit"
                  placeholder="India"
                />
              </div>

              <div>
                <label className="field-label">Avatar Photo URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="input-orbit"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1.15rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.35rem' }}
                >
                  <Save size={15} />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step-by-Step Guide Modal */}
      <SectionGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        guide={SECTION_GUIDES.settings}
      />
    </div>
  );
}
