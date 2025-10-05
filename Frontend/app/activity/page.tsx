import { redirect } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

function ActivityPage() {
  redirect('/activity/liked')
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
