'use client'
import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Smile, Check, CheckCheck, Clock, ChevronDown, MessageCircle, FileText, Calendar, BarChart3, Users, Settings, Crown, User as UserIcon, Info, Globe, EyeOff, Lock, Heart, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { mutate } from 'swr'
import { useWebSocket } from '@/context/WebSocketContext'
import { useRealTimeMessages, useTypingIndicator } from '@/hooks'
import { api, User, GroupResponse, Member, ConversationResponse } from '@/lib/api'
import EmojiPicker from 'emoji-picker-react'
import { getAvatarUrl } from '@/utils/avatarUtils'
import { useRouter } from 'next/navigation'
import { MessageRounded } from '@mui/icons-material'

// Import tab components
import GroupChatTab from './groups/tabs/GroupChatTab'
import GroupPostsTab from './groups/tabs/GroupPostsTab'
import GroupEventsTab from './groups/tabs/GroupEventsTab'
import GroupPollsTab from './groups/tabs/GroupPollsTab'
import GroupSettingsTab from './groups/tabs/GroupSettingsTab'
import GroupInfoTab from './groups/tabs/GroupInfoTab'

interface EmojiData {
  emoji: string
  names: string[]
  activeSkinTone: string
}

interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  message_type: 'text' | 'image' | 'file'
  created_at: string
  is_read: boolean
  sender: {
    id: number
    first_name: string
    last_name: string
    avatar: string
  }
  shared_post?: {
    id: number
    user_id: number
    content: string
    image_url?: string
    privacy: string
    created_at: string
    user: {
      id: number
      email: string
      first_name: string
      last_name: string
      avatar?: string
      nickname?: string
      is_private?: boolean
    }
    like_count: number
    comment_count: number
    share_count: number
  }
}

interface SharedPostMessageProps {
  sharedPost: {
    id: number
    user_id: number
    content: string
    image_url?: string
    privacy: string
    created_at: string
    user: {
      id: number
      email: string
      first_name: string
      last_name: string
      avatar?: string
      nickname?: string
      is_private?: boolean
    }
    like_count: number
    comment_count: number
    share_count: number
  }
  isCurrentUser: boolean
  messageId: number
  messageCreatedAt: string
}

