import api from './api'

export const getStripeConfig = async () => {
  const response = await api.get('/payments/config/')
  return response.data
}

export const createPaymentIntent = async (bookingId) => {
  const response = await api.post('/payments/create_intent/', { booking_id: bookingId })
  return response.data
}

export const confirmPayment = async (paymentIntentId) => {
  const response = await api.post('/payments/confirm/', { payment_intent_id: paymentIntentId })
  return response.data
}

export const processSimulatedPayment = async (bookingId, simulateFailure = false) => {
  const response = await api.post('/payments/process/', {
    booking_id: bookingId,
    simulate_failure: simulateFailure
  })
  return response.data
}
