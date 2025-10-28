'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useWebSocket } from '@/context/WebSocketContext'
import { WebSocketMessage } from '@/types/contexts'
import { SubscriptionOptions } from '@/types/hooks'

export function useWebSocketSubscription(options: SubscriptionOptions = {}) {
  const { addMessageListener, isConnected, sendMessage } = useWebSocket()
  const { onMessage, messageTypes = [], debounceMs = 0, autoReconnect = true } = options
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastMessage = useRef<WebSocketMessage | null>(null)

  const debouncedHandler = useCallback((message: WebSocketMessage) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      lastMessage.current = message
      onMessage?.(message)
    }, debounceMs)
  }, [onMessage, debounceMs])

  const messageHandler = useCallback((message: WebSocketMessage) => {
    
    if (messageTypes.length > 0 && !messageTypes.includes(message.type)) {
      return
    }

    if (debounceMs > 0) {
      debouncedHandler(message)
    } else {
      lastMessage.current = message
      onMessage?.(message)
    }
  }, [onMessage, messageTypes, debounceMs, debouncedHandler])

  useEffect(() => {
    const unsubscribe = addMessageListener(messageHandler)
    
    return () => {
      unsubscribe()
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [addMessageListener, messageHandler])

  const send = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    sendMessage(message)
  }, [sendMessage])

  return {
    isConnected,
    send,
    lastMessage: lastMessage.current
  }
}
