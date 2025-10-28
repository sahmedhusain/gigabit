'use client'
import React from 'react'
import { Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import EventCard from './EventCard'
import { EventListProps } from '@/types/groups'

export default function EventList({
  events,
  eventsLoading,
  sortBy,
  hideEndedEvents,
  eventsSubTab,
  highlightedEventId,
  respondingToEvent,
  user,
  groupRoles,
  dropdownOpen,
  onDropdownToggle,
  onEditEvent,
  onCancelEvent,
  onDeleteEvent,
  onEventResponse,
  formatDate,
  formatTime,
  formatTimeAgo,
  formatCancellationReason,
  isEventEnded
}: EventListProps) {
  if (eventsLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center py-12"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </motion.div>
    )
  }

  
  const sortedEvents = [...events]

  switch (sortBy) {
    case 'newest':
      sortedEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
    case 'oldest':
      sortedEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      break
    default:
      sortedEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  
  const filteredEvents = sortedEvents.filter(event => {
    
    let matchesSubTab = true
    if (eventsSubTab === 'going') {
      matchesSubTab = event.user_response === 'going'
    } else if (eventsSubTab === 'not-going') {
      matchesSubTab = event.user_response === 'not_going'
    }
    

    
    let matchesEndedFilter = true
    if (hideEndedEvents) {
      matchesEndedFilter = !event.canceled && !isEventEnded(event)
    }

    return matchesSubTab && matchesEndedFilter
  })

  if (filteredEvents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-center py-16"
      >
        <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-white/60">No events found</p>
        <p className="text-white/40 text-sm mt-2">
          {eventsSubTab === 'going' && 'You haven\'t marked any events as going yet'}
          {eventsSubTab === 'not-going' && 'You haven\'t marked any events as not going yet'}
          {eventsSubTab === 'all' && 'Create or join events to see them here'}
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {filteredEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isHighlighted={highlightedEventId === event.id}
          respondingToEvent={respondingToEvent}
          user={user}
          groupRoles={groupRoles}
          dropdownOpen={dropdownOpen}
          onDropdownToggle={onDropdownToggle}
          onEditEvent={onEditEvent}
          onCancelEvent={onCancelEvent}
          onDeleteEvent={onDeleteEvent}
          onEventResponse={onEventResponse}
          formatDate={formatDate}
          formatTime={formatTime}
          formatTimeAgo={formatTimeAgo}
          formatCancellationReason={formatCancellationReason}
          isEventEnded={isEventEnded}
        />
      ))}
    </div>
  )
}