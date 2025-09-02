'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useAuth } from '@/context/AuthContext'

export interface TypingUser {
  user_id: number
  username: string
  timestamp: number
}

export interface TypingIndicatorOptions {
  timeout?: number // milliseconds before considering user stopped typing
  debounceMs?: number // debounce typing events
  maxDisplayUsers?: number // maximum number of typing users to display
}

export function useTypingIndicator(
  conversationId: number | string,
  conversationType: 'private' | 'group' = 'private',
  options: TypingIndicatorOptions = {}
) {
  const { user } = useAuth()
  const {
    timeout = 3000,
    debounceMs = 1000,
    maxDisplayUsers = 3
  } = options

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  
  const typingTimeout = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null)

  const { send, isConnected } = useWebSocketSubscription({
    messageTypes: ['typing'],
    onMessage: (message) => {
      if (message.type === 'typing' && message.data) {
        const { user_id, username, action } = message.data
        
        // Don't show own typing indicator
        if (user_id === user?.id) return

        // Check if this typing event is for our conversation
        const isRelevant = conversationType === 'private' 
          ? (message.to === user?.id && message.from === user_id) || 
            (message.from === user?.id && message.to === user_id)
          : message.group_id === conversationId

        if (!isRelevant) return

        const now = Date.now()
        
        if (action === 'start') {
          setTypingUsers(prev => {
            // Remove existing entry for this user
            const filtered = prev.filter(tu => tu.user_id !== user_id)
            // Add new entry
            return [
              ...filtered,
              { user_id, username: username || `User ${user_id}`, timestamp: now }
            ].slice(0, maxDisplayUsers) // Limit displayed users
          })
        } else if (action === 'stop') {
          setTypingUsers(prev => prev.filter(tu => tu.user_id !== user_id))
        }
      }
    }
  })

  // Clean up expired typing indicators
  const cleanupExpiredTyping = useCallback(() => {
    const now = Date.now()
    setTypingUsers(prev => prev.filter(tu => now - tu.timestamp < timeout))
  }, [timeout])

  // Setup cleanup interval
  useEffect(() => {
    cleanupInterval.current = setInterval(cleanupExpiredTyping, 1000)
    
    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current)
      }
    }
  }, [cleanupExpiredTyping])

  const startTyping = useCallback(() => {
    if (!isConnected || !user) return

    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current)
    }

    // Only send if not already typing
    if (!isTyping) {
      setIsTyping(true)
      
      const message: any = {
        type: 'typing' as const,
        data: {
          action: 'start',
          user_id: user.id,
          username: user.first_name + ' ' + user.last_name
        }
      }

      if (conversationType === 'private') {
        message.to = conversationId as number
      } else {
        message.group_id = conversationId as number
      }

      send(message)
    }

    // Set timeout to auto-stop typing
    typingTimeout.current = setTimeout(() => {
      stopTyping()
    }, timeout)
  }, [isConnected, user, isTyping, conversationId, conversationType, timeout, send])

  const stopTyping = useCallback(() => {
    if (!isConnected || !user || !isTyping) return

    setIsTyping(false)

    // Clear timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current)
      typingTimeout.current = null
    }

    const message: any = {
      type: 'typing' as const,
      data: {
        action: 'stop',
        user_id: user.id,
        username: user.first_name + ' ' + user.last_name
      }
    }

    if (conversationType === 'private') {
      message.to = conversationId as number
    } else {
      message.group_id = conversationId as number
    }

    send(message)
  }, [isConnected, user, isTyping, conversationId, conversationType, send])

  const handleTyping = useCallback(() => {
    // Debounce typing events
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      startTyping()
    }, debounceMs)
  }, [startTyping, debounceMs])

  // Cleanup on unmount or conversation change
  useEffect(() => {
    return () => {
      stopTyping()
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current)
      }
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [conversationId, stopTyping])

  const formatTypingText = useCallback(() => {
    if (typingUsers.length === 0) return ''
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing...`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
    } else {
      return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`
    }
  }, [typingUsers])

  return {
    typingUsers,
    isTyping,
    isConnected,
    hasTypingUsers: typingUsers.length > 0,
    typingText: formatTypingText(),
    startTyping: handleTyping,
    stopTyping
  }
}
