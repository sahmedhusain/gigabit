'use client'
import React, { useState } from 'react'
import { X, AlertTriangle, Trash2, Loader2, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GroupDeleteModalProps } from '@/types/groups'

export default function GroupDeleteModal({
  show,
  onClose,
  groupTitle,
  memberCount,
  onDeleteGroup,
  isDeleting
}: GroupDeleteModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [understandConsequences, setUnderstandConsequences] = useState(false)

  const handleClose = () => {
    setConfirmText('')
    setUnderstandConsequences(false)
    onClose()
  }

  const handleDelete = () => {
    if (confirmText === 'DELETE' && understandConsequences) {
      onDeleteGroup()
    }
  }

  const canDelete = confirmText === 'DELETE' && understandConsequences

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
            className="relative w-full max-w-lg bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {}
            <motion.div
              className="relative p-6 pb-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-b border-red-400/30"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-full"
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
                      Delete Group
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      This action cannot be undone
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClose}
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

              {}
              <motion.div
                className="bg-red-500/10 border border-red-400/30 rounded-xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                                          <p className="text-red-200 font-medium text-sm mb-1">
                                            Deleting &quot;{groupTitle}&quot;
                                        </p>                    <p className="text-red-200/80 text-xs">
                      This will permanently remove the group and all associated content for {memberCount} {memberCount === 1 ? 'member' : 'members'}.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {}
            <motion.div
              className="relative p-6 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <h4 className="text-white font-medium text-sm mb-3">What will be permanently deleted:</h4>
                <div className="space-y-3">
                  <motion.div
                    className="flex items-start space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-2"></div>
                    <p className="text-white/80 text-sm">All posts, comments, and discussions</p>
                  </motion.div>
                  <motion.div
                    className="flex items-start space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-2"></div>
                    <p className="text-white/80 text-sm">All member invitations and requests</p>
                  </motion.div>
                  <motion.div
                    className="flex items-start space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-2"></div>
                    <p className="text-white/80 text-sm">Group membership and roles</p>
                  </motion.div>
                  <motion.div
                    className="flex items-start space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-2"></div>
                    <p className="text-white/80 text-sm">All group settings and configurations</p>
                  </motion.div>
                </div>
              </motion.div>

              {}
              <motion.div
                className="flex items-start space-x-3 p-4 bg-white/5 border border-white/20 rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                <input
                  type="checkbox"
                  id="understand-consequences"
                  checked={understandConsequences}
                  onChange={(e) => setUnderstandConsequences(e.target.checked)}
                  className="w-4 h-4 text-emerald-400 bg-white/5 border-white/30 rounded focus:ring-emerald-400/50 focus:ring-2 mt-0.5"
                />
                <label
                  htmlFor="understand-consequences"
                  className="text-white/80 text-sm cursor-pointer leading-relaxed"
                >
                  I understand that this action is permanent and cannot be undone. All group data will be lost forever.
                </label>
              </motion.div>

              {}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                <label className="block text-white font-medium mb-2 text-sm">
                  Type &quot;DELETE&quot; to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE here..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400/50 transition-all duration-300"
                />
                <p className="text-white/60 text-xs mt-2">
                  This helps prevent accidental deletions
                </p>
              </motion.div>
            </motion.div>

            {}
            <motion.div
              className="relative p-6 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <motion.button
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  disabled={isDeleting || !canDelete}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 ${
                    isDeleting || !canDelete
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/25'
                  }`}
                  whileHover={{ scale: (isDeleting || !canDelete) ? 1 : 1.05 }}
                  whileTap={{ scale: (isDeleting || !canDelete) ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Group</span>
                    </>
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