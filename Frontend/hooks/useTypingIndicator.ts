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
  intervalMs?: number
  stopDelayMs?: number
  debounceMs?: number
  maxDisplayUsers?: number
  includeOwnTyping?: boolean
}

export function useTypingIndicator(
  conversationId: number | string,
  conversationType: 'private' | 'group' = 'private',
  options: TypingIndicatorOptions = {}
) {
  const { user } = useAuth()
  const {
    intervalMs = 5000, // Re-emit every 5 seconds
    stopDelayMs = 3000, // Stop 3 seconds after last keystroke
    debounceMs = 300,
    maxDisplayUsers = 3,
    includeOwnTyping = false // Default to false
  } = options

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  
  // Timers and intervals
  const lastKeystrokeRef = useRef<number>(0)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const stopTypingTimeout = useRef<NodeJS.Timeout | null>(null)
  const resendInterval = useRef<NodeJS.Timeout | null>(null)
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null)

  const { send, isConnected } = useWebSocketSubscription({
    messageTypes: ['typing'],
    onMessage: (message) => {
      console.log('🔤 Received message:', message)
      if (message.type === 'typing' && message.data) {
        const { user_id, username, action } = message.data
        
        // Filter out own typing indicator unless includeOwnTyping is true
        if (!includeOwnTyping && user_id === user?.id) return

        // Check if this typing event is for our conversation
        const isRelevant = conversationType === 'private' 
          ? (message.to === user?.id && message.from === user_id) || 
            (message.from === user?.id && message.to === user_id)
          : message.group_id === conversationId

        console.log('🔤 Typing relevance check:', { conversationType, conversationId, message, isRelevant, includeOwnTyping })

        if (!isRelevant) return

        const now = Date.now()
        
        if (action === 'start') {
          setTypingUsers(prev => {
            // Remove existing entry for this user and add/update it
            const filtered = prev.filter(tu => tu.user_id !== user_id)
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

  const cleanupStaleTyping = useCallback(() => {
    const now = Date.now()
    setTypingUsers(prev => {
      const updated = prev.filter(tu => now - tu.timestamp < stopDelayMs * 2)
      return updated
    })
  }, [stopDelayMs])

  // Setup cleanup interval to remove stale typing users
  useEffect(() => {
    cleanupInterval.current = setInterval(cleanupStaleTyping, 1000)
    
    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current)
      }
    }
  }, [cleanupStaleTyping])

  // Send typing start message
  const sendTypingStart = useCallback(() => {
    if (!isConnected || !user) return

    const message: any = {
      type: 'typing' as const,
      data: {
        action: 'start',
        user_id: user.id,
        username: user.first_name + ' ' + user.last_name
      }
    }

    if (conversationType === 'private') {
      message.from = user.id
      message.to = conversationId as number
    } else {
      message.group_id = conversationId as number
    }

    console.log('🔤 SENDING typing START:', { conversationType, conversationId, message })
    send(message)
  }, [isConnected, user, conversationId, conversationType, send])

  // Send typing stop message
  const sendTypingStop = useCallback(() => {
    if (!isConnected || !user) return

    const message: any = {
      type: 'typing' as const,
      data: {
        action: 'stop',
        user_id: user.id,
        username: user.first_name + ' ' + user.last_name
      }
    }

    if (conversationType === 'private') {
      message.from = user.id
      message.to = conversationId as number
    } else {
      message.group_id = conversationId as number
    }

    console.log('🔤 SENDING typing STOP:', { conversationType, conversationId, message })
    send(message)
  }, [isConnected, user, conversationId, conversationType, send])

  // Handle typing state transitions
  const handleTyping = useCallback(() => {
    if (!isConnected) return

    // Update last keystroke time
    lastKeystrokeRef.current = Date.now()

    // Clear existing debounce
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Clear existing stop timeout
    if (stopTypingTimeout.current) {
      clearTimeout(stopTypingTimeout.current)
    }

    // If not already typing, send start and setup interval
    if (!isTyping) {
      setIsTyping(true)
      sendTypingStart()

      // Setup interval to re-send typing every 5 seconds
      resendInterval.current = setInterval(() => {
        sendTypingStart()
      }, intervalMs)
    }

    // Setup timeout to stop typing 3 seconds after last keystroke
    stopTypingTimeout.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingStop()

      // Clear the re-send interval
      if (resendInterval.current) {
        clearInterval(resendInterval.current)
        resendInterval.current = null
      }
    }, stopDelayMs)
  }, [isConnected, isTyping, intervalMs, stopDelayMs, sendTypingStart, sendTypingStop])

  // Cleanup on unmount or conversation change
  useEffect(() => {
    return () => {
      // Clear all timers
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
      if (stopTypingTimeout.current) {
        clearTimeout(stopTypingTimeout.current)
      }
      if (resendInterval.current) {
        clearInterval(resendInterval.current)
      }
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current)
      }

      // Send stop if still typing
      if (isTyping) {
        sendTypingStop()
      }
    }
  }, [conversationId, isTyping, sendTypingStop])

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
    stopTyping: sendTypingStop
  }
}
