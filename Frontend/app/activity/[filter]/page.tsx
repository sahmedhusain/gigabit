"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
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


import ActivitySection from '@/components/profile/ActivitySection'
import AppLayout from '@/components/layout/AppLayout'


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
  const filter = (params as { filter: string }).filter
  const { user } = useAuth()
  const { isConnected, addMessageListener } = useWebSocket()
  const { error } = useToast()

  const [activitySubTab, setActivitySubTab] = useState(filter || 'liked')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(
    (searchParams?.get('sort') === 'oldest' ? 'oldest' : 'newest')
  )

  
  const [posts, setPosts] = useState<Post[]>([])
  const [, setIsLoadingPosts] = useState(true)

  
  const [paginationState, setPaginationState] = useState<{
    liked: { currentPage: number; hasMoreResults: boolean; isLoadingMore: boolean };
    commented: { currentPage: number; hasMoreResults: boolean; isLoadingMore: boolean };
    saved: { currentPage: number; hasMoreResults: boolean; isLoadingMore: boolean };
  }>({
    liked: { currentPage: 0, hasMoreResults: true, isLoadingMore: false },
    commented: { currentPage: 0, hasMoreResults: true, isLoadingMore: false },
    saved: { currentPage: 0, hasMoreResults: true, isLoadingMore: false }
  })

  
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  
  useEffect(() => {
    if (activitySubTab !== filter) {
      router.replace(`/activity/${activitySubTab}`)
    }
  }, [activitySubTab, filter, router])

  
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (sortOrder !== 'newest') {
      params.set('sort', sortOrder)
    } else {
      params.delete('sort')
    }
    const newUrl = params.toString() ? `/activity/${activitySubTab}?${params.toString()}` : `/activity/${activitySubTab}`
    router.replace(newUrl)
  }, [sortOrder, activitySubTab, searchParams, router])

  
  const fetchActivityPosts = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      if (append) {
        setPaginationState(prev => ({
          ...prev,
          [activitySubTab as keyof typeof prev]: { ...prev[activitySubTab as keyof typeof prev], isLoadingMore: true }
        }))
      } else {
        setIsLoadingPosts(true)
      }

      let response: { posts?: PostResponse[]; bookmarks?: Bookmark[]; count?: number } | undefined

      let postsArr: Array<PostResponse | APIPost> = []

      switch (activitySubTab) {
        case 'liked':
          
          response = await api.getUserLikedPosts(20, page * 20)
          postsArr = Array.isArray(response?.posts) ? response.posts : []
          break
        case 'commented':
          
          response = await api.getUserCommentedPosts(20, page * 20)
          postsArr = Array.isArray(response?.posts) ? response.posts : []
          break
        case 'saved':
          
          response = await api.getUserBookmarks(20, page * 20)
          
          const bookmarksArr = Array.isArray(response?.bookmarks) ? response.bookmarks : []
          postsArr = bookmarksArr
            .map((bookmark: Bookmark & { post?: APIPost }) => bookmark.post)
            .filter((p): p is APIPost => Boolean(p))
          break
        default:
          response = await api.getUserLikedPosts(20, page * 20)
          postsArr = Array.isArray(response?.posts) ? response.posts : []
      }

      if (!postsArr.length) {
        if (!append) {
          setPosts([])
        }
        setPaginationState(prev => ({
          ...prev,
          [activitySubTab as keyof typeof prev]: { ...prev[activitySubTab as keyof typeof prev], hasMoreResults: false }
        }))
        return
      }

  const mappedPosts = postsArr.map((item: PostResponse | APIPost) => {
        
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
          shares: post.share_count,
          timeAgo: formatTimeAgo(post.created_at),
          privacy: post.privacy,
          isLiked: post.is_liked,
          isBookmarked: 'is_bookmarked' in post ? (post as APIPost).is_bookmarked : false,
          created_at: post.created_at
        }
      })

      if (append) {
        setPosts(prevPosts => [...prevPosts, ...mappedPosts])
        setPaginationState(prev => ({
          ...prev,
          [activitySubTab as keyof typeof prev]: {
            ...prev[activitySubTab as keyof typeof prev],
            currentPage: page,
            isLoadingMore: false
          }
        }))
      } else {
        setPosts(mappedPosts)
        setPaginationState(prev => ({
          ...prev,
          [activitySubTab as keyof typeof prev]: {
            currentPage: 0,
            hasMoreResults: true,
            isLoadingMore: false
          }
        }))
      }

      
      if (mappedPosts.length < 20) {
        setPaginationState(prev => ({
          ...prev,
          [activitySubTab as keyof typeof prev]: { ...prev[activitySubTab as keyof typeof prev], hasMoreResults: false }
        }))
      }
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
      setPaginationState(prev => ({
        ...prev,
        [activitySubTab as keyof typeof prev]: { ...prev[activitySubTab as keyof typeof prev], isLoadingMore: false }
      }))
    }
      }, [activitySubTab, error])

  
  useEffect(() => {
    fetchActivityPosts(0, false) 
  }, [fetchActivityPosts])

  const handleLoadMore = useCallback(() => {
    const currentState = paginationState[activitySubTab as keyof typeof paginationState]
    if (!currentState.isLoadingMore && currentState.hasMoreResults && resultsContainerRef.current) {
      
      const scrollTop = resultsContainerRef.current.scrollTop

      fetchActivityPosts(currentState.currentPage + 1, true).then(() => {
        
        requestAnimationFrame(() => {
          if (resultsContainerRef.current) {
            resultsContainerRef.current.scrollTop = scrollTop
          }
        })
      })
    }
  }, [activitySubTab, paginationState, fetchActivityPosts])

      
      useEffect(() => {
        if (!isConnected) return

    const removeListener = addMessageListener((message) => {
      switch (message.type) {
        case 'post_update':
        case 'like_update':
        case 'comment_update':
          
          if (message.data?.user_id === user?.id) {
            fetchActivityPosts()
          }
          break

        case 'like':
          
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
            
            
            if (message.data.user_id === user?.id) {
              fetchActivityPosts()
            }
          }
          break

            default:
          }
        })

    return removeListener
  }, [isConnected, addMessageListener, user?.id, fetchActivityPosts])

  const handleLikePost = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId)
      const wasLiked = post?.isLiked || false

      if (post) {
        await api.toggleLike(post, !wasLiked)
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
      
      
      if (activitySubTab === 'saved') {
        setTimeout(() => fetchActivityPosts(), 500) 
      }
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
        hasMoreResults={paginationState[activitySubTab as keyof typeof paginationState].hasMoreResults}
        isLoadingMore={paginationState[activitySubTab as keyof typeof paginationState].isLoadingMore}
        onLoadMore={handleLoadMore}
        resultsContainerRef={resultsContainerRef}
      />
    </AppLayout>
  )
}


function ProtectedActivityFilterPage() {
  return (
    <ProtectedRoute>
      <ActivityFilterPage />
    </ProtectedRoute>
  )
}

export default ProtectedActivityFilterPage