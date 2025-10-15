'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { MessageCircle, Plus, Search, MessageSquarePlus, Filter, User, X, Users, UserCheck } from 'lucide-react'
import { api } from '@/lib/api'
import ChatItem from '@/components/chat/ChatItem'
import ChatSkeleton from '@/components/chat/ChatSkeleton'
import { User as UserType } from '@/lib/api'
import { useWebSocket } from '@/context/WebSocketContext'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { mutate } from 'swr'
import { normalizeConversation } from '@/utils/chatUtils'

interface ChatsSectionProps {
  chatSubTab: string
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number; groupId?: number; initialTab?: string }) => void
  getUserStatus: (userId: number) => string
  currentUser: UserType | null
  showCreateGroup: boolean
  setShowCreateDirectMessage: (show: boolean) => void
  setShowCreateGroup: (show: boolean) => void
}

const fetcher = () => api.getConversations().then(data => data.conversations)

export default function ChatsSection({
  chatSubTab,
  onChatClick,
  getUserStatus,
  currentUser,
  setShowCreateDirectMessage,
  setShowCreateGroup
}: ChatsSectionProps) {
  // Normalize plural form so 'groups' maps to internal 'group'
  const normalizedSubTab = chatSubTab === 'groups' ? 'group' : chatSubTab
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'online'>('all')
  const { data: chats, isLoading } = useSWR('chats', fetcher, { refreshInterval: 5000 })
  const { addMessageListener } = useWebSocket()
  const [typingChats, setTypingChats] = useState<Record<string, string[]>>({})

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await api.deleteConversation(conversationId)
      mutate('chats')
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleMarkAsRead = async (conversationId: number) => {
    try {
      // Find the chat to get details
      const chat = normalizedChats.find(c => c.id === conversationId)
      if (!chat) return

      const conversationType = chat.type === 'group' ? 'group' : 'private';
      const actualConversationId = chat.type === 'group' ? (chat.groupId || conversationId) : conversationId;
      
      await api.markConversationAsRead(actualConversationId, conversationType);

      // Optimistically update the UI
      mutate('chats', (current: any) => {
        if (!current) return current
        const updated = Array.isArray(current) ? current : current.conversations
        if (!Array.isArray(updated)) return current
        const next = updated.map((c: any) => c?.id === conversationId ? { ...c, unread_count: 0 } : c)
        return Array.isArray(current) ? next : { ...current, conversations: next }
      }, false)
      
      // Refresh from server
      mutate('chats')
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  const handleMarkAsUnread = async (conversationId: number) => {
    try {
      // Find the chat to get details
      const chat = normalizedChats.find(c => c.id === conversationId)
      if (!chat) return

      const conversationType = chat.type === 'group' ? 'group' : 'private';
      const actualConversationId = chat.type === 'group' ? (chat.groupId || conversationId) : conversationId;
      
      await api.markConversationAsUnread(actualConversationId, conversationType);

      // Optimistically update the UI - show unread indicator without specific count
      mutate('chats', (current: any) => {
        if (!current) return current
        const updated = Array.isArray(current) ? current : current.conversations
        if (!Array.isArray(updated)) return current
        const next = updated.map((c: any) => c?.id === conversationId ? { ...c, unread_count: 1, has_unread: true } : c)
        return Array.isArray(current) ? next : { ...current, conversations: next }
      }, false)
      
      // Refresh from server after a short delay
      setTimeout(() => mutate('chats'), 500)
    } catch (error) {
      console.error('Failed to mark messages as unread:', error)
    }
  }

  const handleShowInfo = (conversationId: number, type: 'private' | 'group') => {
    // Navigate to the chat and open info tab
    const chat = normalizedChats.find(c => c.id === conversationId)
    if (chat) {
      onChatClick({
        conversationId,
        type,
        name: chat.name,
        participantId: chat.participantId,
        groupId: chat.groupId,
        initialTab: 'info'
      })
    }
  }

  const handleLeaveGroup = async (groupId: number) => {
    try {
      await api.leaveGroup(groupId)
      mutate('chats')
    } catch (error) {
      console.error('Failed to leave group:', error)
    }
  }

  const handleShowSettings = (conversationId: number, type: 'private' | 'group') => {
    // Navigate to the chat and open settings tab
    const chat = normalizedChats.find(c => c.id === conversationId)
    if (chat) {
      onChatClick({
        conversationId,
        type,
        name: chat.name,
        participantId: chat.participantId,
        groupId: chat.groupId,
        initialTab: 'settings'
      })
    }
  }

  useEffect(() => {
    const cleanup = addMessageListener((message) => {
      // Typing indicators
      if (message.type === 'typing' && message.data) {
        const { username, action, user_id } = message.data
        
        console.log(`📝 [Typing] RECEIVED: Full message:`, JSON.stringify(message, null, 2))
        console.log(`📝 [Typing] RECEIVED: action=${action}, username=${username}, user_id=${user_id}, from=${message.from}, to=${message.to}, group_id=${message.group_id}`, message)
        
        // Determine the conversation ID/key
        let conversationKey: string | null = null
        if (message.group_id) {
          conversationKey = `group_${message.group_id}`
          console.log(`📝 [Typing] RECEIVED: Group message, key: ${conversationKey}`)
        } else if (message.from && message.to && currentUser?.id) {
          // For private chats, use a consistent key based on both user IDs
          const from = message.from || 0
          const to = message.to || 0
          conversationKey = String(Math.min(from, to) * 1000000 + Math.max(from, to))
          console.log(`📝 [Typing] RECEIVED: Private message, key: ${conversationKey}`)
        }

        console.log(`📝 [Typing] RECEIVED: Final key: ${conversationKey}, typingChats keys before:`, Object.keys(typingChats))

        if (!conversationKey || !username) {
          console.log(`📝 [Typing] Skipping: no key (${conversationKey}) or username (${username})`)
          return
        }

        if (action === 'start') {
          setTypingChats(prev => {
            const current = prev[conversationKey!] || []
            if (current.includes(username)) {
              console.log(`📝 [Typing] User already typing: ${username}`)
              return prev // Already in list
            }
            const updated = { ...prev, [conversationKey!]: [...current, username] }
            console.log(`📝 [Typing] Added ${username} to ${conversationKey}: ${JSON.stringify(updated[conversationKey!])}`)
            return updated
          })
        } else if (action === 'stop') {
          setTypingChats(prev => {
            const current = prev[conversationKey!] || []
            const filtered = current.filter(u => u !== username)
            if (filtered.length === 0) {
              const { [conversationKey!]: _, ...rest } = prev
              console.log(`📝 [Typing] Removed ${username} from ${conversationKey} (now empty)`)
              return rest
            }
            const updated = { ...prev, [conversationKey!]: filtered }
            console.log(`📝 [Typing] Removed ${username} from ${conversationKey}: ${JSON.stringify(updated[conversationKey!])}`)
            return updated
          })
        }
      }

      // When a new message arrives, refresh conversations to update previews and unread badges
      if (message.type === 'private_message' || message.type === 'group_message') {
        mutate('chats')
      }
    })

    return cleanup
  }, [addMessageListener, currentUser?.id])

  // Normalize chats for consistent preview formatting
  const normalizedChats = (chats || []).map(chat => normalizeConversation(chat))

  // Debug logging for chats
  useEffect(() => {
    console.log('🔍 [ChatsSection] Normalized chats:', normalizedChats.map(c => ({ id: c.id, type: c.type, groupId: c.groupId, name: c.name })))
  }, [normalizedChats])

  const filteredChats = normalizedChats.filter(chat => {
    // Allow groups without messages to be shown, but filter out private chats without messages
    if (!chat.lastMessage && chat.type === 'private') return false;

    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = normalizedSubTab === 'all' || chat.type === normalizedSubTab;
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'unread' && (chat.unread || 0) > 0) ||
      (filterType === 'online' && chat.type === 'private' && chat.participantId && getUserStatus(chat.participantId) !== 'offline');

    return matchesSearch && matchesTab && matchesFilter;
  })

  const uniqueChats = filteredChats.filter((chat, index, self) =>
    self.findIndex(c => c.id === chat.id) === index
  )

  // Calculate base stats
  const baseStats = {
    online: normalizedChats.filter(chat => chat.type === 'private' && chat.participantId && getUserStatus(chat.participantId) !== 'offline').length,
    total: uniqueChats.length,
    unread: uniqueChats.filter(chat => (chat.unread || 0) > 0).length
  }

  // Dynamic header configuration based on sub-tab
  const getTabConfig = () => {
    switch (normalizedSubTab) {
      case 'private':
        return {
          title: 'Private Chats',
          subtitle: '',
          icon: User,
          gradient: 'from-blue-500/20 to-indigo-500/20',
          iconColor: 'text-blue-400',
          stats: [
            { label: `${baseStats.online} online`, color: 'text-blue-300', pulse: true },
            { label: `${baseStats.total} chats`, color: 'text-white/50' },
            { label: `${baseStats.unread} unread`, color: 'text-white/40' }
          ],
          searchPlaceholder: 'Search private chats...',
          filters: [
            { key: 'all', label: 'All', icon: MessageCircle, count: uniqueChats.length },
            { key: 'unread', label: 'Unread', icon: MessageSquarePlus, count: uniqueChats.filter(chat => (chat.unread || 0) > 0).length },
            { key: 'online', label: 'Online', icon: UserCheck, count: baseStats.online }
          ],
          showNewChat: true,
          showNewGroup: false,
          newChatLabel: 'New Chat',
          emptyState: {
            title: 'No private chats',
            description: 'Start a conversation with someone',
            buttonText: 'Start Chat'
          }
        }
      case 'group':
        return {
          title: 'Group Chats',
          subtitle: '',
          icon: Users,
          gradient: 'from-purple-500/20 to-pink-500/20',
          iconColor: 'text-purple-400',
          stats: [
            { label: `${baseStats.total} groups`, color: 'text-white/50' },
            { label: `${baseStats.unread} unread`, color: 'text-white/40' }
          ],
          searchPlaceholder: 'Search group chats...',
          filters: [
            { key: 'all', label: 'All', icon: MessageCircle, count: uniqueChats.length },
            { key: 'unread', label: 'Unread', icon: MessageSquarePlus, count: uniqueChats.filter(chat => (chat.unread || 0) > 0).length }
          ],
          showNewChat: false,
          showNewGroup: true,
          newGroupLabel: 'New Group',
          emptyState: {
            title: 'No group chats',
            description: 'Create or join a group conversation',
            buttonText: 'Create Group'
          }
        }
      default: // 'all'
        return {
          title: 'Messages',
          subtitle: '',
          icon: MessageCircle,
          gradient: 'from-emerald-500/20 to-teal-500/20',
          iconColor: 'text-emerald-400',
          stats: [
            { label: `${baseStats.online} online`, color: 'text-emerald-300', pulse: true },
            { label: `${baseStats.total} conversations`, color: 'text-white/50' },
            { label: `${baseStats.unread} unread`, color: 'text-white/40' }
          ],
          searchPlaceholder: 'Search conversations, people, or messages...',
          filters: [
            { key: 'all', label: 'All', icon: MessageCircle, count: uniqueChats.length },
            { key: 'unread', label: 'Unread', icon: MessageSquarePlus, count: uniqueChats.filter(chat => (chat.unread || 0) > 0).length },
            { key: 'online', label: 'Online', icon: User, count: baseStats.online }
          ],
          showNewChat: true,
          showNewGroup: true,
          newChatLabel: 'New Chat',
          newGroupLabel: 'New Group',
          emptyState: {
            title: 'No conversations found',
            description: 'Start a new conversation to see it here',
            buttonText: 'Start a Chat'
          }
        }
    }
  }

  const tabConfig = getTabConfig()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <ChatSkeleton />
      )
    }

    if (uniqueChats.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <tabConfig.icon className={`w-16 h-16 ${tabConfig.iconColor} mb-4`} />
          <h3 className="text-xl font-semibold text-white mb-2">{tabConfig.emptyState.title}</h3>
          <p className="text-white/60 mb-6">{tabConfig.emptyState.description}</p>
        </motion.div>
      )
    }

    return (
      <LayoutGroup>
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {uniqueChats.map((chat) => {
              const chatIdNum = chat.id ? (typeof chat.id === 'string' ? parseInt(chat.id.replace(/\D/g, '')) : chat.id) : 0;
              const avatar = chat.avatar && typeof chat.avatar === 'string' ? chat.avatar : undefined;

              // Skip rendering if chat ID is invalid
              if (!chatIdNum || isNaN(chatIdNum)) {
                return null;
              }
              const handleOpenChat = () => {
                // Optimistically clear unread in cache for snappy UX
                mutate('chats', (current: any) => {
                  if (!current) return current
                  const updated = Array.isArray(current) ? current : current.conversations
                  if (!Array.isArray(updated)) return current
                  const next = updated.map((c: any) => c?.id === chatIdNum ? { ...c, unread_count: 0 } : c)
                  // Preserve original shape if needed
                  return Array.isArray(current) ? next : { ...current, conversations: next }
                }, false)

                onChatClick({
                  conversationId: chatIdNum,
                  type: chat.type,
                  name: chat.name,
                  participantId: chat.participantId,
                  groupId: chat.groupId
                })
              }
              return (
                <motion.div
                  key={chatIdNum}
                  variants={itemVariants}
                  layout
                  exit="exit"
                >
                  <ChatItem
                    item={{
                      ...chat,
                      id: chatIdNum,
                      avatar,
                      conversationId: chatIdNum,
                      unreadCount: chat.unread || 0,
                      unread_count: chat.unread || 0,
                      lastMessageSenderId: chat.lastMessageSenderId,
                      lastMessageStatus: (chat.lastMessage && currentUser?.id && chat.lastMessageSenderId === currentUser.id) ? 'sent' : undefined,
                      updated_at: chat.timestamp || '',
                      groupId: chat.groupId, // Explicitly pass groupId for group chats
                    }}
                    getUserStatus={getUserStatus}
                    typingUsers={(() => {
                      // For groups, look up by group key
                      if (chat.groupId) {
                        const groupKey = `group_${chat.groupId}`
                        const typing = typingChats[groupKey] || []
                        console.log(`👥 [ChatItem] Group ${chat.groupId} (${chat.name}) - key: ${groupKey}, typing:`, typing, 'all typingChats:', Object.keys(typingChats))
                        return typing
                      }
                      // For private chats, calculate the key
                      if (chat.participantId && currentUser?.id) {
                        const key = String(Math.min(chat.participantId, currentUser.id) * 1000000 + Math.max(chat.participantId, currentUser.id))
                        const typing = typingChats[key] || []
                        console.log(`👤 [ChatItem] Private chat with ${chat.participantId} - key: ${key}, typing:`, typing)
                        return typing
                      }
                      console.log(`❓ [ChatItem] No typing key for chat:`, chat)
                      return []
                    })()}
                    onDelete={handleDeleteConversation}
                      onMarkAsRead={handleMarkAsRead}
                      onMarkAsUnread={handleMarkAsUnread}
                      onShowInfo={handleShowInfo}
                      onLeaveGroup={handleLeaveGroup}
                      onShowSettings={handleShowSettings}
                    onClick={handleOpenChat}
                    currentUser={currentUser}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Title Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <motion.div
              className={`p-3 bg-gradient-to-br ${tabConfig.gradient} rounded-2xl border border-white/20`}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <tabConfig.icon className={`w-8 h-8 ${tabConfig.iconColor}`} />
            </motion.div>
            <div>
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent"
                key={tabConfig.title} // Re-animate on title change
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {tabConfig.title}
              </motion.h1>
              <div className="flex items-center space-x-4 mt-2">
                {tabConfig.stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {'pulse' in stat && stat.pulse && <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>}
                    <span className={`text-sm font-medium ${stat.color}`}>
                      {stat.label}
                    </span>
                  </motion.div>
                ))}
              </div>
              <motion.p
                className="text-white/60 text-sm mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {tabConfig.subtitle}
              </motion.p>
            </div>
          </div>

          {/* Dynamic Action Buttons */}
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {tabConfig.showNewChat && (
              <motion.button
                onClick={() => setShowCreateDirectMessage(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <MessageSquarePlus className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors relative z-10" />
                <span className="font-semibold relative z-10">{tabConfig.newChatLabel}</span>
              </motion.button>
            )}
            {tabConfig.showNewGroup && (
              <motion.button
                onClick={() => setShowCreateGroup(true)}
                className={`group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl ${normalizedSubTab === 'group' ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' : ''}`}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <Plus className="w-5 h-5 relative z-10" />
                <span className="font-semibold relative z-10">{tabConfig.newGroupLabel}</span>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <motion.div
          className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-white/40 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder={tabConfig.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/50 transition-all duration-300 text-sm"
                />
                {searchQuery && (
                  <motion.button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Dynamic Filter Tabs */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-white/60">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                {tabConfig.filters.map(({ key, label, icon: Icon, count }) => (
                  <motion.button
                    key={key}
                    onClick={() => setFilterType(key as 'all' | 'unread' | 'online')}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                      filterType === key
                        ? 'bg-emerald-500/20 text-emerald-300 shadow-lg'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    {count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        filterType === key
                          ? 'bg-emerald-400/30 text-emerald-200'
                          : 'bg-white/10 text-white/70'
                      }`}>
                        {count}
                      </span>
                    )}
                    {filterType === key && (
                      <motion.div
                        className="absolute inset-0 bg-emerald-500/10 rounded-xl"
                        layoutId="activeFilter"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filter Summary */}
          <AnimatePresence>
            {filterType !== 'all' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-white/70 text-sm">
                    <span>Showing {filteredChats.length} of {uniqueChats.length} {normalizedSubTab === 'private' ? 'chats' : normalizedSubTab === 'group' ? 'groups' : 'conversations'}</span>
                    <span className="text-white/40">•</span>
                    <span>Filter: {filterType === 'unread' ? 'Unread messages' : filterType === 'online' ? 'Online contacts' : 'All conversations'}</span>
                  </div>
                  <motion.button
                    onClick={() => setFilterType('all')}
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center space-x-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Clear filter</span>
                    <X className="w-3 h-3" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-emerald-400/20 scrollbar-track-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  )
}
