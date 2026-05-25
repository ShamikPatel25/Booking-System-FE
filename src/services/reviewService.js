import api from './api'

export const getEventReviews = async (eventId) => {
  const response = await api.get(`/events/${eventId}/reviews/`)
  return response.data
}

export const getReviewStats = async (eventId) => {
  const response = await api.get(`/events/${eventId}/reviews/stats/`)
  return response.data
}

export const canReview = async (eventId) => {
  const response = await api.get(`/events/${eventId}/reviews/can_review/`)
  return response.data
}

export const createReview = async (eventId, reviewData) => {
  const response = await api.post(`/events/${eventId}/reviews/`, reviewData)
  return response.data
}

export const updateReview = async (eventId, reviewId, reviewData) => {
  const response = await api.patch(`/events/${eventId}/reviews/${reviewId}/`, reviewData)
  return response.data
}

export const deleteReview = async (eventId, reviewId) => {
  const response = await api.delete(`/events/${eventId}/reviews/${reviewId}/`)
  return response.data
}
