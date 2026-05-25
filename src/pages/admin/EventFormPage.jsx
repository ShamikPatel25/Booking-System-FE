import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AdminLayout } from '../../components/admin'
import { getEvent, createEvent, updateEvent, getCategories } from '../../services/adminService'
import { Spinner } from '../../components/ui'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function EventFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const posterInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const lastIdRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    language: '',
    duration_minutes: '',
    genres: ''
  })

  // Poster states
  const [posterFile, setPosterFile] = useState(null)
  const [posterUrl, setPosterUrl] = useState('')
  const [posterPreview, setPosterPreview] = useState(null)
  const [existingPoster, setExistingPoster] = useState(null)
  const [posterMode, setPosterMode] = useState('file')

  // Banner states
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerPreview, setBannerPreview] = useState(null)
  const [existingBanner, setExistingBanner] = useState(null)
  const [bannerMode, setBannerMode] = useState('file')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (lastIdRef.current === id) return
    lastIdRef.current = id
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const categoriesData = await getCategories()
      setCategories(categoriesData.results || categoriesData)

      if (isEdit) {
        const event = await getEvent(id)
        setFormData({
          title: event.title || '',
          description: event.description || '',
          category: typeof event.category === 'object' ? event.category.id : event.category || '',
          language: event.language || '',
          duration_minutes: event.duration_minutes || '',
          genres: event.genres || ''
        })
        if (event.poster) {
          setExistingPoster(event.poster.startsWith('http') ? event.poster : `${API_URL}${event.poster}`)
        }
        if (event.banner) {
          setExistingBanner(event.banner.startsWith('http') ? event.banner : `${API_URL}${event.banner}`)
        }
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

  // Poster handlers
  const handlePosterChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPosterFile(file)
      setPosterPreview(URL.createObjectURL(file))
    }
  }

  const removePoster = () => {
    setPosterFile(null)
    setPosterUrl('')
    setPosterPreview(null)
    setExistingPoster(null)
    if (posterInputRef.current) posterInputRef.current.value = ''
  }

  const handlePosterUrlChange = (e) => {
    const url = e.target.value
    setPosterUrl(url)
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setPosterPreview(url)
    } else {
      setPosterPreview(null)
    }
  }

  // Banner handlers
  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const removeBanner = () => {
    setBannerFile(null)
    setBannerUrl('')
    setBannerPreview(null)
    setExistingBanner(null)
    if (bannerInputRef.current) bannerInputRef.current.value = ''
  }

  const handleBannerUrlChange = (e) => {
    const url = e.target.value
    setBannerUrl(url)
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setBannerPreview(url)
    } else {
      setBannerPreview(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.category) {
      setError('Title and category are required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const data = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        language: formData.language || null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        genres: formData.genres || ''
      }

      // Poster
      if (posterMode === 'file' && posterFile) {
        data.poster = posterFile
      } else if (posterMode === 'url' && posterUrl) {
        data.poster_url = posterUrl
      }

      // Banner
      if (bannerMode === 'file' && bannerFile) {
        data.banner = bannerFile
      } else if (bannerMode === 'url' && bannerUrl) {
        data.banner_url = bannerUrl
      }

      if (isEdit) {
        await updateEvent(id, data)
        navigate('/admin/events', { state: { toast: { message: 'Event updated successfully', type: 'success' } } })
      } else {
        await createEvent(data)
        navigate('/admin/events', { state: { toast: { message: 'Event created successfully', type: 'success' } } })
      }
    } catch (err) {
      const errorData = err.response?.data
      const errorMsg = errorData?.title?.[0] || errorData?.poster_url?.[0] || errorData?.banner_url?.[0] || errorData?.detail || 'Failed to save event'
      setError(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const ImageUploadSection = ({ label, hint, mode, setMode, file, setFile, url, onUrlChange, preview, existingImage, remove, inputRef, onFileChange }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => { setMode('file'); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 'file' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => { setMode('url'); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 'url' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          From URL
        </button>
      </div>

      <div>
        {mode === 'url' ? (
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={onUrlChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {preview && (
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-40 w-auto max-w-full object-cover rounded-lg border border-gray-200"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={remove}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {(preview || existingImage) ? (
              <div className="relative inline-block">
                <img
                  src={preview || existingImage}
                  alt="Preview"
                  className="h-40 w-auto max-w-full object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={remove}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
              >
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Click to upload</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <AdminLayout>
        <Spinner.Page message="Loading..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Avengers: Endgame"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Event description..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  placeholder="e.g., English, Hindi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g., 150"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genres/Tags</label>
              <input
                type="text"
                name="genres"
                value={formData.genres}
                onChange={handleChange}
                placeholder="e.g., Action/Drama/Thriller"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Separate with / (e.g., Comedy/Romance/Drama)</p>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Images</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ImageUploadSection
                label="Poster Image (Portrait)"
                hint="Used for event cards. Recommended: 2:3 ratio (e.g., 400x600)"
                mode={posterMode}
                setMode={setPosterMode}
                file={posterFile}
                setFile={setPosterFile}
                url={posterUrl}
                onUrlChange={handlePosterUrlChange}
                preview={posterPreview}
                existingImage={existingPoster}
                remove={removePoster}
                inputRef={posterInputRef}
                onFileChange={handlePosterChange}
              />

              <ImageUploadSection
                label="Banner Image (Landscape)"
                hint="Used for detail page background. Recommended: 16:9 ratio (e.g., 1920x1080)"
                mode={bannerMode}
                setMode={setBannerMode}
                file={bannerFile}
                setFile={setBannerFile}
                url={bannerUrl}
                onUrlChange={handleBannerUrlChange}
                preview={bannerPreview}
                existingImage={existingBanner}
                remove={removeBanner}
                inputRef={bannerInputRef}
                onFileChange={handleBannerChange}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
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

export default EventFormPage
