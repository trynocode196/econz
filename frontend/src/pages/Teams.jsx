import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import GuideButton from '../components/common/GuideButton';
import SectionGuideModal from '../components/common/SectionGuideModal';
import { SECTION_GUIDES } from '../data/guidesData';
import { 
  SquarePen, 
  Trash2, 
  Plus, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  User,
  Mail,
  Phone,
  Check
} from 'lucide-react';

const ACCESS_LEVEL_OPTIONS = [
  'Sales Team',
  'Finance Team',
  'Technical Team',
  'Revenue Operation Team',
  'Customer Success Team',
  'Marketing Team',
  'Legal Team',
  'Engineering Team',
  'Operations Team'
];

const ROLE_OPTIONS = [
  'Manager',
  'User',
  'Customer',
  'Sales'
];

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' }
];

export default function Teams() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('Manager');
  const [designation, setDesignation] = useState('Customer Success Account Management Team');
  const [status, setStatus] = useState('Active');
  const [accessLevels, setAccessLevels] = useState(['Sales Team', 'Technical Team']);
  const [reportingManagers, setReportingManagers] = useState([]);
  const [managerSearch, setManagerSearch] = useState('');
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);

  // Scroll ref for horizontal chips
  const accessLevelScrollRef = useRef(null);
  const reportingManagerScrollRef = useRef(null);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setTeamMembers(res.data);
    } catch (err) {
      showToast('Error loading team members', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Open Edit Modal
  const handleOpenEdit = (member) => {
    setIsCreatingNew(false);
    setSelectedMember(member);
    setFullName(member.name || '');
    setEmailId(member.email || '');

    // Parse phone number into country code and number
    let rawPhone = member.phone || '';
    let foundCode = '+91';
    let rawNumber = rawPhone;
    for (const c of COUNTRY_CODES) {
      if (rawPhone.startsWith(c.code)) {
        foundCode = c.code;
        rawNumber = rawPhone.slice(c.code.length).trim();
        break;
      }
    }
    setCountryCode(foundCode);
    setPhoneNumber(rawNumber);
    setRole(member.role || 'Manager');
    setDesignation(member.designation || 'Customer Success Account Management Team');
    setStatus(member.status || 'Active');
    setAccessLevels(member.accessLevels && member.accessLevels.length > 0 ? member.accessLevels : ['Sales Team']);
    setReportingManagers(member.reportingManagers || []);
    setManagerSearch('');
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsCreatingNew(true);
    setSelectedMember(null);
    setFullName('');
    setEmailId('');
    setCountryCode('+91');
    setPhoneNumber('');
    setRole('Manager');
    setDesignation('Customer Success Account Management Team');
    setStatus('Active');
    setAccessLevels(['Sales Team', 'Technical Team']);
    setReportingManagers([]);
    setManagerSearch('');
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  // Close modals
  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedMember(null);
    setShowManagerDropdown(false);
  };

  // Toggle Access Level chip
  const toggleAccessLevel = (item) => {
    if (accessLevels.includes(item)) {
      setAccessLevels(accessLevels.filter(x => x !== item));
    } else {
      setAccessLevels([...accessLevels, item]);
    }
  };

  // Scroll helper
  const scrollContainer = (ref, offset) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Add reporting manager
  const addReportingManager = (user) => {
    if (!reportingManagers.some(m => m.id === user._id || m.email === user.email)) {
      setReportingManagers([...reportingManagers, { id: user._id, name: user.name, email: user.email }]);
    }
    setManagerSearch('');
    setShowManagerDropdown(false);
  };

  // Remove reporting manager
  const removeReportingManager = (email) => {
    setReportingManagers(reportingManagers.filter(m => m.email !== email));
  };

  // Save / Update Team Member
  const handleSubmitMember = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !emailId.trim()) {
      showToast('Please fill in required fields', true);
      return;
    }

    const fullPhoneNumber = phoneNumber.trim() 
      ? (phoneNumber.startsWith('+') ? phoneNumber.trim() : `${countryCode}${phoneNumber.trim()}`)
      : '';

    const payload = {
      name: fullName.trim(),
      email: emailId.trim().toLowerCase(),
      phone: fullPhoneNumber,
      role,
      designation: designation.trim() || 'Customer Success Account Management Team',
      status,
      accessLevels,
      reportingManagers
    };

    try {
      if (isCreatingNew) {
        payload.password = 'password';
        const res = await api.post('/users', payload);
        setTeamMembers(prev => [res.data, ...prev]);
        showToast('Team member added successfully');
      } else {
        const res = await api.put(`/users/${selectedMember._id}`, payload);
        setTeamMembers(prev => prev.map(m => m._id === selectedMember._id ? res.data : m));
        showToast('Team member updated successfully');
      }
      handleCloseModals();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', true);
    }
  };

  // Confirm Delete Member
  const handleConfirmDelete = async () => {
    if (!selectedMember) return;
    try {
      await api.delete(`/users/${selectedMember._id}`);
      setTeamMembers(prev => prev.filter(m => m._id !== selectedMember._id));
      showToast(`User ${selectedMember.name} deleted`);
      handleCloseModals();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', true);
    }
  };

  // Filtered members (excluding Admin role from Team Management)
  const filteredMembers = teamMembers
    .filter(m => m.role !== 'Admin')
    .filter(m => {
      const q = searchQuery.toLowerCase();
      return (
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q))
      );
    });

  // Available managers for autocomplete search
  const availableManagers = teamMembers
    .filter(m => m.role !== 'Admin')
    .filter(m => {
      if (selectedMember && m._id === selectedMember._id) return false;
      if (reportingManagers.some(rm => rm.email === m.email || rm.id === m._id)) return false;
      if (!managerSearch.trim()) return true;
      const q = managerSearch.toLowerCase();
      return (m.name && m.name.toLowerCase().includes(q)) || (m.email && m.email.toLowerCase().includes(q));
    });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
            Team Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Manage access and permissions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <GuideButton onClick={() => setShowGuide(true)} />

          {/* Search bar */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-orbit"
              style={{ paddingLeft: '2.5rem', height: '2.5rem', fontSize: '0.875rem', borderRadius: 'var(--radius-lg)' }}
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ 
        padding: 0, 
        overflow: 'hidden', 
        borderRadius: '1.25rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>USER DETAILS</th>
                <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>CONTRACT</th>
                <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>DESIGNATION</th>
                <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>ROLE</th>
                <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1.15rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', whiteSpace: 'nowrap' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}>⏳</div>
                    Loading team roster...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => {
                  const avatarInitial = member.name ? member.name.charAt(0).toUpperCase() : 'U';
                  const isLastRow = index === filteredMembers.length - 1;

                  return (
                    <tr 
                      key={member._id}
                      style={{ 
                        borderBottom: isLastRow ? 'none' : '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease'
                      }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      {/* USER DETAILS */}
                      <td style={{ padding: '0.85rem 1.15rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', whiteSpace: 'nowrap' }}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '0.75rem',
                            background: '#e0f2fe',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1rem',
                            flexShrink: 0
                          }}>
                            {avatarInitial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem', whiteSpace: 'nowrap' }}>
                              {member.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem', whiteSpace: 'nowrap' }}>
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CONTRACT */}
                      <td style={{ padding: '0.85rem 1.15rem', fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {member.phone || ''}
                      </td>

                      {/* DESIGNATION */}
                      <td style={{ padding: '0.85rem 1.15rem', fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {member.designation || 'Customer Success Account Management Team'}
                      </td>

                      {/* ROLE */}
                      <td style={{ padding: '0.85rem 1.15rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.875rem',
                          borderRadius: '9999px',
                          background: '#f0f9ff',
                          color: '#0284c7',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          border: '1px solid #e0f2fe',
                          whiteSpace: 'nowrap'
                        }}>
                          {member.role || 'Manager'}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td style={{ padding: '0.85rem 1.15rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: member.status === 'Inactive' ? '#94a3b8' : '#10b981',
                            display: 'inline-block'
                          }}></span>
                          <span style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {member.status || 'Active'}
                          </span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: '0.85rem 1.15rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.875rem' }}>
                          <button
                            onClick={() => handleOpenEdit(member)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#0284c7',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '0.375rem',
                              transition: 'transform 0.15s ease'
                            }}
                            title="Edit Team Member"
                          >
                            <SquarePen size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(member)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '0.375rem',
                              transition: 'transform 0.15s ease'
                            }}
                            title="Delete Team Member"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          UPDATE / ADD TEAM MEMBER MODAL (Matching Screenshot 3)
          ========================================================= */}
      {isEditModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={handleCloseModals}
        >
          <div 
            style={{
              background: 'var(--surface-1)',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth: '680px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {isCreatingNew ? 'Add Team Member' : 'Update Team Member'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {isCreatingNew ? 'Set Access Credentials' : 'Update Access Credentials'}
                </p>
              </div>
              <button 
                onClick={handleCloseModals}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitMember} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
              
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.625rem',
                    border: '1px solid var(--border-default)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Email ID & Phone Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Email ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="email" 
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="user@econz.cloud"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      border: '1px solid var(--border-default)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Phone Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border-default)',
                    borderRadius: '0.625rem',
                    background: 'var(--input-bg)',
                    overflow: 'hidden'
                  }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{
                        padding: '0.75rem 0.5rem 0.75rem 0.75rem',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer',
                        borderRight: '1px solid var(--border-subtle)'
                      }}
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input 
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="81234 56789"
                      style={{
                        flex: 1,
                        padding: '0.75rem 0.75rem',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Role <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.625rem',
                    border: '1px solid var(--border-default)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Access Level */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Access Level <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => scrollContainer(accessLevelScrollRef, -150)}
                    style={{
                      position: 'absolute',
                      left: '-10px',
                      zIndex: 2,
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div 
                    ref={accessLevelScrollRef}
                    style={{
                      display: 'flex',
                      gap: '0.625rem',
                      overflowX: 'auto',
                      padding: '0.25rem 1rem',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {ACCESS_LEVEL_OPTIONS.map(level => {
                      const isSelected = accessLevels.includes(level);
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleAccessLevel(level)}
                          style={{
                            whiteSpace: 'nowrap',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: isSelected ? '1.5px solid #0a3656' : '1px solid var(--border-default)',
                            background: isSelected ? '#f0f9ff' : 'var(--surface-1)',
                            color: isSelected ? '#0a3656' : 'var(--text-secondary)'
                          }}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollContainer(accessLevelScrollRef, 150)}
                    style={{
                      position: 'absolute',
                      right: '-10px',
                      zIndex: 2,
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Add Reporting Manager */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Add Reporting Manager <span style={{ color: '#ef4444' }}>*</span>
                </label>
                
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    value={managerSearch}
                    onChange={(e) => {
                      setManagerSearch(e.target.value);
                      setShowManagerDropdown(true);
                    }}
                    onFocus={() => setShowManagerDropdown(true)}
                    placeholder="Start typing..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      border: '1px solid var(--border-default)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      marginBottom: '0.75rem'
                    }}
                  />

                  {/* Autocomplete Dropdown */}
                  {showManagerDropdown && availableManagers.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '3rem',
                      left: 0,
                      right: 0,
                      maxHeight: '180px',
                      overflowY: 'auto',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.625rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      zIndex: 10
                    }}>
                      {availableManagers.map(mgr => (
                        <div
                          key={mgr._id}
                          onClick={() => addReportingManager(mgr)}
                          style={{
                            padding: '0.625rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{mgr.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mgr.email}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>+ Add</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Reporting Managers Pills */}
                {reportingManagers.length > 0 && (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => scrollContainer(reportingManagerScrollRef, -150)}
                      style={{
                        position: 'absolute',
                        left: '-10px',
                        zIndex: 2,
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <div 
                      ref={reportingManagerScrollRef}
                      style={{
                        display: 'flex',
                        gap: '0.625rem',
                        overflowX: 'auto',
                        padding: '0.25rem 1rem',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        width: '100%'
                      }}
                    >
                      {reportingManagers.map(mgr => (
                        <div
                          key={mgr.email}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.875rem',
                            background: '#e0f2fe',
                            borderRadius: '0.5rem',
                            flexShrink: 0
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0c4a6e' }}>{mgr.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>{mgr.email}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeReportingManager(mgr.email)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#0284c7',
                              cursor: 'pointer',
                              padding: '0.125rem'
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollContainer(reportingManagerScrollRef, 150)}
                      style={{
                        position: 'absolute',
                        right: '-10px',
                        zIndex: 2,
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModals}
                  style={{
                    padding: '0.75rem 2.5rem',
                    borderRadius: '0.625rem',
                    border: '1px solid var(--border-default)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.925rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 2.5rem',
                    borderRadius: '0.625rem',
                    border: 'none',
                    background: '#0a3656',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.925rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(10, 54, 86, 0.25)'
                  }}
                >
                  {isCreatingNew ? 'Add Member' : 'Update User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          DELETE CONFIRMATION MODAL (Matching Screenshot 4)
          ========================================================= */}
      {isDeleteModalOpen && selectedMember && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={handleCloseModals}
        >
          <div 
            style={{
              background: 'var(--surface-1)',
              borderRadius: '1.75rem',
              width: '100%',
              maxWidth: '440px',
              padding: '2.5rem 2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Trash Can Graphic */}
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '1.5rem' }}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                {/* Trash can lid & body */}
                <rect x="25" y="32" width="50" height="7" rx="3.5" fill="#f87171" />
                <rect x="40" y="24" width="20" height="6" rx="3" fill="#f87171" />
                <path d="M30 42L35 86C35.5 89 38 92 41 92H59C62 92 64.5 89 65 86L70 42H30Z" fill="#fee2e2" />
                <line x1="44" y1="50" x2="44" y2="80" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="56" y1="50" x2="56" y2="80" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Red Circular Badge with white X */}
                <circle cx="68" cy="74" r="12" fill="#ef4444" />
                <path d="M64 70L72 78M72 70L64 78" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Prompt text */}
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              marginBottom: '2rem',
              maxWidth: '300px'
            }}>
              Are you sure you want to delete this {selectedMember.name}?
            </h3>

            {/* Buttons: No / Yes */}
            <div style={{ display: 'flex', gap: '1.25rem', width: '100%', justifyContent: 'center' }}>
              <button
                onClick={handleCloseModals}
                style={{
                  flex: 1,
                  maxWidth: '140px',
                  padding: '0.75rem 0',
                  borderRadius: '9999px',
                  border: '1.5px solid #0a3656',
                  background: 'transparent',
                  color: '#0a3656',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                No
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  maxWidth: '140px',
                  padding: '0.75rem 0',
                  borderRadius: '9999px',
                  border: 'none',
                  background: '#0a3656',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(10, 54, 86, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                Yes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Step-by-Step Guide Modal */}
      <SectionGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        guide={SECTION_GUIDES.teams}
      />
    </div>
  );
}
