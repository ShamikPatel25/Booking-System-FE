import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AdminLayout } from '../../components/admin'
import {
  getVenue, getScreen, createScreen, updateScreen,
  getScreenSeatCategories, createScreenSeatCategory,
  updateScreenSeatCategory, deleteScreenSeatCategory,
  blockScreenSeats, unblockScreenSeats
} from '../../services/adminService'
import { Spinner, ToastContainer } from '../../components/ui'

function ScreenFormPage() {
  const { venueId, screenId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(screenId)
  const lastFetchKeyRef = useRef(null)

  const [venue, setVenue] = useState(null)
  const [screen, setScreen] = useState(null)
  const [formData, setFormData] = useState({ name: '' })
  const [seatCategories, setSeatCategories] = useState([])
  const [blockedSeats, setBlockedSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [blockReason, setBlockReason] = useState('maintenance')
  const [newCategory, setNewCategory] = useState({
    name: '',
    row_start: '',
    row_end: '',
    seats_per_row: '',
    display_order: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [savingBlock, setSavingBlock] = useState(false)
  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    const fetchKey = `${venueId}-${screenId}`
    if (lastFetchKeyRef.current === fetchKey) return
    lastFetchKeyRef.current = fetchKey
    fetchData()
  }, [venueId, screenId])

  const fetchData = async () => {
    try {
      const venueData = await getVenue(venueId)
      setVenue(venueData)

      if (isEdit) {
        const screenData = await getScreen(venueId, screenId)
        setScreen(screenData)
        setFormData({ name: screenData.name || '' })
        setBlockedSeats(screenData.blocked_seats || [])

        const categories = await getScreenSeatCategories(screenId)
        setSeatCategories(categories.results || categories)
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleCategoryChange = (e) => {
    const { name, value } = e.target
    setNewCategory({ ...newCategory, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Screen name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (isEdit) {
        await updateScreen(venueId, screenId, { name: formData.name })
        navigate(`/admin/venues/${venueId}/screens`, {
          state: { toast: { message: 'Screen updated successfully', type: 'success' } }
        })
      } else {
        const newScreen = await createScreen(venueId, { name: formData.name })
        navigate(`/admin/venues/${venueId}/screens/${newScreen.id}`, {
          state: { toast: { message: 'Screen created. Now add seat categories.', type: 'success' } }
        })
      }
    } catch (err) {
      const errorData = err.response?.data
      const errorMsg = errorData?.name?.[0] || errorData?.detail || 'Failed to save screen'
      setError(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.name || !newCategory.row_start || !newCategory.row_end || !newCategory.seats_per_row) {
      setCategoryError('All fields are required')
      return
    }

    setSavingCategory(true)
    setCategoryError('')

    try {
      if (editingCategory) {
        await updateScreenSeatCategory(screenId, editingCategory.id, {
          name: newCategory.name,
          row_start: newCategory.row_start.toUpperCase(),
          row_end: newCategory.row_end.toUpperCase(),
          seats_per_row: parseInt(newCategory.seats_per_row),
          display_order: parseInt(newCategory.display_order) || 0
        })
      } else {
        await createScreenSeatCategory(screenId, {
          name: newCategory.name,
          row_start: newCategory.row_start.toUpperCase(),
          row_end: newCategory.row_end.toUpperCase(),
          seats_per_row: parseInt(newCategory.seats_per_row),
          display_order: parseInt(newCategory.display_order) || 0
        })
      }

      const categories = await getScreenSeatCategories(screenId)
      setSeatCategories(categories.results || categories)
      setNewCategory({ name: '', row_start: '', row_end: '', seats_per_row: '', display_order: 0 })
      setEditingCategory(null)
    } catch (err) {
      const errorData = err.response?.data
      const errorMsg = errorData?.name?.[0] || errorData?.row_start?.[0] || errorData?.detail || 'Failed to save category'
      setCategoryError(errorMsg)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleEditCategory = (cat) => {
    setEditingCategory(cat)
    setNewCategory({
      name: cat.name,
      row_start: cat.row_start,
      row_end: cat.row_end,
      seats_per_row: cat.seats_per_row,
      display_order: cat.display_order || 0
    })
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      await deleteScreenSeatCategory(screenId, categoryId)
      const categories = await getScreenSeatCategories(screenId)
      setSeatCategories(categories.results || categories)
    } catch (err) {
      const errorData = err.response?.data
      setCategoryError(errorData?.detail || 'Failed to delete category')
    }
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setNewCategory({ name: '', row_start: '', row_end: '', seats_per_row: '', display_order: 0 })
  }

  const isSeatBlocked = (row, seatNum) => {
    return blockedSeats.some(s => s.row === row && s.seat === seatNum)
  }

  const getBlockReason = (row, seatNum) => {
    const blocked = blockedSeats.find(s => s.row === row && s.seat === seatNum)
    return blocked?.reason || ''
  }

  const handleSeatClick = (row, seatNum) => {
    const key = `${row}-${seatNum}`
    setSelectedSeats(prev => {
      if (prev.includes(key)) {
        return prev.filter(s => s !== key)
      }
      return [...prev, key]
    })
  }

  const handleBlockSelected = async () => {
    if (selectedSeats.length === 0) return

    const seatsToBlock = selectedSeats
      .filter(key => {
        const [row, seat] = key.split('-')
        return !isSeatBlocked(row, parseInt(seat))
      })
      .map(key => {
        const [row, seat] = key.split('-')
        return { row, seat: parseInt(seat), reason: blockReason }
      })

    if (seatsToBlock.length === 0) {
      addToast('All selected seats are already blocked', 'warning')
      return
    }

    setSavingBlock(true)
    try {
      await blockScreenSeats(venueId, screenId, seatsToBlock)
      const screenData = await getScreen(venueId, screenId)
      setBlockedSeats(screenData.blocked_seats || [])
      setSelectedSeats([])
      addToast(`${seatsToBlock.length} seat(s) blocked`)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to block seats', 'error')
    } finally {
      setSavingBlock(false)
    }
  }

  const handleUnblockSelected = async () => {
    if (selectedSeats.length === 0) return

    const seatsToUnblock = selectedSeats
      .filter(key => {
        const [row, seat] = key.split('-')
        return isSeatBlocked(row, parseInt(seat))
      })
      .map(key => {
        const [row, seat] = key.split('-')
        return { row, seat: parseInt(seat) }
      })

    if (seatsToUnblock.length === 0) {
      addToast('No blocked seats selected', 'warning')
      return
    }

    setSavingBlock(true)
    try {
      await unblockScreenSeats(venueId, screenId, seatsToUnblock)
      const screenData = await getScreen(venueId, screenId)
      setBlockedSeats(screenData.blocked_seats || [])
      setSelectedSeats([])
      addToast(`${seatsToUnblock.length} seat(s) unblocked`)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to unblock seats', 'error')
    } finally {
      setSavingBlock(false)
    }
  }

  const handleApplyAll = async () => {
    if (selectedSeats.length === 0) return

    const seatsToBlock = selectedSeats
      .filter(key => {
        const [row, seat] = key.split('-')
        return !isSeatBlocked(row, parseInt(seat))
      })
      .map(key => {
        const [row, seat] = key.split('-')
        return { row, seat: parseInt(seat), reason: blockReason }
      })

    const seatsToUnblock = selectedSeats
      .filter(key => {
        const [row, seat] = key.split('-')
        return isSeatBlocked(row, parseInt(seat))
      })
      .map(key => {
        const [row, seat] = key.split('-')
        return { row, seat: parseInt(seat) }
      })

    setSavingBlock(true)
    try {
      const messages = []
      if (seatsToBlock.length > 0) {
        await blockScreenSeats(venueId, screenId, seatsToBlock)
        messages.push(`${seatsToBlock.length} blocked`)
      }
      if (seatsToUnblock.length > 0) {
        await unblockScreenSeats(venueId, screenId, seatsToUnblock)
        messages.push(`${seatsToUnblock.length} unblocked`)
      }
      const screenData = await getScreen(venueId, screenId)
      setBlockedSeats(screenData.blocked_seats || [])
      setSelectedSeats([])
      addToast(messages.join(', '))
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to apply changes', 'error')
    } finally {
      setSavingBlock(false)
    }
  }

  const totalSeats = seatCategories.reduce((sum, cat) => sum + (cat.total_seats || 0), 0)

  const categoryStyles = [
    { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', seatBorder: 'border-blue-400' },
    { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700', seatBorder: 'border-emerald-400' },
    { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', seatBorder: 'border-amber-400' },
    { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', seatBorder: 'border-purple-400' },
  ]

  const generateSeatPreview = () => {
    const sortedCategories = [...seatCategories].sort((a, b) => {
      const aStart = a.row_start.charCodeAt(0)
      const bStart = b.row_start.charCodeAt(0)
      return aStart - bStart
    })

    return sortedCategories.map((cat, idx) => {
      const rows = []
      const startCode = cat.row_start.charCodeAt(0)
      const endCode = cat.row_end.charCodeAt(0)

      for (let r = startCode; r <= endCode; r++) {
        const rowLabel = String.fromCharCode(r)
        const seats = []
        for (let s = 1; s <= cat.seats_per_row; s++) {
          seats.push({ number: s, rowLabel })
        }
        rows.push({ label: rowLabel, seats })
      }

      return {
        category: cat,
        rows,
        style: categoryStyles[idx % categoryStyles.length]
      }
    })
  }

  const hasBlockedSelected = selectedSeats.some(key => {
    const [row, seat] = key.split('-')
    return isSeatBlocked(row, parseInt(seat))
  })

  const hasAvailableSelected = selectedSeats.some(key => {
    const [row, seat] = key.split('-')
    return !isSeatBlocked(row, parseInt(seat))
  })

  // Count selected by type
  const selectedAvailableCount = selectedSeats.filter(key => {
    const [row, seat] = key.split('-')
    return !isSeatBlocked(row, parseInt(seat))
  }).length

  const selectedBlockedCount = selectedSeats.filter(key => {
    const [row, seat] = key.split('-')
    return isSeatBlocked(row, parseInt(seat))
  }).length

  if (loading) {
    return (
      <AdminLayout>
        <Spinner.Page message="Loading..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/admin/venues/${venueId}/screens`} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Screen' : 'Add Screen'}
            </h1>
            <p className="text-gray-500">{venue?.name}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}

        {/* Screen Name Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Screen Details</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Screen Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Screen 1, IMAX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create Screen'}
            </button>
          </div>
        </form>

        {/* Seat Categories Section */}
        {isEdit && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Seat Map Configuration</h2>
              {totalSeats > 0 && (
                <span className="text-sm text-gray-500">Total: {totalSeats} seats</span>
              )}
            </div>

            {categoryError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{categoryError}</div>
            )}

            {/* Existing Categories */}
            {seatCategories.length > 0 && (
              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-gray-600">Category</th>
                      <th className="text-left py-2 font-medium text-gray-600">Rows</th>
                      <th className="text-left py-2 font-medium text-gray-600">Seats/Row</th>
                      <th className="text-left py-2 font-medium text-gray-600">Total</th>
                      <th className="text-right py-2 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seatCategories.map(cat => (
                      <tr key={cat.id} className="border-b border-gray-100">
                        <td className="py-3 font-medium">{cat.name}</td>
                        <td className="py-3">{cat.row_start} - {cat.row_end}</td>
                        <td className="py-3">{cat.seats_per_row}</td>
                        <td className="py-3">{cat.total_seats}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="text-primary-600 hover:text-primary-700 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add/Edit Category Form */}
            <form onSubmit={handleAddCategory} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {editingCategory ? 'Edit Category' : 'Add Seat Category'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory.name}
                    onChange={handleCategoryChange}
                    placeholder="e.g., Gold"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Row Start</label>
                  <input
                    type="text"
                    name="row_start"
                    value={newCategory.row_start}
                    onChange={handleCategoryChange}
                    placeholder="A"
                    maxLength="2"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Row End</label>
                  <input
                    type="text"
                    name="row_end"
                    value={newCategory.row_end}
                    onChange={handleCategoryChange}
                    placeholder="E"
                    maxLength="2"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Seats/Row</label>
                  <input
                    type="number"
                    name="seats_per_row"
                    value={newCategory.seats_per_row}
                    onChange={handleCategoryChange}
                    placeholder="10"
                    min="1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50"
                  >
                    {savingCategory ? '...' : editingCategory ? 'Update' : 'Add'}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Example: Gold (Rows A-C, 10 seats/row) = 30 seats, Silver (Rows D-H, 12 seats/row) = 60 seats
              </p>
            </form>
          </div>
        )}

        {!isEdit && (
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <strong>Next step:</strong> After creating the screen, you'll be able to configure the seat map
            by adding seat categories (e.g., Gold, Silver, Platinum) with their row ranges.
          </div>
        )}

        {/* Seat Map with Blocking */}
        {isEdit && seatCategories.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Seat Management</h2>
                <p className="text-sm text-gray-500">Click seats to select, then block/unblock for maintenance</p>
              </div>
              <span className="text-sm text-gray-500">
                {blockedSeats.length} blocked | {totalSeats - blockedSeats.length} available
              </span>
            </div>

            {/* Block Controls */}
            {selectedSeats.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                {/* Selection Summary */}
                <div className="flex items-center gap-4 flex-wrap">
                  {selectedAvailableCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-blue-500"></span>
                      <span className="text-sm text-gray-700">
                        {selectedAvailableCount} to block
                      </span>
                    </div>
                  )}

                  {selectedBlockedCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-green-500"></span>
                      <span className="text-sm text-gray-700">
                        {selectedBlockedCount} to unblock
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Show Apply All when mixed selection */}
                    {selectedAvailableCount > 0 && selectedBlockedCount > 0 ? (
                      <button
                        onClick={handleApplyAll}
                        disabled={savingBlock}
                        className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {savingBlock ? 'Applying...' : 'Apply All'}
                      </button>
                    ) : selectedAvailableCount > 0 ? (
                      <button
                        onClick={handleBlockSelected}
                        disabled={savingBlock}
                        className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {savingBlock ? 'Blocking...' : 'Block Selected'}
                      </button>
                    ) : (
                      <button
                        onClick={handleUnblockSelected}
                        disabled={savingBlock}
                        className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {savingBlock ? 'Unblocking...' : 'Unblock Selected'}
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedSeats([])}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Screen indicator */}
            <div className="mb-6">
              <div className="relative max-w-3xl mx-auto">
                <div className="h-2 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 rounded-full mb-2" />
                <div className="text-center text-sm text-gray-500 font-medium">SCREEN</div>
              </div>
            </div>

            {/* Seat Layout */}
            <div className="space-y-4">
              {generateSeatPreview().map(({ category, rows, style }) => (
                <div key={category.id} className={`${style.bg} rounded-xl p-4 border-2 border-dashed ${style.border}`}>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className={`font-semibold ${style.text}`}>{category.name}</span>
                    <span className="text-xs text-gray-500">
                      ({category.total_seats} seats)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {rows.map(row => (
                      <div key={row.label} className="flex items-center justify-center gap-2">
                        <span className="w-6 text-center text-xs font-medium text-gray-500">{row.label}</span>
                        <div className="flex gap-1 flex-wrap justify-center">
                          {row.seats.map(seat => {
                            const isBlocked = isSeatBlocked(row.label, seat.number)
                            const isSelected = selectedSeats.includes(`${row.label}-${seat.number}`)
                            const reason = getBlockReason(row.label, seat.number)

                            return (
                              <button
                                key={`${row.label}${seat.number}`}
                                onClick={() => handleSeatClick(row.label, seat.number)}
                                title={isBlocked ? `Blocked: ${reason}` : `${row.label}${seat.number}`}
                                className={`
                                  w-7 h-7 rounded-t-lg text-xs font-medium flex items-center justify-center transition-all
                                  ${isSelected && isBlocked
                                    ? 'bg-green-500 text-white ring-2 ring-green-300'
                                    : isSelected && !isBlocked
                                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                    : isBlocked
                                    ? 'bg-red-500 text-white'
                                    : `border-2 ${style.seatBorder} bg-white hover:bg-gray-100`
                                  }
                                `}
                              >
                                {seat.number}
                              </button>
                            )
                          })}
                        </div>
                        <span className="w-6 text-center text-xs font-medium text-gray-500">{row.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-t-lg border-2 border-gray-400 bg-white" />
                <span className="text-sm text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-t-lg bg-blue-500" />
                <span className="text-sm text-gray-600">Selected to Block</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-t-lg bg-red-500" />
                <span className="text-sm text-gray-600">Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-t-lg bg-green-500" />
                <span className="text-sm text-gray-600">Selected to Unblock</span>
              </div>
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Blocked seats here are permanently blocked for all shows on this screen.
                When you fix a damaged seat, unblock it and it will be available for all future shows.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default ScreenFormPage
