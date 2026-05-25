import api from './api'

export const getWishlist = async () => {
  const response = await api.get('/users/wishlist/')
  return response.data
}

export const toggleWishlist = async (eventId) => {
  const response = await api.post('/users/wishlist/toggle/', { event_id: eventId })
  return response.data
}

export const checkWishlist = async (eventId) => {
  const response = await api.get('/users/wishlist/check/', { params: { event_id: eventId } })
  return response.data
}

export const removeFromWishlist = async (wishlistId) => {
  const response = await api.delete(`/users/wishlist/${wishlistId}/`)
  return response.data
}
