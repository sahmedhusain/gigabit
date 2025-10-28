'use client'
import { useState, useMemo } from 'react'
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertCircle,
  Clock,
  Filter,
  ArrowUpDown,
  Eye,
  X
} from 'lucide-react'
import Image from 'next/image'
import { useNotifications } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'
import { NotificationFilters } from '@/types/notifications'
import { NotificationResponse } from '@/types/notification-data'
import { useToast } from '@/context/ToastContext'


function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}

function getNotificationDisplayInfo(notification: NotificationResponse) {
  // Priority: Group avatar > User avatar > Initials
  let avatar: string | null = null
  let initials: string = ''
  let displayName: string = ''
  let isGroupNotification = false

  // Check if this is a group-related notification
  const groupRelatedTypes = [
    'group_invite', 'join_request', 'join_accepted', 'group_post', 
    'event_created', 'new_poll', 'group_message', 'post_shared', 'image_shared'
  ]
  isGroupNotification = groupRelatedTypes.includes(notification.type) || 
                       (notification.group !== undefined && notification.group !== null)

  if (isGroupNotification && notification.group?.avatar) {
    // Use group avatar
    avatar = notification.group.avatar.startsWith('http') 
      ? notification.group.avatar 
      : notification.group.avatar.startsWith('/avatars/')
      ? notification.group.avatar
      : `http://localhost:8080/api/uploads/${notification.group.avatar}`
    initials = notification.group.title.substring(0, 2).toUpperCase()
    displayName = notification.group.title
  } else if (notification.actor?.avatar) {
    // Use user avatar
    avatar = notification.actor.avatar.startsWith('http') 
      ? notification.actor.avatar 
      : notification.actor.avatar.startsWith('/avatars/')
      ? notification.actor.avatar
      : `http://localhost:8080/api/uploads/${notification.actor.avatar}`
    initials = `${notification.actor.first_name.charAt(0)}${notification.actor.last_name.charAt(0)}`.toUpperCase()
    displayName = `${notification.actor.first_name} ${notification.actor.last_name}`
  } else {
    // Fallback to initials
    initials = `${notification.actor?.first_name?.charAt(0) || '?'}${notification.actor?.last_name?.charAt(0) || '?'}`.toUpperCase()
    displayName = notification.actor ? `${notification.actor.first_name} ${notification.actor.last_name}` : 'Unknown User'
  }

  return { avatar, initials, displayName, isGroupNotification }
}

