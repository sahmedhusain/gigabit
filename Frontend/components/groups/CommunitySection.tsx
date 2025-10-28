'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Event, api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { CommunitySectionProps } from '@/types/groups'
import CommunityHeader from './community/CommunityHeader'
import EventList from './community/EventList'
import ActivityHistory from './community/ActivityHistory'
import EventModals from './community/EventModals'
import { EventModalsRef } from '@/types/groups'

export default function CommunitySection({
  notifications,
  isLoadingNotifications,
  setShowCreateEvent,
  communitySubTab,
  eventsSubTab = 'all',
  events = [],
  eventsLoading,
  respondToEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  highlightedEventId
}: CommunitySectionProps) {
  const [respondingToEvent, setRespondingToEvent] = useState<number | null>(null)
  const [optimisticEvents, setOptimisticEvents] = useState<Event[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [groupRoles, setGroupRoles] = useState<{ [groupId: number]: { role: string; is_admin_or_creator: boolean } }>({})
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null)
  const [hideEndedEvents, setHideEndedEvents] = useState(false)
  const eventModalsRef = useRef<EventModalsRef>(null)
  const { user } = useAuth()
  const { success, error } = useToast()

  
  useEffect(() => {
    setOptimisticEvents(events || [])
  }, [events])

  
  const loadUserGroupRoles = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.getUserGroups(user.id)
      const userGroups = data.groups || []
      
      
      const rolesMap: { [groupId: number]: { role: string; is_admin_or_creator: boolean } } = {}
      await Promise.all(
        userGroups.map(async (group) => {
          try {
            const roleData = await api.getUserRole(group.id)
            rolesMap[group.id] = roleData
          } catch (err) {
            console.error(`Failed to load role for group ${group.id}:`, err)
            rolesMap[group.id] = { role: 'member', is_admin_or_creator: false }
          }
        })
      )
      setGroupRoles(rolesMap)
    } catch (err) {
      console.error('Failed to load user group roles:', err)
      setGroupRoles({})
    }
  }, [user])

  useEffect(() => {
    loadUserGroupRoles()
  }, [loadUserGroupRoles])

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.relative')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen])

  const handleEventResponse = async (eventId: number, option: 'going' | 'not_going' ) => {
    const previousResponse = optimisticEvents.find(e => e.id === eventId)?.user_response
    const isRemovingResponse = previousResponse === option
    
    
    setOptimisticEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id === eventId) {
          const newEvent = { ...event }
          
          if (isRemovingResponse) {
            
            newEvent.user_response = 'none'
            
            
            if (option === 'going') {
              newEvent.going_count = Math.max(0, newEvent.going_count - 1)
            } else {
              newEvent.not_going_count = Math.max(0, newEvent.not_going_count - 1)
            }
          } else {
            
            newEvent.user_response = option
            
            
            if (previousResponse === 'going' && option !== 'going') {
              newEvent.going_count = Math.max(0, newEvent.going_count - 1)
            } else if (previousResponse !== 'going' && option === 'going') {
              newEvent.going_count = newEvent.going_count + 1
            }
            
            if (previousResponse === 'not_going' && option !== 'not_going') {
              newEvent.not_going_count = Math.max(0, newEvent.not_going_count - 1)
            } else if (previousResponse !== 'not_going' && option === 'not_going') {
              newEvent.not_going_count = newEvent.not_going_count + 1
            }
          }
          
          return newEvent
        }
        return event
      })
    )

    try {
      setRespondingToEvent(eventId)
      await respondToEvent(eventId, option)
      
    } catch (err: unknown) {
      
      setOptimisticEvents(events || [])
      const message = err instanceof Error ? err.message : String(err)
      error(message || 'Failed to update response')
    } finally {
      setRespondingToEvent(null)
    }
  }

  
  const handleDeleteEvent = async (eventId: number) => {
    try {
      await deleteEvent(eventId)
      success('Event deleted!')
    } catch {
      error('Failed to delete event. Please try again.');
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatCancellationReason = (reason: string) => {
    if (!reason) return ''
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const isEventEnded = (event: Event) => {
    if (event.canceled) return false
    return new Date(event.event_time) < new Date()
  }

  const renderEvents = () => {
    return (
      <EventList
        events={optimisticEvents}
        eventsLoading={eventsLoading}
        sortBy={sortBy}
        hideEndedEvents={hideEndedEvents}
        eventsSubTab={eventsSubTab}
        highlightedEventId={highlightedEventId || undefined}
        respondingToEvent={respondingToEvent}
        user={user}
        groupRoles={groupRoles}
        dropdownOpen={dropdownOpen}
        onDropdownToggle={setDropdownOpen}
        onEditEvent={(event) => eventModalsRef.current?.openEditModal(event)}
        onCancelEvent={(event) => eventModalsRef.current?.openCancelModal(event)}
        onDeleteEvent={(event) => eventModalsRef.current?.openDeleteModal(event)}
        onEventResponse={handleEventResponse}
        formatDate={formatDate}
        formatTime={formatTime}
        formatTimeAgo={formatTimeAgo}
        formatCancellationReason={formatCancellationReason}
        isEventEnded={isEventEnded}
      />
    )
  }

  const renderActivityHistory = () => {
    return (
      <ActivityHistory
        notifications={notifications}
        isLoadingNotifications={isLoadingNotifications}
      />
    )
  }

  const renderContent = () => {
    switch (communitySubTab) {
      case 'events':
        return renderEvents()
      case 'activity':
        return renderActivityHistory()
      default:
        return renderEvents()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <CommunityHeader
        communitySubTab={communitySubTab}
        eventsSubTab={eventsSubTab}
        sortBy={sortBy}
        hideEndedEvents={hideEndedEvents}
        onSortChange={setSortBy}
        onHideEndedToggle={() => setHideEndedEvents(!hideEndedEvents)}
        onCreateEvent={() => setShowCreateEvent(true)}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-scroll scrollbar-hide custom-scrollbar-hide">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {renderContent()}
        </motion.div>
      </div>

      <EventModals
        ref={eventModalsRef}
        onCancelEvent={async (eventId, reason) => {
          try {
            await cancelEvent(eventId, reason)
            success('Event cancelled!')
          } catch (err) {
            console.error('Failed to cancel event:', err)
            error('Failed to cancel event. Please try again.')
          }
        }}
        onDeleteEvent={handleDeleteEvent}
        onEditEvent={async (eventId, data) => {
          try {
            await updateEvent(eventId, data)
            success('Event updated!')
          } catch (err) {
            console.error('Failed to update event:', err)
            error('Failed to update event. Please try again.')
          }
        }}
      />
    </div>
  )
}