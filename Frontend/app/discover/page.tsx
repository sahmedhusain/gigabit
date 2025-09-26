'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useNotifications } from '@/hooks'
import {
  api,
  NetworkError
} from '@/lib/api'

// Import AppLayout instead of individual components
import AppLayout from '@/components/AppLayout'

// Import dashboard components
import DiscoverPage from '@/components/dashboard/DiscoverPage'

function DiscoverPageRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { isConnected, onlineUsers } = useWebSocket()
  const { success, error } = useToast()
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications()

  const [category, setCategory] = useState(searchParams.get('category') || 'trending')

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

  const handleTabChange = (newTab: string) => {
    router.push(`/${newTab}`)
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <AppLayout activeTab="discover">
      <DiscoverPage onClose={handleClose} />
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
