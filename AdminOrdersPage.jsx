import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency, formatDate, formatOrderNumber } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { Search, ArrowRight } from 'lucide-react';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (p = 0) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      if (selectedStatus) params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/admin/orders', { params });
      setOrders(res.data.content);
      setPage(res.data.number);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(0);
  }, [selectedStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders(0);
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-primary-dark)' }}>
          Order Management
        </h1>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="form-input"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="">All Statuses</option>
            <option value="PLACED">PLACED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PACKED">PACKED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
        {loading ? (
          <LoadingSpinner message="Loading orders..." />
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
            No orders found matching the filter criteria.
          </p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                  <th style={{ padding: 'var(--space-3)' }}>Order #</th>
                  <th style={{ padding: 'var(--space-3)' }}>Customer</th>
                  <th style={{ padding: 'var(--space-3)' }}>Date</th>
                  <th style={{ padding: 'var(--space-3)' }}>Total</th>
                  <th style={{ padding: 'var(--space-3)' }}>Payment</th>
                  <th style={{ padding: 'var(--space-3)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 600, color: 'var(--color-primary-dark)', fontFamily: 'ui-monospace, monospace' }}>
                      #{formatOrderNumber(o.orderNumber)}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div>{o.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{o.customerEmail}</div>
                    </td>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      {formatDate(o.createdAt)}
                    </td>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>
                      {formatCurrency(o.total)}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: o.paymentStatus === 'PAID' ? 'var(--color-surface)' : '#fef3c7',
                        color: o.paymentStatus === 'PAID' ? 'var(--color-primary)' : '#92400e'
                      }}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <StatusBadge status={o.status} />
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <Link to={`/admin/orders/${o.id}`} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                        Manage
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 'var(--space-6)' }}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => fetchOrders(p)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
