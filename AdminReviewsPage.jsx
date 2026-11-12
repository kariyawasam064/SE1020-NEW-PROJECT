import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { Star, Check, X, Trash2 } from 'lucide-react';

const AdminReviewsPage = () => {
  const { showSuccess, showError } = useToast();
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteReviewId, setDeleteReviewId] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/reviews', { params });
      setReviews(res.data);
    } catch (err) {
      showError('Failed to load reviews queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/reviews/${id}/status`, { moderationStatus: status });
      showSuccess(`Review ${status.toLowerCase()} successfully`);
      fetchReviews();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update review status');
    }
  };

  const handleDelete = async () => {
    if (!deleteReviewId) return;
    try {
      await api.delete(`/admin/reviews/${deleteReviewId}`);
      showSuccess('Review permanently removed');
      setDeleteReviewId(null);
      fetchReviews();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-primary-dark)' }}>
            Review Moderation Queue
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Approve genuine literary reader feedback before publishing to the public book catalogue.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: 'auto', minWidth: '180px' }}
        >
          <option value="">All Moderation States</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
        {loading ? (
          <LoadingSpinner message="Loading review submissions..." />
        ) : reviews.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
            No reviews found matching the current moderation filter.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                <th style={{ padding: 'var(--space-3)' }}>Book</th>
                <th style={{ padding: 'var(--space-3)' }}>Reviewer</th>
                <th style={{ padding: 'var(--space-3)' }}>Rating</th>
                <th style={{ padding: 'var(--space-3)' }}>Feedback</th>
                <th style={{ padding: 'var(--space-3)' }}>Status</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Moderation</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4)', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                    {r.bookTitle}
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    {r.userName}
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDate(r.createdAt)}</div>
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={14}
                          fill={star <= r.rating ? 'var(--color-gold)' : 'none'}
                          color={star <= r.rating ? 'var(--color-gold)' : 'var(--color-border)'}
                        />
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4)', maxWidth: '350px', color: 'var(--color-text)' }}>
                    "{r.comment}"
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background:
                        r.moderationStatus === 'APPROVED' ? 'var(--color-surface)' :
                        r.moderationStatus === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                      color:
                        r.moderationStatus === 'APPROVED' ? 'var(--color-primary)' :
                        r.moderationStatus === 'REJECTED' ? 'var(--color-danger)' : '#92400e'
                    }}>
                      {r.moderationStatus}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                      {r.moderationStatus !== 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                          title="Approve Review"
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {r.moderationStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                          title="Reject Review"
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: '#d97706', borderColor: '#d97706' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteReviewId(r.id)}
                        title="Delete Review"
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteReviewId)}
        title="Remove Review"
        message="Are you sure you want to permanently delete this customer review? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteReviewId(null)}
      />
    </div>
  );
};

export default AdminReviewsPage;
