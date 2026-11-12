import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatOrderNumber } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Truck,
  Check,
  CreditCard,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
  Copy
} from 'lucide-react';

const STEPS = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' }
];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status transition state
  const [newStatus, setNewStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/admin/orders/${id}`);
      setOrder(res.data);
      setNewStatus(res.data.status);
      setPaymentStatus(res.data.paymentStatus);
    } catch (err) {
      showError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    if (e) e.preventDefault();
    if (!order) return;

    if (newStatus === order.status && paymentStatus === order.paymentStatus) {
      if (order.status === 'DELIVERED') {
        navigate('/admin/orders');
        return;
      }
      showSuccess('No changes to save');
      return;
    }

    setUpdating(true);
    try {
      // 1. If payment status was updated to PAID
      if (paymentStatus === 'PAID' && order.paymentStatus !== 'PAID') {
        await api.patch(`/admin/orders/${id}/paid`);
      }

      // 2. If fulfillment status was changed
      if (newStatus !== order.status) {
        await api.patch(`/admin/orders/${id}/status`, {
          status: newStatus,
          paymentStatus: paymentStatus
        });
      }

      showSuccess(`Order updated to ${newStatus} (${paymentStatus})`);

      // When the last step (DELIVERED) is confirmed, navigate back to order list page
      if (newStatus === 'DELIVERED') {
        navigate('/admin/orders');
      } else {
        await fetchOrder();
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickAdvance = async (targetStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, {
        status: targetStatus,
        paymentStatus: order.paymentStatus
      });
      showSuccess(`Order #${order.orderNumber} advanced to ${targetStatus}!`);

      // When the last step (DELIVERED) is confirmed, navigate back to order list page
      if (targetStatus === 'DELIVERED') {
        navigate('/admin/orders');
      } else {
        await fetchOrder();
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to advance order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickMarkPaid = async () => {
    setUpdating(true);
    try {
      await api.patch(`/admin/orders/${id}/paid`);
      await fetchOrder();
      showSuccess('Payment status marked as PAID');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to mark payment as paid');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading order details..." />;
  if (!order) return <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>Order not found.</div>;

  const currentStepIndex = STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';

  const nextStepMap = {
    PLACED: 'CONFIRMED',
    CONFIRMED: 'PACKED',
    PACKED: 'SHIPPED',
    SHIPPED: 'DELIVERED'
  };
  const nextStep = nextStepMap[order.status];

  const address = order.address || order.deliveryAddress;
  const recipientName = address?.recipientSnapshot || order.customerName || 'Customer';
  const phoneNumber = address?.phoneSnapshot || 'Not provided';
  const fullAddress = address?.addressSnapshot || 'Standard store delivery';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Back button & Breadcrumb */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/admin/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.85rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e5dc',
            borderRadius: '8px',
            color: '#204b3e',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9faf7';
            e.currentTarget.style.borderColor = '#204b3e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#e2e5dc';
          }}
        >
          <ArrowLeft size={15} />
          Back to Orders
        </Link>
      </div>

      {/* Main Order Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e6e7df',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.75rem',
        boxShadow: '0 4px 16px rgba(32, 44, 41, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.95rem',
                color: '#16362c',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Order Details
              </h1>

              {/* Professional Monospace Order Code Badge with Copy button */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#f4f7f2',
                border: '1px solid #d5dfd1',
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#1d4234',
                letterSpacing: '0.04em',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <span style={{ color: '#7a9686', fontWeight: 600 }}>#</span>
                <span>{formatOrderNumber(order.orderNumber)}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(formatOrderNumber(order.orderNumber));
                    showSuccess('Order ID copied to clipboard');
                  }}
                  title="Copy Order ID"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    color: '#607266',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px',
                    transition: 'color 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#16362c')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#607266')}
                >
                  <Copy size={13} />
                </button>
              </div>

              <StatusBadge status={order.status} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Payment badge */}
            <div style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              backgroundColor: order.paymentStatus === 'PAID' ? '#e9f5ed' : '#fef3c7',
              color: order.paymentStatus === 'PAID' ? '#1e5e3a' : '#92400e',
              border: `1px solid ${order.paymentStatus === 'PAID' ? '#c3e6cf' : '#fde68a'}`,
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <CreditCard size={15} />
              <span>{order.paymentStatus}</span>
              <span style={{ opacity: 0.7, fontWeight: 500 }}>•</span>
              <span style={{ fontWeight: 500 }}>{order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : order.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Visual Fulfillment Stepper Pipeline */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #f0f2eb'
        }}>
          {isCancelled ? (
            <div style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: '#fee2e2',
              borderRadius: '10px',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.92rem',
              fontWeight: 600
            }}>
              <AlertCircle size={18} />
              This order has been CANCELLED. Any reserved stock has been returned to inventory.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              position: 'relative',
              gap: '0.5rem'
            }}>
              {STEPS.map((s, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={s.key} style={{ textAlign: 'center', position: 'relative' }}>
                    {/* Circle icon */}
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      margin: '0 auto 0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isPassed ? '#204b3e' : '#f0f3eb',
                      color: isPassed ? '#ffffff' : '#9ba39b',
                      border: isCurrent ? '3px solid #c3e6cf' : 'none',
                      transition: 'all 0.2s ease',
                      fontWeight: 700,
                      fontSize: '0.82rem'
                    }}>
                      {isPassed ? <Check size={16} strokeWidth={3} /> : idx + 1}
                    </div>

                    {/* Step label */}
                    <div style={{
                      fontSize: '0.82rem',
                      fontWeight: isCurrent ? 700 : isPassed ? 600 : 500,
                      color: isCurrent ? '#16362c' : isPassed ? '#204b3e' : '#8b948b'
                    }}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
        {/* Left Column: Items and Workflow Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Status & Payment Workflow Box */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e6e7df',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(32, 44, 41, 0.04)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              color: '#16362c',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Package size={20} color="#204b3e" />
              Fulfillment & Payment Workflow
            </h2>

            {/* Quick Action Buttons for Instant One-Click Advancement */}
            {order.status === 'DELIVERED' && (
              <div style={{
                padding: '1rem 1.25rem',
                backgroundColor: '#e9f5ed',
                borderRadius: '10px',
                border: '1px solid #c3e6cf',
                color: '#16362c',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.92rem' }}>
                  <CheckCircle2 size={18} color="#204b3e" />
                  Order successfully delivered and completed!
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/orders')}
                  style={{
                    backgroundColor: '#204b3e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.55rem 1.1rem',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <ArrowLeft size={15} />
                  Return to Orders List
                </button>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
              padding: '0.85rem',
              backgroundColor: '#f9faf7',
              borderRadius: '10px',
              border: '1px solid #edf0ea'
            }}>
              {nextStep && !isCancelled && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleQuickAdvance(nextStep)}
                  style={{
                    backgroundColor: '#204b3e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.1rem',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16362c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#204b3e')}
                >
                  <CheckCircle2 size={16} />
                  Advance to {nextStep}
                </button>
              )}

              {order.paymentStatus === 'UNPAID' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleQuickMarkPaid}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1e5e3a',
                    border: '1px solid #386e4c',
                    borderRadius: '8px',
                    padding: '0.6rem 1.1rem',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e9f5ed')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <CreditCard size={16} />
                  Mark as PAID
                </button>
              )}
            </div>

            {/* Manual Status & Payment Adjustment Form */}
            <form onSubmit={handleUpdateStatus}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#454c46', marginBottom: '0.4rem' }}>
                    Fulfillment Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #d4dacd',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#16362c',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="PLACED">PLACED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PACKED">PACKED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#454c46', marginBottom: '0.4rem' }}>
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #d4dacd',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#16362c',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PAID">PAID</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                style={{
                  width: '100%',
                  backgroundColor: '#204b3e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => !updating && (e.currentTarget.style.backgroundColor = '#16362c')}
                onMouseLeave={(e) => !updating && (e.currentTarget.style.backgroundColor = '#204b3e')}
              >
                {updating ? 'Saving Changes...' : 'Save Fulfillment & Payment Status'}
              </button>
            </form>
          </div>

          {/* Ordered Books Snapshot Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e6e7df',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(32, 44, 41, 0.04)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              color: '#16362c',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShoppingBag size={20} color="#204b3e" />
              Order Items ({order.items?.length || 0})
            </h2>

            {/* List of items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items?.map(item => {
                const bookTitle = item.title || item.titleSnapshot || 'Book Volume';
                const isbn = item.isbn || item.isbnSnapshot || '—';
                const cover = item.coverPath || '/covers/default-book.svg';

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #f0f2eb'
                    }}
                  >
                    {/* Book Cover Thumbnail */}
                    <div style={{
                      width: '54px',
                      height: '74px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: '#edf0ea',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}>
                      <img
                        src={cover}
                        alt={bookTitle}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = '/covers/default-book.svg';
                        }}
                      />
                    </div>

                    {/* Book Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#16362c',
                        lineHeight: 1.3,
                        marginBottom: '0.2rem'
                      }}>
                        {bookTitle}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#7a807a', marginBottom: '0.35rem' }}>
                        ISBN: <strong>{isbn}</strong>
                      </div>

                      <div style={{ fontSize: '0.86rem', color: '#4d554e' }}>
                        {formatCurrency(item.unitPrice)} × {item.quantity} volume{item.quantity > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Item Total */}
                    <div style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      color: '#16362c'
                    }}>
                      {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Invoice Breakdown */}
            <div style={{
              marginTop: '1.25rem',
              paddingTop: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#656d66' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#656d66' }}>
                <span>Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? <strong style={{ color: '#2b5c43' }}>FREE</strong> : formatCurrency(order.deliveryFee)}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                marginTop: '0.25rem',
                borderTop: '2px dashed #e6e7df',
                fontWeight: 800,
                fontSize: '1.25rem',
                color: '#16362c'
              }}>
                <span>Total Amount</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Address and Audit History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Shipping Address Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e6e7df',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(32, 44, 41, 0.04)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              color: '#16362c',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <MapPin size={20} color="#204b3e" />
              Delivery Snapshot
            </h2>

            <div style={{
              backgroundColor: '#f9faf7',
              border: '1px solid #edf0ea',
              borderRadius: '12px',
              padding: '1.1rem',
              lineHeight: 1.6
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#16362c', marginBottom: '0.35rem' }}>
                {recipientName}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#525a53', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                <Phone size={14} color="#204b3e" />
                <span>Phone: <strong>{phoneNumber}</strong></span>
              </div>

              <div style={{ color: '#525a53', fontSize: '0.88rem', paddingTop: '0.5rem', borderTop: '1px solid #e6e8e2' }}>
                {fullAddress}
              </div>
            </div>
          </div>

          {/* Audit Status History Timeline */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e6e7df',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(32, 44, 41, 0.04)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              color: '#16362c',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={20} color="#204b3e" />
              Audit Status Trail
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.statusHistory && order.statusHistory.length > 0 ? (
                order.statusHistory.map((h, idx) => (
                  <div key={h.id || idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#e9f5ed',
                      color: '#204b3e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <CheckCircle2 size={16} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#16362c' }}>
                        Transitioned to <span style={{ color: '#204b3e' }}>{h.newStatus}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#7a807a', marginTop: '0.15rem' }}>
                        {formatDate(h.changedAt)} {h.changedByName ? `• by ${h.changedByName}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#7a807a' }}>No recorded history.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
