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

  // WebSocket subscription for real-time updates
  const { isConnected } = useWebSocketSubscription({
    messageTypes: ['post_update', 'like_update', 'comment_update', 'like'],
    onMessage: (message) => {
      const now = Date.now()

      switch (message.type) {
        case 'post_update':
          if (message.data) {
            if (message.action === 'created' && message.data.post) {
              const newPost = message.data.post as APIPost
              // Only show as unread if not from current user and newer than last fetch
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
      setUnreadCount(0) // Reset unread count on manual fetch
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
      // Refresh posts to get the real data with correct ID
      await fetchPosts()
      return response
    } catch (err: any) {
      console.error('Failed to create post:', err)
      throw err
    }
  }, [user, fetchPosts])

  const likePost = useCallback(async (postId: number) => {
    // Find the current post to determine the optimistic update
    const currentPost = posts.find(post => post.id === postId)
    if (!currentPost) return

    const willBeLiked = !currentPost.is_liked

    // Apply optimistic update immediately
    setPosts(currentPosts => currentPosts.map(post =>
      post.id === postId
        ? {
          ...post,
          is_liked: willBeLiked,
          like_count: willBeLiked
            ? post.like_count + 1
            : Math.max(0, post.like_count - 1)
        }
        : post
    ))

    try {
      // Call the appropriate API method based on the new state
      if (willBeLiked) {
        await api.likePost(postId)
      } else {
        await api.unlikePost(postId)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)

      // Rollback the optimistic update on error
      setPosts(currentPosts => currentPosts.map(post =>
        post.id === postId
          ? {
            ...post,
            is_liked: currentPost.is_liked,
            like_count: currentPost.like_count
          }
          : post
      ))
      throw error
    }
  }, [posts])

  const deletePost = useCallback(async (postId: number) => {
    // Apply optimistic update immediately
    const originalPosts = posts
    setPosts(currentPosts => currentPosts.filter(post => post.id !== postId))

    try {
      await api.deletePost(postId)
    } catch (error) {
      console.error('Failed to delete post:', error)
      // Rollback the optimistic update on error
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

  // Initial load
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
