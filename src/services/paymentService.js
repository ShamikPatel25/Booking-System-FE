import api from './api'

// Process payment for a booking
export const processPayment = async (bookingId) => {
  const response = await api.post('/payments/process/', {
    booking_id: bookingId
  })
  return response.data
}

// Get user's payments
export const getMyPayments = async () => {
  const response = await api.get('/payments/')
  return response.data
}

// Get payment by ID
export const getPaymentById = async (id) => {
  const response = await api.get(`/payments/${id}/`)
  return response.data
}
