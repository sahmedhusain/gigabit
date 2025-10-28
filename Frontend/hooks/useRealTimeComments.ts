'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type Comment } from '@/lib/api'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import { useAuth } from '@/context/AuthContext'

export function useRealTimeComments(postId: number) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCommentsCount, setNewCommentsCount] = useState(0)
  const lastFetchTime = useRef<number>(Date.now())

  const { performUpdate: optimisticUpdate } = useOptimisticUpdate(comments, {
    onError: (error, rollbackData) => {
      console.error('Comment optimistic update failed:', error)
      if (rollbackData) {
        setComments(rollbackData)
      }
    }
  })

  
  const { isConnected } = useWebSocketSubscription({
    messageTypes: ['comment_update'],
    onMessage: (message) => {
      
      if (message.post_id !== postId) return

      const now = Date.now()
      
      if (message.type === 'comment_update' && message.data) {
        if (message.action === 'created' && message.data.comment) {
          const newComment = message.data.comment as Comment
          
          if (newComment.user_id !== user?.id && now > lastFetchTime.current) {
            setNewCommentsCount(prev => prev + 1)
          }
          setComments(prev => [...prev, newComment])
        } else if (message.action === 'updated' && message.data.comment_id) {
          setComments(prev => prev.map(comment =>
            comment.id === message.data.comment_id
              ? { ...comment, ...message.data.updates }
              : comment
          ))
        } else if (message.action === 'deleted' && message.data.comment_id) {
          setComments(prev => prev.filter(comment => comment.id !== message.data.comment_id))
        }
      }
    }
  })

  const fetchComments = useCallback(async (limit = 20, offset = 0) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await api.getPostComments(postId, limit, offset)
      const commentsData = response.comments || []
      
      setComments(Array.isArray(commentsData) ? commentsData : [])
      lastFetchTime.current = Date.now()
      setNewCommentsCount(0) 
    } catch (err: any) {
      console.error('Failed to fetch comments:', err)
      setError(err.message || 'Failed to fetch comments')
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  const createComment = useCallback(async (commentData: { content: string; image_url?: string }) => {
    if (!user) {
      throw new Error('User must be logged in to comment')
    }

    try {
      return await optimisticUpdate(
        (currentComments) => {
          
          const optimisticComment: Comment = {
            id: Date.now(), 
            user_id: user.id,
            post_id: postId,
            content: commentData.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user: user
          }
          return [...(currentComments || []), optimisticComment]
        },
        async () => {
          const response = await api.createComment(postId, commentData)
          
          await fetchComments()
          return response
        }
      )
    } catch (err: any) {
      console.error('Failed to create comment:', err)
      throw err
    }
  }, [optimisticUpdate, user, postId, fetchComments])

  const refreshComments = useCallback(async () => {
    await fetchComments()
  }, [fetchComments])

  const markNewCommentsAsRead = useCallback(() => {
    setNewCommentsCount(0)
  }, [])

  
  useEffect(() => {
    if (postId) {
      fetchComments()
    }
  }, [postId, fetchComments])

  return {
    comments,
    isLoading,
    error,
    newCommentsCount,
    isConnected,
    createComment,
    refreshComments,
    markNewCommentsAsRead
  }
}
