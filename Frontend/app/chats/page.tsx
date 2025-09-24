'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

function ChatsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/chats/all')
  }, [router])

  return null
}

// Wrap the entire component with ProtectedRoute
function ProtectedChatsPage() {
  return (
    <ProtectedRoute>
      <ChatsPage />
    </ProtectedRoute>
  )
}

export default ProtectedChatsPage
