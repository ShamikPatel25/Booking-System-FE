export const parseApiError = (err, fallbackMessage = 'An error occurred') => {
  if (!err.response?.data) return fallbackMessage

  const errors = err.response.data

  if (typeof errors === 'string') return errors
  if (errors.detail) return errors.detail

  const firstError = Object.values(errors)[0]
  return Array.isArray(firstError) ? firstError[0] : (firstError || fallbackMessage)
}
