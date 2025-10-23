'use client'
import React, { useState, useEffect } from 'react'
import { Plus, MoreHorizontal, Newspaper, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { api, PostResponse } from '@/lib/api'
import CreateGroupPost from '../CreateGroupPost'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getAvatarUrl, getUserInitials } from '@/utils/avatarUtils'
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
  const [groupPermissions, setGroupPermissions] = useState<{ create_posts: 'all_members' | 'admins_only' } | null>(null)
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
        
        // Fetch group data to get permissions
        const groupData = await api.getGroup(groupId)
        setGroupPermissions({
          create_posts: groupData.create_posts
        })
        
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

  // Check if user can create posts
  const canCreatePosts = () => {
    if (!groupPermissions) return false
    return groupPermissions.create_posts === 'all_members' || isAdminOrCreator
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
      {/* Header */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6 mt-2 hover:shadow-emerald-500/10 transition-all duration-500 mx-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                <Newspaper className="w-4 h-4 text-white drop-shadow-sm" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white mb-0.5">Group Posts</h2>
              <p className="text-white/70 text-xs lg:text-sm">Share and discover content with your group members</p>
            </div>
          </div>
          {canCreatePosts() ? (
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-medium transition-all duration-300 shadow-md hover:shadow-lg self-start sm:self-center text-sm"
              whileHover={{ scale: 1.02, y: -0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Post</span>
            </motion.button>
          ) : (
            <div className="text-white/60 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 self-start sm:self-center">
              Only admins and creators can create posts
            </div>
          )}
        </div>
      </div>

      {/* Posts Content */}
      <div className="flex-1 overflow-y-scroll scrollbar-hide p-6 space-y-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
            <div className="text-center max-w-md mx-auto">
              <Newspaper className="w-16 h-16 text-white/40 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
              <p className="text-white/60 mb-6">Be the first to share something with the group!</p>
              {canCreatePosts() ? (
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create First Post
                </motion.button>
              ) : (
                <div className="text-white/60 text-sm bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                  Only admins and creators can create posts
                </div>
              )}
            </div>
          </motion.div>
        ) : (
            posts.filter(post => post.user).map((post, index) => (
            <motion.div
              key={post.id}
              className={`bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer animate-fade-in animate-slide-in-from-bottom`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={(e) => {
                // Don't navigate if clicking on interactive elements
                if ((e.target as HTMLElement).closest('button')) {
                  return
                }
                // For now, just prevent navigation since group posts don't have individual pages
                e.stopPropagation()
              }}
            >
              {/* Post Header */}
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
                          alt={`${post.user.first_name} ${post.user.last_name}'s avatar`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                          {getUserInitials(post.user)}
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
                        {post.user.first_name} {post.user.last_name}
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
                      @{post.user.first_name.toLowerCase()}{post.user.last_name.toLowerCase()} • {formatTime(post.created_at)}
                    </p>
                  </div>
                </div>

                {canDeletePost(post) && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)
                      }}
                      className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
                      title="More options"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="w-5 h-5" />
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
              <div className="mb-4">
                <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Post Image */}
              {post.image_url && (
                <div className="mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-transparent border border-white/10 group-hover:border-emerald-400/30 transition-all duration-300">
                  <Image
                    src={post.image_url}
                    alt="Post image"
                    width={640}
                    height={256}
                    unoptimized={post.image_url.includes('/svg')}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center space-x-4">
                  <button
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
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
                      post.is_liked
                        ? 'text-red-400 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30'
                        : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
                    }`}
                    title="Like"
                  >
                    <ThumbsUp className={`w-5 h-5 ${post.is_liked ? 'fill-current animate-pulse' : ''}`} />
                    <span className="text-sm font-medium">{post.like_count}</span>
                  </button>

                  <button
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
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
                      post.is_disliked
                        ? 'text-orange-400 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30'
                        : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
                    }`}
                    title="Dislike"
                  >
                    <ThumbsDown className={`w-5 h-5 ${post.is_disliked ? 'fill-current animate-pulse' : ''}`} />
                    <span className="text-sm font-medium">{post.dislike_count}</span>
                  </button>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={cancelDelete}
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
                    onClick={cancelDelete}
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
    </div>
  )
}

export default GroupPostsTab