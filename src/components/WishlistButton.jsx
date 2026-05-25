import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { toggleWishlist, checkWishlist } from '../services/wishlistService'

function WishlistButton({ eventId, size = 'md', className = '' }) {
  const { isAuthenticated } = useAuth()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && eventId) {
      checkWishlistStatus()
    }
  }, [isAuthenticated, eventId])

  const checkWishlistStatus = async () => {
    try {
      const data = await checkWishlist(eventId)
      setIsWishlisted(data.is_wishlisted)
    } catch (err) {
      console.error('Error checking wishlist:', err)
    }
  }

  const handleToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    try {
      const data = await toggleWishlist(eventId)
      setIsWishlisted(data.is_wishlisted)
      // Dispatch event to update floating wishlist button
      window.dispatchEvent(new Event('wishlist-updated'))
    } catch (err) {
      console.error('Error toggling wishlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
        isWishlisted
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
      } shadow-lg hover:scale-110 disabled:opacity-50 ${className}`}
      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      {loading ? (
        <svg className={`${iconSizes[size]} animate-spin`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg
          className={iconSizes[size]}
          fill={isWishlisted ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  )
}

export default WishlistButton
