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

interface ChatsSectionProps {
  chatSubTab: string
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number }) => void
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
  setShowCreateDirectMessage,
  setShowCreateGroup
}: ChatsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'online'>('all')
  const { data: chats, error, isLoading } = useSWR('chats', fetcher, { refreshInterval: 5000 })
  const { addMessageListener } = useWebSocket()
  const [typingChats, setTypingChats] = useState<Record<string, string[]>>({})

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      mutate('chats')
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  useEffect(() => {
    const cleanup = addMessageListener((message) => {
      if (message.type === 'typing' && message.data) {
        const { username, action, conversation_id } = message.data
        const chatId = conversation_id || (message.group_id ? `group_${message.group_id}` : `private_${message.to}`)

        setTypingChats(prev => {
          const current = prev[chatId] || []

          if (action === 'start') {
            if (!current.includes(username)) {
              return {
                ...prev,
                [chatId]: [...current, username]
              }
            }
          } else if (action === 'stop') {
            return {
              ...prev,
              [chatId]: current.filter(u => u !== username)
            }
          }

          return prev
        })

        if (action === 'start') {
          setTimeout(() => {
            setTypingChats(prev => {
              const current = prev[chatId] || []
              return {
                ...prev,
                [chatId]: current.filter(u => u !== username)
              }
            })
          }, 3000)
        }
      }
    })

    return cleanup
  }, [addMessageListener])

  const filteredChats = chats?.filter(chat => {
    if (!chat.last_message) return false;

    const chatName = chat.type === 'private' && chat.participant
      ? `${chat.participant.first_name} ${chat.participant.last_name}`.trim()
      : chat.type === 'group' && chat.group
      ? chat.group.title
      : 'Unknown';

    const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = chatSubTab === 'all' || chat.type === chatSubTab;
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'unread' && chat.unread_count > 0) ||
      (filterType === 'online' && chat.type === 'private' && chat.participant && getUserStatus(chat.participant.id) !== 'offline');

    return matchesSearch && matchesTab && matchesFilter;
  }) || []

  const uniqueChats = filteredChats.filter((chat, index, self) =>
    self.findIndex(c => c.id === chat.id) === index
  )

  // Dynamic header configuration based on sub-tab
  const getTabConfig = () => {
    const baseStats = {
      total: uniqueChats.length,
      unread: uniqueChats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0),
      online: uniqueChats.filter(chat => chat.type === 'private' && chat.participant && getUserStatus(chat.participant.id) === 'online').length
    }

    switch (chatSubTab) {
      case 'private':
        return {
          title: 'Direct Messages',
          subtitle: 'Private conversations',
          icon: UserCheck,
          gradient: 'from-blue-500/20 to-indigo-500/20',
          iconColor: 'text-blue-400',
          stats: [
            { label: `${baseStats.online} online`, color: 'text-blue-300', pulse: true },
            { label: `${baseStats.total} chats`, color: 'text-white/50' },
            { label: `${baseStats.unread} unread`, color: 'text-white/40' }
          ],
          searchPlaceholder: 'Search direct messages...',
          filters: [
            { key: 'all', label: 'All', icon: MessageCircle, count: uniqueChats.length },
            { key: 'unread', label: 'Unread', icon: MessageSquarePlus, count: uniqueChats.filter(chat => chat.unread_count > 0).length },
            { key: 'online', label: 'Online', icon: User, count: baseStats.online }
          ],
          showNewChat: true,
          showNewGroup: false,
          newChatLabel: 'New Message',
          emptyState: {
            title: 'No direct messages',
            description: 'Start a private conversation',
            buttonText: 'Send Message'
          }
        }
      case 'group':
        return {
          title: 'Group Chats',
          subtitle: 'Group conversations',
          icon: Users,
          gradient: 'from-purple-500/20 to-pink-500/20',
          iconColor: 'text-purple-400',
          stats: [
            { label: `${baseStats.total} groups`, color: 'text-white/50' },
            { label: `${baseStats.unread} unread`, color: 'text-white/40' }
          ],
          searchPlaceholder: 'Search group chats...',
          filters: [
            { key: 'all', label: 'All', icon: Users, count: uniqueChats.length },
            { key: 'unread', label: 'Unread', icon: MessageSquarePlus, count: uniqueChats.filter(chat => chat.unread_count > 0).length }
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
          subtitle: 'All conversations',
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
            { key: 'unread', label: 'Unread', icon: MessageSquarePlus, count: uniqueChats.filter(chat => chat.unread_count > 0).length },
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
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div key={i} variants={itemVariants}>
              <ChatSkeleton />
            </motion.div>
          ))}
        </motion.div>
      )
    }

    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <MessageCircle className="w-16 h-16 text-red-500/70 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-white/60">Failed to load conversations. Please try again later.</p>
        </motion.div>
      )
    }

    if (filteredChats.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <tabConfig.icon className={`w-16 h-16 mx-auto mb-4 ${tabConfig.iconColor.replace('text-', 'text-').replace('400', '500/70')}`} />
          </motion.div>
          <h2 className="text-xl font-semibold text-white">{tabConfig.emptyState.title}</h2>
          <p className="text-white/60 mt-2">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : tabConfig.emptyState.description
            }
          </p>
          {!searchQuery && filterType === 'all' && (
            <motion.button
              onClick={() => tabConfig.showNewChat ? setShowCreateDirectMessage(true) : setShowCreateGroup(true)}
              className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageSquarePlus className="w-5 h-5" />
              <span>{tabConfig.emptyState.buttonText}</span>
            </motion.button>
          )}
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
            {uniqueChats.map((chat) => (
              <motion.div
                key={chat.id}
                variants={itemVariants}
                layout
                exit="exit"
              >
                <ChatItem
                  item={{
                    id: chat.id,
                    type: chat.type,
                    name: chat.type === 'private' && chat.participant
                      ? `${chat.participant.first_name} ${chat.participant.last_name}`.trim()
                      : chat.type === 'group' && chat.group
                      ? chat.group.title
                      : 'Unknown',
                    avatar: chat.type === 'private' && chat.participant ? chat.participant.avatar : undefined,
                    lastMessage: chat.last_message?.content,
                    lastMessageTime: chat.last_message?.created_at || chat.updated_at,
                    hasUnread: chat.unread_count > 0,
                    unreadCount: chat.unread_count,
                    unread_count: chat.unread_count,
                    participant: chat.participant,
                    group: chat.group,
                    conversationId: chat.id,
                    participantId: chat.type === 'private' && chat.participant ? chat.participant.id : undefined,
                    updated_at: chat.updated_at
                  }}
                  getUserStatus={getUserStatus}
                  typingUsers={typingChats[chat.id.toString()] || []}
                  onDelete={handleDeleteConversation}
                  onClick={() => onChatClick({
                    conversationId: chat.id,
                    type: chat.type,
                    name: chat.type === 'private' && chat.participant
                      ? `${chat.participant.first_name} ${chat.participant.last_name}`.trim()
                      : chat.type === 'group' && chat.group
                      ? chat.group.title
                      : 'Unknown',
                    participantId: chat.type === 'private' && chat.participant ? chat.participant.id : undefined
                  })}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Dynamic Header */}
      <motion.div
        className="flex-shrink-0 mb-8"
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
                className={`group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl ${chatSubTab === 'group' ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' : ''}`}
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
          className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl"
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
                    <span>Showing {filteredChats.length} of {uniqueChats.length} {chatSubTab === 'private' ? 'chats' : chatSubTab === 'group' ? 'groups' : 'conversations'}</span>
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
