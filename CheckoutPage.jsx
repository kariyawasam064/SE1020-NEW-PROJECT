import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, CheckCircle, Plus, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatLKR } from '../utils/formatters';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cart, refreshCart } = useCart();
  const { showSuccess, showError } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // New Address inline form
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLine1, setNewLine1] = useState('');
  const [newLine2, setNewLine2] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Quote & Checkout state
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutKey] = useState(() => 'chk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8));

  // Load addresses on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadAddresses() {
      setLoadingAddresses(true);
      try {
        const res = await apiClient.get('/api/addresses');
        setAddresses(res.data);
        if (res.data.length > 0) {
          const defaultAddr = res.data.find((a) => a.isDefault) || res.data[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setShowNewAddress(true);
        }
      } catch (err) {
        console.error('Failed to load addresses', err);
      } finally {
        setLoadingAddresses(false);
      }
    }
    loadAddresses();
  }, [isAuthenticated]);

  // Request quote whenever selected address changes
  useEffect(() => {
    if (!selectedAddressId || cart.items.length === 0) return;

    async function fetchQuote() {
      setLoadingQuote(true);
      try {
        const res = await apiClient.get('/api/checkout/quote', { params: { addressId: selectedAddressId } });
        setQuote(res.data);
      } catch (err) {
        try {
          const res = await apiClient.post('/api/checkout/quote', { addressId: selectedAddressId });
          setQuote(res.data);
        } catch (e) {
          console.error('Failed to retrieve quote', e);
        }
      } finally {
        setLoadingQuote(false);
      }
    }
    fetchQuote();
  }, [selectedAddressId, cart.items.length]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await apiClient.post('/api/addresses', {
        recipient: newRecipient,
        phone: newPhone,
        line1: newLine1,
        line2: newLine2,
        city: newCity,
        postalCode: newPostalCode,
        isDefault: addresses.length === 0,
      });
      setAddresses([res.data, ...addresses]);
      setSelectedAddressId(res.data.id);
      setShowNewAddress(false);
      showSuccess('Delivery address saved.');
    } catch (err) {
      showError(err.message || 'Could not save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showError('Please select or add a delivery address.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        addressId: selectedAddressId,
        paymentMethod: 'CASH_ON_DELIVERY',
        checkoutKey,
        expectedSubtotal: quote ? quote.subtotal : cart.subtotal,
      };

      let res;
      try {
        res = await apiClient.post('/api/orders', payload);
      } catch (orderErr) {
        // Fallback to /api/checkout if needed
        res = await apiClient.post('/api/checkout', payload);
      }

      await refreshCart();
      showSuccess('Order successfully placed!');
      navigate(`/orders/${res.data.id}?placed=true`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Checkout failed. Please check available stock and try again.';
      showError(errMsg);
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login?redirect=/checkout');
    return null;
  }

  if (cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>No Items to Checkout</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          Your bag is currently empty. Please add books before checking out.
        </p>
        <Link to="/books" className="btn btn-primary">
          Browse Bookshop
        </Link>
      </div>
    );
  }

  const activeSubtotal = quote ? quote.subtotal : cart.subtotal;
  const activeDeliveryFee = quote ? quote.deliveryFee : cart.deliveryFee;
  const activeTotal = quote ? quote.total : cart.total;

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        <Link
          to="/cart"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}
        >
          <ArrowLeft size={16} /> Return to Bag
        </Link>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '2rem' }}>
          Checkout &amp; Confirmation
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Address & Payment */}
          <div style={{ gridColumn: 'span 2' }}>
            {/* 1. Delivery Address Card */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
                  1. Delivery Destination
                </h3>
                {!showNewAddress && (
                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Plus size={14} /> Add New Address
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <LoadingSpinner text="Loading saved addresses..." size="sm" />
              ) : showNewAddress ? (
                <form onSubmit={handleCreateAddress}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField
                      label="Recipient Full Name"
                      name="recipient"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="Jane Doe"
                      required
                    />
                    <FormField
                      label="Contact Phone"
                      name="phone"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="077 123 4567"
                      required
                    />
                  </div>

                  <FormField
                    label="Address Line 1"
                    name="line1"
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                    placeholder="House number, street address"
                    required
                  />

                  <FormField
                    label="Address Line 2 (Optional)"
                    name="line2"
                    value={newLine2}
                    onChange={(e) => setNewLine2(e.target.value)}
                    placeholder="Apartment, suite, unit, building"
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FormField
                      label="City"
                      name="city"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="Colombo"
                      required
                    />
                    <FormField
                      label="Postal Code"
                      name="postalCode"
                      value={newPostalCode}
                      onChange={(e) => setNewPostalCode(e.target.value)}
                      placeholder="00700"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowNewAddress(false)}
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary btn-sm" disabled={savingAddress}>
                      {savingAddress ? 'Saving...' : 'Save & Deliver Here'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${selectedAddressId === addr.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: selectedAddressId === addr.id ? 'var(--color-surface-muted)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="addressSelector"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        style={{ marginTop: '3px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <strong style={{ fontSize: '0.98rem' }}>{addr.recipient}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>({addr.phone})</span>
                          {addr.isDefault && <span className="badge badge-green">Default</span>}
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', margin: 0 }}>
                          {addr.fullAddress}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Payment Method Card (Strictly Cash on Delivery) */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', marginBottom: '1.25rem' }}>
                2. Payment Method
              </h3>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--color-primary)',
                  backgroundColor: 'var(--color-surface-muted)',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Truck size={20} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--color-text-main)' }}>
                    Cash on Delivery (COD)
                  </strong>
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                    Pay with physical cash in Sri Lankan Rupees (LKR) when our courier delivers your parcel.
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Items Review */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', marginBottom: '1.25rem' }}>
                3. Order Items Review ({cart.totalQuantity} books)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img
                        src={item.coverPath || '/covers/default-book.svg'}
                        alt={item.title}
                        style={{ width: '40px', height: '58px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-main)' }}>{item.title}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          Qty: {item.quantity} &times; {formatLKR(item.price)}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formatLKR(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Confirmation Button */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                Order Summary
              </h3>

              {loadingQuote ? (
                <LoadingSpinner text="Updating verified quote..." size="sm" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>{formatLKR(activeSubtotal)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Delivery Fee</span>
                    <span style={{ fontWeight: 600 }}>
                      {activeDeliveryFee === 0 ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>FREE</span>
                      ) : (
                        formatLKR(activeDeliveryFee)
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      paddingTop: '1rem',
                      borderTop: '2px solid var(--color-border)',
                    }}
                  >
                    <span>Final Total</span>
                    <span style={{ color: 'var(--color-primary)' }}>{formatLKR(activeTotal)}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submittingOrder || !selectedAddressId}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                {submittingOrder ? 'Securing Order...' : 'Place Order'}
              </button>

              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
                <ShieldCheck size={16} style={{ verticalAlign: 'middle', marginRight: '4px', color: 'var(--color-accent-gold)' }} />
                Your physical copies will be reserved immediately upon placing your order.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
