'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import ChatWindow from '@/components/ChatWindow'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useOffline } from '@/hooks/useOffline'
import { api, ApiClient, Post, type Notification as NotificationType, Group, Event, Chat, NetworkError, ValidationError, AuthenticationError, CategoryResponse } from '@/lib/api'
import CategoryBadge from '@/components/ui/CategoryBadge'
import { 
  Home,
  User,
  Users,
  MessageCircle,
  Bell,
  Settings,
  Search,
  Plus,
  Heart,
  MessageSquare,
  Share,
  MoreHorizontal,
  Camera,
  Image as ImageIcon,
  Globe,
  Lock,
  UserCheck,
  UserPlus,
  Calendar,
  MapPin,
  Sparkles,
  Send,
  Smile,
  X,
  Check,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Bookmark,
  TrendingUp,
  Activity
} from 'lucide-react'

function DashboardPage() {
  const { user, logout, checkAuth } = useAuth()
  const { isConnected, onlineUsers, addMessageListener, sendMessage } = useWebSocket()
  const { success, error, warning } = useToast()
  const { isOffline, lastConnectionCheck } = useOffline()
  const [activeTab, setActiveTab] = useState('home')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [newPostContent, setNewPostContent] = useState('')
  const [postPrivacy, setPostPrivacy] = useState('public')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedPostCategory, setSelectedPostCategory] = useState<number>(1) // Default to General category
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; display_name?: string; }[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const currentUser = user ? {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    username: user.nickname || user.email.split('@')[0],
    avatar: user.avatar,
    isPrivate: user.is_private,
    followers: 0, // These would come from API calls to /api/users/{id}/followers
    following: 0  // These would come from API calls to /api/users/{id}/following
  } : null

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

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      fetchFeedPosts()
      fetchCategories()
      fetchTrendingCategories()
      fetchUsers() // Add fetching users for private post selection
    }
  }, [user])

  // WebSocket real-time notifications
  useEffect(() => {
    if (!isConnected) return

    const removeListener = addMessageListener((message) => {
      switch (message.type) {
        case 'notification':
          console.log('New notification received:', message.data)
          // Add new notification to the list
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
          // Increment unread count
          setUnreadNotifications(prev => prev + 1)
          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification('SocialConnect', {
              body: message.data.message,
              icon: '/favicon.ico'
            })
          }
          break

        case 'post_update':
          console.log('Post update received:', message.data)
          // Refresh feed posts when there are updates
          if (activeTab === 'home') {
            fetchFeedPosts()
          }
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
      const response = await api.getFeed(20, 0)
      console.log('Feed API response:', response)
      const postsArr = Array.isArray(response.posts) ? response.posts : Array.isArray(response.data) ? response.data : [];
      if (!postsArr.length) {
        setPosts([])
        error('No posts found or failed to load posts.')
        return
      }
      setPosts(postsArr.map((post: any) => ({
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
        shares: 0, // This could be added to backend later
        timeAgo: formatTimeAgo(post.created_at),
        privacy: post.privacy,
        isLiked: post.is_liked
      })))
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
          userResponse: event.user_response ?? event.userResponse ?? 'not_responded'
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
        isOnline: false, // This would need real-time status
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

  const handleCreatePost = async () => {
    // Validate input
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
      
      // Add specific user IDs for private posts
      if (postPrivacy === 'private' && selectedUsers.length > 0) {
        postData.specific_user_ids = selectedUsers
      }
      
      await api.createPost(postData)
      setNewPostContent('')
      setSelectedUsers([])
      setShowCreatePost(false)
      success('Post created successfully!')
      // Refresh the feed
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
      if (post && post.isLiked) {
        await api.unlikePost(postId)
      } else {
        await api.likePost(postId)
      }
      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      ))
    } catch (err) {
      console.error('Error toggling like:', err)
      // Revert optimistic update
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

  const renderSidebar = () => (
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
              { id: 'categories', icon: Filter, label: 'Categories' },
              { id: 'profile', icon: User, label: 'My Profile' },
              { id: 'followers', icon: Users, label: 'Followers' },
              { id: 'groups', icon: Users, label: 'Groups' },
              { id: 'events', icon: Calendar, label: 'Events' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsMobileMenuOpen(false)
                  if (item.id === 'groups') {
                    fetchGroups()
                  } else if (item.id === 'events') {
                    fetchEvents()
                  } else if (item.id === 'followers') {
                    fetchFollowers()
                  } else if (item.id === 'profile') {
                    fetchFollowers()
                  }
                }}
                className={`w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-200 text-sm lg:text-base ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  )

  const renderTopBar = () => (
    <div className="fixed top-0 left-0 lg:left-64 right-0 h-14 lg:h-16 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/20 z-30">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <Home className="w-5 h-5" />
          </button>
          
          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 w-40 sm:w-60 lg:w-80 text-sm lg:text-base"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Mobile Search */}
          <button
            className="sm:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            title="Open search"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowCreatePost(true)}
            className="hidden sm:flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden md:inline">Create</span>
          </button>
          
          {/* Mobile Create Post */}
          <button
            onClick={() => setShowCreatePost(true)}
            className="sm:hidden p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              if (!showNotifications) {
                fetchNotifications()
                setUnreadNotifications(0)
              }
            }}
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 lg:w-3 lg:h-3 bg-red-500 rounded-full"></span>
            )}
          </button>
          
          <button
            onClick={() => {
              setShowChat(!showChat)
              if (!showChat) {
                fetchConversations()
              }
            }}
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Connection status indicator */}
            <div className="flex items-center space-x-1">
              <div 
                className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${
                  isOffline ? 'bg-red-500' : isConnected ? 'bg-green-500' : 'bg-yellow-500'
                }`} 
                title={
                  isOffline ? 'Offline - No internet connection' : 
                  isConnected ? 'Connected to server' : 
                  'Connecting...'
                }
              ></div>
              {isOffline && (
                <span className="text-xs text-red-300 hidden sm:inline">Offline</span>
              )}
            </div>
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </div>
            <span className="hidden md:inline text-white font-medium text-sm lg:text-base">{currentUser?.name || 'User'}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCreatePost = () => {
    if (!showCreatePost) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 shadow-2xl"></div>
          
          <div className="relative p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="text-lg lg:text-xl font-semibold text-white">Create New Post</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full h-24 lg:h-32 bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none text-sm lg:text-base"
                  maxLength={5000}
                />
                <div className="absolute bottom-3 right-3 text-xs text-white/50">
                  {newPostContent.length}/5000
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button className="flex items-center px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-200 text-sm lg:text-base">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Add Image
                </button>
                
                <button className="flex items-center px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-200 text-sm lg:text-base">
                  <Camera className="w-4 h-4 mr-2" />
                  Add GIF
                </button>
              </div>
              
              <div className="space-y-3">
                <label className="text-white font-medium text-sm lg:text-base">Category:</label>
                <select
                  value={selectedPostCategory}
                  onChange={(e) => setSelectedPostCategory(parseInt(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id} className="text-black">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-white font-medium text-sm lg:text-base">Privacy Settings:</label>
                <div className="space-y-2">
                  {[
                    { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can see this post' },
                    { value: 'followers', icon: Users, label: 'Followers Only', desc: 'Only your followers can see this' },
                    { value: 'private', icon: Lock, label: 'Selected Followers', desc: 'Choose specific followers' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        value={option.value}
                        checked={postPrivacy === option.value}
                        onChange={(e) => setPostPrivacy(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 ${
                        postPrivacy === option.value ? 'border-emerald-400 bg-emerald-400' : 'border-white/40'
                      }`}></div>
                      <option.icon className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm lg:text-base">{option.label}</div>
                        <div className="text-white/60 text-xs lg:text-sm">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {postPrivacy === 'private' && (
                <div className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <label className="text-white font-medium mb-2 block text-sm lg:text-base">Select Users:</label>
                  <div className="space-y-2 max-h-24 lg:max-h-32 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="text-white/60 text-sm text-center py-4">
                        Loading users...
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="text-white/60 text-sm text-center py-4">
                        No users available
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <label key={user.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id])
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                              }
                            }}
                            className="rounded border-white/30 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {user.display_name || `${user.first_name} ${user.last_name}`}
                            </p>
                            <p className="text-white/60 text-xs truncate">
                              @{user.nickname || user.email.split('@')[0]}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <div className="mt-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                      <p className="text-emerald-300 text-sm">
                        {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="w-full sm:w-auto px-4 lg:px-6 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-sm lg:text-base"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreatePost}
                  className="w-full sm:w-auto px-4 lg:px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderNotifications = () => {
    if (!showNotifications) return null

    return (
      <div className="fixed top-14 lg:top-16 right-2 lg:right-6 w-72 sm:w-80 max-h-80 lg:max-h-96 overflow-y-auto bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/20 shadow-2xl z-40">
        <div className="p-3 lg:p-4">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Notifications</h3>
          <div className="space-y-2 lg:space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${
                  notification.isRead ? 'bg-white/5' : 'bg-emerald-500/10 border border-emerald-400/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs lg:text-sm">
                      <span className="font-medium">{notification.user}</span>
                      {' '}{notification.message}
                    </p>
                    <p className="text-white/60 text-xs mt-1">{notification.time}</p>
                  </div>
                  {notification.type === 'follow_request' && (
                    <div className="flex space-x-1 lg:space-x-2 ml-2 lg:ml-3 flex-shrink-0">
                      <button className="p-1 bg-emerald-500 rounded-md lg:rounded-lg hover:bg-emerald-600 transition-colors">
                        <Check className="w-3 h-3 text-white" />
                      </button>
                      <button className="p-1 bg-red-500 rounded-md lg:rounded-lg hover:bg-red-600 transition-colors">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderChat = () => {
    if (!showChat) return null

    return (
      <div className="fixed top-14 lg:top-16 right-2 lg:right-6 w-72 sm:w-80 h-80 lg:h-96 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/20 shadow-2xl z-40 flex flex-col">
        <div className="p-3 lg:p-4 border-b border-white/20">
          <h3 className="text-base lg:text-lg font-semibold text-white">Messages</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          <div className="space-y-2 lg:space-y-3">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center space-x-2 lg:space-x-3 p-2 lg:p-3 rounded-lg lg:rounded-xl hover:bg-white/10 cursor-pointer transition-all duration-200"
                onClick={() => {
                  setOpenChatWindow({
                    conversationId: chat.id,
                    type: chat.isGroup ? 'group' : 'private',
                    name: chat.name
                  })
                  setShowChat(false)
                }}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    {chat.isGroup ? (
                      <Users className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    ) : (
                      <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    )}
                  </div>
                  {!chat.isGroup && (isUserOnline(chat.name) || chat.isOnline) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full border border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium truncate text-sm lg:text-base">{chat.name}</h4>
                    <span className="text-white/60 text-xs flex-shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-white/70 text-xs lg:text-sm truncate">{chat.lastMessage}</p>
                </div>
                
                {chat.unread > 0 && (
                  <div className="w-4 h-4 lg:w-5 lg:h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">{chat.unread}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-3 lg:p-4 border-t border-white/20">
          <button className="w-full flex items-center justify-center py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
            <MessageSquare className="w-4 h-4 mr-2" />
            New Message
          </button>
        </div>
      </div>
    )
  }

  const renderHomeFeed = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* Trending Categories Section */}
      {trendingCategories.length > 0 && (
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-white font-semibold mb-0 text-base lg:text-lg flex items-center">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
              Trending Categories
            </h3>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-emerald-400 hover:text-emerald-300 text-xs lg:text-sm font-medium transition-colors duration-200"
            >
              View All
            </button>
          </div>
          <div className="flex space-x-2 lg:space-x-3 overflow-x-auto pb-2">
            {trendingCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id)
                  setActiveTab('categories')
                }}
                className="flex-shrink-0 bg-white/5 hover:bg-white/10 rounded-lg lg:rounded-xl p-2 lg:p-3 border border-white/10 hover:border-emerald-400/30 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <CategoryBadge category={category} size="sm" />
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-white/70 text-xs">{category.post_count}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4 lg:space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-white font-medium text-sm lg:text-base truncate">{post.user.name}</h4>
                    {post.category && <CategoryBadge category={post.category} size="sm" />}
                  </div>
                  <p className="text-white/60 text-xs lg:text-sm">@{post.user.username} • {post.timeAgo}</p>
                </div>
              </div>
              <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 flex-shrink-0">
                <MoreHorizontal className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            </div>

            {/* Post Content */}
            <p className="text-white mb-3 lg:mb-4 text-sm lg:text-base leading-relaxed">{post.content}</p>

            {/* Post Image */}
            {post.image && (
              <div className="mb-3 lg:mb-4 rounded-xl lg:rounded-2xl overflow-hidden bg-white/5">
                <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 lg:w-12 lg:h-12 text-white/50" />
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-white/10">
              <button 
                onClick={() => handleLikePost(post.id)}
                className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                  post.isLiked 
                    ? 'text-red-400 bg-red-500/10' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}>
                <Heart className={`w-3 h-3 lg:w-4 lg:h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes}</span>
              </button>
              
              <button className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm">
                <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4" />
                <span>{post.comments}</span>
              </button>
              
              <button className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm">
                <Share className="w-3 h-3 lg:w-4 lg:h-4" />
                <span>{post.shares}</span>
              </button>
              
              <button className="p-1.5 lg:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200">
                <Bookmark className="w-3 h-3 lg:w-4 lg:h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-8">
        <div className="flex flex-col items-center space-y-4 lg:flex-row lg:items-start lg:space-y-0 lg:space-x-8">
          <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
          </div>
          
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">{currentUser?.name || 'User'}</h2>
            <p className="text-emerald-300 text-base lg:text-lg mb-4">@{currentUser?.username || 'username'}</p>
            
            <div className="flex justify-center lg:justify-start space-x-6 lg:space-x-8 mb-4 lg:mb-6">
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">{followers?.length ?? 0}</div>
                <div className="text-white/60 text-sm lg:text-base">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">{following?.length ?? 0}</div>
                <div className="text-white/60 text-sm lg:text-base">Following</div>
              </div>
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">{posts?.length ?? 0}</div>
                <div className="text-white/60 text-sm lg:text-base">Posts</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <button className="flex items-center justify-center px-4 lg:px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
              
              <button className={`flex items-center justify-center px-4 lg:px-6 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-sm lg:text-base`}>
                {currentUser?.isPrivate ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Private Profile
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Public Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-3 lg:mb-4">My Posts</h3>
            <div className="space-y-3 lg:space-y-4">
              {posts.slice(0, 2).map((post) => (
                <div key={post.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <p className="text-white mb-2 lg:mb-3 text-sm lg:text-base">{post.content}</p>
                  <div className="flex items-center justify-between text-xs lg:text-sm text-white/60">
                    <span>{post.timeAgo}</span>
                    <div className="flex space-x-3 lg:space-x-4">
                      <span>{post.likes} likes</span>
                      <span>{post.comments} comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-4 lg:space-y-6">
          {/* Activity */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Recent Activity</h3>
            <div className="space-y-2 lg:space-y-3">
              <div className="text-white/60 text-xs lg:text-sm text-center py-4">
                No recent activity
              </div>
              {/* Activity would come from real API call to /api/users/{id}/activity */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFollowers = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Followers & Following</h2>
          <div className="flex space-x-2">
            <button className="px-3 lg:px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg lg:rounded-xl text-sm lg:text-base">
              Followers
            </button>
            <button className="px-3 lg:px-4 py-2 text-white/70 hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
              Following
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {isLoadingFollowers ? (
            <div className="col-span-full text-center text-white/60 py-8">
              Loading followers...
            </div>
          ) : (followers?.length ?? 0) === 0 ? (
            <div className="col-span-full text-center text-white/60 py-8">
              No followers yet
            </div>
          ) : (
            (followers || []).map((follower) => (
              <div key={follower.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm lg:text-base truncate">
                      {follower.first_name} {follower.last_name}
                    </h4>
                    <p className="text-white/60 text-xs lg:text-sm truncate">
                      @{follower.nickname || follower.email.split('@')[0]}
                    </p>
                  </div>
                  <button className="px-2 lg:px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white text-xs lg:text-sm hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex-shrink-0">
                    Message
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )

  const renderGroups = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">My Groups</h2>
          <button className="flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <div className="flex items-start justify-between mb-3 lg:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">{group.name}</h3>
                  <p className="text-white/70 mb-3 text-sm lg:text-base">{group.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs lg:text-sm text-white/60">
                    <span>{group.members} members</span>
                    <span>Last activity: {group.lastActivity}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
                  View Group
                </button>
                <button className="px-3 lg:px-4 py-2 border border-white/30 rounded-lg lg:rounded-xl text-white hover:bg-white/10 transition-all duration-200 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browse Groups */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <h3 className="text-lg lg:text-xl font-semibold text-white mb-3 lg:mb-4">Discover Groups</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="col-span-full text-center text-white/60 py-8">
            No groups available to discover
          </div>
          {/* Available groups would come from real API call to /api/groups (excluding user's groups) */}
        </div>
      </div>
    </div>
  )

  const renderEvents = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Upcoming Events</h2>
          <button className="flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        </div>
        
        <div className="space-y-3 lg:space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 mb-3 lg:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">{event.title}</h3>
                  <p className="text-white/70 mb-3 text-sm lg:text-base">{event.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs lg:text-sm text-white/60">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                      {event.location}
                    </div>
                  </div>
                </div>
                
                <div className="text-center lg:text-right">
                  <div className="text-xs lg:text-sm text-white/60 mb-2">From: {event.group}</div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                      event.userResponse === 'going' 
                        ? 'bg-emerald-500 text-white' 
                        : 'border border-white/30 text-white hover:bg-white/10'
                    }`}>
                      Going ({event.going})
                    </button>
                    <button className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                      event.userResponse === 'not_going' 
                        ? 'bg-red-500 text-white' 
                        : 'border border-white/30 text-white hover:bg-white/10'
                    }`}>
                      Not Going ({event.notGoing})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Settings</h2>
        
        <div className="space-y-4 lg:space-y-6">
          {/* Privacy Settings */}
          <div className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Privacy & Security</h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <h4 className="text-white font-medium text-sm lg:text-base">Private Profile</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Only followers can see your posts</p>
                </div>
                <button className={`w-10 h-5 lg:w-12 lg:h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                  currentUser?.isPrivate ? 'bg-emerald-500' : 'bg-white/20'
                }`}>
                  <div className={`w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full transition-all duration-200 ${
                    currentUser?.isPrivate ? 'translate-x-6 lg:translate-x-7' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <h4 className="text-white font-medium text-sm lg:text-base">Show Online Status</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Let others see when you're active</p>
                </div>
                <button className="w-10 h-5 lg:w-12 lg:h-6 bg-emerald-500 rounded-full flex-shrink-0">
                  <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full translate-x-6 lg:translate-x-7"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Notifications</h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="text-white/60 text-sm text-center py-4">
                Notification preferences would be loaded from user settings
              </div>
              {/* Notification settings would come from real API call to /api/users/{id}/settings */}
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Account</h3>
            <div className="space-y-2 lg:space-y-3">
              <button 
                onClick={testTokenExpiration}
                className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-yellow-400 hover:bg-yellow-500/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base"
              >
                🔍 Test Token Expiration (Check Console)
              </button>
              <button className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
                Change Password
              </button>
              <button className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
                Download My Data
              </button>
              <button className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-red-400 hover:bg-red-500/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

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

  const renderCategories = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Categories</h2>
          <div className="flex items-center space-x-3">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-3 lg:px-4 py-2 bg-white/10 border border-white/30 rounded-lg lg:rounded-xl text-white hover:bg-white/20 transition-all duration-200 text-sm lg:text-base"
              >
                Show All
              </button>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearchQuery}
            onChange={(e) => {
              setCategorySearchQuery(e.target.value)
              searchCategories(e.target.value)
            }}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {(categorySearchQuery ? categorySearchResults : categories).map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`bg-white/5 hover:bg-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-left transition-all duration-200 border ${
                selectedCategory === category.id ? 'border-emerald-400/50 ring-2 ring-emerald-400/20' : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <CategoryBadge category={category} size="sm" />
                <span className="text-white/60 text-sm">{category.post_count} posts</span>
              </div>
              <h3 className="text-white font-medium text-base lg:text-lg mb-2">{category.name}</h3>
              {category.description && (
                <p className="text-white/70 text-sm lg:text-base">{category.description}</p>
              )}
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-4">
              Posts in {categories.find(c => c.id === selectedCategory)?.name}
            </h3>
            <div className="space-y-4">
              {posts.filter(post => post.category?.id === selectedCategory).map((post) => (
                <div key={post.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm lg:text-base">{post.user.name}</h4>
                        <p className="text-white/60 text-xs lg:text-sm">@{post.user.username} • {post.timeAgo}</p>
                      </div>
                    </div>
                    {/* CategoryBadge removed: post.category not present in feed posts */}
                  </div>
                  <p className="text-white mb-3 lg:mb-4 text-sm lg:text-base">{post.content}</p>
                  <div className="flex items-center space-x-4 text-white/60">
                    <span className="flex items-center space-x-1 text-xs lg:text-sm">
                      <Heart className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span>{post.likes}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-xs lg:text-sm">
                      <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span>{post.comments}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Helper function to check if a user is online
  const isUserOnline = (username: string): boolean => {
    return onlineUsers.some(u => u.username === username && u.is_online)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return renderHomeFeed()
      case 'categories': return renderCategories()
      case 'profile': return renderProfile()
      case 'followers': return renderFollowers()
      case 'groups': return renderGroups()
      case 'events': return renderEvents()
      case 'settings': return renderSettings()
      default: return renderHomeFeed()
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

      {renderSidebar()}
      {renderTopBar()}
      {renderCreatePost()}
      {renderNotifications()}
      {renderChat()}
      
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
