'use client'
import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useSidebarData } from '@/context/SidebarDataContext'
import { useNotifications } from '@/hooks'
import { api } from '@/lib/api'

// Import layout components
import TopBar from '@/components/dashboard/TopBar'
import Sidebar from '@/components/dashboard/Sidebar'
import RightSidebar from '@/components/dashboard/RightSidebar'
import AnimatedBackground from './AnimatedBackground'

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
  const [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen] = useState(false)
  const [isSidebarCollapsed] = useState(false)
  const [postsCount, setPostsCount] = useState(0)

  // Fetch posts count when user changes
  useEffect(() => {
    const fetchPostsCount = async () => {
      if (user?.id) {
        try {
          const response = await api.getUserPosts(user.id) // Use default limit to get posts array
          setPostsCount(response.posts.length) // Use actual posts count like profile page
        } catch (error) {
          console.error('Failed to fetch posts count:', error)
          setPostsCount(0)
        }
      }
    }
    fetchPostsCount()
  }, [user?.id])

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
    posts: postsCount,
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

  // Calculate unread counts (conversation count, not message count)
  const chatUnreadAll = (chats || []).filter(c => (c.unread || 0) > 0).length
  const chatUnreadDirect = (chats || []).filter(c => !c.isGroup && (c.unread || 0) > 0).length
  const chatUnreadGroups = (chats || []).filter(c => c.isGroup && (c.unread || 0) > 0).length

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
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
        isMobileRightSidebarOpen={isMobileRightSidebarOpen}
        setIsMobileRightSidebarOpen={setIsMobileRightSidebarOpen}
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

      {/* Mobile Left Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Right Sidebar Overlay */}
      {isMobileRightSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileRightSidebarOpen(false)}
        />
      )}

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
        isMobileOpen={isMobileRightSidebarOpen}
      />
    </div>
  )
}