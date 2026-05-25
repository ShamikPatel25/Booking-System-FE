import api from './api'

// Login user
export const login = async (username, password) => {
  const response = await api.post('/users/auth/login/', {
    username,
    password
  })
  return response.data
}

// Register new user
export const register = async (userData) => {
  const response = await api.post('/users/', userData)
  return response.data
}

// Get current user profile
export const getProfile = async () => {
  const response = await api.get('/users/profile/')
  return response.data
}

// Change password
export const changePassword = async (oldPassword, newPassword) => {
  const response = await api.post('/users/change-password/', {
    old_password: oldPassword,
    new_password: newPassword
  })
  return response.data
}

// Refresh access token
export const refreshToken = async (refresh) => {
  const response = await api.post('/users/auth/token/refresh/', {
    refresh
  })
  return response.data
}
