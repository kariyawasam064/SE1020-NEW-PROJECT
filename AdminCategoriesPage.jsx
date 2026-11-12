import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Edit2, Trash2, Folder, BookOpen } from 'lucide-react';

const AdminCategoriesPage = () => {
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteCategory, setDeleteCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch (err) {
      showError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { name: name.trim(), description: description.trim() };

    try {
      if (editingCategory) {
        await api.patch(`/admin/categories/${editingCategory.id}`, payload);
        showSuccess('Category updated successfully');
      } else {
        await api.post('/admin/categories', payload);
        showSuccess('Category created successfully');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      showError(err.message || err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    try {
      await api.delete(`/admin/categories/${deleteCategory.id}`);
      showSuccess(`Category "${deleteCategory.name}" deleted successfully`);
      setDeleteCategory(null);
      fetchCategories();
    } catch (err) {
      // Handles 409 conflict when books reference this category
      showError(err.response?.data?.message || 'Cannot delete category while books reference it');
      setDeleteCategory(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading categories..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-primary-dark)' }}>
            Category Management
          </h1>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              <th style={{ padding: 'var(--space-3)' }}>Name</th>
              <th style={{ padding: 'var(--space-3)' }}>Description</th>
              <th style={{ padding: 'var(--space-3)' }}>Books Count</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-4)', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                  {c.name}
                </td>
                <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                  {c.description || '—'}
                </td>
                <td style={{ padding: 'var(--space-4)' }}>
                  <Link
                    to={`/admin/books?category=${encodeURIComponent(c.name)}`}
                    title={`View books in category "${c.name}"`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      background: (c.bookCount ?? 0) > 0 ? '#e9f5ed' : '#f4f6f1',
                      color: (c.bookCount ?? 0) > 0 ? '#2b5c43' : '#6b7280',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <BookOpen size={13} />
                    {c.bookCount ?? 0} {c.bookCount === 1 ? 'book' : 'books'}
                  </Link>
                </td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => openEditModal(c)}
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteCategory(c)}
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

      {/* Category Modal */}
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
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h2>

            <form onSubmit={handleSave}>
              <FormField label="Category Name" required>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Science Fiction & Fantasy"
                  required
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  className="form-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this genre..."
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
                  {submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCategory)}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteCategory?.name}"? Any books currently assigned to it will be reassigned to the "General" category.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteCategory(null)}
      />
    </div>
  );
};

export default AdminCategoriesPage;
