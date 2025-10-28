'use client'
import React, { useEffect } from 'react'
import Image from 'next/image'
import { X, Search, Check, Send, Loader2, UserPlus, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUserInitials } from '@/utils/avatarUtils'
import { GroupInviteModalProps } from '@/types/groups'

export default function GroupInviteModal({
  show,
  onClose,
  groupTitle,
  allUsers,
  filteredUsers,
  searchTerm,
  selectedUsers,
  isInviting,
  isLoading = false,
  onSearchUsers,
  onUserSelect,
  onInviteUsers
}: GroupInviteModalProps) {
  useEffect(() => {
    if (!show) {
      onSearchUsers('')
    }
  }, [show, onSearchUsers])

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
                      <UserPlus className="w-6 h-6 text-white drop-shadow-sm" />
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
                      Invite Members to {groupTitle}
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Select users to invite to your group
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

              {/* Selection Summary */}
              {selectedUsers.length > 0 && (
                <motion.div
                  className="bg-emerald-500/20 border border-emerald-400/50 rounded-xl p-4 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <p className="text-emerald-200 text-sm font-medium">
                    Selected: {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'}
                  </p>
                </motion.div>
              )}

              {/* Search Input */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-cyan-500/20 backdrop-blur-sm rounded-xl border border-white/20"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-white/60">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users by name or username..."
                    value={searchTerm}
                    onChange={(e) => onSearchUsers(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => onSearchUsers('')}
                      className="absolute right-4 text-white/60 hover:text-white transition-colors"
                      title="Clear search"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Scrollable Content Area */}
            <motion.div
              className="relative flex-1 overflow-y-auto px-6 lg:px-8 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="space-y-3">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      onClick={() => onUserSelect(user.id)}
                      className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                        selectedUsers.includes(user.id)
                          ? 'bg-emerald-500/20 border-emerald-400/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + filteredUsers.indexOf(user) * 0.05, duration: 0.3 }}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={`${user.first_name} ${user.last_name}`}
                              width={48}
                              height={48}
                              unoptimized={true}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {getUserInitials(user)}
                            </div>
                          )}
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium text-sm truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          {user.is_private && (
                            <Lock className="w-3 h-3 text-orange-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-white/60 text-xs">
                          @{user.nickname || user.first_name.toLowerCase()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : allUsers.length === 0 && !isLoading ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">No users found matching your search</p>
                    <p className="text-white/40 text-sm mt-2">Try a different search term</p>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/60 text-sm">Loading users...</p>
                  </div>
                ) : null}
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
                  onClick={onInviteUsers}
                  disabled={isInviting || selectedUsers.length === 0}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 ${
                    isInviting || selectedUsers.length === 0
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  }`}
                  whileHover={{ scale: (isInviting || selectedUsers.length === 0) ? 1 : 1.05 }}
                  whileTap={{ scale: (isInviting || selectedUsers.length === 0) ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Invitations ({selectedUsers.length})</span>
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