import { useState, useEffect, useRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { AdminLayout, DataTable } from '../../components/admin'
import { getAllBookings, getEvents } from '../../services/adminService'
import { Spinner, Badge } from '../../components/ui'

const PAGE_SIZE = 10

function BookingListPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const eventsLoadedRef = useRef(false)

  // Filter state
  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState({
    event: '',
    show_date: '',
    status: ''
  })

  // Detail modal state
  const [detailModal, setDetailModal] = useState({
    show: false,
    booking: null
  })

  useEffect(() => {
    if (eventsLoadedRef.current) return
    eventsLoadedRef.current = true
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [page, filters])

  const fetchEvents = async () => {
    try {
      const data = await getEvents(1, 100)
      setEvents(data.results || data)
    } catch (err) {
      console.error('Failed to load events', err)
    }
  }

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const data = await getAllBookings(page, PAGE_SIZE, filters)
      setBookings(data.results || data)
      setTotalCount(data.count || 0)
    } catch (err) {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ event: '', show_date: '', status: '' })
    setPage(1)
  }

  const hasActiveFilters = filters.event || filters.show_date || filters.status

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatShowDate = (dateStr) => {
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
    return <Badge variant={variants[status] || 'secondary'} className="w-20 justify-center">{status?.toUpperCase()}</Badge>
  }

  const openDetailModal = (booking) => {
    setDetailModal({ show: true, booking })
  }

  const closeDetailModal = () => {
    setDetailModal({ show: false, booking: null })
  }

  // Combine active seats and cancelled seats for display
  const getAllSeatsForDisplay = (booking) => {
    const activeSeats = (booking.seats || []).map(seat => ({
      id: seat.id,
      row_label: seat.row_label,
      seat_number: seat.seat_number,
      price: seat.price ? parseFloat(seat.price) : 0,
      category_name: seat.seat_category?.name || seat.screen_seat_category_detail?.name || 'Standard',
      isCancelled: false
    }))

    const cancelledSeats = (booking.cancelled_seats || []).map(seat => ({
      id: seat.id,
      row_label: seat.row_label,
      seat_number: seat.seat_number,
      price: seat.price || 0,
      category_name: seat.category_name || 'Standard',
      isCancelled: true
    }))

    // Combine and sort by row_label then seat_number
    return [...activeSeats, ...cancelledSeats].sort((a, b) => {
      if (a.row_label !== b.row_label) return a.row_label.localeCompare(b.row_label)
      return a.seat_number - b.seat_number
    })
  }

  const columns = [
    { key: 'booking_reference', label: 'Reference', render: (val) => <span className="font-mono text-sm">{val}</span> },
    {
      key: 'user',
      label: 'User',
      render: (val) => val?.username || val?.email || '-'
    },
    {
      key: 'show',
      label: 'Event',
      render: (val) => val?.event?.title || '-'
    },
    {
      key: 'show',
      label: 'Show Date',
      render: (val) => val?.show_date || '-'
    },
    {
      key: 'seats',
      label: 'Seats',
      render: (val, row) => {
        const active = val?.length || 0
        const cancelled = row.cancelled_seats?.length || 0
        const total = active + cancelled

        // If status is cancelled, all original seats are in cancelled_seats
        if (row.status === 'cancelled') {
          return <span>{cancelled}</span>
        }

        // Partial cancellation - show total with cancelled count
        if (cancelled > 0) {
          return <span>{total} <span className="text-red-500">({cancelled} cancelled)</span></span>
        }

        // No cancellations
        return total
      }
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (val) => `₹${parseFloat(val || 0).toFixed(0)}`
    },
    { key: 'status', label: 'Status', render: (val) => getStatusBadge(val) },
    { key: 'created_at', label: 'Booked On', render: (val) => formatDate(val) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => openDetailModal(row)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View
        </button>
      )
    }
  ]

  if (loading && bookings.length === 0) {
    return (
      <AdminLayout>
        <Spinner.Page message="Loading bookings..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Detail Modal */}
      {detailModal.show && detailModal.booking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
                <p className="text-sm text-gray-500 font-mono">{detailModal.booking.booking_reference}</p>
              </div>
              <button onClick={closeDetailModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{detailModal.booking.user?.username || detailModal.booking.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(detailModal.booking.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event</p>
                  <p className="font-medium">{detailModal.booking.show?.event?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Show Date & Time</p>
                  <p className="font-medium">
                    {formatShowDate(detailModal.booking.show?.show_date)} at {formatTime(detailModal.booking.show?.start_time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Venue</p>
                  <p className="font-medium">{detailModal.booking.show?.screen?.venue?.name} - {detailModal.booking.show?.screen?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Amount</p>
                  <p className="font-medium text-lg">₹{parseFloat(detailModal.booking.total_amount).toFixed(0)}</p>
                </div>
              </div>

              {/* Seats */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-gray-900">
                    {(() => {
                      const active = detailModal.booking.seats?.length || 0
                      const cancelled = detailModal.booking.cancelled_seats?.length || 0
                      const isCancelled = detailModal.booking.status === 'cancelled'

                      // Fully cancelled booking
                      if (isCancelled) {
                        return `Seats (${cancelled} - all cancelled)`
                      }

                      // Partial cancellation
                      if (cancelled > 0) {
                        return <>Seats ({active} active<span className="text-red-500"> + {cancelled} cancelled</span>)</>
                      }

                      // No cancellations
                      return `Seats (${active})`
                    })()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {getAllSeatsForDisplay(detailModal.booking).map((seat, index) => (
                      <div
                        key={seat.id || index}
                        className={`p-3 rounded-lg border text-left ${
                          seat.isCancelled
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${seat.isCancelled ? 'text-red-700' : 'text-gray-900'}`}>
                            {seat.row_label}{seat.seat_number}
                          </span>
                          <span className={`font-medium ${seat.isCancelled ? 'text-red-600 line-through' : 'text-gray-700'}`}>
                            ₹{seat.price.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs ${seat.isCancelled ? 'text-red-500' : 'text-gray-500'}`}>
                            {seat.category_name}
                          </span>
                          {seat.isCancelled && (
                            <span className="text-xs font-medium text-red-600">CANCELLED</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend - only show for partial cancellation (not fully cancelled) */}
                {detailModal.booking.cancelled_seats?.length > 0 &&
                 detailModal.booking.seats?.length > 0 &&
                 detailModal.booking.status !== 'cancelled' && (
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                      <span className="text-gray-600">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
                      <span className="text-gray-600">Cancelled</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Bookings</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Event Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Event</label>
            <div className="relative">
              <select
                value={filters.event}
                onChange={(e) => handleFilterChange('event', e.target.value)}
                className="w-full h-11 pl-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Show Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Show Date</label>
            <div className="relative">
              <DatePicker
                selected={filters.show_date ? new Date(filters.show_date + 'T00:00:00') : null}
                onChange={(date) => {
                  if (date) {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const formatted = `${year}-${month}-${day}`
                    handleFilterChange('show_date', formatted)
                  } else {
                    handleFilterChange('show_date', '')
                  }
                }}
                dateFormat="dd MMM yyyy"
                placeholderText="Select date"
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                wrapperClassName="w-full"
                className="w-full h-11 pl-10 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full h-11 pl-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Clear Filters - only shows when filters active */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={bookings}
        emptyMessage="No bookings found."
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />
    </AdminLayout>
  )
}

export default BookingListPage
