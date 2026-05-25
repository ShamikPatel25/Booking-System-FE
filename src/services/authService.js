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

// Update user profile
export const updateProfile = async (userId, profileData) => {
  const response = await api.patch(`/users/${userId}/`, profileData)
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

// Request password reset email
export const requestPasswordReset = async (email) => {
  const response = await api.post('/users/auth/password-reset/', {
    email
  })
  return response.data
}

// Confirm password reset with token
export const confirmPasswordReset = async (token, newPassword, confirmPassword) => {
  const response = await api.post('/users/auth/password-reset-confirm/', {
    token,
    new_password: newPassword,
    confirm_password: confirmPassword
  })
  return response.data
}
