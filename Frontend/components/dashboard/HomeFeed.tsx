'use client'
import PostCard from './PostCard'
import CreatePost from './CreatePost'
import { Post } from '@/lib/api'
import { Plus } from 'lucide-react'

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
  availableUsers: any[]
  loadingUsers: boolean
  onCreatePost: () => Promise<void>
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
  onCreatePost
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
      {/* Create Post Section - Inline */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base"
        >
          <Plus className="w-5 h-5 mr-2" />
          What's on your mind?
        </button>
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
