'use client'
import React, { useState, useRef } from 'react'
import { X, Send, Smile, Paperclip, Image as ImageIcon, Check, CheckCheck, Clock } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useRealTimeMessages, useTypingIndicator, useConnectionStatus } from '@/hooks'
import { api, User } from '@/lib/api'

interface ChatWindowProps {
  conversationId: number
  conversationType: 'private' | 'group'
  participantId?: number
  participantName: string
  onClose: () => void
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  conversationType,
  participantId,
  participantName,
  onClose
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const [participantData, setParticipantData] = useState<User | null>(null)
  const [lastScrollTop, setLastScrollTop] = useState(0)
  const { user } = useAuth()

  // Real-time messaging integration
  const {
    messages,
    sendMessage: sendRealTimeMessage,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    fetchConversationMessages
  } = useRealTimeMessages()

  // Typing indicator integration
  const {
    typingUsers,
    startTyping
  } = useTypingIndicator(conversationId)

  // Connection status monitoring
  const { isConnected, onlineUsers } = useWebSocket()
  const { connectionQuality } = useConnectionStatus()

  // Load conversation messages when component mounts or conversation changes
  React.useEffect(() => {
    if (conversationId && conversationType) {
      fetchConversationMessages(conversationId, conversationType, participantId, 20, 0, false)
    }
  }, [conversationId, conversationType, participantId, fetchConversationMessages])

