import api from './api'

// Categories
export const getCategories = async (page = 1, pageSize = 10) => {
  const response = await api.get('/categories/', { params: { page, page_size: pageSize } })
  return response.data
}

export const createCategory = async (data) => {
  const response = await api.post('/categories/', data)
  return response.data
}

export const updateCategory = async (id, data) => {
  const response = await api.patch(`/categories/${id}/`, data)
  return response.data
}

export const deleteCategory = async (id) => {
  await api.delete(`/categories/${id}/`)
}

// Events
export const getEvents = async (page = 1, pageSize = 10) => {
  const response = await api.get('/events/', { params: { page, page_size: pageSize } })
  return response.data
}

export const getEvent = async (id) => {
  const response = await api.get(`/events/${id}/`)
  return response.data
}

export const createEvent = async (data) => {
  const hasFile = data.poster instanceof File || data.banner instanceof File
  if (hasFile) {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await api.post('/events/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  } else {
    const response = await api.post('/events/', data)
    return response.data
  }
}

export const updateEvent = async (id, data) => {
  const hasFile = data.poster instanceof File || data.banner instanceof File
  if (hasFile) {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await api.patch(`/events/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  } else {
    const response = await api.patch(`/events/${id}/`, data)
    return response.data
  }
}

export const deleteEvent = async (id) => {
  await api.delete(`/events/${id}/`)
}

// Shows (nested under events)
export const getShows = async (eventId, page = 1, pageSize = 10) => {
  const response = await api.get(`/events/${eventId}/shows/`, { params: { page, page_size: pageSize } })
  return response.data
}

export const getShow = async (eventId, showId) => {
  const response = await api.get(`/events/${eventId}/shows/${showId}/`)
  return response.data
}

export const createShow = async (eventId, data) => {
  const response = await api.post(`/events/${eventId}/shows/`, data)
  return response.data
}

export const updateShow = async (eventId, showId, data) => {
  const response = await api.patch(`/events/${eventId}/shows/${showId}/`, data)
  return response.data
}

export const deleteShow = async (eventId, showId) => {
  await api.delete(`/events/${eventId}/shows/${showId}/`)
}

// Venues
export const getVenues = async (page = 1, pageSize = 10) => {
  const response = await api.get('/venues/', { params: { page, page_size: pageSize } })
  return response.data
}

export const getVenue = async (id) => {
  const response = await api.get(`/venues/${id}/`)
  return response.data
}

export const createVenue = async (data) => {
  const response = await api.post('/venues/', data)
  return response.data
}

export const updateVenue = async (id, data) => {
  const response = await api.patch(`/venues/${id}/`, data)
  return response.data
}

export const deleteVenue = async (id) => {
  await api.delete(`/venues/${id}/`)
}

// Screens (nested under venues)
export const getScreens = async (venueId, page = 1, pageSize = 10) => {
  const response = await api.get(`/venues/${venueId}/screens/`, { params: { page, page_size: pageSize } })
  return response.data
}

export const getScreen = async (venueId, screenId) => {
  const response = await api.get(`/venues/${venueId}/screens/${screenId}/`)
  return response.data
}

export const createScreen = async (venueId, data) => {
  const response = await api.post(`/venues/${venueId}/screens/`, data)
  return response.data
}

export const updateScreen = async (venueId, screenId, data) => {
  const response = await api.patch(`/venues/${venueId}/screens/${screenId}/`, data)
  return response.data
}

export const deleteScreen = async (venueId, screenId) => {
  await api.delete(`/venues/${venueId}/screens/${screenId}/`)
}

// Screen Blocked Seats (screen-level maintenance blocking)
export const getScreenBlockedSeats = async (venueId, screenId) => {
  const response = await api.get(`/venues/${venueId}/screens/${screenId}/blocked_seats/`)
  return response.data
}

export const blockScreenSeats = async (venueId, screenId, seats) => {
  const response = await api.post(`/venues/${venueId}/screens/${screenId}/block-seats/`, { seats })
  return response.data
}

export const unblockScreenSeats = async (venueId, screenId, seats) => {
  const response = await api.post(`/venues/${venueId}/screens/${screenId}/unblock-seats/`, { seats })
  return response.data
}

export const syncScreenBlockedSeats = async (venueId, screenId) => {
  const response = await api.post(`/venues/${venueId}/screens/${screenId}/sync-blocked-seats/`)
  return response.data
}

// Screen Seat Categories (seat map at screen level)
export const getScreenSeatCategories = async (screenId) => {
  const response = await api.get(`/venues/screens/${screenId}/categories/`)
  return response.data
}

export const createScreenSeatCategory = async (screenId, data) => {
  const response = await api.post(`/venues/screens/${screenId}/categories/`, data)
  return response.data
}

export const updateScreenSeatCategory = async (screenId, categoryId, data) => {
  const response = await api.patch(`/venues/screens/${screenId}/categories/${categoryId}/`, data)
  return response.data
}

export const deleteScreenSeatCategory = async (screenId, categoryId) => {
  await api.delete(`/venues/screens/${screenId}/categories/${categoryId}/`)
}

// Show Pricing (price per category per show)
export const getShowPricing = async (showId) => {
  const response = await api.get(`/shows/${showId}/pricing/`)
  return response.data
}

export const setShowPricingBulk = async (showId, pricing) => {
  const response = await api.post(`/shows/${showId}/pricing/bulk_set/`, { pricing })
  return response.data
}

export const updateShowPricing = async (showId, pricingId, data) => {
  const response = await api.patch(`/shows/${showId}/pricing/${pricingId}/`, data)
  return response.data
}

// Generate Seats
export const generateSeats = async (showId) => {
  const response = await api.post(`/shows/${showId}/seats/generate/`)
  return response.data
}

// Get Seat Stats
export const getSeatStats = async (showId) => {
  const response = await api.get(`/shows/${showId}/seats/stats/`)
  return response.data
}

// Clear Seats
export const clearSeats = async (showId) => {
  const response = await api.post(`/shows/${showId}/seats/clear/`)
  return response.data
}

// Block Seats
export const blockSeats = async (showId, seatIds) => {
  const response = await api.post(`/shows/${showId}/seats/block/`, { seat_ids: seatIds })
  return response.data
}

// Unblock Seats
export const unblockSeats = async (showId, seatIds) => {
  const response = await api.post(`/shows/${showId}/seats/unblock/`, { seat_ids: seatIds })
  return response.data
}

// Get Seats for a show
export const getShowSeats = async (showId) => {
  const response = await api.get(`/shows/${showId}/seats/`)
  return response.data
}

// All Bookings (admin)
export const getAllBookings = async (page = 1, pageSize = 10, filters = {}) => {
  const params = { page, page_size: pageSize }
  if (filters.event) params.event = filters.event
  if (filters.show_date) params.show_date = filters.show_date
  if (filters.status) params.status = filters.status
  const response = await api.get('/bookings/', { params })
  return response.data
}

export const getBookingDetail = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}/`)
  return response.data
}

export const cancelBooking = async (bookingId) => {
  const response = await api.post(`/bookings/${bookingId}/cancel/`)
  return response.data
}

export const cancelBookingSeats = async (bookingId, seatIds) => {
  const response = await api.post(`/bookings/${bookingId}/cancel_seats/`, { seat_ids: seatIds })
  return response.data
}

// Dashboard stats
export const getDashboardStats = async () => {
  const [events, venues, bookings, categories] = await Promise.all([
    api.get('/events/', { params: { page: 1, page_size: 1 } }),
    api.get('/venues/', { params: { page: 1, page_size: 1 } }),
    api.get('/bookings/', { params: { page: 1, page_size: 1 } }),
    api.get('/categories/', { params: { page: 1, page_size: 1 } })
  ])

  return {
    totalEvents: events.data.count || 0,
    totalVenues: venues.data.count || 0,
    totalBookings: bookings.data.count || 0,
    totalCategories: categories.data.count || 0
  }
}
