import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Save, Upload } from 'lucide-react';

const AdminBookFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Book fields
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorIds, setAuthorIds] = useState([]);
  const [featured, setFeatured] = useState(true);
  const [active, setActive] = useState(true);
  const [coverPath, setCoverPath] = useState('');

  // Cover upload file state
  const [coverFile, setCoverFile] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, authsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/authors')
        ]);
        setCategories(catsRes.data || []);
        setAuthors(authsRes.data || []);

        if (isEdit) {
          const bookRes = await api.get(`/books/${id}`);
          const b = bookRes.data;
          setTitle(b.title || '');
          setIsbn(b.isbn || '');
          setDescription(b.description || '');
          setPrice(b.price != null ? String(b.price) : '');
          setStockQuantity(b.stockQuantity != null ? String(b.stockQuantity) : '');
          setCategoryId(b.category?.id ? String(b.category.id) : '');
          setAuthorIds(b.authors?.map(a => Number(a.id)) || []);
          setFeatured(Boolean(b.featured));
          setActive(b.active !== false);
          setCoverPath(b.coverPath || '');
        } else {
          setTitle('');
          setIsbn('');
          setDescription('');
          setPrice('');
          setStockQuantity('20');
          setCategoryId(catsRes.data?.length > 0 ? String(catsRes.data[0].id) : '');
          setAuthorIds(authsRes.data?.length > 0 ? [Number(authsRes.data[0].id)] : []);
          setFeatured(true);
          setActive(true);
          setCoverPath('');
          setCoverFile(null);
        }
      } catch (err) {
        showError(err.message || 'Failed to load book data or dropdowns');
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, [id, isEdit]);

  const handleAuthorToggle = (authorId) => {
    const numId = Number(authorId);
    setAuthorIds(prev =>
      prev.includes(numId) ? prev.filter(x => x !== numId) : [...prev, numId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authorIds.length === 0) {
      showError('Please select at least one author');
      return;
    }
    if (!categoryId) {
      showError('Please select a category');
      return;
    }

    setSubmitting(true);
    const payload = {
      title,
      isbn,
      description,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity, 10),
      categoryId: parseInt(categoryId, 10),
      authorIds,
      featured,
      active
    };

    try {
      let bookId = id;
      if (isEdit) {
        const res = await api.patch(`/admin/books/${id}`, payload);
        bookId = res.data.id;
        showSuccess('Book updated successfully');
      } else {
        const res = await api.post('/admin/books', payload);
        bookId = res.data.id;
        showSuccess('Book created successfully');
      }

      // If a cover image was selected, upload it
      if (coverFile && bookId) {
        setUploadingCover(true);
        const formData = new FormData();
        formData.append('file', coverFile);
        await api.post(`/admin/books/${bookId}/cover`, formData, {
          headers: { 'Content-Type': undefined }
        });
        showSuccess('Cover image uploaded successfully');
      }

      navigate('/admin/books');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save book');
    } finally {
      setSubmitting(false);
      setUploadingCover(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading book details..." />;

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link to="/admin/books" className="btn btn-outline" style={{ display: 'inline-flex', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} />
          Back to Catalogue
        </Link>
      </div>

      <div className="card" style={{ padding: 'var(--space-8)', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.85rem',
          color: 'var(--color-primary-dark)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          {isEdit ? 'Edit Book' : 'Add New Book'}
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Title" required>
              <input
                className="form-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Great Gatsby"
                required
              />
            </FormField>

            <FormField label="ISBN" required>
              <input
                className="form-input"
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="e.g. 978-0743273565"
                required
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              className="form-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Synopsis, themes, literary background..."
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Price (LKR)" required>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 2500"
                required
              />
            </FormField>

            <FormField label="Initial Stock" required>
              <input
                className="form-input"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="e.g. 20"
                required
              />
            </FormField>

            <FormField label="Category" required>
              <select
                className="form-input"
                value={String(categoryId || '')}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Authors" required>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 'var(--space-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              maxHeight: '160px',
              overflowY: 'auto'
            }}>
              {authors.map(a => (
                <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={authorIds.includes(Number(a.id))}
                    onChange={() => handleAuthorToggle(a.id)}
                  />
                  <span>{a.name}</span>
                </label>
              ))}
            </div>
          </FormField>

          {/* Cover upload & preview */}
          <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Cover Image
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              {(coverFile || coverPath) && (
                <img
                  src={coverFile ? URL.createObjectURL(coverFile) : coverPath}
                  alt="Cover Preview"
                  style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                />
              )}
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCoverFile(e.target.files[0]);
                    }
                  }}
                  style={{ fontSize: '0.9rem' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                  Accepts JPG, PNG, WEBP, or SVG. Maximum size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Publishing & Feature Options */}
          <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-6)', padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-surface-subtle, #f8f9fa)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span>Feature this title (Staff Pick badge)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>Active in catalog</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
            <Link to="/admin/books" className="btn btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || uploadingCover}
              className="btn btn-primary"
            >
              <Save size={16} />
              {submitting || uploadingCover ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBookFormPage;
