'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useNotifications } from '@/hooks'
import {
  api,
  NetworkError
} from '@/lib/api'

// Import dashboard components
import TopBar from '@/components/dashboard/TopBar'
import Sidebar from '@/components/dashboard/Sidebar'
import RightSidebar from '@/components/dashboard/RightSidebar'
import NotificationsPage from '@/components/dashboard/NotificationsPage'

function NotificationsPageRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { isConnected, onlineUsers } = useWebSocket()
  const { success, error } = useToast()
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications()

  // Get filter from URL params
  const filter = searchParams.get('filter') || 'all'
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [followers, setFollowers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [following, setFollowing] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])

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
    followers: 0,
    following: 0
  } : null

  // Trending topics
  const trendingTopics = [
    '#SocialNetwork', '#TechNews', '#WebDev', '#AI', '#Startups',
    '#React', '#TypeScript', '#NodeJS', '#Python', '#DevOps'
  ]

  // Update URL when filter changes
  useEffect(() => {
    if (filter && filter !== 'all') {
      const newUrl = `/notifications?filter=${filter}`
      router.replace(newUrl)
    }
  }, [filter, router])

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      fetchFollowers()
    }
  }, [user])

  const fetchFollowers = async () => {
    if (!user) return

    try {
      const [followersData, followingData] = await Promise.all([
        api.getFollowers(user.id),
        api.getFollowing(user.id)
      ])

      setFollowers(Array.isArray(followersData?.followers) ? followersData.followers : [])
      setFollowing(Array.isArray(followingData?.following) ? followingData.following : [])
    } catch (err) {
      console.error('Error fetching followers:', err)
    }
  }

  const handleTabChange = (newTab: string) => {
    router.push(`/${newTab}`)
  }

  const handleNotificationsToggle = () => {
    router.push('/notifications')
  }

  const handleSearchToggle = () => {
    router.push('/search')
  }

  const handleDiscoverToggle = () => {
    router.push('/discover')
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab="notifications"
        setActiveTab={handleTabChange}
        feedSubTab="all"
        setFeedSubTab={() => {}}
        activitySubTab="liked"
        setActivitySubTab={() => {}}
        chatSubTab="all"
        setChatSubTab={() => {}}
        chatUnreadAll={0}
        chatUnreadDirect={0}
        chatUnreadGroups={0}
        fetchEvents={() => {}}
        currentUser={currentUser}
        logout={() => router.push('/login')}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <TopBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab="notifications"
        setActiveTab={handleTabChange}
        onNotificationsClick={handleNotificationsToggle}
        unreadCount={liveUnreadCount || 0}
        onSearchClick={handleSearchToggle}
        onDiscoverClick={handleDiscoverToggle}
      />

      {/* Main Content */}
      <div className={`main-content-layout p-2 lg:p-4 relative z-10 has-fixed-sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 h-full">
              <NotificationsPage />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Right Sidebar */}
      <RightSidebar
        onlineUsers={onlineUsers}
        followingUsers={following}
        followersUsers={followers}
        trendingTopics={trendingTopics}
        onUserClick={(user) => {
          router.push(`/profile/${user.id}`)
        }}
        currentUser={currentUser}
        setActiveTab={handleTabChange}
        logout={() => router.push('/login')}
      />
    </div>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedNotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageRoute />
    </ProtectedRoute>
  )
}

export default ProtectedNotificationsPage
