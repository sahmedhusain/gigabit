'use client'
import { Home, Users, Calendar, Filter, X } from 'lucide-react'
import { useNotifications, useRealTimeGroups, useRealTimeEvents, useConnectionStatus } from '@/hooks'

interface SidebarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  fetchGroups: () => void
  fetchEvents: () => void
  fetchFollowers: () => void
}

export default function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  setActiveTab,
  fetchGroups,
  fetchEvents,
  fetchFollowers
}: SidebarProps) {
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
          
          <nav className="space-y-2">
            {[
              { id: 'home', icon: Home, label: 'Home Feed' },
              { id: 'followers', icon: Users, label: 'Followers' },
              { id: 'groups', icon: Users, label: 'Groups' },
              { id: 'events', icon: Calendar, label: 'Events' }
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
