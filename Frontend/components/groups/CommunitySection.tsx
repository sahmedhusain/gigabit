'use client'
import { useState, useEffect, useCallback } from 'react'
import { Calendar, MapPin, Users, Bell, Activity, Heart, MessageCircle, Plus, Check, X, Trash2, MoreVertical, Edit, EyeOff, ArrowDown, ArrowUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Event, type Notification as NotificationType, api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

interface CommunitySectionProps {
  notifications: NotificationType[]
  isLoadingNotifications: boolean
  setShowCreateEvent: (show: boolean) => void
  communitySubTab: string
  eventsSubTab?: string
  events?: Event[]
  eventsLoading: boolean
  respondToEvent: (eventId: number, option: 'going' | 'not_going') => Promise<{ message: string; response: string; removed: boolean }>
  updateEvent: (eventId: number, eventData: { title?: string; description?: string; event_time?: string }) => Promise<{ message: string }>
  cancelEvent: (eventId: number, cancelReason: string) => Promise<{ message: string }>
  deleteEvent: (eventId: number) => Promise<{ message: string }>
  highlightedEventId?: number | null
}

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
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [hideEndedEvents, setHideEndedEvents] = useState(false)
  const { user } = useAuth()
  const { success, error } = useToast()

  // Sync with events from props
  useEffect(() => {
    setOptimisticEvents(events || [])
  }, [events])

  // Load user group roles
  const loadUserGroupRoles = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.getUserGroups(user.id)
      const userGroups = data.groups || []
      
      // Load user roles for each group
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

  // Close dropdown when clicking outside
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
    
    // Optimistically update the UI immediately
    setOptimisticEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id === eventId) {
          const newEvent = { ...event }
          
          if (isRemovingResponse) {
            // Remove the response
            newEvent.user_response = 'none'
            
            // Decrement the count
            if (option === 'going') {
              newEvent.going_count = Math.max(0, newEvent.going_count - 1)
            } else {
              newEvent.not_going_count = Math.max(0, newEvent.not_going_count - 1)
            }
          } else {
            // Update to new response
            newEvent.user_response = option
            
            // Update counts based on previous and new response
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
      // Real-time updates will sync the state automatically
    } catch (err: unknown) {
      // Revert optimistic update on error
      setOptimisticEvents(events || [])
      const message = err instanceof Error ? err.message : String(err)
      error(message || 'Failed to update response')
    } finally {
      setRespondingToEvent(null)
    }
  }

  // Handle event deletion
  const handleDeleteEvent = async (eventId: number) => {
    try {
      await deleteEvent(eventId)
      success('Event deleted successfully!')
    } catch (err) {
      console.error('Failed to delete event:', err);
      error('Failed to delete event. Please try again.');
    }
  }

  // Handle event cancellation
  const handleCancelEvent = async (eventId: number) => {
    try {
      await cancelEvent(eventId, cancelReason);
      setShowCancelModal(false);
      setSelectedEvent(null);
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel event:', err);
      error('Failed to cancel event. Please try again.');
    }
  }

  // Handle event editing
  const handleEditEvent = async (eventId: number) => {
    try {
      const eventDateTime = new Date(`${editDate}T${editTime}`);
      const eventData: { event_time: string; location: string } = {
        event_time: eventDateTime.toISOString(),
        location: editLocation.trim()
      };

      await updateEvent(eventId, eventData);
      success('Event updated successfully!');
      setShowEditModal(false);
      setSelectedEvent(null);
      setEditLocation('');
      setEditDate('');
      setEditTime('');
    } catch (err) {
      console.error('Failed to update event:', err);
      error('Failed to update event. Please try again.');
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

    // Sort events based on sortBy option
    const sortedEvents = [...optimisticEvents]

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

    // Filter events based on eventsSubTab
    const filteredEvents = sortedEvents.filter(event => {
      // Filter by subTab first
      let matchesSubTab = true
      if (eventsSubTab === 'going') {
        matchesSubTab = event.user_response === 'going'
      } else if (eventsSubTab === 'not-going') {
        matchesSubTab = event.user_response === 'not_going'
      }
      // 'all' shows all events

      // Filter by hideEndedEvents if enabled
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
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            id={`event-${event.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
              ease: "easeOut"
            }}
            className={`group relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer animate-fade-in animate-slide-in-from-bottom ${
              highlightedEventId === event.id 
                ? 'border-emerald-400/60 shadow-emerald-400/30 ring-4 ring-emerald-400/20' 
                : 'border-white/20'
            }`}
            style={{ animationDelay: `${index < 6 ? index * 100 : 500}ms` }}
          >
            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br rounded-3xl transition-opacity duration-300 ${
              highlightedEventId === event.id 
                ? 'from-emerald-500/20 via-teal-500/10 to-emerald-500/20 opacity-100' 
                : 'from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100'
            }`}></div>

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
                  {/* Three-dots menu for event creator or group admins/creators */}
                  {(user && event.group && (event.creator_id === user.id || groupRoles[event.group.id]?.is_admin_or_creator)) && (
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
                            className={`w-full flex items-center space-x-2 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${!isEventEnded(event) ? 'rounded-b-lg' : 'rounded-lg'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Delete Event</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Date & Time */}
                  <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-3 border border-white/10">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-medium">{formatDate(event.event_time)}</p>
                      <p className="text-white/60 text-xs">{formatTime(event.event_time)}</p>
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
                      <p className="text-white/60 text-xs">{event.group.title}</p>
                    </div>
                  </div>
                </div>

                {/* Creator & Time */}
                <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
                  <span>Created by {event.creator.first_name} {event.creator.last_name}</span>
                  <span>{formatTimeAgo(event.created_at)}</span>
                </div>
              </div>

              {/* Right Side - Response Section */}
              <div className="flex flex-col items-end space-y-4 lg:min-w-48">
                {/* Response Counts */}
                <div className="flex items-center space-x-4 bg-white/5 rounded-2xl p-3 border border-white/10 w-full">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/80 text-sm font-medium">{event.going_count}</span>
                    <span className="text-white/60 text-xs">going</span>
                  </div>
                  <div className="flex items-center space-x-2">     
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-white/80 text-sm font-medium">{event.not_going_count}</span>
                    <span className="text-white/60 text-xs">not going</span>
                  </div>
                </div>

                {/* Response Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  {event.user_response === 'going' ? (
                    <button
                      onClick={() => handleEventResponse(event.id, 'going')}
                      disabled={respondingToEvent === event.id || event.canceled || isEventEnded(event)}
                      className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Going</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEventResponse(event.id, 'going')}
                      disabled={respondingToEvent === event.id || event.canceled || isEventEnded(event)}
                      className={`flex-1 bg-white/10 hover:bg-emerald-600 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-emerald-400/50 ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Going</span>
                    </button>
                  )}

                  {event.user_response === 'not_going' ? (
                    <button
                      onClick={() => handleEventResponse(event.id, 'not_going')}
                      disabled={respondingToEvent === event.id || event.canceled || isEventEnded(event)}
                      className={`flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
                    >
                      <X className="w-4 h-4" />
                      <span>Not Going</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEventResponse(event.id, 'not_going')}
                      disabled={respondingToEvent === event.id || event.canceled || isEventEnded(event)}
                      className={`flex-1 bg-white/10 hover:bg-red-600 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-red-400/50 ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
                    >
                      <X className="w-4 h-4" />
                      <span>Not Going</span>
                    </button>
                  )}
                </div>

                {/* Loading indicator */}
                {respondingToEvent === event.id && (
                  <div className="flex items-center space-x-2 text-white/60 text-xs bg-white/5 rounded-2xl px-3 py-2 w-full lg:w-auto justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                    <span>Updating...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-400" />
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-400" />
      case 'follow':
        return <Users className="w-4 h-4 text-emerald-400" />
      case 'event':
        return <Calendar className="w-4 h-4 text-blue-400" />
      default:
        return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  const renderActivityHistory = () => {
    if (isLoadingNotifications) {
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

    // Combine notifications with mock activity data
    const activityItems = [
      ...notifications.map(notification => ({
        id: `notification-${notification.id}`,
        type: notification.type,
        title: notification.message,
        user: notification.user,
        time: notification.time,
        isRead: notification.isRead
      })),
      // Mock additional activity data
      {
        id: 'activity-1',
        type: 'post_created',
        title: 'You created a new post',
        user: 'You',
        time: '2h ago',
        isRead: true
      },
      {
        id: 'activity-2',
        type: 'event_created',
        title: 'You created a new event',
        user: 'You',
        time: '1d ago',
        isRead: true
      }
    ].sort((a, b) => {
      // Sort by time (newest first)
      const timeA = a.time.includes('ago') ? Date.now() : new Date(a.time).getTime()
      const timeB = b.time.includes('ago') ? Date.now() : new Date(b.time).getTime()
      return timeB - timeA
    })

    if (activityItems.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center py-16"
        >
          <Activity className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">No activity history yet</p>
          <p className="text-white/40 text-sm mt-2">Your interactions and activities will appear here</p>
        </motion.div>
      )
    }

    return (
      <div className="space-y-3">
        {activityItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: "easeOut"
            }}
            className={`bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 transition-all ${
              !item.isRead ? 'bg-emerald-500/10 border-emerald-400/30' : 'hover:bg-white/15'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(item.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!item.isRead ? 'text-white font-medium' : 'text-white/80'}`}>
                  {item.title}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-white/60 text-xs">by {item.user}</p>
                  <span className="text-white/50 text-xs">{item.time}</span>
                </div>
              </div>
              
              {!item.isRead && (
                <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-2"></div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
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
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-shrink-0 mb-6"
      >
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-4 hover:shadow-emerald-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Header Icon */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
                  {communitySubTab === 'events' ? (
                    <Calendar className="w-5 h-5 text-white drop-shadow-sm" />
                  ) : (
                    <Activity className="w-5 h-5 text-white drop-shadow-sm" />
                  )}
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>

              {/* Title and Description */}
              <div className="flex-1">
                <h1 className="text-xl lg:text-2xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors duration-300">
                  {communitySubTab === 'events' && (
                    eventsSubTab === 'going' ? 'Going Events' :
                    eventsSubTab === 'not-going' ? 'Not Going Events' :
                    'All Events'
                  )}
                  {communitySubTab === 'activity' && 'Activity History'}
                </h1>
                <p className="text-white/80 text-sm leading-relaxed">
                  {communitySubTab === 'events' && (
                    eventsSubTab === 'going' ? 'Events you\'re attending' :
                    eventsSubTab === 'not-going' ? 'Events you declined' :
                    'Discover and join events'
                  )}
                  {communitySubTab === 'activity' && 'Your recent interactions'}
                </p>
              </div>
            </div>

            {/* Controls Section */}
            {communitySubTab === 'events' && (
              <div className="flex items-center space-x-4">
                {/* Filter Controls */}
                <div className="flex items-center space-x-3">
                  {/* Hide Ended Events Toggle */}
                  <button
                    onClick={() => setHideEndedEvents(!hideEndedEvents)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                      hideEndedEvents
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-emerald-300'
                        : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white/70 hover:text-white'
                    }`}
                    title={hideEndedEvents ? 'Show ended events' : 'Hide ended events'}
                  >
                    <EyeOff className={`w-3 h-3 ${hideEndedEvents ? 'text-emerald-400' : ''}`} />
                    <span className="text-xs font-medium">Hide Ended</span>
                  </button>

                  {/* Sort Toggle */}
                  <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/20">
                    <button
                      onClick={() => setSortBy('newest')}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                        sortBy === 'newest'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span>Newest</span>
                    </button>
                    <button
                      onClick={() => setSortBy('oldest')}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                        sortBy === 'oldest'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span>Oldest</span>
                    </button>
                  </div>
                </div>

                {/* Enhanced Create Event Button */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateEvent(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <Plus className="w-5 h-5 relative z-10" />
                  <span className="font-semibold relative z-10">Create Event</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

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
                  <label htmlFor="cancel-reason-community" className="block text-white/80 text-sm font-medium mb-2">
                    Reason for cancellation *
                  </label>
                  <select
                    id="cancel-reason-community"
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
                      error('Please select a reason for cancellation.');
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
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md"
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
                  <label htmlFor="edit-location-community" className="block text-white/80 text-sm font-medium mb-2">
                    Location (optional)
                  </label>
                  <input
                    id="edit-location-community"
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Enter event location"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                  />
                </div>

                <div>
                  <label htmlFor="edit-date-community" className="block text-white/80 text-sm font-medium mb-2">
                    Date *
                  </label>
                  <input
                    id="edit-date-community"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white focus:outline-none focus:border-blue-400/50"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-time-community" className="block text-white/80 text-sm font-medium mb-2">
                    Time *
                  </label>
                  <input
                    id="edit-time-community"
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
                      error('Please fill in both date and time.');
                      return;
                    }
                    try {
                      await handleEditEvent(selectedEvent.id);
                    } catch {
                      // Error already handled in handleEditEvent
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