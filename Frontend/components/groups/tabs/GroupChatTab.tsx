'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Smile, ChevronDown, Image as ImageIcon, ZoomIn, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useRealTimeMessages, useTypingIndicator, useUpload } from '@/hooks'
import EmojiPicker from 'emoji-picker-react'
import { MessageRounded } from '@mui/icons-material'
import { api } from '@/lib/api'
import type { Message } from '@/hooks/useRealTimeMessages'
import { getUserInitials } from '@/utils/avatarUtils'
import Image from 'next/image'

// Import SharedPostMessage component
import SharedPostMessage from '../../posts/SharedPostMessage'
import ImagePreviewModal from '../../ui/ImagePreviewModal'

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
}const GroupChatTab: React.FC<GroupChatTabProps> = ({
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
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<{ role: string; is_admin_or_creator: boolean } | null>(null)
  const [groupPermissions, setGroupPermissions] = useState<{ send_messages: 'all_members' | 'admins_only' } | null>(null)

  // Image upload functionality
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, isUploading: isUploadingImage } = useUpload()

  // Image preview modal state
  const [imagePreviewState, setImagePreviewState] = useState<{ isOpen: boolean; url: string | null }>({ isOpen: false, url: null })

  // Message options menu state
  const [messageMenuState, setMessageMenuState] = useState<{ isOpen: boolean; messageId: number | null; x: number; y: number }>({ isOpen: false, messageId: null, x: 0, y: 0 })

  // Delete confirmation modal state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; messageId: number | null }>({ isOpen: false, messageId: null })

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
  const handleScroll = React.useCallback(() => {
    // Scroll position tracking removed - messages no longer load automatically
  }, [])

  // Scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  // Function to get unread messages info
  const getUnreadMessagesInfo = React.useCallback(() => {
    const convMsgs = Array.from(messages.get(effectiveConversationId) || [])
    const unreadMessages = convMsgs.filter(m => m.sender_id !== user?.id && !m.is_read)
    
    if (unreadMessages.length === 0) {
      return { hasUnread: false, firstUnreadMessage: null, unreadCount: 0 }
    }
    
    // Find the first unread message (earliest in the array since messages are ordered by creation time)
    const firstUnreadMessage = unreadMessages[0]
    
    return {
      hasUnread: true,
      firstUnreadMessage,
      unreadCount: unreadMessages.length
    }
  }, [messages, effectiveConversationId, user])

  // Smart scroll management
  const handleMessagesChange = React.useCallback(() => {
    if (isLoadingHistorical) return

    // Scroll to bottom on initial load when chat is first opened
    if (isInitialLoad && Array.from(messages.get(effectiveConversationId) || []).length > 0) {
      const unreadInfo = getUnreadMessagesInfo()
      
      if (unreadInfo.hasUnread && unreadInfo.firstUnreadMessage) {
        // Scroll to first unread message instead of bottom
        setTimeout(() => {
          const messageElement = document.querySelector(`[data-message-id="${unreadInfo.firstUnreadMessage!.id}"]`) as HTMLElement
          if (messageElement && messagesContainerRef.current) {
            messageElement.scrollIntoView({ behavior: 'instant', block: 'start' })
          }
        }, 100)
      } else {
        // No unread messages, scroll to bottom
        scrollToBottom()
      }
      
      setIsInitialLoad(false)
      return
    }

    // Removed automatic scrolling to bottom when new messages arrive
    // Users can manually scroll if they want to see new messages
  }, [isLoadingHistorical, isInitialLoad, messages, effectiveConversationId, scrollToBottom, getUnreadMessagesInfo])

  useEffect(() => {
    handleMessagesChange()
  }, [handleMessagesChange])

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadImage(file)
      
      // Send the image as a message
      await sendRealTimeMessage(
        effectiveConversationId,
        result.url, // Use the image URL as content
        'image', // Set message type to image
        undefined,
        groupId || effectiveConversationId
      )

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      // TODO: Show error toast
    }
  }

  // Image preview handlers
  const handleImagePreviewOpen = useCallback((imageUrl: string) => {
    console.log('📂 GroupChatTab: handleImagePreviewOpen called with:', imageUrl)
    console.log('📂 GroupChatTab: current state before:', imagePreviewState)
    setImagePreviewState({ isOpen: true, url: imageUrl })
    console.log('📂 GroupChatTab: state after setting:', { isOpen: true, url: imageUrl })
  }, [imagePreviewState])

  const handleImagePreviewClose = useCallback(() => {
    console.log('GroupChatTab: Closing image preview')
    setImagePreviewState({ isOpen: false, url: null })
  }, [])

  // Message menu handlers
  const handleMessageMenuOpen = (messageId: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Opening message menu for message ID:', messageId, 'type:', typeof messageId)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setMessageMenuState({
      isOpen: true,
      messageId,
      x: rect.left,
      y: rect.bottom + 5
    })
  }

  const handleMessageMenuClose = () => {
    setMessageMenuState({ isOpen: false, messageId: null, x: 0, y: 0 })
  }

  const handleDeleteMessage = async () => {
    console.log('handleDeleteMessage called, deleteConfirmState:', deleteConfirmState)
    const messageId = Number(deleteConfirmState.messageId)
    console.log('Converted messageId:', messageId, 'original:', deleteConfirmState.messageId, 'type:', typeof deleteConfirmState.messageId)
    
    // More robust validation
    if (!deleteConfirmState.messageId || 
        typeof deleteConfirmState.messageId !== 'number' || 
        isNaN(messageId) || 
        !Number.isInteger(messageId) || 
        messageId <= 0 || 
        messageId >= 1000000000000) {
      console.error('Invalid message ID:', deleteConfirmState.messageId, 'converted:', messageId)
      return
    }

    try {
      console.log('Calling api.deleteMessage with ID:', messageId)
      await api.deleteMessage(messageId)
      // The message will be updated via WebSocket
      setDeleteConfirmState({ isOpen: false, messageId: null })
      handleMessageMenuClose()
    } catch (error) {
      console.error('Failed to delete message:', error)
      // TODO: Show error toast
    }
  }

  // Helper function to check if message can be deleted
  const canDeleteMessage = (message: Message) => {
    if (message.content === "XdeletedbyuserX" || message.content === "This message was deleted") return false // Already deleted
    if (message.id >= 1000000000000) return false // Don't allow deleting optimistic messages

    // Group admins can delete any message without time limits
    if (userRole?.is_admin_or_creator) {
      return true
    }

    // Regular users can only delete their own messages within 3 days
    if (message.sender_id !== user?.id) return false

    const messageDate = new Date(message.created_at)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 72 // 3 days = 72 hours
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

interface ImageMessageProps {
  message: Message
  isCurrentUser: boolean
  createdAt: string
  onImageClick: (imageUrl: string) => void
  canDelete?: boolean
  onDeleteClick?: (messageId: number, event: React.MouseEvent) => void
}

// ImageMessage component for displaying images outside message bubbles
const ImageMessage: React.FC<ImageMessageProps> = ({ message, isCurrentUser, createdAt, onImageClick, canDelete = false, onDeleteClick }) => {
  const formatMessageTime = (dateString: string) => {
    const date = parseDate(dateString)
    if (isNaN(date.getTime()) || date.getTime() === 0) return ''
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const imageUrl = message.content.startsWith('http') 
    ? message.content 
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${message.content}`

  return (
    <div className={`w-full max-w-md ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}>
      {/* Image Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
          <ImageIcon className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-xs font-medium text-white/70">
          Shared an image
        </span>
        <span className="text-xs text-white/50">·</span>
        <span className="text-xs text-white/60">
          {formatMessageTime(createdAt)}
        </span>
      </div>

      {/* Image Content Container */}
      <motion.div
        className={`relative rounded-xl p-4 border transition-all duration-300 hover:shadow-lg cursor-pointer bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:from-white/15 hover:to-white/10 ${
          isCurrentUser ? 'rounded-br-lg' : 'rounded-bl-lg'
        }`}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          e.stopPropagation()
          onImageClick(imageUrl)
        }}
      >
        {/* Message menu button - positioned outside container in top right */}
        {canDelete && onDeleteClick && (
          <motion.button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDeleteClick(message.id, e)
            }}
            className="absolute -top-4 -right-1 z-20 p-2 text-white/70 hover:text-white transition-all duration-200 rounded-full hover:bg-white/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Message options"
          >
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
            </div>
          </motion.button>
        )}
        {/* Message tail */}
        <div className={`absolute bottom-0 ${
          isCurrentUser
            ? '-right-2 border-l-emerald-400 border-l-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
            : '-left-2 border-r-white/20 border-r-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
        }`}></div>

        {/* Image */}
        <motion.div
          className="relative rounded-lg overflow-hidden bg-gradient-to-br from-white/10 to-white/5 max-w-xs"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Image
            src={imageUrl}
            alt="Shared image"
            width={400}
            height={300}
            unoptimized={true}
            className="w-full h-auto max-h-96 object-cover rounded-lg hover:brightness-110 transition-all duration-200"
            onLoad={() => console.log('🖼️ ImageMessage: Image loaded successfully')}
            onError={() => console.log('🖼️ ImageMessage: Image failed to load')}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg cursor-pointer pointer-events-none hover:pointer-events-auto"
               onClick={(e) => {
                 e.stopPropagation()
                 console.log('🎯 ImageMessage: Overlay clicked')
                 onImageClick(imageUrl)
               }}>
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
              <ZoomIn className="w-4 h-4 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
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
    console.log('GroupChatTab: Rendering message:', { id: message.id, type: message.message_type, content: message.content?.substring(0, 50) })
    const isCurrentUser = message.sender_id === user?.id
    const showAvatar = !isCurrentUser
    const showSenderName = !isCurrentUser

    let createdAt = message.created_at
    const parsedDate = parseDate(createdAt)
    if (isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0) {
      createdAt = new Date().toISOString()
    }

    const showDateSeparator = shouldShowDateSeparator({ ...message, created_at: createdAt }, index)
    
    // Check if this is the first unread message
    const unreadInfo = getUnreadMessagesInfo()
    const isFirstUnreadMessage = unreadInfo.hasUnread && unreadInfo.firstUnreadMessage?.id === message.id

    return (
      <div key={message.id} className="space-y-3">
        {/* Date separator */}
        {showDateSeparator && (
          <motion.div
            className="flex items-center justify-center py-6"
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

        {/* Unread messages separator */}
        {isFirstUnreadMessage && (
          <motion.div
            className="flex items-center justify-center py-4"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-sm rounded-full px-6 py-3 border border-blue-400/30 shadow-lg">
              <span className="text-sm text-blue-200 font-semibold">
                {unreadInfo.unreadCount} unread message{unreadInfo.unreadCount !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        )}

        {/* Enhanced Message Card */}
        <motion.div
          className={`flex items-end space-x-4 ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.320, 1] }}
          whileHover={{ scale: 1.01 }}
        >
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
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200">
                  {getUserInitials(message.sender)}
                </div>
              )}
            </motion.div>
          )}

          {/* For shared posts, render without container */}
          {message.shared_post ? (
            <SharedPostMessage
              sharedPost={message.shared_post}
              isCurrentUser={isCurrentUser}
              messageId={message.id}
              messageCreatedAt={createdAt}
              canDelete={canDeleteMessage(message)}
              onDeleteClick={handleMessageMenuOpen}
            />
          ) : message.message_type === 'image' ? (
            <ImageMessage
              message={message}
              isCurrentUser={isCurrentUser}
              createdAt={createdAt}
              onImageClick={handleImagePreviewOpen}
              canDelete={canDeleteMessage(message)}
              onDeleteClick={handleMessageMenuOpen}
            />
          ) : (
            /* Enhanced Message Content Card */
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
              {/* Sender name for group chats */}
              {showSenderName && (
                <motion.span
                  className="text-xs text-white/60 mb-2 px-3 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {message.sender.first_name} {message.sender.last_name}
                </motion.span>
              )}

              {/* Enhanced Message Bubble Card */}
              <motion.div
                className={`relative px-6 py-5 rounded-3xl shadow-2xl backdrop-blur-xl border-2 transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] group-hover:shadow-emerald-500/10 ${
                  isCurrentUser
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-emerald-400/50 rounded-br-xl shadow-emerald-500/30'
                    : 'bg-gradient-to-br from-white/20 to-white/15 text-white border-white/30 rounded-bl-xl hover:from-white/25 hover:to-white/20 shadow-white/20'
                }`}
                data-message-id={message.id}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Message menu button - positioned outside bubble in top right */}
                {canDeleteMessage(message) && (
                  <motion.button
                    onClick={(e) => {
                      console.log('Message menu button clicked for message:', message.id, 'type:', typeof message.id)
                      e.preventDefault()
                      e.stopPropagation()
                      handleMessageMenuOpen(message.id, e)
                    }}
                    className="absolute -top-4 -right-1 z-20 p-2 text-white/70 hover:text-white transition-all duration-200 rounded-full hover:bg-white/10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Message options"
                  >
                    <div className="flex space-x-0.5">
                      <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                      <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                      <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                    </div>
                  </motion.button>
                )}
                {/* Message content */}
                <div className="text-sm leading-relaxed break-words font-medium">
                  {message.content === "XdeletedbyuserX" || message.content === "This message was deleted" ? (
                    <div className="flex items-center space-x-2 text-white/50 italic">
                      <MessageSquare className="w-4 h-4" />
                      <span>Message has been deleted</span>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>

                {/* Enhanced Message Footer */}
                <motion.div
                  className={`flex items-center justify-between mt-3 space-x-3 ${
                    isCurrentUser ? 'text-emerald-100' : 'text-white/70'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-xs opacity-80 font-medium">
                    {formatTime(createdAt)}
                  </span>
                </motion.div>

                {/* Enhanced Message Tail */}
                <div className={`absolute bottom-0 ${
                  isCurrentUser
                    ? '-right-3 border-l-emerald-400 border-l-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                    : '-left-3 border-r-white/30 border-r-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                }`}></div>

                {/* Enhanced Hover Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 rounded-3xl"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-scroll scrollbar-hide px-6 py-4 space-y-4 min-h-0 transition-colors duration-200 shadow-xl messages-container-bg"
        onScroll={handleScroll}
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

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              aria-label="Upload image"
            />

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

            {/* Image Upload Button */}
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="p-3 text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 rounded-xl border border-white/20 hover:border-blue-400/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Upload image"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isUploadingImage ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
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

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewState.isOpen}
        imageUrl={imagePreviewState.url}
        onClose={handleImagePreviewClose}
      />

      {/* Message Menu Overlay */}
      <AnimatePresence>
        {messageMenuState.isOpen && (
          <>
            {/* Click outside overlay - positioned only around the dropdown */}
            <motion.div
              className="fixed z-30"
              style={{
                left: Math.max(0, messageMenuState.x - 50),
                top: Math.max(0, messageMenuState.y - 50),
                width: Math.min(300, window.innerWidth - messageMenuState.x + 50),
                height: Math.min(200, window.innerHeight - messageMenuState.y + 50)
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleMessageMenuClose}
            />
            {/* Dropdown menu */}
            <motion.div
              className="fixed z-40 w-48 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden"
              style={{
                left: Math.max(0, messageMenuState.x - 192), // Position to the left of the button (192px is dropdown width)
                top: Math.max(0, messageMenuState.y - 10), // Align top of dropdown near the button
                transform: 'translate(0, 0)'
              }}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  console.log('Delete button clicked, messageMenuState.messageId:', messageMenuState.messageId)
                  setDeleteConfirmState({ isOpen: true, messageId: messageMenuState.messageId })
                  handleMessageMenuClose()
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Delete message</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmState.isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirmState({ isOpen: false, messageId: null })}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-2xl max-w-sm w-full mx-4"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Delete message?</h3>
                </div>
                
                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  This message will be deleted for everyone in this chat. This action cannot be undone.
                </p>
                
                <div className="flex space-x-3">
                  <motion.button
                    onClick={() => setDeleteConfirmState({ isOpen: false, messageId: null })}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors duration-200 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleDeleteMessage}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupChatTab