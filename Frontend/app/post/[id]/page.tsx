'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Heart, MessageSquare, Share, MoreHorizontal, Send, Image as ImageIcon } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus, useOptimisticUpdate, useOnlineStatus } from '@/hooks'
import { api, APIPost, Comment as CommentType, NetworkError, ValidationError } from '@/lib/api'
import { getAvatarUrl } from '@/utils/avatarUtils'

interface CommentWithUser extends CommentType {
    timeAgo: string
}

function PostDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { sendMessage, addMessageListener, isConnected } = useWebSocket()
    const { success, error } = useToast()
    const { isConnected: connectionStatus } = useConnectionStatus()
    const { onlineUsers } = useOnlineStatus()

    // State
    const [post, setPost] = useState<APIPost | null>(null)
    const [comments, setComments] = useState<CommentWithUser[]>([])
    const [isLoadingPost, setIsLoadingPost] = useState(true)
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)

    // Real-time optimistic updates for likes
    const { performUpdate: performOptimisticUpdate, isLoading: likePending } = useOptimisticUpdate(
        post ? { ...post, is_liked: post.is_liked, like_count: post.like_count } : null,
        {
            onError: () => error('Failed to update like')
        }
    )

    // Check if post author is online
    const isAuthorOnline = post ? onlineUsers.some(u => u.user_id === post.user.id && u.is_online) : false

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
    const fetchPost = async () => {
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
                router.push('/dashboard')
            }
        } finally {
            setIsLoadingPost(false)
        }
    }

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
        await performOptimisticUpdate((current) => optimisticPost, async () => {
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

    // Handle comment submission via WebSocket
    const handleSubmitComment = async () => {
        if (!newComment.trim() || !post || !user || !isConnected) return

        if (newComment.length > 500) {
            error('Comment is too long. Maximum 500 characters.')
            return
        }

        try {
            setIsSubmittingComment(true)

            // Send comment via WebSocket
            sendMessage({
                type: 'comment_update',
                from: user.id,
                post_id: post.id,
                action: 'create',
                data: {
                    content: newComment.trim(),
                }
            })

            // Clear the input (optimistically)
            setNewComment('')
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
    }, [isConnected, addMessageListener, post?.id])

    // Load post on component mount
    useEffect(() => {
        fetchPost()
    }, [id])

    if (isLoadingPost) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
                    <p className="mt-4 text-white">Loading post...</p>
                </div>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Post Not Found</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <button
                        title="Back"
                            onClick={() => router.back()}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 mr-4"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-semibold text-white">Post Details</h1>
                    </div>
                    
                    {/* Connection Status */}
                    <div className="flex items-center space-x-2">
                        <div className={`flex items-center space-x-1 text-xs ${connectionStatus ? 'text-green-400' : 'text-red-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${connectionStatus ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span>{connectionStatus ? 'Connected' : 'Offline'}</span>
                        </div>
                    </div>
                </div>

                {/* Post Card */}
                <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center overflow-hidden">
                                {getAvatarUrl(post.user.avatar) ? (
                                    <>
                                        <img 
                                            src={getAvatarUrl(post.user.avatar)!}
                                            alt={`${post.user.first_name} ${post.user.last_name}'s avatar`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to default User icon on error
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                        <User className="w-5 h-5 text-white hidden" />
                                    </>
                                ) : (
                                    <User className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="text-white font-medium">
                                        {post.user.first_name} {post.user.last_name}
                                    </h3>
                                    {isAuthorOnline && (
                                        <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span className="text-green-400 text-xs">Online</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-white/60 text-sm">
                                    @{post.user.nickname || post.user.email.split('@')[0]} • {formatTimeAgo(post.created_at)}
                                </p>
                            </div>
                        </div>
                        <button 
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                            title="More options"
                            aria-label="More options"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Post Content */}
                    <p className="text-white mb-4 text-base leading-relaxed whitespace-pre-wrap">
                        {post.content}
                    </p>

                    {/* Post Image */}
                    {post.image_url && (
                        <div className="mb-4 rounded-xl overflow-hidden bg-white/5">
                            <img 
                                src={post.image_url.startsWith('http') ? 
                                    post.image_url : 
                                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${post.image_url}`
                                } 
                                alt="Post image" 
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                    // Fallback to placeholder on error
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center hidden">
                                <ImageIcon className="w-12 h-12 text-white/50" />
                                <span className="ml-2 text-white/70">Image failed to load</span>
                            </div>
                        </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <button
                            onClick={handleLikePost}
                            disabled={likePending || !connectionStatus}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                                post.is_liked
                                    ? 'text-red-400 bg-red-500/10'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            } ${likePending || !connectionStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''} ${likePending ? 'animate-pulse' : ''}`} />
                            <span>{post.like_count}</span>
                            {!connectionStatus && (
                                <span className="text-xs text-orange-400 ml-1">(Offline)</span>
                            )}
                        </button>

                        <button className="flex items-center space-x-2 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
                            <MessageSquare className="w-4 h-4" />
                            <span>{comments.length}</span>
                        </button>

                        <button className="flex items-center space-x-2 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
                            <Share className="w-4 h-4" />
                            <span>Share</span>
                        </button>
                    </div>
                </div>

                {/* Comment Form */}
                <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 mb-6">
                    <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {getAvatarUrl(user?.avatar) ? (
                                <>
                                    <img 
                                        src={getAvatarUrl(user?.avatar)!}
                                        alt={`${user?.first_name} ${user?.last_name}'s avatar`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to default User icon on error
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                    <User className="w-4 h-4 text-white hidden" />
                                </>
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
                                    disabled={!newComment.trim() || isSubmittingComment || !isConnected}
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
                                            <>
                                                <img 
                                                    src={getAvatarUrl(comment.user.avatar)!}
                                                    alt={`${comment.user.first_name} ${comment.user.last_name}'s avatar`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Fallback to default User icon on error
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                <User className="w-4 h-4 text-white hidden" />
                                            </>
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
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
