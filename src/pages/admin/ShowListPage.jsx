import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { AdminLayout, DataTable, DeleteConfirmModal, ActionMenu } from '../../components/admin'
import { getEvent, getShows, deleteShow, getVenues } from '../../services/adminService'
import { Spinner, Badge, ToastContainer } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { formatDateLong, formatTime } from '../../utils/dateUtils'

const PAGE_SIZE = 10

function ShowListPage() {
  const { eventId } = useParams()
  const location = useLocation()
  const toastShown = useRef(false)
  const lastEventIdRef = useRef(null)
  const lastFetchKeyRef = useRef(null)
  const [event, setEvent] = useState(null)
  const [shows, setShows] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null })
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const { toasts, addToast, removeToast } = useToast()

  useEffect(() => {
    if (location.state?.toast && !toastShown.current) {
      toastShown.current = true
      addToast(location.state.toast.message, location.state.toast.type)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    if (lastEventIdRef.current === eventId) return
    lastEventIdRef.current = eventId
    fetchEvent()
  }, [eventId])

  useEffect(() => {
    const fetchKey = `${eventId}-${page}`
    if (lastFetchKeyRef.current === fetchKey) return
    lastFetchKeyRef.current = fetchKey
    fetchShows()
  }, [eventId, page])

  const fetchEvent = async () => {
    try {
      const [eventData, venuesData] = await Promise.all([
        getEvent(eventId),
        getVenues(1, 100)
      ])
      setEvent(eventData)
      setVenues(venuesData.results || venuesData)
    } catch (err) {
      setError('Failed to load event')
    }
  }

  const fetchShows = async () => {
    setLoading(true)
    try {
      const showsData = await getShows(eventId, page, PAGE_SIZE)
      setShows(showsData.results || showsData)
      setTotalCount(showsData.count || 0)
    } catch (err) {
      setError('Failed to load shows')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  const getScreenInfo = (show) => {
    if (show.screen?.venue?.name) {
      return `${show.screen.venue.name} - ${show.screen.name}`
    }
    return show.screen?.name || 'Unknown'
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return
    setDeleting(true)
    try {
      await deleteShow(eventId, deleteModal.item.id)
      setDeleteModal({ open: false, item: null })
      addToast('Show deleted successfully')
      fetchShows()
    } catch (err) {
      setDeleteModal({ open: false, item: null })
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'Failed to delete show'
      addToast(errorMsg, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'show_date', label: 'Date', render: (val) => formatDateLong(val) },
    { key: 'start_time', label: 'Start Time', render: (val) => formatTime(val) },
    { key: 'end_time', label: 'End Time', render: (val) => formatTime(val) },
    { key: 'screen', label: 'Venue / Screen', render: (_, row) => getScreenInfo(row) },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => (
        <Badge variant={val ? 'success' : 'secondary'} className="w-16 justify-center">
          {val ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  ]

  const actions = (row) => (
    <ActionMenu
      items={[
        {
          type: 'link',
          to: `/admin/shows/${row.id}/seats`,
          label: 'Manage Seats',
          icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
        },
        {
          type: 'link',
          to: `/admin/events/${eventId}/shows/${row.id}`,
          label: 'Edit',
          icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        },
        {
          type: 'button',
          label: 'Delete',
          className: 'text-red-600',
          icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
          onClick: () => setDeleteModal({ open: true, item: row })
        }
      ]}
    />
  )

  if (loading) {
    return (
      <AdminLayout>
        <Spinner.Page message="Loading shows..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/events" className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shows</h1>
          <p className="text-gray-500">{event?.title}</p>
        </div>
        <Link
          to={`/admin/events/${eventId}/shows/new`}
          className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          Add Show
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={shows}
        actions={actions}
        emptyMessage="No shows found. Add your first show!"
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowClick={(row) => `/admin/events/${eventId}/shows/${row.id}`}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Show"
        message="Are you sure you want to delete this show? This will also delete all seat bookings."
      />
    </AdminLayout>
  )
}

export default ShowListPage
