import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getProfile } from '../services/authService'

// 1. Create the context
const AuthContext = createContext(null)

// 2. Create provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const checkedRef = useRef(false)

  // Check if user is logged in on app start
  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token')

    if (token) {
      try {
        const userData = await getProfile()
        setUser(userData)
      } catch (error) {
        // Token invalid - clear it
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
      }
    }

    setLoading(false)
  }

  // Login - store tokens and fetch user
  const login = (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    checkAuth()
  }

  // Logout - clear tokens and user
  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      const userData = await getProfile()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  // Values available to all components
  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: !!(user?.is_staff || user?.is_superuser)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
