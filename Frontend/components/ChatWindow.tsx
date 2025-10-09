'use client'
import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Smile, Check, CheckCheck, Clock, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useRealTimeMessages, useTypingIndicator } from '@/hooks'
import { api, User } from '@/lib/api'
import EmojiPicker from 'emoji-picker-react'
import { getAvatarUrl } from '@/utils/avatarUtils'
import { useRouter } from 'next/navigation'

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
}

interface ChatWindowProps {
  conversationId: number
  conversationType: 'private' | 'group'
  participantName: string
  participantId?: number
  // For group chats we pass the raw groupId so we can resolve the true conversation ID after first message
  groupId?: number
  // Notify parent (GroupChat) when we discover/upgrade to the real conversation ID
  onConversationResolved?: (conversationId: number) => void
  onClose?: () => void // Optional for minimal UI
  hideHeader?: boolean // Hide the chat header if true
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  conversationType,
  participantId,
  participantName,
  groupId,
  onConversationResolved,
  onClose,
  hideHeader
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [participantData, setParticipantData] = useState<User | null>(null)
  const [wasAtBottom, setWasAtBottom] = useState(true)
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

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
    conversations
  } = useRealTimeMessages()

  // Internal effective conversation ID (can upgrade from placeholder groupId to real conversation ID)
  const [effectiveConversationId, setEffectiveConversationId] = useState<number>(conversationId)

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
  const {
    typingUsers,
    startTyping
  } = useTypingIndicator(conversationId)

  // Connection status monitoring
  const { isConnected, onlineUsers } = useWebSocket()

  // Load conversation messages when component mounts or conversation changes
  useEffect(() => {
    if (effectiveConversationId && conversationType) {
      fetchConversationMessages(effectiveConversationId, conversationType, participantId, 20, 0, false)
    }
  }, [effectiveConversationId, conversationType, participantId, fetchConversationMessages])

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

      // If this is the first message in a group and we used a placeholder, try to resolve real conversation
      if (conversationType === 'group' && groupId && effectiveConversationId === groupId) {
        // Refresh conversations after a short delay to allow backend to create conversation
        setTimeout(async () => {
          await refreshConversations()
          const match = conversations.find(c => c.type === 'group' && c.group && c.group.id === groupId)
          if (match && match.id !== effectiveConversationId) {
            setEffectiveConversationId(match.id)
            onConversationResolved?.(match.id)
            fetchConversationMessages(match.id, 'group', undefined, 20, 0, false)
          }
        }, 500)
      }
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

            {/* Message bubble */}
            <div
              className={`relative px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 hover:shadow-xl ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400/30 rounded-br-md'
                  : 'bg-white/10 text-white border-white/20 rounded-bl-md hover:bg-white/15'
              }`}
            >
              {/* Message content */}
              <div className="text-sm leading-relaxed break-words">
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="h-full flex flex-col bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-2xl"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Header */}
      {!hideHeader && (
        <motion.div
          className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/20 p-4 flex items-center justify-between flex-shrink-0 shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="flex items-center space-x-4">
            {/* Clickable Avatar */}
            <motion.div
              className={`relative ${conversationType === 'private' && participantId ? 'cursor-pointer' : ''}`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
                  width={48}
                  height={48}
                  className={`w-12 h-12 rounded-full object-cover shadow-xl ring-2 ring-white/20 ${
                    conversationType === 'private' && participantId ? 'hover:ring-emerald-400/50' : ''
                  } transition-all duration-200`}
                />
              ) : (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white text-lg font-bold shadow-xl ring-2 ring-white/20 ${
                  conversationType === 'private' && participantId ? 'hover:ring-emerald-400/50' : ''
                } transition-all duration-200`}>
                  {conversationType === 'private' ? participantName[0].toUpperCase() : '#'}
                </div>
              )}
              {/* Online status indicator */}
              <motion.div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white/10 ${
                  conversationType === 'private' && participantId
                    ? (getParticipantStatus() === 'online' ? 'bg-green-500' :
                       getParticipantStatus() === 'busy' ? 'bg-red-500' :
                       getParticipantStatus() === 'away' ? 'bg-yellow-500' :
                       'bg-gray-500')
                    : (isConnected ? 'bg-green-500' : 'bg-red-500')
                } shadow-lg`}
                animate={{ scale: [1, 1.2, 1] }}
              />
            </motion.div>

            <div className="flex-1 min-w-0">
              {/* Clickable Username */}
              <motion.h1
                className={`text-white text-xl font-bold truncate leading-tight ${
                  conversationType === 'private' && participantId 
                    ? 'cursor-pointer hover:text-emerald-300 transition-colors duration-200' 
                    : ''
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                onClick={() => {
                  if (conversationType === 'private' && participantId) {
                    router.push(`/profile/${participantId}`)
                  }
                }}
              >
                {participantName}
              </motion.h1>
              <motion.div
                className="flex items-center space-x-2 mt-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <span className={`text-xs font-medium ${
                  conversationType === 'private' && participantId
                    ? (getParticipantStatus() === 'online' ? 'text-green-400' :
                       getParticipantStatus() === 'busy' ? 'text-red-400' :
                       getParticipantStatus() === 'away' ? 'text-yellow-400' :
                       'text-gray-400')
                    : (isConnected ? 'text-green-400' : 'text-red-400')
                }`}>
                  {conversationType === 'private' && participantId
                    ? (getParticipantStatus() === 'online' ? 'Online' :
                       getParticipantStatus() === 'busy' ? 'Busy' :
                       getParticipantStatus() === 'away' ? 'Away' :
                       participantData?.last_status_change ? formatLastOnlineTime(participantData.last_status_change) : 'Offline')
                    : (isConnected ? 'Connected' : 'Disconnected')
                  }
                </span>
                {conversationType === 'group' && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="text-xs text-white/50">
                      {Array.from(messages.get(conversationId) || []).length} messages
                    </span>
                  </>
                )}
              </motion.div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Connection indicator */}
            {onClose && (
              <motion.button
                onClick={onClose}
                className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                title="Close chat"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <motion.div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-emerald-400/20 scrollbar-track-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        onScroll={handleScroll}
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-white/40 text-6xl mb-4"
                    >
                      💬
                    </motion.div>
                    <div className="text-white/60 text-lg">No messages yet</div>
                    <div className="text-white/40 text-sm mt-2">Start the conversation!</div>
                    <div className="text-white/30 text-xs mt-4">
                      Conversation ID: {effectiveConversationId}<br/>
                      Conversation Type: {conversationType}<br/>
                      Available conversation IDs: {Array.from(messages.keys()).join(', ')}
                    </div>
                  </div>
                </motion.div>
              ) : (
                Array.from(messages.get(effectiveConversationId) || []).map((message, index) =>
                  renderMessage(message, index)
                )
              )}
              {typingUsers.length > 0 && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-emerald-400 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-emerald-400 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-emerald-400 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                      <span className="text-white/60 text-sm">
                        {conversationType === 'group' && typingUsers.length > 0
                          ? `${typingUsers.map(u => u.username || 'User').join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`
                          : 'Someone is typing...'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
      </motion.div>

      {/* Input */}
      <motion.div
        className="bg-white/5 backdrop-blur-xl border-t border-white/20 p-6 flex-shrink-0"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <div className="flex items-end space-x-4">
          {/* Emoji Picker Button */}
          <motion.button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Add emoji"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Smile className="w-5 h-5" />
          </motion.button>

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
              placeholder={`Message ${conversationType === 'group' ? `#${participantName}` : participantName}...`}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none min-h-[44px] max-h-32 text-sm overflow-y-auto"
              rows={1}
            />
          </div>

          <motion.button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="Send message"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              className="absolute bottom-full left-6 mb-4 z-50"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                searchPlaceHolder="Search emojis..."
                width={350}
                height={400}
                previewConfig={{
                  showPreview: false
                }}
              />
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
