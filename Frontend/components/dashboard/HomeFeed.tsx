'use client'
import { TrendingUp, Activity, Wifi, WifiOff, RefreshCw, Users, UserCheck, Heart, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'
import PostCard from './PostCard'
import { Post, APIPost } from '@/lib/api'
import { useRealTimePosts, useConnectionStatus, useDocumentTitle } from '@/hooks'

interface HomeFeedProps {
  setActiveTab: (tab: string) => void
}

type FeedFilter = 'all' | 'followers' | 'friends' | 'favorites'

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

export default function HomeFeed({
  setActiveTab
}: HomeFeedProps) {
  // Feed filter state
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all')
  
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

  // Filter posts based on active filter
  const filteredPosts = posts.filter(post => {
    switch (activeFilter) {
      case 'all':
        return true
      case 'followers':
        // TODO: Add logic to filter posts from followers only
        return true
      case 'friends':
        // TODO: Add logic to filter posts from friends only
        return true
      case 'favorites':
        // TODO: Add logic to filter favorited posts only
        return post.is_liked // For now, show liked posts as favorites
      default:
        return true
    }
  })

  const feedFilters = [
    { id: 'all' as FeedFilter, label: 'All', icon: Filter, count: posts.length },
    { id: 'followers' as FeedFilter, label: 'Followers', icon: Users, count: posts.length },
    { id: 'friends' as FeedFilter, label: 'Friends', icon: UserCheck, count: posts.length },
    { id: 'favorites' as FeedFilter, label: 'Favorites', icon: Heart, count: posts.filter(p => p.is_liked).length }
  ]

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Feed Filter Tabs */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg lg:text-xl font-bold text-white">Feed</h2>
          <div className="flex flex-wrap gap-2">
            {feedFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm font-medium ${
                  activeFilter === filter.id
                    ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-400/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
                }`}
              >
                <filter.icon className="w-3 h-3 lg:w-4 lg:h-4" />
                <span>{filter.label}</span>
                {filter.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeFilter === filter.id
                      ? 'bg-emerald-500/30 text-emerald-200'
                      : 'bg-white/20 text-white/60'
                  }`}>
                    {filter.count > 99 ? '99+' : filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

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
        {!isLoading && filteredPosts.length === 0 ? (
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-8 text-center">
            <p className="text-white/60 text-lg">
              {activeFilter === 'all' ? 'No posts to show' : `No ${activeFilter} posts to show`}
            </p>
            <p className="text-white/40 text-sm mt-2">
              {activeFilter === 'all' 
                ? 'Start following people or join groups to see posts in your feed!' 
                : `Try switching to "All" to see more posts, or interact with more ${activeFilter} content.`
              }
            </p>
          </div>
        ) : (
          filteredPosts.map((apiPost) => (
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
