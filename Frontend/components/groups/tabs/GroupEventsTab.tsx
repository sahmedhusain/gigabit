'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, MapPin, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { api, EventResponse } from '@/lib/api'

interface GroupEventsTabProps {
  groupId: number
}

const GroupEventsTab: React.FC<GroupEventsTabProps> = ({ groupId }) => {
  const [events, setEvents] = useState<EventResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    event_time: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const { user } = useAuth()

  // Fetch group events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        console.log('User not authenticated, skipping events fetch')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('Fetching events for group:', groupId, 'User:', user.id)
        const response = await api.getGroupEvents(groupId)
        console.log('Group events response:', response)
        setEvents(response.events || [])
      } catch (error) {
        console.error('Failed to fetch group events:', error)
        if (error instanceof Error) {
          console.error('Error details:', error.message)
        }
        
        // Check if it's an authentication or permission error
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          console.error('Authentication error - user may need to log in again')
        } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          console.error('Permission error - user may not be a member of this group')
        } else if (errorMessage.includes('500')) {
          console.error('Server error - there may be an issue with the backend')
        }
        
        setEvents([]) // Set empty array on error
      } finally {
        setIsLoading(false)
      }
    }

    if (groupId) {
      fetchEvents()
    }
  }, [groupId, user])

  // Create new event
  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.event_time || isCreating) return

    try {
      setIsCreating(true)
      console.log('Creating event for group:', groupId, 'data:', newEvent)
      const createdEvent = await api.createEvent(groupId, newEvent)
      console.log('Created event:', createdEvent)
      setEvents([createdEvent.event, ...events])
      setNewEvent({ title: '', description: '', location: '', event_time: '' })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create event:', error)
      alert('Failed to create event. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Format date
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Format time until event
  const getTimeUntilEvent = (dateString: string) => {
    const eventDate = new Date(dateString)
    const now = new Date()
    const diff = eventDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (diff < 0) return 'Past event'
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `In ${days} days`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Create Event Button */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Group Events</h2>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Event</span>
          </motion.button>
        </div>
      </div>

      {/* Events Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
            />
          </div>
        ) : events.length === 0 ? (
          <motion.div
            className="flex items-center justify-center h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-white mb-2">No events yet</h3>
              <p className="text-white/60 mb-6">Create an event to bring the group together!</p>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create First Event
              </motion.button>
            </div>
          </motion.div>
        ) : (
          events.map((event, index) => (
            <motion.div
              key={event.id}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:from-white/15 hover:to-white/10 transition-all duration-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Event Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  {event.creator.avatar ? (
                    <img
                      src={event.creator.avatar}
                      alt={`${event.creator.first_name} ${event.creator.last_name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                      {event.creator.first_name[0]}{event.creator.last_name[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      Created by {event.creator.first_name} {event.creator.last_name}
                    </h4>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  getTimeUntilEvent(event.event_time) === 'Past event' 
                    ? 'bg-gray-500/20 text-gray-300' 
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {getTimeUntilEvent(event.event_time)}
                </div>
              </div>

              {/* Event Content */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white">{event.title}</h3>
                <p className="text-white/80 leading-relaxed">{event.description}</p>

                {/* Event Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatEventDate(event.event_time)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center space-x-3 text-white/60">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 text-white/60">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{(event.going_count + event.not_going_count)} responses</span>
                  </div>
                </div>

                {/* Response Buttons */}
                <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                  <motion.button
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      event.user_response === 'going' 
                        ? 'bg-green-500/30 text-green-300 border border-green-400/30' 
                        : 'bg-white/10 text-white/70 hover:bg-green-500/20 hover:text-green-300 border border-white/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Going
                  </motion.button>
                  <motion.button
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      event.user_response === 'maybe' 
                        ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/30' 
                        : 'bg-white/10 text-white/70 hover:bg-yellow-500/20 hover:text-yellow-300 border border-white/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Maybe
                  </motion.button>
                  <motion.button
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      event.user_response === 'not_going' 
                        ? 'bg-red-500/30 text-red-300 border border-red-400/30' 
                        : 'bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-300 border border-white/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Can't Go
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/30 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Create New Event</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter event title"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Describe your event..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400/60 resize-none min-h-[100px]"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Location (Optional)</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Where will it be?"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                  />
                </div>

                <div>
                  <label htmlFor="event-time" className="block text-white/80 text-sm font-medium mb-2">Date & Time</label>
                  <input
                    id="event-time"
                    type="datetime-local"
                    value={newEvent.event_time}
                    onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <motion.button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCreateEvent}
                  disabled={!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.event_time || isCreating}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCreating ? 'Creating...' : 'Create Event'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupEventsTab