'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Calendar, MapPin, Users, Check, X, WifiOff, Hourglass } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConnectionStatus, useRealTimeEvents } from '@/hooks'
import { useToast } from '@/context/ToastContext'
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
  const [isAdminOrCreator, setIsAdminOrCreator] = useState<boolean>(false)
  const { isConnected } = useConnectionStatus()
  const { success, error: showError } = useToast()
  const {
    events: realtimeEvents,
    loading: rtEventsLoading,
    refetch: refetchEvents
  } = useRealTimeEvents(groupId)

  // Use real-time events from hook
  useEffect(() => {
    if (realtimeEvents && realtimeEvents.length > 0) {
      setEvents(realtimeEvents)
    }
    setIsLoading(rtEventsLoading)
  }, [realtimeEvents, rtEventsLoading])

  // Fetch role to determine if user can create events
  useEffect(() => {
    let mounted = true
    const fetchRole = async () => {
      try {
        const roleInfo = await api.getUserRole(groupId)
        if (mounted) setIsAdminOrCreator(!!roleInfo.is_admin_or_creator)
      } catch (_err) {
        // Non-critical; default to false
        if (mounted) setIsAdminOrCreator(false)
      }
    }
    fetchRole()
    return () => { mounted = false }
  }, [groupId])

  // Handle event response
  const handleEventResponse = async (eventId: number, response: 'going' | 'not_going') => {
    try {
      await api.respondToEvent(eventId, response)
      success(`Event response updated to ${response.replace('_', ' ')}!`)
      refetchEvents()
    } catch (error) {
      console.error('Failed to respond to event:', error)
      showError('Failed to update event response. Please try again.')
    }
  }

  // Create new event
  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.event_time || isCreating) return

    // Permission guard client-side
    if (!isAdminOrCreator) {
      showError('Only group admins and creators can create events')
      return
    }

    try {
      setIsCreating(true)
      // Normalize datetime-local string (YYYY-MM-DDTHH:MM) to RFC3339
      const isoEventTime = (() => {
        try {
          const d = new Date(newEvent.event_time)
          if (isNaN(d.getTime())) throw new Error('Invalid date')
          return d.toISOString()
        } catch {
          // Fallback: append seconds and Z assuming local time
          return newEvent.event_time.length === 16
            ? new Date(newEvent.event_time.replace('T', 'T') + ':00').toISOString()
            : new Date().toISOString()
        }
      })()

      const payload = { ...newEvent, event_time: isoEventTime }

      console.log('Creating event for group:', groupId, 'payload:', payload)
      const createdEvent = await api.createEvent(groupId, payload)
      console.log('Created event:', createdEvent)
      // Prefer refetch to get enriched event with creator/group fields
      try {
        await refetchEvents()
      } catch (_e) {
        // Fallback to optimistic add if refetch fails
        setEvents([createdEvent.event as unknown as EventResponse, ...events])
      }
      setNewEvent({ title: '', description: '', location: '', event_time: '' })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create event:', error)
      // Try to surface a meaningful message
      const message = (error && typeof error === 'object' && 'message' in (error as any))
        ? String((error as any).message)
        : 'Failed to create event. Please try again.'
      showError(message)
    } finally {
      setIsCreating(false)
    }
  }

  // Compute time until event (or since if past)
  const getTimeUntil = (dateString: string) => {
    const target = new Date(dateString).getTime()
    const now = Date.now()
    const diffMs = target - now

    const abs = Math.abs(diffMs)
    const minutes = Math.floor(abs / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)

    let value: string
    if (minutes < 60) {
      value = `${minutes}m`
    } else if (hours < 24) {
      value = `${hours}h`
    } else if (days < 14) {
      value = `${days}d`
    } else if (weeks < 8) {
      value = `${weeks}w`
    } else {
      // Fallback to date only for far future
      return new Date(dateString).toLocaleDateString()
    }

    return diffMs >= 0 ? `Starts in ${value}` : `${value} ago`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Create Event Button */}
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <h2 className="text-xl font-bold text-white">Group Events</h2>
          {isAdminOrCreator ? (
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg w-full sm:w-auto justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Create Event</span>
            </motion.button>
          ) : (
            <div className="text-white/60 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              Only admins and creators can create events
            </div>
          )}
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
          <div className="space-y-4">
            {/* Connection Status Warning */}
            {!isConnected && (
              <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-400/10 border border-orange-400/20 rounded-lg p-3">
                <WifiOff className="w-4 h-4 flex-shrink-0" />
                <span>Connection lost - events may not update in real-time</span>
              </div>
            )}
            
            {events
              .sort((a, b) => {
                // Sort by event date - upcoming events first, then past events
                const dateA = new Date(a.event_time);
                const dateB = new Date(b.event_time);
                const now = new Date();
                
                const aIsPast = dateA < now;
                const bIsPast = dateB < now;
                
                // If both are upcoming or both are past, sort by date
                if (aIsPast === bIsPast) {
                  return aIsPast ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
                }
                
                // Upcoming events come first
                return aIsPast ? 1 : -1;
              })
              .map((event, index) => {
                const eventDate = new Date(event.event_time);
                const isExpired = eventDate < new Date();
                const isToday = eventDate.toDateString() === new Date().toDateString();
                
                return (
                  <motion.div
                    key={event.id}
                    className="group relative bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-white font-bold text-xl group-hover:text-emerald-200 transition-colors duration-200">{event.title}</h3>
                              {isToday && (
                                <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full font-medium">Today</span>
                              )}
                              {isExpired && (
                                <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">Past Event</span>
                              )}
                              {!isExpired && !isToday && (
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full flex items-center gap-1">
                                  <Hourglass className="w-3 h-3" /> {getTimeUntil(event.event_time)}
                                </span>
                              )}
                            </div>
                            <p className="text-white/80 mb-4 leading-relaxed">{event.description}</p>
                          </div>
                        </div>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          {/* Date & Time */}
                          <div className="flex items-center space-x-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-white/90 text-sm font-medium">{eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              <p className="text-white/60 text-xs">{eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                            </div>
                          </div>

                          {/* Location */}
                          {event.location && (
                            <div className="flex items-center space-x-3 bg-white/5 rounded-lg p-3 border border-white/10">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-white/90 text-sm font-medium">Location</p>
                                <p className="text-white/60 text-xs truncate max-w-32">{event.location}</p>
                              </div>
                            </div>
                          )}

                          {/* Creator */}
                          <div className="flex items-center space-x-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-white/90 text-sm font-medium">Created by</p>
                              <p className="text-white/60 text-xs">{event.creator.first_name} {event.creator.last_name}</p>
                            </div>
                          </div>
                        </div>

                        {/* Time ago */}
                        <div className="text-xs text-white/50 border-t border-white/10 pt-3">
                          <span>{(() => {
                            const created = new Date(event.created_at || event.event_time);
                            const now = new Date();
                            const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
                            if (diffInSeconds < 60) return 'Just now';
                            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
                            return created.toLocaleDateString();
                          })()}</span>
                        </div>
                      </div>

                      {/* Right Side - Response Section */}
                      <div className="flex flex-col items-end space-y-4 lg:min-w-48">
                        {/* Response Counts */}
                        <div className="flex items-center space-x-4 bg-white/5 rounded-lg p-3 border border-white/10 w-full lg:w-auto">
                          <div className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-white/80 text-sm font-medium">{event.going_count || 0}</span>
                            <span className="text-white/60 text-xs">going</span>
                          </div>
                          <div className="flex items-center space-x-2">     
                            <X className="w-4 h-4 text-red-400" />
                            <span className="text-white/80 text-sm font-medium">{event.not_going_count || 0}</span>
                            <span className="text-white/60 text-xs">not going</span>
                          </div>
                        </div>

                        {/* Response Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                          {event.user_response === 'going' ? (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventResponse(event.id, 'going');
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Check className="w-4 h-4" />
                              <span>Going</span>
                            </motion.button>
                          ) : (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventResponse(event.id, 'going');
                              }}
                              className="flex-1 bg-white/10 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-emerald-400/50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Check className="w-4 h-4" />
                              <span>Going</span>
                            </motion.button>
                          )}

                          {event.user_response === 'not_going' ? (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventResponse(event.id, 'not_going');
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X className="w-4 h-4" />
                              <span>Not Going</span>
                            </motion.button>
                          ) : (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventResponse(event.id, 'not_going');
                              }}
                              className="flex-1 bg-white/10 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-red-400/50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X className="w-4 h-4" />
                              <span>Not Going</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center py-8 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="relative w-full max-w-2xl h-[80vh] max-h-[600px] flex flex-col"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Enhanced backdrop with multiple layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>

              {/* Fixed Header */}
              <div className="relative flex-shrink-0 p-6 lg:p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Calendar className="w-6 h-6 text-white drop-shadow-sm" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">Create Group Event</h3>
                      <p className="text-white/60 text-sm">Organize an event for this group</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
                    title="Close"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="relative flex-1 overflow-y-auto px-6 lg:px-8">
                <div className="space-y-6">
                  {/* Event Title */}
                  <div className="space-y-3">
                    <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span>Event Title</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Enter an exciting event title..."
                        maxLength={100}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-xs text-white/50 text-right">
                      {newEvent.title.length}/100
                    </div>
                  </div>

                  {/* Event Description */}
                  <div className="space-y-3">
                    <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      <span>Description</span>
                    </label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Tell people what this event is about, what's the agenda, what to expect..."
                      maxLength={500}
                      className="w-full h-28 lg:h-32 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                    />
                    <div className="text-xs text-white/50 text-right">
                      {newEvent.description.length}/500
                    </div>
                  </div>

                  {/* Event Location */}
                  <div className="space-y-3">
                    <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <span>Location</span>
                    </label>
                    <textarea
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Where will the event take place? Include address, virtual meeting link, or venue details..."
                      maxLength={200}
                      className="w-full h-24 lg:h-28 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                    />
                    <div className="text-xs text-white/50 text-right">
                      {newEvent.location.length}/200
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-3">
                    <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span>Date & Time</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={newEvent.event_time}
                        onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                        title="Select event date and time"
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Connection Status */}
                  {!isConnected && (
                    <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-red-300 text-sm font-medium">You are currently offline. Event will be created when connection is restored.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="relative flex-shrink-0 p-6 lg:p-8 pt-4">
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    disabled={isCreating || !isConnected || !newEvent.title.trim() || !newEvent.description.trim() || !newEvent.event_time}
                    className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg ${
                      isCreating || !isConnected || !newEvent.title.trim() || !newEvent.description.trim() || !newEvent.event_time
                        ? 'bg-white/20 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 shadow-emerald-500/25'
                    }`}
                  >
                    {isCreating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating Event...</span>
                      </div>
                    ) : (
                      'Create Event'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupEventsTab