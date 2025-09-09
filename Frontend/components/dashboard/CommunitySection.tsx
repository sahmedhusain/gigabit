'use client'
import { useState } from 'react'
import { Calendar, Clock, MapPin, Users, Bell, Activity, Heart, MessageCircle, Plus, Check, X } from 'lucide-react'
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
  communitySubTab
}: CommunitySectionProps) {
  const [respondingToEvent, setRespondingToEvent] = useState<number | null>(null)
  const { success, error } = useToast()

  const handleEventResponse = async (eventId: number, option: 'going' | 'not_going') => {
    try {
      setRespondingToEvent(eventId)
      if (onEventRespond) {
        await onEventRespond(eventId, option)
      } else {
        await api.respondToEvent(eventId, option)
        success(`Marked as ${option === 'going' ? 'Going' : 'Not Going'}`)
        onEventsUpdate() // Refresh events to show updated counts
      }
    } catch (err: any) {
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

    if (events.length === 0) {
      return (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">No events found</p>
          <p className="text-white/40 text-sm mt-2">Create or join events to see them here</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-2">{event.title}</h3>
                <p className="text-white/70 mb-3">{event.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.event_time)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(event.event_time)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.group.title}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-3">
                {/* Response Counts */}
                <div className="flex items-center space-x-4 text-white/60 text-sm">
                  <div className="flex items-center space-x-1">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{event.going_count} going</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <X className="w-4 h-4 text-red-400" />
                    <span>{event.not_going_count} not going</span>
                  </div>
                </div>
                
                {/* Response Buttons */}
                <div className="flex space-x-2">
                  {event.user_response === 'going' ? (
                    <button
                      onClick={() => handleEventResponse(event.id, 'not_going')}
                      disabled={respondingToEvent === event.id}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center space-x-1 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Going</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEventResponse(event.id, 'going')}
                      disabled={respondingToEvent === event.id}
                      className="bg-white/20 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center space-x-1 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Going</span>
                    </button>
                  )}
                  
                  {event.user_response === 'not_going' ? (
                    <button
                      onClick={() => handleEventResponse(event.id, 'going')}
                      disabled={respondingToEvent === event.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center space-x-1 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Not Going</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEventResponse(event.id, 'not_going')}
                      disabled={respondingToEvent === event.id}
                      className="bg-white/20 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center space-x-1 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Not Going</span>
                    </button>
                  )}
                </div>
                
                {/* Loading indicator */}
                {respondingToEvent === event.id && (
                  <div className="text-white/60 text-xs flex items-center space-x-1">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {communitySubTab === 'events' && 'Events'}
            {communitySubTab === 'activity' && 'Activity History'}
          </h1>
          <p className="text-white/70">
            {communitySubTab === 'events' && 'Upcoming events in your network'}
            {communitySubTab === 'activity' && 'Your recent activity and notifications'}
          </p>
        </div>
        {communitySubTab === 'events' && (
          <button 
            onClick={() => setShowCreateEvent(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-96">
        {renderContent()}
      </div>
    </div>
  )
}