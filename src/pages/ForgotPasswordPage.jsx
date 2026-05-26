import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestPasswordReset } from '../services/authService'
import { parseApiError } from '../utils/apiUtils'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await requestPasswordReset(email)

      if (response.email_exists && response.token) {
        navigate(`/reset-password?token=${response.token}`)
      } else {
        setMessage(response.detail)
      }
    } catch (err) {
      setError(parseApiError(err, 'Failed to verify email. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-indigo-700 p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold text-white">BookingSystem</span>
          </Link>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Forgot Password?</h1>
          <p className="text-xl text-white/80">
            No worries! Enter your email and we'll help you reset your password.
          </p>
        </div>

        <div className="text-white/60 text-sm">
          &copy; {new Date().getFullYear()} BookingSystem. All rights reserved.
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">BookingSystem</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-500 mb-6">Enter your email to reset your password</p>

            {message ? (
              <div className="text-center">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">{message}</p>
                </div>
                <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verifying...
                      </span>
                    ) : 'Continue'}
                  </button>
                </form>

                <p className="mt-6 text-center text-gray-600">
                  Remember your password?{' '}
                  <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
