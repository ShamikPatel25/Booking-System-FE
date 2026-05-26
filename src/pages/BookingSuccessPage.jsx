import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { getBookingQRCode } from '../services/bookingService'
import { formatDateLong, formatTime } from '../utils/dateUtils'
import { generateTicketPdf } from '../utils/ticketPdf'

function BookingSuccessPage() {
  const location = useLocation()
  const { booking, payment, seats } = location.state || {}
  const [qrCode, setQrCode] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (booking?.id) {
      getBookingQRCode(booking.id)
        .then(data => setQrCode(data.qr_code))
        .catch(() => {})
    }
  }, [booking])

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🎫</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Booking Found</h2>
        <p className="text-gray-500 mb-6">Please make a booking first.</p>
        <Link to="/" className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600">
          Go to Home
        </Link>
      </div>
    )
  }

  const seatLabels = seats?.map(s => `${s.row_label}${s.seat_number}`).join(', ') ||
    booking.seats?.map(s => `${s.row_label}${s.seat_number}`).join(', ') || 'N/A'

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)

    try {
      await generateTicketPdf(booking, qrCode, seatLabels)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8 px-4">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500">Your tickets have been booked successfully</p>
      </div>

      {/* Ticket Card */}
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4 flex justify-between items-center">
            <span className="text-sm font-medium tracking-wider">E-TICKET</span>
            <span className="font-mono font-bold">{booking.booking_reference}</span>
          </div>

          {/* Ticket Body */}
          <div className="p-6">
            {/* Event Info */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {booking.show?.event?.title || 'Event'}
              </h2>
              {booking.show?.event?.language && (
                <span className="text-sm text-gray-500">{booking.show.event.language}</span>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Date</span>
                <p className="font-medium text-gray-900">{formatDateLong(booking.show?.show_date)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Time</span>
                <p className="font-medium text-gray-900">{formatTime(booking.show?.start_time)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Venue</span>
                <p className="font-medium text-gray-900">{booking.show?.screen?.venue?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Screen</span>
                <p className="font-medium text-gray-900">{booking.show?.screen?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Seats */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Seats</span>
              <p className="text-lg font-bold text-gray-900">{seatLabels}</p>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute left-0 -ml-6 w-6 h-6 bg-primary-50 rounded-full" />
              <div className="absolute right-0 -mr-6 w-6 h-6 bg-primary-50 rounded-full" />
              <div className="border-t-2 border-dashed border-gray-200" />
            </div>

            {/* Amount & Payment */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-gray-500">Total Amount</span>
                <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  PAID
                </span>
              </div>
              <span className="text-2xl font-bold text-primary-600">
                ₹{parseFloat(booking.total_amount).toFixed(0)}
              </span>
            </div>
            <p className="text-xs text-gray-400 text-right">Txn: {payment?.transaction_id}</p>
          </div>

          {/* QR Code */}
          <div className="bg-gray-50 px-6 py-6 text-center">
            {qrCode ? (
              <div className="inline-block p-3 bg-white rounded-xl shadow-sm">
                <img src={qrCode} alt="Ticket QR Code" className="w-32 h-32" />
              </div>
            ) : (
              <div className="inline-block p-3 bg-white rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              </div>
            )}
            <p className="text-xs font-mono text-gray-500 mt-3">{booking.booking_reference}</p>
            <p className="text-xs text-gray-400 mt-1">Scan at venue for entry</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3 text-center bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </>
            )}
          </button>
          <div className="flex gap-3">
            <Link
              to="/my-bookings"
              className="flex-1 py-3 text-center border-2 border-primary-500 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="flex-1 py-3 text-center border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Book More Tickets
            </Link>
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-sm text-gray-400 mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  )
}

export default BookingSuccessPage
