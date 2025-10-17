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

function EventsNotGoingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { success } = useToast()
  const { 
    events: liveEvents, 
    loading: eventsLoading, 
    create: createEvent,
    respond: respondToEvent,
    update: updateEvent,
    cancel,
    delete: deleteEvent,
    refetch: refetchEvents 
  } = useRealTimeEvents()

  // Get event ID from URL params for deep linking
  const eventId = searchParams.get('event')
  
  const [showCreateEvent, setShowCreateEvent] = useState(false)

  // Update URL when event ID changes
  useEffect(() => {
    if (eventId) {
      const newUrl = `/events/not-going?event=${eventId}`
      router.replace(newUrl)
    }
  }, [eventId, router])

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      refetchEvents()
    }
  }, [user, refetchEvents])

  return (
    <AppLayout 
      activeTab="events"
      eventsSubTab="not-going"
      setEventsSubTab={() => {}}
    >
      <CreateGeneralEvent
        show={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onEventCreated={() => {
          refetchEvents()
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
        eventsSubTab="not-going"
        events={liveEvents}
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
function ProtectedEventsNotGoingPage() {
  return (
    <ProtectedRoute>
      <EventsNotGoingPage />
    </ProtectedRoute>
  )
}

export default ProtectedEventsNotGoingPage