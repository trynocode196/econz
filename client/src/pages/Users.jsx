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
  X
} from 'lucide-react';

export default function Users() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserDesignation, setNewUserDesignation] = useState('');
  const [newUserRole, setNewUserRole] = useState('Sales');
  const [newUserPassword, setNewUserPassword] = useState('password');

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

  const handleOpenAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    // Reset form fields
    setNewName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserDesignation('');
    setNewUserRole('Sales');
    setNewUserPassword('password');
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (currentUser.role !== 'Admin') {
      showToast('Only administrators can create users', true);
      return;
    }

    try {
      const payload = {
        name: newName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        designation: newUserDesignation,
        phone: newUserPhone
      };

      const res = await api.post('/users', payload);
      setUsers(prev => [res.data, ...prev]);
      showToast('User created successfully');
      handleCloseAddModal();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', true);
    }
  };

  const handleDeleteUser = async (id, userName) => {
    if (currentUser.role !== 'Admin') {
      showToast('Only administrators can remove users', true);
      return;
    }

    if (id === currentUser._id) {
      showToast('Cannot delete yourself from the roster', true);
      return;
    }

    if (!window.confirm(`Are you sure you want to remove user: ${userName}?`)) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      showToast(`User ${userName} deleted`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove user', true);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p className="animate-pulse font-bold text-slate-500">Querying directory access roster...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Users</h1>
          <p className="section-sub">Manage user authorization and roles directory</p>
        </div>
      </div>

      {/* Users table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="orbit-table-card-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }} className="dark:text-white">User Accounts</h2>
          {currentUser.role === 'Admin' && (
            <button onClick={handleOpenAddModal} className="btn-brand-sm">
              <Plus size={12} style={{ marginRight: '0.25rem' }} />
              New User
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="orbit-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const avatar = u.name ? u.name.charAt(0).toUpperCase() : 'U';
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          height: '2.5rem', width: '2.5rem', borderRadius: '1rem',
                          background: 'var(--brand-50)', color: 'var(--brand-600)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginRight: '1rem', fontWeight: 800, fontSize: '0.875rem'
                        }} className="dark:bg-brand-500/10 dark:text-brand-400">
                          {avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--slate-900)' }} className="dark:text-white">
                            {u.name}
                          </div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', marginTop: '0.125rem' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-500)' }}>
                      {u.phone || '-'}
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }} className="dark:text-slate-300">
                      {u.designation || 'Sales Agent'}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)' }}>Active</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {currentUser.role === 'Admin' && u._id !== currentUser._id && (
                        <button 
                          onClick={() => handleDeleteUser(u._id, u.name)} 
                          className="btn-ghost" 
                          style={{ color: '#ef4444' }}
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }} className="dark:text-white">Create New Roster Account</h3>
              <button onClick={handleCloseAddModal} className="btn-ghost"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmitUser} className="space-y">
              <div>
                <label className="field-label">Full Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="input-orbit" 
                  placeholder="Full Name" 
                  required 
                />
              </div>
              
              <div>
                <label className="field-label">Email Address</label>
                <input 
                  type="email" 
                  value={newUserEmail} 
                  onChange={(e) => setNewUserEmail(e.target.value)} 
                  className="input-orbit" 
                  placeholder="name@econz.cloud" 
                  required 
                />
              </div>

              <div>
                <label className="field-label">Password</label>
                <input 
                  type="password" 
                  value={newUserPassword} 
                  onChange={(e) => setNewUserPassword(e.target.value)} 
                  className="input-orbit" 
                  placeholder="Minimum 6 characters" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-2">
                <div>
                  <label className="field-label">Phone Number</label>
                  <input 
                    type="tel" 
                    value={newUserPhone} 
                    onChange={(e) => setNewUserPhone(e.target.value)} 
                    className="input-orbit" 
                    placeholder="Mobile" 
                  />
                </div>
                <div>
                  <label className="field-label">Designation</label>
                  <input 
                    type="text" 
                    value={newUserDesignation} 
                    onChange={(e) => setNewUserDesignation(e.target.value)} 
                    className="input-orbit" 
                    placeholder="e.g. Sales Specialist" 
                  />
                </div>
              </div>

              <div className="radio-pill">
                <label className="field-label" style={{ display: 'block', marginBottom: '0.375rem' }}>Roster Role</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Admin', 'Manager', 'Sales'].map(role => (
                    <React.Fragment key={role}>
                      <input 
                        type="radio" 
                        id={`modal-role-${role}`} 
                        name="modal-role" 
                        value={role} 
                        checked={newUserRole === role} 
                        onChange={() => setNewUserRole(role)} 
                      />
                      <label htmlFor={`modal-role-${role}`}>{role}</label>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={handleCloseAddModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
