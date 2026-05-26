export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...options
  })
}

export const formatDateLong = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export const formatDateShort = (dateStr) => {
  if (!dateStr) return { day: '', month: '', weekday: '' }
  const date = new Date(dateStr)
  return {
    day: date.toLocaleDateString('en-IN', { day: 'numeric' }),
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' })
  }
}

export const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const date = new Date()
  date.setHours(hours, minutes)
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export const isShowExpired = (showDate, startTime) => {
  if (!showDate || !startTime) return false
  const showDateTime = new Date(`${showDate}T${startTime}`)
  return showDateTime < new Date()
}
