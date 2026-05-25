import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AdminLayout } from '../../components/admin'
import {
  getEvent, getShow, createShow, updateShow, getVenues,
  getShowPricing, setShowPricingBulk, getScreenSeatCategories
} from '../../services/adminService'
import { Spinner } from '../../components/ui'

function ShowFormPage() {
  const { eventId, showId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(showId)
  const lastFetchKeyRef = useRef(null)

  const [event, setEvent] = useState(null)
  const [venues, setVenues] = useState([])
  const [selectedScreen, setSelectedScreen] = useState(null)
  const [screenCategories, setScreenCategories] = useState([])
  const [pricing, setPricing] = useState({})
  const [formData, setFormData] = useState({
    screen: '',
    show_date: '',
    start_time: '',
    end_time: '',
    is_active: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPricing, setSavingPricing] = useState(false)
  const [error, setError] = useState('')
  const [pricingError, setPricingError] = useState('')
  const [showCreated, setShowCreated] = useState(false)
  const [createdShowId, setCreatedShowId] = useState(null)

  useEffect(() => {
    const fetchKey = `${eventId}-${showId}`
    if (lastFetchKeyRef.current === fetchKey) return
    lastFetchKeyRef.current = fetchKey
    fetchData()
  }, [eventId, showId])

  const fetchData = async () => {
    try {
      const [eventData, venuesData] = await Promise.all([
        getEvent(eventId),
        getVenues(1, 100)
      ])
      setEvent(eventData)
      setVenues(venuesData.results || venuesData)

      if (isEdit) {
        const show = await getShow(eventId, showId)
        const screenId = typeof show.screen === 'object' ? show.screen.id : show.screen
        setFormData({
          screen: screenId || '',
          show_date: show.show_date || '',
          start_time: show.start_time || '',
          end_time: show.end_time || '',
          is_active: show.is_active !== false
        })

        // Load screen categories and existing pricing
        if (screenId) {
          const categories = await getScreenSeatCategories(screenId)
          setScreenCategories(categories.results || categories)

          const existingPricing = await getShowPricing(showId)
          const pricingMap = {}
          ;(existingPricing.results || existingPricing).forEach(p => {
            pricingMap[p.screen_seat_category] = p.price
          })
          setPricing(pricingMap)

          // Find selected screen
          for (const venue of (venuesData.results || venuesData)) {
            const screen = venue.screens?.find(s => s.id === screenId)
            if (screen) {
              setSelectedScreen(screen)
              break
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })

    // When screen changes, load its categories
    if (name === 'screen' && value) {
      loadScreenCategories(value)
    }
  }

  const loadScreenCategories = async (screenId) => {
    try {
      const categories = await getScreenSeatCategories(screenId)
      setScreenCategories(categories.results || categories)
      // Reset pricing when screen changes
      setPricing({})

      // Find selected screen
      for (const venue of venues) {
        const screen = venue.screens?.find(s => s.id === screenId)
        if (screen) {
          setSelectedScreen(screen)
          break
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handlePricingChange = (categoryId, value) => {
    setPricing({ ...pricing, [categoryId]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.screen || !formData.show_date || !formData.start_time || !formData.end_time) {
      setError('All fields are required')
      return
    }

    // Check if all categories have pricing
    const allPriced = screenCategories.every(cat => pricing[cat.id] && parseFloat(pricing[cat.id]) >= 0)
    if (!allPriced && screenCategories.length > 0) {
      setError('Please set pricing for all seat categories')
      return
    }

    setSaving(true)
    setError('')

    try {
      const data = {
        screen: formData.screen,
        show_date: formData.show_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_active: formData.is_active
      }

      let targetShowId = showId

      if (isEdit) {
        await updateShow(eventId, showId, data)
      } else {
        const newShow = await createShow(eventId, data)
        targetShowId = newShow.id
        setCreatedShowId(newShow.id)
        setShowCreated(true)
      }

      // Save pricing and generate seats
      if (screenCategories.length > 0) {
        const pricingData = screenCategories.map(cat => ({
          screen_seat_category: cat.id,
          price: parseFloat(pricing[cat.id]) || 0
        }))
        await setShowPricingBulk(targetShowId, pricingData)
      }

      navigate(`/admin/events/${eventId}/shows`, {
        state: {
          toast: {
            message: isEdit ? 'Show updated successfully' : 'Show created with pricing. Seats generated.',
            type: 'success'
          }
        }
      })
    } catch (err) {
      const errorData = err.response?.data
      const errorMsg = errorData?.non_field_errors?.[0] || errorData?.detail || errorData?.show_date?.[0] || 'Failed to save show'
      setError(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <Spinner.Page message="Loading..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/admin/events/${eventId}/shows`} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Show' : 'Add Show'}
            </h1>
            <p className="text-gray-500">{event?.title}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Show Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Show Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue & Screen *</label>
              <select
                name="screen"
                value={formData.screen}
                onChange={handleChange}
                disabled={isEdit}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select screen</option>
                {venues.map(venue => (
                  <optgroup key={venue.id} label={`${venue.name} - ${venue.city}`}>
                    {venue.screens?.map(screen => (
                      <option key={screen.id} value={screen.id}>
                        {screen.name} ({screen.total_seats || 0} seats)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {isEdit && (
                <p className="mt-1 text-xs text-gray-500">Screen cannot be changed after show is created</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Show Date *</label>
              <input
                type="date"
                name="show_date"
                value={formData.show_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Show is active (visible to users)
              </label>
            </div>
          </div>

          {/* Pricing Section */}
          {formData.screen && screenCategories.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Pricing</h2>
              <p className="text-sm text-gray-500 mb-4">
                Set the price for each seat category for this show
              </p>

              {pricingError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{pricingError}</div>
              )}

              <div className="space-y-3">
                {screenCategories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{cat.name}</div>
                      <div className="text-xs text-gray-500">
                        Rows {cat.row_start}-{cat.row_end} ({cat.total_seats} seats)
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={pricing[cat.id] || ''}
                          onChange={(e) => handlePricingChange(cat.id, e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.screen && screenCategories.length === 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-700">
              <strong>Note:</strong> This screen has no seat categories configured.
              <Link
                to={`/admin/venues/${selectedScreen?.venue?.id}/screens/${formData.screen}`}
                className="ml-1 underline"
              >
                Configure seat map first
              </Link>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || (screenCategories.length > 0 && !Object.keys(pricing).length)}
              className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Show' : 'Create Show'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/events/${eventId}/shows`)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default ShowFormPage
