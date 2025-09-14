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
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // WebSocket subscription for real-time message updates
  const { send, isConnected } = useWebSocketSubscription({
    messageTypes: ['private_message', 'group_message'],
    onMessage: (message) => {
      if (message.type === 'private_message' || message.type === 'group_message') {
        // Determine conversation ID based on message type
        let conversationId: number

        if (message.type === 'group_message') {
          conversationId = message.group_id || 0
        } else {
          // For private messages, generate conversation ID from sender and receiver
          conversationId = getPrivateConversationId(message.from || 0, user?.id || 0)
        }

        const newMessage: Message = {
          id: Date.now(), // Temporary ID - should be replaced with real ID from server
          conversation_id: conversationId,
          sender_id: message.from || 0,
          content: message.content || '',
          message_type: 'text',
          created_at: new Date(message.timestamp).toISOString(),
          is_read: false,
          sender: {
            id: message.from || 0,
            first_name: 'Unknown',
            last_name: 'User',
            avatar: ''
          }
        }

        console.log('Received WebSocket message:', { message, conversationId })

        // Add message to conversation
        setMessages(prev => {
          const conversationMessages = prev.get(conversationId) || []
          const updated = new Map(prev)
          updated.set(conversationId, [...conversationMessages, newMessage])
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

        // Update conversation last message
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                last_message: {
                  content: newMessage.content,
                  created_at: newMessage.created_at,
                  sender_id: newMessage.sender_id,
                  sender: {
                    id: newMessage.sender.id,
                    email: '', // We don't have this info in WebSocket
                    first_name: newMessage.sender.first_name,
                    last_name: newMessage.sender.last_name,
                    date_of_birth: '', // We don't have this info in WebSocket
                    avatar: newMessage.sender.avatar,
                    nickname: '', // We don't have this info in WebSocket
                    about_me: '', // We don't have this info in WebSocket
                    is_private: false, // Default value
                    created_at: '', // We don't have this info in WebSocket
                    updated_at: '' // We don't have this info in WebSocket
                  }
                },
                unread_count: message.from !== user?.id ? conv.unread_count + 1 : conv.unread_count
              }
            : conv
        ))
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

  const fetchConversationMessages = useCallback(async (conversationId: number, conversationType: 'private' | 'group', participantId?: number) => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Fetching messages for:', { conversationId, conversationType, participantId })

      let response: { messages: any[]; count: number; limit: number; offset: number }

      // Try to get messages by conversation ID first (works for both private and group)
      try {
        console.log('Trying to fetch messages by conversation ID:', conversationId)
        response = await api.getConversationMessages(conversationId)
      } catch (convError) {
        console.log('Conversation ID endpoint failed, trying type-specific endpoints')
        // Fallback to type-specific endpoints
        if (conversationType === 'group') {
          response = await api.getGroupMessages(conversationId)
        } else if (participantId) {
          response = await api.getPrivateMessages(participantId)
        } else {
          throw new Error('Cannot fetch private messages: no participant ID')
        }
      }

      console.log('API response:', response)

      // Transform API messages to our Message format
      const transformedMessages: Message[] = response.messages.map(msg => ({
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

      // Update messages map
      setMessages(prev => {
        const updated = new Map(prev)
        updated.set(conversationId, transformedMessages)
        console.log(`Loaded ${transformedMessages.length} messages for conversation ${conversationId}`)
        return updated
      })

    } catch (err: any) {
      console.error('Failed to fetch conversation messages:', err)
      setError(err.message || 'Failed to fetch messages')
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    error,
    isConnected,
    messagesEndRef,
    sendMessage,
    markAsRead,
    getConversationMessages,
    getUnreadCount,
    scrollToBottom,
    refreshConversations: fetchConversations,
    fetchConversationMessages
  }
}
