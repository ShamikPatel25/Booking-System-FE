import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getShowSeats, getSeatCategories, lockSeats, unlockSeats } from '../services/seatService'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'

function SeatSelectionPage() {
  const { showId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const fetchedRef = useRef(false)

  const [seats, setSeats] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [originallyLockedSeats, setOriginallyLockedSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locking, setLocking] = useState(false)
  const [zoom, setZoom] = useState(1)

  const categoryStyles = [
    { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', border: 'border-amber-400', text: 'text-amber-700', activeBg: 'bg-gradient-to-r from-amber-400 to-amber-500', hoverBg: 'hover:bg-amber-100', seatBorder: 'border-amber-300' },
    { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', border: 'border-emerald-400', text: 'text-emerald-700', activeBg: 'bg-gradient-to-r from-emerald-400 to-emerald-500', hoverBg: 'hover:bg-emerald-100', seatBorder: 'border-emerald-300' },
    { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-400', text: 'text-blue-700', activeBg: 'bg-gradient-to-r from-blue-400 to-blue-500', hoverBg: 'hover:bg-blue-100', seatBorder: 'border-blue-300' },
    { bg: 'bg-gradient-to-br from-purple-50 to-purple-100', border: 'border-purple-400', text: 'text-purple-700', activeBg: 'bg-gradient-to-r from-purple-400 to-purple-500', hoverBg: 'hover:bg-purple-100', seatBorder: 'border-purple-300' },
  ]

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchData()
  }, [showId])

  const fetchData = async () => {
    try {
      const [seatsData, pricingData] = await Promise.all([
        getShowSeats(showId),
        getSeatCategories(showId)
      ])

      const seatsArray = seatsData.results || seatsData
      const pricingArray = pricingData.results || pricingData

      // Map pricing to categories format (category info + price)
      const categoriesArray = pricingArray.map(p => ({
        id: p.screen_seat_category,
        name: p.screen_seat_category_detail?.name || p.category_name,
        row_start: p.screen_seat_category_detail?.row_start || p.row_start,
        row_end: p.screen_seat_category_detail?.row_end || p.row_end,
        price: p.price
      }))
      categoriesArray.sort((a, b) => (a.row_start || '').localeCompare(b.row_start || ''))

      setSeats(seatsArray)
      setCategories(categoriesArray)

      // Pre-select seats that are locked by current user
      if (user?.id) {
        const myLockedSeats = seatsArray.filter(
          seat => seat.status === 'locked' && seat.locked_by === user.id
        )
        if (myLockedSeats.length > 0) {
          setSelectedSeats(myLockedSeats)
          setOriginallyLockedSeats(myLockedSeats.map(s => s.id)) // Track for later unlock
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load seats. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getSeatCategoryId = (seat) => {
    if (typeof seat.screen_seat_category === 'object' && seat.screen_seat_category !== null) {
      return seat.screen_seat_category.id
    }
    return seat.screen_seat_category
  }

  const getSeatPrice = (seat) => {
    const catId = getSeatCategoryId(seat)
    const category = categories.find(c => c.id === catId)
    return category ? parseFloat(category.price) : 0
  }

  const getSeatsByCategory = () => {
    const result = {}
    categories.forEach(category => {
      const categorySeats = seats.filter(s => getSeatCategoryId(s) === category.id)
      const byRow = {}
      categorySeats.forEach(seat => {
        if (!byRow[seat.row_label]) byRow[seat.row_label] = []
        byRow[seat.row_label].push(seat)
      })
      const sortedRows = Object.keys(byRow).sort()
      sortedRows.forEach(row => byRow[row].sort((a, b) => a.seat_number - b.seat_number))
      result[category.id] = { category, rows: byRow, sortedRowLabels: sortedRows }
    })
    return result
  }

  // Check if seat is locked by current user
  const isMyLockedSeat = (seat) => {
    return seat.status === 'locked' && seat.locked_by === user?.id
  }

  const handleSeatClick = async (seat) => {
    // Allow clicking on available seats OR seats locked by current user
    if (seat.status !== 'available' && !isMyLockedSeat(seat)) return

    const isSelected = selectedSeats.find(s => s.id === seat.id)

    if (isSelected) {
      // Deselecting
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id))

      // If it was my locked seat, unlock it immediately in backend
      if (originallyLockedSeats.includes(seat.id)) {
        try {
          await unlockSeats(showId, [seat.id])
          // Update local state to show as available
          setSeats(currentSeats => currentSeats.map(s =>
            s.id === seat.id ? { ...s, status: 'available', locked_by: null } : s
          ))
          // Remove from originally locked list
          setOriginallyLockedSeats(prev => prev.filter(id => id !== seat.id))
        } catch (err) {
          console.error('Failed to unlock seat:', err)
          // Re-add to selection if unlock failed
          setSelectedSeats(prev => [...prev, seat])
        }
      }
    } else {
      // Selecting
      if (selectedSeats.length >= 10) {
        alert('Maximum 10 seats can be selected at once')
        return
      }
      setSelectedSeats(prev => [...prev, seat])
    }
  }

  const totalPrice = selectedSeats.reduce((total, seat) => total + getSeatPrice(seat), 0)

  const handleLockSeats = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat')
      return
    }
    setLocking(true)
    setError('')
    try {
      // Find seats to lock (newly selected, not already locked by me)
      const originallyLockedSet = new Set(originallyLockedSeats)
      const seatsToLock = selectedSeats.filter(s => !originallyLockedSet.has(s.id))

      // Lock new selections
      if (seatsToLock.length > 0) {
        await lockSeats(showId, seatsToLock.map(s => s.id))
      }

      navigate('/booking', { state: { showId, seats: selectedSeats, totalPrice } })
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to lock seats.')
      fetchData()
    } finally {
      setLocking(false)
    }
  }

  if (loading) return <Spinner.Page message="Loading seats..." />

  if (error && seats.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600">
          Go Back
        </button>
      </div>
    )
  }

  const seatsByCategory = getSeatsByCategory()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Select Your Seats</h1>
          </div>
          {selectedSeats.length > 0 && (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-gray-600">{selectedSeats.length} seat(s) selected</span>
              <span className="text-xl font-bold text-primary-600">₹{totalPrice.toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Zoom Controls */}
        <div className="flex justify-end mb-4 gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
            title="Zoom Out"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="px-3 py-2 bg-white rounded-lg shadow text-sm font-medium text-gray-600">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
            className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
            title="Zoom In"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
            title="Reset Zoom"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        {/* Curved Screen */}
        <div className="mb-10">
          <div className="relative max-w-4xl mx-auto">
            <svg viewBox="0 0 400 60" className="w-full h-auto">
              <defs>
                <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d1d5db" />
                  <stop offset="50%" stopColor="#9ca3af" />
                  <stop offset="100%" stopColor="#d1d5db" />
                </linearGradient>
                <filter id="screenGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M 20 50 Q 200 10 380 50"
                fill="none"
                stroke="url(#screenGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                filter="url(#screenGlow)"
              />
              <text x="200" y="55" textAnchor="middle" fill="#6b7280" fontSize="12" fontWeight="500">
                SCREEN
              </text>
            </svg>
          </div>
        </div>

        {/* Seat Map with Zoom */}
        <div
          className="space-y-8 mb-32 transition-transform origin-top"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {categories.map((category, catIndex) => {
            const catData = seatsByCategory[category.id]
            if (!catData || catData.sortedRowLabels.length === 0) return null
            const styles = categoryStyles[catIndex] || categoryStyles[0]

            return (
              <div key={category.id} className={`${styles.bg} rounded-xl p-4 md:p-6 border-2 border-dashed ${styles.border}`}>
                {/* Category Header */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className={`font-semibold ${styles.text}`}>{category.name}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${styles.activeBg} text-white`}>
                    ₹{parseFloat(category.price).toFixed(0)}
                  </span>
                </div>

                {/* Rows */}
                <div className="space-y-2">
                  {catData.sortedRowLabels.map(rowLabel => (
                    <div key={rowLabel} className="flex items-center justify-center gap-2">
                      <span className="w-6 text-center text-xs font-medium text-gray-500">{rowLabel}</span>
                      <div className="flex gap-1.5 flex-wrap justify-center">
                        {catData.rows[rowLabel].map(seat => {
                          const isSelected = selectedSeats.find(s => s.id === seat.id)
                          const isBooked = seat.status === 'booked'
                          const isBlocked = seat.status === 'blocked'
                          const isLocked = seat.status === 'locked'
                          const isMyLocked = isMyLockedSeat(seat)
                          const isAvailable = seat.status === 'available'
                          const canClick = isAvailable || isMyLocked

                          return (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              disabled={!canClick}
                              title={`${rowLabel}${seat.seat_number} - ₹${parseFloat(category.price).toFixed(0)}`}
                              className={`
                                w-9 h-9 rounded-t-xl text-xs font-bold transition-all duration-200 transform
                                ${isSelected
                                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg scale-110 ring-2 ring-primary-300 ring-offset-1'
                                  : isBooked
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                                  : isBlocked
                                  ? 'bg-gradient-to-br from-red-400 to-red-500 text-white cursor-not-allowed'
                                  : isLocked && !isMyLocked
                                  ? 'bg-amber-200 text-amber-800 cursor-not-allowed animate-pulse'
                                  : isMyLocked
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white cursor-pointer ring-2 ring-amber-300'
                                  : `border-2 ${styles.seatBorder} bg-white text-gray-700 ${styles.hoverBg} hover:scale-105 hover:shadow-md cursor-pointer active:scale-95`
                                }
                              `}
                            >
                              {seat.seat_number}
                            </button>
                          )
                        })}
                      </div>
                      <span className="w-6 text-center text-xs font-medium text-gray-500">{rowLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Seat Legend</h3>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-t-lg border-2 border-gray-300 bg-white shadow-sm" />
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-t-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-md" />
              <span className="text-sm text-gray-600">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-t-lg bg-gradient-to-br from-amber-400 to-amber-500" />
              <span className="text-sm text-gray-600">My Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-t-lg bg-gray-300 opacity-60" />
              <span className="text-sm text-gray-600">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-t-lg bg-gradient-to-br from-red-400 to-red-500" />
              <span className="text-sm text-gray-600">Unavailable</span>
            </div>
          </div>

          {/* Category Colors */}
          {categories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-medium text-gray-500 mb-2 text-center">PRICE CATEGORIES</h4>
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((cat, idx) => {
                  const styles = categoryStyles[idx] || categoryStyles[0]
                  return (
                    <div key={cat.id} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${styles.activeBg}`} />
                      <span className="text-sm text-gray-600">{cat.name} - ₹{parseFloat(cat.price).toFixed(0)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">
                {selectedSeats.length} Ticket(s): {selectedSeats.map(s => `${s.row_label}${s.seat_number}`).join(', ')}
              </div>
              <div className="text-2xl font-bold text-gray-900">₹{totalPrice.toFixed(0)}</div>
            </div>
            <button
              onClick={handleLockSeats}
              disabled={locking}
              className="px-8 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {locking ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Proceed to Pay`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatSelectionPage
