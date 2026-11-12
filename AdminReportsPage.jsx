import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import { Download, Calendar, DollarSign, ShoppingBag, Package } from 'lucide-react';

const AdminReportsPage = () => {
  const { showError } = useToast();
  // Default to past 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/sales', {
        params: {
          startDate: `${startDate}T00:00:00`,
          endDate: `${endDate}T23:59:59`
        }
      });
      setReport(res.data);
    } catch (err) {
      showError('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/admin/reports/sales/csv', {
        params: {
          startDate: `${startDate}T00:00:00`,
          endDate: `${endDate}T23:59:59`
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chapter_co_sales_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showError('Failed to generate CSV export');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--color-primary-dark)' }}>
            Sales & Analytics Reports
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Financial audit and bestseller distribution across customer orders.
          </p>
        </div>

        <button onClick={handleExportCsv} className="btn btn-secondary">
          <Download size={18} />
          Export Report (CSV)
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Date Range:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
              style={{ width: 'auto' }}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
              style={{ width: 'auto' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
            Run Report
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner message="Calculating financial metrics..." />
      ) : !report ? (
        <p>No report data available.</p>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-8)'
          }}>
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Collected Revenue</span>
                <DollarSign size={20} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                {formatCurrency(report.collectedRevenue ?? 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                PAID & DELIVERED orders only
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Orders</span>
                <Package size={20} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                {report.totalOrdersCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                In selected period
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Ordered Value</span>
                <DollarSign size={20} color="#6b7280" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#374151' }}>
                {formatCurrency(report.totalOrderedValue ?? 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                All non-cancelled orders
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Items Delivered</span>
                <ShoppingBag size={20} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                {report.totalDeliveredItemsCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                Copies delivered into readers' hands
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-8)' }}>
            {/* Bestselling Books Table */}
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: 'var(--space-4)' }}>
                Bestselling Titles (Delivered & Paid)
              </h2>

              {(!report.bestsellers || report.bestsellers.length === 0) ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No delivered sales recorded in this timeframe.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                        <th style={{ padding: 'var(--space-2)' }}>Title</th>
                        <th style={{ padding: 'var(--space-2)' }}>Units Sold</th>
                        <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.bestsellers.map(b => (
                        <tr key={b.bookId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{b.title}</td>
                          <td style={{ padding: 'var(--space-3)' }}>{b.quantitySold} copies</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                            {formatCurrency(b.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Order Status Breakdown */}
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: 'var(--space-4)' }}>
                Order Status Distribution
              </h2>

              {(!report.statusCounts || Object.keys(report.statusCounts).length === 0) ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No orders in this timeframe.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {Object.entries(report.statusCounts).map(([st, cnt]) => (
                    <div key={st} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{st}</span>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        background: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {cnt} {cnt === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReportsPage;
