import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Check, ArrowLeft, Truck, ShieldCheck, MessageSquarePlus } from 'lucide-react';
import { apiClient } from '../api/client';
import { formatLKR, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import QuantitySelector from '../components/QuantitySelector';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Review Form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bookRes, reviewsRes] = await Promise.all([
          apiClient.get(`/api/books/${id}`),
          apiClient.get(`/api/books/${id}/reviews`),
        ]);
        setBook(bookRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error('Failed to load book details', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      setAdding(true);
      await addToCart(book.id, quantity);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch {
      // Toast handles error
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setSubmittingReview(true);
    try {
      await apiClient.post(`/api/books/${book.id}/reviews`, { rating, comment });
      showSuccess('Your review has been submitted for moderation! It will appear once approved by our curators.');
      setShowReviewForm(false);
      setComment('');
    } catch (err) {
      showError(err.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Opening the book..." />;
  }

  if (!book) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Book Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          We could not find the volume you are looking for in our catalogue.
        </p>
        <Link to="/books" className="btn btn-primary">
          Return to Bookshop
        </Link>
      </div>
    );
  }

  const authorNames = book.authors?.map((a) => a.name).join(', ') || 'Unknown Author';

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        {/* Back Link */}
        <Link
          to="/books"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '2rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Bookshop
        </Link>

        {/* Book Main Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3.5rem',
            marginBottom: '4rem',
          }}
        >
          {/* Left: Book Cover */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                aspectRatio: '2 / 3',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}
            >
              <img
                src={book.coverPath || '/covers/default-book.svg'}
                alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = '/covers/default-book.svg';
                }}
              />
            </div>
          </div>

          {/* Right: Book Details & Purchase Panel */}
          <div>
            {book.category && (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent-gold)',
                  marginBottom: '0.5rem',
                }}
              >
                {book.category.name}
              </span>
            )}

            <h1
              style={{
                fontSize: '2.5rem',
                fontFamily: 'var(--font-serif)',
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: '0.5rem',
              }}
            >
              {book.title}
            </h1>

            <p style={{ fontSize: '1.15rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              By <strong>{authorNames}</strong>
            </p>

            {/* Rating display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.75rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {book.averageRating ? (
                <>
                  <div style={{ display: 'flex', color: '#d97706' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        fill={i < Math.round(book.averageRating) ? '#d97706' : 'none'}
                        stroke="#d97706"
                      />
                    ))}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{book.averageRating.toFixed(1)}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    ({book.reviewCount} customer reviews)
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No reviews yet</span>
              )}
            </div>

            {/* Price & Stock */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                {formatLKR(book.price)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
                {book.inStock ? (
                  <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Check size={16} /> In Stock ({book.stockQuantity} copies available)
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Currently Out of Stock</span>
                )}
              </div>
            </div>

            {/* Add to Cart Actions */}
            {book.inStock && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '2rem',
                  paddingBottom: '2rem',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <QuantitySelector
                  quantity={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={book.stockQuantity}
                  disabled={adding}
                />
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`btn btn-lg ${justAdded ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flex: 1, maxWidth: '280px' }}
                >
                  {justAdded ? (
                    <>
                      <Check size={18} /> Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} /> Add to Bag
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Book Description */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-sans)', fontWeight: 700, marginBottom: '0.65rem' }}>
                Overview
              </h3>
              <p style={{ color: 'var(--color-text-main)', fontSize: '0.98rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {book.description || 'No detailed synopsis available for this volume.'}
              </p>
            </div>

            {/* Book Specifications */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>ISBN: </span>
                  <strong style={{ color: 'var(--color-text-main)' }}>{book.isbn}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Category: </span>
                  <strong style={{ color: 'var(--color-text-main)' }}>{book.category?.name || 'General'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Format: </span>
                  <strong style={{ color: 'var(--color-text-main)' }}>Physical Book (Hardcover / Paperback)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Delivery: </span>
                  <strong style={{ color: 'var(--color-text-main)' }}>Cash on Delivery Island-wide</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Author Details Section */}
        {book.authors && book.authors.length > 0 && (
          <div className="card" style={{ marginBottom: '4rem', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
              About the Author{book.authors.length > 1 ? 's' : ''}
            </h3>
            {book.authors.map((author) => (
              <div key={author.id} style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
                  {author.name}
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {author.biography || 'Literary biography not currently documented.'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Reviews Section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Reader Reviews</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
                Verified readers share their reflections on this volume.
              </p>
            </div>

            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="btn btn-secondary btn-sm"
            >
              <MessageSquarePlus size={16} /> Write a Review
            </button>
          </div>

          {/* Inline Write Review Form */}
          {showReviewForm && (
            <div className="card" style={{ marginBottom: '2.5rem', backgroundColor: '#ffffff' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Share Your Experience</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                Note: In accordance with our curation standards, reviews require a verified delivered purchase of this book.
              </p>

              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label className="form-label">Rating (1 to 5 Stars)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: star <= rating ? '#d97706' : '#d1d5db',
                        }}
                      >
                        <Star size={24} fill={star <= rating ? '#d97706' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="review-comment" className="form-label">Your Review <span className="required">*</span></label>
                  <textarea
                    id="review-comment"
                    className="form-control"
                    rows={4}
                    placeholder="What did you think of the themes, writing style, and key insights?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--color-border)',
              }}
            >
              <p style={{ color: 'var(--color-text-muted)' }}>
                No reviews yet for this volume. Be the first verified customer to share your thoughts!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {reviews.map((rev) => (
                <div key={rev.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>{rev.userName}</strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginLeft: '0.75rem' }}>
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', color: '#d97706' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={15}
                          fill={i < rev.rating ? '#d97706' : 'none'}
                          stroke="#d97706"
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ color: 'var(--color-text-main)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
