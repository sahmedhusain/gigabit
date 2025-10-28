'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'


import AppLayout from '@/components/layout/AppLayout'


import DiscoverPage from '@/components/search/DiscoverPage'

function DiscoverPageRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const category = searchParams?.get('category') || 'trending'

  
  useEffect(() => {
    if (category && category !== 'trending') {
      const newUrl = `/discover?category=${category}`
      router.replace(newUrl)
    }
  }, [category, router])

  
  useEffect(() => {
    
  }, [user])

  return (
    <AppLayout activeTab="discover">
      <DiscoverPage />
    </AppLayout>
  )
}


function ProtectedDiscoverPage() {
  return (
    <ProtectedRoute>
      <DiscoverPageRoute />
    </ProtectedRoute>
  )
}

export default ProtectedDiscoverPage
