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
import ActivitySection from '@/components/dashboard/ActivitySection'
import AppLayout from '@/components/AppLayout'

function ActivityFilterPage() {
  const router = useRouter()
  const params = useParams()
  const filter = params.filter as string
  const { user } = useAuth()
  const { isConnected, onlineUsers, addMessageListener } = useWebSocket()
  const { success, error } = useToast()
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications()

  const [activitySubTab, setActivitySubTab] = useState(filter || 'liked')

  // Data State
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)

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

      let postsArr: any[] = []

      switch (activitySubTab) {
        case 'liked':
          // Fetch posts liked by the user
          response = await api.getUserLikedPosts()
          postsArr = Array.isArray(response.posts) ? response.posts : [];
          break
        case 'commented':
          // Fetch posts commented by the user
          response = await api.getUserCommentedPosts()
          postsArr = Array.isArray(response.posts) ? response.posts : [];
          break
        case 'saved':
          // Fetch saved/bookmarked posts
          response = await api.getUserBookmarks()
          // Bookmarks response has a different structure - extract posts from bookmarks
          const bookmarksArr = Array.isArray(response.bookmarks) ? response.bookmarks : [];
          postsArr = bookmarksArr.map((bookmark: any) => bookmark.post).filter(Boolean);
          break
        default:
          response = await api.getUserLikedPosts()
          postsArr = Array.isArray(response.posts) ? response.posts : [];
      }
      
      if (!postsArr.length) {
        setPosts([])
        return
      }

      const mappedPosts = postsArr.map((item: any) => {
        // Handle different response structures
        const post = activitySubTab === 'saved' ? item : item;
        
        return {
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
          isLiked: post.is_liked,
          isBookmarked: post.is_bookmarked
        }
      })
      
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

  return (
    <AppLayout 
      activeTab="activity"
      activitySubTab={activitySubTab}
      setActivitySubTab={setActivitySubTab}
    >
      <ActivitySection
        posts={posts}
        onPostLike={handleLikePost}
        onPostBookmark={handleBookmarkPost}
        activitySubTab={activitySubTab}
        setActivitySubTab={setActivitySubTab}
      />
    </AppLayout>
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