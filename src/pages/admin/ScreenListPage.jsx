import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { AdminLayout, DataTable, DeleteConfirmModal, ActionMenu } from '../../components/admin'
import { getVenue, getScreens, deleteScreen, updateScreen } from '../../services/adminService'
import { Spinner, Badge, ToastContainer } from '../../components/ui'

const PAGE_SIZE = 10

function ScreenListPage() {
  const { venueId } = useParams()
  const location = useLocation()
  const toastShown = useRef(false)
  const lastVenueIdRef = useRef(null)
  const lastFetchKeyRef = useRef(null)
  const [venue, setVenue] = useState(null)
  const [screens, setScreens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null })
  const [deleting, setDeleting] = useState(false)
  const [toasts, setToasts] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    if (location.state?.toast && !toastShown.current) {
      toastShown.current = true
      addToast(location.state.toast.message, location.state.toast.type)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    if (lastVenueIdRef.current === venueId) return
    lastVenueIdRef.current = venueId
    fetchVenue()
  }, [venueId])

  useEffect(() => {
    const fetchKey = `${venueId}-${page}`
    if (lastFetchKeyRef.current === fetchKey) return
    lastFetchKeyRef.current = fetchKey
    fetchScreens()
  }, [venueId, page])

  const fetchVenue = async () => {
    try {
      const venueData = await getVenue(venueId)
      setVenue(venueData)
    } catch (err) {
      setError('Failed to load venue')
    }
  }

  const fetchScreens = async () => {
    setLoading(true)
    try {
      const screensData = await getScreens(venueId, page, PAGE_SIZE)
      setScreens(screensData.results || screensData)
      setTotalCount(screensData.count || 0)
    } catch (err) {
      setError('Failed to load screens')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  const handleToggleActive = async (screen) => {
    try {
      await updateScreen(venueId, screen.id, { is_active: !screen.is_active })
      addToast(`Screen ${screen.is_active ? 'deactivated' : 'activated'} successfully`)
      fetchScreens()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'Failed to update screen status'
      addToast(errorMsg, 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return
    setDeleting(true)
    try {
      await deleteScreen(venueId, deleteModal.item.id)
      setDeleteModal({ open: false, item: null })
      addToast('Screen deleted successfully')
      fetchScreens()
    } catch (err) {
      setDeleteModal({ open: false, item: null })
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'Failed to delete screen'
      addToast(errorMsg, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Screen Name' },
    {
      key: 'seat_categories',
      label: 'Seat Categories',
      render: (val) => val?.length || 0
    },
    {
      key: 'total_seats',
      label: 'Total Seats',
      render: (val) => val || 0
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => (
        <Badge variant={val ? 'success' : 'danger'} className="w-16 justify-center">
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
          to: `/admin/venues/${venueId}/screens/${row.id}`,
          label: 'Edit',
          icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        },
        {
          type: 'button',
          label: row.is_active ? 'Deactivate' : 'Activate',
          className: row.is_active ? 'text-amber-600' : 'text-green-600',
          icon: row.is_active
            ? <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            : <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          onClick: () => handleToggleActive(row)
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
        <Spinner.Page message="Loading screens..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/venues" className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Screens</h1>
          <p className="text-gray-500">{venue?.name} - {venue?.city}</p>
        </div>
        <Link
          to={`/admin/venues/${venueId}/screens/new`}
          className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          Add Screen
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={screens}
        actions={actions}
        emptyMessage="No screens found. Add your first screen!"
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowClick={(row) => `/admin/venues/${venueId}/screens/${row.id}`}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Screen"
        message={`Are you sure you want to delete "${deleteModal.item?.name}"?`}
      />
    </AdminLayout>
  )
}

export default ScreenListPage
