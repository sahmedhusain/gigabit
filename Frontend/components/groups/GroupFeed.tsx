'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react'
import { useConnectionStatus } from '@/hooks'
import { api, type PostResponse } from '@/lib/api'
import Image from 'next/image'
import { getUserInitials } from '@/utils/avatarUtils'

type Props = {
  groupId: string
}

export default function GroupFeed({ groupId }: Props) {
  const toast = useToast()
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  
  const { isConnected } = useConnectionStatus()

  
  useEffect(() => {
    if (!isConnected) return

    
    
    
    return () => {
      
    }
  }, [isConnected, groupId])

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getGroupPosts(parseInt(groupId))
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

  async function handleLike(postId: number) {
    if (!isConnected) return

    const post = posts.find(p => p.id === postId)
    if (!post) return

    const optimisticPost = {
      ...post,
      is_liked: !post.is_liked,
      like_count: post.is_liked ? post.like_count - 1 : post.like_count + 1
    }

    
    setPosts(prev => prev.map(p =>
      p.id === postId ? optimisticPost : p
    ))

    try {
      if (post.is_liked) {
        await api.unlikeGroupPost(parseInt(groupId), postId)
      } else {
        await api.likeGroupPost(parseInt(groupId), postId)
      }
    } catch {
      
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
      <div className="space-y-6">
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="bg-orange-500/10 border border-orange-400/20 text-orange-400 px-4 py-3 rounded-xl">
            Connection issues - posts may not update in real-time
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="bg-white/10 h-4 rounded-xl w-1/4 mb-4"></div>
            <div className="bg-white/10 h-16 rounded-xl mb-4"></div>
            <div className="bg-white/10 h-4 rounded-xl w-1/6"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        {!isConnected && (
          <div className="bg-orange-500/10 border border-orange-400/20 text-orange-400 px-4 py-3 rounded-xl mb-4">
            Connection issues detected
          </div>
        )}
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchPosts}
          disabled={!isConnected}
          className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <h4 className="text-xl font-semibold text-white mb-2">No posts yet</h4>
        <p className="text-white/70">Be the first to share something with the group!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-orange-500/10 border border-orange-400/20 text-orange-400 px-4 py-3 rounded-xl">
          Connection lost - posts may not update in real-time
        </div>
      )}
      
      {posts.map(post => {
        return (
          <div key={post.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  {post.user.avatar ? (
                    <Image
                      src={post.user.avatar}
                      alt={`${post.user.first_name} ${post.user.last_name}`}
                      width={48}
                      height={48}
                      unoptimized={true}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {getUserInitials(post.user)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-white">
                      {post.user.nickname || `${post.user.first_name} ${post.user.last_name}`}
                    </p>
                  </div>
                  <p className="text-sm text-white/60">
                    {formatDate(post.created_at)}
                  </p>
                </div>
              </div>
              
              <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200" title="More options">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-white whitespace-pre-wrap mb-3">{post.content}</p>
              {post.image_url && (
                <div className="rounded-xl overflow-hidden">
                  <Image
                    src={post.image_url}
                    alt="Post image"
                width={640}
                height={256}
                unoptimized={true}
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="flex items-center space-x-6 pt-4 border-t border-white/10">
              <button
                onClick={() => handleLike(post.id)}
                disabled={!isConnected}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  post.is_liked
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!isConnected ? 'Connection required to like posts' : ''}
              >
                <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                <span className="font-medium">{post.like_count}</span>
              </button>

              <button 
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                disabled={!isConnected}
                title={!isConnected ? 'Connection required to view comments' : ''}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{post.comment_count}</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
