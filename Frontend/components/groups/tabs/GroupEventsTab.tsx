'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Calendar, MapPin, Users, Check, X, WifiOff, Hourglass, Trash2, MoreVertical, Edit } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConnectionStatus, useRealTimeEvents } from '@/hooks'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { api, EventResponse, UpdateEventRequest } from '@/lib/api'
import CreateGroupEvent from '../CreateGroupEvent'
import { GroupEventsTabProps } from '@/types/groups'

const GroupEventsTab: React.FC<GroupEventsTabProps> = ({ groupId, groupTitle }) => {
  const [events, setEvents] = useState<EventResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isAdminOrCreator, setIsAdminOrCreator] = useState<boolean>(false)
  const [groupPermissions, setGroupPermissions] = useState<{ create_events: 'all_members' | 'admins_only' } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const { isConnected } = useConnectionStatus()
  const { success, error: showError } = useToast()
  const { user } = useAuth()
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

  // Load user role for this group
  useEffect(() => {
    const loadUserRole = async () => {
      if (!user || !groupId) return
      
      try {
        const roleData = await api.getUserRole(groupId)
        setIsAdminOrCreator(roleData.is_admin_or_creator)
        
        // Fetch group data to get permissions
        const groupData = await api.getGroup(groupId)
        setGroupPermissions({
          create_events: groupData.create_events
        })
      } catch (err) {
        console.error('Failed to load user role for group:', err)
        setIsAdminOrCreator(false)
        setGroupPermissions(null)
      }
    }
    
    loadUserRole()
  }, [user, groupId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.relative')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  
  const handleEventResponse = async (eventId: number, response: 'going' | 'not_going') => {
    try {
      await api.respondToEvent(eventId, response)
      success(`Event response updated to ${response.replace('_', ' ')}!`)
      refetchEvents()
    } catch {
      showError('Failed to update event response. Please try again.');
    }
  }

  
  const handleDeleteEvent = async (eventId: number) => {
    try {
      await api.cancelEvent(eventId, { cancel_reason: 'Event cancelled by organizer' });
      success('Event cancelled!');
      refetchEvents();
    } catch {
      showError('Failed to cancel event. Please try again.');
    }
  }

  
  const handleCancelEvent = async (eventId: number) => {
    try {
      await api.cancelEvent(eventId, { cancel_reason: cancelReason });
      success('Event cancelled!');
      refetchEvents();
    } catch {
      showError('Failed to cancel event. Please try again.');
    }
  }

  
  const handleEditEvent = async (eventId: number) => {
    try {
      const eventDateTime = new Date(`${editDate}T${editTime}`);
      const eventData: UpdateEventRequest = {
        event_time: eventDateTime.toISOString(),
        location: editLocation.trim()
      };

      await api.updateEvent(eventId, eventData);
      success('Event updated!');
      refetchEvents();
      setShowEditModal(false);
      setSelectedEvent(null);
      setEditLocation('');
      setEditDate('');
      setEditTime('');
    } catch {
      showError('Failed to update event. Please try again.');
    }
  }

  // Handle event created
  const handleEventCreated = () => {
    refetchEvents()
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

  // Format cancellation reason for display
    const formatCancellationReason = (reason: string) => {
    if (!reason) return ''
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const isEventEnded = (event: EventResponse) => {
    if (event.canceled) return false
    return new Date(event.event_time) < new Date()
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

  const canCreateEvents = () => {
    if (!groupPermissions) return false
    return isAdminOrCreator || groupPermissions.create_events === 'all_members'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Create Event Button */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6 mt-2 hover:shadow-emerald-500/10 transition-all duration-500 mx-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                <Calendar className="w-4 h-4 text-white drop-shadow-sm" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white mb-0.5">Group Events</h2>
              <p className="text-white/70 text-xs lg:text-sm">Create and manage events for your group members</p>
            </div>
          </div>
          {canCreateEvents() ? (
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-medium transition-all duration-300 shadow-md hover:shadow-lg self-start sm:self-center text-sm"
              whileHover={{ scale: 1.02, y: -0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </motion.button>
          ) : (
            <div className="text-white/60 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 self-start sm:self-center">
              Only admins and creators can create events
            </div>
          )}
        </div>
      </div>

      {/* Events Content */}
      <div className="flex-1 overflow-y-scroll scrollbar-hide p-6 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
            />
          </div>
        ) : events.length === 0 ? (
          <motion.div
            className="flex items-center justify-center h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center max-w-md mx-auto">
              <Calendar className="w-16 h-16 text-white/40 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">No events yet</h3>
              <p className="text-white/60 mb-6">Create an event to bring the group together!</p>
              {canCreateEvents() ? (
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create First Event
                </motion.button>
              ) : (
                <div className="text-white/60 text-sm bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                  Only admins and creators can create events
                </div>
              )}
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
                
                const dateA = new Date(a.event_time);
                const dateB = new Date(b.event_time);
                const now = new Date();
                
                const aIsPast = dateA < now;
                const bIsPast = dateB < now;
                
                
                if (aIsPast === bIsPast) {
                  return aIsPast ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
                }
                
                
                return aIsPast ? 1 : -1;
              })
              .map((event, index) => {
                const eventDate = new Date(event.event_time);
                const isExpired = eventDate < new Date();
                const isToday = eventDate.toDateString() === new Date().toDateString();
                
                return (
                  <motion.div
                    key={event.id}
                    className="group relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer animate-fade-in animate-slide-in-from-bottom border-white/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    style={{ animationDelay: `${index < 6 ? index * 100 : 500}ms` }}
                  >
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-white font-bold text-xl group-hover:text-emerald-200 transition-colors duration-200">{event.title}</h3>
                              {event.canceled && (
                                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                                  CANCELED
                                </span>
                              )}
                              {isEventEnded(event) && (
                                <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full font-medium">
                                  ENDED
                                </span>
                              )}
                              {isToday && !isEventEnded(event) && (
                                <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full font-medium">Today</span>
                              )}
                              {!isExpired && !isToday && !event.canceled && (
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full flex items-center gap-1">
                                  <Hourglass className="w-3 h-3" /> {getTimeUntil(event.event_time)}
                                </span>
                              )}
                            </div>
                            <p className="text-white/80 mb-4 leading-relaxed">{event.description}</p>
                            {event.canceled && event.cancel_reason && (
                              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                <p className="text-red-300 text-sm">
                                  <span className="font-medium">Cancellation reason:</span> {formatCancellationReason(event.cancel_reason)}
                                </p>
                              </div>
                            )}
                          </div>
                          {/* Three-dots menu for admins/creators and event creators */}
                          {(isAdminOrCreator || (user && event.creator_id === user.id)) && (
                            <div className="relative ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDropdownOpen(dropdownOpen === event.id ? null : event.id);
                                }}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Event options"
                                title="Event Options"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>

                              {/* Dropdown Menu */}
                              {dropdownOpen === event.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50">
                                  {!event.canceled && !isEventEnded(event) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEvent(event);
                                        setEditLocation(event.location || '');
                                        const eventDate = new Date(event.event_time);
                                        setEditDate(eventDate.toISOString().split('T')[0]);
                                        setEditTime(eventDate.toTimeString().slice(0, 5));
                                        setDropdownOpen(null);
                                        setShowEditModal(true);
                                      }}
                                      className="w-full flex items-center space-x-2 px-4 py-3 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors rounded-t-lg"
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span className="text-sm font-medium">Edit Event</span>
                                    </button>
                                  )}
                                  {!event.canceled && !isEventEnded(event) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEvent(event);
                                        setDropdownOpen(null);
                                        setShowCancelModal(true);
                                      }}
                                      className="w-full flex items-center space-x-2 px-4 py-3 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                      <span className="text-sm font-medium">Cancel Event</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(event);
                                      setDropdownOpen(null);
                                      setShowDeleteModal(true);
                                    }}
                                    className={`w-full flex items-center space-x-2 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-b-lg`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-sm font-medium">Delete Event</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          {/* Date & Time */}
                          <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-3 border border-white/10">
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
                            <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-3 border border-white/10">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-white/90 text-sm font-medium">Location</p>
                                <p className="text-white/60 text-xs truncate max-w-32">{event.location}</p>
                              </div>
                            </div>
                          )}

                          {/* Group */}
                          <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-3 border border-white/10">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-white/90 text-sm font-medium">Group</p>
                              <p className="text-white/60 text-xs">{groupTitle}</p>
                            </div>
                          </div>
                        </div>

                        {/* Creator & Time */}
                        <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
                          <span>Created by {event.creator.first_name} {event.creator.last_name}</span>
                          <span>{formatTimeAgo(event.created_at || event.event_time)}</span>
                        </div>
                      </div>

                      {/* Right Side - Response Section */}
                      <div className="flex flex-col items-end space-y-4 lg:min-w-48">
                        {/* Response Counts */}
                        <div className="flex items-center space-x-4 bg-white/5 rounded-2xl p-3 border border-white/10 w-full">
                          <div className="flex items-center space-x-2 flex-1">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-white/80 text-sm font-medium">{event.going_count || 0}</span>
                            <span className="text-white/60 text-xs">going</span>
                          </div>
                          <div className="flex items-center space-x-2 flex-1">     
                            <X className="w-4 h-4 text-red-400" />
                            <span className="text-white/80 text-sm font-medium">{event.not_going_count || 0}</span>
                            <span className="text-white/60 text-xs">not going</span>
                          </div>
                        </div>

                        {/* Response Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full justify-start">
                          {event.user_response === 'going' ? (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventResponse(event.id, 'going');
                              }}
                              disabled={event.canceled || isEventEnded(event)}
                              className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
                              whileHover={event.canceled || isEventEnded(event) ? {} : { scale: 1.05 }}
                              whileTap={event.canceled || isEventEnded(event) ? {} : { scale: 0.95 }}
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
                              disabled={event.canceled || isEventEnded(event)}
                              className={`flex-1 bg-white/10 hover:bg-emerald-600 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-emerald-400/50 ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
                              whileHover={event.canceled || isEventEnded(event) ? {} : { scale: 1.05 }}
                              whileTap={event.canceled || isEventEnded(event) ? {} : { scale: 0.95 }}
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
                              disabled={event.canceled || isEventEnded(event)}
                              className={`flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
                              whileHover={event.canceled || isEventEnded(event) ? {} : { scale: 1.05 }}
                              whileTap={event.canceled || isEventEnded(event) ? {} : { scale: 0.95 }}
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
                              disabled={event.canceled || isEventEnded(event)}
                              className={`flex-1 bg-white/10 hover:bg-red-600 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-red-400/50 ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
                              whileHover={event.canceled || isEventEnded(event) ? {} : { scale: 1.05 }}
                              whileTap={event.canceled || isEventEnded(event) ? {} : { scale: 0.95 }}
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

      {/* Create Event Modal Component */}
      <CreateGroupEvent
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        groupId={groupId}
        groupTitle={groupTitle}
        onEventCreated={handleEventCreated}
      />

      {/* Cancel Event Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && selectedEvent && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Cancel Event</h3>
                  <p className="text-white/60 text-sm">Cancel &quot;{selectedEvent.title}&quot;</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="cancel-reason" className="block text-white/80 text-sm font-medium mb-2">
                    Reason for cancellation *
                  </label>
                  <select
                    id="cancel-reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-orange-400/50"
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="organizer_unavailable">Organizer unavailable</option>
                    <option value="venue_unavailable">Venue unavailable</option>
                    <option value="low_attendance">Low attendance</option>
                    <option value="weather_conditions">Weather conditions</option>
                    <option value="emergency">Emergency situation</option>
                    <option value="other">Other reason</option>
                  </select>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3">
                  <p className="text-orange-300 text-sm">
                    This will notify all attendees that the event has been cancelled.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedEvent(null);
                    setCancelReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!cancelReason) {
                      showError('Please select a reason for cancellation.');
                      return;
                    }
                    try {
                      await handleCancelEvent(selectedEvent.id);
                      setShowCancelModal(false);
                      setSelectedEvent(null);
                      setCancelReason('');
                    } catch {
                      // Error already handled in handleCancelEvent
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  disabled={!cancelReason}
                >
                  Cancel Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Event Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedEvent && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Delete Event</h3>
                  <p className="text-white/60 text-sm">Delete &quot;{selectedEvent.title}&quot;</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4">
                <p className="text-red-300 text-sm">
                  This action cannot be undone. This will permanently delete the event and remove all associated data.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await handleDeleteEvent(selectedEvent.id);
                      setShowDeleteModal(false);
                      setSelectedEvent(null);
                    } catch {
                      // Error already handled in handleDeleteEvent
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {showEditModal && selectedEvent && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Edit className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Edit Event</h3>
                  <p className="text-white/60 text-sm">Edit &quot;{selectedEvent.title}&quot;</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-location" className="block text-white/80 text-sm font-medium mb-2">
                    Location (optional)
                  </label>
                  <input
                    id="edit-location"
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Enter event location"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                  />
                </div>

                <div>
                  <label htmlFor="edit-date" className="block text-white/80 text-sm font-medium mb-2">
                    Date *
                  </label>
                  <input
                    id="edit-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white focus:outline-none focus:border-blue-400/50"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-time" className="block text-white/80 text-sm font-medium mb-2">
                    Time *
                  </label>
                  <input
                    id="edit-time"
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white focus:outline-none focus:border-blue-400/50"
                    required
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
                  <p className="text-blue-300 text-sm">
                    Only location, date, and time can be edited. Title and description cannot be changed.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    setEditLocation('');
                    setEditDate('');
                    setEditTime('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editDate || !editTime) {
                      showError('Please fill in both date and time.');
                      return;
                    }
                    try {
                      await handleEditEvent(selectedEvent.id);
                    } catch {
                      
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupEventsTab