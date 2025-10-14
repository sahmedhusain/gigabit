'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Heart, ThumbsDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { api, PostResponse } from '@/lib/api'

interface GroupPostsTabProps {
  groupId: number
}

const GroupPostsTab: React.FC<GroupPostsTabProps> = ({ groupId }) => {
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { user } = useAuth()

  // Fetch group posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) {
        console.log('User not authenticated, skipping posts fetch')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('Fetching posts for group:', groupId, 'User:', user.id)
        const response = await api.getGroupPosts(groupId)
        console.log('Group posts response:', response)
        setPosts(response.posts || [])
      } catch (error) {
        console.error('Failed to fetch group posts:', error)
        if (error instanceof Error) {
          console.error('Error details:', error.message)
        }
        
        // Check if it's an authentication or permission error
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          console.error('Authentication error - user may need to log in again')
        } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          console.error('Permission error - user may not be a member of this group')
        } else if (errorMessage.includes('500')) {
          console.error('Server error - there may be an issue with the backend')
        }
        
        setPosts([]) // Set empty array on error
      } finally {
        setIsLoading(false)
      }
    }

    if (groupId) {
      fetchPosts()
    }
  }, [groupId, user])

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || isCreating) return

    try {
      setIsCreating(true)
      console.log('Creating post for group:', groupId, 'content:', newPostContent)
        await api.createGroupPost(groupId, {
        content: newPostContent,
        image_url: ''
      })
        // Refetch posts to get complete data with user info
        const response = await api.getGroupPosts(groupId)
        setPosts(response.posts || [])
      setNewPostContent('')
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Create Post Button */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Group Posts</h2>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Post</span>
          </motion.button>
        </div>
      </div>

      {/* Posts Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
            />
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            className="flex items-center justify-center h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
              <p className="text-white/60 mb-6">Be the first to share something with the group!</p>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create First Post
              </motion.button>
            </div>
          </motion.div>
        ) : (
            posts.filter(post => post.user).map((post, index) => (
            <motion.div
              key={post.id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Post Header */}
              <div 
                className="flex items-start space-x-3 mb-4 cursor-pointer group"
                onClick={() => window.location.href = `/profile/${post.user.id}`}
              >
                <div className="relative">
                  {post.user.avatar ? (
                    <img
                      src={post.user.avatar}
                      alt={`${post.user.first_name} ${post.user.last_name}`}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-emerald-400 transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold ring-2 ring-transparent group-hover:ring-emerald-400 transition-all">
                      {post.user.first_name[0]}{post.user.last_name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {post.user.first_name} {post.user.last_name}
                    </h4>
                  </div>
                  <p className="text-white/60 text-sm">{formatTime(post.created_at)}</p>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-white leading-relaxed">{post.content}</p>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="mt-3 rounded-xl max-w-full h-auto"
                  />
                )}
              </div>

              {/* Post Actions */}
              <div className="flex items-center space-x-6 pt-3 border-t border-white/10">
                {/* Like Button */}
                <motion.button
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      if (post.is_liked) {
                        await api.unlikePost(post.id)
                      } else {
                        await api.likePost(post.id)
                      }
                      // Update the post in the local state
                      setPosts(posts.map(p => 
                        p.id === post.id 
                          ? { 
                              ...p, 
                              is_liked: !p.is_liked,
                              is_disliked: false, // Remove dislike if exists
                              like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
                              dislike_count: p.is_disliked ? p.dislike_count - 1 : p.dislike_count
                            }
                          : p
                      ))
                    } catch (error) {
                      console.error('Failed to toggle like:', error)
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    post.is_liked
                      ? 'text-emerald-400 bg-emerald-500/20'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{post.like_count}</span>
                </motion.button>

                {/* Dislike Button */}
                <motion.button
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      if (post.is_disliked) {
                        await api.undislikePost(post.id)
                      } else {
                        await api.dislikePost(post.id)
                      }
                      // Update the post in the local state
                      setPosts(posts.map(p => 
                        p.id === post.id 
                          ? { 
                              ...p, 
                              is_disliked: !p.is_disliked,
                              is_liked: false, // Remove like if exists
                              dislike_count: p.is_disliked ? p.dislike_count - 1 : p.dislike_count + 1,
                              like_count: p.is_liked ? p.like_count - 1 : p.like_count
                            }
                          : p
                      ))
                    } catch (error) {
                      console.error('Failed to toggle dislike:', error)
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    post.is_disliked
                      ? 'text-red-400 bg-red-500/20'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ThumbsDown className={`w-4 h-4 ${post.is_disliked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{post.dislike_count}</span>
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center py-8 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="relative w-full max-w-2xl h-[80vh] max-h-[600px] flex flex-col"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Enhanced backdrop with multiple layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>

              {/* Fixed Header */}
              <div className="relative flex-shrink-0 p-6 lg:p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Plus className="w-6 h-6 text-white drop-shadow-sm" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">Create Group Post</h3>
                      <p className="text-white/60 text-sm">Share your thoughts with the group</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
                    title="Close"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="relative flex-1 overflow-y-auto px-6 lg:px-8">
                <div className="space-y-6">
                  {/* Post Content */}
                  <div className="space-y-3">
                    <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span>What&apos;s on your mind?</span>
                    </label>
                    <div className="relative">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share your thoughts, ideas, or updates with the group..."
                        maxLength={5000}
                        className="w-full h-32 lg:h-36 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      />
                      <div className="absolute bottom-4 right-4 text-xs text-white/50">
                        {newPostContent.length}/5000
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="relative flex-shrink-0 p-6 lg:p-8 pt-4">
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || isCreating}
                    className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg ${
                      !newPostContent.trim() || isCreating
                        ? 'bg-white/20 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 shadow-emerald-500/25'
                    }`}
                  >
                    {isCreating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating Post...</span>
                      </div>
                    ) : (
                      'Create Post'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupPostsTab