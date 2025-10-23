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
    }
    like_count: number
    comment_count: number
    share_count: number
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
  const [conversationIdCallbacks, setConversationIdCallbacks] = useState<Map<number, (newId: number) => void>>(new Map())

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Helper function to deduplicate messages by ID
  const deduplicateMessages = (messages: Message[]): Message[] => {
    const seen = new Set<number>()
    return messages.filter(msg => {
      if (seen.has(msg.id)) {
        return false
      }
      seen.add(msg.id)
      return true
    })
  }

  // WebSocket subscription for real-time message updates
  const { send, isConnected } = useWebSocketSubscription({
    messageTypes: ['private_message', 'group_message'],
    onMessage: (message) => {
      console.log('WebSocket message received:', message)

      if (message.type === 'private_message' || message.type === 'group_message') {
        // Get conversation ID from message data
        const conversationId = (message as any).data?.conversation_id || 0

        // Always sanitize created_at to a valid ISO string
        let createdAt = (message as any).data?.created_at || message.timestamp || '';
        let parsedDate = createdAt ? new Date(createdAt) : null;
        if (!parsedDate || isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0) {
          createdAt = new Date().toISOString();
        } else {
          createdAt = parsedDate.toISOString();
        }

        const newMessage: Message = {
          id: (message as any).data?.id || Date.now(), // Use real ID if available
          conversation_id: conversationId,
          sender_id: message.from || 0,
          content: message.content || '',
          message_type: 'text',
          created_at: createdAt,
          is_read: false,
          sender: {
            id: message.from || 0,
            first_name: (message as any).sender_name || 'Unknown',
            last_name: '',
            avatar: (message as any).sender_avatar || ''
          },
          shared_post: (message as any).data?.shared_post
        }

        console.log('Processing WebSocket message:', { message, conversationId, newMessage })

        // Add message to conversation (append to end for newest messages at bottom)
        setMessages(prev => {
          const conversationMessages = prev.get(conversationId) || []
          const updated = new Map(prev)

          // More comprehensive duplicate check
          let messageExists = false
          let optimisticMessageIndex = -1

          // Check for exact ID match (for real messages with server IDs)
          if (newMessage.id && newMessage.id < 1000000000000) {
            messageExists = conversationMessages.some(msg => msg.id === newMessage.id)
          }

          // If no exact ID match and message is from current user, look for optimistic message to replace
          if (!messageExists && newMessage.sender_id === user?.id) {
            optimisticMessageIndex = conversationMessages.findIndex(msg => {
              // Check if this is an optimistic message (high ID) with same content/sender
              return msg.id >= 1000000000000 &&
                     msg.content === newMessage.content &&
                     msg.sender_id === newMessage.sender_id &&
                     Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 30000 // Within 30 seconds
            })
          }

          if (optimisticMessageIndex !== -1) {
            // Replace optimistic message with real message
            const updatedMessages = [...conversationMessages]
            updatedMessages[optimisticMessageIndex] = newMessage
            updated.set(conversationId, updatedMessages)
            console.log(`🔄 Replaced optimistic message in conversation ${conversationId}:`, newMessage.content.substring(0, 50))
          } else if (!messageExists) {
            // Add new message - ensure no duplicates by checking again
            const finalMessages = [...conversationMessages]
            const duplicateIndex = finalMessages.findIndex(msg => msg.id === newMessage.id)
            if (duplicateIndex === -1) {
              updated.set(conversationId, [...finalMessages, newMessage])
              console.log(`✅ Added new message to conversation ${conversationId}:`, newMessage.content.substring(0, 50))
            } else {
              console.log(`⛔ Duplicate message prevented (final check) for conversation ${conversationId}:`, newMessage.content.substring(0, 50))
            }
          } else {
            console.log(`⛔ Duplicate message prevented for conversation ${conversationId}:`, newMessage.content.substring(0, 50))
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

      // Fallback: if group chat and conversationId is a raw groupId (no conversation yet), use group endpoint
      if (conversationType === 'group' && participantId === undefined) {
        // participantId is not used for group, so we can use it as a signal
        // If conversationId matches a groupId (i.e., no conversation yet), use group endpoint
        try {
          response = await api.getGroupMessages(conversationId, limit, offset)
        } catch (groupError: any) {
          console.warn('Failed to fetch group messages, user may not have access:', groupError.message)
          // Return empty response instead of throwing
          response = { messages: [], count: 0, limit, offset }
        }
      } else {
        response = await api.getConversationMessages(conversationId, limit, offset)
      }

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
          },
          shared_post: msg.shared_post
        }))
        .reverse() // Reverse to show oldest first, newest last

      // Filter out any duplicates in the transformed messages themselves
      const uniqueTransformedMessages = transformedMessages.filter((msg, index, self) =>
        index === self.findIndex(m => m.id === msg.id)
      )

      // Update messages map
      setMessages(prev => {
        const conversationMessages = prev.get(conversationId) || []
        const updated = new Map(prev)

        if (append) {
          // Create a set of existing message IDs to avoid duplicates
          const existingIds = new Set(conversationMessages.map(msg => msg.id))
          // Filter out messages that already exist
          const newMessages = uniqueTransformedMessages.filter(msg => !existingIds.has(msg.id))
          // Append older messages at the beginning
          updated.set(conversationId, [...newMessages, ...conversationMessages])
        } else {
          // Replace messages (initial load) - still filter duplicates just in case
          updated.set(conversationId, uniqueTransformedMessages)
        }

        console.log(`Loaded ${uniqueTransformedMessages.length} unique messages for conversation ${conversationId} (append: ${append})`)
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

  const registerConversationIdCallback = useCallback((placeholderId: number, callback: (newId: number) => void) => {
    setConversationIdCallbacks(prev => {
      const updated = new Map(prev)
      updated.set(placeholderId, callback)
      return updated
    })
  }, [])

  const unregisterConversationIdCallback = useCallback((placeholderId: number) => {
    setConversationIdCallbacks(prev => {
      const updated = new Map(prev)
      updated.delete(placeholderId)
      return updated
    })
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
      // Generate unique optimistic message ID
      const optimisticId = Date.now() + Math.random()
      
      // Create optimistic message
      const optimisticMessage: Message = {
        id: optimisticId,
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

      // Send to backend API - the backend will handle WebSocket broadcast
      const apiData: any = {
        content,
        message_type: groupId ? 'group' : 'private'
      }

      if (groupId) {
        apiData.group_id = groupId
      } else if (recipientId) {
        apiData.receiver_id = recipientId
      }

      try {
        const apiResponse = await api.sendMessage(apiData)
        
        // If this is a new conversation, update the conversation ID
        if (apiResponse.conversation_id && apiResponse.conversation_id !== conversationId) {
          console.log(`Conversation ID updated from ${conversationId} to ${apiResponse.conversation_id}`)
          
          // Notify any registered callback about the conversation ID change
          const callback = conversationIdCallbacks.get(conversationId)
          if (callback) {
            callback(apiResponse.conversation_id)
            // Clean up the callback
            setConversationIdCallbacks(prev => {
              const updated = new Map(prev)
              updated.delete(conversationId)
              return updated
            })
          }

          // Update the optimistic message with correct conversation ID and move it
          setMessages(prev => {
            const conversationMessages = prev.get(conversationId) || []
            const updated = new Map(prev)
            const messageIndex = conversationMessages.findIndex(msg => msg.id === optimisticId)
            
            if (messageIndex !== -1) {
              const updatedMessage = {
                ...conversationMessages[messageIndex],
                conversation_id: apiResponse.conversation_id
              }
              
              // Move message to correct conversation
              const correctConversationMessages = updated.get(apiResponse.conversation_id) || []
              updated.set(apiResponse.conversation_id, [
                ...correctConversationMessages.filter(msg => msg.id !== optimisticId), 
                updatedMessage
              ])
              
              // Remove from old conversation
              updated.set(conversationId, conversationMessages.filter(msg => msg.id !== optimisticId))
            }
            return updated
          })

          // Refresh conversations to get the new conversation in the list
          setTimeout(() => {
            fetchConversations()
          }, 100)
        }
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
        updated.set(conversationId, conversationMessages.filter(msg => {
          // Remove messages with high ID (optimistic messages use Date.now())
          return msg.id < 1000000000000 
        }))
        return updated
      })
      throw err
    }
  }, [user, isConnected, conversationIdCallbacks, fetchConversations])

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

  // Note: Scroll management is now handled by individual components (ChatWindow)
  // to provide better control over when to scroll (e.g., not when loading historical messages)

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
    loadMoreMessages,
    registerConversationIdCallback,
    unregisterConversationIdCallback
  }
}
