'use client'
import { X, Users } from 'lucide-react'
import { CreateGroupRequest, api } from '@/lib/api'
import { useState } from 'react'
import { useOptimisticUpdate, useConnectionStatus } from '@/hooks'
import { useToast } from '@/context/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateGroupProps {
  show: boolean
  onClose: () => void
  onGroupCreated?: () => void
}

export default function CreateGroup({
  show,
  onClose,
  onGroupCreated
}: CreateGroupProps) {
  const [groupTitle, setGroupTitle] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [error, setError] = useState<string>('')
  const { success, error: showError } = useToast()
  const { isConnected } = useConnectionStatus()

  const { isLoading, performUpdate } = useOptimisticUpdate({
    onSuccess: () => {
      success('Group created successfully!')
      // Reset form
      setGroupTitle('')
      setGroupDescription('')
      setError('')
      onGroupCreated?.()
      onClose()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      showError(`Failed to create group: ${message}`)
    }
  })

  const handleCreateGroup = async () => {
    // Validation
    if (!groupTitle.trim()) {
      setError('Group title is required')
      return
    }

    if (groupTitle.length > 100) {
      setError('Group title cannot exceed 100 characters')
      return
    }

    if (groupDescription.length > 500) {
      setError('Group description cannot exceed 500 characters')
      return
    }

    if (!isConnected) {
      showError('Cannot create group while offline')
      return
    }

    setError('')

    const groupData: CreateGroupRequest = {
      title: groupTitle.trim(),
      description: groupDescription.trim()
    }

    performUpdate(
      (current) => ({ ...current, isCreating: true }),
      async () => {
        await api.createGroup(groupData)
        return {}
      }
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreateGroup()
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
            className="relative w-full max-w-2xl h-[90vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
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
                      <Users className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                    />
                  </motion.div>
                  <div>
                    <motion.h3
                      className="text-xl lg:text-2xl font-bold text-white mb-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Create New Group
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Build a community around shared interests
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
                {/* Group Title */}
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
                    <span>Group Title *</span>
                  </motion.label>
                  <div className="relative">
                    <motion.input
                      type="text"
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter a catchy group name..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 hover:bg-white/15 text-sm lg:text-base"
                      maxLength={100}
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
                      {groupTitle.length}/100
                    </motion.div>
                  </div>
                </motion.div>

                {/* Group Description */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span>Description</span>
                  </motion.label>
                  <div className="relative">
                    <motion.textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Describe what your group is about, its purpose, and what members can expect..."
                      className="w-full h-32 lg:h-36 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      maxLength={500}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute bottom-4 right-4 text-xs text-white/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                    >
                      {groupDescription.length}/500
                    </motion.div>
                  </div>
                </motion.div>

                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-red-300 text-sm font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                      <p className="text-red-300 text-sm font-medium">You are currently offline. Group will be created when connection is restored.</p>
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
                  onClick={handleCreateGroup}
                  disabled={isLoading || !groupTitle.trim() || !isConnected}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg ${
                    isLoading || !groupTitle.trim() || !isConnected
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  }`}
                  whileHover={{ scale: isLoading || !groupTitle.trim() || !isConnected ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading || !groupTitle.trim() || !isConnected ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Creating Group...</span>
                    </div>
                  ) : !isConnected ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      />
                      <span>Offline</span>
                    </div>
                  ) : (
                    'Create Group'
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
