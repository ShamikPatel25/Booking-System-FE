import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { createBooking } from '../services/bookingService'
import { processSimulatedPayment, createPaymentIntent, confirmPayment, getStripeConfig } from '../services/paymentService'
import { unlockSeats } from '../services/seatService'
import { useAuth } from '../context/AuthContext'
import PaymentForm from '../components/PaymentForm'

let stripePromise = null

function BookingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const { showId, seats, totalPrice } = location.state || {}

  const [timeLeft, setTimeLeft] = useState(10 * 60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('review')
  const [booking, setBooking] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [useStripe, setUseStripe] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)

  const isProcessingRef = useRef(false)

  useEffect(() => {
    if (!showId || !seats || seats.length === 0) navigate('/')
  }, [showId, seats, navigate])

  useEffect(() => {
    if (!isAuthenticated) navigate('/login')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    checkStripeConfig()
  }, [])

  const checkStripeConfig = async () => {
    try {
      const config = await getStripeConfig()
      if (config.publishable_key) {
        stripePromise = loadStripe(config.publishable_key)
        setUseStripe(true)
      } else {
        setUseStripe(false)
      }
    } catch (err) {
      setUseStripe(false)
    } finally {
      setStripeReady(true)
    }
  }

  useEffect(() => {
    if (timeLeft <= 0 || step !== 'review') return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, step])

  const handleTimeout = async () => {
    setError('Session expired! Please go back and select your seats again.')
    setStep('failed')
    // Try to unlock any seats that might still be locked
    try {
      const seatIds = seats?.map(s => s.id) || []
      if (seatIds.length > 0) {
        await unlockSeats(showId, seatIds)
      }
    } catch (err) {
      // Ignore unlock errors on timeout
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCancel = async () => {
    try {
      const seatIds = seats.map(s => s.id)
      await unlockSeats(showId, seatIds)
    } catch (err) {
      console.error('Failed to unlock seats:', err)
    }
    navigate(-1)
  }

  const handleConfirmBooking = async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    setLoading(true)
    setError('')

    try {
      const seatIds = seats.map(s => s.id)
      const newBooking = await createBooking(showId, seatIds)
      setBooking(newBooking)

      if (useStripe) {
        const { client_secret } = await createPaymentIntent(newBooking.id)
        setClientSecret(client_secret)
        setStep('payment')
        setLoading(false)
        isProcessingRef.current = false
      } else {
        setStep('processing')
        const payment = await processSimulatedPayment(newBooking.id)
        if (payment.status === 'success') {
          setStep('success')
          const confirmedBooking = { ...newBooking, status: 'confirmed' }
          setTimeout(() => {
            navigate('/booking-success', { state: { booking: confirmedBooking, payment, seats } })
          }, 1500)
        } else {
          setStep('failed')
          setError('Payment failed. Please try again.')
          isProcessingRef.current = false
        }
        setLoading(false)
      }
    } catch (err) {
      console.error('Booking error:', err)
      setStep('failed')
      const errorMsg = err.response?.data?.detail
        || err.response?.data?.error
        || err.response?.data?.message
        || err.message
        || 'Booking failed. Please try again.'
      setError(errorMsg)
      isProcessingRef.current = false
      setLoading(false)
    }
  }

  const handleStripeSuccess = async (paymentIntent) => {
    setStep('processing')
    try {
      const result = await confirmPayment(paymentIntent.id)
      if (result.status === 'success') {
        setStep('success')
        setTimeout(() => {
          navigate('/booking-success', { state: { booking, payment: { status: 'success' }, seats } })
        }, 1500)
      } else {
        setStep('failed')
        setError('Payment confirmation failed. Please contact support.')
      }
    } catch (err) {
      setStep('failed')
      setError('Payment confirmation failed. Please contact support.')
    }
  }

  const handleStripeError = (error) => {
    setError(error.message)
  }

  const getSeatCategory = (seat) => {
    if (seat.screen_seat_category_detail?.name) return seat.screen_seat_category_detail.name
    if (seat.category_name) return seat.category_name
    return 'Standard'
  }

  const getSeatPrice = (seat) => {
    if (seat.price) return parseFloat(seat.price)
    return 0
  }

  const seatsByCategory = seats?.reduce((acc, seat) => {
    const catName = getSeatCategory(seat)
    const seatPrice = getSeatPrice(seat)
    if (!acc[catName]) acc[catName] = { seats: [], totalPrice: 0 }
    acc[catName].seats.push(seat)
    acc[catName].totalPrice += seatPrice
    return acc
  }, {}) || {}

  if (!showId || !seats) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Timer Bar */}
      {step === 'review' && (
        <div className={`${timeLeft < 60 ? 'bg-red-500' : 'bg-primary-500'} text-white py-3 transition-colors`}>
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Complete your booking in <strong className="text-xl">{formatTime(timeLeft)}</strong></span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {['Select Seats', 'Review', 'Payment', 'Done'].map((label, idx) => {
            const stepNum = idx + 1
            const isActive = step === 'review' ? stepNum <= 2 : step === 'processing' ? stepNum <= 3 : stepNum <= 4
            const isCurrent = (step === 'review' && stepNum === 2) || (step === 'processing' && stepNum === 3) || ((step === 'success' || step === 'failed') && stepNum === 4)
            return (
              <div key={label} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isActive ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'} ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}>
                  {stepNum}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'text-gray-900' : 'text-gray-400'} hidden sm:inline`}>{label}</span>
                {idx < 3 && <div className={`w-12 h-0.5 mx-2 ${isActive ? 'bg-primary-500' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Contact Details */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3">CONTACT DETAILS</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg">{user?.first_name?.[0] || 'U'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Seats */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">SELECTED SEATS</h3>
                <div className="space-y-3">
                  {Object.entries(seatsByCategory).map(([catName, data]) => (
                    <div key={catName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{catName}</span>
                        <span className="text-gray-500 ml-2">({data.seats.length} ticket{data.seats.length > 1 ? 's' : ''})</span>
                        <p className="text-sm text-gray-500 mt-1">
                          Seats: {data.seats.map(s => `${s.row_label}${s.seat_number}`).join(', ')}
                        </p>
                      </div>
                      <span className="font-medium text-gray-900">₹{data.totalPrice.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              {step === 'review' && (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between text-gray-600 mb-2">
                      <span>Subtotal</span>
                      <span>₹{totalPrice?.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 mb-2">
                      <span>Convenience Fee</span>
                      <span>₹0</span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>₹{totalPrice?.toFixed(0)}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                  )}

                  <button
                    onClick={handleConfirmBooking}
                    disabled={loading || isProcessingRef.current || !stripeReady}
                    className="w-full py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
                  >
                    {loading ? 'Processing...' : `Proceed to Pay ₹${totalPrice?.toFixed(0)}`}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {step === 'payment' && clientSecret && stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    onSuccess={handleStripeSuccess}
                    onError={handleStripeError}
                    amount={totalPrice}
                  />
                </Elements>
              )}

              {step === 'processing' && (
                <div className="text-center py-8">
                  <svg className="animate-spin h-12 w-12 text-primary-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-gray-600">Processing your payment...</p>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                  <p className="text-gray-500">Redirecting to your ticket...</p>
                </div>
              )}

              {step === 'failed' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Failed</h3>
                  <p className="text-gray-500 mb-6">{error}</p>
                  <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                    Go to Home
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
