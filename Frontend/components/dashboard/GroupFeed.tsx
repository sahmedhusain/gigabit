'use client'

import React, { useState, useEffect, useContext } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Heart, MessageCircle, User } from 'lucide-react'

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
  const { user } = useAuth()
  const toast = useToast()
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [groupId])

  async function fetchPosts() {
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
    } catch (err: any) {
      setError(err.message || 'Failed to load posts')
      toast.error(err.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!res.ok) {
        throw new Error('Failed to like post')
      }

      // Update local state
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
          }
          : post
      ))
    } catch (err: any) {
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
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchPosts}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-lg shadow p-4">
          {/* Post Header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="font-medium">
                {post.user.nickname || `${post.user.first_name} ${post.user.last_name}`}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(post.created_at)}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-3">
            <p className="whitespace-pre-wrap">{post.content}</p>
            {post.image && (
              <img
                src={post.image}
                alt="Post image"
                className="mt-3 max-w-full h-auto rounded-lg"
              />
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center space-x-4 pt-3 border-t">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center space-x-1 px-3 py-1 rounded ${post.is_liked
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likes_count}</span>
            </button>

            <button className="flex items-center space-x-1 px-3 py-1 rounded text-gray-600 hover:bg-gray-50">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.comments_count}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
