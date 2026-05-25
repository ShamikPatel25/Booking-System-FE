import { useState, useEffect, useRef, useCallback } from 'react'

export function useInfiniteScroll(fetchFn, options = {}) {
  const { pageSize = 12, threshold = 200 } = options

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const initialLoadRef = useRef(false)
  const observerRef = useRef(null)

  // Load initial data
  useEffect(() => {
    if (initialLoadRef.current) return
    initialLoadRef.current = true
    loadInitial()
  }, [])

  const loadInitial = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchFn(1, pageSize)
      const results = data.results || data
      setItems(results)
      setHasMore(data.next !== null && results.length === pageSize)
      setPage(1)
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const data = await fetchFn(nextPage, pageSize)
      const results = data.results || data
      setItems(prev => [...prev, ...results])
      setHasMore(data.next !== null && results.length === pageSize)
      setPage(nextPage)
    } catch (err) {
      console.error('Failed to load more:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [page, pageSize, loadingMore, hasMore, fetchFn])

  // Intersection Observer for infinite scroll
  const lastItemRef = useCallback(node => {
    if (loading || loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, { rootMargin: `${threshold}px` })

    if (node) observerRef.current.observe(node)
  }, [loading, loadingMore, hasMore, loadMore, threshold])

  const reset = useCallback(() => {
    initialLoadRef.current = false
    setItems([])
    setPage(1)
    setHasMore(true)
    setError('')
    loadInitial()
  }, [])

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    lastItemRef,
    reset,
    loadMore
  }
}

export default useInfiniteScroll
