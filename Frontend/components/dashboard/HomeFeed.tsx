'use client'
import { TrendingUp, Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import CategoryBadge from '@/components/ui/CategoryBadge'
import PostCard from './PostCard'
import { CategoryResponse, Post, APIPost } from '@/lib/api'
import { useRealTimePosts, useConnectionStatus, useDocumentTitle } from '@/hooks'

interface HomeFeedProps {
  trendingCategories: CategoryResponse[]
  onCategoryClick: (categoryId: number) => void
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
    category: apiPost.category,
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
  trendingCategories: CategoryResponse[]
  onCategoryClick: (categoryId: number) => void
  setActiveTab: (tab: string) => void
}

export default function HomeFeed({
  trendingCategories,
  onCategoryClick,
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

      {/* Trending Categories Section */}
      {trendingCategories.length > 0 && (
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-white font-semibold mb-0 text-base lg:text-lg flex items-center">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
              Trending Categories
            </h3>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-emerald-400 hover:text-emerald-300 text-xs lg:text-sm font-medium transition-colors duration-200"
            >
              View All
            </button>
          </div>
          <div className="flex space-x-2 lg:space-x-3 overflow-x-auto pb-2">
            {trendingCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className="flex-shrink-0 bg-white/5 hover:bg-white/10 rounded-lg lg:rounded-xl p-2 lg:p-3 border border-white/10 hover:border-emerald-400/30 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <CategoryBadge category={category} size="sm" />
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-white/70 text-xs">{category.post_count}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
