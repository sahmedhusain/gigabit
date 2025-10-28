'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SearchResults from '@/components/search/SearchResults'
import AppLayout from '@/components/layout/AppLayout'

function FilteredSearchPageRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()

  const filter = (params as { filter: string }).filter
  const [query, setQuery] = useState(searchParams?.get('q') || '')

  // Sync query state with URL changes
  useEffect(() => {
    const urlQuery = searchParams?.get('q') || ''
    if (urlQuery !== query) {
      setQuery(urlQuery)
    }
  }, [searchParams, query])

  
  useEffect(() => {
    if (query) {
      const newUrl = `/search/${filter}?q=${encodeURIComponent(query)}`
      router.replace(newUrl)
    }
  }, [query, router, filter])

  return (
    <AppLayout activeTab="search">
      <SearchResults 
        filter={filter}
        query={query}
      />
    </AppLayout>
  )
}


function ProtectedFilteredSearchPage() {
  return (
    <ProtectedRoute>
      <FilteredSearchPageRoute />
    </ProtectedRoute>
  )
}

export default ProtectedFilteredSearchPage