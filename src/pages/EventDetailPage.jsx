import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getEventById, getEventShows } from '../services/eventService'
import { getEventReviews, getReviewStats, canReview } from '../services/reviewService'
import { useAuth } from '../context/AuthContext'
import { useCity } from '../context/CityContext'
import { Spinner, Badge } from '../components/ui'
import ShareButtons from '../components/ShareButtons'
import WishlistButton from '../components/WishlistButton'
import StarRating from '../components/StarRating'
import ReviewCard from '../components/ReviewCard'
import ReviewForm from '../components/ReviewForm'
import { formatDate, formatDateShort, formatTime } from '../utils/dateUtils'

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
  const { isAuthenticated } = useAuth()
  const { selectedCity } = useCity()

  const [event, setEvent] = useState(null)
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [canUserReview, setCanUserReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
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
      const [eventData, showsData, reviewsData, statsData] = await Promise.all([
        getEventById(id),
        getEventShows(id),
        getEventReviews(id),
        getReviewStats(id)
      ])
      setEvent(eventData)
      const showsList = showsData.results || showsData
      setShows(showsList)
      setReviews(reviewsData.results || reviewsData)
      setReviewStats(statsData)

      // Set first date as selected
      if (showsList.length > 0) {
        setSelectedDate(showsList[0].show_date)
      }

      // Check if user can review
      if (isAuthenticated) {
        try {
          const canReviewData = await canReview(id)
          setCanUserReview(canReviewData.can_review)
        } catch (err) {
          console.error('Error checking review eligibility:', err)
        }
      }
    } catch (err) {
      setError('Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  // Filter shows by selected city first
  const cityFilteredShows = selectedCity
    ? shows.filter(s => s.screen?.venue?.city === selectedCity)
    : shows

  // Get unique dates from city-filtered shows
  const uniqueDates = [...new Set(cityFilteredShows.map(s => s.show_date))].sort()

  // Reset selected date if it's not available in filtered shows
  useEffect(() => {
    if (cityFilteredShows.length > 0 && !uniqueDates.includes(selectedDate)) {
      setSelectedDate(uniqueDates[0])
    }
  }, [selectedCity, cityFilteredShows.length])

  // Filter shows by selected date
  const filteredShows = selectedDate
    ? cityFilteredShows.filter(s => s.show_date === selectedDate)
    : cityFilteredShows

  // Get unique venues from filtered shows
  const uniqueVenues = [...new Map(
    filteredShows.map(s => [s.screen?.venue?.id, s.screen?.venue])
  ).values()].filter(Boolean)

  const categoryName = event?.category?.name || 'Event'
  const gradient = categoryGradients[categoryName] || categoryGradients.default
  const posterUrl = event?.poster ? (event.poster.startsWith('http') ? event.poster : `${API_URL}${event.poster}`) : null
  const bannerUrl = event?.banner ? (event.banner.startsWith('http') ? event.banner : `${API_URL}${event.banner}`) : null

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
      <section className="relative overflow-hidden">
        {/* Banner Background */}
        {bannerUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${bannerUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </>
        ) : (
          <>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            <div className="absolute inset-0 bg-black/20" />
          </>
        )}

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
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary" className="bg-white/20 text-white">
                  {categoryName}
                </Badge>
                <WishlistButton eventId={event.id} size="md" />
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {event.title}
              </h1>

              {/* Genres */}
              {event.genres && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.genres.split('/').map((genre, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90 border border-white/20"
                    >
                      {genre.trim()}
                    </span>
                  ))}
                </div>
              )}

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
                            {show.screen?.name || 'Screen'} • {show.screen?.venue?.city}
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
                  <p className="text-gray-500 mb-2">
                    {selectedCity
                      ? `No shows available in ${selectedCity}`
                      : 'No shows available for this date'}
                  </p>
                  {selectedCity && shows.length > 0 && (
                    <p className="text-sm text-gray-400">
                      This event is available in other cities
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Reviews Section */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Reviews & Ratings</h2>
                  {reviewStats && reviewStats.total_count > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={reviewStats.avg_rating} size="sm" />
                      <span className="text-lg font-semibold text-gray-900">{reviewStats.avg_rating}</span>
                      <span className="text-gray-500">({reviewStats.total_count} reviews)</span>
                    </div>
                  )}
                </div>
                {canUserReview && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="mb-6">
                  <ReviewForm
                    eventId={id}
                    onSuccess={() => {
                      setShowReviewForm(false)
                      setCanUserReview(false)
                      fetchEventData()
                    }}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              {/* Rating Distribution */}
              {reviewStats && reviewStats.total_count > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviewStats.rating_distribution?.[star] || 0
                      const percentage = reviewStats.total_count > 0 ? (count / reviewStats.total_count) * 100 : 0
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-3 text-sm text-gray-600">{star}</span>
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-xs text-gray-500 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Venues Info */}
              {uniqueVenues.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {uniqueVenues.length === 1 ? 'Venue' : 'Venues'}
                    {selectedCity && <span className="text-sm font-normal text-gray-500 ml-2">in {selectedCity}</span>}
                  </h3>
                  <div className="space-y-4">
                    {uniqueVenues.map(venue => (
                      <div key={venue.id} className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{venue.name}</div>
                          <div className="text-sm text-gray-500">{venue.city}</div>
                        </div>
                      </div>
                    ))}
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

              {/* Share */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Share Event</h3>
                <ShareButtons
                  title={event.title}
                  text={`Check out ${event.title} - Book your tickets now!`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetailPage
