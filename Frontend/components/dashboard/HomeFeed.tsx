'use client'
import { TrendingUp, Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import PostCard from './PostCard'
import { Post, APIPost } from '@/lib/api'
import { useRealTimePosts, useConnectionStatus, useDocumentTitle } from '@/hooks'

interface HomeFeedProps {
  setActiveTab: (tab: string) => void
}

// Transform APIPost to Post interface for compatibility
const transformPost = (apiPost: APIPost): Post => {
  const timeAgo = new Date(apiPost.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return {
    id: apiPost.id,
    user: {
      name: `${apiPost.user.first_name} ${apiPost.user.last_name}`,
      username: apiPost.user.nickname || apiPost.user.email.split('@')[0],
      avatar: apiPost.user.avatar || ''
    },
    content: apiPost.content,
    image: apiPost.image_url,
    likes: apiPost.like_count,
    comments: apiPost.comment_count,
    shares: 0, // Not available in APIPost
    timeAgo,
    privacy: apiPost.privacy,
    isLiked: apiPost.is_liked
  }
}

interface HomeFeedProps {
  setActiveTab: (tab: string) => void
}

export default function HomeFeed({
  setActiveTab
}: HomeFeedProps) {
  // Use real-time posts hook
  const {
    posts,
    isLoading,
    error,
    unreadCount,
    isConnected,
    likePost,
    refreshPosts,
    markAsRead
  } = useRealTimePosts()

  const { connectionQuality, statusMessage } = useConnectionStatus()
  
  // Update document title with unread count
  const { setUnread, setPageTitle } = useDocumentTitle()

  useEffect(() => {
    setPageTitle('Home')
    setUnread(unreadCount)
  }, [unreadCount, setPageTitle, setUnread])

  // Mark posts as read when user scrolls or interacts
  useEffect(() => {
    const handleScroll = () => {
      if (unreadCount > 0) {
        markAsRead()
      }
    }

    const handleFocus = () => {
      if (unreadCount > 0) {
        markAsRead()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('focus', handleFocus)
    }
  }, [unreadCount, markAsRead])

  const handlePostLike = async (postId: number) => {
    try {
      await likePost(postId)
    } catch (error) {
      console.error('Failed to like post:', error)
    }
  }

  const handleRefresh = () => {
    refreshPosts()
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Connection Status & Unread Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            connectionQuality === 'excellent' ? 'bg-green-500/20 text-green-400' :
            connectionQuality === 'good' ? 'bg-yellow-500/20 text-yellow-400' :
            connectionQuality === 'poor' ? 'bg-orange-500/20 text-orange-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{statusMessage}</span>
          </div>

          {/* Unread Count */}
          {unreadCount > 0 && (
            <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <span>{unreadCount} new post{unreadCount > 1 ? 's' : ''}</span>
              <button
                onClick={handleRefresh}
                title="Refresh posts"
                className="hover:text-blue-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          title="Refresh posts"
          className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={handleRefresh}
              title="Retry loading posts"
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && posts.length === 0 && (
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-white/60 text-lg">Loading posts...</p>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4 lg:space-y-6">
        {!isLoading && posts.length === 0 ? (
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-8 text-center">
            <p className="text-white/60 text-lg">No posts to show</p>
            <p className="text-white/40 text-sm mt-2">Start following people or join groups to see posts in your feed!</p>
          </div>
        ) : (
          posts.map((apiPost) => (
            <PostCard
              key={apiPost.id}
              post={transformPost(apiPost)}
              onLike={handlePostLike}
            />
          ))
        )}
      </div>

      {/* Loading More Indicator */}
      {isLoading && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      )}
    </div>
  )
}
