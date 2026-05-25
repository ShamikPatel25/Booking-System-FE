import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getEvents, getCategories } from '../services/eventService'
import EventCard from '../components/EventCard'
import { Spinner } from '../components/ui'

const categoryIcons = {
  'Movies': '🎬',
  'Concerts': '🎵',
  'Sports': '⚽',
  'Theatre': '🎭',
  'Comedy': '😂',
  'default': '🎪'
}

const PAGE_SIZE = 8

function HomePage() {
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchedRef = useRef(false)
  const observerRef = useRef(null)

  // Initial load - categories only
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchCategories()
    fetchEvents(1, true)
  }, [])

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
      console.error('Error fetching events:', err)
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

  // Filter events client-side for instant search feedback
  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true
    return event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const featuredEvents = !searchQuery && !selectedCategory ? events.slice(0, 4) : []

  if (loading && events.length === 0) {
    return <Spinner.Page message="Loading events..." />
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
              Discover Amazing
              <span className="block text-yellow-400">Live Events</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Find and book tickets for concerts, movies, sports, theatre and more.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events, artists, venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-14 text-lg rounded-full bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
                />
                <svg
                  className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Quick Category Buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {categories.slice(0, 5).map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                  className={`
                    px-4 py-2 rounded-full font-medium transition-all
                    ${selectedCategory === category.id
                      ? 'bg-white text-primary-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }
                  `}
                >
                  {categoryIcons[category.name] || categoryIcons.default} {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Featured Events
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredEvents.slice(0, 2).map(event => (
                <EventCard key={event.id} event={event} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {!searchQuery && !selectedCategory && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Browse by Category
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="group p-6 bg-gray-50 rounded-xl hover:bg-primary-50 hover:shadow-md transition-all text-center"
                >
                  <span className="text-4xl mb-3 block">
                    {categoryIcons[category.name] || categoryIcons.default}
                  </span>
                  <span className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Events with Lazy Loading */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.name || 'Events'
                  : searchQuery
                  ? 'Search Results'
                  : 'All Events'
                }
              </h2>
              {(selectedCategory || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSearchQuery('')
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 mt-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {filteredEvents.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search.</p>
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSearchQuery('')
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                View all events
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEvents.map((event, index) => {
                  const isLast = index === filteredEvents.length - 1
                  return (
                    <div key={event.id} ref={isLast ? lastEventRef : null}>
                      <EventCard event={event} />
                    </div>
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
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Never Miss an Event
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Sign up to get personalized recommendations.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started Free
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
