'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useRealTimeEvents } from '@/hooks'


import CommunitySection from '@/components/groups/CommunitySection'
import CreateGeneralEvent from '@/components/events/CreateGeneralEvent'
import AppLayout from '@/components/layout/AppLayout'

function EventsGoingPage() {
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

  
  const eventId = searchParams?.get('event')
  
  const [showCreateEvent, setShowCreateEvent] = useState(false)

  
  useEffect(() => {
    if (eventId) {
      const newUrl = `/events/going?event=${eventId}`
      router.replace(newUrl)
    }
  }, [eventId, router])

  
  useEffect(() => {
    if (user) {
      refetchEvents()
    }
  }, [user, refetchEvents])

  return (
    <AppLayout 
      activeTab="events"
      eventsSubTab="going"
      setEventsSubTab={() => {}}
    >
      <CreateGeneralEvent
        show={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onEventCreated={() => {
          refetchEvents()
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
        eventsSubTab="going"
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


function ProtectedEventsGoingPage() {
  return (
    <ProtectedRoute>
      <EventsGoingPage />
    </ProtectedRoute>
  )
}

export default ProtectedEventsGoingPage