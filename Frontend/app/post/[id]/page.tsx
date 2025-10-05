'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { User, Heart, MessageSquare, MoreHorizontal, Send, Image as ImageIcon, Bookmark } from 'lucide-react'
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
    if (!post || !user || !isConnected) return

    if (newComment.length > 500) {
      error('Comment is too long. Maximum 500 characters.')
      return
    }

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

      // Send comment via WebSocket
      sendMessage({
        type: 'comment_update',
        from: user.id,
        post_id: post.id,
        action: 'create',
        data: {
          content: newComment.trim(),
          image_url: imageUrl
        }
      })

      // Clear the input (optimistically)
      setNewComment('')
      setNewCommentImage(null)
      success('Comment posted!')
    } catch (err) {
      console.error('Error submitting comment:', err)
      error('Failed to post comment. Please try again.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

    // WebSocket message listener
    useEffect(() => {
        if (!isConnected || !post) return

        const removeListener = addMessageListener((message) => {
            switch (message.type) {
                case 'comment_update':
                    if (message.post_id === post.id && message.action === 'create') {
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
                    if (message.post_id === post.id) {
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
      {/* Post Card */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 mb-8 hover:shadow-emerald-500/10 transition-all duration-300 group">
          {/* Post Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
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
                {/* Online Status Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-gray-900 rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-white font-semibold text-lg hover:text-emerald-300 transition-colors duration-200">
                    {post.user.first_name} {post.user.last_name}
                  </h3>
                </div>
                <p className="text-white/70 text-sm">
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
            <button
              onClick={handleLikePost}
              disabled={likePending || !connectionStatus}
              className={`flex items-center space-x-3 px-5 py-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                post.is_liked
                  ? 'text-red-400 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30'
                  : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
              } ${likePending || !connectionStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current animate-pulse' : ''} ${likePending ? 'animate-bounce' : ''}`} />
              <span className="font-medium">{post.like_count}</span>
              {!connectionStatus && (
                <span className="text-xs text-orange-400 ml-1">(Offline)</span>
              )}
            </button>

            <button
              onClick={handleBookmarkPost}
              disabled={!connectionStatus}
              className={`flex items-center space-x-3 px-5 py-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                post.is_bookmarked
                  ? 'text-yellow-400 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30'
                  : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
              } ${!connectionStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.is_bookmarked ? 'Saved' : 'Save'}</span>
              {!connectionStatus && (
                <span className="text-xs text-orange-400 ml-1">(Offline)</span>
              )}
            </button>

            <button className="flex items-center space-x-3 px-5 py-3 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">{comments.length}</span>
            </button>

            <button className="flex items-center space-x-3 px-5 py-3 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105">
              <Send className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Comment Form */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {getAvatarUrl(user?.avatar) ? (
                <Image
                  src={getAvatarUrl(user?.avatar)!}
                  alt={`${user?.first_name} ${user?.last_name}'s avatar`}
                  width={32}
                  height={32}
                  unoptimized={user?.avatar.includes('/svg')}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:border-emerald-400 resize-none"
                rows={3}
                maxLength={500}
              />
                      <input
                        id="comment-image-input"
                        type="file"
                        accept="image/*"
                        onChange={e => setNewCommentImage(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('comment-image-input')?.click()}
                        className="mt-2 flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 border border-white/20 rounded-lg transition-all duration-200"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm">Add Image</span>
                      </button>
                      {newCommentImage && (
                        <div className="mt-2 relative">
                          <div className="relative inline-block">
                            <img 
                              src={URL.createObjectURL(newCommentImage)} 
                              alt="Comment preview" 
                              className="max-w-48 max-h-32 object-contain rounded-lg border border-white/20" 
                            />
                            <button
                              type="button"
                              onClick={() => setNewCommentImage(null)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-white/60 text-xs mt-1">{newCommentImage.name}</p>
                        </div>
                      )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-3">
                  <span className="text-white/60 text-xs">
                    {newComment.length}/500 characters
                  </span>
                  {!connectionStatus && (
                    <span className="text-orange-400 text-xs flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                      <span>Offline mode</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSubmitComment}
                  disabled={(!newComment.trim() && !newCommentImage) || isSubmittingComment || !isConnected}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-white/10 disabled:text-white/50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmittingComment
                      ? 'Posting...'
                      : !connectionStatus
                        ? 'Reconnecting...'
                        : 'Post'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-white font-semibold text-lg mb-4">
            Comments ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <p className="text-white/60 text-center py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3 p-3 rounded-lg bg-white/5">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {getAvatarUrl(comment.user.avatar) ? (
                      <Image
                        src={getAvatarUrl(comment.user.avatar)!}
                        alt={`${comment.user.first_name} ${comment.user.last_name}'s avatar`}
                        width={32}
                        height={32}
                        unoptimized={comment.user.avatar.includes('/svg')}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-white font-medium text-sm">
                        {comment.user.first_name} {comment.user.last_name}
                      </h4>
                      <span className="text-white/60 text-xs">
                        @{comment.user.nickname || comment.user.email.split('@')[0]}
                      </span>
                      <span className="text-white/60 text-xs">•</span>
                      <span className="text-white/60 text-xs">{comment.timeAgo}</span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                            {comment.image_url && (
                              <div className="mt-2">
                                <img
                                  src={comment.image_url.startsWith('http') ?
                                    comment.image_url :
                                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${comment.image_url}`
                                  }
                                  alt="Comment image"
                                  className="max-w-48 max-h-48 object-contain rounded-lg border border-white/20"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                  </div>
                </div>
              ))}
            </div>
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
