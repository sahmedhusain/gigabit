'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Send, Smile, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useRealTimeMessages, useTypingIndicator } from '@/hooks'
import EmojiPicker from 'emoji-picker-react'

interface EmojiData {
  emoji: string
  names: string[]
  activeSkinTone: string
}

interface GroupChatTabProps {
  conversationId: number
  groupId?: number
  onConversationResolved?: (conversationId: number) => void
}

const GroupChatTab: React.FC<GroupChatTabProps> = ({
  conversationId,
  groupId,
  onConversationResolved
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [wasAtBottom, setWasAtBottom] = useState(true)
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const { user } = useAuth()

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
  const { typingUsers, startTyping } = useTypingIndicator(typingConversationId, 'group')

  // Connection status monitoring
  const { isConnected } = useWebSocket()

  // Load conversation messages when component mounts
  useEffect(() => {
    if (effectiveConversationId) {
      fetchConversationMessages(effectiveConversationId, 'group', undefined, 20, 0, false)
    }
  }, [effectiveConversationId, fetchConversationMessages])

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

  const shouldShowDateSeparator = (message: any, index: number): boolean => {
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

  const renderMessage = (message: any, index: number) => {
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
                <img
                  src={message.sender.avatar}
                  alt={`${message.sender.first_name} ${message.sender.last_name}`}
                  className="w-8 h-8 rounded-full object-cover shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200">
                  {message.sender.first_name[0]}{message.sender.last_name[0]}
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

            {/* Message bubble */}
            <div
              className={`relative px-5 py-4 rounded-2xl shadow-xl backdrop-blur-lg border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                isCurrentUser
                  ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-emerald-400/40 rounded-br-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-br from-white/15 to-white/10 text-white border-white/25 rounded-bl-lg hover:from-white/20 hover:to-white/15 shadow-white/10'
              }`}
            >
              <div className="text-sm leading-relaxed break-words font-medium">
                {message.content}
              </div>

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
            </div>
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
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-emerald-400/30 scrollbar-track-emerald-900/10 hover:scrollbar-thumb-emerald-400/50 transition-colors duration-200"
        onScroll={handleScroll}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 100%)'
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
                    💬
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
      <div className="bg-gradient-to-t from-white/10 via-white/5 to-white/8 backdrop-blur-2xl border-t border-white/25 p-6 flex-shrink-0 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
        
        <div className="flex items-center space-x-4 relative z-10">
          {/* Emoji Picker Button */}
          <motion.button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-orange-500/20 rounded-2xl border border-white/20 hover:border-yellow-400/30 backdrop-blur-sm transition-all duration-300"
            title="Add emoji"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={handleKeyPress}
              placeholder="Message the group..."
              className="w-full bg-gradient-to-r from-white/15 to-white/10 border border-white/25 rounded-2xl px-6 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/50 resize-none min-h-[52px] max-h-32 text-sm overflow-y-auto backdrop-blur-sm shadow-inner transition-all duration-300 hover:bg-gradient-to-r hover:from-white/20 hover:to-white/15"
              rows={1}
            />
          </div>

          <motion.button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl text-white hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl hover:shadow-emerald-500/30 border border-emerald-400/30 disabled:border-white/20"
            title="Send message"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Send className="w-5 h-5" />
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
      </div>
    </div>
  )
}

export default GroupChatTab