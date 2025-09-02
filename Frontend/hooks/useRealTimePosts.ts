'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type APIPost, type PostResponse } from '@/lib/api'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import { useAuth } from '@/context/AuthContext'

export function useRealTimePosts() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<APIPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const lastFetchTime = useRef<number>(Date.now())

  const { performUpdate: optimisticUpdate } = useOptimisticUpdate(posts, {
    onError: (error, rollbackData) => {
      console.error('Optimistic update failed:', error)
      if (rollbackData) {
        setPosts(rollbackData)
      }
    }
  })

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
      return await optimisticUpdate(
        (currentPosts) => {
          // Create optimistic post
          const optimisticPost: APIPost = {
            id: Date.now(), // Temporary ID
            user_id: user?.id || 0,
            content: postData.content,
            image_url: postData.image_url,
            privacy: postData.privacy || 'public',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user: user!,
            like_count: 0,
            comment_count: 0,
            is_liked: false,
            comments: []
          }
          return [optimisticPost, ...currentPosts]
        },
        async () => {
          const response = await api.createPost(postData)
          // Refresh posts to get the real data with correct ID
          await fetchPosts()
          return response
        }
      )
    } catch (err: any) {
      console.error('Failed to create post:', err)
      throw err
    }
  }, [optimisticUpdate, user, fetchPosts])

  const likePost = useCallback(async (postId: number) => {
    try {
      return await optimisticUpdate(
        (currentPosts) => currentPosts.map(post => 
          post.id === postId
            ? {
                ...post,
                is_liked: !post.is_liked,
                like_count: post.is_liked 
                  ? Math.max(0, post.like_count - 1)
                  : post.like_count + 1
              }
            : post
        ),
        () => api.likePost(postId)
      )
    } catch (err: any) {
      console.error('Failed to like post:', err)
      throw err
    }
  }, [optimisticUpdate])

  const deletePost = useCallback(async (postId: number) => {
    try {
      return await optimisticUpdate(
        (currentPosts) => currentPosts.filter(post => post.id !== postId),
        () => api.deletePost(postId)
      )
    } catch (err: any) {
      console.error('Failed to delete post:', err)
      throw err
    }
  }, [optimisticUpdate])

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
