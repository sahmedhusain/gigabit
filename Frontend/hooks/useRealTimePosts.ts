'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type APIPost, type PostResponse } from '@/lib/api'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useAuth } from '@/context/AuthContext'

export function useRealTimePosts() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<APIPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const lastFetchTime = useRef<number>(Date.now())

  
  const { isConnected } = useWebSocketSubscription({
    messageTypes: ['post_update', 'like_update', 'comment_update', 'like'],
    onMessage: (message) => {
      const now = Date.now()

      switch (message.type) {
        case 'post_update':
          if (message.data) {
            if (message.action === 'created' && message.data.post) {
              const newPost = message.data.post as APIPost
              
              if (newPost.user_id !== user?.id && now > lastFetchTime.current) {
                setUnreadCount(prev => prev + 1)
              }
              setPosts(prev => [newPost, ...prev])
            } else if (message.action === 'updated' && message.post_id) {
              setPosts(prev => prev.map(post =>
                post.id === message.post_id
                  ? { ...post, ...message.data }
                  : post
              ))
            } else if (message.action === 'deleted' && message.post_id) {
              setPosts(prev => prev.filter(post => post.id !== message.post_id))
            }
          }
          break

        case 'like_update':
        case 'like':
          if (message.data && message.post_id) {
            setPosts(prev => prev.map(post =>
              post.id === message.post_id
                ? {
                  ...post,
                  like_count: message.data.like_count || post.like_count,
                  is_liked: message.data.is_liked !== undefined
                    ? (message.data.user_id === user?.id ? message.data.is_liked : post.is_liked)
                    : post.is_liked
                }
                : post
            ))
          }
          break

        case 'comment_update':
          if (message.data && message.post_id) {
            setPosts(prev => prev.map(post =>
              post.id === message.post_id
                ? { ...post, comment_count: message.data.comment_count || post.comment_count }
                : post
            ))
          }
          break
      }
    }
  })

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await api.getPosts()
      const postsData = response.posts || []

      setPosts(Array.isArray(postsData) ? postsData : [])
      lastFetchTime.current = Date.now()
      setUnreadCount(0) 
    } catch (err: any) {
      console.error('Failed to fetch posts:', err)
      setError(err.message || 'Failed to fetch posts')
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createPost = useCallback(async (postData: any) => {
    try {
      const response = await api.createPost(postData)
      
      await fetchPosts()
      return response
    } catch (err: any) {
      console.error('Failed to create post:', err)
      throw err
    }
  }, [user, fetchPosts])

  const likePost = useCallback(async (post: APIPost) => {
    
    const currentPost = posts.find(p => p.id === post.id)
    if (!currentPost) return

    const willBeLiked = !currentPost.is_liked

    
    setPosts(currentPosts => currentPosts.map(p =>
      p.id === post.id
        ? {
          ...p,
          is_liked: willBeLiked,
          like_count: willBeLiked
            ? p.like_count + 1
            : Math.max(0, p.like_count - 1)
        }
        : p
    ))

    try {
      
      await api.toggleLike(post, willBeLiked)
    } catch (error) {
      console.error('Failed to toggle like:', error)

      
      setPosts(currentPosts => currentPosts.map(p =>
        p.id === post.id
          ? {
            ...p,
            is_liked: currentPost.is_liked,
            like_count: currentPost.like_count
          }
          : p
      ))
      throw error
    }
  }, [posts])

  const deletePost = useCallback(async (postId: number) => {
    
    const originalPosts = posts
    setPosts(currentPosts => currentPosts.filter(post => post.id !== postId))

    try {
      await api.deletePost(postId)
    } catch (error) {
      console.error('Failed to delete post:', error)
      
      setPosts(originalPosts)
      throw error
    }
  }, [posts])

  const refreshPosts = useCallback(async () => {
    await fetchPosts()
  }, [fetchPosts])

  const markAsRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    posts,
    isLoading,
    error,
    unreadCount,
    isConnected,
    createPost,
    likePost,
    deletePost,
    refreshPosts,
    markAsRead
  }
}
