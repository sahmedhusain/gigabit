'use client'

import { Menu, X, Bell, MessageCircle, Search } from 'lucide-react'
import { Typography } from '@mui/material'


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
        {/* Logo/Title - Hidden on mobile when sidebar is open */}
        <div className={`flex items-center space-x-2 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'lg:opacity-100 opacity-0' : 'opacity-100'
        }`}>
            <img
              src="/logo.png"
              alt="Gigabit Logo"
              className="w-12 h-10"
            />
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 25%, #bae6fd 50%, #7dd3fc 75%, #38bdf8 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(56, 189, 248, 0.3), 0 2px 8px rgba(0,0,0,0.2)',
                fontSize: { xs: '1.5rem', lg: '1.8rem' },
                letterSpacing: '1px',
                fontFamily: '"Montserrat", "Poppins", "SF Pro Display", "Segoe UI", sans-serif',
                textTransform: 'capitalize',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1.1,
                marginTop: '1px',
                filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.2))',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-3px',
                  left: '0',
                  width: '100%',
                  height: '3px',
                  background: 'linear-gradient(90deg, #38bdf8, #06b6d4, #0891b2, #0e7490)',
                  borderRadius: '2px',
                  opacity: 0.9,
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                }
              }}
            >
              Gigabit
            </Typography>
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
