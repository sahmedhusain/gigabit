'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { MessageCircle, Plus, Search, MessageSquarePlus, Filter, User } from 'lucide-react'
import { api } from '@/lib/api'
import ChatItem from '@/components/chat/ChatItem'
import ChatSkeleton from '@/components/chat/ChatSkeleton'
import { User as UserType } from '@/lib/api'
import { useWebSocket } from '@/context/WebSocketContext'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'

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

  // Track typing indicators
  useEffect(() => {
    const cleanup = addMessageListener((message) => {
      if (message.type === 'typing' && message.data) {
        const { username, action, conversation_id } = message.data
        const chatId = conversation_id || (message.group_id ? `group_${message.group_id}` : `private_${message.to}`)

        setTypingChats(prev => {
          const current = prev[chatId] || []
          
          if (action === 'start') {
            // Add user if not already present
            if (!current.includes(username)) {
              return {
                ...prev,
                [chatId]: [...current, username]
              }
            }
          } else if (action === 'stop') {
            // Remove user
            return {
              ...prev,
              [chatId]: current.filter(u => u !== username)
            }
          }
          
          return prev
        })

        // Auto-cleanup typing indicators after 3 seconds
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
    // Only show conversations that have messages
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

  // Remove duplicate chats by id
  const uniqueChats = filteredChats.filter((chat, index, self) => 
    self.findIndex(c => c.id === chat.id) === index
  )

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
            <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-semibold text-white">No conversations found</h2>
          <p className="text-white/60 mt-2">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start a new conversation to see it here'
            }
          </p>
          {!searchQuery && filterType === 'all' && (
            <motion.button
              onClick={() => setShowCreateDirectMessage(true)}
              className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageSquarePlus className="w-5 h-5" />
              <span>Start a Chat</span>
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
      {/* Header */}
      <motion.div
        className="flex-shrink-0 flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Chats
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {uniqueChats.length} conversation{uniqueChats.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => setShowCreateDirectMessage(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center space-x-2 border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span>New Message</span>
          </motion.button>
          <motion.button
            onClick={() => setShowCreateGroup(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>New Group</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div
        className="flex-shrink-0 space-y-4 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/50 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-white/60" />
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', icon: MessageCircle },
              { key: 'unread', label: 'Unread', icon: MessageSquarePlus },
              { key: 'online', label: 'Online', icon: User }
            ].map(({ key, label, icon: Icon }) => (
              <motion.button
                key={key}
                onClick={() => setFilterType(key as 'all' | 'unread' | 'online')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  filterType === key
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
        </div>
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
