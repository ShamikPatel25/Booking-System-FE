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
  }, [selectedCity])

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data.results || data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchEvents = async (pageNum = 1, reset = false) => {
    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = {}
      if (selectedCategory) params.category = selectedCategory
      if (searchQuery) params.search = searchQuery
      if (selectedCity) params.city = selectedCity

      const data = await getEvents(pageNum, PAGE_SIZE, params)
      const results = data.results || data

      if (reset) {
        setEvents(results)
      } else {
        setEvents(prev => [...prev, ...results])
      }

      setHasMore(data.next !== null && results.length === PAGE_SIZE)
      setPage(pageNum)
    } catch (err) {
      setError('Failed to load events')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Reset and reload when category filter changes
  useEffect(() => {
    if (!fetchedRef.current) return
    setPage(1)
    setHasMore(true)
    fetchEvents(1, true)

    // Update URL params
    const params = new URLSearchParams()
    if (selectedCategory) params.set('category', selectedCategory)
    if (searchQuery) params.set('search', searchQuery)
    setSearchParams(params)
  }, [selectedCategory, searchQuery])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return
    fetchEvents(page + 1, false)
  }, [page, loadingMore, hasMore, loading])

  // Intersection Observer for infinite scroll
  const lastEventRef = useCallback(node => {
    if (loading || loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, { rootMargin: '200px' })

    if (node) observerRef.current.observe(node)
  }, [loading, loadingMore, hasMore, loadMore])

  // Client-side search filter (search happens on loaded events)
  const filteredEvents = events
    .filter(event => {
      const matchesSearch = !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'latest') return new Date(b.created_at) - new Date(a.created_at)
      return 0
    })

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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="title">A-Z</option>
              <option value="latest">Latest</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 && !loading ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredEvents.map((event, index) => {
            const isLast = index === filteredEvents.length - 1
            return (
              <Link
                key={event.id}
                ref={isLast ? lastEventRef : null}
                to={`/events/${event.id}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
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
