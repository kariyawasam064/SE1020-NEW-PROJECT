import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { apiClient } from '../api/client';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters from query params
  const query = searchParams.get('query') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDirection = searchParams.get('sortDirection') || 'desc';
  const page = parseInt(searchParams.get('page') || '0', 10);

  // Local search input
  const [searchInput, setSearchInput] = useState(query);

  // Load categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiClient.get('/api/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch books when searchParams change
  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const params = {
          page,
          size: 12,
          sortBy,
          sortDirection,
        };
        if (query) params.query = query;
        if (categoryId) params.categoryId = categoryId;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        const res = await apiClient.get('/api/books', { params });
        setBooks(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
      } catch (err) {
        console.error('Failed to fetch books', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, [query, categoryId, minPrice, maxPrice, sortBy, sortDirection, page]);

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value !== null && value !== '' && value !== undefined) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.set('page', '0'); // Reset to first page on filter change
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('query', searchInput.trim());
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasActiveFilters = query || categoryId || minPrice || maxPrice;

  return (
    <div style={{ padding: '2.5rem 0 5rem' }}>
      <div className="container">
        {/* Title Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.6rem', marginBottom: '0.4rem' }}>
            The Bookshop
          </h1>
        </div>




        {/* Books Grid */}
        {loading ? (
          <LoadingSpinner text="Searching catalogue..." />
        ) : books.length === 0 ? (
          <EmptyState
            title="No matching books found"
            message="We couldn't find any books matching your current search or filter criteria."
            action={
              <button onClick={clearAllFilters} className="btn btn-secondary">
                Reset Filters
              </button>
            }
          />
        ) : (
          <>
            <div className="book-grid">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            <Pagination
              pageNumber={page}
              totalPages={totalPages}
              onPageChange={(newPage) => updateParam('page', newPage.toString())}
            />
          </>
        )}
      </div>
    </div>
  );
}
