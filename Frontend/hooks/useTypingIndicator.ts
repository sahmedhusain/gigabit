'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useAuth } from '@/context/AuthContext'
import { TypingUser, TypingIndicatorOptions } from '@/types/hooks'

export function useTypingIndicator(
  conversationId: number | string,
  conversationType: 'private' | 'group' = 'private',
  options: TypingIndicatorOptions = {}
) {
  const { user } = useAuth()
  const {
    intervalMs = 5000, 
    stopDelayMs = 3000, 
    debounceMs = 300,
    maxDisplayUsers = 3,
    includeOwnTyping = false 
  } = options

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  
  
  const lastKeystrokeRef = useRef<number>(0)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const stopTypingTimeout = useRef<NodeJS.Timeout | null>(null)
  const resendInterval = useRef<NodeJS.Timeout | null>(null)
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null)

  const { send, isConnected } = useWebSocketSubscription({
    messageTypes: ['typing'],
    onMessage: (message) => {
      if (message.type === 'typing' && message.data) {
        const { user_id, username, action } = message.data
        
        
        if (!includeOwnTyping && user_id === user?.id) return

        
        const isRelevant = conversationType === 'private' 
          ? (message.to === user?.id && message.from === user_id) || 
            (message.from === user?.id && message.to === user_id)
          : message.group_id === conversationId

        if (!isRelevant) return

        const now = Date.now()
        
        if (action === 'start') {
          setTypingUsers(prev => {
            
            const filtered = prev.filter(tu => tu.user_id !== user_id)
            return [
              ...filtered,
              { user_id, username: username || `User ${user_id}`, timestamp: now }
            ].slice(0, maxDisplayUsers) 
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

  
  useEffect(() => {
    cleanupInterval.current = setInterval(cleanupStaleTyping, 1000)
    
    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current)
      }
    }
  }, [cleanupStaleTyping])

  
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

    send(message)
  }, [isConnected, user, conversationId, conversationType, send])

  
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

    send(message)
  }, [isConnected, user, conversationId, conversationType, send])

  
  const handleTyping = useCallback(() => {
    if (!isConnected) return

    
    lastKeystrokeRef.current = Date.now()

    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    
    if (stopTypingTimeout.current) {
      clearTimeout(stopTypingTimeout.current)
    }

    
    if (!isTyping) {
      setIsTyping(true)
      sendTypingStart()

      
      resendInterval.current = setInterval(() => {
        sendTypingStart()
      }, intervalMs)
    }

    
    stopTypingTimeout.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingStop()

      
      if (resendInterval.current) {
        clearInterval(resendInterval.current)
        resendInterval.current = null
      }
    }, stopDelayMs)
  }, [isConnected, isTyping, intervalMs, stopDelayMs, sendTypingStart, sendTypingStop])

  
  useEffect(() => {
    return () => {
      
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
