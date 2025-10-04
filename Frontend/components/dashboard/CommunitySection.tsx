'use client'
import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Users, Bell, Activity, Heart, MessageCircle, Plus, Check, X, ArrowUpDown } from 'lucide-react'
import { Event, type Notification as NotificationType, api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'

interface CommunitySectionProps {
  events: Event[]
  onEventsUpdate: () => void
  isLoadingEvents: boolean
  notifications: NotificationType[]
  isLoadingNotifications: boolean
  showCreateEvent: boolean
  setShowCreateEvent: (show: boolean) => void
  onEventRespond?: (eventId: number, option: 'going' | 'not_going') => Promise<any>
  communitySubTab: string
  eventsSubTab?: string
}

export default function CommunitySection({
  events,
  onEventsUpdate,
  isLoadingEvents,
  notifications,
  isLoadingNotifications,
  showCreateEvent,
  setShowCreateEvent,
  onEventRespond,
  communitySubTab,
  eventsSubTab = 'all'
}: CommunitySectionProps) {
  const [respondingToEvent, setRespondingToEvent] = useState<number | null>(null)
  const [optimisticEvents, setOptimisticEvents] = useState<Event[]>(events)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const { success, error } = useToast()

  // Sync optimistic events with props
  useEffect(() => {
    setOptimisticEvents(events)
  }, [events])

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
      if (onEventRespond) {
        await onEventRespond(eventId, option)
      } else {
        const res = await api.respondToEvent(eventId, option)
        if (res.removed) {
          success('Response removed')
        } else {
          success(`Marked as ${option === 'going' ? 'Going' : 'Not Going'}`)
        }
      }
      // Real-time updates will sync the state, no need to call onEventsUpdate
    } catch (err: any) {
      // Revert optimistic update on error
      setOptimisticEvents(events)
      error(err.message || 'Failed to update response')
    } finally {
      setRespondingToEvent(null)
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

  const renderEvents = () => {
    if (isLoadingEvents) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )
    }

    // Sort events based on sortBy option
    let sortedEvents = [...optimisticEvents]

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
      if (eventsSubTab === 'going') {
        return event.user_response === 'going'
      } else if (eventsSubTab === 'not-going') {
        return event.user_response === 'not_going'
      }
      return true // 'all' shows all events
    })

    if (filteredEvents.length === 0) {
      return (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">No events found</p>
          <p className="text-white/40 text-sm mt-2">
            {eventsSubTab === 'going' && 'You haven\'t marked any events as going yet'}
            {eventsSubTab === 'not-going' && 'You haven\'t marked any events as not going yet'}
            {eventsSubTab === 'all' && 'Create or join events to see them here'}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="group relative bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-xl mb-2 group-hover:text-emerald-200 transition-colors duration-200">{event.title}</h3>
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
                      <p className="text-white/90 text-sm font-medium">{formatDate(event.event_time)}</p>
                      <p className="text-white/60 text-xs">{formatTime(event.event_time)}</p>
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

                  {/* Group */}
                  <div className="flex items-center space-x-3 bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-400" />
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
                <div className="flex items-center space-x-4 bg-white/5 rounded-lg p-3 border border-white/10 w-full lg:w-auto">
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
                      disabled={respondingToEvent === event.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg"
                    >
                      <Check className="w-4 h-4" />
                      <span>Going</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEventResponse(event.id, 'going')}
                      disabled={respondingToEvent === event.id}
                      className="flex-1 bg-white/10 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-emerald-400/50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Going</span>
                    </button>
                  )}

                  {event.user_response === 'not_going' ? (
                    <button
                      onClick={() => handleEventResponse(event.id, 'not_going')}
                      disabled={respondingToEvent === event.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                      <span>Not Going</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEventResponse(event.id, 'not_going')}
                      disabled={respondingToEvent === event.id}
                      className="flex-1 bg-white/10 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-red-400/50"
                    >
                      <X className="w-4 h-4" />
                      <span>Not Going</span>
                    </button>
                  )}
                </div>

                {/* Loading indicator */}
                {respondingToEvent === event.id && (
                  <div className="flex items-center space-x-2 text-white/60 text-xs bg-white/5 rounded-lg px-3 py-2 w-full lg:w-auto justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                    <span>Updating...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
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
        return <Calendar className="w-4 h-4 text-purple-400" />
      default:
        return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  const renderActivityHistory = () => {
    if (isLoadingNotifications) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
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
        <div className="text-center py-16">
          <Activity className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">No activity history yet</p>
          <p className="text-white/40 text-sm mt-2">Your interactions and activities will appear here</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {activityItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 transition-all ${
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
          </div>
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
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {communitySubTab === 'events' && (
              eventsSubTab === 'going' ? 'Events You\'re Going To' :
              eventsSubTab === 'not-going' ? 'Events You\'re Not Going To' :
              'Events'
            )}
            {communitySubTab === 'activity' && 'Activity History'}
          </h1>
          <p className="text-white/70">
            {communitySubTab === 'events' && (
              eventsSubTab === 'going' ? 'Events you\'ve marked as going' :
              eventsSubTab === 'not-going' ? 'Events you\'ve marked as not going' :
              'Upcoming events in your network'
            )}
            {communitySubTab === 'activity' && 'Your recent activity and notifications'}
          </p>
        </div>
        {communitySubTab === 'events' && (
          <div className="flex items-center space-x-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 appearance-none pr-8"
                title="Sort events"
              >
                <option value="newest" className="bg-gray-800 text-white">Newest First</option>
                <option value="oldest" className="bg-gray-800 text-white">Oldest First</option>
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
            </div>

            {/* Note: CreateGeneralEvent component will check admin/creator permissions internally */}
            <button 
              onClick={() => setShowCreateEvent(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}