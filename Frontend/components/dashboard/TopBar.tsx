'use client'
import { useRouter } from 'next/navigation'
import { Plus, Bell, MessageCircle, User, Home } from 'lucide-react'
import { useNotifications, useRealTimeMessages } from '@/hooks'

interface TopBarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  setShowCreatePost: (show: boolean) => void
  setShowNotifications: (show: boolean) => void
  setShowChat: (show: boolean) => void
  showNotifications: boolean
  showChat: boolean
  notifications: any[]
  currentUser: any
  isOffline: boolean
  isConnected: boolean
  logout: () => void
  setActiveTab?: (tab: string) => void
}

export default function TopBar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setShowCreatePost,
  setShowNotifications,
  setShowChat,
  showNotifications,
  showChat,
  notifications,
  currentUser,
  isOffline,
  isConnected,
  logout,
  setActiveTab
}: TopBarProps) {
  const router = useRouter()
  const { unread: notificationUnread } = useNotifications()
  const { getUnreadCount: getMessagesUnread } = useRealTimeMessages()
  
  const messageUnread = getMessagesUnread()

  return (
    <div className="fixed top-0 left-0 lg:left-64 right-0 h-14 lg:h-16 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/20 z-30">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            title="Open menu"
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <button
            onClick={() => setShowCreatePost(true)}
            className="hidden sm:flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden md:inline">Create</span>
          </button>

          {/* Mobile Create Post */}
          <button
            onClick={() => setShowCreatePost(true)}
            title="Create post"
            className="sm:hidden p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
            {notificationUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                {notificationUnread > 99 ? '99+' : notificationUnread}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            title="Chat"
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
            {messageUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                {messageUnread > 99 ? '99+' : messageUnread}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Connection status indicator */}
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${isOffline ? 'bg-red-500' : isConnected ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                title={
                  isOffline ? 'Offline - No internet connection' :
                    isConnected ? 'Connected to server' :
                      'Connecting...'
                }
              ></div>
              {isOffline && (
                <span className="text-xs text-red-300 hidden sm:inline">Offline</span>
              )}
            </div>
            {/* Avatar dropdown (avatar only, no name) */}
            <div className="relative">
              <button
                aria-label="User menu"
                title="User menu"
                onClick={(e) => {
                  const el = document.getElementById('topbar-user-dropdown')
                  if (el) el.classList.toggle('hidden')
                }}
                className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              >
                {currentUser?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatar} alt="avatar" className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover" />
                ) : (
                  <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                )}
              </button>

              <div id="topbar-user-dropdown" className="hidden absolute right-0 mt-2 w-44 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl py-2 z-50">
                <button
                  onClick={() => {
                    const el = document.getElementById('topbar-user-dropdown')
                    if (el) el.classList.add('hidden')
                    if (setActiveTab) {
                      setActiveTab('profile')
                      return
                    }
                    router.push(`/profile/${currentUser?.id || ''}`)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                  title="My Profile"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('topbar-user-dropdown')
                    if (el) el.classList.add('hidden')
                    if (setActiveTab) {
                      setActiveTab('settings')
                      return
                    }
                    router.push('/settings')
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                  title="Settings"
                >
                  Settings
                </button>
                <button
                  onClick={() => logout()}
                  title="Logout"
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
