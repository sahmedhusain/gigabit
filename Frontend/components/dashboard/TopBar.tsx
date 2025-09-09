'use client'

import { Menu, X, Bell, MessageCircle, Search, Users, Calendar, UserCheck, Hash, Filter, FileText, User, ChevronDown } from 'lucide-react'
import { Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'


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
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const handleLogoClick = () => {
    router.push('/')
  }

  const searchFilters = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'users', label: 'Users', icon: User },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'tags', label: 'Tags', icon: Hash }
  ]

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId)
    setShowFilterDropdown(false)
    // Here you can implement the actual search logic
    console.log(`Searching for "${searchQuery}" in ${filterId}`)
  }

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown)
  }

  return (
    <header className="topbar-layout bg-gradient-to-r from-white/20 via-white/10 to-white/5 backdrop-blur-xl border-b border-white/40 shadow-2xl">
      <div className="grid grid-cols-3 items-center h-full px-6 py-3 gap-4">
        {/* Logo/Title - Hidden on mobile when sidebar is open */}
        <div className={`flex items-center space-x-3 transition-all duration-300 hover:scale-105 cursor-pointer justify-start ${
          isMobileMenuOpen ? 'lg:opacity-100 opacity-0' : 'opacity-100'
        }`} onClick={handleLogoClick}>
            <img
              src="/logo.png"
              alt="Gigabit Logo"
              className="w-10 h-8 drop-shadow-xl hover:drop-shadow-2xl transition-all duration-300"
            />
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: '700',
                color: 'white',
                fontSize: { xs: '1.5rem', lg: '1.75rem' },
                letterSpacing: '2px',
                fontFamily: '"Courier New", "Consolas", "Monaco", "Menlo", monospace',
                textTransform: 'capitalize',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1.1,
                marginTop: '1px',
                minWidth: '120px',
                textAlign: 'center',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-3px',
                  left: '0',
                  width: '100%',
                  height: '3px',
                  background: 'linear-gradient(90deg, #38bdf8, #06b6d4, #0891b2, #0e7490)',
                  borderRadius: '2px',
                  opacity: 0.95,
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)',
                }
              }}
            >
              Gigabit
            </Typography>
          </div>

        {/* Center Search Bar */}
        <div className="flex justify-center relative">
          <div className="relative max-w-2xl w-full">
            <div className="flex items-center bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl transition-all duration-300 focus-within:border-white/50 focus-within:bg-white/15">
              <div className="flex items-center flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 bg-transparent text-white placeholder-white/60 focus:outline-none"
                />
              </div>
              
              {/* Filter Dropdown Button */}
              <div className="relative">
                <button
                  onClick={toggleFilterDropdown}
                  className="flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white transition-all duration-200 border-l border-white/20"
                >
                  {(() => {
                    const currentFilter = searchFilters.find(f => f.id === selectedFilter)
                    if (!currentFilter) return null
                    const IconComponent = currentFilter.icon
                    return (
                      <>
                        <IconComponent className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm font-medium">{currentFilter.label}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                      </>
                    )
                  })()}
                </button>
                
                {/* Filter Dropdown */}
                {showFilterDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden z-50">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Search Filters</div>
                      {searchFilters.map((filter) => {
                        const IconComponent = filter.icon
                        const isSelected = selectedFilter === filter.id
                        return (
                          <button
                            key={filter.id}
                            onClick={() => handleFilterSelect(filter.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                              isSelected
                                ? 'bg-blue-100 text-blue-700 font-semibold'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span className="text-sm">{filter.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4 justify-end">
          {/* Notifications Button - Icon Only */}
          <button
            onClick={setShowNotifications}
            className={`relative p-2 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              showNotifications
                ? 'bg-gradient-to-r from-white to-blue-50 text-emerald-600 shadow-2xl border-2 border-white/40'
                : 'text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-md border-2 border-white/30 hover:border-white/50'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-xl border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Chats Button */}
          <button
            onClick={onChatClick}
            className={`relative flex items-center space-x-2 px-3 py-2 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'chats'
                ? 'bg-gradient-to-r from-white to-blue-50 text-emerald-600 shadow-2xl border-2 border-white/40'
                : 'text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-md border-2 border-white/30 hover:border-white/50'
            }`}
            type='button'
            title="Chats"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline font-semibold text-sm">Chats</span>
            {unreadChatsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-xl border-2 border-white">
                {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-3 lg:space-x-4">
            
            
          </div>
        </div>
      </div>
    </header>
  )
}
