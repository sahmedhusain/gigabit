'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Heart, MoreHorizontal, User as UserIcon, ThumbsDown, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { api, PostResponse } from '@/lib/api'
import CreateGroupPost from '../CreateGroupPost'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getAvatarUrl } from '@/utils/avatarUtils'
import { useToast } from '@/context/ToastContext'

interface GroupPostsTabProps {
  groupId: number
  groupTitle: string
}

const GroupPostsTab: React.FC<GroupPostsTabProps> = ({ groupId, groupTitle }) => {
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isAdminOrCreator, setIsAdminOrCreator] = useState(false)
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [postToDelete, setPostToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { success, error: showError } = useToast()

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
        
        // Fetch user role to check if admin or creator
        const roleResponse = await api.getUserRole(groupId)
        setIsAdminOrCreator(roleResponse.is_admin_or_creator)
        
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuPostId !== null) {
        setOpenMenuPostId(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuPostId])

  // Handle post created
  const handlePostCreated = async () => {
    // Refetch posts to get complete data with user info
    try {
      const response = await api.getGroupPosts(groupId)
      setPosts(response.posts || [])
    } catch (error) {
      console.error('Failed to refresh posts:', error)
    }
  }

  // Handle delete post
  const handleDeletePost = async (postId: number) => {
    setPostToDelete(postId)
    setShowDeleteConfirm(true)
    setOpenMenuPostId(null)
  }

  // Confirm delete post
  const confirmDeletePost = async () => {
    if (!postToDelete) return

    setIsDeleting(true)
    try {
      // Delete from database via API (using group-specific endpoint)
      await api.deleteGroupPost(groupId, postToDelete)
      
      // Update UI by removing the post
      setPosts(posts.filter(p => p.id !== postToDelete))
      
      success('Post deleted successfully!')
      setShowDeleteConfirm(false)
      setPostToDelete(null)
    } catch (error) {
      console.error('Failed to delete post:', error)
      showError('Failed to delete post. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setPostToDelete(null)
  }

  // Check if user can delete post (post creator or group admin/creator)
  const canDeletePost = (post: PostResponse) => {
    return user?.id === post.user.id || isAdminOrCreator
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
              className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6 cursor-pointer hover:bg-white/15 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Post Header */}
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Clickable Avatar */}
                  <div 
                    className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-400/50 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/profile/${post.user.id}`)
                    }}
                  >
                    {getAvatarUrl(post.user.avatar) ? (
                      <>
                        <Image 
                          src={getAvatarUrl(post.user.avatar)!}
                          alt={`${post.user.first_name} ${post.user.last_name}`}
                          width={40}
                          height={40}
                          unoptimized={getAvatarUrl(post.user.avatar)!.includes('/svg')}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <UserIcon className="w-4 h-4 lg:w-5 lg:h-5 text-white hidden" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                        {post.user.first_name[0]}{post.user.last_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {/* Clickable Name */}
                      <h4 
                        className="text-white font-medium text-sm lg:text-base truncate cursor-pointer hover:text-emerald-300 transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/profile/${post.user.id}`)
                        }}
                      >
                        {post.user.first_name} {post.user.last_name}
                      </h4>
                    </div>
                    <p className="text-white/60 text-xs lg:text-sm">{formatTime(post.created_at)}</p>
                  </div>
                </div>
                {canDeletePost(post) && (
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)
                      }}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 flex-shrink-0"
                      title="More options"
                      aria-label="More options">
                      <MoreHorizontal className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {openMenuPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePost(post.id)
                            }}
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
              <p className="text-white mb-3 lg:mb-4 text-sm lg:text-base leading-relaxed">{post.content}</p>

              {/* Post Image */}
              {post.image_url && (
                <div className="mb-3 lg:mb-4 rounded-xl lg:rounded-2xl overflow-hidden bg-white/5">
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-white/10">
                <div className="flex items-center space-x-2 lg:space-x-4">
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
                                is_disliked: false,
                                like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
                                dislike_count: p.is_disliked ? p.dislike_count - 1 : p.dislike_count
                              }
                            : p
                        ))
                      } catch (error) {
                        console.error('Failed to toggle like:', error)
                      }
                    }}
                    className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                      post.is_liked
                        ? 'text-red-400 bg-red-500/10'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className={`w-3 h-3 lg:w-4 lg:h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span>{post.like_count}</span>
                  </motion.button>

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
                                is_liked: false,
                                dislike_count: p.is_disliked ? p.dislike_count - 1 : p.dislike_count + 1,
                                like_count: p.is_liked ? p.like_count - 1 : p.like_count
                              }
                            : p
                        ))
                      } catch (error) {
                        console.error('Failed to toggle dislike:', error)
                      }
                    }}
                    className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                      post.is_disliked
                        ? 'text-orange-400 bg-orange-500/10'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ThumbsDown className={`w-3 h-3 lg:w-4 lg:h-4 ${post.is_disliked ? 'fill-current' : ''}`} />
                    <span>{post.dislike_count}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Post Modal Component */}
      <CreateGroupPost
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        groupId={groupId}
        groupTitle={groupTitle}
        onPostCreated={handlePostCreated}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelDelete}
          >
            <motion.div
              className="relative w-full max-w-md bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Delete Post</h3>
                    <p className="text-white/60 text-sm">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-white/80 text-sm lg:text-base">
                  Are you sure you want to delete this post? This will permanently remove the post from the group and cannot be recovered.
                </p>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <motion.button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="w-full sm:w-auto px-6 py-2.5 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isDeleting ? 1 : 1.05 }}
                  whileTap={{ scale: isDeleting ? 1 : 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={confirmDeletePost}
                  disabled={isDeleting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  whileHover={{ scale: isDeleting ? 1 : 1.05 }}
                  whileTap={{ scale: isDeleting ? 1 : 0.95 }}
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Post</span>
                    </>
                  )}
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