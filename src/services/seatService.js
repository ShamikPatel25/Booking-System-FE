import api from './api'

// Get all seats for a show
export const getShowSeats = async (showId) => {
  const response = await api.get(`/shows/${showId}/seats/`)
  return response.data
}

// Get seat categories with pricing for a show
export const getSeatCategories = async (showId) => {
  const response = await api.get(`/shows/${showId}/pricing/`)
  return response.data
}

// Lock selected seats
export const lockSeats = async (showId, seatIds) => {
  const response = await api.post(`/shows/${showId}/seats/lock/`, {
    seat_ids: seatIds
  })
  return response.data
}

// Unlock seats
export const unlockSeats = async (showId, seatIds) => {
  const response = await api.post(`/shows/${showId}/seats/unlock/`, {
    seat_ids: seatIds
  })
  return response.data
}

// Generate seats for a show (admin only)
export const generateSeats = async (showId) => {
  const response = await api.post(`/shows/${showId}/seats/generate/`)
  return response.data
}
