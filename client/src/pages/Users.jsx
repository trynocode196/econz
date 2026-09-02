import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Plus, 
  Trash2,
  Shield,
  User,
  Mail,
  Phone,
  Briefcase,
  X,
  Key,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  Search,
  Filter,
  UserCheck,
  UserX,
  Building,
  RefreshCw,
  Edit2
} from 'lucide-react';
import PhoneInput from '../components/PhoneInput';

export default function Users() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Form states for adding
  const [newName, setNewName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserDesignation, setNewUserDesignation] = useState('Customer Success Account Management Team');
  const [newUserRole, setNewUserRole] = useState('Sales');
  const [newUserEntity, setNewUserEntity] = useState('India');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newUserStatus, setNewUserStatus] = useState('Active');

  // Form states for editing
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEntity, setEditEntity] = useState('India');
  const [editStatus, setEditStatus] = useState('Active');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      showToast('Error loading users roster', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleOpenAddModal = () => {
    setNewName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserDesignation('Customer Success Account Management Team');
    setNewUserRole('Sales');
    setNewUserEntity('India');
    setNewUserPassword(generateRandomPassword());
    setNewUserStatus('Active');
    setShowPassword(true);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditDesignation(user.designation || 'Customer Success Account Management Team');
    setEditRole(user.role || 'Sales');
    setEditEntity(user.entity || 'India');
    setEditStatus(user.status || 'Active');
    setEditPassword('');
    setShowEditPassword(false);
    setShowEditModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      showToast('Only administrators can create user accounts', true);
      return;
    }

    try {
      const payload = {
        name: newName,
        email: newUserEmail,
        password: newUserPassword || 'password123',
        role: newUserRole,
        entity: newUserEntity,
        designation: newUserDesignation,
        phone: newUserPhone,
        status: newUserStatus
      };

      const res = await api.post('/users', payload);
      setUsers(prev => [res.data, ...prev]);
      showToast('User account created successfully');
      setShowAddModal(false);

      // Show credentials banner so admin can copy immediately
      setCreatedCredentials({
        name: newName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', true);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload = {
        name: editName,
        email: editEmail,
        role: editRole,
        entity: editEntity,
        designation: editDesignation,
        phone: editPhone,
        status: editStatus
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await api.put(`/users/${editingUser._id}`, payload);
      setUsers(prev => prev.map(u => u._id === editingUser._id ? res.data : u));
      showToast('User account updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user', true);
    }
  };

  const handleDeleteUser = async (id, userName) => {
    if (currentUser?.role !== 'Admin') {
      showToast('Only administrators can remove users', true);
      return;
    }

    if (id === currentUser._id) {
      showToast('Cannot delete your own active administrator account', true);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user account: ${userName}?`)) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      showToast(`User ${userName} deleted successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove user', true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Credentials copied to clipboard!');
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.designation && u.designation.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsersCount = users.length;
  const adminCount = users.filter(u => u.role === 'Admin').length;
  const managerCount = users.filter(u => u.role === 'Manager').length;
  const salesCount = users.filter(u => u.role === 'Sales').length;
  const activeCount = users.filter(u => u.status !== 'Inactive').length;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '1.75rem', fontWeight: 800 }}>User Management & Accounts</h1>
          <p className="section-sub" style={{ fontSize: '0.875rem' }}>Create, authorize, and manage system accounts for Econz team members</p>
        </div>
        {currentUser?.role === 'Admin' && (
          <button onClick={handleOpenAddModal} className="btn-primary" style={{ padding: '0.65rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0284c7' }}>
            <Plus size={16} />
            <span>Create New Account</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '1rem', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
            <User size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalUsersCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Accounts</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{activeCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Status</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '1rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{adminCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Administrators</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{salesCount + managerCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sales & Managers</div>
          </div>
        </div>
      </div>

      {/* Created Credentials Banner Modal/Card */}
      {createdCredentials && (
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>
              <CheckCircle size={20} />
              <span>Account Created for {createdCredentials.name} ({createdCredentials.role})</span>
            </div>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.25rem' }}>
              Share these credentials with the user to allow immediate login:
            </p>
            <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <strong>Email:</strong> {createdCredentials.email} &nbsp;|&nbsp; <strong>Password:</strong> {createdCredentials.password}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => copyToClipboard(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`)}
              style={{
                background: '#ffffff',
                color: '#0284c7',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Copy size={15} />
              <span>Copy Login Details</span>
            </button>
            <button
              onClick={() => setCreatedCredentials(null)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search users by name, email, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-orbit"
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'Admin', 'Manager', 'Sales', 'Finance', 'Operations'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: roleFilter === role ? '#0284c7' : 'var(--border-subtle)',
                background: roleFilter === role ? '#0284c7' : 'var(--surface-1)',
                color: roleFilter === role ? '#ffffff' : 'var(--text-primary)'
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="orbit-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>User Account</th>
                <th>Entity</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Designation</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No users matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === 'Admin';
                  const isManager = u.role === 'Manager';
                  const isActive = u.status !== 'Inactive';

                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isAdmin ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : (isManager ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : '#64748b'),
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                          }}>
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              (u.name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: u.entity === 'UAE' ? '#fef3c7' : '#e0f2fe',
                          color: u.entity === 'UAE' ? '#92400e' : '#0369a1'
                        }}>
                          {u.entity || 'India'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isAdmin ? 'rgba(139,92,246,0.1)' : (isManager ? 'rgba(2,132,199,0.1)' : 'rgba(100,116,139,0.1)'),
                          color: isAdmin ? '#8b5cf6' : (isManager ? '#0284c7' : '#64748b')
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.phone || '—'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.designation || 'Account Management'}</span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: isActive ? '#10b981' : '#ef4444'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10b981' : '#ef4444' }}></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.75rem' }}
                            title="Edit User Details"
                          >
                            <Edit2 size={13} />
                          </button>
                          {currentUser?.role === 'Admin' && u._id !== currentUser._id && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', color: '#ef4444' }}
                              title="Delete User"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
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

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create User Account</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Add a new team member and set their role and login credentials</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="field-label field-required">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="input-orbit"
                  required
                />
              </div>

              <div>
                <label className="field-label field-required">Work Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="name@econz.cloud"
                  className="input-orbit"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="field-label field-required">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="input-orbit"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Sales">Sales Rep</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="field-label field-required">Entity Assignment</label>
                  <select
                    value={newUserEntity}
                    onChange={(e) => setNewUserEntity(e.target.value)}
                    className="input-orbit"
                  >
                    <option value="India">Econz India</option>
                    <option value="UAE">Econz UAE</option>
                    <option value="UK">Econz UK</option>
                    <option value="US">Econz US</option>
                    <option value="Global">Global</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Designation / Title</label>
                <input
                  type="text"
                  value={newUserDesignation}
                  onChange={(e) => setNewUserDesignation(e.target.value)}
                  placeholder="Customer Success Account Management Team"
                  className="input-orbit"
                />
              </div>

              <div>
                <label className="field-label">Mobile Number</label>
                <PhoneInput
                  value={newUserPhone}
                  onChange={setNewUserPhone}
                  defaultCountryCode={newUserEntity === 'UAE' ? 'AE' : (newUserEntity === 'UK' ? 'GB' : 'IN')}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="field-label field-required" style={{ margin: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => setNewUserPassword(generateRandomPassword())}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <RefreshCw size={12} />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Enter or generate password"
                    className="input-orbit"
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#0284c7' }}>
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && editingUser && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Edit User: {editingUser.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Update account roles, status, and permissions</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="btn-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="field-label field-required">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-orbit"
                  required
                />
              </div>

              <div>
                <label className="field-label field-required">Work Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input-orbit"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="field-label field-required">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="input-orbit"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Sales">Sales Rep</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="field-label field-required">Entity</label>
                  <select
                    value={editEntity}
                    onChange={(e) => setEditEntity(e.target.value)}
                    className="input-orbit"
                  >
                    <option value="India">Econz India</option>
                    <option value="UAE">Econz UAE</option>
                    <option value="UK">Econz UK</option>
                    <option value="US">Econz US</option>
                    <option value="Global">Global</option>
                  </select>
                </div>
                <div>
                  <label className="field-label field-required">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="input-orbit"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Designation / Title</label>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="input-orbit"
                />
              </div>

              <div>
                <label className="field-label">Mobile Number</label>
                <PhoneInput
                  value={editPhone}
                  onChange={setEditPhone}
                  defaultCountryCode={editEntity === 'UAE' ? 'AE' : (editEntity === 'UK' ? 'GB' : 'IN')}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="field-label" style={{ margin: 0 }}>Reset Password (leave empty to keep current)</label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateRandomPassword())}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <RefreshCw size={12} />
                    <span>Generate</span>
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="New password (optional)"
                    className="input-orbit"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#0284c7' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
