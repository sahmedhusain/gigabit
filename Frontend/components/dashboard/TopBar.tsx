'use client'

import { Menu, X, Bell, MessageCircle, Search } from 'lucide-react'


interface TopBarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  showNotifications: boolean
  setShowNotifications: () => void
  unreadCount: number
  onChatClick: () => void
  onSearchClick: () => void
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
  onChatClick,
  onSearchClick,
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

        

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Search Button */}
          <button
            onClick={onSearchClick}
            className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'search'
                ? 'bg-white text-emerald-600 shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            type='button'
            title="Search"
          >
            <Search className="w-5 h-5" />
            <span className="hidden md:inline font-medium">Search</span>
          </button>

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
                {unreadCount > 9 ? '9+' : unreadChatsCount}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-2 lg:space-x-3">
            
            
          </div>
        </div>
      </div>
    </header>
  )
}
