import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getWishlist } from '../services/wishlistService'

function FloatingWishlistButton() {
  const { isAuthenticated } = useAuth()
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlistCount()
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Show button after scrolling down a bit
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchWishlistCount = async () => {
    try {
      const data = await getWishlist()
      const items = data.results || data
      setCount(items.length)
    } catch (err) {
      console.error('Error fetching wishlist:', err)
    }
  }

  // Listen for wishlist changes
  useEffect(() => {
    const handleWishlistChange = () => {
      if (isAuthenticated) {
        fetchWishlistCount()
      }
    }

    window.addEventListener('wishlist-updated', handleWishlistChange)
    return () => window.removeEventListener('wishlist-updated', handleWishlistChange)
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  return (
    <Link
      to="/wishlist"
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-gradient-to-r from-red-500 to-pink-500
        text-white shadow-lg
        flex items-center justify-center
        hover:scale-110 hover:shadow-xl
        transition-all duration-300
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
      `}
      title="View Wishlist"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>

      {/* Count Badge */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-500 text-xs font-bold rounded-full flex items-center justify-center shadow">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

export default FloatingWishlistButton
