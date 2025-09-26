'use client'
import { useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useSidebarData } from '@/context/SidebarDataContext'
import { useNotifications } from '@/hooks'
import { Sparkles } from 'lucide-react'

// Import layout components
import TopBar from '@/components/dashboard/TopBar'
import Sidebar from '@/components/dashboard/Sidebar'
import RightSidebar from '@/components/dashboard/RightSidebar'

interface AppLayoutProps {
  children: ReactNode
  activeTab?: string
  onTabChange?: (tab: string) => void
  feedSubTab?: string
  setFeedSubTab?: (tab: string) => void
  activitySubTab?: string
  setActivitySubTab?: (tab: string) => void
  chatSubTab?: string
  setChatSubTab?: (tab: string) => void
  eventsSubTab?: string
  setEventsSubTab?: (tab: string) => void
  tempPostSubTab?: string
  onTempPostClose?: () => void
}

export default function AppLayout({ 
  children, 
  activeTab: initialActiveTab = 'feed', 
  onTabChange,
  feedSubTab = 'all',
  setFeedSubTab,
  activitySubTab = 'liked',
  setActivitySubTab,
  chatSubTab = 'all',
  setChatSubTab,
  eventsSubTab = 'all',
  setEventsSubTab,
  tempPostSubTab,
  onTempPostClose
}: AppLayoutProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { onlineUsers } = useWebSocket()
  const { unread: liveUnreadCount } = useNotifications()

  // Use sidebar data from context
  const { followers, following, chats } = useSidebarData()

  // Layout state
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed] = useState(false)

  // Current User Processing
  const currentUser = user ? {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    username: user.nickname || user.email.split('@')[0],
    avatar: user.avatar,
    isPrivate: user.is_private,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    dateOfBirth: user.date_of_birth,
    nickname: user.nickname,
    aboutMe: user.about_me,
    memberSince: user.created_at,
    followers: followers.length,
    following: following.length,
    status: user.status || 'online',
    lastStatusChange: user.last_status_change
  } : null

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    if (onTabChange) {
      onTabChange(newTab)
    } else {
      // Default navigation logic
      router.push(`/${newTab}`)
    }
  }

  const handleNotificationsToggle = () => {
    handleTabChange('notifications')
  }

  const handleDiscoverToggle = () => {
    handleTabChange('discover')
  }

  // Calculate unread counts
  const chatUnreadAll = (chats || []).reduce((sum, c) => sum + (c.unread || 0), 0)
  const chatUnreadDirect = (chats || []).filter(c => !c.isGroup).reduce((sum, c) => sum + (c.unread || 0), 0)
  const chatUnreadGroups = (chats || []).filter(c => c.isGroup).reduce((sum, c) => sum + (c.unread || 0), 0)

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce floating-particle"
          >
            <Sparkles className="w-2 h-2 text-white/30" />
          </div>
        ))}
      </div>

      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        feedSubTab={feedSubTab}
        setFeedSubTab={setFeedSubTab || (() => {})}
        activitySubTab={activitySubTab}
        setActivitySubTab={setActivitySubTab || (() => {})}
        chatSubTab={chatSubTab}
        setChatSubTab={setChatSubTab || (() => {})}
        eventsSubTab={eventsSubTab}
        setEventsSubTab={setEventsSubTab || (() => {})}
        tempPostSubTab={tempPostSubTab}
        onTempPostClose={onTempPostClose}
        chatUnreadAll={chatUnreadAll}
        chatUnreadDirect={chatUnreadDirect}
        chatUnreadGroups={chatUnreadGroups}
      />

      <TopBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}
        onNotificationsClick={handleNotificationsToggle}
        unreadCount={liveUnreadCount || 0}
        onDiscoverClick={handleDiscoverToggle}
      />

      {/* Main Content */}
      <div className={`main-content-layout p-2 lg:p-4 relative z-10 has-fixed-sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 h-full">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Right Sidebar */}
      <RightSidebar
        onlineUsers={onlineUsers}
        followingUsers={following}
        followersUsers={followers}
        onUserClick={(user) => {
          router.push(`/profile/${user.id}`)
        }}
        currentUser={currentUser}
        setActiveTab={handleTabChange}
        logout={logout}
      />
    </div>
  )
}