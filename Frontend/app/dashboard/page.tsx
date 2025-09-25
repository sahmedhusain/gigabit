'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import ChatWindow from '@/components/ChatWindow'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useOffline } from '@/hooks/useOffline'
import { useConnectionStatus, useRealTimePosts, useNotifications, useRealTimeGroups, useRealTimeEvents, useConversations } from '@/hooks'
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
  getToken,
  CreatePostRequest
} from '@/lib/api'
import { Sparkles } from 'lucide-react'

// Import all dashboard components
import TopBar from '@/components/dashboard/TopBar'
import Sidebar from '@/components/dashboard/Sidebar'
import RightSidebar from '@/components/dashboard/RightSidebar'
import UsersSidebar from '@/components/dashboard/UsersSidebar'
import CreatePost from '@/components/dashboard/CreatePost'
import CreateGroup from '@/components/dashboard/CreateGroup'
import CreateDirectMessage from '@/components/dashboard/CreateDirectMessage'
import CreateGeneralEvent from '@/components/dashboard/CreateGeneralEvent'
import HomeFeed from '@/components/dashboard/HomeFeed'
import ProfileSection from '@/components/dashboard/ProfileSection'
import ChatsSection from '@/components/dashboard/ChatsSection'
import ActivitySection from '@/components/dashboard/ActivitySection'
import CommunitySection from '@/components/dashboard/CommunitySection'
import SearchPage from '@/components/dashboard/SearchPage'
import DiscoverPage from '@/components/dashboard/DiscoverPage'
import NotificationsPage from '@/components/dashboard/NotificationsPage'
import {
  SettingsSection
} from '@/components/dashboard/DashboardSections'

