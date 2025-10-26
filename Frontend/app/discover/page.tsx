'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'

// Import AppLayout instead of individual components
import AppLayout from '@/components/layout/AppLayout'

// Import dashboard components
import DiscoverPage from '@/components/search/DiscoverPage'

function DiscoverPageRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const category = searchParams?.get('category') || 'trending'

  // Update URL when category changes
  useEffect(() => {
    if (category && category !== 'trending') {
      const newUrl = `/discover?category=${category}`
      router.replace(newUrl)
    }
  }, [category, router])

  // Fetch data when component loads
  useEffect(() => {
    // No data fetching needed for discover page
  }, [user])

  return (
    <AppLayout activeTab="discover">
      <DiscoverPage />
    </AppLayout>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedDiscoverPage() {
  return (
    <ProtectedRoute>
      <DiscoverPageRoute />
    </ProtectedRoute>
  )
}

export default ProtectedDiscoverPage
