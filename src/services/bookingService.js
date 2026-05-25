import api from './api'

// Create a booking
export const createBooking = async (showId, seatIds) => {
  const response = await api.post('/bookings/', {
    show_id: showId,
    seat_ids: seatIds
  })
  return response.data
}

// Get user's bookings with pagination
export const getMyBookings = async (page = 1, pageSize = 10) => {
  const response = await api.get('/bookings/', {
    params: { page, page_size: pageSize }
  })
  return response.data
}

// Get booking by ID
export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}/`)
  return response.data
}

// Cancel booking
export const cancelBooking = async (id) => {
  const response = await api.post(`/bookings/${id}/cancel/`)
  return response.data
}

// Cancel specific seats from a booking (partial cancellation)
export const cancelSeats = async (bookingId, seatIds) => {
  const response = await api.post(`/bookings/${bookingId}/cancel_seats/`, {
    seat_ids: seatIds
  })
  return response.data
}
