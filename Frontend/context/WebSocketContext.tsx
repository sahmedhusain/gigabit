'use client'
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { WebSocketMessage, OnlineUser, WebSocketContextType, WebSocketProviderProps } from '@/types/contexts'

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
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
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    const wsUrl = `ws://localhost:8080/api/ws?token=${encodeURIComponent(token)}`
    
    const newSocket = new WebSocket(wsUrl)

    newSocket.onopen = () => {
      setIsConnected(true)
      reconnectAttempts.current = 0
      
      
      startPingInterval(newSocket)
      
      
      const message: Omit<WebSocketMessage, 'timestamp'> = {
        type: 'user_status',
        data: { action: 'get_online_users' }
      }
      newSocket.send(JSON.stringify({ ...message, timestamp: Date.now() }))
    }

    newSocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        
        
        switch (message.type) {
          case 'user_status':
            if (message.data?.online_users) {
              
              const usersWithStatus = message.data.online_users.map((user: any) => ({
                user_id: user.user_id,
                username: user.username || `User ${user.user_id}`,
                status: user.status || 'offline',
                last_status_change: user.last_status_change
              }))
              setOnlineUsers(usersWithStatus)
            } else if (message.data?.user_id) {
              
              setOnlineUsers(prev => {
                const filtered = prev.filter(u => u.user_id !== message.data.user_id)
                
                
                if (message.data.status === 'offline') {
                  return filtered
                }
                
                const newUser = {
                  user_id: message.data.user_id,
                  username: message.data.username || `User ${message.data.user_id}`,
                  status: message.data.status || 'offline',
                  last_status_change: message.data.last_status_change || new Date().toISOString()
                }
                return [...filtered, newUser]
              })
            }
            break
          
          case 'ping':
            
            if (newSocket.readyState === WebSocket.OPEN) {
              newSocket.send(JSON.stringify({
                type: 'pong',
                timestamp: Date.now()
              }))
            }
            break
            
          case 'pong':
            
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
          case 'poll_update':
          case 'poll_vote_update':
          case 'layout_sync':
            messageListeners.current.forEach(callback => callback(message))
            break
            
          case 'private_message':
          case 'group_message':
          case 'notification':
          case 'typing':
          case 'shared_post':
          case 'image_shared':
          case 'message_deleted':
          default:
            
            messageListeners.current.forEach(callback => callback(message))
            break
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    newSocket.onclose = (event) => {
      setIsConnected(false)
      setSocket(null)
      stopPingInterval()
      
      
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && isAuthenticated) {
        reconnectAttempts.current++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        
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
    }

    setSocket(newSocket)
  }, [isAuthenticated, user, socket?.readyState])

  const startPingInterval = (ws: WebSocket) => {
    
    if (pingInterval.current) {
      clearInterval(pingInterval.current)
      pingInterval.current = null
    }
    if (pongTimeout.current) {
      clearTimeout(pongTimeout.current)
      pongTimeout.current = null
    }

    
    pingInterval.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'ping',
          from: user?.id,
          timestamp: Date.now()
        }))

        
        if (pongTimeout.current) {
          clearTimeout(pongTimeout.current)
        }
        pongTimeout.current = setTimeout(() => {
          ws.close(1001, 'Ping timeout')
        }, 8000)
      }
    }, 25000)
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
    
    
    return () => {
      messageListeners.current = messageListeners.current.filter(cb => cb !== callback)
    }
  }, [])

  
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