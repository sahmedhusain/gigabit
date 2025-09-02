'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type CategoryResponse, type PostResponse } from '@/lib/api'
import { useToast } from '@/context/ToastContext'

export function useCategories() {
  const { error } = useToast()
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [trending, setTrending] = useState<CategoryResponse[]>([])
  const [searchResults, setSearchResults] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getCategories()
      setCategories(res.categories || [])
      const stats = await api.getCategoryStats()
      setTrending((stats.stats || []).filter((s: any) => s.trending))
    } catch (e: any) {
      setErr(e?.message || 'Failed to load categories')
      error('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }, [error])

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    try {
      setIsSearching(true)
      const res = await api.searchCategories(query)
      setSearchResults(res.categories || [])
    } catch {
      error('Failed to search categories.')
    } finally {
      setIsSearching(false)
    }
  }, [error])

  const getPostsByCategory = useCallback(async (categoryId: number): Promise<PostResponse[]> => {
    const res = await api.getPostsByCategory(categoryId)
    return res.posts || []
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return useMemo(() => ({
    categories,
    trending,
    searchResults,
    loading,
    error: err,
    isSearching,
    refetch,
    search,
    getPostsByCategory,
  }), [categories, trending, searchResults, loading, err, isSearching, refetch, search, getPostsByCategory])
}
