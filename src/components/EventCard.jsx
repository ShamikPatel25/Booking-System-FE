import { Link } from 'react-router-dom'
import Badge from './ui/Badge'
import WishlistButton from './WishlistButton'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Gradient colors based on category
const categoryGradients = {
  'Movies': 'from-blue-600 to-indigo-700',
  'Concerts': 'from-purple-600 to-pink-600',
  'Sports': 'from-green-600 to-emerald-700',
  'Theatre': 'from-red-600 to-orange-600',
  'Comedy': 'from-yellow-500 to-orange-500',
  'default': 'from-primary-600 to-indigo-700',
}

function EventCard({ event, featured = false }) {
  const categoryName = event.category?.name || 'Event'
  const gradient = categoryGradients[categoryName] || categoryGradients.default
  const posterUrl = event.poster ? (event.poster.startsWith('http') ? event.poster : `${API_URL}${event.poster}`) : null

  // Get first show's date if available
  const firstShow = event.shows?.[0]
  const showDate = firstShow?.show_date
    ? new Date(firstShow.show_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : null

  return (
    <Link
      to={`/events/${event.id}`}
      className={`
        group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1
        ${featured ? 'md:flex' : ''}
      `}
    >
      {/* Image/Gradient Placeholder */}
      <div
        className={`
          relative overflow-hidden
          ${featured ? 'md:w-80 md:flex-shrink-0' : ''}
        `}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={event.title}
            className={`
              w-full object-cover
              ${featured ? 'aspect-[3/4] md:aspect-[4/5]' : 'aspect-[3/4]'}
            `}
          />
        ) : (
          <div
            className={`
              aspect-[3/4] bg-gradient-to-br ${gradient}
              flex items-center justify-center
              ${featured ? 'md:aspect-[4/5]' : ''}
            `}
          >
            <span className="text-6xl text-white/30 font-bold">
              {event.title?.[0] || 'E'}
            </span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="primary" className="bg-white/90 text-gray-800 backdrop-blur-sm">
            {categoryName}
          </Badge>
        </div>

        {/* Date Badge */}
        {showDate && (
          <div className="absolute top-3 right-3">
            <div className="bg-white rounded-lg px-2 py-1 text-center shadow-sm">
              <span className="text-xs font-bold text-gray-800">{showDate}</span>
            </div>
          </div>
        )}

        {/* Wishlist Button - Always visible */}
        <div className="absolute bottom-3 right-3 z-10">
          <WishlistButton eventId={event.id} size="sm" />
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white font-semibold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 ${featured ? 'md:flex md:flex-col md:justify-center' : ''}`}>
        <h3 className={`
          font-bold text-gray-900 group-hover:text-primary-600 transition-colors
          line-clamp-2
          ${featured ? 'text-xl md:text-2xl' : 'text-lg'}
        `}>
          {event.title}
        </h3>

        {/* Genres/Tags */}
        {event.genres && (
          <p className="mt-2 text-sm text-gray-600">
            {event.genres}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          {event.language && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {event.language}
            </span>
          )}
          {event.duration_minutes && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {event.duration_minutes} min
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default EventCard
