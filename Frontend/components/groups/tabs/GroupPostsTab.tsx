'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Heart, MessageCircle, Share2 } from 'lucide-react'
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
      const newPost = await api.createGroupPost(groupId, {
        content: newPostContent,
        image_url: ''
      })
      console.log('Created post:', newPost)
      setPosts([newPost, ...posts])
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
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Post Header */}
              <div className="flex items-start space-x-3 mb-4">
                {post.user.avatar ? (
                  <img
                    src={post.user.avatar}
                    alt={`${post.user.first_name} ${post.user.last_name}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                    {post.user.first_name[0]}{post.user.last_name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-white">
                    {post.user.first_name} {post.user.last_name}
                  </h4>
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
                <motion.button
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    post.is_liked
                      ? 'text-red-400 bg-red-500/20'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{post.like_count}</span>
                </motion.button>

                <motion.button
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{post.comment_count}</span>
                </motion.button>

                <motion.button
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 className="w-4 h-4" />
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/30 rounded-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Create New Post</h3>
              
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 resize-none min-h-[120px] mb-4"
                rows={4}
              />

              <div className="flex items-center justify-end space-x-3">
                <motion.button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isCreating}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCreating ? 'Creating...' : 'Create Post'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupPostsTab