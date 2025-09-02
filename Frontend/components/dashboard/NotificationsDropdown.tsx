'use client'
import { useState } from 'react'
import { Check, X, Bell, Users, Calendar, MessageCircle, Heart, UserPlus, Trash2, Settings, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { User } from '../../lib/api'
import NotificationSettingsModal from './NotificationSettingsModal'
import { useNotifications, useConnectionStatus } from '@/hooks'

interface NotificationsDropdownProps {
  show: boolean
  onClose: () => void
}

export default function NotificationsDropdown({ show, onClose }: NotificationsDropdownProps) {
  const [showSettings, setShowSettings] = useState(false)
  const { user } = useAuth()
  
  // Enhanced notifications hook with real-time capabilities
  const { 
    items: notifications, 
    unread: unreadCount,
    loading: isLoading,
    error,
    markAsRead, 
    markAllAsReadLocal: markAllAsRead,
    deleteNotification,
    isConnected: notificationsConnected,
    refetch: refreshNotifications 
  } = useNotifications()
  
  // Connection status monitoring
  const { 
    isConnected, 
    connectionQuality, 
    statusMessage 
  } = useConnectionStatus()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow_request':
      case 'follow_accepted':
        return <UserPlus className="w-4 h-4 text-blue-400" />
      case 'group_invite':
      case 'join_request':
      case 'join_accepted':
        return <Users className="w-4 h-4 text-green-400" />
      case 'event_created':
        return <Calendar className="w-4 h-4 text-purple-400" />
      case 'new_message':
        return <MessageCircle className="w-4 h-4 text-blue-400" />
      case 'post_liked':
      case 'group_post_liked':
        return <Heart className="w-4 h-4 text-red-400" />
      case 'post_commented':
        return <MessageCircle className="w-4 h-4 text-orange-400" />
      case 'group_post':
        return <Users className="w-4 h-4 text-indigo-400" />
      default:
        return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  if (!show) return null

  return (
    <div className="fixed top-14 lg:top-16 right-2 lg:right-6 w-80 sm:w-96 max-h-96 lg:max-h-[32rem] overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-slate-700/50 shadow-2xl z-50">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
            {/* Connection status indicator */}
            <div className={`w-2 h-2 rounded-full ml-2 ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`} title={`WebSocket ${isConnected ? 'Connected' : 'Disconnected'}`} />
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Notification settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                disabled={!isConnected}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Connection warning */}
        {!isConnected && (
          <div className="mt-2 flex items-center gap-2 text-orange-400 text-xs">
            <WifiOff className="w-3 h-3" />
            <span>Notifications may be delayed - connection issues</span>
          </div>
        )}
        
        {connectionQuality === 'poor' && isConnected && (
          <div className="mt-2 flex items-center gap-2 text-yellow-400 text-xs">
            <Wifi className="w-3 h-3" />
            <span>Poor connection - real-time updates may be slow</span>
          </div>
        )}
      </div>

      <div className="max-h-80 lg:max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8 px-4">
            <p className="text-sm">{error}</p>
            <button
              onClick={refreshNotifications}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-slate-400 py-12 px-4">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">We'll notify you when something happens!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-700/20 transition-colors ${!notification.is_read ? 'bg-emerald-500/5 border-l-2 border-emerald-400' : ''
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {notification.type}
                        </p>
                        <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-slate-500 text-xs mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors p-1"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors p-1"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Action buttons for specific notification types */}
                    {notification.type === 'follow_request' && (
                      <div className="flex gap-2 mt-3">
                        <button className="px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors">
                          Accept
                        </button>
                        <button className="px-3 py-1 bg-slate-600 text-white text-xs rounded-lg hover:bg-slate-700 transition-colors">
                          Decline
                        </button>
                      </div>
                    )}

                    {notification.type === 'group_invite' && (
                      <div className="flex gap-2 mt-3">
                        <button className="px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors">
                          Accept
                        </button>
                        <button className="px-3 py-1 bg-slate-600 text-white text-xs rounded-lg hover:bg-slate-700 transition-colors">
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

      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/50">
          <button
            onClick={refreshNotifications}
            className="w-full text-center text-slate-400 hover:text-white text-sm transition-colors"
          >
            Refresh notifications
          </button>
        </div>
      )}

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}
