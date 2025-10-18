'use client'
import { useState, useEffect } from 'react'
import { Heart, MessageSquare, Bookmark, Send, Sparkles, User, Image as ImageIcon, X, MoreHorizontal, Globe, Lock, EyeOff, Plus, ArrowUp, ArrowDown } from 'lucide-react'
import { Post, Comment } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import Image from 'next/image'
import { getAvatarUrl } from '@/utils/avatarUtils'

interface ActivitySectionProps {
  activitySubTab: string
  posts: Post[]
  onPostLike: (postId: number) => void
  onPostBookmark?: (postId: number) => void
  sortOrder?: 'newest' | 'oldest'
  setSortOrder?: (sort: 'newest' | 'oldest') => void
}

export default function ActivitySection({
  activitySubTab,
  posts,
  onPostLike,
  onPostBookmark,
  sortOrder = 'newest',
  setSortOrder
}: ActivitySectionProps) {
  const router = useRouter()
  const { success, error } = useToast()

  // Comment modal state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [selectedPostForComment, setSelectedPostForComment] = useState<Post | null>(null)
  const [newComment, setNewComment] = useState('')
  const [newCommentImage, setNewCommentImage] = useState<File | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Comments state for displaying recent comments
  const [postComments, setPostComments] = useState<{ [postId: number]: Comment[] }>({})

  const handlePostClick = (postId: number, e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    const url = `/post/${postId}?from=activity&subTab=${activitySubTab}`
    router.push(url)
  }

  const handleCommentClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPostForComment(post)
    setIsCommentModalOpen(true)
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

      // Create comment via HTTP API
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

      // Clear the input and close modal
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

  // Fetch comments for commented posts
  const fetchCommentsForCommentedPosts = async () => {
    if (activitySubTab !== 'commented') return

    try {
      const commentsMap: { [postId: number]: Comment[] } = {}

      for (const post of commentedPosts) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/posts/${post.id}/comments?limit=5&offset=0`, {
            method: 'GET',
            headers: {
              ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
            },
            credentials: 'include'
          })

          if (response.ok) {
            const data = await response.json()
            // Sort comments by created_at descending to get most recent first
            const sortedComments = (data.comments || []).sort((a: Comment, b: Comment) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            commentsMap[post.id] = sortedComments
          }
        } catch (error) {
          console.error(`Error fetching comments for post ${post.id}:`, error)
        }
      }

      setPostComments(commentsMap)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  // Fetch comments when activitySubTab changes to 'commented'
  useEffect(() => {
    if (activitySubTab === 'commented') {
      fetchCommentsForCommentedPosts()
    }
  }, [activitySubTab, posts])
  // Mock data for demonstration - in real app, this would come from API
  const likedPosts = posts.filter(post => post.isLiked)
  const commentedPosts = posts.slice(0, 3) // Mock commented posts
  const savedPosts = posts.slice(0, 2) // Mock saved posts

  const renderPostCard = (post: Post, activityType: string, index: number) => {
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
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                  {post.user.name[0]?.toUpperCase()}
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

            {/* Clickable Username and Time with Activity Icon */}
            <p
              className="text-white/70 text-sm cursor-pointer hover:text-white/90 transition-colors duration-200 flex items-center space-x-2"
              onClick={(e) => {
                e.stopPropagation()
                if (post.user.id && post.user.id !== 0) {
                  router.push(`/profile/${post.user.id}`)
                }
              }}
            >
              <span>@{post.user.username}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                {activityType === 'liked' && <Heart className="w-3 h-3 text-red-400" />}
                {activityType === 'commented' && <MessageSquare className="w-3 h-3 text-blue-400" />}
                {activityType === 'saved' && <Bookmark className="w-3 h-3 text-yellow-400" />}
                <span>{post.timeAgo}</span>
              </span>
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
      <div className="mb-4">
        <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Post Image */}
      {post.image && (
        <div className="mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-transparent border border-white/10 group-hover:border-emerald-400/30 transition-all duration-300">
          <Image
            src={post.image}
            alt="Post image"
            width={640}
            height={256}
            unoptimized={post.image.includes('/svg')}
            className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
          />
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

      {/* Display recent comment for commented posts */}
      {activityType === 'commented' && postComments[post.id] && postComments[post.id].length > 0 && (
        <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {getAvatarUrl(postComments[post.id][0].user.avatar) ? (
                <Image
                  src={getAvatarUrl(postComments[post.id][0].user.avatar)!}
                  alt={`${postComments[post.id][0].user.first_name}'s avatar`}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {postComments[post.id][0].user.first_name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-white font-semibold text-sm">
                  {postComments[post.id][0].user.first_name} {postComments[post.id][0].user.last_name}
                </span>
                <span className="text-white/60 text-xs">
                  {new Date(postComments[post.id][0].created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                {postComments[post.id][0].content}
              </p>
              {postComments[post.id][0].image_url && (
                <div className="mt-2 rounded-lg overflow-hidden max-w-xs">
                  <Image
                    src={postComments[post.id][0].image_url!}
                    alt="Comment image"
                    width={200}
                    height={150}
                    unoptimized={postComments[post.id][0].image_url!.includes('/svg')}
                    className="w-full h-auto max-h-32 object-contain"
                  />
                </div>
              )}
              {post.comments > 1 && (
                <div className="mt-2 text-white/60 text-xs">
                  + {post.comments - 1} more comment{post.comments - 1 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    )
  }

  const renderContent = () => {
    let postsToShow: Post[] = []
    let emptyMessage = ''
    let emptyIcon = <Heart className="w-16 h-16 text-white/30 mx-auto mb-4" />

    switch (activitySubTab) {
      case 'liked': {
        postsToShow = likedPosts
        emptyMessage = 'No liked posts yet'
        emptyIcon = <Heart className="w-16 h-16 text-white/30 mx-auto mb-4" />
        break
      }
      case 'commented': {
        postsToShow = commentedPosts
        emptyMessage = 'No commented posts yet'
        emptyIcon = <MessageSquare className="w-16 h-16 text-white/30 mx-auto mb-4" />
        break
      }
      case 'saved': {
        postsToShow = savedPosts
        emptyMessage = 'No saved posts yet'
        emptyIcon = <Bookmark className="w-16 h-16 text-white/30 mx-auto mb-4" />
        break
      }
      default: {
        postsToShow = likedPosts
        emptyMessage = 'No activity yet'
        break
      }
    }

    // Apply sorting
    postsToShow = postsToShow.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()

      if (sortOrder === 'newest') {
        return dateB - dateA // Newest first
      } else {
        return dateA - dateB // Oldest first
      }
    })

    if (postsToShow.length === 0) {
      return (
        <div className="text-center py-16">
          {emptyIcon}
          <p className="text-white/60">{emptyMessage}</p>
          <p className="text-white/40 text-sm mt-2">Start engaging with posts to see your activity here</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {postsToShow.map((post, index) => renderPostCard(post, activitySubTab, index))}
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
                  {activitySubTab === 'liked' && <Heart className="w-5 h-5 text-white drop-shadow-sm" />}
                  {activitySubTab === 'commented' && <MessageSquare className="w-5 h-5 text-white drop-shadow-sm" />}
                  {activitySubTab === 'saved' && <Bookmark className="w-5 h-5 text-white drop-shadow-sm" />}
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>

              {/* Title and Description */}
              <div className="flex-1">
                <h1 className="text-xl lg:text-2xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors duration-300">
                  {activitySubTab === 'liked' ? 'Liked Posts' :
                   activitySubTab === 'commented' ? 'Commented Posts' :
                   activitySubTab === 'saved' ? 'Saved Posts' : 'Activity'}
                </h1>
                <p className="text-white/80 text-sm leading-relaxed">
                  {activitySubTab === 'liked' ? 'Posts you\'ve liked and enjoyed' :
                   activitySubTab === 'commented' ? 'Posts you\'ve commented on and discussed' :
                   activitySubTab === 'saved' ? 'Your bookmarked posts for later' : 'Your activity across the platform'}
                </p>
              </div>
            </div>

            {/* Sort Toggle */}
            {setSortOrder && (
              <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/20">
                <button
                  onClick={() => setSortOrder('newest')}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortOrder === 'oldest'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ArrowDown className="w-4 h-4" />
                  <span>Oldest</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-scroll scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {renderContent()}
      </div>

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
                    <label htmlFor="activity-comment-image-input" className="sr-only">Upload image</label>
                    <input
                      id="activity-comment-image-input"
                      type="file"
                      accept="image/*"
                      onChange={e => setNewCommentImage(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => document.getElementById('activity-comment-image-input')?.click()}
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
    </div>
  )}
