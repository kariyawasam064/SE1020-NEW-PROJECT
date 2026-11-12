import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  Star,
  Phone,
  User,
  Home,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

function formatPhoneNumber(phone) {
  if (!phone) return 'Not provided';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length === 10 && clean.startsWith('0')) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return phone;
}

function getInitial(name) {
  if (!name) return 'A';
  return name.trim().charAt(0).toUpperCase();
}

const CustomerAddressesPage = () => {
  const { showSuccess, showError } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState(null);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
    } catch (err) {
      showError('Failed to load saved addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingAddress(null);
    setRecipient('');
    setPhone('');
    setLine1('');
    setLine2('');
    setCity('');
    setPostalCode('');
    setIsDefault(addresses.length === 0);
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setRecipient(addr.recipient || '');
    setPhone(addr.phone || '');
    setLine1(addr.line1 || '');
    setLine2(addr.line2 || '');
    setCity(addr.city || '');
    setPostalCode(addr.postalCode || '');
    setIsDefault(addr.isDefault || false);
    setModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      recipient,
      phone,
      line1,
      line2,
      city,
      postalCode,
      isDefault
    };

    try {
      if (editingAddress) {
        await api.patch(`/addresses/${editingAddress.id}`, payload);
        showSuccess('Address updated successfully');
      } else {
        await api.post('/addresses', payload);
        showSuccess('New address saved successfully');
      }
      setModalOpen(false);
      fetchAddresses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (addrId) => {
    try {
      await api.patch(`/addresses/${addrId}/default`);
      showSuccess('Default shipping address updated');
      fetchAddresses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to set default address');
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/addresses/${deleteId}`);
      showSuccess('Address deleted successfully');
      setDeleteId(null);
      fetchAddresses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete address');
    }
  };

  if (loading) return <LoadingSpinner message="Loading your addresses..." />;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.15rem',
              color: '#16362c',
              margin: 0,
              letterSpacing: '-0.01em'
            }}>
              Delivery Addresses
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.2rem 0.6rem',
              backgroundColor: '#f0f3ec',
              border: '1px solid #d9e0d4',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#204b3e'
            }}>
              {addresses.length} {addresses.length === 1 ? 'Destination' : 'Destinations'}
            </span>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            fontSize: '0.92rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(32, 75, 62, 0.2)'
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e8e1',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(32, 44, 41, 0.04)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#f2f5ee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#204b3e',
            margin: '0 auto 1.25rem'
          }}>
            <MapPin size={32} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#16362c', marginBottom: '0.5rem' }}>
            No addresses saved yet
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '440px', margin: '0 auto 1.75rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Add your residential or office address so we can deliver your physical books directly to your door.
          </p>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            Add First Address
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}>
          {addresses.map((addr) => {
            const isDef = Boolean(addr.isDefault);
            const initial = getInitial(addr.recipient);

            return (
              <div
                key={addr.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: isDef ? '2px solid #204b3e' : '1px solid #e3e6de',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  boxShadow: isDef
                    ? '0 6px 20px rgba(32, 75, 62, 0.08)'
                    : '0 2px 10px rgba(32, 44, 41, 0.04)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Top Header Row: Avatar, Name & Default Badge / Quick Set */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginBottom: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      {/* Avatar circle */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: isDef ? '#204b3e' : '#f0f3ec',
                        color: isDef ? '#ffffff' : '#204b3e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        fontFamily: 'var(--font-serif)',
                        flexShrink: 0,
                        border: isDef ? 'none' : '1px solid #dce2d6'
                      }}>
                        {initial}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <h3 style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: '#16362c',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {addr.recipient}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#738279', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                          Recipient
                        </span>
                      </div>
                    </div>

                    {/* Default Indicator or Set Default button */}
                    {isDef ? (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#065f46',
                        letterSpacing: '0.04em',
                        flexShrink: 0
                      }}>
                        <Check size={12} strokeWidth={3} />
                        <span>DEFAULT</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.25rem 0.6rem',
                          backgroundColor: '#f8f9f6',
                          border: '1px solid #e0e4da',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#55695d',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#ecfdf5';
                          e.currentTarget.style.borderColor = '#a7f3d0';
                          e.currentTarget.style.color = '#065f46';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9f6';
                          e.currentTarget.style.borderColor = '#e0e4da';
                          e.currentTarget.style.color = '#55695d';
                        }}
                        title="Set this as your default shipping destination"
                      >
                        <Star size={11} />
                        <span>Set Default</span>
                      </button>
                    )}
                  </div>

                  {/* Phone contact chip */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.25rem 0.65rem',
                    backgroundColor: '#f7f9f5',
                    border: '1px solid #e5e9e0',
                    borderRadius: '6px',
                    fontSize: '0.83rem',
                    color: '#3d4d44',
                    fontWeight: 500,
                    marginBottom: '1rem'
                  }}>
                    <Phone size={13} color="#60766a" />
                    <span>{formatPhoneNumber(addr.phone)}</span>
                  </div>

                  {/* Structured Shipping Destination Box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#fafbf9',
                    border: '1px solid #edf0ea',
                    borderRadius: '10px',
                    marginBottom: '1.25rem',
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    color: '#2a3b33'
                  }}>
                    <MapPin size={16} color="#204b3e" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#16362c' }}>{addr.line1}</div>
                      {addr.line2 && <div style={{ color: '#4b5e54' }}>{addr.line2}</div>}
                      <div style={{ color: '#687d72', marginTop: '2px', fontSize: '0.82rem', fontWeight: 500 }}>
                        {addr.city}{addr.postalCode ? ` • ${addr.postalCode}` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid #f0f2eb'
                }}>
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="btn btn-outline"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: '#204b3e',
                      borderColor: '#d2dcd0',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f7faf5';
                      e.currentTarget.style.borderColor = '#204b3e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#d2dcd0';
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteId(addr.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fff5f5',
                      color: '#dc2626',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                    title="Delete Address"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff5f5';
                      e.currentTarget.style.borderColor = '#fecaca';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Another Address Dashed Quick Card */}
          <div
            onClick={openAddModal}
            style={{
              borderRadius: '16px',
              border: '2px dashed #cfd7ca',
              backgroundColor: '#fafbfa',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              minHeight: '240px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#204b3e';
              e.currentTarget.style.backgroundColor = '#f4f7f1';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cfd7ca';
              e.currentTarget.style.backgroundColor = '#fafbfa';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #d5dfd0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#204b3e',
              marginBottom: '0.85rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#16362c',
              marginBottom: '0.25rem'
            }}>
              Add Another Address
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0, maxWidth: '200px' }}>
              Save a new home, office, or gift delivery destination
            </p>
          </div>
        </div>
      )}

      {/* Address Form Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 40, 35, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e4e7df',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#f0f3eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#204b3e'
              }}>
                <MapPin size={18} />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.45rem',
                color: '#16362c',
                margin: 0
              }}>
                {editingAddress ? 'Edit Delivery Address' : 'Add Delivery Address'}
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem', marginBottom: '1.5rem' }}>
              Ensure your recipient name and phone are accurate for hassle-free courier delivery.
            </p>

            <form onSubmit={handleSaveAddress}>
              <FormField label="Recipient Name" required>
                <input
                  className="form-input"
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  required
                />
              </FormField>

              <FormField label="Contact Phone Number" required>
                <input
                  className="form-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 077 123 4567"
                  required
                />
              </FormField>

              <FormField label="Address Line 1" required>
                <input
                  className="form-input"
                  type="text"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="House / Apartment number, Street name"
                  required
                />
              </FormField>

              <FormField label="Address Line 2 (Optional)">
                <input
                  className="form-input"
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Suite, building, landmark"
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="City / Region" required>
                  <input
                    className="form-input"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Dehiwala"
                    required
                  />
                </FormField>

                <FormField label="Postal Code" required>
                  <input
                    className="form-input"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 10350"
                    required
                  />
                </FormField>
              </div>

              {/* Set as default checkbox */}
              <div style={{
                margin: '1.25rem 0 1.75rem',
                padding: '0.85rem 1rem',
                backgroundColor: '#f8f9f6',
                borderRadius: '8px',
                border: '1px solid #e4e7df'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#2a3b33'
                }}>
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#204b3e' }}
                  />
                  <span>Set as default shipping destination</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline"
                  style={{ borderRadius: '8px', padding: '0.55rem 1.15rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ borderRadius: '8px', padding: '0.55rem 1.35rem' }}
                >
                  {submitting ? 'Saving...' : editingAddress ? 'Save Changes' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Address"
        message="Are you sure you want to remove this delivery address? Historical orders linked to this address will not be affected."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteAddress}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default CustomerAddressesPage;
