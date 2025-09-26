'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { Heart, MessageCircle, User } from 'lucide-react'
import { useConnectionStatus, useOnlineStatus } from '@/hooks'
import Image from 'next/image'

type GroupPost = {
  id: string
  content: string
  image?: string
  created_at: string
  user: {
    id: string
    first_name: string
    last_name: string
    nickname?: string
  }
  likes_count: number
  comments_count: number
  is_liked: boolean
}

type Props = {
  groupId: string
}

export default function GroupFeed({ groupId }: Props) {
  const toast = useToast()
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Real-time hooks
  const { isConnected } = useConnectionStatus()
  const { onlineUsers } = useOnlineStatus()

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/groups/${groupId}/posts`, {
        credentials: 'include'
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch posts (${res.status})`)
      }

      const data = await res.json()
      setPosts(data.posts || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load posts'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [groupId, toast])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  async function handleLike(postId: string) {
    if (!isConnected) return

    const post = posts.find(p => p.id === postId)
    if (!post) return

    const optimisticPost = {
      ...post,
      is_liked: !post.is_liked,
      likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
    }

    // Immediately update UI
    setPosts(prev => prev.map(p =>
      p.id === postId ? optimisticPost : p
    ))

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!res.ok) {
        throw new Error('Failed to like post')
      }
    } catch {
      // Revert on error
      setPosts(prev => prev.map(p =>
        p.id === postId ? post : p
      ))
      toast.error('Failed to like post')
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-2 rounded">
            Connection issues - posts may not update in real-time
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-4 rounded w-1/4 mb-2"></div>
            <div className="bg-gray-200 h-16 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        {!isConnected && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-2 rounded mb-4">
            Connection issues detected
          </div>
        )}
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchPosts}
          disabled={!isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No posts yet. Be the first to share something with the group!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-2 rounded">
          Connection lost - posts may not update in real-time
        </div>
      )}
      
      {posts.map(post => {
        // Check if post author is online
        const isAuthorOnline = onlineUsers.some(u => u.user_id.toString() === post.user.id && u.status === 'online')
        
        return (
          <div key={post.id} className="bg-white rounded-lg shadow p-4">
            {/* Post Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-medium">
                    {post.user.nickname || `${post.user.first_name} ${post.user.last_name}`}
                  </p>
                  {isAuthorOnline && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-600 text-xs">Online</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>

          {/* Post Content */}
          <div className="mb-3">
            <p className="whitespace-pre-wrap">{post.content}</p>
            {post.image && (
              <Image
                src={post.image}
                alt="Post image"
                width={640}
                height={256}
                className="mt-3 max-w-full h-auto rounded-lg"
              />
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center space-x-4 pt-3 border-t">
            <button
              onClick={() => handleLike(post.id)}
              disabled={!isConnected}
              className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
                post.is_liked
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:bg-gray-50'
              } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!isConnected ? 'Connection required to like posts' : ''}
            >
              <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likes_count}</span>
            </button>

            <button 
              className="flex items-center space-x-1 px-3 py-1 rounded text-gray-600 hover:bg-gray-50"
              disabled={!isConnected}
              title={!isConnected ? 'Connection required to view comments' : ''}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.comments_count}</span>
            </button>
          </div>
        </div>
        )
      })}
    </div>
  )
}
