import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyBookings, cancelBooking, cancelSeats } from '../services/bookingService'
import { useAuth } from '../context/AuthContext'
import { Spinner, Badge, ToastContainer } from '../components/ui'

const PAGE_SIZE = 10

function MyBookingsPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const fetchedRef = useRef(false)
  const observerRef = useRef(null)

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [expandedBooking, setExpandedBooking] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState({})
  const [toasts, setToasts] = useState([])

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    booking: null,
    seats: [],
    onConfirm: null
  })

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const showConfirm = (title, booking, seats, onConfirm) => {
    setConfirmModal({ show: true, title, booking, seats, onConfirm })
  }

  const hideConfirm = () => {
    setConfirmModal({ show: false, title: '', booking: null, seats: [], onConfirm: null })
  }

  const handleConfirm = () => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm()
    }
    hideConfirm()
  }

  const getSeatPrice = (seat) => {
    return seat.price ? parseFloat(seat.price) : 0
  }

  const getRefundAmount = (seats) => {
    return seats.reduce((total, seat) => total + getSeatPrice(seat), 0)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchBookings(1, true)
  }, [isAuthenticated, navigate])

  const fetchBookings = async (pageNum = 1, reset = false) => {
    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const data = await getMyBookings(pageNum, PAGE_SIZE)
      const results = data.results || data

      if (reset) {
        setBookings(results)
      } else {
        setBookings(prev => [...prev, ...results])
      }

      setHasMore(data.next !== null && results.length === PAGE_SIZE)
      setPage(pageNum)
    } catch (err) {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return
    fetchBookings(page + 1, false)
  }, [page, loadingMore, hasMore, loading])

  // Intersection Observer for infinite scroll
  const lastBookingRef = useCallback(node => {
    if (loading || loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, { rootMargin: '200px' })

    if (node) observerRef.current.observe(node)
  }, [loading, loadingMore, hasMore, loadMore])

  const handleCancel = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId)
    showConfirm(
      'Cancel Entire Booking',
      booking,
      booking?.seats || [],
      async () => {
        setCancellingId(bookingId)
        try {
          await cancelBooking(bookingId)
          addToast('Booking cancelled successfully', 'success')
          fetchBookings(1, true)
          setExpandedBooking(null)
          setSelectedSeats({})
        } catch (err) {
          addToast(err.response?.data?.detail || 'Failed to cancel booking', 'error')
        } finally {
          setCancellingId(null)
        }
      }
    )
  }

  const handleCancelSelectedSeats = async (bookingId) => {
    const seatsToCancel = selectedSeats[bookingId] || []
    if (seatsToCancel.length === 0) {
      addToast('Please select at least one seat to cancel', 'warning')
      return
    }

    const booking = bookings.find(b => b.id === bookingId)
    const seatsData = booking?.seats?.filter(s => seatsToCancel.includes(s.id)) || []
    const isAllSeats = seatsToCancel.length === booking?.seats?.length
    const title = isAllSeats ? 'Cancel All Seats' : 'Cancel Selected Seats'

    showConfirm(title, booking, seatsData, async () => {
      setCancellingId(bookingId)
      try {
        const result = await cancelSeats(bookingId, seatsToCancel)
        const refundMsg = result.refund_amount ? ` Refund: ₹${result.refund_amount}` : ''
        addToast(result.detail + refundMsg, 'success')
        fetchBookings(1, true)
        setSelectedSeats(prev => ({ ...prev, [bookingId]: [] }))
        if (result.booking_cancelled) {
          setExpandedBooking(null)
        }
      } catch (err) {
        addToast(err.response?.data?.detail || 'Failed to cancel seats', 'error')
      } finally {
        setCancellingId(null)
      }
    })
  }

  const toggleSeatSelection = (bookingId, seatId) => {
    setSelectedSeats(prev => {
      const current = prev[bookingId] || []
      if (current.includes(seatId)) {
        return { ...prev, [bookingId]: current.filter(id => id !== seatId) }
      }
      return { ...prev, [bookingId]: [...current, seatId] }
    })
  }

  const toggleAllSeats = (bookingId, seats) => {
    const current = selectedSeats[bookingId] || []
    const allSelected = seats.every(s => current.includes(s.id))
    if (allSelected) {
      setSelectedSeats(prev => ({ ...prev, [bookingId]: [] }))
    } else {
      setSelectedSeats(prev => ({ ...prev, [bookingId]: seats.map(s => s.id) }))
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(hours, minutes)
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const getStatusBadge = (status) => {
    const variants = {
      confirmed: 'success',
      pending: 'warning',
      cancelled: 'danger',
      failed: 'danger'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status?.toUpperCase()}</Badge>
  }

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true
    if (activeTab === 'upcoming') return b.status === 'confirmed' || b.status === 'pending'
    if (activeTab === 'cancelled') return b.status === 'cancelled' || b.status === 'failed'
    return true
  })

  if (loading && bookings.length === 0) return <Spinner.Page message="Loading your bookings..." />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{confirmModal.title}</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              {/* Event Info */}
              {confirmModal.booking && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{confirmModal.booking.show?.event?.title || 'Event'}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(confirmModal.booking.show?.show_date)} • {formatTime(confirmModal.booking.show?.start_time)}
                  </p>
                  <p className="text-sm text-gray-500">{confirmModal.booking.show?.screen?.venue?.name}</p>
                </div>
              )}

              {/* Seats Breakdown */}
              {confirmModal.seats && confirmModal.seats.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Seats to Cancel ({confirmModal.seats.length})
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {confirmModal.seats.map(seat => (
                        <div key={seat.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 bg-white border border-gray-200 rounded flex items-center justify-center font-medium text-gray-700">
                              {seat.row_label}{seat.seat_number}
                            </span>
                            <span className="text-gray-500">
                              {seat.seat_category?.name || seat.screen_seat_category_detail?.name || 'Standard'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">₹{getSeatPrice(seat).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Summary */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-700">Estimated Refund</p>
                    <p className="text-xs text-green-600">Will be credited to original payment method</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">₹{getRefundAmount(confirmModal.seats).toFixed(0)}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={hideConfirm}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Bookings</h1>
          <Link to="/" className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors">
            Book More
          </Link>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {['all', 'upcoming', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

        {filteredBookings.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h2>
            <p className="text-gray-500 mb-6">Start by exploring amazing events!</p>
            <Link to="/" className="inline-flex px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600">
              Browse Events
            </Link>
          </div>
        ) : (
          <>
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => {
              const isLast = index === filteredBookings.length - 1
              return (
              <div key={booking.id} ref={isLast ? lastBookingRef : null} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-20 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl text-white/50 font-bold">
                          {booking.show?.event?.title?.[0] || 'E'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">
                            {booking.show?.event?.title || 'Event'}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {formatDate(booking.show?.show_date)} at {formatTime(booking.show?.start_time)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.show?.screen?.venue?.name} • {booking.show?.screen?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2">
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Total</span>
                        <p className="text-xl font-bold text-gray-900">₹{parseFloat(booking.total_amount).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Seats ({booking.seats?.length || 0}): </span>
                        <span className="font-medium text-gray-900">
                          {booking.seats?.map(s => `${s.row_label}${s.seat_number}`).join(', ') || 'N/A'}
                        </span>
                      </div>
                      <span className="font-mono text-gray-400">{booking.booking_reference}</span>
                    </div>

                    {(booking.status === 'confirmed' || booking.status === 'pending') && booking.seats?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {expandedBooking === booking.id ? 'Hide Seats' : 'Manage Seats'}
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel All'}
                        </button>
                      </div>
                    )}
                  </div>

                  {expandedBooking === booking.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Select seats to cancel</h4>
                        <button
                          onClick={() => toggleAllSeats(booking.id, booking.seats)}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          {(selectedSeats[booking.id] || []).length === booking.seats?.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {booking.seats?.map(seat => {
                          const isSelected = (selectedSeats[booking.id] || []).includes(seat.id)
                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeatSelection(booking.id, seat.id)}
                              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                isSelected
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {seat.row_label}{seat.seat_number}
                              {seat.seat_category && (
                                <span className="block text-xs text-gray-500">
                                  ₹{parseFloat(seat.seat_category.price).toFixed(0)}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {(selectedSeats[booking.id] || []).length > 0 && (
                        <button
                          onClick={() => handleCancelSelectedSeats(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {cancellingId === booking.id
                            ? 'Cancelling...'
                            : `Cancel ${(selectedSeats[booking.id] || []).length} Seat(s)`
                          }
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )
            })}
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-3 text-gray-500">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading more bookings...</span>
              </div>
            </div>
          )}

          {/* End of List */}
          {!hasMore && bookings.length > PAGE_SIZE && (
            <div className="text-center mt-6 text-gray-500">
              You've seen all your bookings
            </div>
          )}
          </>
        )}
      </div>
    </div>
  )
}

export default MyBookingsPage
