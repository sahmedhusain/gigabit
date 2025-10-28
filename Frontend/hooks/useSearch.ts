'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { SearchOptions, SearchResult, SearchResponse } from '@/types/hooks'

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

// Enhanced search hook for the new search functionality
export function useSearchResults() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentQuery, setCurrentQuery] = useState('')
  const [currentFilter, setCurrentFilter] = useState('all')

  const abortController = useRef<AbortController | null>(null)

  const searchAll = useCallback(async (query: string, filter: string = 'all', page: number = 1, limit: number = 20, append: boolean = false) => {
    if (query.length < 2) {
      if (!append) {
        setResults([])
        setTotalCount(0)
      }
      return
    }

    try {
      setLoading(true)
      setError(null)
      setCurrentQuery(query)
      setCurrentFilter(filter)

      
      if (abortController.current) {
        abortController.current.abort()
      }

      abortController.current = new AbortController()

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(
        `${API_BASE_URL}/api/search?${new URLSearchParams({
          q: query,
          filter,
          page: page.toString(),
          limit: limit.toString()
        })}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          signal: abortController.current.signal
        }
      )

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data: SearchResponse = await response.json()
      const newResults = data.results || []
      
      if (append) {
        setResults(prev => [...prev, ...newResults])
      } else {
        setResults(newResults)
      }
      
      setTotalCount(data.count || 0)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return
      }
      
      const errorMessage = err.message || 'Search failed'
      setError(errorMessage)
      if (!append) {
        setResults([])
        setTotalCount(0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const searchSuggestions = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (query.length < 2) {
      return []
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(
        `${API_BASE_URL}/api/search/suggestions?${new URLSearchParams({ q: query })}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Suggestions failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.suggestions || []
    } catch (err) {
      console.error('Search suggestions failed:', err)
      return []
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setTotalCount(0)
    setError(null)
    setCurrentQuery('')
    setCurrentFilter('all')
    
    if (abortController.current) {
      abortController.current.abort()
    }
  }, [])

  
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

  return {
    results,
    loading,
    error,
    totalCount,
    currentQuery,
    currentFilter,
    searchAll,
    searchSuggestions,
    clearResults
  }
}
