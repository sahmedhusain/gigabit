'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import CreatePost from '@/components/dashboard/CreatePost'
import HomeFeed from '@/components/dashboard/HomeFeed'

function FeedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { isConnected, onlineUsers, addMessageListener } = useWebSocket()
  const { success, error } = useToast()
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications()

  // Get filter from URL params
  const filterParam = searchParams.get('filter') || 'all'
  const [feedSubTab, setFeedSubTab] = useState(filterParam)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)

  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [postPrivacy, setPostPrivacy] = useState('public')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; display_name?: string; }[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

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
    const newUrl = feedSubTab === 'all' ? '/feed' : `/feed?filter=${feedSubTab}`
    router.replace(newUrl)
  }, [feedSubTab, router])

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      fetchFeedPosts()
      fetchUsers()
      fetchFollowers()
    }
  }, [user])

  // WebSocket real-time notifications
  useEffect(() => {
    if (!isConnected) return

    const removeListener = addMessageListener((message) => {
      switch (message.type) {
        case 'post_update':
          console.log('Post update received:', message.data)
          fetchFeedPosts()
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

  const fetchFeedPosts = async () => {
    try {
      setIsLoadingPosts(true)
      console.log('Fetching feed posts...')
      const response = await api.getFeed(20, 0)
      console.log('Feed API response:', response)
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

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const data = await api.getUsers()
      setAvailableUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoadingUsers(false)
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

  const handleCreatePost = async () => {
    const validation = ApiClient.validatePostContent(newPostContent)
    if (!validation.isValid) {
      error(validation.error || 'Invalid post content')
      return
    }

    try {
      let imageUrl = '';

      if (newPostImage) {
        const formData = new FormData();
        formData.append('image', newPostImage);
        const token = getToken();

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/uploads`, {
          method: 'POST',
          body: formData,
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'include'
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = `/api/images/${uploadData.filename}`;
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
    router.push('/notifications')
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
        activeTab="feed"
        setActiveTab={handleTabChange}
        feedSubTab={feedSubTab}
        setFeedSubTab={setFeedSubTab}
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
        activeTab="feed"
        setActiveTab={handleTabChange}
        onNotificationsClick={handleNotificationsToggle}
        unreadCount={liveUnreadCount || 0}
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

      {/* Main Content */}
      <div className={`main-content-layout p-2 lg:p-4 relative z-10 has-fixed-sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 h-full">
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
function ProtectedFeedPage() {
  return (
    <ProtectedRoute>
      <FeedPage />
    </ProtectedRoute>
  )
}

export default ProtectedFeedPage
