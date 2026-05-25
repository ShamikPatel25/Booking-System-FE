import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getWishlist, removeFromWishlist } from '../services/wishlistService'
import { Spinner } from '../components/ui'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function WishlistPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchWishlist()
  }, [isAuthenticated])

  const fetchWishlist = async () => {
    try {
      const data = await getWishlist()
      setWishlist(data.results || data)
    } catch (err) {
      setError('Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (id) => {
    try {
      await removeFromWishlist(id)
      setWishlist(wishlist.filter(item => item.id !== id))
    } catch (err) {
      console.error('Error removing from wishlist:', err)
    }
  }

  const getPosterUrl = (poster) => {
    if (!poster) return null
    if (poster.startsWith('http')) return poster
    return `${API_URL}${poster}`
  }

  if (loading) {
    return <Spinner.Page message="Loading wishlist..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
        <p className="text-gray-600">Events you've saved for later</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {wishlist.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6">Browse events and save the ones you like</p>
          <Link
            to="/discover"
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            Discover Events
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
            >
              <Link to={`/events/${item.event_id || item.event?.id}`} className="block">
                <div className="aspect-[2/3] bg-gray-100 relative overflow-hidden">
                  {item.event_poster ? (
                    <img
                      src={getPosterUrl(item.event_poster)}
                      alt={item.event_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-purple-100">
                      <span className="text-4xl font-bold text-primary-300">
                        {item.event_title?.[0]}
                      </span>
                    </div>
                  )}

                  {item.event_category && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-full">
                        {item.event_category}
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <Link to={`/events/${item.event_id || item.event?.id}`}>
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 group-hover:text-primary-600 transition-colors mb-2">
                    {item.event_title}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  {item.event_language && <span>{item.event_language}</span>}
                  {item.event_duration && (
                    <>
                      <span>•</span>
                      <span>{item.event_duration} min</span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/events/${item.event_id || item.event?.id}`}
                    className="flex-1 py-2 text-center bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    Book Now
                  </Link>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                    title="Remove from wishlist"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WishlistPage
