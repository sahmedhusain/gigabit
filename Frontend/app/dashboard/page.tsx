'use client'
import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import ChatWindow from '@/components/ChatWindow'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useOffline } from '@/hooks/useOffline'
import { 
  api, 
  ApiClient, 
  Post, 
  type Notification as NotificationType, 
  Group, 
  Event, 
  Chat, 
  NetworkError, 
  ValidationError, 
  AuthenticationError, 
  CategoryResponse, 
  CreatePostRequest 
} from '@/lib/api'
import { Sparkles } from 'lucide-react'

// Import all dashboard components
import TopBar from '@/components/dashboard/TopBar'
import Sidebar from '@/components/dashboard/Sidebar'
import CreatePost from '@/components/dashboard/CreatePost'
import NotificationsDropdown from '@/components/dashboard/NotificationsDropdown'
import ChatDropdown from '@/components/dashboard/ChatDropdown'
import HomeFeed from '@/components/dashboard/HomeFeed'
import ProfileSection from '@/components/dashboard/ProfileSection'
import { 
  CategoriesSection, 
  FollowersSection, 
  GroupsSection, 
  EventsSection, 
  SettingsSection 
} from '@/components/dashboard/DashboardSections'

function DashboardPage() {
  const { user, logout, checkAuth } = useAuth()
  const { isConnected, onlineUsers, addMessageListener, sendMessage } = useWebSocket()
  const { success, error, warning } = useToast()
  const { isOffline, lastConnectionCheck } = useOffline()
  
  // UI State
  const [activeTab, setActiveTab] = useState('home')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('')
  const [postPrivacy, setPostPrivacy] = useState('public')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedPostCategory, setSelectedPostCategory] = useState<number>(1)
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; display_name?: string; }[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Data State
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [categorySearchResults, setCategorySearchResults] = useState<CategoryResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [trendingCategories, setTrendingCategories] = useState<CategoryResponse[]>([])
  const [isLoadingTrending, setIsLoadingTrending] = useState(false)
  const [openChatWindow, setOpenChatWindow] = useState<{
    conversationId: number
    type: 'private' | 'group'
    name: string
  } | null>(null)
  const [followers, setFollowers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [following, setFollowing] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)

  // Current User Processing
  const currentUser = user ? {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    username: user.nickname || user.email.split('@')[0],
    avatar: user.avatar,
    isPrivate: user.is_private,
    followers: 0,
    following: 0
  } : null

  // Test function to manually check token
  const testTokenExpiration = async () => {
    console.log('Testing token expiration...')
    try {
      await checkAuth()
      console.log('Token still valid')
    } catch (error) {
      console.log('Token expired or invalid')
    }
  }

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      fetchFeedPosts()
      fetchCategories()
      fetchTrendingCategories()
      fetchUsers()
    }
  }, [user])

  // WebSocket real-time notifications
  useEffect(() => {
    if (!isConnected) return

    const removeListener = addMessageListener((message) => {
      switch (message.type) {
        case 'notification':
          console.log('New notification received:', message.data)
          setNotifications(prev => [
            {
              id: Date.now(),
              type: message.data.type,
              user: message.data.actor_name || 'Someone',
              message: message.data.message,
              time: 'Just now',
              isRead: false
            },
            ...prev
          ])
          setUnreadNotifications(prev => prev + 1)
          if (Notification.permission === 'granted') {
            new Notification('SocialConnect', {
              body: message.data.message,
              icon: '/favicon.ico'
            })
          }
          break

        case 'post_update':
          console.log('Post update received:', message.data)
          if (activeTab === 'home') {
            fetchFeedPosts()
          }
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
          } else {
            console.log('Not updating - either no post_id or message from current user')
          }
          break

        case 'user_status':
          console.log('User status update received:', message.data)
          break

        case 'ping':
          console.log('Ping received from server')
          break

        case 'pong':
          console.log('Pong received from server')
          break

        case 'error':
          console.error('WebSocket error message:', message.data)
          error('Server error: ' + (message.data?.message || 'Unknown error'))
          break

        default:
          console.log('Received WebSocket message:', message)
      }
    })

    return removeListener
  }, [isConnected, addMessageListener, activeTab])

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Handle offline/online status changes
  useEffect(() => {
    if (isOffline) {
      warning('You are currently offline. Some features may not work until connection is restored.', 0)
    }
  }, [isOffline, warning])

  // API Functions
  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const data = await api.getCategories()
      setCategories(data.categories)
    } catch (err) {
      console.error('Error fetching categories:', err)
      if (err instanceof NetworkError) {
        error('Failed to load categories.')
      } else {
        error('Unable to load categories right now.')
      }
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const fetchTrendingCategories = async () => {
    try {
      setIsLoadingTrending(true)
      const data = await api.getCategoryStats()
      setTrendingCategories(data.stats.filter(stat => stat.trending).slice(0, 5))
    } catch (err) {
      console.error('Error fetching trending categories:', err)
      if (err instanceof NetworkError) {
        error('Failed to load trending categories.')
      } else {
        error('Unable to load trending categories right now.')
      }
    } finally {
      setIsLoadingTrending(false)
    }
  }

  const searchCategories = async (query: string) => {
    if (!query.trim()) {
      setCategorySearchResults([])
      setIsSearching(false)
      return
    }

    try {
      setIsSearching(true)
      const data = await api.searchCategories(query)
      setCategorySearchResults(data.categories)
    } catch (err) {
      console.error('Error searching categories:', err)
      if (err instanceof NetworkError) {
        error('Failed to search categories.')
      } else {
        error('Unable to search categories right now.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const fetchFeedPosts = async () => {
    try {
      setIsLoadingPosts(true)
      console.log('Fetching feed posts...')
      const response = await api.getFeed(20, 0)
      console.log('Feed API response:', response)
      const postsArr = Array.isArray(response.data) ? response.data : [];
      console.log('Posts array:', postsArr)
      if (!postsArr.length) {
        setPosts([])
        console.log('No posts found in response')
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
        image: post.image_url,
        likes: post.like_count,
        comments: post.comment_count,
        shares: 0,
        timeAgo: formatTimeAgo(post.created_at),
        privacy: post.privacy,
        isLiked: post.is_liked
      }))
      console.log('Mapped posts:', mappedPosts)
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

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true)
      const data = await api.getNotifications(20, 0)
      setNotifications(data.data.map(notification => ({
        id: notification.id,
        type: notification.type,
        user: `${notification.actor.first_name} ${notification.actor.last_name}`,
        message: notification.message,
        time: formatTimeAgo(notification.created_at),
        isRead: notification.is_read
      })))
    } catch (err) {
      console.error('Error fetching notifications:', err)
      if (err instanceof NetworkError) {
        error('Failed to load notifications.')
      } else {
        error('Unable to load notifications right now.')
      }
    } finally {
      setIsLoadingNotifications(false)
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
        lastActivity: formatTimeAgo(group.updated_at ?? group.updatedAt ?? new Date().toISOString())
      })))
    } catch (err) {
      console.error('Error fetching groups:', err)
      if (err instanceof NetworkError) {
        error('Failed to load groups.')
      } else {
        error('Unable to load groups right now.')
      }
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true)
      const data = await api.getUserEvents()
      const dataAny: any = data
      const eventsArr = Array.isArray(dataAny?.events) ? dataAny.events : Array.isArray(dataAny?.data) ? dataAny.data : []
      setEvents(eventsArr.map((event: any) => {
        const eventDateStr = event.event_time ?? event.event_date ?? event.eventTime ?? new Date().toISOString()
        return {
          id: event.id,
          title: event.title ?? '',
          description: event.description ?? '',
          date: new Date(eventDateStr).toLocaleDateString(),
          time: new Date(eventDateStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          location: event.location ?? 'Location not specified',
          group: (event.group && (event.group.title ?? event.group.name)) || 'Unknown Group',
          going: event.going_count ?? event.goingCount ?? 0,
          notGoing: event.not_going_count ?? event.notGoingCount ?? 0,
          userResponse: event.user_response ?? event.userResponse ?? 'not_responded' as string
        }
      }))
    } catch (err) {
      console.error('Error fetching events:', err)
      if (err instanceof NetworkError) {
        error('Failed to load events.')
      } else {
        error('Unable to load events right now.')
      }
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const fetchConversations = async () => {
    try {
      setIsLoadingChats(true)
      const data = await api.getConversations()
      setChats(data.conversations.map(conversation => ({
        id: conversation.id,
        name: conversation.type === 'private' 
          ? `${conversation.participant?.first_name || ''} ${conversation.participant?.last_name || ''}`.trim() || 'Unknown User'
          : conversation.group?.title || 'Unknown Group',
        lastMessage: conversation.last_message.content,
        time: formatTimeAgo(conversation.updated_at),
        unread: conversation.unread_count,
        isOnline: false,
        isGroup: conversation.type === 'group'
      })))
    } catch (err) {
      console.error('Error fetching conversations:', err)
      if (err instanceof NetworkError) {
        error('Failed to load conversations.')
      } else {
        error('Unable to load conversations right now.')
      }
    } finally {
      setIsLoadingChats(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const data = await api.getUsers()
      setAvailableUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      if (err instanceof NetworkError) {
        error('Failed to load users.')
      } else {
        error('Unable to load users right now.')
      }
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchFollowers = async () => {
    if (!user) return
    
    try {
      setIsLoadingFollowers(true)
      const [followersData, followingData] = await Promise.all([
        api.getFollowers(user.id),
        api.getFollowing(user.id)
      ])
      
      setFollowers(Array.isArray(followersData?.data) ? followersData.data : [])
      setFollowing(Array.isArray(followingData?.data) ? followingData.data : [])
    } catch (err) {
      console.error('Error fetching followers:', err)
      if (err instanceof NetworkError) {
        error('Failed to load followers.')
      }
    } finally {
      setIsLoadingFollowers(false)
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

  const handleCreatePost = async () => {
    const validation = ApiClient.validatePostContent(newPostContent)
    if (!validation.isValid) {
      error(validation.error || 'Invalid post content')
      return
    }

    try {
      const postData: CreatePostRequest = {
        content: newPostContent,
        privacy: postPrivacy === 'followers' ? 'almost_private' : postPrivacy,
        category_id: selectedPostCategory
      }
      
      if (postPrivacy === 'private' && selectedUsers.length > 0) {
        postData.specific_user_ids = selectedUsers
      }
      
      await api.createPost(postData)
      setNewPostContent('')
      setSelectedUsers([])
      setShowCreatePost(false)
      success('Post created successfully!')
      fetchFeedPosts()
    } catch (err) {
      console.error('Error creating post:', err)
      if (err instanceof ValidationError) {
        error(err.message)
      } else if (err instanceof NetworkError) {
        error('Failed to create post. Please try again.')
      } else {
        error('Unable to create post right now.')
      }
    }
  }

  const handleLikePost = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId)
      const wasLiked = post?.isLiked || false

      if (post && post.isLiked) {
        await api.unlikePost(postId)
      } else {
        await api.likePost(postId)
      }

      // Send real-time WebSocket update
      if (isConnected) {
        console.log('Sending like WebSocket message:', {
          type: 'like',
          from: user?.id,
          post_id: postId,
          action: wasLiked ? 'unlike' : 'like'
        })
        sendMessage({
          type: 'like',
          from: user?.id,
          post_id: postId,
          action: wasLiked ? 'unlike' : 'like',
          data: {
            post_id: postId,
            user_id: user?.id,
            action: wasLiked ? 'unlike' : 'like',
            like_count: wasLiked ? (post?.likes || 0) - 1 : (post?.likes || 0) + 1
          }
        })
      } else {
        console.log('WebSocket not connected, cannot send like update')
      }

      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      ))
    } catch (err) {
      console.error('Error toggling like:', err)
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes + 1 : p.likes - 1 }
          : p
      ))
      if (err instanceof NetworkError) {
        error('Failed to update like. Please try again.')
      } else {
        error('Unable to update like right now.')
      }
    }
  }

  const isUserOnline = (username: string): boolean => {
    return onlineUsers.some(u => u.username === username && u.is_online)
  }

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategory(categoryId)
    setActiveTab('categories')
  }

  const handleNotificationsToggle = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      fetchNotifications()
      setUnreadNotifications(0)
    }
  }

  const handleChatToggle = () => {
    setShowChat(!showChat)
    if (!showChat) {
      fetchConversations()
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': 
        return (
          <HomeFeed
            posts={posts}
            trendingCategories={trendingCategories}
            onPostLike={handleLikePost}
            onCategoryClick={handleCategoryClick}
            setActiveTab={setActiveTab}
          />
        )
      case 'categories': 
        return (
          <CategoriesSection
            categories={categories}
            trendingCategories={trendingCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categorySearchQuery={categorySearchQuery}
            setCategorySearchQuery={setCategorySearchQuery}
            categorySearchResults={categorySearchResults}
            isSearching={isSearching}
            posts={posts}
            searchCategories={searchCategories}
          />
        )
      case 'profile': 
        return (
          <ProfileSection
            currentUser={currentUser}
            followers={followers}
            following={following}
            posts={posts}
            isLoadingFollowers={isLoadingFollowers}
          />
        )
      case 'followers': 
        return (
          <FollowersSection
            followers={followers}
            following={following}
            isLoadingFollowers={isLoadingFollowers}
          />
        )
      case 'groups': 
        return <GroupsSection groups={groups} />
      case 'events': 
        return <EventsSection events={events} />
      case 'settings': 
        return (
          <SettingsSection
            currentUser={currentUser}
            testTokenExpiration={testTokenExpiration}
          />
        )
      default: 
        return (
          <HomeFeed
            posts={posts}
            trendingCategories={trendingCategories}
            onPostLike={handleLikePost}
            onCategoryClick={handleCategoryClick}
            setActiveTab={setActiveTab}
          />
        )
    }
  }

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
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Sparkles className="w-2 h-2 text-white/30" />
          </div>
        ))}
      </div>

      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fetchGroups={fetchGroups}
        fetchEvents={fetchEvents}
        fetchFollowers={fetchFollowers}
      />

      <TopBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setShowCreatePost={setShowCreatePost}
        setShowNotifications={handleNotificationsToggle}
        setShowChat={handleChatToggle}
        showNotifications={showNotifications}
        showChat={showChat}
        notifications={notifications}
        currentUser={currentUser}
        isOffline={isOffline}
        isConnected={isConnected}
        logout={logout}
        setActiveTab={setActiveTab}
      />

      <CreatePost
        show={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        postPrivacy={postPrivacy}
        setPostPrivacy={setPostPrivacy}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        selectedPostCategory={selectedPostCategory}
        setSelectedPostCategory={setSelectedPostCategory}
        categories={categories}
        availableUsers={availableUsers}
        loadingUsers={loadingUsers}
        onCreatePost={handleCreatePost}
      />

      <NotificationsDropdown
        show={showNotifications}
        notifications={notifications}
        fetchNotifications={fetchNotifications}
      />

      <ChatDropdown
        show={showChat}
        chats={chats}
        onChatClick={setOpenChatWindow}
        onClose={() => setShowChat(false)}
        isUserOnline={isUserOnline}
      />
      
      {/* Chat Window */}
      {openChatWindow && (
        <ChatWindow
          conversationId={openChatWindow.conversationId}
          conversationType={openChatWindow.type}
          participantName={openChatWindow.name}
          onClose={() => setOpenChatWindow(null)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64 pt-14 lg:pt-16 p-3 lg:p-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  )
}

export default ProtectedDashboard
