import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import DiscoverPage from './pages/DiscoverPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EventDetailPage from './pages/EventDetailPage'
import SeatSelectionPage from './pages/SeatSelectionPage'
import BookingPage from './pages/BookingPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import MyBookingsPage from './pages/MyBookingsPage'

// Admin imports
import { AdminProtectedRoute } from './components/admin'
import {
  AdminDashboard,
  CategoryListPage,
  CategoryFormPage,
  VenueListPage,
  VenueFormPage,
  ScreenListPage,
  ScreenFormPage,
  EventListPage,
  EventFormPage,
  ShowListPage,
  ShowFormPage,
  SeatManagementPage,
  BookingListPage
} from './pages/admin'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Admin Routes - No Navbar/Footer */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/categories" element={<AdminProtectedRoute><CategoryListPage /></AdminProtectedRoute>} />
          <Route path="/admin/categories/new" element={<AdminProtectedRoute><CategoryFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/categories/:id" element={<AdminProtectedRoute><CategoryFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/venues" element={<AdminProtectedRoute><VenueListPage /></AdminProtectedRoute>} />
          <Route path="/admin/venues/new" element={<AdminProtectedRoute><VenueFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/venues/:id" element={<AdminProtectedRoute><VenueFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/venues/:venueId/screens" element={<AdminProtectedRoute><ScreenListPage /></AdminProtectedRoute>} />
          <Route path="/admin/venues/:venueId/screens/new" element={<AdminProtectedRoute><ScreenFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/venues/:venueId/screens/:screenId" element={<AdminProtectedRoute><ScreenFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/events" element={<AdminProtectedRoute><EventListPage /></AdminProtectedRoute>} />
          <Route path="/admin/events/new" element={<AdminProtectedRoute><EventFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/events/:id" element={<AdminProtectedRoute><EventFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/events/:eventId/shows" element={<AdminProtectedRoute><ShowListPage /></AdminProtectedRoute>} />
          <Route path="/admin/events/:eventId/shows/new" element={<AdminProtectedRoute><ShowFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/events/:eventId/shows/:showId" element={<AdminProtectedRoute><ShowFormPage /></AdminProtectedRoute>} />
          <Route path="/admin/shows/:showId/seats" element={<AdminProtectedRoute><SeatManagementPage /></AdminProtectedRoute>} />
          <Route path="/admin/bookings" element={<AdminProtectedRoute><BookingListPage /></AdminProtectedRoute>} />

          {/* Public Routes - With Navbar/Footer */}
          <Route path="*" element={
            <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/discover" element={<DiscoverPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/events/:id" element={<EventDetailPage />} />
                  <Route path="/shows/:showId/seats" element={<SeatSelectionPage />} />
                  <Route path="/booking" element={<BookingPage />} />
                  <Route path="/booking-success" element={<BookingSuccessPage />} />
                  <Route path="/my-bookings" element={<MyBookingsPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