const SharedPostMessage: React.FC<SharedPostMessageProps> = ({ sharedPost, isCurrentUser, messageId, messageCreatedAt }) => {
  const router = useRouter()
  const { user } = useAuth()

  // Check if current user can view this shared post
  const canViewPost = () => {
    if (!user) return false
    
    // If the post is public, anyone can view
    if (sharedPost.privacy === 'public') return true
    
    // If the post is from the current user, they can always view
    if (sharedPost.user.id === user.id) return true
    
    // For private users, only followers can view
    if (sharedPost.user.is_private) {
      // This would need to be checked via API, but for now we'll assume
      // the backend has already filtered this. In a real implementation,
      // we'd need to check the follow relationship here.
      return false // For private users in group chats, don't show to non-followers
    }
    
    // For other privacy levels (followers, friends, listed), allow viewing
    // In a full implementation, we'd check the specific relationships
    return true
  }

  const canView = canViewPost()

  // Parse various timestamp formats robustly: ISO strings, milliseconds, or seconds
  const parseDate = (value: string | number | undefined | null): Date => {
    if (!value && value !== 0) return new Date(0)
    const raw = typeof value === 'number' ? value : String(value).trim()

    // If purely numeric string, attempt to detect units (seconds, milliseconds, microseconds)
    if (/^\d+$/.test(String(raw))) {
      const n = Number(raw)
      // Try as milliseconds first
      const asMs = new Date(n)
      if (asMs.getFullYear() >= 2000) return asMs

      // Try as seconds
      const asSeconds = new Date(n * 1000)
      if (asSeconds.getFullYear() >= 2000) return asSeconds

      // Try as microseconds (divide by 1000)
      const asMicros = new Date(Math.floor(n / 1000))
      if (asMicros.getFullYear() >= 2000) return asMicros

      // Fallback: prefer asSeconds if it looks reasonable, else asMs
      if (asSeconds.getTime() !== 0) return asSeconds
      // Log suspicious value
      console.warn('parseDate: suspicious numeric date value', value, '->', asMs)
      return asMs
    }

    // Fallback: let Date parse ISO-like strings
    const d = new Date(String(raw))
    if (isNaN(d.getTime())) {
      // If parsing failed, log and return epoch 0
      console.warn('parseDate: failed to parse date', value)
      return new Date(0)
    }
    return d
  }

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-3 h-3" />
      case 'followers':
        return <EyeOff className="w-3 h-3" />
      case 'friends':
        return <Lock className="w-3 h-3" />
      case 'listed':
        return <UserIcon className="w-3 h-3" />
      default:
        return <Globe className="w-3 h-3" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatMessageTime = (dateString: string) => {
    const date = parseDate(dateString)
    if (isNaN(date.getTime()) || date.getTime() === 0) return ''
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <motion.div
      className={`relative px-5 py-4 rounded-2xl shadow-xl backdrop-blur-lg border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
        isCurrentUser
          ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-emerald-400/40 rounded-br-lg shadow-emerald-500/20'
          : 'bg-gradient-to-br from-white/15 to-white/10 text-white border-white/25 rounded-bl-lg hover:from-white/20 hover:to-white/15 shadow-white/10'
      }`}
      data-message-id={messageId}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={() => canView && router.push(`/post/${sharedPost.id}`)}
    >
      {/* Shared Post Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <Send className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-xs font-medium text-white/70">
          Shared a post
        </span>
        <span className="text-xs text-white/50">·</span>
        <span className="text-xs text-white/60">
          {formatMessageTime(messageCreatedAt)}
        </span>
      </div>

      {/* Post Content Container */}
      <motion.div
        className={`rounded-xl p-4 border transition-all duration-300 ${
          isCurrentUser
            ? 'bg-white/10 border-white/20 hover:bg-white/15'
            : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-400/20 hover:from-emerald-500/15 hover:to-teal-500/15'
        }`}
        whileHover={{ y: -1 }}
      >
        {canView ? (
          <>
            {/* Post Header */}
            <div className="flex items-start space-x-3 mb-3">
              {/* Author Avatar */}
              <motion.div
                className="flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/profile/${sharedPost.user.id}`)
                }}
              >
                {sharedPost.user.avatar && getAvatarUrl(sharedPost.user.avatar) ? (
                  <div className="relative">
                    <Image
                      src={getAvatarUrl(sharedPost.user.avatar)!}
                      alt={`${sharedPost.user.first_name} ${sharedPost.user.last_name}`}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white/20">
                    {sharedPost.user.first_name[0]}{sharedPost.user.last_name[0]}
                  </div>
                )}
              </motion.div>

              {/* Author Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <motion.h4
                    className="font-semibold text-white text-sm truncate hover:underline"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/profile/${sharedPost.user.id}`)
                    }}
                  >
                    {sharedPost.user.first_name} {sharedPost.user.last_name}
                  </motion.h4>
                  {sharedPost.user.nickname && (
                    <span className="text-xs text-white/60 truncate">
                      @{sharedPost.user.nickname}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-white/60">
                    {formatTimeAgo(sharedPost.created_at)}
                  </span>
                  <span className="text-xs text-white/40">·</span>
                  <div className="flex items-center space-x-1 text-white/60">
                    {getPrivacyIcon(sharedPost.privacy)}
                    <span className="text-xs capitalize">{sharedPost.privacy}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-3">
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                {sharedPost.content}
              </p>
            </div>

            {/* Post Image */}
            {sharedPost.image_url && (
              <div className="mb-3">
                <motion.div
                  className="relative rounded-lg overflow-hidden bg-gradient-to-br from-white/10 to-white/5"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src={sharedPost.image_url.startsWith('http')
                      ? sharedPost.image_url
                      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${sharedPost.image_url}`
                    }
                    alt="Shared post image"
                    width={400}
                    height={250}
                    className="w-full h-auto max-h-48 object-cover"
                    unoptimized={sharedPost.image_url.includes('/svg')}
                  />
                </motion.div>
              </div>
            )}

            {/* Engagement Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center space-x-4">
                {/* Comments */}
                <motion.button
                  className="flex items-center space-x-1 text-white/70 hover:text-white transition-colors group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">{sharedPost.comment_count}</span>
                </motion.button>

                {/* Likes */}
                <motion.button
                  className={`flex items-center space-x-1 transition-colors group ${
                    sharedPost.like_count > 0 ? 'text-red-400' : 'text-white/70 hover:text-red-400'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                    sharedPost.like_count > 0 ? 'fill-current' : ''
                  }`} />
                  <span className="text-xs font-medium">{sharedPost.like_count}</span>
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          /* Unavailable Post Message */
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Lock className="w-8 h-8 text-white/40 mx-auto mb-2" />
              <p className="text-white/60 text-sm">This post is unavailable</p>
              <p className="text-white/40 text-xs mt-1">You don&apos;t have permission to view this content</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Message tail */}
      <div className={`absolute bottom-0 ${
        isCurrentUser
          ? '-right-2 border-l-emerald-400 border-l-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
          : '-left-2 border-r-white/20 border-r-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
      }`}></div>

      {/* Hover effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 rounded-2xl"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}

interface ChatWindowProps {
  conversationId: number
  conversationType: 'private' | 'group'
  chatType?: 'group' | 'private' // New prop for UI type
  participantName: string
  participantId?: number
  // For group chats we pass the raw groupId so we can resolve the true conversation ID after first message
  groupId?: number
  // Notify parent (GroupChat) when we discover/upgrade to the real conversation ID
  onConversationResolved?: (conversationId: number) => void
  onClose?: () => void // Optional for minimal UI
  hideHeader?: boolean // Hide the chat header if true
  initialTab?: string // Initial tab to open ('info', 'settings', etc.)
  highlightMessageId?: number // If provided, scroll to and highlight this message on open
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  conversationType,
  chatType, // Will be determined from conversationType if not provided
  participantId,
  participantName,
  groupId,
  initialTab,
  highlightMessageId,
  onConversationResolved,
  onClose,
  hideHeader
}) => {
  // Determine chatType from conversationType if not explicitly provided
  const effectiveChatType = chatType || conversationType;
  

  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab || 'chat') // New state for active tab
  const [groupData, setGroupData] = useState<GroupResponse | null>(null) // Store group data including user role
  const [groupMembers, setGroupMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLDivElement | null>(null)
  const highlightLoadAttemptsRef = useRef<number>(0)
  const [participantData, setParticipantData] = useState<User | null>(null)
  const [wasAtBottom, setWasAtBottom] = useState(true)
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // Helper function to get group initials
  const getGroupInitials = (groupName: string): string => {
    if (!groupName) return '??'
    const words = groupName.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  // Real-time messaging integration
  const {
    messages,
    sendMessage: sendRealTimeMessage,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    fetchConversationMessages,
    refreshConversations,
    conversations,
    markAsRead,
    registerConversationIdCallback,
    unregisterConversationIdCallback
  } = useRealTimeMessages()

  // Internal effective conversation ID (can upgrade from placeholder groupId to real conversation ID)
  const [effectiveConversationId, setEffectiveConversationId] = useState<number>(conversationId)
  const [isNewConversation, setIsNewConversation] = useState<boolean>(false)

  // Check if this is a potentially new conversation that needs ID resolution
  useEffect(() => {
    // For private conversations, check if we have a generated/placeholder ID
    // For group conversations, check if the conversationId matches the groupId (indicating it's a placeholder)
    const needsResolution = conversationType === 'private' 
      ? !conversations.find(c => c.id === conversationId && c.type === 'private')
      : !!(conversationType === 'group' && groupId && conversationId === groupId)

    setIsNewConversation(needsResolution)

    // Register callback for conversation ID resolution if needed
    if (needsResolution) {
      registerConversationIdCallback(conversationId, (newId: number) => {
        console.log(`ChatWindow: Conversation ID resolved from ${conversationId} to ${newId}`)
        setEffectiveConversationId(newId)
        setIsNewConversation(false)
        onConversationResolved?.(newId)
      })
    }

    // Cleanup callback on unmount or conversation change
    return () => {
      if (needsResolution) {
        unregisterConversationIdCallback(conversationId)
      }
    }
  }, [conversationId, conversationType, groupId, conversations, registerConversationIdCallback, unregisterConversationIdCallback, onConversationResolved])

  // If prop conversationId changes (parent already resolved) update effective ID
  useEffect(() => {
    if (conversationType === 'group') {
      if (conversationId !== effectiveConversationId) {
        setEffectiveConversationId(conversationId)
      }
    } else {
      setEffectiveConversationId(conversationId)
    }
  }, [conversationId, conversationType])

  // Typing indicator integration
  // For groups, pass the groupId; for private chats, pass the participantId (not conversationId)
  // This is because WebSocket typing messages use group_id for groups and to/from user IDs for private
  const typingConversationId = conversationType === 'group' && groupId ? groupId : (participantId || effectiveConversationId)
  const {
    typingUsers,
    startTyping
  } = useTypingIndicator(typingConversationId, conversationType)

  // Connection status monitoring
  const { isConnected, onlineUsers } = useWebSocket()

  // Load conversation messages when component mounts or conversation changes
  useEffect(() => {
    if (effectiveConversationId && conversationType) {
      fetchConversationMessages(effectiveConversationId, conversationType, participantId, 20, 0, false)
    }
  }, [effectiveConversationId, conversationType, participantId, fetchConversationMessages])

  // After messages load, if we have a highlight target, try to scroll to it
  // NOTE: This only applies to PRIVATE chats. Group chats handle highlighting in GroupChatTab.
  useEffect(() => {
    if (!highlightMessageId) return
    if (conversationType === 'group') {
      // Skip for groups - GroupChatTab handles it
      console.log('[ChatWindow] Skipping highlight for group chat, GroupChatTab will handle it', { highlightMessageId })
      return
    }
    
    const list = Array.from(messages.get(effectiveConversationId) || [])
    console.log('[ChatWindow] Private chat highlight effect:', { highlightMessageId, messageCount: list.length })
    
    if (list.length === 0) return
    
    // Delay to ensure DOM is fully rendered
    setTimeout(() => {
      // Try to find the DOM node for this message id
      const el = document.querySelector(`[data-message-id="${highlightMessageId}"]`) as HTMLDivElement | null
      console.log('[ChatWindow] Looking for private message element:', { highlightMessageId, found: !!el })
      
      if (el && messagesContainerRef.current) {
        highlightedRef.current = el
        console.log('[ChatWindow] Scrolling to and highlighting private message:', highlightMessageId)
        el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-transparent')
        
        // Scroll to center the message in view with a small additional delay
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }, 50)
        
        // Remove highlight after a delay
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-transparent')
        }, 2500)
        // Reset attempts
        highlightLoadAttemptsRef.current = 0
      } else {
        // Not found yet; try loading more history up to a small number of attempts
        const attempts = highlightLoadAttemptsRef.current
        const canLoadMore = hasMoreMessages.get(effectiveConversationId) && !isLoadingMore.get(effectiveConversationId)
        console.log('[ChatWindow] Private message not found, can load more?', { attempts, canLoadMore })
        if (attempts < 5 && canLoadMore) {
          highlightLoadAttemptsRef.current = attempts + 1
          console.log('[ChatWindow] Loading more private messages, attempt:', attempts + 1)
          loadMoreMessages(effectiveConversationId, conversationType, participantId)
        }
      }
    }, 100)
  }, [messages, effectiveConversationId, highlightMessageId, hasMoreMessages, isLoadingMore, loadMoreMessages, conversationType, participantId])

  // Mark messages as read when viewing a conversation and sync unread counts
  useEffect(() => {
    if (!effectiveConversationId || !user) return
    const convMsgs = Array.from(messages.get(effectiveConversationId) || [])
    if (convMsgs.length === 0) return

    const unreadIds = convMsgs
      .filter(m => m.sender_id !== user.id && !m.is_read)
      .map(m => m.id)

    if (unreadIds.length === 0) return

    // Local state: mark as read now for instant UX
    markAsRead(effectiveConversationId)

    // Backend: mark specific messages as read
    api.markMessagesAsRead(unreadIds)
      .then(() => {
        // Revalidate chats to ensure backend unread counts are synced
        mutate('chats')
        // Also refresh conversations in the real-time hook
        refreshConversations()
      })
      .catch(err => {
        console.error('Failed to mark messages as read on server:', err)
      })

    // Chats list: clear unread count optimistically for this conversation
    mutate('chats', (current: ConversationResponse[] | { conversations: ConversationResponse[] } | undefined) => {
      if (!current) return current
      const list = Array.isArray(current) ? current : current.conversations
      if (!Array.isArray(list)) return current
      const next = list.map((c: ConversationResponse) => c?.id === effectiveConversationId ? { ...c, unread_count: 0 } : c)
      return Array.isArray(current) ? next : { ...current, conversations: next }
    }, false)
  }, [effectiveConversationId, messages, user, markAsRead, refreshConversations])

  // Attempt to resolve real group conversation ID if we only have the raw groupId placeholder
  useEffect(() => {
    if (conversationType !== 'group') return
    if (!groupId) return
    // If effectiveConversationId equals raw groupId, it might be a placeholder
    if (effectiveConversationId === groupId) {
      // Look through loaded conversations for a matching group
      const match = conversations.find(c => c.type === 'group' && c.group && c.group.id === groupId)
      if (match && match.id !== effectiveConversationId) {
        setEffectiveConversationId(match.id)
        onConversationResolved?.(match.id)
        // Fetch messages for the real ID
        fetchConversationMessages(match.id, 'group', undefined, 20, 0, false)
      }
    }
  }, [conversations, effectiveConversationId, groupId, conversationType, fetchConversationMessages, onConversationResolved])

  // Fetch participant data for private chats
  useEffect(() => {
    if (conversationType === 'private' && participantId) {
      const fetchParticipantData = async () => {
        try {
          const userData = await api.getProfile(participantId)
          setParticipantData(userData)
        } catch (error) {
          console.error('Failed to fetch participant data:', error)
        }
      }
      fetchParticipantData()
    }
  }, [conversationType, participantId])

  // Fetch group data when chatType is 'group'
  useEffect(() => {
    if (effectiveChatType === 'group' && groupId) {
      const fetchGroupData = async () => {
        try {
          const data = await api.getGroup(groupId)
          setGroupData(data)
        } catch (error) {
          console.error('Failed to fetch group data:', error)
        }
      }
      fetchGroupData()
    }
  }, [effectiveChatType, groupId])

  // Check permissions for settings tab once group data loads
  useEffect(() => {
    if (effectiveChatType === 'group' && activeTab === 'settings' && groupData) {
      const isAdminOrCreator = groupData?.role === 'admin' || groupData?.role === 'creator';
      
      if (!isAdminOrCreator) {
        // User doesn't have permission for settings, redirect to info tab
        setActiveTab('info');
      }
    }
  }, [activeTab, effectiveChatType, groupData])

  // Fetch group members for online count calculation
  useEffect(() => {
    if (effectiveChatType === 'group' && groupId) {
      const fetchGroupMembers = async () => {
        setIsLoadingMembers(true)
        try {
          const members = await api.getGroupMembers(groupId)
          setGroupMembers(members.members)
        } catch (error) {
          console.error('Failed to fetch group members:', error)
        } finally {
          setIsLoadingMembers(false)
        }
      }
      fetchGroupMembers()
    }
  }, [effectiveChatType, groupId])

  // Function to load previous messages when button is clicked
  const handleLoadPreviousMessages = React.useCallback(async () => {
    if (conversationId && conversationType && hasMoreMessages.get(conversationId) && !isLoadingMore.get(conversationId)) {
      // Save current scroll position before loading
      const currentScrollTop = messagesContainerRef.current?.scrollTop || 0
      setIsLoadingHistorical(true)

      await loadMoreMessages(conversationId, conversationType, participantId)

      // Restore scroll position after loading
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = currentScrollTop
        }
        setIsLoadingHistorical(false)
      }, 50)
    }
  }, [conversationId, conversationType, participantId, hasMoreMessages, isLoadingMore, loadMoreMessages])

  // Handle scroll to track position (no longer loads messages automatically)
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollTop = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight

    // Check if user is at the bottom (within 50px)
    const atBottom = scrollTop + clientHeight >= scrollHeight - 50
    setWasAtBottom(atBottom)
  }, [])

  // Scroll to bottom when new messages arrive
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Smart scroll management - only scroll to bottom when appropriate
  const handleMessagesChange = React.useCallback(() => {
    if (isLoadingHistorical) {
      // When loading historical messages, scroll position is manually restored
      // in handleLoadPreviousMessages, so we don't do anything here
      return
    }

    if (wasAtBottom) {
      // Only scroll to bottom if user was already at the bottom
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [isLoadingHistorical, wasAtBottom, scrollToBottom])

  useEffect(() => {
    handleMessagesChange()
  }, [messages, handleMessagesChange, effectiveConversationId])

  const handleLeaveGroup = async (groupIdToLeave: number) => {
    try {
      await api.leaveGroup(groupIdToLeave)
      // Refresh conversations to update the list
      mutate('chats')
      // Close the chat window
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to leave group:', error)
    }
  }

  const handleManageAdmins = () => {
    setActiveTab('settings')
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return

    try {
      await sendRealTimeMessage(
        effectiveConversationId,
        newMessage.trim(),
        'text',
        conversationType === 'private' ? participantId : undefined,
        conversationType === 'group' ? groupId || effectiveConversationId : undefined
      )

      setNewMessage('')

      // The conversation ID resolution is now handled automatically by the 
      // registerConversationIdCallback mechanism in the useEffect above
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTyping = () => {
    if (isConnected) {
      startTyping()
    }
  }

  const handleEmojiClick = (emojiData: EmojiData) => {
    setNewMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  // Calculate online group members (excluding current user)
  const getOnlineGroupMembersCount = () => {
    if (!groupMembers.length || !onlineUsers.length) return 0
    return onlineUsers.filter(onlineUser => 
      onlineUser.user_id !== user?.id && // Exclude current user
      groupMembers.some(member => member.user.id === onlineUser.user_id) && // Must be a group member
      (onlineUser.status === 'online' || onlineUser.status === 'busy' || onlineUser.status === 'away') // Must be online
    ).length
  }

  const getParticipantStatus = (): string => {
    if (!participantId) return 'offline'
    const onlineUser = onlineUsers.find(u => u.user_id === participantId)
    if (!onlineUser) return 'offline'
    if (onlineUser.status === 'invisible' || onlineUser.status === 'offline') return 'offline'
    return onlineUser.status // 'online', 'busy', 'away'
  }

  // Parse various timestamp formats robustly: ISO strings, milliseconds, or seconds
  const parseDate = (value: string | number | undefined | null): Date => {
    if (!value && value !== 0) return new Date(0)
    const raw = typeof value === 'number' ? value : String(value).trim()

    // If purely numeric string, attempt to detect units (seconds, milliseconds, microseconds)
    if (/^\d+$/.test(String(raw))) {
      const n = Number(raw)
      // Try as milliseconds first
      const asMs = new Date(n)
      if (asMs.getFullYear() >= 2000) return asMs

      // Try as seconds
      const asSeconds = new Date(n * 1000)
      if (asSeconds.getFullYear() >= 2000) return asSeconds

      // Try as microseconds (divide by 1000)
      const asMicros = new Date(Math.floor(n / 1000))
      if (asMicros.getFullYear() >= 2000) return asMicros

      // Fallback: prefer asSeconds if it looks reasonable, else asMs
      if (asSeconds.getTime() !== 0) return asSeconds
      // Log suspicious value
      console.warn('parseDate: suspicious numeric date value', value, '->', asMs)
      return asMs
    }

    // Fallback: let Date parse ISO-like strings
    const d = new Date(String(raw))
    if (isNaN(d.getTime())) {
      // If parsing failed, log and return epoch 0
      console.warn('parseDate: failed to parse date', value)
      return new Date(0)
    }
    return d
  }

  const formatLastOnlineTime = (lastStatusChange: string | number | undefined | null): string => {
    const date = parseDate(lastStatusChange)
    const now = new Date()

    // Compare only the date parts to determine today / yesterday
    const dateDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayDate = new Date(todayDate)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)

    let timeString = ''
    if (dateDate.getTime() === todayDate.getTime()) {
      timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (dateDate.getTime() === yesterdayDate.getTime()) {
      timeString = `yesterday ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`
    } else {
      timeString = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }

    return `last seen ${timeString}`
  }

  const renderMessageStatus = (status?: string) => {
    if (!status) return null

    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-white/50" />
      case 'sent':
        return <Check className="w-3 h-3 text-white/50" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-white/50" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-400" />
      default:
        return null
    }
  }

  // Helper function to format time for messages
  const formatTime = (dateString: string | number) => {
    const date = parseDate(dateString)
    if (isNaN(date.getTime()) || date.getTime() === 0) return ''
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  // Helper function to check if messages should be grouped by date
  const shouldShowDateSeparator = (message: Message, index: number): boolean => {
    if (index === 0) return true
  const prevMessage = Array.from(messages.get(effectiveConversationId) || [])[index - 1]
    if (!prevMessage) return true

    // Fallback to now if created_at is missing/invalid
    const getValidDate = (val: string | number | undefined) => {
      const d = parseDate(val)
      if (isNaN(d.getTime()) || d.getTime() === 0) return new Date()
      return d
    }

    const messageDate = getValidDate(message.created_at)
    const prevMessageDate = getValidDate(prevMessage.created_at)
    return messageDate.toDateString() !== prevMessageDate.toDateString()
  }

  // Helper function to format date separator
  const formatDateSeparator = (dateString: string | number): string => {
    const messageDate = parseDate(dateString)
    if (isNaN(messageDate.getTime()) || messageDate.getTime() === 0) return ''
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.sender_id === user?.id
    const showAvatar = conversationType === 'group' && !isCurrentUser
    const showSenderName = conversationType === 'group' && !isCurrentUser

    // Fallback: if created_at is missing or invalid, use now
    let createdAt = message.created_at
    const parsedDate = parseDate(createdAt)
    if (isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0) {
      console.warn('renderMessage: invalid or missing created_at, using now', message)
      createdAt = new Date().toISOString()
    }

    const showDateSeparator = shouldShowDateSeparator({ ...message, created_at: createdAt }, index)

    return (
      <div key={message.id} className="space-y-2">
        {/* Date separator */}
        {showDateSeparator && (
          <motion.div
            className="flex items-center justify-center py-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <span className="text-xs text-white/60 font-medium">
                {formatDateSeparator(createdAt)}
              </span>
            </div>
          </motion.div>
        )}

        <div
          className={`flex items-end space-x-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
        >
          {/* Avatar for group chats */}
          {showAvatar && (
            <motion.div
              className="flex-shrink-0 cursor-pointer"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => {
                router.push(`/profile/${message.sender.id}`)
              }}
            >
              {(() => {
                const avatarUrl = message.sender.avatar ? getAvatarUrl(message.sender.avatar) : null;
                return avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${message.sender.first_name} ${message.sender.last_name}`}
                    width={32}
                    height={32}
                    unoptimized={avatarUrl.includes('/svg')}
                    className="w-8 h-8 rounded-full object-cover shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200">
                    {message.sender.first_name[0]}{message.sender.last_name[0]}
                  </div>
                );
              })()}
            </motion.div>
          )}

          <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
            {/* Sender name for group chats */}
            {showSenderName && (
              <motion.span
                className="text-xs text-white/60 mb-1 px-2 font-medium cursor-pointer hover:text-emerald-300 transition-colors duration-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => {
                  window.location.href = `/profile/${message.sender.id}`
                }}
              >
                {message.sender.first_name} {message.sender.last_name}
              </motion.span>
            )}

            {/* Enhanced Message bubble */}
            {message.shared_post ? (
              <SharedPostMessage
                sharedPost={message.shared_post}
                isCurrentUser={isCurrentUser}
                messageId={message.id}
                messageCreatedAt={createdAt}
              />
            ) : (
              <div
                className={`relative px-5 py-4 rounded-2xl shadow-xl backdrop-blur-lg border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                  isCurrentUser
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-emerald-400/40 rounded-br-lg shadow-emerald-500/20'
                    : 'bg-gradient-to-br from-white/15 to-white/10 text-white border-white/25 rounded-bl-lg hover:from-white/20 hover:to-white/15 shadow-white/10'
                }`}
                data-message-id={message.id}
              >
                {/* Message content */}
                <div className="text-sm leading-relaxed break-words font-medium">
                  {message.content}
                </div>

                {/* Message footer */}
                <motion.div
                  className={`flex items-center justify-between mt-2 space-x-2 ${
                    isCurrentUser ? 'text-emerald-100' : 'text-white/60'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-xs opacity-75">
                    {formatTime(createdAt)}
                  </span>
                  {isCurrentUser && (
                    <div className="flex items-center space-x-1">
                      {renderMessageStatus('sent')}
                    </div>
                  )}
                </motion.div>

                {/* Message tail */}
                <div className={`absolute bottom-0 ${
                  isCurrentUser
                    ? '-right-2 border-l-emerald-400 border-l-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                    : '-left-2 border-r-white/20 border-r-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                }`}></div>

                {/* Hover effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 rounded-2xl"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render tabbed group interface if chatType is 'group'
  if (effectiveChatType === 'group') {
    // Determine tabs based on user role
    const isAdminOrCreator = groupData?.role === 'admin' || groupData?.role === 'creator';
    const tabs = isAdminOrCreator 
      ? ['info', 'chat', 'posts', 'events', 'polls', 'settings']
      : ['info', 'chat', 'posts', 'events', 'polls'];

    return (
      <motion.div
        className="h-full max-h-[calc(100vh-6rem)] flex flex-col rounded-3xl border border-white/30 overflow-hidden shadow-2xl ring-1 ring-white/20 mt-4"
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 30 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
      >
        {/* Enhanced Group Header */}
        {!hideHeader && (
          <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 shadow-xl relative">
            <div className="flex items-center space-x-4 relative z-10 flex-1 min-w-0">
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold shadow-2xl ring-2 ring-white/30 cursor-pointer overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('info')}
                title="View group info"
              >
                {groupData?.avatar && getAvatarUrl(groupData.avatar) ? (
                  <Image
                    src={getAvatarUrl(groupData.avatar)!}
                    alt={participantName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  getGroupInitials(participantName)
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <motion.h1 
                    className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent leading-tight cursor-pointer hover:from-emerald-200 hover:to-white/90 transition-all duration-200"
                    onClick={() => setActiveTab('info')}
                    whileHover={{ scale: 1.02 }}
                    title="View group info"
                  >
                    {participantName}
                  </motion.h1>
                  {/* Online users count - inline and smaller */}
                  {getOnlineGroupMembersCount() > 0 && (
                    <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-green-500/20 border-green-400/30 text-green-300 border">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-green-400/50 shadow-lg animate-pulse" />
                      <span className="text-xs font-medium">{getOnlineGroupMembersCount()}</span>
                    </div>
                  )}
                </div>
                {/* Group description */}
                {groupData?.description && (
                  <motion.p 
                    className="text-sm text-white/60 mt-1 leading-relaxed cursor-pointer hover:text-white/80 transition-colors duration-200"
                    onClick={() => setActiveTab('info')}
                    title="View group info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {groupData.description}
                  </motion.p>
                )}
                {/* Typing indicators */}
                {typingUsers.length > 0 && (
                  <motion.div
                    className="flex items-center space-x-2 mt-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 backdrop-blur-sm">
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {typingUsers.length === 1 
                          ? `${typingUsers[0].username || 'Someone'} is typing...`
                          : `${typingUsers.length} people are typing...`
                        }
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            {onClose && (
              <motion.button
                onClick={onClose}
                className="p-3 text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 rounded-2xl border border-white/20 hover:border-red-400/30 transition-all duration-300 group backdrop-blur-sm relative z-10 ml-4"
                title="Close chat"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </motion.button>
            )}
          </div>
        )}

        {/* Enhanced Tab Navigation */}
        <div className="px-6 py-3 flex justify-center items-center overflow-x-auto relative">
          <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-1 hover:shadow-emerald-500/10 transition-all duration-500 relative z-10">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                    activeTab === tab
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tab === 'info' && <Info className="w-4 h-4" />}
                  {tab === 'chat' && <MessageCircle className="w-4 h-4" />}
                  {tab === 'posts' && <FileText className="w-4 h-4" />}
                  {tab === 'events' && <Calendar className="w-4 h-4" />}
                  {tab === 'polls' && <BarChart3 className="w-4 h-4" />}
                  {tab === 'settings' && <Settings className="w-4 h-4" />}
                  <span className="capitalize">{tab === 'settings' ? 'Settings' : tab}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="h-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'info' && groupId && (
                <GroupInfoTab 
                  groupId={groupId} 
                  onLeaveGroup={handleLeaveGroup}
                  onManageAdmins={handleManageAdmins}
                  onClose={onClose}
                />
              )}
              {activeTab === 'chat' && (
                <GroupChatTab
                  conversationId={effectiveConversationId}
                  groupId={groupId}
                  highlightMessageId={highlightMessageId}
                  onConversationResolved={onConversationResolved}
                />
              )}
              {activeTab === 'posts' && groupId && (
                <GroupPostsTab groupId={groupId} groupTitle={participantName} />
              )}
              {activeTab === 'events' && groupId && (
                <GroupEventsTab groupId={groupId} groupTitle={participantName} />
              )}
              {activeTab === 'polls' && groupId && <GroupPollsTab groupId={groupId} />}
              {activeTab === 'settings' && groupId && (
                <GroupSettingsTab groupId={groupId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  // Regular chat interface for private messages
  return (
    <motion.div
      className="h-full max-h-[calc(100vh-6rem)] flex flex-col rounded-3xl border border-white/30 overflow-hidden shadow-2xl ring-1 ring-white/20 mt-4"
      initial={{ opacity: 0, scale: 0.96, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 30 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
    >
      {/* Enhanced Header */}
      {!hideHeader && (
        <motion.div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-xl relative"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
        >
          
          <div className="flex items-center space-x-4 relative z-10">
            {/* Enhanced Avatar */}
            <motion.div
              className={`relative ${conversationType === 'private' && participantId ? 'cursor-pointer' : ''}`}
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => {
                if (conversationType === 'private' && participantId) {
                  router.push(`/profile/${participantId}`)
                }
              }}
            >
              {conversationType === 'private' && participantData?.avatar ? (
                <Image
                  src={participantData.avatar}
                  alt={participantData.first_name + ' ' + participantData.last_name}
                  width={56}
                  height={56}
                  className={`w-14 h-14 rounded-full object-cover shadow-2xl ring-2 ring-white/30 ${
                    conversationType === 'private' && participantId ? 'hover:ring-emerald-400/60 hover:shadow-emerald-400/20' : ''
                  } transition-all duration-300 hover:shadow-2xl`}
                />
              ) : (
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold shadow-2xl ring-2 ring-white/30 ${
                  conversationType === 'private' && participantId ? 'hover:ring-emerald-400/60 hover:shadow-emerald-400/20' : ''
                } transition-all duration-300 hover:shadow-2xl hover:scale-105`}>
                  {conversationType === 'private' ? participantName[0].toUpperCase() : '#'}
                </div>
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              {/* Enhanced Username */}
              <motion.h1
                className={`text-2xl font-bold truncate leading-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent ${
                  conversationType === 'private' && participantId 
                    ? 'cursor-pointer hover:from-emerald-300 hover:to-teal-300 transition-all duration-300' 
                    : ''
                }`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
                onClick={() => {
                  if (conversationType === 'private' && participantId) {
                    router.push(`/profile/${participantId}`)
                  }
                }}
              >
                {conversationType === 'private' && participantData 
                  ? `${participantData.first_name} ${participantData.last_name}`.trim()
                  : participantName}
              </motion.h1>
              
              {/* Enhanced Status */}
              <motion.div
                className="flex items-center space-x-3 mt-2"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
              >
                {/* Typing indicator for private chats */}
                {conversationType === 'private' && typingUsers.length > 0 ? (
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300">
                    <div className="flex space-x-1">
                      <motion.div
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                      />
                    </div>
                    <span className="text-xs font-semibold">typing...</span>
                  </div>
                ) : (
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full backdrop-blur-sm border ${
                    conversationType === 'private' && participantId
                      ? (getParticipantStatus() === 'online' ? 'bg-green-500/20 border-green-400/30 text-green-300' :
                         getParticipantStatus() === 'busy' ? 'bg-red-500/20 border-red-400/30 text-red-300' :
                         getParticipantStatus() === 'away' ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300' :
                         'bg-gray-500/20 border-gray-400/30 text-gray-300')
                      : (isConnected ? 'bg-green-500/20 border-green-400/30 text-green-300' : 'bg-red-500/20 border-red-400/30 text-red-300')
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      conversationType === 'private' && participantId
                        ? (getParticipantStatus() === 'online' ? 'bg-green-400 shadow-green-400/50' :
                           getParticipantStatus() === 'busy' ? 'bg-red-400 shadow-red-400/50' :
                           getParticipantStatus() === 'away' ? 'bg-yellow-400 shadow-yellow-400/50' :
                           'bg-gray-400 shadow-gray-400/50')
                        : (isConnected ? 'bg-green-400 shadow-green-400/50' : 'bg-red-400 shadow-red-400/50')
                    } shadow-lg`} />
                    <span className="text-xs font-semibold">
                      {conversationType === 'private' && participantId
                        ? (getParticipantStatus() === 'online' ? 'Online' :
                           getParticipantStatus() === 'busy' ? 'Busy' :
                           getParticipantStatus() === 'away' ? 'Away' :
                           participantData?.last_status_change ? formatLastOnlineTime(participantData.last_status_change) : 'Offline')
                        : (isConnected ? 'Connected' : 'Disconnected')
                      }
                    </span>
                  </div>
                )}
                {conversationType === 'group' && (
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                    <span className="text-xs text-white/70 font-medium">
                      {Array.from(messages.get(conversationId) || []).length} messages
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          <div className="flex items-center space-x-2 relative z-10">
            {/* Enhanced Close button */}
            {onClose && (
              <motion.button
                onClick={onClose}
                className="p-3 text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 rounded-2xl border border-white/20 hover:border-red-400/30 transition-all duration-300 group backdrop-blur-sm"
                title="Close chat"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Enhanced Messages Area */}
      <motion.div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-scroll scrollbar-hide px-6 py-4 space-y-4 min-h-0 transition-colors duration-200 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.23, 1, 0.320, 1] }}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
          {/* Load Previous Messages Button */}
              {hasMoreMessages.get(effectiveConversationId) && !isLoadingMore.get(effectiveConversationId) && Array.from(messages.get(effectiveConversationId) || []).length > 0 && !isLoadingHistorical && (
            <motion.div
              className="flex justify-center py-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                onClick={handleLoadPreviousMessages}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 backdrop-blur-sm border border-white/20 rounded-xl text-white/80 hover:text-white transition-all duration-200 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Load previous messages"
              >
                <motion.div
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
                <span className="text-sm font-medium">Load Previous Messages</span>
              </motion.button>
            </motion.div>
          )}

          {isLoading ? (
            <motion.div
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full mx-auto mb-4"
                />
                <div className="text-white/60 text-lg">Loading messages...</div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Loading more indicator */}
              {isLoadingMore.get(effectiveConversationId) && (
                <motion.div
                  className="flex items-center justify-center py-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-center space-x-2 text-white/60">
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white/60 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="text-sm">Loading more messages...</span>
                  </div>
                </motion.div>
              )}

              {Array.from(messages.get(effectiveConversationId) || []).length === 0 ? (
                <motion.div
                  className="flex items-center justify-center h-full"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1] }}
                >
                  <div className="text-center max-w-md mx-auto">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0] 
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="text-6xl mb-6 filter drop-shadow-lg"
                    >
                    <MessageRounded className="w-16 h-16 text-white/40 mx-auto mb-6" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-3">
                        No messages yet
                      </h3>
                      <p className="text-white/60 text-base mb-6 leading-relaxed">
                        Start the conversation with {conversationType === 'private' && participantData 
                          ? `${participantData.first_name} ${participantData.last_name}`.trim()
                          : conversationType === 'group' ? `#${participantName}` : participantName}!
                      </p>
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-white/50 text-sm font-medium">
                          {isConnected ? 'Connected' : 'Connecting...'}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                Array.from(messages.get(effectiveConversationId) || []).map((message, index) =>
                  renderMessage(message, index)
                )
              )}
              <div ref={messagesEndRef} />
            </>
          )}
      </motion.div>

      {/* Enhanced Input Area */}
      <motion.div
        className="p-4 flex-shrink-0 relative"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.23, 1, 0.320, 1] }}
      >
        
        <div className="flex items-center justify-center space-x-4 relative z-10 min-h-[48px]">
          <div className="flex-1 relative">
            <textarea
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 128) + 'px'
                }
              }}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${conversationType === 'private' && participantData 
                ? `${participantData.first_name} ${participantData.last_name}`.trim()
                : conversationType === 'group' ? `#${participantName}` : participantName}...`}
              className="w-full bg-gradient-to-r from-white/15 to-white/10 border border-white/25 rounded-2xl px-6 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/50 resize-none min-h-[52px] max-h-32 text-sm overflow-y-auto scrollbar-hide transition-all duration-300 hover:bg-gradient-to-r hover:from-white/20 hover:to-white/15"
              rows={1}
            />
          </div>

          {/* Enhanced Emoji Picker Button */}
          <motion.button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-orange-500/20 rounded-xl border border-white/20 hover:border-yellow-400/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-yellow-500/20"
            title="Add emoji"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Smile className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-xl text-white hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl hover:shadow-emerald-500/30 border border-emerald-400/30 disabled:border-white/20"
            title="Send message"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              className="absolute bottom-full left-6 mb-8 z-50"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl ring-1 ring-white/20 overflow-hidden">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  searchPlaceHolder="Search emojis..."
                  width={350}
                  height={400}
                  previewConfig={{
                    showPreview: false
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {newMessage.length > 0 && (
            <motion.div
              className="text-xs text-white/50 mt-3 text-right"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              Press Enter to send • Shift+Enter for new line
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default ChatWindow