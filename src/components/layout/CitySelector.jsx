import { useState, useRef, useEffect } from 'react'
import { useCity } from '../../context/CityContext'

function CitySelector() {
  const { cities, selectedCity, selectCity, clearCity } = useCity()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (cities.length === 0) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{selectedCity || 'All Cities'}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
          <button
            onClick={() => { clearCity(); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
              !selectedCity ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-700'
            }`}
          >
            All Cities
          </button>
          <hr className="my-1 border-gray-100" />
          {cities.map(city => (
            <button
              key={city}
              onClick={() => { selectCity(city); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                selectedCity === city ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-700'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CitySelector
