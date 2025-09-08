'use client'
import { useRef, useEffect } from 'react'
import { Menu, X, Bell, Settings, LogOut, User, WifiOff, Wifi, MessageCircle } from 'lucide-react'
import { getAvatarUrl } from '@/utils/avatarUtils'

interface TopBarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  showNotifications: boolean
  setShowNotifications: () => void
  unreadCount: number
  isOffline: boolean
  isConnected: boolean
  currentUser: {
    id: number
    name: string
    username: string
    avatar?: string
    isPrivate: boolean
    followers: number
    following: number
  } | null
  onChatClick: () => void
  unreadChatsCount?: number
}

export default function TopBar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  setActiveTab,
  showNotifications,
  setShowNotifications,
  unreadCount,
  isOffline,
  isConnected,
  currentUser,
  onChatClick,
  unreadChatsCount = 3
}: TopBarProps) {
  return (
    <header className="topbar-layout bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Mobile Menu Toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo/Title - Hidden on mobile when sidebar is open */}
          <div className={`flex items-center space-x-2 transition-opacity duration-300 ${
            isMobileMenuOpen ? 'lg:opacity-100 opacity-0' : 'opacity-100'
          }`}>
            <h1 className="text-xl font-bold text-white lg:text-2xl">SocialConnect</h1>
          </div>
        </div>

        {/* Center - Connection Status only */}
        <div className="hidden md:flex items-center space-x-2">
          {isOffline ? (
            <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Offline</span>
            </div>
          ) : !isConnected ? (
            <div className="flex items-center space-x-2 text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications Button */}
          <button
            onClick={setShowNotifications}
            className={`relative p-2 rounded-lg transition-all duration-200 ${
              showNotifications
                ? 'bg-white text-emerald-600 shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Chats Button */}
          <button
            onClick={onChatClick}
            className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'chats'
                ? 'bg-white text-emerald-600 shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            type='button'
            title="Chats"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden md:inline font-medium">Chats</span>
            {unreadChatsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
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
                {getAvatarUrl(currentUser?.avatar) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getAvatarUrl(currentUser?.avatar)!} alt="avatar" className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover" />
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
    </header>
  )
}
