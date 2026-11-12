import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatLKR } from '../utils/formatters';
import QuantitySelector from '../components/QuantitySelector';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Bag is Waiting"
          message="Please sign in to view your saved bag or add books to your reading order."
          action={
            <Link to="/login?redirect=/cart" className="btn btn-primary">
              Sign In to Your Account
            </Link>
          }
        />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 0' }}>
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Bag is Empty"
          message="You haven’t added any volumes to your bag yet. Discover your next great read in our collection."
          action={
            <Link to="/books" className="btn btn-primary">
              Explore the Bookshop <ArrowRight size={16} />
            </Link>
          }
        />
      </div>
    );
  }

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearCart();
      setClearDialogOpen(false);
    } finally {
      setClearing(false);
    }
  };

  const amountNeededForFreeDelivery = Math.max(0, (cart.freeDeliveryThreshold || 5000) - (cart.subtotal || 0));

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '2rem' }}>
          Your Shopping Bag
        </h1>

        {/* Free delivery prompt banner */}
        {cart.meetsFreeDelivery ? (
          <div
            style={{
              padding: '0.9rem 1.25rem',
              backgroundColor: 'var(--color-surface-muted)',
              border: '1px solid #c8d8c3',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-primary)',
              fontSize: '0.92rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--color-accent-gold)' }} />
            <span>Congratulations! Your order qualifies for <strong>FREE Delivery</strong> across Sri Lanka.</span>
          </div>
        ) : (
          <div
            style={{
              padding: '0.9rem 1.25rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              color: '#92400e',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--color-accent-gold)' }} />
            <span>
              Add <strong>{formatLKR(amountNeededForFreeDelivery)}</strong> more of books to unlock <strong>FREE Delivery</strong>!
            </span>
          </div>
        )}

        {/* Grid: Cart Items (Left) & Order Summary (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Left: Cart Items List */}
          <div style={{ gridColumn: 'span 2' }}>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Book</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map((item) => (
                      <tr key={item.id}>
                        {/* Book info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Link to={`/books/${item.bookId}`}>
                              <img
                                src={item.coverPath || '/covers/default-book.svg'}
                                alt={item.title}
                                style={{
                                  width: '48px',
                                  height: '70px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: '1px solid var(--color-border)',
                                }}
                              />
                            </Link>
                            <div>
                              <Link
                                to={`/books/${item.bookId}`}
                                style={{ fontWeight: 700, color: 'var(--color-text-main)', display: 'block', fontSize: '0.95rem' }}
                              >
                                {item.title}
                              </Link>
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {item.authorNames || item.isbn}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Unit price */}
                        <td style={{ fontWeight: 600 }}>{formatLKR(item.price)}</td>

                        {/* Quantity */}
                        <td>
                          <QuantitySelector
                            quantity={item.quantity}
                            onChange={(newQty) => updateQuantity(item.id, newQty)}
                            min={1}
                            max={item.availableStock || 99}
                          />
                        </td>

                        {/* Line total */}
                        <td style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                          {formatLKR(item.lineTotal)}
                        </td>

                        {/* Remove button */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="btn btn-ghost btn-sm"
                            title="Remove from bag"
                            aria-label={`Remove ${item.title}`}
                          >
                            <Trash2 size={16} color="var(--color-danger)" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions under list */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
              }}
            >
              <Link to="/books" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowLeft size={16} /> Continue Shopping
              </Link>

              <button
                type="button"
                onClick={() => setClearDialogOpen(true)}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--color-danger)' }}
              >
                Clear Entire Bag
              </button>
            </div>
          </div>

          {/* Right: Order Summary Card */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                Bag Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Subtotal ({cart.totalQuantity} items)</span>
                  <span style={{ fontWeight: 600 }}>{formatLKR(cart.subtotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Delivery Fee</span>
                  <span style={{ fontWeight: 600 }}>
                    {cart.deliveryFee === 0 ? (
                      <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>FREE</span>
                    ) : (
                      formatLKR(cart.deliveryFee)
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    paddingTop: '1rem',
                    borderTop: '2px solid var(--color-border)',
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--color-primary)' }}>{formatLKR(cart.total)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Cash on delivery accepted upon arrival
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Bag Confirmation Dialog */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        title="Clear Shopping Bag"
        message="Are you sure you want to remove all books from your shopping bag? This cannot be undone."
        confirmLabel="Clear Bag"
        isDanger={true}
        loading={clearing}
        onConfirm={handleClear}
        onCancel={() => setClearDialogOpen(false)}
      />
    </div>
  );
}
