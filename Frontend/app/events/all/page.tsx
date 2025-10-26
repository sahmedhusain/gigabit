'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useRealTimeEvents } from '@/hooks'

// Import dashboard components
import CommunitySection from '@/components/groups/CommunitySection'
import CreateGeneralEvent from '@/components/events/CreateGeneralEvent'
import AppLayout from '@/components/layout/AppLayout'

function EventsAllPage() {
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
  const eventId = searchParams?.get('event')
  const [highlightedEventId, setHighlightedEventId] = useState<number | null>(null)
  
  const [showCreateEvent, setShowCreateEvent] = useState(false)

  // Scroll to event from hash or query param
  useEffect(() => {
    let id: number | null = null;
    const hash = window.location.hash;
    if (hash.startsWith('#event-')) {
      id = parseInt(hash.replace('#event-', ''));
    } else if (eventId) {
      id = parseInt(eventId);
    }
    if (id && !isNaN(id) && liveEvents.length > 0) {
      // Wait a bit for the DOM to be ready
      setTimeout(() => {
        const element = document.getElementById(`event-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedEventId(id);
          // Remove highlight after animation
          setTimeout(() => setHighlightedEventId(null), 3000);
        }
      }, 300);
    }
  }, [liveEvents, eventId]);

  // Update URL when event ID changes
  useEffect(() => {
    if (eventId) {
      const newUrl = `/events/all?event=${eventId}`
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
      eventsSubTab="all"
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
        eventsSubTab="all"
        events={liveEvents}
        eventsLoading={eventsLoading}
        respondToEvent={respondToEvent}
        updateEvent={updateEvent}
        cancelEvent={cancel}
        deleteEvent={deleteEvent}
        highlightedEventId={highlightedEventId}
      />
    </AppLayout>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedEventsAllPage() {
  return (
    <ProtectedRoute>
      <EventsAllPage />
    </ProtectedRoute>
  )
}

export default ProtectedEventsAllPage