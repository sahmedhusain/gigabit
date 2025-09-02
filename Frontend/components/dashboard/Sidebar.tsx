'use client'
import { Home, Users, Calendar, X, Search } from 'lucide-react'
import { useState } from 'react'
import { useNotifications, useRealTimeGroups, useRealTimeEvents, useConnectionStatus } from '@/hooks'

interface SidebarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  fetchGroups: () => void
  fetchEvents: () => void
}

export default function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  setActiveTab,
  fetchGroups,
  fetchEvents
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { items: notifications, unread } = useNotifications()
  const { groups, getUnreadCount: getGroupsUnread } = useRealTimeGroups()
  const { events, getUnreadCount: getEventsUnread } = useRealTimeEvents()
  const { isConnected } = useConnectionStatus()

  // Calculate unread counts
  const groupsUnread = getGroupsUnread()
  const eventsUnread = getEventsUnread()

  const handleTabClick = (itemId: string) => {
    setActiveTab(itemId)
    setIsMobileMenuOpen(false)
    
    // Fetch data based on the selected tab
    if (itemId === 'groups') {
      fetchGroups()
    } else if (itemId === 'events') {
      fetchEvents()
    } 
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    // TODO: Implement search functionality
    // This could navigate to a search results page or trigger search in current context
    console.log('Searching for:', searchQuery)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border-r border-white/20 z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
              SocialConnect
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search Section */}
          <div className="mb-4 lg:mb-6">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users, posts, groups..."
                  disabled={!isConnected}
                  className={`w-full pl-10 pr-10 py-2 lg:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm lg:text-base transition-all duration-200 focus:outline-none ${
                    isConnected 
                      ? 'focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 hover:bg-white/15' 
                      : 'cursor-not-allowed bg-white/5 border-white/10'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    title="Clear search"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {!isConnected && (
                <p className="text-xs text-white/40 mt-1">Search unavailable offline</p>
              )}
            </form>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'home', icon: Home, label: 'Home', unread: 0 },
              { id: 'groups', icon: Users, label: 'Groups', unread: groupsUnread },
              { id: 'events', icon: Calendar, label: 'Events', unread: eventsUnread }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                disabled={!isConnected && (item.id === 'groups' || item.id === 'events')}
                className={`w-full flex items-center justify-between px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-200 text-sm lg:text-base ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-400/30'
                    : !isConnected && (item.id === 'groups' || item.id === 'events')
                    ? 'text-white/40 cursor-not-allowed'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                  {item.label}
                </div>
                {item.unread > 0 && (
                  <span className="bg-emerald-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-2">
                    {item.unread > 99 ? '99+' : item.unread}
                  </span>
                )}
              </button>
            ))}
            
            {/* Connection Status Indicator */}
            {!isConnected && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-400/20 rounded-xl">
                <p className="text-red-400 text-xs text-center">Offline - Some features unavailable</p>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  )
}
