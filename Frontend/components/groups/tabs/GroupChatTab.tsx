'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useRealTimeMessages, useTypingIndicator, useUpload } from '@/hooks'
import { api } from '@/lib/api'
import type { Message } from '@/types/hooks'
import { GroupChatTabProps } from '@/types/groups'


import MessageList from '../chat/MessageList'
import MessageInput from '../chat/MessageInput'
import MessageMenu from '../chat/MessageMenu'
import DeleteConfirmModal from '../chat/DeleteConfirmModal'
import ImagePreviewModal from '../../ui/ImagePreviewModal'

const GroupChatTab: React.FC<GroupChatTabProps> = ({
  conversationId,
  groupId,
  onConversationResolved,
  highlightMessageId
}) => {
  const [newMessage, setNewMessage] = useState('')
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLDivElement | null>(null)
  const highlightLoadAttemptsRef = useRef<number>(0)
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<{ role: string; is_admin_or_creator: boolean } | null>(null)
  const [groupPermissions, setGroupPermissions] = useState<{ send_messages: 'all_members' | 'admins_only' } | null>(null)

  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, isUploading: isUploadingImage } = useUpload()

  
  const [imagePreviewState, setImagePreviewState] = useState<{ isOpen: boolean; url: string | null }>({ isOpen: false, url: null })

  
  const [messageMenuState, setMessageMenuState] = useState<{ isOpen: boolean; messageId: number | null; x: number; y: number }>({ isOpen: false, messageId: null, x: 0, y: 0 })

  
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; messageId: number | null }>({ isOpen: false, messageId: null })

  
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

  
  const [effectiveConversationId, setEffectiveConversationId] = useState<number>(conversationId)

  
  
  const typingConversationId = groupId || effectiveConversationId
  const { startTyping } = useTypingIndicator(typingConversationId, 'group')

  
  const { isConnected } = useWebSocket()

  
  useEffect(() => {
    if (effectiveConversationId) {
      fetchConversationMessages(effectiveConversationId, 'group', undefined, 20, 0, false)
    }
  }, [effectiveConversationId, fetchConversationMessages])

  
  useEffect(() => {
    const targetId = (typeof highlightMessageId === 'number' ? highlightMessageId : undefined)
    if (!targetId) return
    
    const list = Array.from(messages.get(effectiveConversationId) || [])
    
    if (list.length === 0) return
    
    
    setTimeout(() => {
      
      const el = document.querySelector(`[data-message-id="${targetId}"]`) as HTMLDivElement | null
      
      if (el && messagesContainerRef.current) {
        highlightedRef.current = el
        
        el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-transparent')
        
        
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }, 50)
        
        
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-transparent')
        }, 2500)
        
        highlightLoadAttemptsRef.current = 0
      } else {
        
        const attempts = highlightLoadAttemptsRef.current
        const canLoadMore = hasMoreMessages.get(effectiveConversationId) && !isLoadingMore.get(effectiveConversationId)
        if (attempts < 5 && canLoadMore) {
          highlightLoadAttemptsRef.current = attempts + 1
          loadMoreMessages(effectiveConversationId, 'group', undefined)
        }
      }
    }, 100)
  }, [messages, effectiveConversationId, highlightMessageId, hasMoreMessages, isLoadingMore, loadMoreMessages])

  
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



  
  const scrollToBottom = React.useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  
  const getUnreadMessagesInfo = React.useCallback(() => {
    const convMsgs = Array.from(messages.get(effectiveConversationId) || [])
    const unreadMessages = convMsgs.filter(m => m.sender_id !== user?.id && !m.is_read)
    
    if (unreadMessages.length === 0) {
      return { hasUnread: false, firstUnreadMessage: null, unreadCount: 0 }
    }
    
    
    const firstUnreadMessage = unreadMessages[0]
    
    return {
      hasUnread: true,
      firstUnreadMessage,
      unreadCount: unreadMessages.length
    }
  }, [messages, effectiveConversationId, user])

  
  const handleMessagesChange = React.useCallback(() => {
    if (isLoadingHistorical) return

    
    if (isInitialLoad && Array.from(messages.get(effectiveConversationId) || []).length > 0) {
      const unreadInfo = getUnreadMessagesInfo()
      
      if (unreadInfo.hasUnread && unreadInfo.firstUnreadMessage) {
        
        setTimeout(() => {
          const messageElement = document.querySelector(`[data-message-id="${unreadInfo.firstUnreadMessage!.id}"]`) as HTMLElement
          if (messageElement && messagesContainerRef.current) {
            messageElement.scrollIntoView({ behavior: 'instant', block: 'start' })
          }
        }, 100)
      } else {
        
        scrollToBottom()
      }
      
      setIsInitialLoad(false)
      return
    }

    
    
  }, [isLoadingHistorical, isInitialLoad, messages, effectiveConversationId, scrollToBottom, getUnreadMessagesInfo])

  useEffect(() => {
    handleMessagesChange()
  }, [handleMessagesChange])

  
  useEffect(() => {
    const loadUserRoleAndPermissions = async () => {
      if (!groupId || !user) return
      
      try {
        const roleData = await api.getUserRole(groupId)
        setUserRole(roleData)
        
        
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


  const handleTyping = () => {
    if (isConnected) {
      startTyping()
    }
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
        'image', 
        undefined,
        groupId || effectiveConversationId
      )

      
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
    setImagePreviewState({ isOpen: true, url: imageUrl });
  }, []);

  const handleImagePreviewClose = useCallback(() => {
    setImagePreviewState({ isOpen: false, url: null })
  }, [])

  // Message menu handlers
  const handleMessageMenuOpen = (messageId: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
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
    const messageId = Number(deleteConfirmState.messageId)
    
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
      await api.deleteMessage(messageId)
      
      setDeleteConfirmState({ isOpen: false, messageId: null })
      handleMessageMenuClose()
    } catch (error) {
      console.error('Failed to delete message:', error)
      
    }
  }

  
  const canDeleteMessage = (message: Message) => {
    if (message.content === "XdeletedbyuserX" || message.content === "This message was deleted") return false 
    if (message.id >= 1000000000000) return false 

    
    if (userRole?.is_admin_or_creator) {
      return true
    }

    
    if (message.sender_id !== user?.id) return false

    const messageDate = new Date(message.created_at)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 72 
  }

  
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



  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <MessageList
        messages={Array.from(messages.get(effectiveConversationId) || [])}
        currentUserId={user?.id || 0}
        isLoading={isLoading}
        hasMore={hasMoreMessages.get(effectiveConversationId) || false}
        onLoadMore={handleLoadPreviousMessages}
        onDeleteClick={handleMessageMenuOpen}
        onImageClick={handleImagePreviewOpen}
        formatDateSeparator={formatDateSeparator}
        formatTime={formatTime}
        parseDate={parseDate}
        unreadCount={getUnreadMessagesInfo().unreadCount}
        lastReadMessageId={getUnreadMessagesInfo().firstUnreadMessage?.id || null}
        isGroupChat={true}
        canDeleteMessage={canDeleteMessage}
      />

      {/* Message Input */}
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onImageSelect={(file: File) => {
          
          const fakeEvent = {
            target: { files: [file] }
          } as unknown as React.ChangeEvent<HTMLInputElement>
          handleImageSelect(fakeEvent)
        }}
        isUploadingImage={isUploadingImage}
        canSendMessages={canSendMessages()}
        isConnected={isConnected}
      />

      {/* Message Menu */}
      <MessageMenu
        isOpen={messageMenuState.isOpen}
        x={messageMenuState.x}
        y={messageMenuState.y}
        onClose={handleMessageMenuClose}
        onDelete={() => {
          setDeleteConfirmState({ isOpen: true, messageId: messageMenuState.messageId })
          handleMessageMenuClose()
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState({ isOpen: false, messageId: null })}
        onConfirm={handleDeleteMessage}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewState.isOpen}
        imageUrl={imagePreviewState.url}
        onClose={handleImagePreviewClose}
      />
    </div>
  )
}

export default GroupChatTab