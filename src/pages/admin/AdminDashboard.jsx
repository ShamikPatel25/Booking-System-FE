import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '../../components/admin'
import { getDashboardStats } from '../../services/adminService'

function AdminDashboard() {
  const fetchedRef = useRef(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Events', value: stats?.totalEvents || 0, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'bg-blue-500' },
    { label: 'Total Venues', value: stats?.totalVenues || 0, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'bg-green-500' },
    { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z', color: 'bg-purple-500' },
    { label: 'Categories', value: stats?.totalCategories || 0, icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', color: 'bg-orange-500' },
  ]

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {loading ? '-' : card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/admin/events/new" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
            <span className="text-2xl mb-2 block">🎬</span>
            <span className="text-sm font-medium text-gray-700">Add Event</span>
          </a>
          <a href="/admin/venues/new" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
            <span className="text-2xl mb-2 block">🏢</span>
            <span className="text-sm font-medium text-gray-700">Add Venue</span>
          </a>
          <a href="/admin/categories/new" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
            <span className="text-2xl mb-2 block">🏷️</span>
            <span className="text-sm font-medium text-gray-700">Add Category</span>
          </a>
          <a href="/admin/bookings" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors">
            <span className="text-2xl mb-2 block">📋</span>
            <span className="text-sm font-medium text-gray-700">View Bookings</span>
          </a>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