export default function NotificationsPage() {
  const {
    items: notifications,
    unread,
    loading,
    loadingMore,
    hasMore,
    error,
    markAsRead,
    deleteNotification,
    markAllAsReadLocal,
    refetch,
    loadMore
  } = useNotifications()

  const { success } = useToast()

  const [filters, setFilters] = useState<NotificationFilters>({
    type: 'all',
    sortBy: 'newest'
  })
  const handleClearAll = () => {
    const count = notifications.length
    // Delete all notifications without individual toasts
    notifications.forEach(notification => {
      deleteNotification(notification.id, false)
    })
    // Show single toast notification
    success(`Cleared ${count} notification${count !== 1 ? 's' : ''}`)
  }

  const router = useRouter()

  
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // Filter by type
    if (filters.type !== 'all') {
      const typeGroups: Record<string, string[]> = {
        social: ['follow_request', 'follow_accepted'],
        groups: ['group_invite', 'join_request', 'join_accepted', 'group_post'],
        events: ['event_created', 'event_reminder', 'event_response'],
        posts: ['post_liked', 'post_commented', 'image_shared', 'post_shared'],
        messages: ['message'],
        polls: ['new_poll', 'poll_voted']
      }
      
      filtered = filtered.filter(n => typeGroups[filters.type]?.includes(n.type))
    }

    // Sort by newest/oldest
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return filters.sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [notifications, filters])
  if (loading) {
    return (
      <div className="flex-1 min-w-0 max-h-screen overflow-hidden">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
          {}
          <div className="flex-shrink-0 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <Bell className="w-8 h-8 text-emerald-400 mr-3" />
                  Notifications
                </h1>
                <p className="text-white/70 mt-2">
                  Stay updated with your latest activities
                </p>
              </div>
            </div>

            {}
            <div className="relative mt-4">
              <div className="w-full h-12 bg-white/10 rounded-xl animate-pulse"></div>
            </div>
          </div>
          
          {}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/20 rounded w-3/4"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 max-h-screen overflow-hidden">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Bell className="w-8 h-8 text-emerald-400 mr-3" />
                Notifications
                {unread > 0 && (
                  <span className="ml-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {unread}
                  </span>
                )}
              </h1>
              <p className="text-white/70 mt-2">
                Stay updated with your latest activities
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllAsReadLocal}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-300"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="font-medium">Mark All Read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                  <span className="font-medium">Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mt-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-4 h-4" />
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as NotificationFilters['type'] }))}
                className="pl-9 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 backdrop-blur-sm text-sm font-medium"
                aria-label="Filter by type"
              >
                <option value="all" className="bg-gray-800">All Types</option>
                <option value="social" className="bg-gray-800">Social</option>
                <option value="groups" className="bg-gray-800">Groups</option>
                <option value="events" className="bg-gray-800">Events</option>
                <option value="posts" className="bg-gray-800">Posts</option>
                <option value="messages" className="bg-gray-800">Messages</option>
                <option value="polls" className="bg-gray-800">Polls</option>
              </select>
            </div>

            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-4 h-4" />
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as NotificationFilters['sortBy'] }))}
                className="pl-9 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 backdrop-blur-sm text-sm font-medium"
                aria-label="Sort by"
              >
                <option value="newest" className="bg-gray-800">Newest</option>
                <option value="oldest" className="bg-gray-800">Oldest</option>
              </select>
            </div>
          </div>


        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
              <p className="text-white/70 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No notifications found</h3>
              <p className="text-white/70 mb-6 max-w-md mx-auto">
                No notifications match the selected filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer ${
                    !notification.is_read ? 'border-emerald-500/30 bg-emerald-500/5' : ''
                  }`}
                  onClick={() => {
                    // Use backend-provided redirect URL and type
                    if (notification.redirect_url) {
                      router.push(notification.redirect_url);
                    } else {
                      // Minimal fallback for edge cases where redirect_url is not set
                      console.warn('Notification missing redirect_url:', notification);
                      router.push(`/profile/${notification.actor.id}`);
                    }
                    
                    // Mark as read if not already read
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {(() => {
                        const { avatar, initials, displayName, isGroupNotification } = getNotificationDisplayInfo(notification)
                        return avatar ? (
                          <Image
                            src={avatar}
                            alt={`${displayName} avatar`}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full border-2 border-emerald-500/30 object-cover"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold text-sm ${
                            isGroupNotification 
                              ? 'bg-gradient-to-br from-orange-500 to-red-500 border-orange-500/30'
                              : 'bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-500/30'
                          }`}>
                            {initials}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium leading-relaxed">
                            {(() => {
                              const { displayName, isGroupNotification } = getNotificationDisplayInfo(notification)
                              return (
                                <>
                                  <span 
                                    className={`font-semibold cursor-pointer hover:opacity-80 transition-colors duration-200 ${
                                      isGroupNotification ? 'text-orange-400' : 'text-emerald-400'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isGroupNotification && notification.group) {
                                        router.push(`/chats/all?group=${notification.group.id}`)
                                      } else {
                                        router.push(`/profile/${notification.actor.id}`)
                                      }
                                    }}
                                  >
                                    {displayName}
                                  </span>{' '}
                                  {notification.message}
                                </>
                              )
                            })()}
                          </p>
                          <div className="flex items-center space-x-3 mt-2 text-sm text-white/50">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(notification.created_at)}</span>
                            </div>
                            {!notification.is_read && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                <span className="text-emerald-400 font-medium">New</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300 text-sm font-medium"
                              title="Mark as read"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Read</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-300 text-sm font-medium"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Additional metadata for certain notification types */}
                      {(notification.type === 'event_invite' || notification.type === 'group_invite') && (
                        <div className="mt-3 flex gap-2">
                          <button className="px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-lg text-sm border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-300">
                            Accept
                          </button>
                          <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30 hover:bg-red-500/30 transition-all duration-300">
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && !loading && filteredNotifications.length > 0 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span>Loading...</span>
                      </span>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
