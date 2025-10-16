'use client'
import { X, Camera } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConnectionStatus } from '@/hooks'
import { useToast } from '@/context/ToastContext'
import { api } from '@/lib/api'

interface CreateGroupPostProps {
  show: boolean
  onClose: () => void
  groupId: number
  groupTitle: string
  onPostCreated?: () => void
}

export default function CreateGroupPost({
  show,
  onClose,
  groupId,
  groupTitle,
  onPostCreated
}: CreateGroupPostProps) {
  const { success, error: toastError } = useToast()
  const { isConnected } = useConnectionStatus()

  const [newPostContent, setNewPostContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreatePost = async () => {
    if (!isConnected) {
      toastError('Cannot create post while offline')
      return
    }

    if (!newPostContent.trim()) {
      toastError('Post content is required')
      return
    }

    setIsLoading(true)

    try {
      const postData = {
        content: newPostContent.trim(),
        image_url: ''
      }

      await api.createGroupPost(groupId, postData)
      
      success('Group post created successfully!')

      // Reset form
      setNewPostContent('')
      
      onPostCreated?.()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create post. Please try again.'
      toastError(`Failed to create group post: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && newPostContent.trim()) {
      e.preventDefault()
      handleCreatePost()
    }
  }

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-full max-w-2xl h-[80vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <motion.div
              className="relative flex-shrink-0 p-6 lg:p-8 pb-4 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Camera className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <div>
                    <motion.h3
                      className="text-xl lg:text-2xl font-bold text-white mb-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Create Post in {groupTitle}
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Share moments with your community
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  title="Close"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                </motion.button>
              </div>
            </motion.div>

            {/* Scrollable Content Area */}
            <motion.div
              className="relative flex-1 overflow-y-auto px-6 lg:px-8 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Post Content */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>Your Message</span>
                  </motion.label>
                  <div className="relative">
                    <motion.textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share what's on your mind, updates, or anything you'd like the group to know..."
                      className="w-full h-40 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      maxLength={5000}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute bottom-4 right-4 text-xs text-white/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      {newPostContent.length}/5000
                    </motion.div>
                  </div>
                </motion.div>

                {/* Connection Status */}
                <AnimatePresence>
                  {!isConnected && (
                    <motion.div
                      className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-red-300 text-sm font-medium">You are currently offline. Post will be created when connection is restored.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="relative flex-shrink-0 p-6 lg:p-8 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <motion.button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCreatePost}
                  disabled={isLoading || !isConnected || !newPostContent.trim()}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg ${
                    isLoading || !isConnected || !newPostContent.trim()
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  }`}
                  whileHover={{ scale: (isLoading || !isConnected || !newPostContent.trim()) ? 1 : 1.05 }}
                  whileTap={{ scale: (isLoading || !isConnected || !newPostContent.trim()) ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Posting...</span>
                    </div>
                  ) : !isConnected ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      />
                      <span>Offline</span>
                    </div>
                  ) : (
                    'Create Post'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
