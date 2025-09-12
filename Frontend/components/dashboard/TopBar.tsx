'use client'

import { Menu, X, Bell, MessageCircle, Search, Users, Calendar, UserCheck, Hash, Filter, FileText, User, ChevronDown, Compass } from 'lucide-react'
import { useState } from 'react'


interface TopBarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  onNotificationsClick: () => void
  unreadCount: number
  onSearchClick: () => void
  onDiscoverClick: () => void
}

export default function TopBar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  setActiveTab,
  onNotificationsClick,
  unreadCount,
  onSearchClick,
  onDiscoverClick,
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

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
        <header className="topbar-layout">
      <div className="flex items-center justify-between h-16 px-4">
  {/* Left section: Menu button (mobile) */}
  <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Center Search Bar with adjacent buttons */}
  <div className="flex justify-center items-center space-x-3">
          <div className="relative max-w-2xl w-full">
            <div className="flex items-center border-2 border-white/30 rounded-2xl transition-all duration-300 focus-within:border-white/50">
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
              <div>
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
              </div>
            </div>
            {/* Filter Dropdown (Full width, glass/blur) */}
            {showFilterDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50">
                <div className="p-2">
                  <div className="text-xs font-semibold text-white/80 mb-2 px-2">Search Filters</div>
                  {searchFilters.map((filter) => {
                    const IconComponent = filter.icon
                    const isSelected = selectedFilter === filter.id
                    return (
                      <button
                        key={filter.id}
                        onClick={() => handleFilterSelect(filter.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
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

          {/* Discover Button - Between search and notifications */}
          <button
            onClick={onDiscoverClick}
            className={`relative flex items-center rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'discover'
                ? 'bg-gradient-to-r from-white to-blue-50 text-emerald-600 shadow-2xl border-2 border-white/40'
                : 'text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-md border-2 border-white/30 hover:border-white/50'
            } ${activeTab === 'discover' ? 'px-3 py-2 space-x-2' : 'w-10 h-10 justify-center'}`}
            type='button'
            title="Discover"
          >
            <Compass className={`${activeTab === 'discover' ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`${activeTab === 'discover' ? 'inline' : 'hidden'} font-semibold text-sm`}>Discover</span>
          </button>

          {/* Notifications Button - Right next to search */}
          <button
            onClick={onNotificationsClick}
            className={`relative flex items-center rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-white to-blue-50 text-emerald-600 shadow-2xl border-2 border-white/40'
                : 'text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-md border-2 border-white/30 hover:border-white/50'
            } ${activeTab === 'notifications' ? 'px-3 py-2 space-x-2' : 'w-10 h-10 justify-center'}`}
            aria-label="Notifications"
          >
            <Bell className={`${activeTab === 'notifications' ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`${activeTab === 'notifications' ? 'inline' : 'hidden'} font-semibold text-sm`}>Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-xl border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

        </div>

        {/* Right Side Actions */}
  <div className="flex items-center space-x-4 justify-end flex-1">
          <div className="flex items-center space-x-3 lg:space-x-4">
            
            
          </div>
        </div>
      </div>
    </header>
  )
}
