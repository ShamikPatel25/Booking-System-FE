import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AdminLayout } from '../../components/admin'
import { getShowPricing, getSeatStats, getShowSeats } from '../../services/adminService'
import { Spinner } from '../../components/ui'
import api from '../../services/api'

function SeatManagementPage() {
  const { showId } = useParams()
  const lastShowIdRef = useRef(null)
  const [show, setShow] = useState(null)
  const [pricing, setPricing] = useState([])
  const [seats, setSeats] = useState([])
  const [seatStats, setSeatStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const categoryStyles = [
    { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', seatBorder: 'border-blue-400' },
    { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700', seatBorder: 'border-emerald-400' },
    { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', seatBorder: 'border-amber-400' },
    { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', seatBorder: 'border-purple-400' },
  ]

  useEffect(() => {
    if (lastShowIdRef.current === showId) return
    lastShowIdRef.current = showId
    fetchData()
  }, [showId])

  const fetchData = async () => {
    try {
      const [showRes, pricingData, statsData, seatsData] = await Promise.all([
        api.get(`/shows/${showId}/`),
        getShowPricing(showId),
        getSeatStats(showId),
        getShowSeats(showId).catch(() => ({ results: [] }))
      ])
      setShow(showRes.data)
      setPricing(pricingData.results || pricingData)
      setSeatStats(statsData)
      const seatsArray = seatsData.results || seatsData || []
      setSeats(seatsArray)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getSeatsByCategory = () => {
    const result = []
    const pricingMap = {}

    pricing.forEach(p => {
      pricingMap[p.screen_seat_category] = p
    })

    const categoryGroups = {}
    seats.forEach(seat => {
      const catId = typeof seat.screen_seat_category === 'object'
        ? seat.screen_seat_category?.id
        : seat.screen_seat_category
      if (!categoryGroups[catId]) {
        categoryGroups[catId] = {
          category: seat.screen_seat_category_detail || seat.screen_seat_category,
          pricing: pricingMap[catId],
          seats: [],
          firstRow: seat.row_label
        }
      }
      categoryGroups[catId].seats.push(seat)
      if (seat.row_label < categoryGroups[catId].firstRow) {
        categoryGroups[catId].firstRow = seat.row_label
      }
    })

    Object.values(categoryGroups).forEach((group, idx) => {
      const byRow = {}
      group.seats.forEach(seat => {
        if (!byRow[seat.row_label]) byRow[seat.row_label] = []
        byRow[seat.row_label].push(seat)
      })
      const sortedRows = Object.keys(byRow).sort()
      sortedRows.forEach(row => byRow[row].sort((a, b) => a.seat_number - b.seat_number))

      if (sortedRows.length > 0) {
        result.push({
          category: group.category,
          pricing: group.pricing,
          rows: byRow,
          sortedRowLabels: sortedRows,
          firstRow: group.firstRow,
          style: categoryStyles[idx % categoryStyles.length]
        })
      }
    })

    return result.sort((a, b) => {
      const rowA = a.firstRow || 'Z'
      const rowB = b.firstRow || 'Z'
      return rowA.localeCompare(rowB)
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <Spinner.Page message="Loading..." />
      </AdminLayout>
    )
  }

  const seatsGenerated = seatStats?.generated
  const seatsByCategory = getSeatsByCategory()

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/admin/events/${show?.event}/shows`} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Seat Management</h1>
          <p className="text-gray-500">
            {show?.screen?.venue?.name} - {show?.screen?.name} | {show?.show_date}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Stats */}
      {seatStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{seatStats.total || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">Available</div>
            <div className="text-2xl font-bold text-green-600">{seatStats.by_status?.available || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">Booked</div>
            <div className="text-2xl font-bold text-blue-600">{seatStats.by_status?.booked || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">Blocked</div>
            <div className="text-2xl font-bold text-red-600">{seatStats.by_status?.blocked || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">Locked</div>
            <div className="text-2xl font-bold text-amber-600">{seatStats.by_status?.locked || 0}</div>
          </div>
        </div>
      )}

      {/* Seat Map */}
      {seatsGenerated && seats.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Seat Map</h2>
            <p className="text-sm text-gray-500">Visual overview of seat layout and status for this show.</p>
          </div>

          {/* Screen indicator */}
          <div className="mb-6">
            <div className="relative max-w-3xl mx-auto">
              <div className="h-2 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 rounded-full mb-2" />
              <div className="text-center text-sm text-gray-500 font-medium">SCREEN</div>
            </div>
          </div>

          {/* Seat Layout */}
          <div className="space-y-4">
            {seatsByCategory.map(({ category, rows, sortedRowLabels, style }) => (
              <div key={category?.id || 'unknown'} className={`${style.bg} rounded-xl p-4 border-2 border-dashed ${style.border}`}>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className={`font-semibold ${style.text}`}>{category?.name || 'Unknown'}</span>
                  <span className="text-xs text-gray-500">
                    ({category?.total_seats || sortedRowLabels.length * (rows[sortedRowLabels[0]]?.length || 0)} seats)
                  </span>
                </div>

                <div className="space-y-1.5">
                  {sortedRowLabels.map(rowLabel => (
                    <div key={rowLabel} className="flex items-center justify-center gap-2">
                      <span className="w-6 text-center text-xs font-medium text-gray-500">{rowLabel}</span>
                      <div className="flex gap-1 flex-wrap justify-center">
                        {rows[rowLabel].map(seat => {
                          const isBooked = seat.status === 'booked'
                          const isBlocked = seat.status === 'blocked'
                          const isLocked = seat.status === 'locked'

                          return (
                            <div
                              key={seat.id}
                              title={`${rowLabel}${seat.seat_number} - ${seat.status}`}
                              className={`
                                w-7 h-7 rounded-t-lg text-xs font-medium flex items-center justify-center
                                ${isBooked
                                  ? 'bg-gray-400 text-white'
                                  : isBlocked
                                  ? 'bg-red-500 text-white'
                                  : isLocked
                                  ? 'bg-amber-300 text-amber-800'
                                  : `border-2 ${style.seatBorder} bg-white`
                                }
                              `}
                            >
                              {seat.seat_number}
                            </div>
                          )
                        })}
                      </div>
                      <span className="w-6 text-center text-xs font-medium text-gray-500">{rowLabel}</span>
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
              <div className="w-6 h-6 rounded-t-lg bg-red-500" />
              <span className="text-sm text-gray-600">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-t-lg bg-amber-300" />
              <span className="text-sm text-gray-600">Locked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-t-lg bg-gray-400" />
              <span className="text-sm text-gray-600">Booked</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🪑</div>
            <p className="text-gray-500">No seats generated yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Seats are automatically generated when you set pricing for the show.
            </p>
            <Link
              to={`/admin/events/${show?.event}/shows/${showId}`}
              className="inline-block mt-4 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600"
            >
              Edit Show Pricing
            </Link>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default SeatManagementPage
