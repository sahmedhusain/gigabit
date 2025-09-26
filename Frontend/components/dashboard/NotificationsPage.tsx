'use client'
import { useState, useMemo } from 'react'
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  Users, 
  Calendar, 
  UserPlus, 
  Mail, 
  Check, 
  CheckCheck, 
  Trash2, 
  Search, 
  AlertCircle,
  Clock
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

// Utility function for formatting time
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

interface NotificationFilters {
  timeframe: 'all' | 'today' | 'week' | 'month'
}

export default function NotificationsPage() {
  const {
    items: notifications,
    unread,
    loading,
    error,
    markAsRead,
    deleteNotification,
    markAllAsReadLocal,
    refetch
  } = useNotifications()

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<NotificationFilters>({
    timeframe: 'all'
  })
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set())

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // Filter by timeframe
    if (filters.timeframe !== 'all') {
      const now = new Date()
      const filterTime = new Date()
      
      if (filters.timeframe === 'today') {
        filterTime.setHours(0, 0, 0, 0)
      } else if (filters.timeframe === 'week') {
        filterTime.setDate(now.getDate() - 7)
      } else if (filters.timeframe === 'month') {
        filterTime.setMonth(now.getMonth() - 1)
      }
      
      filtered = filtered.filter(n => new Date(n.created_at) >= filterTime)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${n.actor.first_name} ${n.actor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [notifications, filters, searchTerm])

  // Get notification icon and color based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-400" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-400" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-emerald-400" />
      case 'event_invite':
      case 'event_reminder':
        return <Calendar className="w-5 h-5 text-purple-400" />
      case 'message':
        return <Mail className="w-5 h-5 text-cyan-400" />
      case 'group_invite':
      case 'group_join':
        return <Users className="w-5 h-5 text-orange-400" />
      default:
        return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const handleBulkMarkAsRead = () => {
    selectedNotifications.forEach(id => markAsRead(id))
    setSelectedNotifications(new Set())
  }

  const handleBulkDelete = () => {
    selectedNotifications.forEach(id => deleteNotification(id))
    setSelectedNotifications(new Set())
  }

  if (loading) {
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
                </h1>
                <p className="text-white/70 mt-2">
                  Stay updated with your latest activities
                </p>
              </div>
            </div>

            {/* Search Bar Skeleton */}
            <div className="relative mt-4">
              <div className="w-full h-12 bg-white/10 rounded-xl animate-pulse"></div>
            </div>
          </div>
          
          {/* Content Skeleton */}
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
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filters.timeframe}
                onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value as NotificationFilters['timeframe'] }))}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 backdrop-blur-sm min-w-[120px]"
                aria-label="Filter by timeframe"
              >
                <option value="all" className="bg-gray-800">All Time</option>
                <option value="today" className="bg-gray-800">Today</option>
                <option value="week" className="bg-gray-800">This Week</option>
                <option value="month" className="bg-gray-800">This Month</option>
              </select>

              {selectedNotifications.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkMarkAsRead}
                    className="flex items-center space-x-2 px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-300"
                    aria-label="Mark selected notifications as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center space-x-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                    aria-label="Delete selected notifications"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-white/70">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  <span className="text-sm">Select All ({filteredNotifications.length})</span>
                </label>
                {selectedNotifications.size > 0 && (
                  <span className="text-sm text-emerald-400 font-medium">
                    {selectedNotifications.size} selected
                  </span>
                )}
              </div>
              
              <div className="text-sm text-white/50">
                {filteredNotifications.length} of {notifications.length} notifications
              </div>
            </div>
          )}
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
                {searchTerm 
                  ? `No notifications found matching "${searchTerm}"`
                  : 'No notifications match the selected filters'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300 ${
                    !notification.is_read ? 'border-emerald-500/30 bg-emerald-500/5' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedNotifications)
                          if (e.target.checked) {
                            newSelected.add(notification.id)
                          } else {
                            newSelected.delete(notification.id)
                          }
                          setSelectedNotifications(newSelected)
                        }}
                        className="rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-500/50"
                        aria-label={`Select notification from ${notification.actor.first_name} ${notification.actor.last_name}`}
                      />
                    </div>

                    {/* Notification Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium leading-relaxed">
                            <span className="text-emerald-400 font-semibold">
                              {notification.actor.first_name} {notification.actor.last_name}
                            </span>{' '}
                            {notification.message}
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
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-white/50 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all duration-300"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
