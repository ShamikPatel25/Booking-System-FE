import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CitySelector from './CitySelector'

function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Booking<span className="text-primary-500">System</span>
            </span>
          </Link>

          {/* City Selector (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <CitySelector />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive('/')
                  ? 'text-primary-500'
                  : 'text-gray-600 hover:text-primary-500'
              }`}
            >
              Home
            </Link>
            <Link
              to="/discover"
              className={`font-medium transition-colors ${
                isActive('/discover')
                  ? 'text-primary-500'
                  : 'text-gray-600 hover:text-primary-500'
              }`}
            >
              Discover
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-bookings"
                  className={`font-medium transition-colors ${
                    isActive('/my-bookings')
                      ? 'text-primary-500'
                      : 'text-gray-600 hover:text-primary-500'
                  }`}
                >
                  My Bookings
                </Link>
                <Link
                  to="/wishlist"
                  className={`font-medium transition-colors ${
                    isActive('/wishlist')
                      ? 'text-primary-500'
                      : 'text-gray-600 hover:text-primary-500'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Wishlist
                  </span>
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-500 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                      </span>
                    </div>
                    <span className="font-medium">{user?.first_name || user?.username}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-fade-in">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-primary-600 font-medium hover:bg-primary-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/change-password"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Change Password
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-500 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-slide-up">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg ${
                  isActive('/')
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/discover"
                className={`px-4 py-2 rounded-lg ${
                  isActive('/discover')
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Discover
              </Link>

              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/my-bookings"
                    className={`px-4 py-2 rounded-lg ${
                      isActive('/my-bookings')
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Link
                    to="/wishlist"
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      isActive('/wishlist')
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Wishlist
                  </Link>
                  <Link
                    to="/profile"
                    className={`px-4 py-2 rounded-lg ${
                      isActive('/profile')
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/change-password"
                    className={`px-4 py-2 rounded-lg ${
                      isActive('/change-password')
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Change Password
                  </Link>
                  <hr className="my-2 border-gray-100" />
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    Signed in as {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="mx-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <hr className="my-2 border-gray-100" />
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="mx-4 py-2 bg-primary-500 text-white rounded-lg text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
