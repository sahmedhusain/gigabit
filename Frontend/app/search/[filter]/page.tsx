'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import SearchResults from '@/components/dashboard/SearchResults'
import AppLayout from '@/components/AppLayout'

function FilteredSearchPageRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()

  const filter = params.filter as string
  const [query, setQuery] = useState(searchParams.get('q') || '')

  // Sync query state with URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    if (urlQuery !== query) {
      setQuery(urlQuery)
    }
  }, [searchParams, query])

  // Update URL when search query changes
  useEffect(() => {
    if (query) {
      const newUrl = `/search/${filter}?q=${encodeURIComponent(query)}`
      router.replace(newUrl)
    }
  }, [query, router, filter])

  const handleClose = () => {
    router.back()
  }

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery)
  }

  return (
    <AppLayout activeTab="search">
      <SearchResults 
        filter={filter}
        query={query}
        onSearch={handleSearch}
        onClose={handleClose}
      />
    </AppLayout>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedFilteredSearchPage() {
  return (
    <ProtectedRoute>
      <FilteredSearchPageRoute />
    </ProtectedRoute>
  )
}

export default ProtectedFilteredSearchPage