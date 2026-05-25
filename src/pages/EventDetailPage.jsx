import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getEventById, getEventShows } from '../services/eventService'
import { Spinner, Badge } from '../components/ui'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Category gradients
const categoryGradients = {
  'Movies': 'from-blue-600 to-indigo-700',
  'Concerts': 'from-purple-600 to-pink-600',
  'Sports': 'from-green-600 to-emerald-700',
  'Theatre': 'from-red-600 to-orange-600',
  'Comedy': 'from-yellow-500 to-orange-500',
  'default': 'from-primary-600 to-indigo-700',
}

function EventDetailPage() {
  const { id } = useParams()

  const [event, setEvent] = useState(null)
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const fetchedRef = useRef(false)
  const lastIdRef = useRef(null)

  useEffect(() => {
    // Reset if id changes
    if (lastIdRef.current !== id) {
      fetchedRef.current = false
      lastIdRef.current = id
    }
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchEventData()
  }, [id])

  const fetchEventData = async () => {
    try {
      const [eventData, showsData] = await Promise.all([
        getEventById(id),
        getEventShows(id)
      ])
      setEvent(eventData)
      const showsList = showsData.results || showsData
      setShows(showsList)

      // Set first date as selected
      if (showsList.length > 0) {
        setSelectedDate(showsList[0].show_date)
      }
    } catch (err) {
      setError('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatDateShort = (dateStr) => {
    const date = new Date(dateStr)
    return {
      day: date.toLocaleDateString('en-IN', { day: 'numeric' }),
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      weekday: date.toLocaleDateString('en-IN', { weekday: 'short' })
    }
  }

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(hours, minutes)
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Get unique dates
  const uniqueDates = [...new Set(shows.map(s => s.show_date))].sort()

  // Filter shows by selected date
  const filteredShows = selectedDate
    ? shows.filter(s => s.show_date === selectedDate)
    : shows

  const categoryName = event?.category?.name || 'Event'
  const gradient = categoryGradients[categoryName] || categoryGradients.default
  const posterUrl = event?.poster ? (event.poster.startsWith('http') ? event.poster : `${API_URL}${event.poster}`) : null

  if (loading) {
    return <Spinner.Page message="Loading event details..." />
  }

  if (error || !event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
        <p className="text-gray-500 mb-6">{error || 'Event not found'}</p>
        <Link
          to="/"
          className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className={`relative bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster */}
            <div className="w-48 h-64 md:w-56 md:h-80 flex-shrink-0 shadow-2xl rounded-xl overflow-hidden">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-8xl text-white/30 font-bold">
                    {event.title?.[0] || 'E'}
                  </span>
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="flex-1">
              <Badge variant="primary" className="bg-white/20 text-white mb-4">
                {categoryName}
              </Badge>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-white/90 mb-6">
                {event.language && (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    {event.language}
                  </span>
                )}
                {event.duration_minutes && (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {event.duration_minutes} minutes
                  </span>
                )}
              </div>

              {/* Price indicator */}
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-white/70 mr-2">Starting from</span>
                <span className="text-2xl font-bold text-white">₹150</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {event.description && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </section>
            )}

            {/* Shows */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Select Show</h2>

              {/* Date Selector */}
              {uniqueDates.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Select Date</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    {uniqueDates.map(date => {
                      const { day, month, weekday } = formatDateShort(date)
                      const isSelected = selectedDate === date
                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`
                            flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all
                            ${isSelected
                              ? 'bg-primary-500 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          <div className="text-xs font-medium">{weekday}</div>
                          <div className="text-xl font-bold">{day}</div>
                          <div className="text-xs">{month}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Show Times */}
              {filteredShows.length > 0 ? (
                <div className="space-y-4">
                  {filteredShows.map((show) => (
                    <div
                      key={show.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {formatTime(show.start_time)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(show.show_date)}
                          </div>
                        </div>

                        <div className="h-10 w-px bg-gray-200" />

                        <div>
                          <div className="font-medium text-gray-900">
                            {show.screen?.venue?.name || 'Venue'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {show.screen?.name || 'Screen'}
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/shows/${show.id}/seats`}
                        className="px-6 py-2.5 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Select Seats
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🎭</div>
                  <p className="text-gray-500">No shows available for this date</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Venue Info */}
              {shows[0]?.screen?.venue && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Venue</h3>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {shows[0].screen.venue.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shows[0].screen.venue.city}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Instant confirmation
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mobile ticket
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Free cancellation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetailPage
