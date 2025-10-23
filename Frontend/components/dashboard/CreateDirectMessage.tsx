'use client'
import { useState, useMemo } from 'react'
import Image from 'next/image'
import { X, Search, MessageSquarePlus, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConversationResponse } from '@/lib/api'
import { getUserInitials } from '@/utils/avatarUtils'

interface Follower {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar?: string
  nickname?: string
}

interface CreateDirectMessageProps {
  show: boolean
  onClose: () => void
  followings: Follower[]
  conversations: ConversationResponse[] // Add conversations prop
  onStartChat: (followerId: number) => void
  isLoading: boolean
  getUserStatus: (userId: number) => string
}

export default function CreateDirectMessage({
  show,
  onClose,
  followings,
  conversations,
  onStartChat,
  isLoading,
  getUserStatus
}: CreateDirectMessageProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFollowers = useMemo(() => {
    let filtered = [] as Follower[];
    if (!searchQuery) {
      filtered = followings.filter(following => {
        const hasExistingConversation = conversations.some(
          conv => conv.type === 'private' && conv.participant?.id === following.id
        )
        return !hasExistingConversation
      })
    } else {
      filtered = followings.filter(following => {
        const fullName = `${following.first_name} ${following.last_name}`.toLowerCase()
        const nickname = following.nickname?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        const matchesSearch = fullName.includes(query) || nickname.includes(query)
        const hasExistingConversation = conversations.some(
          conv => conv.type === 'private' && conv.participant?.id === following.id
        )
        return matchesSearch && !hasExistingConversation
      })
    }
    // Sort: online first, then alphabetically by name or nickname
    return filtered.sort((a, b) => {
      const aOnline = getUserStatus(a.id) === 'online';
      const bOnline = getUserStatus(b.id) === 'online';
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      // Both online or both not online: sort alphabetically
      const aName = (a.nickname || `${a.first_name} ${a.last_name}`).toLowerCase();
      const bName = (b.nickname || `${b.first_name} ${b.last_name}`).toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [followings, conversations, searchQuery, getUserStatus])

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
            className="relative w-full max-w-lg h-[85vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
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
                      <MessageCircle className="w-6 h-6 text-white drop-shadow-sm" />
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
                      New Message
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Start a conversation with a following
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
                  transition={{ delay: 0.4, duration: 0.3, type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                </motion.button>
              </div>
            </motion.div>

            {/* Search Section */}
            <motion.div
              className="relative flex-shrink-0 px-6 lg:px-8 py-6 border-b border-white/10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="space-y-3">
                <motion.label
                  className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Search Followings</span>
                </motion.label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                  <motion.input
                    type="text"
                    placeholder="Search by name or nickname..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 hover:bg-white/15 text-sm lg:text-base"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Scrollable Content Area */}
            <motion.div
              className="relative flex-1 overflow-y-auto px-6 lg:px-8 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <div className="space-y-4">
                {isLoading ? (
                  <motion.div
                    className="flex items-center justify-center h-64"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                      <span className="text-white/70 text-sm lg:text-base">Loading followers...</span>
                    </div>
                  </motion.div>
                ) : filteredFollowers.length > 0 ? (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    {filteredFollowers.map((follower, index) => (
                      <motion.button
                        key={follower.id}
                        onClick={() => onStartChat(follower.id)}
                        className="w-full flex items-center space-x-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 group"
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.3 }}
                      >
                        <div className="relative">
                          <motion.div
                            className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            {follower.avatar ? (
                              <Image src={follower.avatar} alt={follower.first_name} width={48} height={48} unoptimized={true} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              getUserInitials(follower)
                            )}
                          </motion.div>
                          <motion.div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                              getUserStatus(follower.id) === 'online' ? 'bg-green-500' :
                              getUserStatus(follower.id) === 'busy' ? 'bg-red-500' :
                              getUserStatus(follower.id) === 'away' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                            animate={{ scale: [1, 1.2, 1] }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <motion.p
                            className="text-white font-semibold text-sm lg:text-base truncate group-hover:text-white/90"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          >
                            {`${follower.first_name} ${follower.last_name}`}
                          </motion.p>
                          {follower.nickname && (
                            <motion.p
                            className="text-white/60 text-xs lg:text-sm truncate group-hover:text-white/70"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3, duration: 0.3 }}
                            >
                              @{follower.nickname}
                            </motion.p>
                          )}
                        </div>
                        <motion.div
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4, duration: 0.3 }}
                        >
                          <MessageSquarePlus className="w-5 h-5 text-emerald-400" />
                        </motion.div>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-white/40 text-6xl mb-4"
                    >
                      💬
                    </motion.div>
                    <motion.h3
                      className="text-lg lg:text-xl font-semibold text-white mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      {searchQuery ? 'No followings found' : 'No followings to message'}
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm lg:text-base"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      {searchQuery
                        ? 'Try searching with a different name or nickname.'
                        : 'Follow some users to start messaging them.'
                      }
                    </motion.p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="relative flex-shrink-0 p-6 lg:p-8 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <div className="flex justify-end">
                <motion.button
                  onClick={onClose}
                  className="px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}