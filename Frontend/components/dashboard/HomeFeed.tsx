'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, Activity, Wifi, WifiOff, RefreshCw, Users, UserCheck, Heart, Filter, Globe, Lock, EyeOff, MessageCircle, Share, Sparkles } from 'lucide-react'
import PostCard from './PostCard'
import CreatePost from './CreatePost'
import { Post } from '@/lib/api'
import { Plus } from 'lucide-react'
import { useRealTimePosts } from '@/hooks/useRealTimePosts'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRouter } from 'next/navigation'

type FeedFilter = 'all' | 'followers' | 'friends' | 'favorites'

interface HomeFeedProps {
  posts: Post[]
  onPostLike: (postId: number) => void
  setActiveTab: (tab: string) => void
  showCreatePost: boolean
  setShowCreatePost: (show: boolean) => void
  newPostContent: string
  setNewPostContent: (content: string) => void
  newPostImage: File | null
  setNewPostImage: (image: File | null) => void
  postPrivacy: string
  setPostPrivacy: (privacy: string) => void
  selectedUsers: number[]
  setSelectedUsers: (users: number[]) => void
  availableUsers: { id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; display_name?: string; }[]
  loadingUsers: boolean
  onCreatePost: () => Promise<void>
  feedSubTab: string
  setFeedSubTab: (tab: string) => void
}

export default function HomeFeed({
  posts,
  onPostLike,
  setActiveTab,
  showCreatePost,
  setShowCreatePost,
  newPostContent,
  setNewPostContent,
  newPostImage,
  setNewPostImage,
  postPrivacy,
  setPostPrivacy,
  selectedUsers,
  setSelectedUsers,
  availableUsers,
  loadingUsers,
  onCreatePost,
  feedSubTab,
  setFeedSubTab
}: HomeFeedProps) {
  const router = useRouter()
  // Feed filter state
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all')
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)

  // Use real-time posts hook
  const {
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

  // Transform API posts to expected Post format
  const transformPost = (apiPost: any): Post => {
    return {
      ...apiPost,
      likes: apiPost.likes || 0,
      shares: apiPost.shares || 0,
      timeAgo: apiPost.timeAgo || 'Just now',
      isLiked: apiPost.isLiked || apiPost.is_liked || false
    }
  }

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

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4" />
      case 'private':
        return <Lock className="w-4 h-4" />
      case 'almost_private':
        return <EyeOff className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  // Filter posts based on active filter
  const filteredPosts = () => {
    switch (feedSubTab) {
      case 'following':
        return posts // Filter posts from users the current user follows
      case 'friends':
        return posts // Filter posts from mutual followers
      default:
        return posts // All posts
    }
  }

  const renderPost = (post: Post) => (
    <div
      key={post.id}
      className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all"
    >
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
          {post.user.avatar ? (
            <img
              src={post.user.avatar}
              alt={post.user.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            post.user.name[0]?.toUpperCase()
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-white font-medium">{post.user.name}</h3>
              <p className="text-white/60 text-sm">@{post.user.username}</p>
            </div>
            <div className="flex items-center space-x-2 text-white/60 text-sm">
              {getPrivacyIcon(post.privacy)}
              <span>{post.timeAgo}</span>
            </div>
          </div>
          
          <p className="text-white/80 mb-4 leading-relaxed">{post.content}</p>
          
          {post.image && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={post.image}
                alt="Post content"
                className="w-full h-64 object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => onPostLike(post.id)}
                className={`flex items-center space-x-2 transition-all ${
                  post.isLiked
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-white/60 hover:text-red-400'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes}</span>
              </button>
              
              <button className="flex items-center space-x-2 text-white/60 hover:text-blue-400 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>{post.comments}</span>
              </button>
              
              <button className="flex items-center space-x-2 text-white/60 hover:text-emerald-400 transition-colors">
                <Share className="w-5 h-5" />
                <span>{post.shares}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    const postsToShow = filteredPosts()
    
    if (isLoadingPosts) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )
    }

    if (postsToShow.length === 0) {
      return (
        <div className="text-center py-16">
          <Sparkles className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 mb-2">No posts found</p>
          <p className="text-white/40 text-sm">
            {feedSubTab === 'following' && "Start following users to see their posts here"}
            {feedSubTab === 'friends' && "Connect with friends to see their posts here"}
            {feedSubTab === 'all' && "Be the first to share something!"}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {postsToShow.map(renderPost)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {feedSubTab === 'all' && 'All Posts'}
            {feedSubTab === 'following' && 'Following'}
            {feedSubTab === 'friends' && 'Friends'}
          </h1>
          <p className="text-white/70">
            {feedSubTab === 'all' && 'Stay connected with your network'}
            {feedSubTab === 'following' && 'Posts from people you follow'}
            {feedSubTab === 'friends' && 'Posts from your friends'}
          </p>
        </div>
        <button
          onClick={() => setShowCreatePost(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {renderContent()}
      </div>

      {/* Create Post Modal */}
      <CreatePost
        show={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        newPostImage={newPostImage}
        setNewPostImage={setNewPostImage}
        postPrivacy={postPrivacy}
        setPostPrivacy={setPostPrivacy}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        availableUsers={availableUsers}
        loadingUsers={loadingUsers}
        onCreatePost={onCreatePost}
      />
    </div>
  )
}
