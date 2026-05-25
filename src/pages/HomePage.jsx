import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getEvents, getCategories, getRecommendedEvents } from '../services/eventService'
import { useAuth } from '../context/AuthContext'
import { useCity } from '../context/CityContext'
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

const heroImages = [
  '/images/hero-bg.jpg',
  '/images/hero-bg2.jpg',
  '/images/hero-bg3.jpg',
  '/images/hero-bg4.jpg',
]

function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const { selectedCity } = useCity()
  const [allEvents, setAllEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [recommendedEvents, setRecommendedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentBgIndex, setCurrentBgIndex] = useState(0)
  const fetchedRef = useRef(false)

  useEffect(() => {
    fetchData()
  }, [selectedCity, isAuthenticated])

  // Background image slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedCity) params.city = selectedCity

      const [eventsData, categoriesData] = await Promise.all([
        getEvents(1, 20, params),
        getCategories()
      ])
      setAllEvents(eventsData.results || eventsData)
      setCategories(categoriesData.results || categoriesData)

      // Fetch recommendations for authenticated users
      if (isAuthenticated) {
        try {
          const recommended = await getRecommendedEvents(6)
          setRecommendedEvents(recommended)
        } catch (err) {
          console.error('Error fetching recommendations:', err)
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Shuffle array for random selection
  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Trending = latest events
  const trendingEvents = [...allEvents].sort((a, b) => b.id - a.id).slice(0, 6)

  // Featured = random selection
  const featuredEvents = shuffleArray(allEvents).slice(0, 4)

  if (loading) {
    return <Spinner.Page message="Loading..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Animated Background */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        {/* Animated Background Images */}
        {heroImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentBgIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover scale-105 animate-slow-zoom"
            />
          </div>
        ))}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

        {/* Hero Content */}
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 drop-shadow-lg">
            Discover Amazing
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-gradient">
              Live Events
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl drop-shadow">
            Find and book tickets for concerts, movies, sports, theatre and more.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-2xl mb-8">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search events, artists, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    window.location.href = `/discover?search=${encodeURIComponent(searchQuery)}`
                  }
                }}
                className="w-full px-6 py-5 pl-14 text-lg rounded-full bg-white/95 backdrop-blur-sm shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all"
              />
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <Link
                  to={`/discover?search=${encodeURIComponent(searchQuery)}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-lg transition-all"
                >
                  Search
                </Link>
              )}
            </div>
          </div>

          {/* Quick Category Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.slice(0, 5).map(category => (
              <Link
                key={category.id}
                to={`/discover?category=${category.id}`}
                className="px-5 py-2.5 rounded-full font-medium bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition-all border border-white/20 hover:border-white/40 hover:scale-105"
              >
                {categoryIcons[category.name] || categoryIcons.default} {category.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* Image Indicators */}
        <div className="absolute bottom-8 right-8 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBgIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentBgIndex
                  ? 'bg-white w-8'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Trending Events */}
      {trendingEvents.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">🔥</span> Trending Now
                </h2>
                <p className="text-gray-500 mt-2">Most popular events this week</p>
              </div>
              <Link
                to="/discover"
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-lg transition-all"
              >
                View All
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingEvents.map((event, idx) => (
                <div key={event.id} className="relative group">
                  {idx < 3 && (
                    <div className="absolute -top-3 -left-3 z-10 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold">#{idx + 1}</span>
                    </div>
                  )}
                  <EventCard event={event} />
                </div>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-lg transition-all"
              >
                View All Events
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recommended For You (Auth users only) */}
      {isAuthenticated && recommendedEvents.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-primary-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">💡</span> Recommended For You
                </h2>
                <p className="text-gray-500 mt-2">Based on your booking history</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">⭐</span> Featured Events
                </h2>
                <p className="text-gray-400 mt-2">Hand-picked experiences for you</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredEvents.slice(0, 4).map(event => (
                <EventCard key={event.id} event={event} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Category */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Browse by Category
            </h2>
            <p className="text-gray-500 mt-2">Find events that match your interests</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map(category => (
              <Link
                key={category.id}
                to={`/discover?category=${category.id}`}
                className="group p-8 bg-white rounded-2xl hover:shadow-xl transition-all text-center border border-gray-100 hover:border-primary-200 hover:-translate-y-1"
              >
                <span className="text-5xl mb-4 block transform group-hover:scale-110 transition-transform">
                  {categoryIcons[category.name] || categoryIcons.default}
                </span>
                <span className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-bg4.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 to-purple-900/95" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {isAuthenticated ? (
            <>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Welcome back, {user?.first_name || user?.username}!
              </h2>
              <p className="text-xl text-white/80 mb-10">
                Ready for your next experience? Browse the latest events and book your seats.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Browse Events
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/my-bookings"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-all"
                >
                  View My Bookings
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Never Miss an Event
              </h2>
              <p className="text-xl text-white/80 mb-10">
                Sign up to get personalized recommendations and exclusive early access.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Get Started Free
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-all"
                >
                  Explore Events
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage
