'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useRealTimePosts, useNotifications } from '@/hooks'
import {
  api,
  ApiClient,
  Post,
  getToken,
  CreatePostRequest,
  NetworkError,
  ValidationError,
  AuthenticationError
} from '@/lib/api'

// Import dashboard components
import TopBar from '@/components/dashboard/TopBar'
import Sidebar from '@/components/dashboard/Sidebar'
import RightSidebar from '@/components/dashboard/RightSidebar'
import ActivitySection from '@/components/dashboard/ActivitySection'

function ActivityFilterPage() {
  const router = useRouter()
  const params = useParams()
  const filter = params.filter as string
  const { user } = useAuth()
  const { isConnected, onlineUsers, addMessageListener } = useWebSocket()
  const { success, error } = useToast()
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications()

  const [activitySubTab, setActivitySubTab] = useState(filter || 'liked')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Data State
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
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
    if (activitySubTab !== filter) {
      router.replace(`/activity/${activitySubTab}`)
    }
  }, [activitySubTab, filter, router])

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      fetchActivityPosts()
      fetchFollowers()
    }
  }, [user, activitySubTab])

  // WebSocket real-time notifications
  useEffect(() => {
    if (!isConnected) return

    const removeListener = addMessageListener((message) => {
      switch (message.type) {
        case 'post_update':
          console.log('Post update received:', message.data)
          fetchActivityPosts()
          break

        case 'like':
          // Update like count in real-time for other users
          if (message.data?.post_id && message.data?.user_id !== user?.id) {
            setPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === message.data.post_id
                  ? {
                    ...post,
                    likes: message.data.like_count || post.likes
                  }
                  : post
              )
            )
          }
          break

        default:
          console.log('Received WebSocket message:', message)
      }
    })

    return removeListener
  }, [isConnected, addMessageListener, user?.id])

  const fetchActivityPosts = async () => {
    try {
      setIsLoadingPosts(true)
      console.log('Fetching activity posts...')
      let response: any

      switch (activitySubTab) {
        case 'liked':
          // Fetch posts liked by the user
          response = await api.getUserLikedPosts()
          break
        case 'commented':
          // Fetch posts commented by the user
          response = await api.getUserCommentedPosts()
          break
        case 'saved':
          // Fetch saved/bookmarked posts
          response = await api.getUserBookmarks()
          break
        default:
          response = await api.getUserLikedPosts()
      }

      const postsArr = Array.isArray(response.data) ? response.data : [];
      
      if (!postsArr.length) {
        setPosts([])
        return
      }

      const mappedPosts = postsArr.map((post: any) => ({
        id: post.id,
        user: {
          name: `${post.user.first_name} ${post.user.last_name}`,
          username: post.user.nickname || post.user.email.split('@')[0],
          avatar: post.user.avatar
        },
        content: post.content,
        image: post.image_url ? 
          (post.image_url.startsWith('http') ? 
            post.image_url : 
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${post.image_url}`
          ) : undefined,
        likes: post.like_count,
        comments: post.comment_count,
        shares: 0,
        timeAgo: formatTimeAgo(post.created_at),
        privacy: post.privacy,
        isLiked: post.is_liked
      }))
      
      setPosts(mappedPosts)
    } catch (err) {
      console.error('Error fetching posts:', err)
      if (err instanceof NetworkError) {
        error('Failed to load posts. Please check your connection.')
      } else if (err instanceof AuthenticationError) {
        error('Please log in again to continue.')
      } else {
        error('Unable to load posts right now.')
      }
    } finally {
      setIsLoadingPosts(false)
    }
  }

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

  const handleLikePost = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId)
      const wasLiked = post?.isLiked || false

      if (wasLiked) {
        await api.unlikePost(postId)
      } else {
        await api.likePost(postId)
      }

      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.likes + (wasLiked ? -1 : 1) }
          : p
      ))
    } catch (err) {
      console.error('Error toggling like:', err)
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.likes + (p.isLiked ? -1 : 1) }
          : p
      ))
      error('Unable to update like right now.')
    }
  }

  const handleBookmarkPost = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId)
      const wasBookmarked = post?.isBookmarked || false

      if (wasBookmarked) {
        await api.unbookmarkPost(postId)
      } else {
        await api.toggleBookmark(postId)
      }

      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isBookmarked: !p.isBookmarked }
          : p
      ))
    } catch (err) {
      console.error('Error toggling bookmark:', err)
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isBookmarked: !p.isBookmarked }
          : p
      ))
      error('Unable to update bookmark right now.')
    }
  }

  const handleTabChange = (newTab: string) => {
    router.push(`/${newTab}`)
  }

  const handleNotificationsToggle = () => {
    router.push('/notifications/all')
  }

  const handleSearchToggle = () => {
    router.push('/search')
  }

  const handleDiscoverToggle = () => {
    router.push('/discover')
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
        activeTab="activity"
        setActiveTab={handleTabChange}
        feedSubTab="all"
        setFeedSubTab={() => {}}
        activitySubTab={activitySubTab}
        setActivitySubTab={setActivitySubTab}
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
        activeTab="activity"
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
              <ActivitySection
                posts={posts}
                onPostLike={handleLikePost}
                onPostBookmark={handleBookmarkPost}
                activitySubTab={activitySubTab}
                setActivitySubTab={setActivitySubTab}
              />
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
function ProtectedActivityFilterPage() {
  return (
    <ProtectedRoute>
      <ActivityFilterPage />
    </ProtectedRoute>
  )
}

export default ProtectedActivityFilterPage