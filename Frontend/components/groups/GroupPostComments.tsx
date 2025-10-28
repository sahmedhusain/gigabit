'use client'
import React, { useState, useEffect } from 'react'
import { Send, Trash2, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { api, GroupPostCommentResponse } from '@/lib/api'
import Image from 'next/image'
import { getAvatarUrl, getUserInitials } from '@/utils/avatarUtils'
import { useToast } from '@/context/ToastContext'
import { useRouter } from 'next/navigation'

interface GroupPostCommentsProps {
  groupId: number
  postId: number
  isAdminOrCreator: boolean
  isOpen: boolean
  commentCount: number
}

const GroupPostComments: React.FC<GroupPostCommentsProps> = ({
  groupId,
  postId,
  isAdminOrCreator,
  isOpen,
}) => {
  const [comments, setComments] = useState<GroupPostCommentResponse[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const router = useRouter()

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const response = await api.getGroupPostComments(groupId, postId)
      setComments(response.comments || [])
    } catch (error) {
      console.error('Failed to load comments:', error)
      showError('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, groupId, postId])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await api.createGroupPostComment(groupId, postId, newComment.trim())
      setComments([...comments, response.comment])
      setNewComment('')
      success('Comment added!')
    } catch (error) {
      console.error('Failed to create comment:', error)
      showError('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = (commentId: number) => {
    setCommentToDelete(commentId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return

    setIsDeleting(true)
    try {
      await api.deleteGroupPostComment(groupId, postId, commentToDelete)
      setComments(comments.filter(c => c.id !== commentToDelete))
      success('Comment deleted!')
      setShowDeleteConfirm(false)
      setCommentToDelete(null)
    } catch (error) {
      console.error('Failed to delete comment:', error)
      showError('Failed to delete comment')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setCommentToDelete(null)
  }

  const canDeleteComment = (comment: GroupPostCommentResponse) => {
    return user?.id === comment.user_id || isAdminOrCreator
  }

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

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 space-y-4"
    >
      {/* Comment Input */}
      <form onSubmit={handleSubmitComment} className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/20">
            {user && getAvatarUrl(user.avatar) ? (
              <Image
                src={getAvatarUrl(user.avatar)!}
                alt="Your avatar"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user && getUserInitials(user)}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 resize-none"
            rows={2}
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-white/50 text-xs">
              {newComment.length}/500
            </span>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
            />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-white/60">
            <MessageCircle className="w-12 h-12 mb-3" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-3 bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <div
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => {
                    if (comment.user.id && comment.user.id !== 0) {
                      router.push(`/profile/${comment.user.id}`)
                    }
                  }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/20 hover:ring-emerald-400/50 transition-all duration-300">
                    {getAvatarUrl(comment.user.avatar) ? (
                      <Image
                        src={getAvatarUrl(comment.user.avatar)!}
                        alt={`${comment.user.first_name}'s avatar`}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {getUserInitials(comment.user)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className="cursor-pointer hover:text-emerald-300 transition-colors duration-200"
                      onClick={() => {
                        if (comment.user.id && comment.user.id !== 0) {
                          router.push(`/profile/${comment.user.id}`)
                        }
                      }}
                    >
                      <span className="text-white font-semibold text-sm">
                        {comment.user.first_name} {comment.user.last_name}
                      </span>
                      <span className="text-white/50 text-xs ml-2">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                    {canDeleteComment(comment) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

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
                <h3 className="text-white font-semibold text-lg mb-2">Delete Comment</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to delete this comment? This action cannot be undone.
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
    </motion.div>
  )
}

export default GroupPostComments

