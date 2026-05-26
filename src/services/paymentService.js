import api from './api'

// Process simulated payment for a booking
export const processSimulatedPayment = async (bookingId, simulateFailure = false) => {
  const response = await api.post('/payments/process/', {
    booking_id: bookingId,
    simulate_failure: simulateFailure
  })
  return response.data
}

// Create Stripe PaymentIntent
export const createPaymentIntent = async (bookingId) => {
  const response = await api.post('/payments/create_intent/', {
    booking_id: bookingId
  })
  return response.data
}

// Confirm payment after Stripe success
export const confirmPayment = async (paymentIntentId) => {
  const response = await api.post('/payments/confirm/', {
    payment_intent_id: paymentIntentId
  })
  return response.data
}

// Get Stripe config (publishable key)
export const getStripeConfig = async () => {
  const response = await api.get('/payments/config/')
  return response.data
}

// Process payment for a booking (legacy)
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
