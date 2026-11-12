import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import BookNestCard from '../components/BookNestCard';
import {
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  BookOpen,
  X,
  Check,
  RotateCcw
} from 'lucide-react';

export default function AdminBooksPage() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [loading, setLoading] = useState(true);

  // View mode: 'grid' (visual customer-style showcase) or 'table'
  const [viewMode, setViewMode] = useState('grid');



  // Stock adjustment modal state
  const [stockBook, setStockBook] = useState(null);
  const [quantityDelta, setQuantityDelta] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Manual restock');
  const [adjusting, setAdjusting] = useState(false);

  // Archive dialog state
  const [archiveBook, setArchiveBook] = useState(null);

  const fetchBooks = async (p = 0, currentCat = selectedCategory, catsList = categories) => {
    setLoading(true);
    try {
      const params = {
        page: p,
        size: viewMode === 'grid' ? 12 : 20,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      };
      if (searchTerm) params.query = searchTerm;

      if (currentCat) {
        const list = catsList && catsList.length > 0 ? catsList : categories;
        const found = list.find(c => 
          c.name.toLowerCase() === currentCat.toLowerCase() || 
          String(c.id) === String(currentCat)
        );
        if (found) {
          params.categoryId = found.id;
        }
      }

      const res = await api.get('/admin/books', { params });
      setBooks(res.data.content);
      setPage(res.data.number);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements || res.data.content.length);
    } catch (err) {
      showError('Failed to load books catalogue');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catsRes, authsRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/authors')
      ]);
      setCategories(catsRes.data);
      setAuthors(authsRes.data);
      fetchBooks(0, selectedCategory, catsRes.data);
    } catch (err) {
      console.error('Failed to load categories/authors', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchBooks(0, selectedCategory, categories);
    }
  }, [selectedCategory, viewMode]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(0);
  };



  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!quantityDelta || quantityDelta === 0) {
      showError('Please enter a non-zero adjustment delta');
      return;
    }
    setAdjusting(true);
    try {
      await api.post(`/admin/books/${stockBook.id}/stock-adjustments`, {
        quantityDelta: parseInt(quantityDelta, 10),
        reason: adjustmentReason
      });
      showSuccess('Auditable stock adjustment recorded successfully');
      setStockBook(null);
      setQuantityDelta(0);
      fetchBooks(page);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const handleArchiveBook = async () => {
    if (!archiveBook) return;
    try {
      await api.delete(`/admin/books/${archiveBook.id}`);
      showSuccess(`Book "${archiveBook.title}" archived and hidden from customer catalog`);
      setArchiveBook(null);
      fetchBooks(page, selectedCategory);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to archive book');
    }
  };

  const handleRestoreBook = async (book) => {
    try {
      const payload = {
        isbn: book.isbn,
        title: book.title,
        description: book.description || '',
        price: book.price,
        stockQuantity: book.stockQuantity,
        categoryId: book.category?.id,
        authorIds: book.authors?.map(a => a.id) || [],
        active: true,
        featured: Boolean(book.featured)
      };
      await api.patch(`/admin/books/${book.id}`, payload);
      showSuccess(`Book "${book.title}" restored! Visible on customer storefront.`);
      fetchBooks(page, selectedCategory);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to restore book');
    }
  };

  return (
    <div>
      {/* Top Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.25rem',
            color: '#16362c',
            margin: 0
          }}>
            BookNest Catalogue
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Toggle: Grid vs Table */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#ffffff',
            border: '1px solid #e6e7df',
            borderRadius: '10px',
            padding: '3px',
            boxShadow: '0 1px 3px rgba(32, 44, 41, 0.04)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#204b3e' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : '#7a807a',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Visual Showcase Grid (Customer Style)"
            >
              <LayoutGrid size={16} />
              <span>Showcase</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#204b3e' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#7a807a',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Table Inventory View"
            >
              <TableIcon size={16} />
              <span>Table</span>
            </button>
          </div>

          {/* Add New Book Button */}
          <button
            type="button"
            onClick={() => navigate('/admin/books/new')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#204b3e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.6rem 1.15rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(32, 75, 62, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16362c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#204b3e')}
          >
            <Plus size={18} />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* Filter and Category Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #edf0ea',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 10px rgba(32, 44, 41, 0.03)'
      }}>
        {/* Category Pills (Matching Customer Experience) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              border: selectedCategory === '' ? '1px solid #204b3e' : '1px solid #e2e5dc',
              backgroundColor: selectedCategory === '' ? '#204b3e' : '#ffffff',
              color: selectedCategory === '' ? '#ffffff' : '#4d554e',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            All Items ({totalElements})
          </button>

          {categories.map(c => {
            const isSelected = selectedCategory === c.name || String(selectedCategory) === String(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? '' : c.name)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  border: isSelected ? '1px solid #204b3e' : '1px solid #e2e5dc',
                  backgroundColor: isSelected ? '#204b3e' : '#f9faf7',
                  color: isSelected ? '#ffffff' : '#386e4c',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Books Grid / Table Display */}
      {loading ? (
        <LoadingSpinner message="Loading BookNest items..." />
      ) : books.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #edf0ea',
          borderRadius: '18px',
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#7a807a'
        }}>
          <BookOpen size={48} color="#204b3e" style={{ margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.35rem', color: '#16362c', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
            No books found
          </h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
            There are currently no books matching your search or category filter. Add an item below to see it appear in the showcase!
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/books/new')}
            style={{
              backgroundColor: '#204b3e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.65rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Plus size={16} /> Add First Book
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* EXACT BOOKNEST COLLECTION SHOWCASE GRID */
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.75rem',
            marginBottom: '2.5rem'
          }}>
            {books.map(b => (
              <BookNestCard
                key={b.id}
                book={b}
                isAdmin={true}
                onEdit={() => navigate(`/admin/books/${b.id}/edit`)}
                onAdjustStock={() => { setStockBook(b); setQuantityDelta(0); }}
                onArchive={() => setArchiveBook(b)}
                onRestore={() => handleRestoreBook(b)}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => fetchBooks(p)}
          />
        </div>
      ) : (
        /* TABLE VIEW OPTION */
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #edf0ea',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9faf7', borderBottom: '1px solid #e6e7df', color: '#555f58' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Title & Author</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Price</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Stock</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f0f1ea' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#16362c' }}>{b.title}</div>
                      <div style={{ fontSize: '0.82rem', color: '#7a807a' }}>
                        {b.authors?.map(a => a.name).join(', ') || 'Unknown'}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        backgroundColor: '#e9f5ed',
                        color: '#386e4c',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.76rem',
                        fontWeight: 600
                      }}>
                        {b.category?.name || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#16362c' }}>
                      {formatCurrency(b.price)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: b.stockQuantity === 0 ? '#fee2e2' : b.stockQuantity < 5 ? '#fef3c7' : '#e9ede2',
                        color: b.stockQuantity === 0 ? '#b91c1c' : b.stockQuantity < 5 ? '#92400e' : '#204b3e'
                      }}>
                        {b.stockQuantity} in stock
                      </span>
                      {!b.active && (
                        <span style={{
                          marginLeft: '0.4rem',
                          padding: '0.18rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5'
                        }}>
                          ARCHIVED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Link to={`/admin/books/${b.id}/edit`} className="btn btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                          <Edit2 size={13} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => { setStockBook(b); setQuantityDelta(0); }}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          title="Restock"
                        >
                          <RefreshCw size={13} />
                        </button>
                        {b.active ? (
                          <button
                            type="button"
                            onClick={() => setArchiveBook(b)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#dc2626', borderColor: '#fecaca' }}
                            title="Archive Book (Hide from Store)"
                          >
                            <Archive size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestoreBook(b)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#065f46', borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }}
                            title="Restore Book (Show in Store)"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => fetchBooks(p)}
          />
        </div>
      )}



      {/* AUDITABLE STOCK ADJUSTMENT MODAL */}
      {stockBook && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 54, 44, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '450px',
            width: '90%',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#16362c', marginBottom: '0.5rem' }}>
              Adjust Stock: {stockBook.title}
            </h3>
            <p style={{ color: '#7a807a', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Current stock: <strong>{stockBook.stockQuantity} units</strong>. Delta can be positive (restock) or negative.
            </p>

            <form onSubmit={handleStockAdjustment}>
              <FormField label="Quantity Change (+ or -)" required>
                <input
                  type="number"
                  value={quantityDelta}
                  onChange={(e) => setQuantityDelta(e.target.value)}
                  placeholder="e.g. 15 or -3"
                  className="form-input"
                  required
                />
              </FormField>

              <FormField label="Adjustment Reason" required>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Reason for audit log"
                  className="form-input"
                  required
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStockBook(null)}
                  className="btn btn-secondary"
                  disabled={adjusting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={adjusting}
                >
                  {adjusting ? 'Updating...' : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(archiveBook)}
        title="Archive Book"
        message={`Are you sure you want to archive "${archiveBook?.title}"? It will no longer appear in active catalogue.`}
        confirmText="Archive Book"
        confirmVariant="danger"
        onConfirm={handleArchiveBook}
        onCancel={() => setArchiveBook(null)}
      />
    </div>
  );
}
