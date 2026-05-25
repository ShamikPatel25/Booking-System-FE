import { useState, useEffect, useRef } from 'react'
import { getBookingQRCode } from '../services/bookingService'

function TicketModal({ booking, onClose }) {
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const ticketRef = useRef(null)

  useEffect(() => {
    if (booking?.id) {
      setLoading(true)
      getBookingQRCode(booking.id)
        .then(data => setQrCode(data.qr_code))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [booking])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(hours, minutes)
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isExpired = () => {
    if (!booking?.show?.show_date || !booking?.show?.start_time) return false
    const showDateTime = new Date(`${booking.show.show_date}T${booking.show.start_time}`)
    return showDateTime < new Date()
  }

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)

    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150]
      })

      const width = 100
      const primaryColor = expired ? [107, 114, 128] : [99, 102, 241]

      // Header
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, width, 18, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('E-TICKET', 5, 6)

      doc.setFontSize(10)
      doc.text(booking?.booking_reference || '', 5, 13)

      if (expired) {
        doc.setFillColor(239, 68, 68)
        doc.rect(width - 22, 3, 18, 6, 'F')
        doc.setFontSize(6)
        doc.text('EXPIRED', width - 20, 7)
      }

      // Event title
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      const title = booking?.show?.event?.title || 'Event'
      doc.text(title, width / 2, 28, { align: 'center' })

      // Language
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(booking?.show?.event?.language || '', width / 2, 34, { align: 'center' })

      // Details
      doc.setFontSize(6)
      doc.setTextColor(156, 163, 175)
      doc.text('DATE', 5, 42)
      doc.text('TIME', 52, 42)

      doc.setFontSize(8)
      doc.setTextColor(17, 24, 39)
      doc.text(formatDate(booking?.show?.show_date), 5, 47)
      doc.text(formatTime(booking?.show?.start_time), 52, 47)

      doc.setFontSize(6)
      doc.setTextColor(156, 163, 175)
      doc.text('VENUE', 5, 54)
      doc.text('SCREEN', 52, 54)

      doc.setFontSize(8)
      doc.setTextColor(17, 24, 39)
      doc.text(booking?.show?.screen?.venue?.name || 'N/A', 5, 59)
      doc.text(booking?.show?.screen?.name || 'N/A', 52, 59)

      // Seats box
      doc.setFillColor(243, 244, 246)
      doc.rect(5, 64, width - 10, 14, 'F')
      doc.setFontSize(6)
      doc.setTextColor(156, 163, 175)
      doc.text('SEATS', 8, 69)
      doc.setFontSize(10)
      doc.setTextColor(17, 24, 39)
      doc.setFont('helvetica', 'bold')
      doc.text(seatLabels, 8, 75)

      // Dashed line
      doc.setDrawColor(229, 231, 235)
      doc.setLineDashPattern([1, 1], 0)
      doc.line(5, 82, width - 5, 82)
      doc.setLineDashPattern([], 0)

      // Total
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text('Total Paid', 5, 89)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...primaryColor)
      doc.text(`Rs. ${parseFloat(booking?.total_amount || 0).toFixed(0)}`, width - 5, 89, { align: 'right' })

      // QR Code
      if (qrCode) {
        doc.setFillColor(249, 250, 251)
        doc.rect(0, 95, width, 55, 'F')

        const qrSize = 30
        const qrX = (width - qrSize) / 2
        doc.addImage(qrCode, 'PNG', qrX, 100, qrSize, qrSize)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(156, 163, 175)
        doc.text(expired ? 'This ticket has expired' : 'Scan at venue for entry', width / 2, 138, { align: 'center' })
      }

      doc.save(`ticket-${booking.booking_reference}.pdf`)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const seatLabels = booking?.seats?.map(s => `${s.row_label}${s.seat_number}`).join(', ') || 'N/A'
  const expired = isExpired()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Your Ticket</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Ticket Content */}
        <div className="overflow-y-auto flex-1">
          <div ref={ticketRef} className="bg-white">
            {/* Ticket Header */}
            <div className={`${expired ? 'bg-gray-500' : 'bg-gradient-to-r from-primary-500 to-primary-600'} text-white px-6 py-4`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium tracking-wider">E-TICKET</span>
                {expired && <span className="px-2 py-1 bg-red-500 text-xs font-bold rounded">EXPIRED</span>}
              </div>
              <p className="font-mono font-bold text-lg mt-1">{booking?.booking_reference}</p>
            </div>

            {/* Event Info */}
            <div className="p-6">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {booking?.show?.event?.title || 'Event'}
                </h2>
                {booking?.show?.event?.language && (
                  <span className="text-sm text-gray-500">{booking.show.event.language}</span>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-400 uppercase text-xs">Date</span>
                  <p className="font-medium text-gray-900">{formatDate(booking?.show?.show_date)}</p>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-xs">Time</span>
                  <p className="font-medium text-gray-900">{formatTime(booking?.show?.start_time)}</p>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-xs">Venue</span>
                  <p className="font-medium text-gray-900">{booking?.show?.screen?.venue?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-xs">Screen</span>
                  <p className="font-medium text-gray-900">{booking?.show?.screen?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Seats */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <span className="text-gray-400 uppercase text-xs">Seats</span>
                <p className="text-lg font-bold text-gray-900">{seatLabels}</p>
              </div>

              {/* Amount */}
              <div className="flex justify-between items-center py-3 border-t border-dashed border-gray-200">
                <span className="text-gray-500">Total Paid</span>
                <span className="text-xl font-bold text-primary-600">
                  ₹{parseFloat(booking?.total_amount || 0).toFixed(0)}
                </span>
              </div>
            </div>

            {/* QR Code */}
            <div className={`${expired ? 'bg-gray-100' : 'bg-gray-50'} px-6 py-6 text-center`}>
              {loading ? (
                <div className="inline-block p-3 bg-white rounded-xl shadow-sm">
                  <div className="w-32 h-32 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                </div>
              ) : qrCode ? (
                <div className={`inline-block p-3 bg-white rounded-xl shadow-sm ${expired ? 'opacity-50' : ''}`}>
                  <img src={qrCode} alt="QR Code" className="w-32 h-32" />
                </div>
              ) : (
                <div className="inline-block p-3 bg-white rounded-xl shadow-sm">
                  <div className="w-32 h-32 flex items-center justify-center text-gray-400 text-sm">
                    QR unavailable
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {expired ? 'This ticket has expired' : 'Scan at venue for entry'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
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
        </div>
      </div>
    </div>
  )
}

export default TicketModal
