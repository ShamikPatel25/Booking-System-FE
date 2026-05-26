import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getEvents, getCategories } from '../services/eventService'
import { useCity } from '../context/CityContext'
import { Spinner } from '../components/ui'
import WishlistButton from '../components/WishlistButton'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const PAGE_SIZE = 12

function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedCity } = useCity()
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  // Filters from URL params
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState('title')

  const fetchedRef = useRef(false)
  const observerRef = useRef(null)

  useEffect(() => {
    fetchCategories()
    fetchEvents(1, true)
    fetchedRef.current = true
  }, [selectedCity])

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data.results || data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchEvents = async (pageNum = 1, reset = false, currentSort = sortBy) => {
    if (reset) {
      setLoading(true)
      setError('')
    } else {
      setLoadingMore(true)
    }

    try {
      const params = {}
      if (selectedCategory) params.category = selectedCategory
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (selectedCity) params.city = selectedCity

      // Server-side ordering
      if (currentSort === 'title') params.ordering = 'title'
      else if (currentSort === 'latest') params.ordering = '-created_at'

      const data = await getEvents(pageNum, PAGE_SIZE, params)
      const results = data.results || data

      if (reset) {
        setEvents(results)
      } else {
        // Append new events at the end (no re-sorting)
        setEvents(prev => [...prev, ...results])
      }

      setHasMore(data.next !== null && results.length === PAGE_SIZE)
      setPage(pageNum)
    } catch (err) {
      if (reset) {
        setError('Unable to load events')
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Reset and reload when filters change
  useEffect(() => {
    if (!fetchedRef.current) return
    setPage(1)
    setHasMore(true)
    fetchEvents(1, true)

    // Update URL params
    const params = new URLSearchParams()
    if (selectedCategory) params.set('category', selectedCategory)
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    setSearchParams(params)
  }, [selectedCategory, searchQuery])

  // Reset when sort changes
  useEffect(() => {
    if (!fetchedRef.current) return
    setPage(1)
    setHasMore(true)
    fetchEvents(1, true, sortBy)
  }, [sortBy])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return
    fetchEvents(page + 1, false)
  }, [page, loadingMore, hasMore, loading, selectedCategory, searchQuery, selectedCity, sortBy])

  // Intersection Observer for infinite scroll
  const lastEventRef = useCallback(node => {
    if (loading || loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, { rootMargin: '400px' })

    if (node) observerRef.current.observe(node)
  }, [loading, loadingMore, hasMore, loadMore])

  // Client-side search filter only (no sorting - server handles it)
  const trimmedSearch = searchQuery.trim().toLowerCase()
  const displayEvents = trimmedSearch
    ? events.filter(event =>
        event.title.toLowerCase().includes(trimmedSearch) ||
        event.description?.toLowerCase().includes(trimmedSearch)
      )
    : events

  const getPosterUrl = (poster) => {
    if (!poster) return null
    if (poster.startsWith('http')) return poster
    return `${API_URL}${poster}`
  }

  if (loading && events.length === 0) {
    return <Spinner.Page message="Loading events..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Events</h1>
        <p className="text-gray-600">Find movies, concerts, plays, and more</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="md:w-40">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="title">A-Z</option>
              <option value="latest">Latest</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 text-center py-12 bg-white rounded-xl shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Something went wrong</h3>
          <p className="text-gray-500 mb-4">We couldn't load the events. Please try again.</p>
          <button
            onClick={() => { setError(''); fetchEvents(1, true); }}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Events Grid */}
      {displayEvents.length === 0 && !loading && !error ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
          <p className="text-gray-500 mb-4">
            {trimmedSearch || selectedCategory
              ? "Try adjusting your search or filters"
              : "Check back later for new events"}
          </p>
          {(trimmedSearch || selectedCategory) && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : !error && (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {displayEvents.map((event, index) => {
            const isLast = index === displayEvents.length - 1
            return (
              <Link
                key={event.id}
                ref={isLast ? lastEventRef : null}
                to={`/events/${event.id}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${(index % PAGE_SIZE) * 50}ms` }}
              >
              {/* Poster */}
              <div className="aspect-[2/3] bg-gray-100 relative overflow-hidden">
                {event.poster ? (
                  <img
                    src={getPosterUrl(event.poster)}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-purple-100">
                    <span className="text-4xl font-bold text-primary-300">
                      {event.title[0]}
                    </span>
                  </div>
                )}

                {/* Category Badge */}
                {event.category && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-full">
                      {typeof event.category === 'object' ? event.category.name : event.category}
                    </span>
                  </div>
                )}

                {/* Wishlist Button */}
                <div className="absolute bottom-2 right-2 z-10">
                  <WishlistButton eventId={event.id} size="sm" />
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {event.title}
                </h3>
                {event.genres && (
                  <p className="mt-1 text-xs text-gray-600 line-clamp-1">{event.genres}</p>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  {event.language && (
                    <span>{event.language}</span>
                  )}
                  {event.duration_minutes && (
                    <>
                      <span>•</span>
                      <span>{event.duration_minutes} min</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
            )
          })}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-3 text-gray-500">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading more events...</span>
            </div>
          </div>
        )}

        {/* End of List */}
        {!hasMore && events.length > 0 && (
          <div className="text-center mt-8 text-gray-500">
            You've seen all events
          </div>
        )}
      </>
      )}
    </div>
  )
}

export default DiscoverPage
