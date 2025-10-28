'use client'
import { useState, useEffect, useCallback } from 'react'
import { Send, X, Users, MessageCircle, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { getAvatarUrl, getGroupInitials } from '@/utils/avatarUtils'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { SharePopupProps, ChatItem } from '@/types/ui'

export default function SharePopup({ postId, isOpen, onClose, onShareSuccess }: SharePopupProps) {
  const { success, error } = useToast()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [selectedChats, setSelectedChats] = useState<number[]>([])
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingChats, setFetchingChats] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Helper function to get initials based on chat type
  const getChatInitials = (chat: ChatItem): string => {
    if (chat.type === 'group') {
      return getGroupInitials(chat.name || 'Group')
    } else {
      
      return (chat.name || 'User').slice(0, 2).toUpperCase()
    }
  }

  const fetchRecentChats = useCallback(async () => {
    try {
      setFetchingChats(true)
      setIsSearching(false)
      const response = await api.getRecentChatsAndGroups()
      setChats(response.chats || [])
    } catch (err) {
      console.error('Failed to fetch recent chats:', err)
      error('Failed to load recent chats and groups')
    } finally {
      setFetchingChats(false)
    }
  }, [error])

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      fetchRecentChats()
      return
    }

    try {
      setIsSearching(true)
      setFetchingChats(true)
      const response = await api.searchShareableEntities(query)
      setChats(response.chats || [])
    } catch (err) {
      console.error('Failed to search shareable entities:', err)
      error('Failed to search chats and groups')
    } finally {
      setFetchingChats(false)
    }
  }, [error, fetchRecentChats])

  useEffect(() => {
    if (isOpen) {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery)
      } else {
        fetchRecentChats()
      }
    }
  }, [isOpen, searchQuery, performSearch, fetchRecentChats])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)

    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    
    const timeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query)
      } else if (query.trim().length === 0) {
        fetchRecentChats()
      }
    }, 300)

    setSearchTimeout(timeout)
  }

  const handleChatSelect = (chat: ChatItem) => {
    const totalSelected = getTotalSelected()
    
    if (chat.type === 'private') {
      const conversationId = typeof chat.id === 'string' ? parseInt(chat.id) : chat.id
      setSelectedChats(prev => {
        if (prev.includes(conversationId)) {
          return prev.filter(id => id !== conversationId)
        } else if (totalSelected < 5) {
          return [...prev, conversationId]
        }
        return prev
      })
    } else if (chat.type === 'following') {
      const userId = chat.participantId || (typeof chat.id === 'string' ? parseInt(chat.id) : chat.id)
      setSelectedUsers(prev => {
        if (prev.includes(userId)) {
          return prev.filter(id => id !== userId)
        } else if (totalSelected < 5) {
          return [...prev, userId]
        }
        return prev
      })
    } else {
      const groupId = chat.groupId || (typeof chat.id === 'string' ? parseInt(chat.id) : chat.id)
      setSelectedGroups(prev => {
        if (prev.includes(groupId)) {
          return prev.filter(id => id !== groupId)
        } else if (totalSelected < 5) {
          return [...prev, groupId]
        }
        return prev
      })
    }
  }

  const isSelected = (chat: ChatItem) => {
    if (chat.type === 'private') {
      const conversationId = typeof chat.id === 'string' ? parseInt(chat.id) : chat.id
      return selectedChats.includes(conversationId)
    } else if (chat.type === 'following') {
      const userId = chat.participantId || (typeof chat.id === 'string' ? parseInt(chat.id) : chat.id)
      return selectedUsers.includes(userId)
    } else {
      const groupId = chat.groupId || (typeof chat.id === 'string' ? parseInt(chat.id) : chat.id)
      return selectedGroups.includes(groupId)
    }
  }

  const handleShare = async () => {
    if (selectedChats.length === 0 && selectedGroups.length === 0 && selectedUsers.length === 0) {
      error('Please select at least one chat, group, or user to share to')
      return
    }

    try {
      setLoading(true)
      await api.sharePost({
        post_id: postId,
        conversation_ids: selectedChats,
        group_ids: selectedGroups,
        user_ids: selectedUsers
      })
      const totalSelected = selectedChats.length + selectedGroups.length + selectedUsers.length
      success(`Post shared to ${totalSelected} ${totalSelected === 1 ? 'conversation' : 'conversations'}!`)
      onClose()
      onShareSuccess?.()
    } catch (err) {
      console.error('Failed to share post:', err)
      error('Failed to share post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getTotalSelected = () => selectedChats.length + selectedGroups.length + selectedUsers.length

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-full max-w-md h-[80vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <motion.div
              className="relative flex-shrink-0 p-6 pb-4 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20"
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
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Send className="w-5 h-5 text-white drop-shadow-sm" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                    />
                  </motion.div>
                  <div>
                    <motion.h3
                      className="text-xl font-bold text-white mb-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Share Post
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Select up to 5 chats or groups
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
              {getTotalSelected() > 0 && (
                <motion.div
                  className="bg-white/10 border border-white/20 rounded-xl p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <p className="text-white text-sm">
                    Selected: {getTotalSelected()} {getTotalSelected() === 1 ? 'recipient' : 'recipients'}
                    {selectedChats.length > 0 && ` (${selectedChats.length} chat${selectedChats.length !== 1 ? 's' : ''})`}
                    {selectedGroups.length > 0 && ` (${selectedGroups.length} group${selectedGroups.length !== 1 ? 's' : ''})`}
                    {selectedUsers.length > 0 && ` (${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''})`}
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search chats, groups, or following users..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearchChange('')}
                      className="absolute right-4 text-white/60 hover:text-white transition-colors"
                      title="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Scrollable Content Area */}
            <motion.div
              className="relative flex-1 overflow-y-auto px-6 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="space-y-3">
                {fetchingChats ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/60 text-sm">
                      {isSearching ? 'Searching...' : 'Loading recent chats...'}
                    </p>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">
                      {isSearching ? 'No results found' : 'No recent chats or groups found'}
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      {isSearching ? 'Try a different search term' : 'Start conversations to share posts'}
                    </p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <motion.div
                      key={`${chat.type}-${chat.id}`}
                      onClick={() => handleChatSelect(chat)}
                      className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected(chat)
                          ? 'bg-emerald-500/20 border-emerald-400/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + chats.indexOf(chat) * 0.05, duration: 0.3 }}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden">
                          {getAvatarUrl(chat.avatar) ? (
                            <Image
                              src={getAvatarUrl(chat.avatar)!}
                              alt={`${chat.name || 'User'}'s avatar`}
                              width={40}
                              height={40}
                              unoptimized={true}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {getChatInitials(chat)}
                            </div>
                          )}
                        </div>
                        {chat.type === 'group' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                            <Users className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {isSelected(chat) && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium text-sm truncate">{chat.name || 'Unknown'}</p>
                          {chat.type === 'group' && (
                            <span className="text-white/50 text-xs">Group</span>
                          )}
                          {chat.type === 'following' && (
                            <span className="text-white/50 text-xs">Following</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="relative flex-shrink-0 p-6 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="flex space-x-3">
                <motion.button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleShare}
                  disabled={loading || getTotalSelected() === 0}
                  className={`flex-1 px-4 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center space-x-2 ${
                    loading || getTotalSelected() === 0
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 shadow-emerald-500/25'
                  }`}
                  whileHover={{ scale: loading || getTotalSelected() === 0 ? 1 : 1.05 }}
                  whileTap={{ scale: loading || getTotalSelected() === 0 ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sharing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Share ({getTotalSelected()})</span>
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