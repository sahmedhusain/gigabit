'use client'
import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus, useNotifications, useRealTimeGroups, useRealTimeEvents, useConversations } from '@/hooks'
import { api, NetworkError, AuthenticationError } from '@/lib/api'
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
  const { isConnected, onlineUsers, addMessageListener } = useWebSocket()
  const { success, error } = useToast()
  const { isConnected: connectionStatus } = useConnectionStatus()
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications()
  const { groups: liveGroups } = useRealTimeGroups()
  const { events: liveEvents, refetch: refetchEvents } = useRealTimeEvents()
  const { conversations: liveConversations } = useConversations()

  // Layout state
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Data state
  const [followers, setFollowers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [following, setFollowing] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)

  // Trending topics
  const trendingTopics = [
    '#SocialNetwork', '#TechNews', '#WebDev', '#AI', '#Startups',
    '#React', '#TypeScript', '#NodeJS', '#Python', '#DevOps'
  ]

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
    following: following.length
  } : null

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      fetchFollowers()
      fetchConversations()
      fetchGroups()
      refetchEvents()
    }
  }, [user])

  // WebSocket real-time updates
  useEffect(() => {
    if (!isConnected) return

    const removeListener = addMessageListener((message) => {
      switch (message.type) {
        case 'notification':
          console.log('New notification received:', message.data)
          break
        case 'follow_update':
          console.log('Follow update received:', message.data)
          fetchFollowers()
          break
        default:
          console.log('Received WebSocket message:', message)
      }
    })

    return removeListener
  }, [isConnected, addMessageListener])

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

  const fetchConversations = async () => {
    try {
      setIsLoadingChats(true)
      const data = await api.getConversations()
      setChats(data.conversations.map(conversation => {
        const participantName = conversation.type === 'private'
          ? `${conversation.participant?.first_name || ''} ${conversation.participant?.last_name || ''}`.trim() || 'Unknown User'
          : conversation.group?.title || 'Unknown Group'

        const isOnline = conversation.type === 'private' && conversation.participant?.id
          ? onlineUsers.some(u => u.user_id === conversation.participant?.id && u.is_online)
          : false

        return {
          id: conversation.id,
          name: participantName,
          lastMessage: conversation.last_message.content,
          time: formatTimeAgo(conversation.updated_at),
          timestamp: conversation.updated_at,
          unread: conversation.unread_count,
          isOnline: isOnline,
          isGroup: conversation.type === 'group',
          participantId: conversation.participant?.id,
          participantAvatar: conversation.participant?.avatar,
          lastMessageSenderId: conversation.last_message.sender_id
        }
      }))
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setIsLoadingChats(false)
    }
  }

  const fetchGroups = async () => {
    try {
      setIsLoadingGroups(true)
      const data = await api.getUserGroups(user?.id || 0)
      const dataAny: any = data
      const groupsArr = Array.isArray(dataAny?.groups) ? dataAny.groups : Array.isArray(dataAny?.data) ? dataAny.data : []
      setGroups(groupsArr.map((group: any) => ({
        id: group.id,
        name: group.title ?? group.name ?? '',
        description: group.description ?? '',
        members: group.member_count ?? 0,
        isJoined: !!group.is_member,
        lastActivity: formatTimeAgo(group.updated_at ?? group.updatedAt ?? new Date().toISOString()),
        timestamp: group.updated_at ?? group.updatedAt ?? new Date().toISOString()
      })))
    } catch (err) {
      console.error('Error fetching groups:', err)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  }

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

  const handleSearchToggle = () => {
    handleTabChange('search')
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
        fetchEvents={refetchEvents}
        currentUser={currentUser}
        logout={() => router.push('/login')}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <TopBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}
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