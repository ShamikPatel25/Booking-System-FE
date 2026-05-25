import api from './api'

// Get events with pagination
export const getEvents = async (page = 1, pageSize = 12, params = {}) => {
  const response = await api.get('/events/', {
    params: { page, page_size: pageSize, ...params }
  })
  return response.data
}

// Get single event by ID
export const getEventById = async (id) => {
  const response = await api.get(`/events/${id}/`)
  return response.data
}

// Get shows for an event
export const getEventShows = async (eventId, params = {}) => {
  const response = await api.get(`/events/${eventId}/shows/`, { params })
  return response.data
}

// Get all categories
export const getCategories = async () => {
  const response = await api.get('/categories/')
  return response.data
}
