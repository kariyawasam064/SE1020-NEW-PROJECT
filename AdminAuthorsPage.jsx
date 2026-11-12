import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';

const AdminAuthorsPage = () => {
  const { showSuccess, showError } = useToast();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteAuthor, setDeleteAuthor] = useState(null);

  const fetchAuthors = async () => {
    try {
      const res = await api.get('/admin/authors');
      setAuthors(res.data);
    } catch (err) {
      showError('Failed to load authors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const openAddModal = () => {
    setEditingAuthor(null);
    setName('');
    setBiography('');
    setModalOpen(true);
  };

  const openEditModal = (author) => {
    setEditingAuthor(author);
    setName(author.name);
    setBiography(author.biography || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { name: name.trim(), biography: biography.trim() };

    try {
      if (editingAuthor) {
        await api.patch(`/admin/authors/${editingAuthor.id}`, payload);
        showSuccess('Author updated successfully');
      } else {
        await api.post('/admin/authors', payload);
        showSuccess('Author created successfully');
      }
      setModalOpen(false);
      fetchAuthors();
    } catch (err) {
      showError(err.message || err.response?.data?.message || 'Failed to save author');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAuthor) return;
    try {
      await api.delete(`/admin/authors/${deleteAuthor.id}`);
      showSuccess(`Author "${deleteAuthor.name}" deleted successfully`);
      setDeleteAuthor(null);
      fetchAuthors();
    } catch (err) {
      // Handles 409 conflict when books reference this author
      showError(err.response?.data?.message || 'Cannot delete author while books reference them');
      setDeleteAuthor(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading authors..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-primary-dark)' }}>
            Author Management
          </h1>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          Add Author
        </button>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              <th style={{ padding: 'var(--space-3)' }}>Name</th>
              <th style={{ padding: 'var(--space-3)' }}>Biography</th>
              <th style={{ padding: 'var(--space-3)' }}>Books Count</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {authors.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-4)', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                  {a.name}
                </td>
                <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', maxWidth: '400px' }}>
                  {a.biography || '—'}
                </td>
                <td style={{ padding: 'var(--space-4)' }}>
                  <Link
                    to="/admin/books"
                    title={`View books by "${a.name}"`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      background: (a.bookCount ?? 0) > 0 ? '#e9f5ed' : '#f4f6f1',
                      color: (a.bookCount ?? 0) > 0 ? '#2b5c43' : '#6b7280',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <BookOpen size={13} />
                    {a.bookCount ?? 0} {a.bookCount === 1 ? 'book' : 'books'}
                  </Link>
                </td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => openEditModal(a)}
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteAuthor(a)}
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Author Modal */}
      {modalOpen && (
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
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: 'var(--space-6)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-primary-dark)', marginBottom: 'var(--space-4)' }}>
              {editingAuthor ? 'Edit Author' : 'Create Author'}
            </h2>

            <form onSubmit={handleSave}>
              <FormField label="Author Name" required>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Gabriel García Márquez"
                  required
                />
              </FormField>

              <FormField label="Biography">
                <textarea
                  className="form-input"
                  rows={4}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Literary background, notable accolades, bio..."
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Saving...' : 'Save Author'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteAuthor)}
        title="Delete Author"
        message={`Are you sure you want to delete author "${deleteAuthor?.name}"? They will be removed from any associated books.`}
        confirmText="Delete Author"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteAuthor(null)}
      />
    </div>
  );
};

export default AdminAuthorsPage;
