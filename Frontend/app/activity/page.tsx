'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

function ActivityPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/activity/liked')
  }, [router])

  return null
}

// Wrap the entire component with ProtectedRoute
function ProtectedActivityPage() {
  return (
    <ProtectedRoute>
      <ActivityPage />
    </ProtectedRoute>
  )
}

export default ProtectedActivityPage