  // Fetch participant data for private chats
  React.useEffect(() => {
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

  // Throttled function to load more messages
  const throttledLoadMore = React.useCallback(() => {
    if (timeoutIdRef.current) return
    timeoutIdRef.current = setTimeout(async () => {
      if (conversationId && conversationType && hasMoreMessages.get(conversationId) && !isLoadingMore.get(conversationId)) {
        await loadMoreMessages(conversationId, conversationType, participantId)
      }
      timeoutIdRef.current = null
    }, 500) // 500ms throttle
  }, [conversationId, conversationType, participantId, hasMoreMessages, isLoadingMore, loadMoreMessages])

  // Handle scroll to load more messages
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollTop = target.scrollTop

    // Detect scrolling up near the top (within 100px of top)
    if (scrollTop < 100 && scrollTop < lastScrollTop) {
      throttledLoadMore()
    }

    setLastScrollTop(scrollTop)
  }, [lastScrollTop, throttledLoadMore])

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !isConnected) return

    try {
      let messageContent = newMessage.trim()
      let messageType: 'text' | 'image' | 'file' = 'text'

      if (selectedFile) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })

        if (uploadResponse.ok) {
          messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file'
          if (!messageContent) {
            messageContent = selectedFile.name
          }
        } else {
          console.error('Failed to upload file')
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      await sendRealTimeMessage(
        conversationId,
        messageContent,
        messageType,
        conversationType === 'private' ? participantId : undefined,
        conversationType === 'group' ? conversationId : undefined
      )

      setNewMessage('')
      setSelectedFile(null)
    } catch (error) {
      console.error('Error sending message:', error)
      setIsUploading(false)
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

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getParticipantStatus = (): string => {
    if (!participantId) return 'offline'
    const onlineUser = onlineUsers.find(u => u.user_id === participantId)
    if (!onlineUser) return 'offline'
    if (onlineUser.status === 'invisible' || onlineUser.status === 'offline') return 'offline'
    return onlineUser.status // 'online', 'busy', 'away'
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

  // Helper function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderMessage = (message: any, index: number) => {
    const isCurrentUser = message.sender_id === user?.id
    const showAvatar = conversationType === 'group' && !isCurrentUser
    const showSenderName = conversationType === 'group' && !isCurrentUser

    // Check if we should show timestamp (every 5 messages or time gap > 10 minutes)
    const prevMessage = index > 0 ? Array.from(messages.get(conversationId) || [])[index - 1] : null
    const timeDiff = prevMessage ? 
      new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() : 0
    const showTimestamp = index === 0 || timeDiff > 10 * 60 * 1000 || index % 5 === 0

    return (
      <div key={message.id} className="space-y-2">
        {/* Timestamp separator */}
        {showTimestamp && (
          <motion.div
            className="flex items-center justify-center py-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <span className="text-xs text-white/60 font-medium">
                {new Date(message.created_at).toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </motion.div>
        )}

        <motion.div
          className={`flex items-end space-x-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          {/* Avatar for group chats */}
          {showAvatar && (
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-2 ring-white/10">
                {message.sender.first_name[0]}{message.sender.last_name[0]}
              </div>
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
            <motion.div
              className={`relative px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 hover:shadow-xl ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400/30 rounded-br-md'
                  : 'bg-white/10 text-white border-white/20 rounded-bl-md hover:bg-white/15'
              }`}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
                  {formatTime(message.created_at)}
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
            </motion.div>
          </div>
        </motion.div>
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
      <motion.div
        className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/20 p-4 flex items-center justify-between flex-shrink-0 shadow-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {conversationType === 'private' && participantData?.avatar ? (
              <Image
                src={participantData.avatar}
                alt={participantData.first_name + ' ' + participantData.last_name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover shadow-xl ring-2 ring-white/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white text-lg font-bold shadow-xl ring-2 ring-white/20">
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
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.h1
              className="text-white text-xl font-bold truncate leading-tight"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {participantName}
            </motion.h1>
            <motion.div
              className="flex items-center space-x-2 mt-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <motion.div
                className={`w-2 h-2 rounded-full ${
                  conversationType === 'private' && participantId 
                    ? (getParticipantStatus() === 'online' ? 'bg-green-500' :
                       getParticipantStatus() === 'busy' ? 'bg-red-500' :
                       getParticipantStatus() === 'away' ? 'bg-yellow-500' :
                       'bg-gray-500')
                    : (isConnected ? 'bg-green-500' : 'bg-red-500')
                }`}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-xs text-white/60 font-medium">
                {conversationType === 'private' && participantId 
                  ? (getParticipantStatus() === 'online' ? 'Online' :
                     getParticipantStatus() === 'busy' ? 'Busy' :
                     getParticipantStatus() === 'away' ? 'Away' :
                     'Offline')
                  : (isConnected ? 'Connected' : 'Disconnected')
                }
              </span>
              {connectionQuality && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-xs text-white/50">{connectionQuality}</span>
                </>
              )}
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
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
              animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs text-white/60 hidden sm:inline">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </motion.div>

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
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-emerald-400/20 scrollbar-track-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        onScroll={handleScroll}
      >
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
              {isLoadingMore.get(conversationId) && (
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

              {Array.from(messages.get(conversationId) || []).length === 0 ? (
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
                      Conversation ID: {conversationId}<br/>
                      Messages count: {Array.from(messages.get(conversationId) || []).length}
                    </div>
                  </div>
                </motion.div>
              ) : (
                Array.from(messages.get(conversationId) || []).map((message, index) => 
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
        {/* Selected File Display */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              className="mb-4 p-3 bg-white/10 rounded-lg border border-white/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5 text-white/70" aria-label="Image file" />
                  ) : (
                    <Paperclip className="w-5 h-5 text-white/70" />
                  )}
                  <span className="text-white/80 text-sm truncate">{selectedFile.name}</span>
                  <span className="text-white/50 text-xs">
                    ({((selectedFile as File).size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                </div>
                <motion.button
                  onClick={removeSelectedFile}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                  title="Remove file"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end space-x-4">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            className="hidden"
            title="Attach file"
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Attach file"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${conversationType === 'group' ? `#${participantName}` : participantName}...`}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-24 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none min-h-[44px] max-h-32 text-sm overflow-y-auto"
              rows={1}
            />
            
            {/* Emoji Picker Button */}
            <motion.button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-16 top-1/2 transform -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
              title="Add emoji"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Smile className="w-5 h-5" />
            </motion.button>
          </div>

          <motion.button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || !isConnected || isUploading}
            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="Send message"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isUploading ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              className="absolute bottom-full right-6 mb-4 z-50"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl p-3">
                <div className="grid grid-cols-8 gap-2 max-w-sm">
                  {['😀', '😂', '❤️', '👍', '👎', '🔥', '💯', '🎉', '🤔', '😢', '😮', '🙌', '👏', '💪', '🤝', '✨'].map((emoji) => (
                    <motion.button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-10 h-10 hover:bg-gray-100 rounded-lg flex items-center justify-center text-xl transition-colors"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(newMessage.length > 0 || selectedFile) && (
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
