'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Send, Smile, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useRealTimeMessages, useTypingIndicator } from '@/hooks'
import EmojiPicker from 'emoji-picker-react'
import { MessageRounded } from '@mui/icons-material'
import { api } from '@/lib/api'
import type { Message } from '@/hooks/useRealTimeMessages'
import { getAvatarUrl, getUserInitials } from '@/utils/avatarUtils'
import Image from 'next/image'

// Import SharedPostMessage component
import SharedPostMessage from '../../SharedPostMessage'

interface EmojiData {
  emoji: string
  names: string[]
  activeSkinTone: string
}

interface GroupChatTabProps {
  conversationId: number
  groupId?: number
  onConversationResolved?: (conversationId: number) => void
  highlightMessageId?: number
}

const GroupChatTab: React.FC<GroupChatTabProps> = ({
  conversationId,
  groupId,
  onConversationResolved,
  highlightMessageId
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLDivElement | null>(null)
  const highlightLoadAttemptsRef = useRef<number>(0)
  const [wasAtBottom, setWasAtBottom] = useState(true)
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<{ role: string; is_admin_or_creator: boolean } | null>(null)
  const [groupPermissions, setGroupPermissions] = useState<{ send_messages: 'all_members' | 'admins_only' } | null>(null)

  // Real-time messaging integration
  const {
    messages,
    sendMessage: sendRealTimeMessage,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    fetchConversationMessages,
    registerConversationIdCallback,
    unregisterConversationIdCallback
  } = useRealTimeMessages()

  // Internal effective conversation ID
  const [effectiveConversationId, setEffectiveConversationId] = useState<number>(conversationId)

  // Typing indicator integration - for groups, pass groupId to typing hook
  // The hook will send it as message.group_id which the backend uses to broadcast to group members
  const typingConversationId = groupId || effectiveConversationId
  const { startTyping } = useTypingIndicator(typingConversationId, 'group')

  // Connection status monitoring
  const { isConnected } = useWebSocket()

  // Load conversation messages when component mounts
  useEffect(() => {
    if (effectiveConversationId) {
      fetchConversationMessages(effectiveConversationId, 'group', undefined, 20, 0, false)
    }
  }, [effectiveConversationId, fetchConversationMessages])

  // Scroll to and highlight a specific message if provided
  useEffect(() => {
    const targetId = (typeof highlightMessageId === 'number' ? highlightMessageId : undefined)
    if (!targetId) return
    
    const list = Array.from(messages.get(effectiveConversationId) || [])
    console.log('[GroupChatTab] Highlight effect triggered:', {
      targetId,
      effectiveConversationId,
      messageCount: list.length,
      attempts: highlightLoadAttemptsRef.current
    })
    
    if (list.length === 0) return
    
    // Delay to ensure DOM is fully rendered
    setTimeout(() => {
      // Try to find the DOM node for this message id
      const el = document.querySelector(`[data-message-id="${targetId}"]`) as HTMLDivElement | null
      console.log('[GroupChatTab] Looking for message element:', { targetId, found: !!el })
      
      if (el && messagesContainerRef.current) {
        highlightedRef.current = el
        console.log('[GroupChatTab] Scrolling to and highlighting message:', targetId)
        // Add highlight ring with amber color
        el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-transparent')
        
        // Scroll to center the message in view with a small additional delay
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }, 50)
        
        // Remove highlight after delay
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-transparent')
        }, 2500)
        // Reset load attempts counter
        highlightLoadAttemptsRef.current = 0
      } else {
        // Message not found yet; try loading more history up to a few attempts
        const attempts = highlightLoadAttemptsRef.current
        const canLoadMore = hasMoreMessages.get(effectiveConversationId) && !isLoadingMore.get(effectiveConversationId)
        console.log('[GroupChatTab] Message not found, can load more?', { attempts, canLoadMore })
        if (attempts < 5 && canLoadMore) {
          highlightLoadAttemptsRef.current = attempts + 1
          console.log('[GroupChatTab] Loading more messages, attempt:', attempts + 1)
          loadMoreMessages(effectiveConversationId, 'group', undefined)
        }
      }
    }, 100)
  }, [messages, effectiveConversationId, highlightMessageId, hasMoreMessages, isLoadingMore, loadMoreMessages])

  // Handle conversation ID resolution for new group conversations
  useEffect(() => {
    if (groupId && conversationId === groupId) {
      registerConversationIdCallback(conversationId, (newId: number) => {
        setEffectiveConversationId(newId)
        onConversationResolved?.(newId)
      })
    }

    return () => {
      if (groupId && conversationId === groupId) {
        unregisterConversationIdCallback(conversationId)
      }
    }
  }, [conversationId, groupId, registerConversationIdCallback, unregisterConversationIdCallback, onConversationResolved])

  // Function to load previous messages
  const handleLoadPreviousMessages = React.useCallback(async () => {
    if (effectiveConversationId && hasMoreMessages.get(effectiveConversationId) && !isLoadingMore.get(effectiveConversationId)) {
      const currentScrollTop = messagesContainerRef.current?.scrollTop || 0
      setIsLoadingHistorical(true)

      await loadMoreMessages(effectiveConversationId, 'group', undefined)

      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = currentScrollTop
        }
        setIsLoadingHistorical(false)
      }, 50)
    }
  }, [effectiveConversationId, hasMoreMessages, isLoadingMore, loadMoreMessages])

  // Handle scroll tracking
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollTop = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight
    const atBottom = scrollTop + clientHeight >= scrollHeight - 50
    setWasAtBottom(atBottom)
  }, [])

  // Scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Smart scroll management
  const handleMessagesChange = React.useCallback(() => {
    if (isLoadingHistorical) return
    if (wasAtBottom) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [isLoadingHistorical, wasAtBottom, scrollToBottom])

  useEffect(() => {
    handleMessagesChange()
  }, [messages, handleMessagesChange, effectiveConversationId])

  // Load user role and group permissions
  useEffect(() => {
    const loadUserRoleAndPermissions = async () => {
      if (!groupId || !user) return
      
      try {
        const roleData = await api.getUserRole(groupId)
        setUserRole(roleData)
        
        // Fetch group data to get permissions
        const groupData = await api.getGroup(groupId)
        setGroupPermissions({
          send_messages: groupData.send_messages
        })
      } catch (err) {
        console.error('Failed to load user role and permissions for group:', err)
        setUserRole(null)
        setGroupPermissions(null)
      }
    }
    
    loadUserRoleAndPermissions()
  }, [groupId, user])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return

    try {
      await sendRealTimeMessage(
        effectiveConversationId,
        newMessage.trim(),
        'text',
        undefined,
        groupId || effectiveConversationId
      )
      setNewMessage('')
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

  // Parse date utility function
  const parseDate = (value: string | number | undefined | null): Date => {
    if (!value && value !== 0) return new Date(0)
    const raw = typeof value === 'number' ? value : String(value).trim()

    if (/^\d+$/.test(String(raw))) {
      const n = Number(raw)
      const asMs = new Date(n)
      if (asMs.getFullYear() >= 2000) return asMs
      const asSeconds = new Date(n * 1000)
      if (asSeconds.getFullYear() >= 2000) return asSeconds
      return asMs
    }

    const d = new Date(String(raw))
    if (isNaN(d.getTime())) {
      return new Date(0)
    }
    return d
  }

  const formatTime = (dateString: string | number) => {
    const date = parseDate(dateString)
    if (isNaN(date.getTime()) || date.getTime() === 0) return ''
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const shouldShowDateSeparator = (message: Message, index: number): boolean => {
    if (index === 0) return true
    const prevMessage = Array.from(messages.get(effectiveConversationId) || [])[index - 1]
    if (!prevMessage) return true

    const getValidDate = (val: string | number | undefined) => {
      const d = parseDate(val)
      if (isNaN(d.getTime()) || d.getTime() === 0) return new Date()
      return d
    }

    const messageDate = getValidDate(message.created_at)
    const prevMessageDate = getValidDate(prevMessage.created_at)
    return messageDate.toDateString() !== prevMessageDate.toDateString()
  }

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

  const canSendMessages = () => {
    if (!groupPermissions) return false
    return userRole?.is_admin_or_creator || groupPermissions.send_messages === 'all_members'
  }

  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.sender_id === user?.id
    const showAvatar = !isCurrentUser
    const showSenderName = !isCurrentUser

    let createdAt = message.created_at
    const parsedDate = parseDate(createdAt)
    if (isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0) {
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

        <div className={`flex items-end space-x-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          {/* Avatar for group chats */}
          {showAvatar && (
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {message.sender.avatar ? (
                <Image
                  src={message.sender.avatar}
                  alt={`${message.sender.first_name} ${message.sender.last_name}`}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200">
                  {getUserInitials(message.sender)}
                </div>
              )}
            </motion.div>
          )}

          <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
            {/* Sender name for group chats */}
            {showSenderName && (
              <motion.span
                className="text-xs text-white/60 mb-1 px-2 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
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
                className={`relative px-5 py-4 rounded-2xl shadow-xl backdrop-blur-lg border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${isCurrentUser
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

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-scroll scrollbar-hide px-6 py-4 space-y-4 min-h-0 transition-colors duration-200 shadow-xl"
        onScroll={handleScroll}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 100%)',
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
          >
            <motion.button
              onClick={handleLoadPreviousMessages}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 backdrop-blur-sm border border-white/20 rounded-xl text-white/80 hover:text-white transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronDown className="w-4 h-4 rotate-180" />
              <span className="text-sm font-medium">Load Previous Messages</span>
            </motion.button>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full mx-auto mb-4"
              />
              <div className="text-white/60 text-lg">Loading messages...</div>
            </div>
          </div>
        ) : (
          <>
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
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-3">
                    No messages yet
                  </h3>
                  <p className="text-white/60 text-base mb-6 leading-relaxed">
                    Start the conversation in this group!
                  </p>
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
      </div>

      {/* Input Area */}
      {canSendMessages() ? (
        <div className="p-4 flex-shrink-0 relative">
          <div className="flex items-center justify-center space-x-4 relative z-10 min-h-[48px]">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                onKeyPress={handleKeyPress}
                placeholder="Message the group..."
                className="w-full bg-gradient-to-r from-white/15 to-white/10 border border-white/25 rounded-2xl px-6 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/50 resize-none min-h-[52px] max-h-32 text-sm overflow-y-auto scrollbar-hide transition-all duration-300 hover:bg-gradient-to-r hover:from-white/20 hover:to-white/15"
                rows={1}
              />
            </div>

            {/* Emoji Picker Button */}
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
        </div>
      ) : (
        <div className="p-4 flex-shrink-0 relative">
          <div className="flex items-center justify-center relative z-10">
            <div className="text-white/60 text-sm bg-white/5 border border-white/10 rounded-lg px-4 py-2">
              Only admins and creators can send messages
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupChatTab