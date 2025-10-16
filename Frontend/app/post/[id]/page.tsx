'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { User, Heart, MessageSquare, MoreHorizontal, Send, Image as ImageIcon, Bookmark, ZoomIn, ZoomOut, Download, X } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus, useOptimisticUpdate } from '@/hooks'
import { api, APIPost, Comment as CommentType, NetworkError } from '@/lib/api'
import { getAvatarUrl } from '@/utils/avatarUtils'
import Image from 'next/image'

interface CommentWithUser extends CommentType {
    timeAgo: string
    image_url?: string | null
}

function PostDetailPage() {
  const { user: currentUser } = useAuth()
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { sendMessage, addMessageListener, isConnected } = useWebSocket()
  const { success, error } = useToast()
  const { isConnected: connectionStatus } = useConnectionStatus()

  // Get navigation context from URL params
  const from = searchParams.get('from')
  const subTab = searchParams.get('subTab')

  // State
  const [post, setPost] = useState<APIPost | null>(null)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [newCommentImage, setNewCommentImage] = useState<File | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [imagePopupUrl, setImagePopupUrl] = useState<string | null>(null)
  const [imageZoom, setImageZoom] = useState(1)

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
            setIsLoadingPost(true)
            const post = await api.getPost(Number(id))
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
                } else if (from === 'profile' && searchParams.get('userId')) {
                  router.push(`/profile/${searchParams.get('userId')}`)
                } else {
                  router.push('/feed/all')
                }
            }
        } finally {
            setIsLoadingPost(false)
        }
    }, [id, error, from, subTab, searchParams, router])

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
    console.log("User clicked:", userId, "Current user:", currentUser.id)
    // Check if clicking on own profile
    if (userId === currentUser.id) {
      // Navigate to own profile route
      router.push(`/profile/${userId}`) // or router.push('/dashboard') to go to dashboard profile tab
    } else {
      // Navigate to other user's profile page
      router.push(`/profile/${userId}`)
    }
  }

  // Image popup handlers
  const handleZoomIn = () => setImageZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setImageZoom(prev => Math.max(prev - 0.25, 0.25))
  const handleResetZoom = () => setImageZoom(1)
  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }
  const handleDownload = async () => {
    if (!imagePopupUrl) return

    try {
      // Fetch the image as a blob
      const response = await fetch(imagePopupUrl, {
        credentials: 'include' // Include cookies for authentication
      })

      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }

      const blob = await response.blob()

      // Create a blob URL for download
      const blobUrl = URL.createObjectURL(blob)

      // Create download link
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `image-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to direct download
      const link = document.createElement('a')
      link.href = imagePopupUrl
      link.download = `image-${Date.now()}.jpg`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  const handleCloseImagePopup = () => {
    setImagePopupUrl(null)
    setImageZoom(1)
  }

    // WebSocket message listener
    useEffect(() => {
        if (!isConnected || !post) return

        const removeListener = addMessageListener((message) => {
            switch (message.type) {
                case 'comment_update':
                    if (message.post_id === Number(post.id) && message.action === 'create') {
                        // Add new comment to the list
                        if (message.data) {
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
                            setComments(prev => [...prev, newComment])
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
    }, [isConnected, addMessageListener, post])

    // Load post on component mount
    useEffect(() => {
        fetchPost()
    }, [fetchPost])

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
                } else if (from === 'profile' && searchParams.get('userId')) {
                  router.push(`/profile/${searchParams.get('userId')}`)
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
        } else if (from === 'profile' && searchParams.get('userId')) {
          router.push(`/profile/${searchParams.get('userId')}`)
        } else {
          router.push('/feed/all')
        }
      }}
    >
      <div className="post-page-container">
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
                    <User className="w-6 h-6 text-white" />
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

            <button
              className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
              title="More options"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>      

          {/* Post Content */}
          <div className="mb-6">
            <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Post Image */}
          {post.image_url && (
            <div className="mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-transparent border border-white/10 group-hover:border-emerald-400/30 transition-all duration-300">
              <Image
                src={post.image_url.startsWith('http') ?
                  post.image_url :
                  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${post.image_url}`
                }
                alt="Post image"
                width={640}
                height={256}
                unoptimized={post.image_url.includes('/svg')}
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-white/50" />
                <span className="ml-3 text-white/70 font-medium">Image failed to load</span>
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
                className="flex items-center justify-center space-x-2 px-5 py-3 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
                title="Share"
              >
                <Send className="w-5 h-5" />
                <span className="text-sm font-medium">0</span>
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
            <button
              onClick={() => setIsCommentModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 text-sm hover:scale-105"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Add Comment</span>
            </button>
          </div>

          <div className="post-comments-section">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg mb-2">No comments yet</p>
                <p className="text-white/40 text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="group bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                    <div className="flex items-start space-x-4">
                      {/* Enhanced Avatar - Circular, no status */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/20 group-hover:ring-emerald-400/50 transition-all duration-300">
                          {getAvatarUrl(comment.user.avatar) ? (
                            <Image
                              src={getAvatarUrl(comment.user.avatar)!}
                              alt={`${comment.user.first_name} ${comment.user.last_name}'s avatar`}
                              width={48}
                              height={48}
                              unoptimized={comment.user.avatar.includes('/svg')}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Enhanced Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-white font-semibold text-base hover:text-emerald-300 transition-colors duration-200 cursor-pointer">
                              {comment.user.first_name} {comment.user.last_name}
                            </h4>
                            <span className="text-white/60 text-sm">
                              @{comment.user.nickname || comment.user.email.split('@')[0]}
                            </span>
                          </div>
                          <span className="text-white/40 text-sm">•</span>
                          <span className="text-white/50 text-sm">{comment.timeAgo}</span>
                        </div>

                        {/* Enhanced Content */}
                        <div className="mb-4">
                          <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>

                        {/* Enhanced Image */}
                        {comment.image_url && (
                          <div className="flex justify-start">
                            <img
                              src={comment.image_url.startsWith('http') ?
                                comment.image_url :
                                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${comment.image_url}`
                              }
                              alt="Comment image"
                              className="max-w-full max-h-64 object-contain hover:scale-105 cursor-pointer rounded-2xl transition-all duration-300"
                              onClick={() => comment.image_url && setImagePopupUrl(comment.image_url.startsWith('http') ?
                                comment.image_url :
                                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${comment.image_url}`
                              )}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment Modal */}
        {isCommentModalOpen && (
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
                    onClick={() => setIsCommentModalOpen(false)}
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
                      <label htmlFor="modal-comment-image-input" className="sr-only">Upload image</label>
                      <input
                        id="modal-comment-image-input"
                        type="file"
                        accept="image/*"
                        onChange={e => setNewCommentImage(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <button
                        onClick={() => document.getElementById('modal-comment-image-input')?.click()}
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
                        <span className="text-white text-sm font-semibold">Selected Image:</span>
                        <button
                          onClick={() => setNewCommentImage(null)}
                          title="Remove image"
                          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
                        >
                          <span className="text-lg">×</span>
                        </button>
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
                    </div>
                  )}

                  {/* Connection Status */}
                  {!connectionStatus && (
                    <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-red-300 text-sm font-medium">You are currently offline. Comment will be posted when connection is restored.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="relative flex-shrink-0 p-6 lg:p-8 pt-4">
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setIsCommentModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await handleSubmitComment()
                      setIsCommentModalOpen(false)
                    }}
                    disabled={(!newComment.trim() && !newCommentImage) || isSubmittingComment || !isConnected}
                    className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg ${(!newComment.trim() && !newCommentImage) || isSubmittingComment || !isConnected
                        ? 'bg-white/20 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 shadow-emerald-500/25'
                      }`}
                  >
                    {isSubmittingComment ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Posting...</span>
                      </div>
                    ) : !connectionStatus ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Offline</span>
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
      </div>

      {/* Image Popup Modal */}
      {imagePopupUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center" onClick={handleCloseImagePopup}>
          {/* Control Bar */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center space-x-4 bg-black/50 backdrop-blur-xl rounded-2xl p-3 border border-white/20">
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
              className="px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 text-sm font-medium"
              title="Reset Zoom"
            >
              100%
            </button>
            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {Math.round(imageZoom * 100)}%
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-8 bg-white/20 mx-2"></div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
              title="Download Image"
            >
              <Download className="w-5 h-5" />
            </button>
            <div className="w-px h-8 bg-white/20 mx-2"></div>
            <button
              onClick={(e) => { e.stopPropagation(); handleCloseImagePopup(); }}
              className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image Container */}
          <div className="relative w-full h-full max-w-[90vw] max-h-[calc(100vh-200px)] flex items-center justify-center">
            <img
              src={imagePopupUrl}
              alt="Full size image"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-300 cursor-grab active:cursor-grabbing select-none"
              style={{
                transform: `scale(${imageZoom})`,
                transformOrigin: 'center center'
              }}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={handleResetZoom}
              onWheel={handleWheelZoom}
              draggable={false}
            />
          </div>
        </div>
      )}
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
