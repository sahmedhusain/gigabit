'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Heart, MessageSquare, MoreHorizontal, Send, Image as ImageIcon, Bookmark, X, Trash2, Lock, ArrowUp, ArrowDown } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus, useOptimisticUpdate } from '@/hooks'
import { api, APIPost, Comment as CommentType, NetworkError, User } from '@/lib/api'
import { getAvatarUrl, getUserInitials } from '@/utils/avatarUtils'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import ManagePrivacy from '@/components/profile/ManagePrivacy'
import SharePopup from '@/components/ui/SharePopup'
import ImagePreviewModal from '@/components/ui/ImagePreviewModal'

interface CommentWithUser extends CommentType {
    timeAgo: string
    image_url?: string | null
}

function PostDetailPage() {
  const { user: currentUser } = useAuth()
  const params = useParams() as { id: string }
  const { id } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { sendMessage, addMessageListener, isConnected } = useWebSocket()
  const { success, error } = useToast()
  const { isConnected: connectionStatus } = useConnectionStatus()

  // Get navigation context from URL params
  const from = searchParams?.get('from')
  const subTab = searchParams?.get('subTab')

  // State
  const [post, setPost] = useState<APIPost | null>(null)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [newCommentImage, setNewCommentImage] = useState<File | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [openCommentMenu, setOpenCommentMenu] = useState<number | null>(null)
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null)
  const [showManagePrivacy, setShowManagePrivacy] = useState(false)
  const [selectedPostForPrivacy, setSelectedPostForPrivacy] = useState<APIPost | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest'>('newest')
  const [isSorting, setIsSorting] = useState(false)
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)
  const [selectedPostForShare, setSelectedPostForShare] = useState<APIPost | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

    // Real-time optimistic updates for likes
    const { performUpdate: performOptimisticUpdate, isLoading: likePending } = useOptimisticUpdate(
        post ? { ...post, is_liked: post.is_liked, like_count: post.like_count } : null,
        {
            onError: () => error('Failed to update like')
        }
    )

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

        return date.toLocaleDateString()
    }

    // Fetch post details
    const fetchPost = useCallback(async () => {
        if (!id) return

        try {
            setIsSorting(true)
            const post = await api.getPost(Number(id), commentSort)
            setPost(post)

            // Convert comments to include timeAgo
            if (post.comments) {
                const commentsWithTime: CommentWithUser[] = post.comments.map(comment => ({
                    ...comment,
                    timeAgo: formatTimeAgo(comment.created_at)
                }))
                setComments(commentsWithTime)
            }
        } catch (err) {
            console.error('Error fetching post:', err)
            if (err instanceof NetworkError) {
                error('Failed to load post. Please try again.')
            } else {
                error('Post not found.')
                if (from === 'feed' && subTab) {
                  router.push(`/feed/${subTab}`)
                } else if (from === 'activity' && subTab) {
                  router.push(`/activity/${subTab}`)
                } else if (from === 'profile' && searchParams?.get('userId')) {
                  router.push(`/profile/${searchParams?.get('userId')}`)
                } else {
                  router.push('/feed/all')
                }
            }
        } finally {
            setIsSorting(false)
            setIsLoadingPost(false)
        }
    }, [id, error, from, subTab, searchParams, router, commentSort])

    // Handle like post with optimistic updates
    const handleLikePost = async () => {
        if (!post || !user || likePending) return

        const wasLiked = post.is_liked
        const optimisticPost = {
            ...post,
            is_liked: !post.is_liked,
            like_count: post.is_liked ? post.like_count - 1 : post.like_count + 1
        }

        // Use optimistic update hook
        await performOptimisticUpdate(() => optimisticPost, async () => {
            try {
                if (wasLiked) {
                    await api.unlikePost(post.id)
                } else {
                    await api.likePost(post.id)
                }

                // Send WebSocket message for real-time updates
                if (isConnected) {
                    sendMessage({
                        type: 'like',
                        from: user.id,
                        post_id: post.id,
                        action: wasLiked ? 'unlike' : 'like'
                    })
                }

                // Update local state with the optimistic data
                setPost(optimisticPost)
            } catch (err) {
                console.error('Error toggling like:', err)
                throw err // Let the hook handle the error
            }
        })
    }

    // Handle bookmark post
    const handleBookmarkPost = async () => {
        if (!post || !user) return

        const wasBookmarked = post.is_bookmarked
        const optimisticPost = {
            ...post,
            is_bookmarked: !post.is_bookmarked
        }

        try {
            if (wasBookmarked) {
                await api.unbookmarkPost(post.id)
            } else {
                await api.toggleBookmark(post.id)
            }

            // Update local state
            setPost(optimisticPost)

            success(wasBookmarked ? 'Post removed from bookmarks' : 'Post bookmarked successfully')
        } catch (err) {
            console.error('Error toggling bookmark:', err)
            // Revert optimistic update on error
            setPost(prev => prev ? { ...prev, is_bookmarked: wasBookmarked } : null)
            if (err instanceof NetworkError) {
                error('Failed to update bookmark. Please try again.')
            } else {
                error('Unable to update bookmark right now.')
            }
        }
    }

    // Delete post functions
    const canDeletePost = () => {
        return user && post && user.id === post.user.id
    }

    const handleDeletePost = async () => {
        if (!canDeletePost()) return
        setShowDeleteConfirm(true)
    }

    const confirmDeletePost = async () => {
        if (!canDeletePost() || !post) return

        setIsDeleting(true)
        try {
            await api.deletePost(post.id)
            success('Post deleted successfully')
            
            // Navigate back after deletion
            if (from === 'feed' && subTab) {
                router.push(`/feed/${subTab}`)
            } else if (from === 'activity' && subTab) {
                router.push(`/activity/${subTab}`)
            } else if (from === 'profile' && searchParams?.get('userId')) {
                router.push(`/profile/${searchParams?.get('userId')}`)
            } else {
                router.push('/feed/all')
            }
        } catch (err) {
            console.error('Failed to delete post:', err)
            error('Failed to delete post. Please try again.')
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
            setOpenMenu(false)
        }
    }

    // Delete comment functions
    const canDeleteComment = (comment: CommentWithUser) => {
        return user && (user.id === comment.user.id || (post && user.id === post.user.id))
    }

    const handleDeleteCommentClick = (commentId: number) => {
        setCommentToDelete(commentId)
        setShowDeleteCommentConfirm(true)
    }

    const confirmDeleteComment = async () => {
        if (!commentToDelete) return

        setIsDeleting(true)
        try {
            await handleDeleteComment(commentToDelete)
        } finally {
            setIsDeleting(false)
            setShowDeleteCommentConfirm(false)
            setCommentToDelete(null)
        }
    }

    // Manage Privacy handlers
    const handleManagePrivacy = async (post: APIPost) => {
        setSelectedPostForPrivacy(post)
        setShowManagePrivacy(true)
        fetchAvailableUsers()
        setOpenMenu(false)
    }

    const handleUpdatePrivacy = async (privacy: 'public' | 'followers' | 'friends' | 'listed', selectedUsers: number[]) => {
        if (!selectedPostForPrivacy) return

        try {
            await api.updatePost(selectedPostForPrivacy.id, {
                privacy,
                specific_user_ids: selectedUsers
            })

            // Update local post state
            setPost(prev => prev ? {
                ...prev,
                privacy,
                specific_user_ids: selectedUsers
            } : null)

            success('Post privacy updated successfully!')
            setShowManagePrivacy(false)
            setSelectedPostForPrivacy(null)
        } catch (err) {
            console.error('Error updating privacy:', err)
            if (err instanceof NetworkError) {
                error('Failed to update privacy. Please try again.')
            } else {
                error('Unable to update privacy right now.')
            }
            throw err
        }
    }

    const fetchAvailableUsers = async () => {
        setLoadingUsers(true)
        try {
            const response = await api.getFollowers(currentUser?.id || 0)
            setAvailableUsers(response.followers || [])
        } catch (err) {
            console.error('Error fetching followers:', err)
            error('Failed to load followers for privacy settings.')
        } finally {
            setLoadingUsers(false)
        }
    }

    const handleShareClick = (post: APIPost) => {
        setSelectedPostForShare(post)
        setIsSharePopupOpen(true)
    }

    const handleDeleteComment = async (commentId: number) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/posts/${post?.id}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                credentials: 'include'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to delete comment')
            }

            // Remove comment from local state
            setComments(prev => prev.filter(comment => comment.id !== commentId))
            success('Comment deleted successfully')

            // TODO: Send WebSocket message for real-time updates when supported
        } catch (err) {
            console.error('Failed to delete comment:', err)
            error('Failed to delete comment. Please try again.')
        } finally {
            setOpenCommentMenu(null)
        }
    }

    // Handle comment submission via WebSocket
  const handleSubmitComment = async () => {
    if (!newComment.trim() && !newCommentImage) return
    if (!post || !user) return

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

      // Create comment via HTTP API
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/posts/${post.id}/comments`, {
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

      // Clear the input (optimistically)
      setNewComment('')
      setNewCommentImage(null)
      setIsCommentModalOpen(false)
      success('Comment posted!')
    } catch (err) {
      console.error('Error submitting comment:', err)
      error('Failed to post comment. Please try again.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleUserClick = (userId: number | undefined) => {
    if (!currentUser) return
    // Check if clicking on own profile
    if (userId === currentUser.id) {
      // Navigate to own profile route
      router.push(`/profile/${userId}`) // or router.push('/dashboard') to go to dashboard profile tab
    } else {
      // Navigate to other user's profile page
      router.push(`/profile/${userId}`)
    }
  }

  // ImagePreviewModal handlers
  const handleImagePreviewOpen = (url: string) => {
    setImagePreviewUrl(url);
  };

  const handleImagePreviewClose = () => {
    setImagePreviewUrl(null);
  };

    // WebSocket message listener
    useEffect(() => {
        if (!isConnected || !post) return

        const removeListener = addMessageListener((message) => {
            switch (message.type) {
                case 'comment_update':
                    if (message.post_id === Number(post.id) && message.action === 'create') {
                        // Add new comment to the list only if it doesn't already exist
                        if (message.data) {
                            setComments(prev => {
                                // Check if comment already exists
                                const exists = prev.some(comment => comment.id === message.data.id)
                                if (exists) return prev

                                const newComment: CommentWithUser = {
                                    id: message.data.id,
                                    user_id: message.data.user_id,
                                    post_id: message.data.post_id,
                                    content: message.data.content,
                                    image_url: message.data.image_url,
                                    created_at: message.data.created_at,
                                    updated_at: message.data.updated_at,
                                    user: message.data.user || {
                                        id: message.data.user_id,
                                        first_name: message.data.user?.first_name || 'Unknown',
                                        last_name: message.data.user?.last_name || 'User',
                                        email: '',
                                        date_of_birth: '',
                                        avatar: message.data.user?.avatar,
                                        nickname: message.data.user?.nickname,
                                        about_me: null,
                                        is_private: false,
                                        created_at: '',
                                        updated_at: ''
                                    },
                                    timeAgo: 'Just now'
                                }

                                // Insert new comment in correct position based on current sort
                                if (commentSort === 'newest') {
                                    // Newest first: add to beginning
                                    return [newComment, ...prev]
                                } else {
                                    // Oldest first: add to end
                                    return [...prev, newComment]
                                }
                            })
                        }
                    }
                    break

                case 'like':
                    if (message.post_id === Number(post.id)) {
                        setPost(prev => prev ? {
                            ...prev,
                            is_liked: message.action === 'like',
                            like_count: message.action === 'like' ? prev.like_count + 1 : prev.like_count - 1
                        } : null)
                    }
                    break

                default:
                    break
            }
        })

        return removeListener
    }, [isConnected, addMessageListener, post, commentSort])

    // Load post on component mount and when sort changes
    useEffect(() => {
        fetchPost()
    }, [fetchPost, commentSort])

  if (isLoadingPost) {
    return (
      <AppLayout activeTab="feed">
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
            <p className="mt-4 text-white">Loading post...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!post) {
    return (
      <AppLayout activeTab="feed">
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Post Not Found</h1>
            <button
              onClick={() => {
                if (from === 'feed' && subTab) {
                  router.push(`/feed/${subTab}`)
                } else if (from === 'activity' && subTab) {
                  router.push(`/activity/${subTab}`)
                } else if (from === 'profile' && searchParams?.get('userId')) {
                  router.push(`/profile/${searchParams?.get('userId')}`)
                } else {
                  router.push('/feed/all')
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      activeTab="feed"
      tempPostSubTab={id as string}
      onTempPostClose={() => {
        if (from === 'feed' && subTab) {
          router.push(`/feed/${subTab}`)
        } else if (from === 'activity' && subTab) {
          router.push(`/activity/${subTab}`)
        } else if (from === 'profile' && searchParams?.get('userId')) {
          router.push(`/profile/${searchParams?.get('userId')}`)
        } else {
          router.push('/feed/all')
        }
      }}
    >
      <div className="post-page-container h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Post Card */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 mb-8 hover:shadow-emerald-500/10 transition-all duration-300 group">
          {/* Post Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              {/* Clickable Avatar */}
              <div
                className="relative group cursor-pointer"
                onClick={() => handleUserClick(post.user.id)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/20 group-hover:ring-emerald-400/50 transition-all duration-300">
                  {getAvatarUrl(post.user.avatar) ? (
                  <Image
                    src={getAvatarUrl(post.user.avatar)!}
                    alt={`${post.user.first_name} ${post.user.last_name}'s avatar`}
                    width={48}
                    height={48}
                    unoptimized={post.user.avatar.includes('/svg')}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {getUserInitials(post.user)}
                    </span>
                  )}
                </div>
                </div>

                <div className="flex-1">
                  {/* Clickable Full Name */}
                  <div
                    key={post.user.id}
                    className="group cursor-pointer"
                    onClick={() => handleUserClick(post.user.id)}
                  >
                    <span
                      className="text-white font-semibold text-lg hover:text-emerald-300 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUserClick(post.user.id)
                      }}
                    >
                      {post.user.first_name} {post.user.last_name}
                    </span>
                </div>

                {/* Clickable Username */}
                <p
                  className="text-white/70 text-sm cursor-pointer hover:text-white/90 transition-colors duration-200"
                  onClick={() => handleUserClick(post.user.id)}
                >
                  @{post.user.nickname || post.user.email.split('@')[0]} • {formatTimeAgo(post.created_at)}
                </p>
              </div>
            </div>

            {canDeletePost() && (
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenu(!openMenu)
                  }}
                  className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
                  title="More options"
                  aria-label="More options">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                {/* Dropdown Menu */}
                <AnimatePresence>
                  {openMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleManagePrivacy(post)}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                      >
                        <Lock className="w-4 h-4" />
                        <span className="text-sm font-medium">Manage Privacy</span>
                      </button>
                      <button
                        onClick={handleDeletePost}
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
          <div className="mb-6">
            <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Post Image */}
          {post.image_url && (
            <div className="mb-6 flex justify-center">
              <div className="inline-block border border-white/20 rounded-2xl overflow-hidden cursor-pointer" onClick={() => handleImagePreviewOpen(post.image_url!.startsWith('http') ? post.image_url! : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${post.image_url}`)}>
                <Image
                  src={post.image_url.startsWith('http') ?
                    post.image_url :
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${post.image_url}`
                  }
                  alt="Post image"
                  width={640}
                  height={256}
                  unoptimized={post.image_url.includes('/svg')}
                  className="max-h-64 sm:max-h-80 md:max-h-96 object-contain hover:scale-105 transition-transform duration-500 rounded-2xl"
                />
              </div>
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLikePost}
                disabled={likePending || !connectionStatus}
                className={`flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  post.is_liked
                    ? 'text-red-400 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30'
                    : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
                } ${likePending || !connectionStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Like"
              >
                <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current animate-pulse' : ''} ${likePending ? 'animate-bounce' : ''}`} />
                <span className="text-sm font-medium">{post.like_count}</span>
                {!connectionStatus && (
                  <span className="text-xs text-orange-400 ml-1">(Offline)</span>
                )}
              </button>

              <button 
                onClick={() => setIsCommentModalOpen(true)}
                className="flex items-center justify-center space-x-2 px-5 py-3 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                title="Comment"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">{comments.length}</span>
              </button>              <button
                onClick={() => handleShareClick(post)}
                className="flex items-center justify-center space-x-2 px-5 py-3 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
                title="Share"
              >
                <Send className="w-5 h-5" />
                <span className="text-sm font-medium">{post.share_count}</span>
              </button>
            </div>

            <button
              onClick={handleBookmarkPost}
              disabled={!connectionStatus}
              className={`flex items-center justify-center px-5 py-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                post.is_bookmarked
                  ? 'text-yellow-400 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30'
                  : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
              } ${!connectionStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Bookmark"
            >
              <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-current' : ''}`} />
              {!connectionStatus && (
                <span className="text-xs text-orange-400 ml-2">(Offline)</span>
              )}
            </button>
          </div>
        </div>

        {/* Comments Section - Enhanced Design */}
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 mb-8 hover:shadow-emerald-500/10 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">
              Comments ({comments.length})
            </h2>
            <div className="flex items-center space-x-3">
              {/* Sort Toggle */}
              <div className="flex items-center space-x-2 bg-white/10 rounded-xl p-1">
                <button
                  onClick={() => {
                    setCommentSort('newest')
                  }}
                  disabled={isSorting}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    commentSort === 'newest'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  } ${isSorting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSorting && commentSort === 'newest' ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Newest</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <ArrowUp className="w-3 h-3" />
                      <span>Newest</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => {
                    setCommentSort('oldest')
                  }}
                  disabled={isSorting}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    commentSort === 'oldest'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  } ${isSorting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSorting && commentSort === 'oldest' ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Oldest</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <ArrowDown className="w-3 h-3" />
                      <span>Oldest</span>
                    </div>
                  )}
                </button>
              </div>
              <button
                onClick={() => setIsCommentModalOpen(true)}
                className="flex items-center justify-center space-x-2 px-5 py-3 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">Add Comment</span>
              </button>
            </div>
          </div>

          <div className="post-comments-section">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg mb-2">No comments yet</p>
                <p className="text-white/40 text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="relative">
                {/* Sorting Loading Overlay */}
                {isSorting && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                    <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-xl rounded-xl px-4 py-2">
                      <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                      <span className="text-white text-sm font-medium">Sorting comments...</span>
                    </div>
                  </div>
                )}
                <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4">
                  <div className="space-y-4">
                    {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="group relative bg-gradient-to-br from-white/8 via-white/6 to-white/4 backdrop-blur-md rounded-3xl border border-white/20 p-5 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:border-emerald-400/40 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
                    >
                      {/* Subtle animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Decorative corner accent */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-400/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative flex items-start space-x-4">
                        {/* Enhanced Avatar with glow effect */}
                        <div className="flex-shrink-0 relative">
                          <div className="relative group/avatar cursor-pointer" onClick={() => handleUserClick(comment.user.id)}>
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/30 group-hover:ring-emerald-400/60 transition-all duration-300 shadow-lg group-hover:shadow-emerald-500/30">
                              {getAvatarUrl(comment.user.avatar) ? (
                                <Image
                                  src={getAvatarUrl(comment.user.avatar)!}
                                  alt={`${comment.user.first_name} ${comment.user.last_name}'s avatar`}
                                  width={48}
                                  height={48}
                                  unoptimized={comment.user.avatar.includes('/svg')}
                                  className="w-12 h-12 rounded-full object-cover group-hover/avatar:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <span className="text-white font-bold text-lg">
                                  {getUserInitials(comment.user)}
                                </span>
                              )}
                            </div>
                            {/* Avatar glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                                                    {/* Enhanced Header with better typography */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <motion.h4
                                  className="text-white font-semibold text-sm hover:text-emerald-300 transition-colors duration-300 cursor-pointer group-hover:text-emerald-200"
                                  whileHover={{ scale: 1.02 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                  onClick={() => handleUserClick(comment.user.id)}
                                >
                                  {comment.user.first_name} {comment.user.last_name}
                                </motion.h4>
                                <span className="text-white/70 text-xs font-medium hover:text-white/90 transition-colors duration-200">
                                  @{comment.user.nickname || comment.user.email.split('@')[0]}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-white/60">
                              <span className="text-xs font-medium hover:text-white/80 transition-colors duration-200">
                                {comment.timeAgo}
                              </span>
                              {canDeleteComment(comment) && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setOpenCommentMenu(openCommentMenu === comment.id ? null : comment.id)
                                    }}
                                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
                                    title="More options"
                                    aria-label="More options"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>

                                  {/* Dropdown Menu */}
                                  <AnimatePresence>
                                    {openCommentMenu === comment.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-40 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onClick={() => handleDeleteCommentClick(comment.id)}
                                          className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-all duration-200"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span className="text-xs font-medium">Delete Comment</span>
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Enhanced Content with better typography */}
                          <div className="mb-3">
                            <p className="text-white/95 text-sm leading-relaxed whitespace-pre-wrap font-medium group-hover:text-white transition-colors duration-300">
                              {comment.content}
                            </p>
                          </div>

                          {/* Enhanced Image with better styling */}
                          {comment.image_url && (
                            <motion.div
                              className="flex justify-start group/image"
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                              <div className="relative inline-block overflow-hidden rounded-2xl border border-white/20 shadow-lg group-hover/image:shadow-emerald-500/20 transition-shadow duration-300">
                                <Image
                                  src={comment.image_url.startsWith('http') ?
                                    comment.image_url :
                                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${comment.image_url}`
                                  }
                                  alt="Comment image"
                                  width={400}
                                  height={300}
                                  unoptimized={true}
                                  className="max-w-full max-h-72 object-contain hover:scale-105 cursor-pointer transition-transform duration-500 rounded-2xl"
                                  onClick={() => comment.image_url && handleImagePreviewOpen(comment.image_url.startsWith('http') ?
                                    comment.image_url :
                                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${comment.image_url}`
                                  )}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                {/* Image overlay effect */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 rounded-2xl" />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Subtle bottom accent line */}
                      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.div>
                  ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comment Modal */}
        <AnimatePresence>
          {isCommentModalOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="relative w-full max-w-2xl h-[80vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* Header */}
                <motion.div
                  className="relative flex-shrink-0 p-6 lg:p-8 pb-4 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <MessageSquare className="w-6 h-6 text-white drop-shadow-sm" />
                        </div>
                        <motion.div
                          className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                        />
                      </motion.div>
                      <div>
                        <motion.h3
                          className="text-xl lg:text-2xl font-bold text-white mb-1"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          Add Comment
                        </motion.h3>
                        <motion.p
                          className="text-white/60 text-sm"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                        >
                          Share your thoughts on this post
                        </motion.p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setIsCommentModalOpen(false)}
                      className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                      title="Close"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Scrollable Content Area */}
                <motion.div
                  className="relative flex-1 overflow-y-auto px-6 lg:px-8 py-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="space-y-6">
                    {/* Comment Content */}
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      <motion.label
                        className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                      >
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span>Your Comment</span>
                      </motion.label>
                      <div className="relative">
                        <motion.textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Share your thoughts, ask questions, or start a discussion..."
                          className="w-full h-32 lg:h-36 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                          maxLength={500}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                        />
                        <motion.div
                          className="absolute bottom-4 right-4 text-xs text-white/50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6, duration: 0.3 }}
                        >
                          {newComment.length}/500
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Image Upload */}
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <motion.label
                        className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                      >
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        <span>Media (Optional)</span>
                      </motion.label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <label htmlFor="modal-comment-image-input" className="sr-only">Upload image</label>
                        <input
                          id="modal-comment-image-input"
                          type="file"
                          accept="image/*"
                          onChange={e => setNewCommentImage(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <motion.button
                          onClick={() => document.getElementById('modal-comment-image-input')?.click()}
                          title="Add Image or GIF"
                          className="flex items-center px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white transition-all duration-300 text-sm lg:text-base font-medium"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ImageIcon className="w-5 h-5 mr-3" />
                          Add Image or GIF
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* Image Preview */}
                    {newCommentImage && (
                      <motion.div
                        className="bg-white/10 border border-white/20 rounded-xl p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white text-sm font-semibold">Selected Image:</span>
                          <motion.button
                            onClick={() => setNewCommentImage(null)}
                            title="Remove image"
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <ImageIcon className="w-7 h-7 text-white/70" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{newCommentImage.name}</p>
                            <p className="text-white/60 text-xs">
                              {(newCommentImage.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Connection Status */}
                    {!connectionStatus && (
                      <motion.div
                        className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-red-300 text-sm font-medium">You are currently offline. Comment will be posted when connection is restored.</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                  className="relative flex-shrink-0 p-6 lg:p-8 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                    <motion.button
                      onClick={() => setIsCommentModalOpen(false)}
                      className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleSubmitComment}
                      disabled={(!newComment.trim() && !newCommentImage) || isSubmittingComment || !isConnected}
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg ${
                        (!newComment.trim() && !newCommentImage) || isSubmittingComment || !isConnected
                          ? 'bg-white/20 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                      }`}
                      whileHover={{ scale: ((!newComment.trim() && !newCommentImage) || isSubmittingComment || !isConnected) ? 1 : 1.05 }}
                      whileTap={{ scale: ((!newComment.trim() && !newCommentImage) || isSubmittingComment || !isConnected) ? 1 : 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      {isSubmittingComment ? (
                        <div className="flex items-center justify-center space-x-2">
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                          <span>Posting...</span>
                        </div>
                      ) : !connectionStatus ? (
                        <div className="flex items-center justify-center space-x-2">
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                          <span>Offline</span>
                        </div>
                      ) : (
                        'Post Comment'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ImagePreviewModal */}
        <ImagePreviewModal
          isOpen={!!imagePreviewUrl}
          imageUrl={imagePreviewUrl}
          onClose={handleImagePreviewClose}
        />

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteConfirm(false)}
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
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeletePost}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Comment Confirmation Modal */}
        <AnimatePresence>
          {showDeleteCommentConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteCommentConfirm(false)}
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
                    <MessageSquare className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Delete Comment</h3>
                  <p className="text-white/70 text-sm mb-6">
                    Are you sure you want to delete this comment? This action cannot be undone.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteCommentConfirm(false)}
                      className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteComment}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manage Privacy Modal */}
        <ManagePrivacy
          show={showManagePrivacy}
          onClose={() => {
            setShowManagePrivacy(false)
            setSelectedPostForPrivacy(null)
          }}
          currentPrivacy={selectedPostForPrivacy?.privacy as 'public' | 'followers' | 'friends' | 'listed' || 'public'}
          currentSelectedUsers={selectedPostForPrivacy?.specific_user_ids || []}
          availableUsers={availableUsers}
          loadingUsers={loadingUsers}
          onUpdatePrivacy={handleUpdatePrivacy}
        />

        {/* Share Popup */}
        {isSharePopupOpen && selectedPostForShare && (
          <SharePopup
            postId={selectedPostForShare.id}
            isOpen={isSharePopupOpen}
            onClose={() => {
              setIsSharePopupOpen(false)
              setSelectedPostForShare(null)
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}

function ProtectedPostDetail() {
    return (
        <ProtectedRoute>
            <PostDetailPage />
        </ProtectedRoute>
    )
}

export default ProtectedPostDetail