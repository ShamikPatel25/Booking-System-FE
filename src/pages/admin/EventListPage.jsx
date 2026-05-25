import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AdminLayout, DataTable, DeleteConfirmModal, ActionMenu } from '../../components/admin'
import { getEvents, deleteEvent, getCategories, updateEvent } from '../../services/adminService'
import { Spinner, Badge, ToastContainer } from '../../components/ui'

const PAGE_SIZE = 10

function EventListPage() {
  const location = useLocation()
  const toastShown = useRef(false)
  const categoriesFetched = useRef(false)
  const lastPageRef = useRef(null)
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
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
    if (categoriesFetched.current) return
    categoriesFetched.current = true
    fetchCategories()
  }, [])

  useEffect(() => {
    if (lastPageRef.current === page) return
    lastPageRef.current = page
    fetchData()
  }, [page])

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories(1, 100)
      setCategories(categoriesData.results || categoriesData)
    } catch (err) {
      console.error('Failed to load categories')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const eventsData = await getEvents(page, PAGE_SIZE)
      setEvents(eventsData.results || eventsData)
      setTotalCount(eventsData.count || 0)
    } catch (err) {
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (categoryId) => {
    if (typeof categoryId === 'object') return categoryId.name
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || '-'
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  const handleToggleActive = async (event) => {
    try {
      await updateEvent(event.id, { is_active: !event.is_active })
      addToast(`Event ${event.is_active ? 'deactivated' : 'activated'} successfully`)
      fetchData()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'Failed to update event status'
      addToast(errorMsg, 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return
    setDeleting(true)
    try {
      await deleteEvent(deleteModal.item.id)
      setDeleteModal({ open: false, item: null })
      addToast('Event deleted successfully')
      fetchData()
    } catch (err) {
      setDeleteModal({ open: false, item: null })
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'Failed to delete event'
      addToast(errorMsg, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'category',
      label: 'Category',
      render: (val) => <Badge variant="secondary">{getCategoryName(val)}</Badge>
    },
    { key: 'language', label: 'Language', render: (val) => val || '-' },
    { key: 'duration_minutes', label: 'Duration', render: (val) => val ? `${val} min` : '-' },
    {
      key: 'shows',
      label: 'Shows',
      render: (val) => (
        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
          {val?.length || 0} shows
        </span>
      )
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
          to: `/admin/events/${row.id}/shows`,
          label: 'View Shows',
          icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        },
        {
          type: 'link',
          to: `/admin/events/${row.id}`,
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
        <Spinner.Page message="Loading events..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Events</h1>
        <Link
          to="/admin/events/new"
          className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          Add Event
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={events}
        actions={actions}
        emptyMessage="No events found. Create your first event!"
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowClick={(row) => `/admin/events/${row.id}`}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteModal.item?.title}"? This will also delete all shows and bookings.`}
      />
    </AdminLayout>
  )
}

export default EventListPage
