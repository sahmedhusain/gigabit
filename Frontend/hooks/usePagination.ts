'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { PaginationOptions } from '@/types/hooks'

export function usePagination<T>(
  fetchFunction: (limit: number, offset: number) => Promise<{ data: T[], count: number }>,
  options: PaginationOptions = {}
) {
  const {
    initialPage = 1,
    initialLimit = 20,
    maxLimit = 100,
    preloadNextPage = false
  } = options

  const [data, setData] = useState<T[]>([])
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [limit, setLimit] = useState(Math.min(initialLimit, maxLimit))
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)

  
  const cache = useRef<Map<string, { data: T[], timestamp: number }>>(new Map())
  const cacheExpiry = 5 * 60 * 1000 

  const getCacheKey = useCallback((page: number, pageLimit: number) => {
    return `${page}-${pageLimit}`
  }, [])

  const isValidCache = useCallback((timestamp: number) => {
    return Date.now() - timestamp < cacheExpiry
  }, [cacheExpiry])

  const fetchPage = useCallback(
    async (page: number, pageLimit: number = limit) => {
      const cacheKey = getCacheKey(page, pageLimit)
      const cachedData = cache.current.get(cacheKey)

      
      if (cachedData && isValidCache(cachedData.timestamp)) {
        return { data: cachedData.data, count: totalCount }
      }

      const offset = (page - 1) * pageLimit
      const result = await fetchFunction(pageLimit, offset)
      
      
      cache.current.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      })

      return result
    },
    [fetchFunction, limit, getCacheKey, isValidCache, totalCount]
  )

  const loadPage = useCallback(
    async (page: number, pageLimit: number = limit) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await fetchPage(page, pageLimit)
        
        setData(result.data)
        setTotalCount(result.count)
        setCurrentPage(page)
        setLimit(pageLimit)

        
        const totalPages = Math.ceil(result.count / pageLimit)
        setHasNextPage(page < totalPages)
        setHasPreviousPage(page > 1)

        
        if (preloadNextPage && page < totalPages) {
          fetchPage(page + 1, pageLimit).catch(() => {
            
          })
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load data')
        setData([])
      } finally {
        setIsLoading(false)
      }
    },
    [fetchPage, limit, preloadNextPage]
  )

  const goToPage = useCallback(
    (page: number) => {
      const totalPages = Math.ceil(totalCount / limit)
      const validPage = Math.max(1, Math.min(page, totalPages))
      loadPage(validPage)
    },
    [loadPage, totalCount, limit]
  )

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1)
    }
  }, [hasNextPage, currentPage, goToPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1)
    }
  }, [hasPreviousPage, currentPage, goToPage])

  const changeLimit = useCallback(
    (newLimit: number) => {
      const validLimit = Math.min(newLimit, maxLimit)
      
      const currentOffset = (currentPage - 1) * limit
      const newPage = Math.floor(currentOffset / validLimit) + 1
      loadPage(newPage, validLimit)
    },
    [currentPage, limit, maxLimit, loadPage]
  )

  const refresh = useCallback(() => {
    
    const cacheKey = getCacheKey(currentPage, limit)
    cache.current.delete(cacheKey)
    loadPage(currentPage, limit)
  }, [currentPage, limit, loadPage, getCacheKey])

  const addItem = useCallback((item: T, position: 'start' | 'end' = 'start') => {
    setData(prev => position === 'start' ? [item, ...prev] : [...prev, item])
    setTotalCount(prev => prev + 1)
  }, [])

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setData(prev => {
      const filtered = prev.filter(item => !predicate(item))
      setTotalCount(current => current - (prev.length - filtered.length))
      return filtered
    })
  }, [])

  const updateItem = useCallback((predicate: (item: T) => boolean, updater: (item: T) => T) => {
    setData(prev => prev.map(item => predicate(item) ? updater(item) : item))
  }, [])

  
  useEffect(() => {
    loadPage(initialPage, initialLimit)
  }, []) 

  const totalPages = Math.ceil(totalCount / limit)

  return {
    data,
    currentPage,
    limit,
    totalCount,
    totalPages,
    isLoading,
    error,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    changeLimit,
    refresh,
    addItem,
    removeItem,
    updateItem
  }
}
