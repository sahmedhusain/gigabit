'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'

export interface InfiniteScrollOptions<T> {
  threshold?: number
  rootMargin?: string
  enabled?: boolean
  hasNextPage?: boolean
  onLoadMore?: () => Promise<void>
  onError?: (error: any) => void
}

export function useInfiniteScroll<T>(
  fetchNextPage: () => Promise<{ data: T[], hasMore: boolean }>,
  options: InfiniteScrollOptions<T> = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    enabled = true,
    onLoadMore,
    onError
  } = options

  const [data, setData] = useState<T[]>([])
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const observerTarget = useRef<HTMLDivElement | null>(null)
  const observer = useRef<IntersectionObserver | null>(null)

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || !enabled) {
      return
    }

    try {
      setIsFetchingNextPage(true)
      setError(null)

      const result = await fetchNextPage()
      
      setData(prev => [...prev, ...result.data])
      setHasNextPage(result.hasMore)
      
      await onLoadMore?.()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load more data'
      setError(errorMessage)
      onError?.(err)
    } finally {
      setIsFetchingNextPage(false)
    }
  }, [hasNextPage, isFetchingNextPage, enabled, fetchNextPage, onLoadMore, onError])

  const reset = useCallback(() => {
    setData([])
    setHasNextPage(true)
    setIsLoading(false)
    setIsFetchingNextPage(false)
    setError(null)
  }, [])

  const addItems = useCallback((items: T[], position: 'start' | 'end' = 'end') => {
    setData(prev => position === 'start' ? [...items, ...prev] : [...prev, ...items])
  }, [])

  const removeItems = useCallback((predicate: (item: T) => boolean) => {
    setData(prev => prev.filter(item => !predicate(item)))
  }, [])

  const updateItems = useCallback((predicate: (item: T) => boolean, updater: (item: T) => T) => {
    setData(prev => prev.map(item => predicate(item) ? updater(item) : item))
  }, [])

  // Set up intersection observer
  useEffect(() => {
    if (!enabled || !hasNextPage) {
      return
    }

    if (observer.current) {
      observer.current.disconnect()
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          loadMore()
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    if (observerTarget.current) {
      observer.current.observe(observerTarget.current)
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [enabled, hasNextPage, isFetchingNextPage, loadMore, threshold, rootMargin])

  // Ref callback for the observer target
  const setObserverTarget = useCallback((node: HTMLDivElement | null) => {
    if (observerTarget.current && observer.current) {
      observer.current.unobserve(observerTarget.current)
    }
    
    observerTarget.current = node
    
    if (node && observer.current) {
      observer.current.observe(node)
    }
  }, [])

  const LoadMoreTrigger = useCallback(() => (
    React.createElement('div', {
      ref: setObserverTarget,
      className: "w-full h-4 flex items-center justify-center",
      'aria-hidden': "true"
    })
  ), [setObserverTarget])

  return {
    data,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
    loadMore,
    reset,
    addItems,
    removeItems,
    updateItems,
    LoadMoreTrigger
  }
}
