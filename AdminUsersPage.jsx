import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { UserCheck, UserX, Shield, X, Plus, Search, Users } from 'lucide-react';

const AdminUsersPage = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Status toggle state
  const [targetUser, setTargetUser] = useState(null);

  // Create admin / user modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('ADMIN');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.query = searchTerm;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data);
    } catch (err) {
      showError('Failed to load users list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/users', {
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole
      });
      showSuccess(`New ${newRole.toLowerCase()} account created successfully!`);
      setCreateModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!targetUser) return;
    const newActive = !targetUser.active;
    try {
      await api.patch(`/admin/users/${targetUser.id}/status`, { active: newActive });
      showSuccess(`User "${targetUser.fullName}" is now ${newActive ? 'activated' : 'deactivated'}`);
      setTargetUser(null);
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update user status');
      setTargetUser(null);
    }
  };

  return (
    <div>
      {/* User Management Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-6)',
        flexWrap: 'wrap',
        gap: 'var(--space-4)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.15rem',
              color: 'var(--color-primary-dark)',
              margin: 0,
              letterSpacing: '-0.01em'
            }}>
              User Management
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.2rem 0.6rem',
              backgroundColor: '#f0f3ec',
              border: '1px solid #d9e0d4',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#204b3e'
            }}>
              {users.length} {users.length === 1 ? 'Account' : 'Accounts'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', width: '220px', fontSize: '0.88rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#828e85' }} />
            </div>
            <button type="submit" className="btn btn-outline" style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}>
              Filter
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setTimeout(fetchUsers, 0); }}
                className="btn btn-outline"
                style={{ padding: '0.55rem', color: '#666' }}
                title="Clear filter"
              >
                <X size={14} />
              </button>
            )}
          </form>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(32, 75, 62, 0.2)'
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Administrator
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
        {loading ? (
          <LoadingSpinner message="Loading users..." />
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
            No accounts matched the search criteria.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                <th style={{ padding: 'var(--space-3)' }}>Full Name</th>
                <th style={{ padding: 'var(--space-3)' }}>Email Address</th>
                <th style={{ padding: 'var(--space-3)' }}>System Role</th>
                <th style={{ padding: 'var(--space-3)' }}>Registered Date</th>
                <th style={{ padding: 'var(--space-3)' }}>Status</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4)', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                    {u.fullName}
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: u.role === 'ADMIN' ? '#f5eedf' : '#e9ede2',
                      color: u.role === 'ADMIN' ? '#92400e' : '#254d40'
                    }}>
                      {u.role === 'ADMIN' && <Shield size={12} />}
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: u.active ? 'var(--color-surface-muted)' : '#fee2e2',
                      color: u.active ? 'var(--color-primary)' : 'var(--color-danger)'
                    }}>
                      {u.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                    <button
                      onClick={() => setTargetUser(u)}
                      className={`btn ${u.active ? 'btn-outline' : 'btn-primary'}`}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.8rem',
                        color: u.active ? 'var(--color-danger)' : undefined,
                        borderColor: u.active ? 'var(--color-danger)' : undefined
                      }}
                    >
                      {u.active ? (
                        <>
                          <UserX size={14} />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} />
                          Activate
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User / Admin Modal */}
      {createModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#16362c' }}>
                Create Administrator
              </h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a807a' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <FormField label="Full Name" required>
                <input
                  className="form-input"
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Ruwan Jayawardena"
                  required
                />
              </FormField>

              <FormField label="Email Address" required>
                <input
                  className="form-input"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. ruwan@chapterco.com"
                  required
                />
              </FormField>

              <FormField label="Password (minimum 6 characters)" required>
                <input
                  className="form-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormField>

              <FormField label="System Role" required>
                <select
                  className="form-input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(targetUser)}
        title={targetUser?.active ? 'Deactivate User Account' : 'Activate User Account'}
        message={
          targetUser?.active
            ? `Are you sure you want to disable ${targetUser?.fullName} (${targetUser?.email})? They will immediately be prevented from logging into the system.`
            : `Are you sure you want to reactivate ${targetUser?.fullName} (${targetUser?.email})?`
        }
        confirmText={targetUser?.active ? 'Yes, Deactivate' : 'Yes, Activate'}
        cancelText="Cancel"
        isDanger={targetUser?.active}
        onConfirm={handleToggleStatus}
        onCancel={() => setTargetUser(null)}
      />
    </div>
  );
};

export default AdminUsersPage;
