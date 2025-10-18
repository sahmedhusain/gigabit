"use client"
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import {
  api,
  Post,
  PostResponse,
  APIPost,
  Bookmark,
  NetworkError,
  AuthenticationError
} from '@/lib/api'

// Import dashboard components
import ActivitySection from '@/components/dashboard/ActivitySection'
import AppLayout from '@/components/AppLayout'

// Helper: format relative time
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

function ActivityFilterPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const filter = params.filter as string
  const { user } = useAuth()
  const { isConnected, addMessageListener } = useWebSocket()
  const { error } = useToast()

  const [activitySubTab, setActivitySubTab] = useState(filter || 'liked')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>((searchParams.get('sort') as 'newest' | 'oldest') || 'newest')

  // Data State
  const [posts, setPosts] = useState<Post[]>([])
  const [, setIsLoadingPosts] = useState(true)

  // Update URL when filter changes
  useEffect(() => {
    if (activitySubTab !== filter) {
      router.replace(`/activity/${activitySubTab}`)
    }
  }, [activitySubTab, filter, router])

  // Update URL when sort changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (sortOrder !== 'newest') {
      params.set('sort', sortOrder)
    } else {
      params.delete('sort')
    }
    const newUrl = params.toString() ? `/activity/${activitySubTab}?${params.toString()}` : `/activity/${activitySubTab}`
    router.replace(newUrl)
  }, [sortOrder, activitySubTab, searchParams, router])

  // Fetch data when component loads
  const fetchActivityPosts = useCallback(async () => {
    try {
      setIsLoadingPosts(true)
      console.log('Fetching activity posts...')
      let response: { posts?: PostResponse[]; bookmarks?: Bookmark[] } | undefined

      let postsArr: Array<PostResponse | APIPost> = []

      switch (activitySubTab) {
        case 'liked':
          // Fetch posts liked by the user
          response = await api.getUserLikedPosts()
          postsArr = Array.isArray(response?.posts) ? response.posts : []
          break
        case 'commented':
          // Fetch posts commented on by the user
          response = await api.getUserCommentedPosts()
          postsArr = Array.isArray(response?.posts) ? response.posts : []
          break
        case 'saved':
          // Fetch saved/bookmarked posts
          response = await api.getUserBookmarks()
          // Bookmarks response has a different structure - extract posts from bookmarks
          const bookmarksArr = Array.isArray(response?.bookmarks) ? response.bookmarks : []
          postsArr = bookmarksArr
            .map((bookmark: Bookmark & { post?: APIPost }) => bookmark.post)
            .filter((p): p is APIPost => Boolean(p))
          break
        default:
          response = await api.getUserLikedPosts()
          postsArr = Array.isArray(response?.posts) ? response.posts : []
      }

      if (!postsArr.length) {
        setPosts([])
        return
      }

  const mappedPosts = postsArr.map((item: PostResponse | APIPost) => {
        // Handle different response structures
        const post = item

        return {
          id: post.id,
          user: {
            id: post.user.id || ('user_id' in post ? post.user_id : 0),
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
          isBookmarked: 'is_bookmarked' in post ? (post as APIPost).is_bookmarked : false,
          created_at: post.created_at
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
      }, [activitySubTab, error])

  // Fetch activity posts on mount and when filter changes
  useEffect(() => {
    fetchActivityPosts()
  }, [fetchActivityPosts])

      // WebSocket real-time notifications
      useEffect(() => {
        if (!isConnected) return

    const removeListener = addMessageListener((message) => {
      switch (message.type) {
        case 'post_update':
        case 'like_update':
        case 'comment_update':
          console.log(`${message.type} received:`, message.data)
          // Refetch activity posts when any activity-related update occurs
          if (message.data?.user_id === user?.id) {
            console.log('Activity update for current user, refetching posts...')
            fetchActivityPosts()
          }
          break

        case 'like':
          // Update like count in real-time
          if (message.data?.post_id) {
            setPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === message.data.post_id
                  ? {
                    ...post,
                    likes: message.data.like_count || post.likes,
                    isLiked: message.data.user_id === user?.id ? message.data.is_liked : post.isLiked
                  }
                  : post
              )
            )
            
            // If this is the current user's action, also refetch to ensure data consistency
            if (message.data.user_id === user?.id) {
              fetchActivityPosts()
            }
          }
          break

            default:
              console.log('Received WebSocket message:', message)
          }
        })

    return removeListener
  }, [isConnected, addMessageListener, user?.id, fetchActivityPosts])

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

      // Optimistically update the post
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isBookmarked: !p.isBookmarked }
          : p
      ))
      
      // If we're on the saved tab, refetch to update the list
      if (activitySubTab === 'saved') {
        setTimeout(() => fetchActivityPosts(), 500) // Small delay to ensure backend is updated
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err)
      // Revert optimistic update
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isBookmarked: !p.isBookmarked }
          : p
      ))
      error('Unable to update bookmark right now.')
    }
  }

  // handler intentionally removed (unused)

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
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
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