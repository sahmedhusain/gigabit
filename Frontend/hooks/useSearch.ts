'use client'
import { useState, useCallback, useEffect, useRef } from 'react'

export interface SearchOptions<T> {
  minQueryLength?: number
  debounceMs?: number
  placeholder?: string
  onSearch?: (query: string) => Promise<T[]>
  onError?: (error: any) => void
  onClear?: () => void
  filterFn?: (items: T[], query: string) => T[]
}

export function useSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  options: SearchOptions<T> = {}
) {
  const {
    minQueryLength = 2,
    debounceMs = 300,
    onSearch,
    onError,
    onClear,
    filterFn
  } = options

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const abortController = useRef<AbortController | null>(null)

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minQueryLength) {
        setResults([])
        setError(null)
        setHasSearched(false)
        return
      }

      try {
        setIsSearching(true)
        setError(null)
        setHasSearched(true)

        // Cancel previous request
        if (abortController.current) {
          abortController.current.abort()
        }

        abortController.current = new AbortController()

        const searchResults = await searchFunction(searchQuery)
        
        // Apply additional filtering if provided
        const filteredResults = filterFn ? filterFn(searchResults, searchQuery) : searchResults
        
        setResults(filteredResults)
        await onSearch?.(searchQuery)
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          return
        }
        
        const errorMessage = err.message || 'Search failed'
        setError(errorMessage)
        setResults([])
        onError?.(err)
      } finally {
        setIsSearching(false)
      }
    },
    [searchFunction, minQueryLength, filterFn, onSearch, onError]
  )

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        performSearch(searchQuery)
      }, debounceMs)
    },
    [performSearch, debounceMs]
  )

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery)
      
      if (newQuery.trim() === '') {
        setResults([])
        setError(null)
        setHasSearched(false)
        onClear?.()
        
        // Clear debounce timer
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }
        return
      }

      debouncedSearch(newQuery.trim())
    },
    [debouncedSearch, onClear]
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
    setHasSearched(false)
    setIsSearching(false)
    
    // Cancel ongoing requests
    if (abortController.current) {
      abortController.current.abort()
    }
    
    // Clear debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    onClear?.()
  }, [onClear])

  const retrySearch = useCallback(() => {
    if (query.trim()) {
      performSearch(query.trim())
    }
  }, [query, performSearch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

  const isEmpty = results.length === 0
  const hasQuery = query.length >= minQueryLength
  const showNoResults = hasSearched && hasQuery && isEmpty && !isSearching && !error

  return {
    query,
    results,
    isSearching,
    error,
    hasSearched,
    isEmpty,
    hasQuery,
    showNoResults,
    setQuery: handleQueryChange,
    clearSearch,
    retrySearch,
    performSearch: () => performSearch(query.trim())
  }
}
