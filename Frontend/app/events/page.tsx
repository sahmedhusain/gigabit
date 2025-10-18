'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useRealTimeEvents } from '@/hooks'

// Import dashboard components
import CommunitySection from '@/components/dashboard/CommunitySection'
import CreateGeneralEvent from '@/components/dashboard/CreateGeneralEvent'
import AppLayout from '@/components/AppLayout'

function EventsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { success } = useToast()

  // Get event ID from URL params for deep linking
  const eventId = searchParams.get('event')
  
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [eventsSubTab, setEventsSubTab] = useState('all')

  // Use real-time events hook
  const { 
    events, 
    loading: eventsLoading, 
    create: createEvent,
    respond: respondToEvent,
    update: updateEvent,
    cancel,
    delete: deleteEvent
  } = useRealTimeEvents()

  // Update URL when event ID changes
  useEffect(() => {
    if (eventId) {
      const newUrl = `/events?event=${eventId}`
      router.replace(newUrl)
    }
  }, [eventId, router])

  return (
    <AppLayout 
      activeTab="events"
      eventsSubTab={eventsSubTab}
      setEventsSubTab={setEventsSubTab}
    >
      <CreateGeneralEvent
        show={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onEventCreated={() => {
          setShowCreateEvent(false)
          success('Event created successfully!')
        }}
        createEvent={createEvent}
      />

      <CommunitySection
        notifications={[]}
        isLoadingNotifications={false}
        setShowCreateEvent={setShowCreateEvent}
        communitySubTab={'events'}
        eventsSubTab={eventsSubTab}
        events={events}
        eventsLoading={eventsLoading}
        respondToEvent={respondToEvent}
        updateEvent={updateEvent}
        cancelEvent={cancel}
        deleteEvent={deleteEvent}
      />
    </AppLayout>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedEventsPage() {
  return (
    <ProtectedRoute>
      <EventsPage />
    </ProtectedRoute>
  )
}

export default ProtectedEventsPage
