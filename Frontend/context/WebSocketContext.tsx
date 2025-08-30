'use client'
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

// WebSocket message types
export interface WebSocketMessage {
  type: 'private_message' | 'group_message' | 'notification' | 'user_status' | 'typing' | 
        'post_update' | 'comment_update' | 'like_update' | 'like' | 'follow_update' | 
        'group_update' | 'event_update' | 'category_update' | 'ping' | 'pong' | 'error'
  from?: number
  to?: number
  group_id?: number
  post_id?: number
  event_id?: number
  content?: string
  action?: string
  data?: any
  message_id?: string
  timestamp: number
}

export interface OnlineUser {
  user_id: number
  username: string
  is_online: boolean
}

interface WebSocketContextType {
  socket: WebSocket | null
  isConnected: boolean
  onlineUsers: OnlineUser[]
  sendMessage: (message: Omit<WebSocketMessage, 'timestamp'>) => void
  addMessageListener: (callback: (message: WebSocketMessage) => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const messageListeners = useRef<((message: WebSocketMessage) => void)[]>([])
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const pingInterval = useRef<NodeJS.Timeout | null>(null)
  const pongTimeout = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!isAuthenticated || !user || socket?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection skipped:', { isAuthenticated, user: !!user, socketState: socket?.readyState })
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      console.log('No token found in localStorage')
      return
    }

    console.log('Attempting WebSocket connection...', { userId: user.id, tokenLength: token.length })
    const wsUrl = `ws://localhost:8080/api/ws?token=${encodeURIComponent(token)}`
    console.log('WebSocket URL:', wsUrl.replace(/token=[^&]+/, 'token=***'))
    
    const newSocket = new WebSocket(wsUrl)

    newSocket.onopen = () => {
      console.log('WebSocket connected successfully')
      setIsConnected(true)
      reconnectAttempts.current = 0
      
      // Start heartbeat
      startPingInterval(newSocket)
      
      // Request initial online users list
      const message: Omit<WebSocketMessage, 'timestamp'> = {
        type: 'user_status',
        data: { action: 'get_online_users' }
      }
      newSocket.send(JSON.stringify({ ...message, timestamp: Date.now() }))
    }

    newSocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        
        // Handle different message types
        switch (message.type) {
          case 'user_status':
            if (message.data?.online_users) {
              setOnlineUsers(message.data.online_users)
            } else if (message.data?.user_id) {
              setOnlineUsers(prev => {
                const filtered = prev.filter(u => u.user_id !== message.data.user_id)
                if (message.data.status === 'online') {
                  return [...filtered, {
                    user_id: message.data.user_id,
                    username: message.data.username || `User ${message.data.user_id}`,
                    is_online: true
                  }]
                }
                return filtered
              })
            }
            break
          
          case 'ping':
            // Respond to ping with pong
            if (newSocket.readyState === WebSocket.OPEN) {
              newSocket.send(JSON.stringify({
                type: 'pong',
                timestamp: Date.now()
              }))
            }
            break
            
          case 'pong':
            // Clear pong timeout - connection is alive
            if (pongTimeout.current) {
              clearTimeout(pongTimeout.current)
              pongTimeout.current = null
            }
            break
            
          case 'post_update':
          case 'comment_update':
          case 'like_update':
          case 'like':
          case 'follow_update':
          case 'group_update':
          case 'event_update':
          case 'category_update':
            // Handle real-time updates - pass to listeners
            console.log(`Real-time ${message.type}:`, message)
            messageListeners.current.forEach(callback => callback(message))
            break
            
          case 'private_message':
          case 'group_message':
          case 'notification':
          case 'typing':
          default:
            // Notify all listeners
            messageListeners.current.forEach(callback => callback(message))
            break
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    newSocket.onclose = (event) => {
      console.log('WebSocket disconnected:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      })
      setIsConnected(false)
      setSocket(null)
      stopPingInterval()
      
      // Attempt reconnection if not a manual close
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && isAuthenticated) {
        reconnectAttempts.current++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
        
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current)
        }
        reconnectTimeout.current = setTimeout(() => {
          connect()
        }, delay)
      }
    }

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      console.log('WebSocket state:', newSocket.readyState)
      console.log('WebSocket URL:', wsUrl)
    }

    setSocket(newSocket)
  }, [isAuthenticated, user, socket?.readyState])

  const startPingInterval = (ws: WebSocket) => {
    // Clear existing intervals
    if (pingInterval.current) {
      clearInterval(pingInterval.current)
      pingInterval.current = null
    }
    if (pongTimeout.current) {
      clearTimeout(pongTimeout.current)
      pongTimeout.current = null
    }

    // Send ping every 30 seconds
    pingInterval.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }))

        // Set timeout for pong response (10 seconds)
        if (pongTimeout.current) {
          clearTimeout(pongTimeout.current)
        }
        pongTimeout.current = setTimeout(() => {
          console.log('No pong received, closing connection')
          ws.close()
        }, 10000)
      }
    }, 30000)
  }

  const stopPingInterval = () => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current)
      pingInterval.current = null
    }
    if (pongTimeout.current) {
      clearTimeout(pongTimeout.current)
      pongTimeout.current = null
    }
  }

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
    stopPingInterval()
    if (socket) {
      socket.close(1000, 'Manual disconnect')
    }
    setSocket(null)
    setIsConnected(false)
    setOnlineUsers([])
    reconnectAttempts.current = 0
  }, [socket])

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: Date.now()
      }
      socket.send(JSON.stringify(fullMessage))
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message)
    }
  }, [socket])

  const addMessageListener = useCallback((callback: (message: WebSocketMessage) => void) => {
    messageListeners.current.push(callback)
    
    // Return cleanup function
    return () => {
      messageListeners.current = messageListeners.current.filter(cb => cb !== callback)
    }
  }, [])

  // Connect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, user])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
        reconnectTimeout.current = null
      }
    }
  }, [])

  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    sendMessage,
    addMessageListener
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}