'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type ConversationResponse } from '@/lib/api'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useAuth } from '@/context/AuthContext'
import { Message } from '@/types/hooks'

export function useRealTimeMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [messages, setMessages] = useState<Map<number, Message[]>>(new Map())
  const [unreadCounts, setUnreadCounts] = useState<Map<number, number>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState<Map<number, boolean>>(new Map())
  const [hasMoreMessages, setHasMoreMessages] = useState<Map<number, boolean>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const conversationIdCallbacks = useRef<Map<number, (newId: number) => void>>(new Map())

  const messagesEndRef = useRef<HTMLDivElement>(null)

  
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

  
  const { send, isConnected } = useWebSocketSubscription({
    messageTypes: ['private_message', 'group_message', 'message_deleted', 'shared_post', 'image_shared'],
    onMessage: (message) => {
      
      if (message.type === 'private_message' || message.type === 'group_message' || message.type === 'shared_post' || message.type === 'image_shared') {
        
        const conversationId = (message as any).data?.conversation_id || 0

        
        let createdAt = (message as any).data?.created_at || message.timestamp || '';
        const parsedDate = createdAt ? new Date(createdAt) : null;
        if (!parsedDate || isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0) {
          createdAt = new Date().toISOString();
        } else {
          createdAt = parsedDate.toISOString();
        }

        // Extract sender information from data.sender if available
        const senderData = (message as any).data?.sender || {}
        
        const newMessage: Message = {
          id: (message as any).data?.id || Date.now(), // Use real ID if available
          conversation_id: conversationId,
          sender_id: message.from || 0,
          content: message.content || '',
          message_type: (message as any).data?.message_type || 'text',
          created_at: createdAt,
          is_read: false,
          sender: {
            id: message.from || 0,
            first_name: senderData.first_name || 'Unknown',
            last_name: senderData.last_name || '',
            avatar: senderData.avatar || ''
          },
          shared_post: (message as any).data?.shared_post
        }


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
          } else if (!messageExists) {
            // Add new message - ensure no duplicates by checking again
            const finalMessages = [...conversationMessages]
            const duplicateIndex = finalMessages.findIndex(msg => msg.id === newMessage.id)
            if (duplicateIndex === -1) {
              updated.set(conversationId, [...finalMessages, newMessage])
            } else {
            }
          } else {
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
      } else if (message.type === 'message_deleted') {
        
        const deletedMessageId = Number((message as any).data?.message_id)
        const messageType = (message as any).data?.message_type || 'unknown'
        if (deletedMessageId && !isNaN(deletedMessageId)) {
          
          
          const deletedContent = messageType === 'private' ? 'XdeletedbyuserX' : 'This message was deleted'
          
          
          setMessages(prev => {
            const updated = new Map(prev)
            
            
            for (const [conversationId, conversationMessages] of prev.entries()) {
              const messageIndex = conversationMessages.findIndex(msg => Number(msg.id) === deletedMessageId)
              if (messageIndex !== -1) {
                const updatedMessages = [...conversationMessages]
                updatedMessages[messageIndex] = {
                  ...updatedMessages[messageIndex],
                  content: deletedContent
                }
                updated.set(conversationId, updatedMessages)
                break 
              }
            }
            
            return updated
          })
        } else {
          console.warn('Invalid message ID in deletion WebSocket message:', (message as any).data?.message_id)
        }
      }
    }
  })

  
  const getPrivateConversationId = useCallback((userId1: number, userId2: number): number => {
    return parseInt(`${Math.min(userId1, userId2)}${Math.max(userId1, userId2)}`)
  }, [])

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await api.getConversations()
      setConversations(response.conversations || [])

      
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

  const fetchConversationMessages = useCallback(async (conversationId: number, conversationType: 'private' | 'group', participantId?: number, limit: number = 20, offset: number = 0, append: boolean = false, groupId?: number) => {
    try {
      setIsLoading(true)
      setError(null)


      let response: { messages: any[]; count: number; limit: number; offset: number }

      
      if (conversationType === 'group') {
        
        
        try {
          // For groups, use groupId if provided, otherwise fallback to conversationId
          // This handles both new groups (using groupId) and existing conversations
          const idToUse = groupId || conversationId
          response = await api.getGroupMessages(idToUse, limit, offset)
        } catch (groupError: any) {
          console.warn('Failed to fetch group messages, user may not have access:', groupError.message)
          
          response = { messages: [], count: 0, limit, offset }
        }
      } else {
        // For private conversations, always use getConversationMessages
        try {
          response = await api.getConversationMessages(conversationId, limit, offset)
        } catch (convError: any) {
          console.warn('Failed to fetch conversation messages, user may not have access:', convError.message)
          
          response = { messages: [], count: 0, limit, offset }
        }
      }


      
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

  const loadMoreMessages = useCallback(async (conversationId: number, conversationType: 'private' | 'group', participantId?: number, groupId?: number) => {
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

      await fetchConversationMessages(conversationId, conversationType, participantId, 10, currentMessages.length, true, groupId)
    } catch (err) {
      console.error('Failed to load more messages:', err)
    }
  }, [fetchConversationMessages, messages, isLoadingMore])

  const registerConversationIdCallback = useCallback((placeholderId: number, callback: (newId: number) => void) => {
    conversationIdCallbacks.current.set(placeholderId, callback)
  }, [])

  const unregisterConversationIdCallback = useCallback((placeholderId: number) => {
    conversationIdCallbacks.current.delete(placeholderId)
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
      
      const optimisticId = Date.now() + Math.random()
      
      
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

      
      setMessages(prev => {
        const conversationMessages = prev.get(conversationId) || []
        const updated = new Map(prev)
        updated.set(conversationId, [...conversationMessages, optimisticMessage])
        return updated
      })

      
      const apiData: any = {
        content: messageType === 'image' ? '' : content, // Empty content for images
        message_type: groupId ? 'group' : 'private'
      }

      if (messageType === 'image') {
        apiData.image_url = content 
      }

      if (groupId) {
        apiData.group_id = groupId
      } else {
        let finalRecipientId = recipientId
        
        if (!finalRecipientId) {
          const conversationMessages = messages.get(conversationId) || []
          const otherParticipant = conversationMessages.find(msg => msg.sender_id !== user.id)
          if (otherParticipant) {
            finalRecipientId = otherParticipant.sender_id
          }
        }

        if (!finalRecipientId) {
          const conv = conversations.find(c => c.id === conversationId && c.type === 'private')
          if (conv && conv.participant && typeof conv.participant.id === 'number') {
            finalRecipientId = conv.participant.id
          }
        }

        if (!finalRecipientId && conversationId > 1000000) {
          console.error('Cannot determine receiver ID for placeholder conversation:', conversationId)
        }
        
        if (finalRecipientId) {
          apiData.receiver_id = finalRecipientId
        } else {
          console.error('Failed to determine receiver ID. conversationId:', conversationId, 'recipientId:', recipientId, 'messages:', messages.get(conversationId), 'conversations:', conversations)
          throw new Error('Receiver ID required for private messages')
        }
      }

      try {
        const apiResponse = await api.sendMessage(apiData)
        
        // Always refresh conversations to ensure they're up to date
        // This is especially important for new groups or first messages
        setTimeout(() => {
          fetchConversations()
        }, 100)
        
        if (apiResponse.conversation_id && apiResponse.conversation_id !== conversationId) {
          
          
          const callback = conversationIdCallbacks.current.get(conversationId)
          if (callback) {
            callback(apiResponse.conversation_id)
            
            conversationIdCallbacks.current.delete(conversationId)
          }

          
          setMessages(prev => {
            const conversationMessages = prev.get(conversationId) || []
            const updated = new Map(prev)
            const messageIndex = conversationMessages.findIndex(msg => msg.id === optimisticId)
            
            if (messageIndex !== -1) {
              const updatedMessage = {
                ...conversationMessages[messageIndex],
                conversation_id: apiResponse.conversation_id
              }
              
              
              const correctConversationMessages = updated.get(apiResponse.conversation_id) || []
              updated.set(apiResponse.conversation_id, [
                ...correctConversationMessages.filter(msg => msg.id !== optimisticId), 
                updatedMessage
              ])
              
              
              updated.set(conversationId, conversationMessages.filter(msg => msg.id !== optimisticId))
            }
            return updated
          })
        }
      } catch (apiError) {
        console.error('Failed to persist message to backend:', apiError)
        
      }

    } catch (err: any) {
      console.error('Failed to send message:', err)
      
      setMessages(prev => {
        const conversationMessages = prev.get(conversationId) || []
        const updated = new Map(prev)
        updated.set(conversationId, conversationMessages.filter(msg => {
          
          return msg.id < 1000000000000 
        }))
        return updated
      })
      throw err
    }
  }, [user, isConnected, messages, conversations, fetchConversations])

  const markAsRead = useCallback(async (conversationId: number) => {
    try {
      
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
    
    return Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0)
  }, [unreadCounts])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  
  

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
