'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type ConversationResponse } from '@/lib/api'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useAuth } from '@/context/AuthContext'

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

export function useRealTimeMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [messages, setMessages] = useState<Map<number, Message[]>>(new Map())
  const [unreadCounts, setUnreadCounts] = useState<Map<number, number>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState<Map<number, boolean>>(new Map())
  const [hasMoreMessages, setHasMoreMessages] = useState<Map<number, boolean>>(new Map())
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // WebSocket subscription for real-time message updates
  const { send, isConnected } = useWebSocketSubscription({
    messageTypes: ['private_message', 'group_message'],
    onMessage: (message) => {
      console.log('WebSocket message received:', message)
      
      if (message.type === 'private_message' || message.type === 'group_message') {
        // Get conversation ID from message data
        const conversationId = (message as any).data?.conversation_id || 0

        const newMessage: Message = {
          id: (message as any).data?.id || Date.now(), // Use real ID if available
          conversation_id: conversationId,
          sender_id: message.from || 0,
          content: message.content || '',
          message_type: 'text',
          created_at: message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString(),
          is_read: false,
          sender: {
            id: message.from || 0,
            first_name: (message as any).sender_name || 'Unknown',
            last_name: '',
            avatar: (message as any).sender_avatar || ''
          }
        }

        console.log('Processing WebSocket message:', { message, conversationId, newMessage })

        // Add message to conversation (append to end for newest messages at bottom)
        setMessages(prev => {
          const conversationMessages = prev.get(conversationId) || []
          const updated = new Map(prev)
          
          // Check if message already exists to prevent duplicates (by content and sender for better matching)
          const messageExists = conversationMessages.some(msg => 
            (msg.id === newMessage.id) || 
            (msg.content === newMessage.content && 
             msg.sender_id === newMessage.sender_id && 
             Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000) // Within 5 seconds
          )
          
          if (!messageExists) {
            updated.set(conversationId, [...conversationMessages, newMessage])
            console.log(`Added new message to conversation ${conversationId}:`, newMessage.content)
          } else {
            console.log(`Duplicate message prevented for conversation ${conversationId}:`, newMessage.content)
          }
          
          return updated
        })

        // Update unread count if message is not from current user
        if (message.from !== user?.id) {
          setUnreadCounts(prev => {
            const updated = new Map(prev)
            const currentCount = updated.get(conversationId) || 0
            updated.set(conversationId, currentCount + 1)
            return updated
          })
        }

        // Refresh conversations to update last message and timestamps
        setTimeout(() => {
          fetchConversations()
        }, 500)
      }
    }
  })

  // Helper function to generate conversation ID for private messages
  const getPrivateConversationId = useCallback((userId1: number, userId2: number): number => {
    return parseInt(`${Math.min(userId1, userId2)}${Math.max(userId1, userId2)}`)
  }, [])

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await api.getConversations()
      setConversations(response.conversations || [])

      // Initialize unread counts
      const unreadMap = new Map<number, number>()
      response.conversations.forEach(conv => {
        unreadMap.set(conv.id, conv.unread_count)
      })
      setUnreadCounts(unreadMap)

    } catch (err: any) {
      console.error('Failed to fetch conversations:', err)
      setError(err.message || 'Failed to fetch conversations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchConversationMessages = useCallback(async (conversationId: number, conversationType: 'private' | 'group', participantId?: number, limit: number = 20, offset: number = 0, append: boolean = false) => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Fetching messages for:', { conversationId, conversationType, participantId, limit, offset, append })

      let response: { messages: any[]; count: number; limit: number; offset: number }

      // Use conversation-specific endpoint
      console.log('Fetching messages for conversation ID:', conversationId)
      response = await api.getConversationMessages(conversationId, limit, offset)

      console.log('API response:', response)

      // Transform API messages to our Message format and reverse order (oldest first)
      const transformedMessages: Message[] = response.messages
        .map(msg => ({
          id: msg.id,
          conversation_id: conversationId,
          sender_id: msg.sender_id,
          content: msg.content,
          message_type: msg.message_type || 'text',
          created_at: msg.created_at,
          is_read: msg.is_read || false,
          sender: msg.sender || {
            id: msg.sender_id,
            first_name: msg.sender?.first_name || 'Unknown',
            last_name: msg.sender?.last_name || 'User',
            avatar: msg.sender?.avatar || ''
          }
        }))
        .reverse() // Reverse to show oldest first, newest last

      // Update messages map
      setMessages(prev => {
        const conversationMessages = prev.get(conversationId) || []
        const updated = new Map(prev)
        
        if (append) {
          // Append older messages at the beginning
          updated.set(conversationId, [...transformedMessages, ...conversationMessages])
        } else {
          // Replace messages (initial load)
          updated.set(conversationId, transformedMessages)
        }
        
        console.log(`Loaded ${transformedMessages.length} messages for conversation ${conversationId} (append: ${append})`)
        return updated
      })

      // Update hasMoreMessages based on whether we got the full limit
      setHasMoreMessages(prev => {
        const updated = new Map(prev)
        updated.set(conversationId, transformedMessages.length === limit)
        return updated
      })

    } catch (err: any) {
      console.error('Failed to fetch conversation messages:', err)
      setError(err.message || 'Failed to fetch messages')
    } finally {
      setIsLoading(false)
      if (append) {
        setIsLoadingMore(prev => {
          const updated = new Map(prev)
          updated.set(conversationId, false)
          return updated
        })
      }
    }
  }, [])

  const loadMoreMessages = useCallback(async (conversationId: number, conversationType: 'private' | 'group', participantId?: number) => {
    const currentMessages = messages.get(conversationId) || []
    if (currentMessages.length === 0 || isLoadingMore.get(conversationId)) {
      return
    }

    try {
      setIsLoadingMore(prev => {
        const updated = new Map(prev)
        updated.set(conversationId, true)
        return updated
      })

      await fetchConversationMessages(conversationId, conversationType, participantId, 10, currentMessages.length, true)
    } catch (err) {
      console.error('Failed to load more messages:', err)
    }
  }, [messages, isLoadingMore, fetchConversationMessages])

  const sendMessage = useCallback(async (
    conversationId: number,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    recipientId?: number,
    groupId?: number
  ) => {
    if (!user || !isConnected) {
      throw new Error('User not authenticated or not connected')
    }

    try {
      // Create optimistic message
      const optimisticMessage: Message = {
        id: Date.now(),
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        message_type: messageType,
        created_at: new Date().toISOString(),
        is_read: false,
        sender: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar: user.avatar
        }
      }

      // Add optimistic message to local state
      setMessages(prev => {
        const conversationMessages = prev.get(conversationId) || []
        const updated = new Map(prev)
        updated.set(conversationId, [...conversationMessages, optimisticMessage])
        return updated
      })

      // Send via WebSocket
      const wsMessage: any = {
        type: groupId ? 'group_message' : 'private_message',
        content,
        message_type: messageType
      }

      if (groupId) {
        wsMessage.group_id = groupId
      } else if (recipientId) {
        wsMessage.to = recipientId
      }

      send(wsMessage)

      // Also send to backend API for persistence
      try {
        const apiData: any = {
          content,
          message_type: groupId ? 'group' : 'private'
        }

        if (groupId) {
          apiData.group_id = groupId
        } else if (recipientId) {
          apiData.receiver_id = recipientId
        }

        await api.sendMessage(apiData)
      } catch (apiError) {
        console.error('Failed to persist message to backend:', apiError)
        // Don't throw here as WebSocket might have succeeded
      }

    } catch (err: any) {
      console.error('Failed to send message:', err)
      // Remove optimistic message on error
      setMessages(prev => {
        const conversationMessages = prev.get(conversationId) || []
        const updated = new Map(prev)
        updated.set(conversationId, conversationMessages.filter(msg =>
          msg.id !== Date.now() // Remove the optimistic message
        ))
        return updated
      })
      throw err
    }
  }, [user, isConnected, send])

  const markAsRead = useCallback(async (conversationId: number) => {
    try {
      // Update local state immediately
      setUnreadCounts(prev => {
        const updated = new Map(prev)
        updated.set(conversationId, 0)
        return updated
      })

      setMessages(prev => {
        const conversationMessages = prev.get(conversationId) || []
        const updated = new Map(prev)
        updated.set(conversationId, conversationMessages.map(msg => ({ ...msg, is_read: true })))
        return updated
      })

      // TODO: Send read receipt to backend
      // await api.markMessagesAsRead(conversationId)

    } catch (err: any) {
      console.error('Failed to mark messages as read:', err)
    }
  }, [])

  const getConversationMessages = useCallback((conversationId: number): Message[] => {
    return messages.get(conversationId) || []
  }, [messages])

  const getUnreadCount = useCallback((conversationId?: number): number => {
    if (conversationId) {
      return unreadCounts.get(conversationId) || 0
    }
    // Return total unread count across all conversations
    return Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0)
  }, [unreadCounts])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Initial load
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  return {
    conversations,
    messages,
    unreadCounts,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    error,
    isConnected,
    messagesEndRef,
    sendMessage,
    markAsRead,
    getConversationMessages,
    getUnreadCount,
    scrollToBottom,
    refreshConversations: fetchConversations,
    fetchConversationMessages,
    loadMoreMessages
  }
}
