'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { MessageCircle, Plus, Search, MessageSquarePlus, Filter, User, X, Users, UserCheck, MessageSquare } from 'lucide-react'
import { api, ConversationSearchResult } from '@/lib/api'
import ChatItem from '@/components/chat/ChatItem'
import ChatSkeleton from '@/components/chat/ChatSkeleton'
import { User as UserType } from '@/lib/api'
import { useWebSocket } from '@/context/WebSocketContext'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { mutate } from 'swr'
import { normalizeConversation } from '@/utils/chatUtils'

interface ChatsSectionProps {
  chatSubTab: string
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number; groupId?: number; initialTab?: string; highlightMessageId?: number }) => void
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
  const [searchResults, setSearchResults] = useState<ConversationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState<'normal' | 'messages'>('normal')

  // Handle search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      // Only perform comprehensive message search if in messages mode
      if (searchMode === 'messages') {
        setIsSearching(true)
        try {
          const response = await api.searchMessages(searchQuery, 50, 0)
          console.log('🔍 [Search] API Response:', response)
          console.log('🔍 [Search] Search results:', response.results)
          setSearchResults(response.results)
        } catch (error) {
          console.error('Search failed:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        // For normal search, just clear search results (filtering happens in filteredChats)
        setSearchResults([])
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300) // Debounce search
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, searchMode])

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
    console.log('🔍 [ChatsSection] Normalized chats:', normalizedChats.map(c => ({ id: c.id, type: c.type, groupId: c.groupId, name: c.name, hasLastMessage: !!c.lastMessage })))
    console.log('🔍 [ChatsSection] Current filter settings:', { normalizedSubTab, filterType, searchQuery })
  }, [normalizedChats, normalizedSubTab, filterType, searchQuery])

  const filteredChats = normalizedChats.filter(chat => {
    // Allow groups without messages to be shown, but filter out private chats without messages
    if (!chat.lastMessage && chat.type === 'private') return false;

    // If we have search results (messages mode), use them instead of filtering
    if (searchQuery.trim() && searchMode === 'messages' && searchResults.length > 0) {
      return true // We'll handle search results separately
    }

    // Normal search functionality (local filtering)
    const query = searchQuery.toLowerCase();
    let matchesSearch = true; // Default to true if no search query

    if (query) {
      // Search in chat name
      const nameMatch = chat.name.toLowerCase().includes(query);

      // Search in last message content (only for normal mode)
      const messageMatch = chat.lastMessage?.toLowerCase().includes(query) || false;

      // Match if any of the search criteria match
      matchesSearch = nameMatch || messageMatch;
    }

    const matchesTab = normalizedSubTab === 'all' || chat.type === normalizedSubTab;
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'unread' && (chat.unread || 0) > 0) ||
      (filterType === 'online' && chat.type === 'private' && chat.participantId && getUserStatus(chat.participantId) !== 'offline');

    return matchesSearch && matchesTab && matchesFilter;
  })

  // Debug logging for filtered results
  useEffect(() => {
    console.log('🔍 [ChatsSection] Filtered chats count:', filteredChats.length, 'from', normalizedChats.length)
  }, [filteredChats.length, normalizedChats.length])

  // Sort chats by last message time, then by join date/time for chats without messages
  const sortedChats = filteredChats.sort((a, b) => {
    // Parse timestamps for comparison
    const parseTimestamp = (timestamp: string | number | undefined | null): number => {
      if (!timestamp) return 0;
      if (typeof timestamp === 'number') {
        // If it's a number, check if it's milliseconds or seconds
        if (timestamp > 1e11) return timestamp; // milliseconds
        return timestamp * 1000; // seconds
      }
      // Parse ISO string or other date formats
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? 0 : date.getTime();
    };

    // Get last message time for each chat
    const aLastMessageTime = parseTimestamp(a.lastMessageTime || a.timestamp);
    const bLastMessageTime = parseTimestamp(b.lastMessageTime || b.timestamp);

    // If both have last message times, sort by most recent first
    if (aLastMessageTime > 0 && bLastMessageTime > 0) {
      return bLastMessageTime - aLastMessageTime;
    }

    // If only one has last message time, prioritize the one with messages
    if (aLastMessageTime > 0 && bLastMessageTime === 0) return -1;
    if (bLastMessageTime > 0 && aLastMessageTime === 0) return 1;

    // If neither has last message time, sort by timestamp (most recent first)
    return bLastMessageTime - aLastMessageTime;
  });

  const uniqueChats = sortedChats.filter((chat, index, self) =>
    self.findIndex(c => c.id === chat.id) === index
  )

  // Calculate base stats
  const baseStats = searchQuery.trim() && searchResults.length > 0 ? {
    online: 0, // Not applicable for search results
    total: searchResults.length,
    unread: 0 // Not applicable for search results
  } : {
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
          searchPlaceholder: searchMode === 'messages' 
            ? 'Search all messages in conversation history...' 
            : 'Search people and recent messages...',
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
          gradient: 'from-emerald-500/20 to-teal-500/20',
          iconColor: 'text-emerald-400',
          stats: [
            { label: `${baseStats.total} groups`, color: 'text-white/50' },
            { label: `${baseStats.unread} unread`, color: 'text-white/40' }
          ],
          searchPlaceholder: searchMode === 'messages' 
            ? 'Search all messages in conversation history...' 
            : 'Search groups and recent messages...',
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
          searchPlaceholder: searchMode === 'messages' 
            ? 'Search all messages in conversation history...' 
            : 'Search people, groups and recent messages...',
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

    // If searching and we have search results, show them
    if (searchQuery.trim() && searchResults.length > 0) {
      console.log('🔍 [Render] Showing search results:', searchResults.length, 'items')
      console.log('🔍 [Render] Search query:', searchQuery.trim())
      console.log('🔍 [Render] Search results array:', searchResults)
      return (
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {searchResults.map((result) => {
              // Convert search result to chat item format
              const chatItem = {
                id: result.conversation_id,
                type: result.type,
                name: result.type === 'private' ? result.participant_name : (result.group_name || 'Unknown Group'),
                avatar: result.type === 'private' ? result.participant_avatar : result.group_avatar,
                lastMessage: result.matching_message,
                lastMessageTime: result.message_time,
                unread: 0, // Search results don't show unread status
                participantId: result.participant_id,
                groupId: result.group_id,
                timestamp: result.message_time,
                lastMessageSenderId: undefined, // Not available in search results
              }

              console.log('🔍 [Render] Created chat item:', chatItem)

              const handleOpenChat = () => {
                onChatClick({
                  conversationId: result.conversation_id,
                  type: result.type,
                  name: chatItem.name,
                  participantId: result.participant_id,
                  groupId: result.group_id,
                  highlightMessageId: result.matching_message_id
                })
              }

              return (
                <motion.div
                  key={`${result.type}_${result.conversation_id}_${result.message_time}`}
                  variants={itemVariants}
                  layout
                  exit="exit"
                >
                  <ChatItem
                    item={{
                      ...chatItem,
                      conversationId: result.conversation_id,
                      unreadCount: 0,
                      unread_count: 0,
                      lastMessageStatus: undefined,
                      updated_at: result.message_time,
                    }}
                    getUserStatus={getUserStatus}
                    typingUsers={[]} // No typing indicators for search results
                    onDelete={() => {}} // Disable delete for search results
                    onMarkAsRead={() => {}} // Disable mark as read for search results
                    onMarkAsUnread={() => {}} // Disable mark as unread for search results
                    onShowInfo={() => {}} // Disable info for search results
                    onLeaveGroup={() => {}} // Disable leave group for search results
                    onShowSettings={() => {}} // Disable settings for search results
                    onClick={handleOpenChat}
                    currentUser={currentUser}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )
    }

    // Debug: Check why we're not showing search results
    if (searchQuery.trim()) {
      console.log('🔍 [Render] Search query exists but no results shown:', {
        searchQuery: searchQuery.trim(),
        searchResultsLength: searchResults.length,
        searchMode,
        condition: searchQuery.trim() && searchResults.length > 0
      })
    }

    // If searching in normal mode but no results, show empty state
    if (searchQuery.trim() && searchMode === 'normal' && filteredChats.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <Search className={`w-16 h-16 text-white/30 mb-4`} />
          <h3 className="text-xl font-semibold text-white mb-2">No conversations found</h3>
          <p className="text-white/60 mb-6">Try searching with different keywords or switch to deep message search</p>
          <motion.button
            onClick={() => setSearchMode('messages')}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-400/30 hover:bg-emerald-500/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Switch to Message Search
          </motion.button>
        </motion.div>
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
        {/* Combined Header and Search Container */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-white/5 via-emerald-500/5 to-teal-500/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background Pattern - TEMPORARILY REMOVED */}
          {/* <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)]"></div>
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
          </div> */}

          {/* Floating Elements - TEMPORARILY REMOVED */}
          {/* <div className="absolute top-2 right-2 w-16 h-16 bg-emerald-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-2 left-2 w-12 h-12 bg-teal-400/10 rounded-full blur-xl animate-pulse delay-1000"></div> */}

          <div className="relative z-10 space-y-6">
            {/* Title Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className={`relative p-3 bg-gradient-to-br ${tabConfig.gradient} rounded-2xl border border-white/20 shadow-xl`}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {/* Icon Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-2xl blur-md"></div>
                  <tabConfig.icon className={`relative w-8 h-8 ${tabConfig.iconColor}`} />
                  {/* Activity Indicator */}
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white/20"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-full h-full bg-emerald-400 rounded-full animate-ping"></div>
                  </motion.div>
                </motion.div>

                <div className="space-y-2">
                  <motion.h1
                    className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent"
                    key={tabConfig.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {tabConfig.title}
                  </motion.h1>

                  <motion.p
                    className="text-white/60 text-xs leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {tabConfig.subtitle || 'Stay connected with your conversations and communities'}
                  </motion.p>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <motion.div
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
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
                    className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl"
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

            {/* Separator */}
            <div className="border-t border-white/10"></div>

            {/* Search and Filter Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Background Pattern for Search Section - TEMPORARILY REMOVED */}
              {/* <div className="absolute inset-0 opacity-5 top-1/2">
                <div className="absolute top-1/2 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:20px_20px]"></div>
              </div> */}

              {/* Floating Accent - TEMPORARILY REMOVED */}
              {/* <div className="absolute top-1/2 right-1 w-8 h-8 bg-emerald-400/10 rounded-full blur-lg animate-pulse delay-500"></div> */}

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6 pointer-events-auto">
                {/* Enhanced Search Bar */}
                <div className="flex-1 max-w-md">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <motion.div
                        animate={{ rotate: searchQuery ? 360 : 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Search className="w-5 h-5 text-white/40 group-focus-within:text-emerald-400 transition-colors duration-300" />
                      </motion.div>
                    </div>
                    <input
                      type="text"
                      placeholder={tabConfig.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="relative z-50 w-full pl-12 pr-20 py-3 bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/50 transition-all duration-500 text-sm shadow-lg focus:shadow-xl"
                    />
                    {/* Enhanced Splitter */}
                    <div className="absolute inset-y-0 right-10 flex items-center z-40">
                      <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                    </div>
                    {/* Buttons Container - positioned absolutely over the input */}
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center z-70 pointer-events-none">
                      {searchQuery && (
                        <motion.button
                          onClick={() => setSearchQuery('')}
                          className="text-white/40 hover:text-white transition-colors mr-2 pointer-events-auto"
                          whileHover={{ scale: 1.2, rotate: 90 }}
                          whileTap={{ scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => setSearchMode(searchMode === 'normal' ? 'messages' : 'normal')}
                        className={`p-2 rounded-lg transition-all duration-200 cursor-pointer pointer-events-auto flex items-center justify-center ${
                          searchMode === 'messages' 
                            ? 'bg-gradient-to-r from-emerald-500/40 to-teal-500/40 text-emerald-100 border border-emerald-400/60 shadow-lg shadow-emerald-500/20' 
                            : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        title={searchMode === 'messages' ? 'Disable deep message search' : 'Enable deep message search'}
                      >
                        <motion.div
                          animate={{ rotate: searchMode === 'messages' ? 360 : 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </motion.div>
                      </motion.button>
                    </div>
                    {/* Search Bar Glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-teal-400/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl z-30"></div>
                  </div>
                </div>

                {/* Enhanced Dynamic Filter Tabs */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2 text-white/70">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Filter className="w-4 h-4" />
                    </motion.div>
                    <span className="text-sm font-medium">Filter:</span>
                  </div>
                  <div className="flex bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-1 border border-white/10 shadow-lg">
                    {tabConfig.filters.map(({ key, label, icon: Icon, count }) => (
                      <motion.button
                        key={key}
                        onClick={() => setFilterType(key as 'all' | 'unread' | 'online')}
                        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-500 flex items-center space-x-2 ${
                          filterType === key
                            ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-200 shadow-lg border border-emerald-400/30'
                            : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                        }`}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          animate={filterType === key ? { rotate: 360 } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className="w-4 h-4" />
                        </motion.div>
                        <span>{label}</span>
                        {count > 0 && (
                          <motion.span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              filterType === key
                                ? 'bg-emerald-400/40 text-emerald-100'
                                : 'bg-white/15 text-white/80'
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            {count}
                          </motion.span>
                        )}
                        {filterType === key && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-lg blur-sm"
                            layoutId="activeFilterGlow"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        {filterType === key && (
                          <motion.div
                            className="absolute inset-0 bg-emerald-500/20 rounded-lg"
                            layoutId="activeFilter"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Active Filter Summary */}
              <AnimatePresence>
                {(filterType !== 'all' || (searchQuery.trim() && searchResults.length > 0)) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="mt-4 pt-4 border-t border-white/15"
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  >
                    <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-3 border border-emerald-400/20">
                      <div className="flex items-center space-x-3 text-white/80 text-sm">
                        <motion.div
                          className="w-2 h-2 bg-emerald-400 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        {searchQuery.trim() && searchResults.length > 0 ? (
                          <>
                            <span className="font-medium">
                              Found <span className="text-emerald-300 font-bold">{searchResults.length}</span>{' '}
                              {searchResults.length === 1 ? 'conversation' : 'conversations'} matching "<span className="text-emerald-300 font-bold">{searchQuery}</span>"
                            </span>
                            <span className="text-white/40">•</span>
                            <span className="text-white/60">Deep message search</span>
                          </>
                        ) : searchQuery.trim() && searchMode === 'normal' ? (
                          <>
                            <span className="font-medium">
                              Showing <span className="text-emerald-300 font-bold">{filteredChats.length}</span> of{' '}
                              <span className="text-white font-bold">{uniqueChats.length}</span>{' '}
                              {normalizedSubTab === 'private' ? 'chats' : normalizedSubTab === 'group' ? 'groups' : 'conversations'}
                            </span>
                            <span className="text-white/40">•</span>
                            <span className="text-white/60">Quick search</span>
                          </>
                        ) : filterType !== 'all' ? (
                          <>
                            <span className="font-medium">
                              Showing <span className="text-emerald-300 font-bold">{filteredChats.length}</span> of{' '}
                              <span className="text-white font-bold">{uniqueChats.length}</span>{' '}
                              {normalizedSubTab === 'private' ? 'chats' : normalizedSubTab === 'group' ? 'groups' : 'conversations'}
                            </span>
                            <span className="text-white/40">•</span>
                            <span className="text-white/60">
                              Filter: <span className="text-emerald-300 font-semibold">
                                {filterType === 'unread' ? 'Unread messages' : filterType === 'online' ? 'Online contacts' : 'All conversations'}
                              </span>
                            </span>
                          </>
                        ) : null}
                      </div>
                      <motion.button
                        onClick={() => {
                          setFilterType('all')
                          if (searchQuery.trim()) {
                            setSearchQuery('')
                            setSearchMode('normal') // Reset to normal mode when clearing search
                          }
                        }}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>Clear {searchQuery.trim() ? 'search' : 'filter'}</span>
                        <motion.div
                          whileHover={{ rotate: 90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <X className="w-3 h-3" />
                        </motion.div>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Progress/Activity Bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-b-2xl"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, delay: 0.6, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="flex-1 overflow-y-scroll scrollbar-hide pr-2 -mr-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {renderContent()}
      </motion.div>
    </div>
  )
}
