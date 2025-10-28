'use client'
import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { Search, MessageCircle, MessageSquarePlus, UserCheck, User } from 'lucide-react'
import { api, ConversationSearchResult, EventResponse, PostResponse } from '@/lib/api'
import { PollResponse } from '@/types/polls'
import ChatHeader from './header/ChatHeader'
import SearchResults from './search/SearchResults'
import ChatList from './list/ChatList'
import EmptyState from './list/EmptyState'
import LoadingState from './list/LoadingState'
import { User as UserType } from '@/lib/api'
import { useWebSocket } from '@/context/WebSocketContext'
import { motion } from 'framer-motion'
import { mutate } from 'swr'
import { normalizeConversation } from '@/utils/chatUtils'
import { sortChatsByLastMessage, filterUniqueChats } from '@/utils/chatUtils'
import {
  handleDeleteConversation,
  handleMarkAsRead,
  handleMarkAsUnread,
  handleShowInfo,
  handleLeaveGroup,
  handleShowSettings,
  handleToggleMute
} from '@/utils/chatHandlers'

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
  
  const normalizedSubTab = chatSubTab === 'groups' ? 'group' : chatSubTab
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'online'>('all')
  const { data: chats, isLoading } = useSWR('chats', fetcher, { refreshInterval: 5000 })
  const { addMessageListener } = useWebSocket()
  const [typingChats, setTypingChats] = useState<Record<string, string[]>>({})
  const [lastTypingUpdate, setLastTypingUpdate] = useState<Record<string, number>>({})
  const [searchResults, setSearchResults] = useState<ConversationSearchResult[]>([])
  const [searchMode, setSearchMode] = useState<'normal' | 'messages'>('normal')
  const [mutedConversations, setMutedConversations] = useState<number[]>([])
  const [groupTabCounts, setGroupTabCounts] = useState<Record<number, { newPostsCount: number; unrespondedPollsCount: number; unrespondedEventsCount: number; pendingRequestsCount: number }>>({})

  
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      
      if (searchMode === 'messages') {
        try {
          const response = await api.searchMessages(searchQuery, 50, 0)
          setSearchResults(response.results || [])
        } catch {
          setSearchResults([]);
        }
      } else {
        
        setSearchResults([])
      }
    }

    const debounceTimer = setTimeout(performSearch, 300) 
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, searchMode])

  
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const settings = await api.getNotificationSettings()
        setMutedConversations((settings.muted_conversations || []).map(item => item.id))
      } catch {
        console.error('Failed to fetch notification settings:', 'Unknown error')
        
        setMutedConversations([])
      }
    }

    if (currentUser) {
      fetchNotificationSettings()
    }
  }, [currentUser])

  
  useEffect(() => {
    const cleanup = addMessageListener((message) => {
      
      if (message.type === 'typing' && message.data) {
        const { username, action } = message.data


        
        let conversationKey: string | null = null
        if (message.group_id) {
          conversationKey = `group_${message.group_id}`
        } else if (message.from && message.to && currentUser?.id) {
          
          const from = message.from || 0
          const to = message.to || 0
          conversationKey = String(Math.min(from, to) * 1000000 + Math.max(from, to))
        }


        if (!conversationKey || !username) {
          return
        }

        if (action === 'start') {
          setTypingChats(prev => {
            const current = prev[conversationKey!] || []
            if (current.includes(username)) {
              return prev 
            }
            const updated = { ...prev, [conversationKey!]: [...current, username] }
            return updated
          })
          
          setLastTypingUpdate(prev => ({ ...prev, [conversationKey!]: Date.now() }))
        } else if (action === 'stop') {
          setTypingChats(prev => {
            const current = prev[conversationKey!] || []
            const filtered = current.filter(u => u !== username)
            if (filtered.length === 0) {
              const { ...rest } = prev
              return rest
            }
            const updated = { ...prev, [conversationKey!]: filtered }
            return updated
          })
        }
      }

      
      if (message.type === 'private_message' || message.type === 'group_message') {
        mutate('chats')
      }
    })

    return cleanup
  }, [addMessageListener, currentUser?.id, typingChats])

  
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setTypingChats(prev => {
        const updated: Record<string, string[]> = {}
        let hasChanges = false

        for (const [key, users] of Object.entries(prev)) {
          const lastUpdate = lastTypingUpdate[key] || 0
          
          if (now - lastUpdate < 3000) {
            updated[key] = users
          } else {
            hasChanges = true
          }
        }

        return hasChanges ? updated : prev
      })
    }, 1000) 

    return () => clearInterval(cleanupInterval)
  }, [lastTypingUpdate])

  
  const normalizedChats = (chats || []).map(chat => normalizeConversation(chat, currentUser?.id))

  
  useEffect(() => {
    const fetchGroupTabCounts = async () => {
      if (!currentUser) return

      const groupChats = normalizedChats.filter(chat => chat.type === 'group' && chat.groupId)
      if (groupChats.length === 0) return

      const counts: Record<number, { newPostsCount: number; unrespondedPollsCount: number; unrespondedEventsCount: number; pendingRequestsCount: number }> = {}

      for (const chat of groupChats) {
        if (!chat.groupId) continue

        try {
          
          const postsResponse = await api.getGroupPosts(chat.groupId, 1, 100)
          const lastAccessedKey = `group_${chat.groupId}_last_accessed`
          const lastAccessed = localStorage.getItem(lastAccessedKey)
          const lastAccessedDate = lastAccessed ? new Date(lastAccessed) : new Date(0)
          const unreadPosts = (postsResponse.posts || []).filter((post: PostResponse) => new Date(post.created_at) > lastAccessedDate)

          
          const pollsResponse = await api.getGroupPolls(chat.groupId, 20, 0)
          const unrespondedPolls = (pollsResponse || []).filter((poll: PollResponse) => {
            
            const isExpired = poll.is_expired || (poll.expires_at && new Date(poll.expires_at) < new Date())
            return !poll.user_voted && !isExpired
          })

          
          const eventsResponse = await api.getGroupEvents(chat.groupId, 1, 1)
          const unrespondedEvents = (eventsResponse?.events || []).filter((event: EventResponse) => {
            
            const isEventEnded = event.canceled || new Date(event.event_time) < new Date()
            return event.user_response !== 'going' && event.user_response !== 'not_going' && !isEventEnded
          })

          
          let pendingRequestsCount = 0
          try {
            const requestsResponse = await api.getReceivedJoinRequests(chat.groupId)
            pendingRequestsCount = requestsResponse.count || 0
          } catch {
            
            pendingRequestsCount = 0
          }

          counts[chat.groupId] = {
            newPostsCount: unreadPosts.length || 0,
            unrespondedPollsCount: unrespondedPolls.length || 0,
            unrespondedEventsCount: unrespondedEvents.length || 0,
            pendingRequestsCount
          }

        } catch {
          console.error(`Failed to fetch tab counts for group ${chat.groupId}:`, 'Unknown error')
          counts[chat.groupId] = {
            newPostsCount: 0,
            unrespondedPollsCount: 0,
            unrespondedEventsCount: 0,
            pendingRequestsCount: 0
          }
        }
      }

      setGroupTabCounts(counts)
    }

    fetchGroupTabCounts()
  }, [normalizedChats, currentUser])

  
  useEffect(() => {
  }, [normalizedChats, normalizedSubTab, filterType, searchQuery])

  
  const subTabFilteredChats = useMemo(() => {
    let chats = normalizedChats

    
    if (normalizedSubTab === 'private') {
      chats = chats.filter(chat => chat.type === 'private')
    } else if (normalizedSubTab === 'group') {
      chats = chats.filter(chat => chat.type === 'group')
    }

    return chats
  }, [normalizedChats, normalizedSubTab])

  
  const filteredChats = useMemo(() => {
    let chats = subTabFilteredChats

    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      chats = chats.filter(chat => {
        
        const nameMatch = chat.name?.toLowerCase().includes(query) || false
        
        const messageMatch = chat.lastMessage?.toLowerCase().includes(query) || false
        return nameMatch || messageMatch
      })
    }

    
    if (filterType === 'unread') {
      chats = chats.filter(chat => (chat.unread || 0) > 0)
    } else if (filterType === 'online') {
      chats = chats.filter(chat => chat.type === 'private' && chat.participantId && getUserStatus(chat.participantId) !== 'offline')
    }

    return chats
  }, [subTabFilteredChats, searchQuery, filterType, getUserStatus])

  
  useEffect(() => {
  }, [filteredChats.length, normalizedChats.length])

  
  const sortedChats = sortChatsByLastMessage(filteredChats)
  const uniqueChats = filterUniqueChats(sortedChats)

  
  const baseStats = searchQuery.trim() && searchResults.length > 0 ? {
    online: 0, 
    total: searchResults.length,
    unread: 0 
  } : {
    online: subTabFilteredChats.filter(chat => chat.type === 'private' && chat.participantId && getUserStatus(chat.participantId) !== 'offline').length,
    total: filteredChats.length,
    unread: subTabFilteredChats.filter(chat => (chat.unread || 0) > 0).length
  }

  
  const getTabConfig = () => {
    switch (normalizedSubTab) {
      case 'private':
        return {
          title: 'Private Chats',
          subtitle: '',
          icon: User,
          gradient: 'from-blue-500/20 to-blue-600/20',
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
            { key: 'all', label: 'All', icon: MessageCircle, count: subTabFilteredChats.length },
            { key: 'unread', label: 'Unread', icon: MessageSquarePlus, count: subTabFilteredChats.filter(chat => (chat.unread || 0) > 0).length },
            { key: 'online', label: 'Online', icon: UserCheck, count: baseStats.online }
          ],
          showNewChat: true,
          showNewGroup: false,
          newChatLabel: 'New Chat',
          newGroupLabel: 'New Group',
          emptyState: {
            title: 'No private chats yet',
            description: 'Connect with friends and start meaningful conversations. Find people you know or discover new connections.',
            buttonText: 'Start Chat'
          }
        }
      case 'group':
        return {
          title: 'Group Chats',
          subtitle: '',
          icon: MessageCircle,
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
            { key: 'all', label: 'All', icon: MessageCircle, count: subTabFilteredChats.length },
            { key: 'unread', label: 'Unread', icon: MessageSquarePlus, count: subTabFilteredChats.filter(chat => (chat.unread || 0) > 0).length }
          ],
          showNewChat: false,
          showNewGroup: true,
          newChatLabel: 'New Chat',
          newGroupLabel: 'New Group',
          emptyState: {
            title: 'No group chats yet',
            description: 'Connect with communities! Create groups for projects, hobbies, or interests and invite friends to join the conversation.',
            buttonText: 'Create Group'
          }
        }
      default: 
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
            { key: 'all', label: 'All', icon: MessageCircle, count: subTabFilteredChats.length },
            { key: 'unread', label: 'Unread', icon: MessageSquarePlus, count: subTabFilteredChats.filter(chat => (chat.unread || 0) > 0).length },
            { key: 'online', label: 'Online', icon: User, count: baseStats.online }
          ],
          showNewChat: true,
          showNewGroup: true,
          newChatLabel: 'New Chat',
          newGroupLabel: 'New Group',
          emptyState: {
            title: 'No conversations yet',
            description: 'Start your social journey! Connect with friends through private chats or join communities in group conversations.',
            buttonText: 'Start a Chat',
            showDiscoverButtons: true
          }
        }
    }
  }

  const tabConfig = getTabConfig()

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />
    }

    
    if (searchQuery.trim() && searchResults.length > 0) {
      return (
        <SearchResults
          searchResults={searchResults}
          onChatClick={onChatClick}
          currentUser={currentUser}
        />
      )
    }

    


    
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
        <EmptyState
          title={tabConfig.emptyState.title}
          description={tabConfig.emptyState.description}
          buttonText={tabConfig.emptyState.buttonText}
          showDiscoverButtons={tabConfig.emptyState.showDiscoverButtons}
          icon={tabConfig.icon}
          iconColor={tabConfig.iconColor}
          onCreateDirectMessage={() => {
            if (normalizedSubTab === 'private' || normalizedSubTab === 'all') {
              setShowCreateDirectMessage(true)
            }
          }}
          onCreateGroup={() => {
            if (normalizedSubTab === 'group' || normalizedSubTab === 'all') {
              setShowCreateGroup(true)
            }
          }}
        />
      )
    }

    return (
      <ChatList
        chats={uniqueChats}
        getUserStatus={getUserStatus}
        typingChats={typingChats}
        currentUser={currentUser}
        onChatClick={onChatClick}
        onDelete={(conversationId) => handleDeleteConversation(conversationId)}
        onMarkAsRead={(conversationId) => handleMarkAsRead(conversationId, normalizedChats)}
        onMarkAsUnread={(conversationId) => handleMarkAsUnread(conversationId, normalizedChats)}
        onShowInfo={(conversationId, type) => handleShowInfo(conversationId, type, normalizedChats, onChatClick)}
        onLeaveGroup={(groupId) => handleLeaveGroup(groupId)}
        onShowSettings={(conversationId, type) => handleShowSettings(conversationId, type, normalizedChats, onChatClick)}
        mutedConversations={mutedConversations}
        onToggleMute={(conversationId) => handleToggleMute(conversationId, normalizedChats, mutedConversations, setMutedConversations)}
        groupTabCounts={groupTabCounts}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        title={tabConfig.title}
        subtitle={tabConfig.subtitle}
        icon={tabConfig.icon}
        gradient={tabConfig.gradient}
        iconColor={tabConfig.iconColor}
        searchPlaceholder={tabConfig.searchPlaceholder}
        filters={tabConfig.filters}
        showNewChat={tabConfig.showNewChat}
        showNewGroup={tabConfig.showNewGroup}
        newChatLabel={tabConfig.newChatLabel}
        newGroupLabel={tabConfig.newGroupLabel}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        filterType={filterType}
        setFilterType={setFilterType}
        searchResults={searchResults}
        onCreateDirectMessage={() => setShowCreateDirectMessage(true)}
        onCreateGroup={() => setShowCreateGroup(true)}
      />

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