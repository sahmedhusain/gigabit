'use client'
import { Search, Plus, Bell, MessageCircle, User, X, Home } from 'lucide-react'

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
  isConnected
}: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 lg:left-64 right-0 h-14 lg:h-16 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/20 z-30">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <Home className="w-5 h-5" />
          </button>
          
          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 w-40 sm:w-60 lg:w-80 text-sm lg:text-base"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Mobile Search */}
          <button
            className="sm:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            title="Open search"
          >
            <Search className="w-5 h-5" />
          </button>
          
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
            className="sm:hidden p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 lg:w-3 lg:h-3 bg-red-500 rounded-full"></span>
            )}
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Connection status indicator */}
            <div className="flex items-center space-x-1">
              <div 
                className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${
                  isOffline ? 'bg-red-500' : isConnected ? 'bg-green-500' : 'bg-yellow-500'
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
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </div>
            <span className="hidden md:inline text-white font-medium text-sm lg:text-base">{currentUser?.name || 'User'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
