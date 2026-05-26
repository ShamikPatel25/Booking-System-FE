import { formatDateLong, formatTime } from './dateUtils'

export const generateTicketPdf = async (booking, qrCode, seatLabels, expired = false) => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150]
  })

  const width = 100
  const primaryColor = expired ? [107, 114, 128] : [99, 102, 241]

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

  doc.setTextColor(17, 24, 39)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(booking?.show?.event?.title || 'Event', width / 2, 28, { align: 'center' })

  doc.setTextColor(107, 114, 128)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(booking?.show?.event?.language || '', width / 2, 34, { align: 'center' })

  doc.setFontSize(6)
  doc.setTextColor(156, 163, 175)
  doc.text('DATE', 5, 42)
  doc.text('TIME', 52, 42)

  doc.setFontSize(8)
  doc.setTextColor(17, 24, 39)
  doc.text(formatDateLong(booking?.show?.show_date), 5, 47)
  doc.text(formatTime(booking?.show?.start_time), 52, 47)

  doc.setFontSize(6)
  doc.setTextColor(156, 163, 175)
  doc.text('VENUE', 5, 54)
  doc.text('SCREEN', 52, 54)

  doc.setFontSize(8)
  doc.setTextColor(17, 24, 39)
  doc.text(booking?.show?.screen?.venue?.name || 'N/A', 5, 59)
  doc.text(booking?.show?.screen?.name || 'N/A', 52, 59)

  doc.setFillColor(243, 244, 246)
  doc.rect(5, 64, width - 10, 14, 'F')
  doc.setFontSize(6)
  doc.setTextColor(156, 163, 175)
  doc.text('SEATS', 8, 69)
  doc.setFontSize(10)
  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'bold')
  doc.text(seatLabels, 8, 75)

  doc.setDrawColor(229, 231, 235)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(5, 82, width - 5, 82)
  doc.setLineDashPattern([], 0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('Total Paid', 5, 89)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.text(`Rs. ${parseFloat(booking?.total_amount || 0).toFixed(0)}`, width - 5, 89, { align: 'right' })

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
}
