import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const CityContext = createContext()

export function CityProvider({ children }) {
  const [cities, setCities] = useState([])
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('selectedCity') || ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCities()
  }, [])

  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem('selectedCity', selectedCity)
    } else {
      localStorage.removeItem('selectedCity')
    }
  }, [selectedCity])

  const fetchCities = async () => {
    try {
      const response = await api.get('/venues/cities/')
      setCities(response.data.cities || [])
    } catch (err) {
      console.error('Failed to fetch cities:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectCity = (city) => {
    setSelectedCity(city)
  }

  const clearCity = () => {
    setSelectedCity('')
  }

  return (
    <CityContext.Provider value={{
      cities,
      selectedCity,
      selectCity,
      clearCity,
      loading
    }}>
      {children}
    </CityContext.Provider>
  )
}

export function useCity() {
  const context = useContext(CityContext)
  if (!context) {
    throw new Error('useCity must be used within a CityProvider')
  }
  return context
}