function DashboardPage() {
  const router = useRouter()
  const { user, logout, checkAuth } = useAuth()
  const { isConnected, onlineUsers, addMessageListener, sendMessage } = useWebSocket()
  const { success, error, warning } = useToast()
  const { isOffline, lastConnectionCheck } = useOffline()
  
  // Real-time hooks
  const { isConnected: connectionStatus } = useConnectionStatus()
  const { posts: livePosts, isLoading: postsLoading } = useRealTimePosts()
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications()
  const { groups: liveGroups } = useRealTimeGroups()
  const { 
    events: liveEvents, 
    loading: eventsLoading, 
    respond: respondToEvent,
    refetch: refetchEvents 
  } = useRealTimeEvents()
  const { conversations: liveConversations } = useConversations()

  // UI State
  const [activeTab, setActiveTab] = useState('feed')
  const [previousTab, setPreviousTab] = useState('feed')
  const [feedSubTab, setFeedSubTab] = useState('all')
  const [activitySubTab, setActivitySubTab] = useState('liked')
  const [chatSubTab, setChatSubTab] = useState('all')
  const [eventsSubTab, setEventsSubTab] = useState('all')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showCreateDirectMessage, setShowCreateDirectMessage] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSearchPage, setShowSearchPage] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [postPrivacy, setPostPrivacy] = useState('public')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; display_name?: string; }[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Data State - Use real-time data when available
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingTrending, setIsLoadingTrending] = useState(false)
  const [openChatWindow, setOpenChatWindow] = useState<{
    conversationId: number
    type: 'private' | 'group',
    name: string
    participantId?: number
  } | null>(null)
  const [followers, setFollowers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [following, setFollowing] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)

  // Data for trending topics (can be expanded later)
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
      fetchUsers()
      fetchFollowers()
      fetchConversations() // Add this to load conversations on initial load
      refetchEvents() // Add this to load events immediately
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
            new Notification('Gigabit', {
              body: message.data.message,
              icon: '/favicon.ico'
            })
          }
          break

        case 'follow_update':
          console.log('Follow update received:', message.data)
          // This is now handled in a separate effect after fetchFollowers is defined
          break

        case 'post_update':
          console.log('Post update received:', message.data)
          if (activeTab === 'feed') {
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
          // Handle user online/offline status updates
          if (message.data?.user_id && message.data?.is_online !== undefined) {
            // Update online users list if needed
            // This could be used to update chat user status indicators
            console.log(`User ${message.data.user_id} is now ${message.data.is_online ? 'online' : 'offline'}`)
          }
          break

        case 'ping':
          console.log('Ping received from server')
          break

        case 'pong':
          console.log('Pong received from server')
          break

        case 'error':
          console.error('WebSocket error message:', message.data)
          error('Server error: ' + (message.data?.message || message.content || 'Unknown error'))
          break

        default:
          console.log('Received WebSocket message:', message)
      }
    })

    return removeListener
  }, [isConnected, addMessageListener, activeTab, user?.id, error])

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Update chat online status when online users change
  useEffect(() => {
    if (chats.length > 0) {
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.isGroup) return chat // Groups don't have online status
          
          const isOnline = chat.participantId 
            ? onlineUsers.some(u => u.user_id === chat.participantId && u.is_online)
            : false
          
          return { ...chat, isOnline }
        })
      )
    }
  }, [onlineUsers, chats.length])


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
        lastActivity: formatTimeAgo(group.updated_at ?? group.updatedAt ?? new Date().toISOString()),
        timestamp: group.updated_at ?? group.updatedAt ?? new Date().toISOString() // Add timestamp for sorting
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

  const fetchConversations = async () => {
    try {
      setIsLoadingChats(true)
      const data = await api.getConversations()
      setChats(data.conversations.map(conversation => {
        const participantName = conversation.type === 'private'
          ? `${conversation.participant?.first_name || ''} ${conversation.participant?.last_name || ''}`.trim() || 'Unknown User'
          : conversation.group?.title || 'Unknown Group'
        
        // Check if participant is online for private conversations
        const isOnline = conversation.type === 'private' && conversation.participant?.id
          ? onlineUsers.some(u => u.user_id === conversation.participant?.id && u.is_online)
          : false
        
        return {
          id: conversation.id,
          name: participantName,
          lastMessage: conversation.last_message.content,
          time: formatTimeAgo(conversation.updated_at),
          timestamp: conversation.updated_at, // Add timestamp for sorting
          unread: conversation.unread_count,
          isOnline: isOnline,
          isGroup: conversation.type === 'group',
          participantId: conversation.participant?.id,
          participantAvatar: conversation.participant?.avatar, // Add participant avatar
          lastMessageSenderId: conversation.last_message.sender_id // Add sender ID for "You:" prefix
        }
      }))
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

      setFollowers(Array.isArray(followersData?.followers) ? followersData.followers : [])
      setFollowing(Array.isArray(followingData?.following) ? followingData.following : [])
    } catch (err) {
      console.error('Error fetching followers:', err)
      if (err instanceof NetworkError) {
        error('Failed to load followers.')
      }
    } finally {
      setIsLoadingFollowers(false)
    }
  }

  // Handle follow updates specifically
  useEffect(() => {
    if (!isConnected) return

    const removeListener = addMessageListener((message) => {
      if (message.type === 'follow_update') {
        console.log('Follow update received:', message.data)
        // Refresh followers if we're on followers or profile tab
        if (activeTab === 'followers' || activeTab === 'profile') {
          fetchFollowers()
        }
      }
    })

    return removeListener
  }, [isConnected, addMessageListener, activeTab, fetchFollowers])

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
      console.log("I am in handle create post")
      let imageUrl = '';

      if (newPostImage) {
        const formData = new FormData();
        formData.append('image', newPostImage);
        const token = getToken();
        
        console.log("Uploading image to backend uploads endpoint")

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/uploads`, {
          method: 'POST',
          body: formData,
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'include'
        })

        console.log("Upload response:", uploadResponse);
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = `/api/images/${uploadData.filename}`;
          console.log("Image uploaded successfully:", imageUrl);
        } else {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }
      }
      const postData: CreatePostRequest = {
        content: newPostContent,
        privacy: postPrivacy === 'followers' ? 'almost_private' : postPrivacy,
        image_url: imageUrl
      }

      if (postPrivacy === 'private' && selectedUsers.length > 0) {
        postData.specific_user_ids = selectedUsers
      }

      await api.createPost(postData)
      setNewPostContent('')
      setNewPostImage(null)
      setPostPrivacy('public')
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
      if (err instanceof NetworkError) {
        error('Failed to update bookmark. Please try again.')
      } else {
        error('Unable to update bookmark right now.')
      }
    }
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
      if (err instanceof NetworkError) {
        error('Failed to update like. Please try again.')
      } else {
        error('Unable to update like right now.')
      }
    }
  }

  const isUserOnline = (userId: number): boolean => {
    return onlineUsers.some(u => u.user_id === userId && u.is_online)
  }

  const handleNotificationsToggle = () => {
    if (activeTab === 'notifications') {
      // If we're already on notifications, go back to previous tab
      setActiveTab(previousTab)
    } else {
      // Navigate to notifications tab
      setPreviousTab(activeTab)
      setActiveTab('notifications')
      setUnreadNotifications(0)
    }
  }

  // Custom function to handle tab changes and track previous tab
  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      setPreviousTab(activeTab)
      setActiveTab(newTab)
    }
  }

  const handleChatToggle = () => {
    if (activeTab === 'chats') {
      // If we're already on chats, go back to previous tab
      setActiveTab(previousTab)
    } else {
      // Navigate to chats tab and fetch data
      setPreviousTab(activeTab)
      setActiveTab('chats')
      fetchConversations()
      fetchGroups()
    }
  }

  const handleDiscoverToggle = () => {
    if (activeTab === 'discover') {
      // If Discover is already open, go back to the previous tab
      setActiveTab(previousTab)
    } else {
      // Open Discover and remember the previous tab
      setPreviousTab(activeTab)
      setActiveTab('discover')
    }
  }

  const handleSearchToggle = () => {
    setShowSearchPage(!showSearchPage)
  }

  const handleStartDirectMessage = async (userId: number, userName: string) => {
    try {
      // Get existing conversations to check if one already exists
      const conversationsData = await api.getConversations()
      
      // Find existing conversation with this user
      const existingConversation = conversationsData.conversations.find(
        conv => conv.type === 'private' && conv.participant?.id === userId
      )
      
      if (existingConversation) {
        // Open existing conversation
        setOpenChatWindow({
          conversationId: existingConversation.id,
          type: 'private',
          name: userName,
          participantId: userId
        })
      } else {
        // Create a new conversation
        const newConversation = await api.createConversation(userId);
        setOpenChatWindow({
          conversationId: newConversation.id,
          type: 'private',
          name: userName,
          participantId: userId
        })
      }
      
      // Close the create direct message modal
      setShowCreateDirectMessage(false)
      
      // Refresh conversations list
      fetchConversations()
      
      success(`Started conversation with ${userName}`)
    } catch (err) {
      console.error('Error starting direct message:', err)
      if (err instanceof NetworkError) {
        error('Failed to start conversation. Please try again.')
      } else {
        error('Unable to start conversation right now.')
      }
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <HomeFeed
            posts={posts}
            onPostLike={handleLikePost}
            onPostBookmark={handleBookmarkPost}
            setActiveTab={handleTabChange}
            showCreatePost={showCreatePost}
            setShowCreatePost={setShowCreatePost}
            newPostContent={newPostContent}
            setNewPostContent={setNewPostContent}
            newPostImage={newPostImage}
            setNewPostImage={setNewPostImage}
            postPrivacy={postPrivacy}
            setPostPrivacy={setPostPrivacy}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            availableUsers={availableUsers}
            loadingUsers={loadingUsers}
            onCreatePost={handleCreatePost}
            feedSubTab={feedSubTab}
            setFeedSubTab={setFeedSubTab}
          />
        )
      case 'chats':
        return openChatWindow ? (
          <ChatWindow
            conversationId={openChatWindow.conversationId}
            conversationType={openChatWindow.type}
            participantName={openChatWindow.name}
            participantId={openChatWindow.participantId}
            onClose={() => setOpenChatWindow(null)}
          />
        ) : (
          <ChatsSection
            chats={chats}
            groups={groups}
            isLoadingChats={isLoadingChats}
            isLoadingGroups={isLoadingGroups}
            chatSubTab={chatSubTab}
            onChatClick={setOpenChatWindow}
            isUserOnline={isUserOnline}
            currentUser={user}
            showCreateGroup={showCreateGroup}
            setShowCreateDirectMessage={setShowCreateDirectMessage}
            setShowCreateGroup={setShowCreateGroup}
          />
        )
      case 'activity':
        return (
          <ActivitySection
            activitySubTab={activitySubTab}
            setActivitySubTab={setActivitySubTab}
            posts={posts}
            onPostLike={handleLikePost}
            onPostBookmark={handleBookmarkPost}
          />
        )
      case 'events':
        return (
          <CommunitySection
            events={liveEvents}
            onEventsUpdate={refetchEvents}
            isLoadingEvents={eventsLoading}
            notifications={notifications}
            isLoadingNotifications={isLoadingNotifications}
            showCreateEvent={showCreateEvent}
            setShowCreateEvent={setShowCreateEvent}
            onEventRespond={respondToEvent}
            communitySubTab={'events'}
            eventsSubTab={eventsSubTab}
          />
        )
      case 'activity-history':
        return (
          <CommunitySection
            events={liveEvents}
            onEventsUpdate={refetchEvents}
            isLoadingEvents={eventsLoading}
            notifications={notifications}
            isLoadingNotifications={isLoadingNotifications}
            showCreateEvent={showCreateEvent}
            setShowCreateEvent={setShowCreateEvent}
            onEventRespond={respondToEvent}
            communitySubTab={'activity'}
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
      case 'settings': 
        return (
          <SettingsSection
            currentUser={currentUser}
            testTokenExpiration={testTokenExpiration}
          />
        )
      case 'search':
        return <SearchPage onClose={() => setActiveTab(previousTab)} />
      case 'discover':
        return <DiscoverPage onClose={() => setActiveTab(previousTab)} />
      case 'notifications':
        return <NotificationsPage />
      default:
        return (
          <HomeFeed
            posts={posts}
            onPostLike={handleLikePost}
            onPostBookmark={handleBookmarkPost}
            setActiveTab={handleTabChange}
            showCreatePost={showCreatePost}
            setShowCreatePost={setShowCreatePost}
            newPostContent={newPostContent}
            setNewPostContent={setNewPostContent}
            newPostImage={newPostImage}
            setNewPostImage={setNewPostImage}
            postPrivacy={postPrivacy}
            setPostPrivacy={setPostPrivacy}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            availableUsers={availableUsers}
            loadingUsers={loadingUsers}
            onCreatePost={handleCreatePost}
            feedSubTab={feedSubTab}
            setFeedSubTab={setFeedSubTab}
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
            className="absolute animate-bounce floating-particle"
          >
            <Sparkles className="w-2 h-2 text-white/30" />
          </div>
        ))}
      </div>

      {(() => {
        const chatUnreadAll = (chats || []).reduce((sum, c) => sum + (c.unread || 0), 0)
        const chatUnreadDirect = (chats || []).filter(c => !c.isGroup).reduce((sum, c) => sum + (c.unread || 0), 0)
        const chatUnreadGroups = (chats || []).filter(c => c.isGroup).reduce((sum, c) => sum + (c.unread || 0), 0)
        return (
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        feedSubTab={feedSubTab}
        setFeedSubTab={setFeedSubTab}
        activitySubTab={activitySubTab}
        setActivitySubTab={setActivitySubTab}
        chatSubTab={chatSubTab}
        setChatSubTab={setChatSubTab}
        eventsSubTab={eventsSubTab}
        setEventsSubTab={setEventsSubTab}
        chatUnreadAll={chatUnreadAll}
        chatUnreadDirect={chatUnreadDirect}
        chatUnreadGroups={chatUnreadGroups}
        fetchEvents={refetchEvents}
        currentUser={currentUser}
        logout={logout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
        )
      })()}

      <TopBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onNotificationsClick={handleNotificationsToggle}
        unreadCount={liveUnreadCount || unreadNotifications}
        onSearchClick={handleSearchToggle}
        onDiscoverClick={handleDiscoverToggle}
      />

      <CreatePost
        show={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        newPostImage={newPostImage}
        setNewPostImage={setNewPostImage}
        postPrivacy={postPrivacy}
        setPostPrivacy={setPostPrivacy}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        availableUsers={availableUsers}
        loadingUsers={loadingUsers}
        onCreatePost={handleCreatePost}
      />

      <CreateGeneralEvent
        show={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onEventCreated={() => {
          refetchEvents()
          setShowCreateEvent(false)
          success('Event created successfully!')
        }}
      />

      <CreateDirectMessage
        show={showCreateDirectMessage}
        onClose={() => setShowCreateDirectMessage(false)}
        followers={followers}
        isLoading={isLoadingFollowers}
        onStartChat={(followerId: number) => {
          const follower = followers.find(f => f.id === followerId)
          if (follower) {
            const userName = `${follower.first_name} ${follower.last_name}`.trim() || follower.nickname || follower.email
            handleStartDirectMessage(followerId, userName)
          }
        }}
      />

      <CreateGroup
        show={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={() => {
          fetchGroups()
          setShowCreateGroup(false)
          success('Group created successfully!')
        }}
      />

      {showSearchPage && <SearchPage onClose={() => setShowSearchPage(false)} />}

      {/* Main Content */}
      <div className={`main-content-layout p-2 lg:p-4 relative z-10 has-fixed-sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 h-full">
              {renderContent()}
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
          // TODO: Navigate to user profile
          console.log('User clicked:', user)
        }}
        currentUser={currentUser}
        setActiveTab={handleTabChange}
        logout={logout}
      />
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
