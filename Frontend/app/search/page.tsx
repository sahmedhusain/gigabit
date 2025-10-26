'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
// Import dashboard components
import SearchPage from '@/components/search/SearchPage'
import AppLayout from '@/components/layout/AppLayout'

function SearchPageRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query] = useState(searchParams?.get('q') || '')

  // Update URL when search query changes
  useEffect(() => {
    if (query) {
      const newUrl = `/search?q=${encodeURIComponent(query)}`
      router.replace(newUrl)
    }
  }, [query, router])

  const handleClose = () => {
    router.back()
  }

  return (
    <AppLayout activeTab="search">
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Main Content */}
        <div className="p-2 lg:p-4 relative z-10">
          <div className="max-w-7xl mx-auto h-full">
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Main Content Area */}
              <div className="flex-1 min-w-0 h-full">
                <SearchPage onClose={handleClose} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedSearchPage() {
  return (
    <ProtectedRoute>
      <SearchPageRoute />
    </ProtectedRoute>
  )
}

export default ProtectedSearchPage
