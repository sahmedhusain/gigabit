'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useToast } from '@/context/ToastContext'
import { useRealTimeEvents } from '@/hooks'


import CommunitySection from '@/components/groups/CommunitySection'
import CreateGeneralEvent from '@/components/events/CreateGeneralEvent'
import AppLayout from '@/components/layout/AppLayout'

function EventsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success } = useToast()

  
  const eventId = searchParams?.get('event')
  
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [eventsSubTab, setEventsSubTab] = useState('all')

  
  const { 
    events, 
    loading: eventsLoading, 
    create: createEvent,
    respond: respondToEvent,
    update: updateEvent,
    cancel,
    delete: deleteEvent
  } = useRealTimeEvents()

  
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
          success('Event created!')
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


function ProtectedEventsPage() {
  return (
    <ProtectedRoute>
      <EventsPage />
    </ProtectedRoute>
  )
}

export default ProtectedEventsPage
