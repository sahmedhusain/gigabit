'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Heart, MessageSquare, Share, MoreHorizontal, Send, Image as ImageIcon } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { api, APIPost, Comment as CommentType, NetworkError, ValidationError } from '@/lib/api'

interface CommentWithUser extends CommentType {
    timeAgo: string
}

function PostDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { sendMessage, addMessageListener, isConnected } = useWebSocket()
    const { success, error } = useToast()

    // State
    const [post, setPost] = useState<APIPost | null>(null)
    const [comments, setComments] = useState<CommentWithUser[]>([])
    const [isLoadingPost, setIsLoadingPost] = useState(true)
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)

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

    // Handle like post
    const handleLikePost = async () => {
        if (!post || !user) return

        const wasLiked = post.is_liked

        // Optimistic update
        setPost(prev => prev ? {
            ...prev,
            is_liked: !prev.is_liked,
            like_count: prev.is_liked ? prev.like_count - 1 : prev.like_count + 1
        } : null)

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
        } catch (err) {
            // Revert optimistic update
            setPost(prev => prev ? {
                ...prev,
                is_liked: wasLiked,
                like_count: wasLiked ? prev.like_count + 1 : prev.like_count - 1
            } : null)

            console.error('Error toggling like:', err)
            if (err instanceof NetworkError) {
                error('Failed to update like. Please try again.')
            }
        }
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
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 mr-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-semibold text-white">Post Details</h1>
                </div>

                {/* Post Card */}
                <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="text-white font-medium">
                                        {post.user.first_name} {post.user.last_name}
                                    </h3>
                                </div>
                                <p className="text-white/60 text-sm">
                                    @{post.user.nickname || post.user.email.split('@')[0]} • {formatTimeAgo(post.created_at)}
                                </p>
                            </div>
                        </div>
                        <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
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
                            <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-white/50" />
                                <span className="ml-2 text-white/70">Image will be displayed here</span>
                            </div>
                        </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <button
                            onClick={handleLikePost}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${post.is_liked
                                ? 'text-red-400 bg-red-500/10'
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                            <span>{post.like_count}</span>
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
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
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
                                <span className="text-white/60 text-xs">
                                    {newComment.length}/500 characters
                                </span>
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={!newComment.trim() || isSubmittingComment || !isConnected}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-white/10 disabled:text-white/50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>{isSubmittingComment ? 'Posting...' : 'Post'}</span>
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
                                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-white" />
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
