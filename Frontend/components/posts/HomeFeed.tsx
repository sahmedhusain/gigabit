'use client'
import { useState, useEffect } from 'react'
import { Heart, Globe, Lock, EyeOff, MessageSquare, Sparkles, Bookmark, Send, MoreHorizontal, User, Image as ImageIcon, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import CreatePost from './CreatePost'
import ManagePrivacy from '../profile/ManagePrivacy'
import { Post } from '@/types/posts'
import { Plus } from 'lucide-react'
import { useRealTimePosts } from '@/hooks/useRealTimePosts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import Image from 'next/image'
import { getAvatarUrl, getUserInitials } from '@/utils/avatarUtils'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import SharePopup from '../ui/SharePopup'
import { HomeFeedProps } from '@/types/posts'

export default function HomeFeed({
  posts,
  onPostLike,
  onPostBookmark,
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
  sortOrder,
  setSortOrder,
  hasMoreResults = false,
  isLoadingMore = false,
  onLoadMore,
  resultsContainerRef
}: HomeFeedProps) {
  const router = useRouter()
  
  const [isLoadingPosts] = useState(false)

  
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [selectedPostForComment, setSelectedPostForComment] = useState<Post | null>(null)
  const [newComment, setNewComment] = useState('')
  const [newCommentImage, setNewCommentImage] = useState<File | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Share popup state
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)
  const [selectedPostForShare, setSelectedPostForShare] = useState<Post | null>(null)

  // Use real-time posts hook
  const {
    unreadCount,
    markAsRead
  } = useRealTimePosts()

  const { success, error } = useToast()
  const { user } = useAuth()

  // Three-dot menu state
  const [openMenu, setOpenMenu] = useState<{[key: number]: boolean}>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{[key: number]: boolean}>({})
  const [isDeleting, setIsDeleting] = useState<{[key: number]: boolean}>({})

  // Privacy management state
  const [showManagePrivacy, setShowManagePrivacy] = useState<{[key: number]: boolean}>({})
  const [currentSelectedUsers, setCurrentSelectedUsers] = useState<{[key: number]: number[]}>({})

  // Update document title with unread count
  const { setUnread, setPageTitle } = useDocumentTitle()

  useEffect(() => {
    setPageTitle('Home')
    setUnread(unreadCount)
  }, [unreadCount, setPageTitle, setUnread])

  
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

  const handlePostClick = (postId: number, e: React.MouseEvent) => {
    
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    const url = `/post/${postId}?from=feed&subTab=${feedSubTab}`
    router.push(url)
  }

  const handleCommentClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPostForComment(post)
    setIsCommentModalOpen(true)
  }

  const handleShareClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPostForShare(post)
    setIsSharePopupOpen(true)
  }

  const canDeletePost = (post: Post) => {
    return user && user.id === post.user.id
  }

  const handleDeletePost = (postId: number) => {
    setShowDeleteConfirm(prev => ({ ...prev, [postId]: true }))
  }

  const confirmDeletePost = async (postId: number) => {
    setIsDeleting(prev => ({ ...prev, [postId]: true }))
    try {
      await api.deletePost(postId)
      success('Post deleted!')
      
      window.location.reload() 
    } catch (err) {
      console.error('Failed to delete post:', err)
      error('Failed to delete post. Please try again.')
    } finally {
      setIsDeleting(prev => ({ ...prev, [postId]: false }))
      setShowDeleteConfirm(prev => ({ ...prev, [postId]: false }))
      setOpenMenu(prev => ({ ...prev, [postId]: false }))
    }
  }

  const handleManagePrivacy = async (postId: number) => {
    try {
      
      const postDetails = await api.getPost(postId)
      setCurrentSelectedUsers(prev => ({
        ...prev,
        [postId]: postDetails.specific_user_ids || []
      }))
    } catch (err) {
      console.error('Failed to fetch post details:', err)
      
      setCurrentSelectedUsers(prev => ({
        ...prev,
        [postId]: []
      }))
    }
    setShowManagePrivacy(prev => ({ ...prev, [postId]: true }))
    setOpenMenu(prev => ({ ...prev, [postId]: false }))
  }

  const handleUpdatePrivacy = async (postId: number, privacy: 'public' | 'followers' | 'friends' | 'listed', selectedUsers: number[]) => {
    try {
      await api.updatePost(postId, {
        privacy: privacy,
        specific_user_ids: selectedUsers
      })
      success('Post privacy updated!')
      
      window.location.reload()
    } catch (err) {
      console.error('Failed to update privacy:', err)
      error('Failed to update privacy. Please try again.')
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() && !newCommentImage || !selectedPostForComment) return

    try {
      setIsSubmittingComment(true)
      let imageUrl = ''

      if (newCommentImage) {
        const formData = new FormData()
        formData.append('image', newCommentImage)
        const token = localStorage.getItem('token')
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/uploads`, {
          method: 'POST',
          body: formData,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: 'include'
        })
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = `/api/images/${uploadData.filename}`
        } else {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Failed to upload image')
        }
      }

      
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/posts/${selectedPostForComment.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment.trim(),
          image_url: imageUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create comment')
      }

      
      setNewComment('')
      setNewCommentImage(null)
      setIsCommentModalOpen(false)
      setSelectedPostForComment(null)
      success('Comment posted!')
    } catch (err) {
      console.error('Error submitting comment:', err)
      error('Failed to post comment. Please try again.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4" />
      case 'followers':
        return <EyeOff className="w-4 h-4" />
      case 'friends':
        return <Lock className="w-4 h-4" />
      case 'listed':
        return <User className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  
  const filteredPosts = () => {
    let filtered = posts

    
    switch (feedSubTab) {
      case 'following':
        filtered = posts 
        break
      case 'friends':
        filtered = posts 
        break
      default:
        filtered = posts 
        break
    }

    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()

      if (sortOrder === 'newest') {
        return dateB - dateA 
      } else {
        return dateA - dateB 
      }
    })
  }

  const renderPost = (post: Post, index: number) => {
    const animationDelay = index < 6 ? `animation-delay-${index * 100}` : 'animation-delay-500'
    return (
      <div
        key={post.id}
        className={`bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer animate-fade-in animate-slide-in-from-bottom ${animationDelay}`}
        onClick={(e) => handlePostClick(post.id, e)}
      >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          {/* Clickable Avatar */}
          <div
            className="relative group cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              if (post.user.id && post.user.id !== 0) {
                router.push(`/profile/${post.user.id}`)
              }
            }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/20 group-hover:ring-emerald-400/50 transition-all duration-300">
              {getAvatarUrl(post.user.avatar) ? (
                <Image
                  src={getAvatarUrl(post.user.avatar)!}
                  alt={`${post.user.name}'s avatar`}
                  width={48}
                  height={48}
                  unoptimized={true}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                  {getUserInitials({first_name: post.user.name?.split(' ')[0], last_name: post.user.name?.split(' ')[1] || post.user.name?.split(' ')[0]})}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            {/* Clickable Full Name */}
            <div
              className="group cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                if (post.user.id && post.user.id !== 0) {
                  router.push(`/profile/${post.user.id}`)
                }
              }}
            >
              <span
                className="text-white font-semibold text-lg hover:text-emerald-300 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation()
                  if (post.user.id && post.user.id !== 0) {
                    router.push(`/profile/${post.user.id}`)
                  }
                }}
              >
                {post.user.name}
              </span>
            </div>

            {/* Clickable Username and Time */}
            <p
              className="text-white/70 text-sm cursor-pointer hover:text-white/90 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation()
                if (post.user.id && post.user.id !== 0) {
                  router.push(`/profile/${post.user.id}`)
                }
              }}
            >
              @{post.user.username} • {post.timeAgo}
            </p>
          </div>
        </div>

        {/* Privacy Indicator */}
        <div className="flex items-center space-x-2 text-white/60">
          {getPrivacyIcon(post.privacy)}
          <span className="text-xs capitalize">{post.privacy}</span>
        </div>

        {canDeletePost(post) && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenu(prev => ({ ...prev, [post.id]: !prev[post.id] }))
              }}
              className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
              title="More options"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {openMenu[post.id] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleManagePrivacy(post.id)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Manage Privacy</span>
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete Post</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Post Image */}
          {post.image && (
            <div className="mb-4 flex justify-center">
              <div className="inline-block border border-white/20 rounded-2xl overflow-hidden">
                <Image
                  src={post.image}
                  alt="Post image"
                  width={640}
                  height={256}
                  unoptimized={true}
                  className="max-h-64 sm:max-h-80 md:max-h-96 object-contain hover:scale-105 transition-transform duration-500 rounded-2xl"
                />
              </div>
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPostLike(post.id)
                }}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  post.isLiked
                    ? 'text-red-400 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30'
                    : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
                }`}
                title="Like"
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current animate-pulse' : ''}`} />
                <span className="text-sm font-medium">{post.likes}</span>
              </button>

              <button
                onClick={(e) => handleCommentClick(post, e)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                title="Comment"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">{post.comments}</span>
              </button>

              <button
                onClick={(e) => handleShareClick(post, e)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
                title="Share"
              >
                <Send className="w-5 h-5" />
                <span className="text-sm font-medium">{post.shares}</span>
              </button>
            </div>

            {onPostBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPostBookmark(post.id)
                }}
                className={`flex items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  post.isBookmarked
                    ? 'text-yellow-400 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30'
                    : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
                }`}
                title="Bookmark"
              >
                <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
    </div>
    )
  }

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
          <p className="text-white/60 mb-2">
            {feedSubTab === 'following' && 'No posts from following'}
            {feedSubTab === 'friends' && 'No posts from friends'}
            {feedSubTab === 'all' && 'No posts found'}
          </p>
            <p className="text-white/40 text-sm mb-6">
            {feedSubTab === 'following' && 'Start following users to see their posts here'}
            {feedSubTab === 'friends' && 'Connect with friends to see their posts here'}
            {feedSubTab === 'all' && 'Be the first to share something!'}
            </p>

            {feedSubTab === 'following' && (
              <motion.button
                onClick={() => window.location.href = '/discover'}
                className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 rounded-xl border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 flex items-center space-x-2 mx-auto"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="w-4 h-4" />
                <span>Discover People</span>
              </motion.button>
            )}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {postsToShow.map((post, index) => renderPost(post, index))}
        {hasMoreResults && onLoadMore && (
          <div className="flex justify-center py-6">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More Posts</span>
              )}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header */}
      <div className="flex-shrink-0 mb-4 animate-header-in">
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-4 hover:shadow-emerald-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Header Icon */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
                  {feedSubTab === 'all' && <Sparkles className="w-5 h-5 text-white drop-shadow-sm" />}
                  {feedSubTab === 'following' && <Heart className="w-5 h-5 text-white drop-shadow-sm" />}
                  {feedSubTab === 'friends' && <User className="w-5 h-5 text-white drop-shadow-sm" />}
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>

              {/* Title and Description */}
              <div className="flex-1">
                <h1 className="text-xl lg:text-2xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors duration-300">
                  {feedSubTab === 'all' && 'All Posts'}
                  {feedSubTab === 'following' && 'Following'}
                  {feedSubTab === 'friends' && 'Friends'}
                </h1>
                <p className="text-white/80 text-sm leading-relaxed">
                  {feedSubTab === 'all' && 'Stay connected with your network and discover amazing content'}
                  {feedSubTab === 'following' && 'Posts from people you follow and care about'}
                  {feedSubTab === 'friends' && 'Content shared by your closest friends and connections'}
                </p>
              </div>
            </div>

            {/* Sort Toggle and Create Post Button */}
            <div className="flex items-center space-x-3">
              {/* Sort Toggle */}
              <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/20">
                <button
                  onClick={() => setSortOrder('newest')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortOrder === 'newest'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                  <span>Newest</span>
                </button>
                <button
                  onClick={() => setSortOrder('oldest')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortOrder === 'oldest'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ArrowDown className="w-4 h-4" />
                  <span>Oldest</span>
                </button>
              </div>

              {/* Enhanced Create Post Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreatePost(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <Plus className="w-5 h-5 relative z-10" />
                <span className="font-semibold relative z-10">Create Post</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={resultsContainerRef} className="flex-1 overflow-y-scroll scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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

      {/* Manage Privacy Modals */}
      {posts.map((post) => (
        <ManagePrivacy
          key={`privacy-${post.id}`}
          show={showManagePrivacy[post.id] || false}
          onClose={() => setShowManagePrivacy(prev => ({ ...prev, [post.id]: false }))}
          currentPrivacy={post.privacy as 'public' | 'followers' | 'friends' | 'listed'}
          currentSelectedUsers={currentSelectedUsers[post.id] || []}
          availableUsers={availableUsers}
          loadingUsers={loadingUsers}
          onUpdatePrivacy={(privacy, selectedUsers) => handleUpdatePrivacy(post.id, privacy, selectedUsers)}
        />
      ))}

      {/* Comment Modal */}
      {isCommentModalOpen && selectedPostForComment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-[80vh] flex flex-col">
            {/* Enhanced backdrop with multiple layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>

            {/* Fixed Header */}
            <div className="relative flex-shrink-0 p-6 lg:p-8 pb-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <MessageSquare className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">Add Comment</h3>
                    <p className="text-white/60 text-sm">Share your thoughts on this post</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCommentModalOpen(false)
                    setSelectedPostForComment(null)
                    setNewComment('')
                    setNewCommentImage(null)
                  }}
                  className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
                  title="Close"
                >
                  <span className="text-xl group-hover:rotate-90 transition-transform duration-300">✕</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="relative flex-1 overflow-y-auto px-6 lg:px-8">
              <div className="space-y-6">
                {/* Comment Content */}
                <div className="space-y-3">
                  <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>Your Comment</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts, ask questions, or start a discussion..."
                      className="w-full h-32 lg:h-36 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      maxLength={500}
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-white/50">
                      {newComment.length}/500
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                  <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span>Media (Optional)</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <label htmlFor="feed-comment-image-input" className="sr-only">Upload image</label>
                    <input
                      id="feed-comment-image-input"
                      type="file"
                      accept="image/*"
                      onChange={e => setNewCommentImage(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => document.getElementById('feed-comment-image-input')?.click()}
                      title="Add Image or GIF"
                      className="flex items-center px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-white transition-all duration-300 hover:scale-105 text-sm lg:text-base font-medium"
                    >
                      <ImageIcon className="w-5 h-5 mr-3" />
                      Add Image or GIF
                    </button>
                  </div>
                </div>

                {/* Image Preview */}
                {newCommentImage && (
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white text-sm font-semibold">Image Preview:</span>
                      <button
                        onClick={() => setNewCommentImage(null)}
                        title="Remove image"
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
                      >
                        <span className="text-lg">×</span>
                      </button>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="relative w-20 h-20 bg-white/20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={URL.createObjectURL(newCommentImage)}
                          alt="Image preview"
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{newCommentImage.name}</p>
                        <p className="text-white/60 text-xs">
                          {(newCommentImage.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                          Click image to view full preview
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="relative flex-shrink-0 p-6 lg:p-8 pt-4">
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsCommentModalOpen(false)
                    setSelectedPostForComment(null)
                    setNewComment('')
                    setNewCommentImage(null)
                  }}
                  className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitComment}
                  disabled={(!newComment.trim() && !newCommentImage) || isSubmittingComment}
                  className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg ${(!newComment.trim() && !newCommentImage) || isSubmittingComment
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 shadow-emerald-500/25'
                    }`}
                >
                  {isSubmittingComment ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Posting...</span>
                    </div>
                  ) : (
                    'Post Comment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {Object.entries(showDeleteConfirm).some(([, show]) => show) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm({})}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Delete Post</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to delete this post? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm({})}
                    className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    disabled={Object.values(isDeleting).some(deleting => deleting)}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const postId = Object.keys(showDeleteConfirm).find((key) => showDeleteConfirm[parseInt(key)] !== false)
                      if (postId) {
                        confirmDeletePost(parseInt(postId))
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={Object.values(isDeleting).some(deleting => deleting)}
                  >
                    {Object.values(isDeleting).some(deleting => deleting) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Popup */}
      {isSharePopupOpen && selectedPostForShare && (
        <SharePopup
          postId={selectedPostForShare.id}
          isOpen={isSharePopupOpen}
          onClose={() => {
            setIsSharePopupOpen(false)
            setSelectedPostForShare(null)
          }}
          onShareSuccess={() => {
            
            
          }}
        />
      )}
    </div>
  )
}
