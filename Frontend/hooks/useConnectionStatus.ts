'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/context/WebSocketContext'

export interface ConnectionStatus {
  isOnline: boolean
  isConnected: boolean
  lastConnected: Date | null
  connectionAttempts: number
  connectionError: string | null
}

export function useConnectionStatus() {
  const { isConnected, socket } = useWebSocket()
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [lastConnected, setLastConnected] = useState<Date | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setConnectionError(null)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setConnectionError('No internet connection')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Monitor WebSocket connection status
  useEffect(() => {
    if (isConnected) {
      setLastConnected(new Date())
      setConnectionAttempts(0)
      setConnectionError(null)
    } else {
      setConnectionAttempts(prev => {
        const newAttempts = prev + 1
        // Set error if we're online and have connection attempts
        if (isOnline && newAttempts > 0) {
          setConnectionError('WebSocket connection lost')
        }
        return newAttempts
      })
    }
  }, [isConnected, isOnline])

  // Monitor socket state
  useEffect(() => {
    if (socket) {
      const handleError = () => {
        setConnectionError('WebSocket connection error')
      }

      socket.addEventListener('error', handleError)
      
      return () => {
        socket.removeEventListener('error', handleError)
      }
    }
  }, [socket])

  const getConnectionQuality = useCallback((): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!isOnline) return 'offline'
    if (!isConnected) return 'poor'
    if (connectionAttempts === 0) return 'excellent'
    if (connectionAttempts < 3) return 'good'
    return 'poor'
  }, [isOnline, isConnected, connectionAttempts])

  const getStatusMessage = useCallback((): string => {
    if (!isOnline) return 'Offline'
    if (!isConnected) return 'Disconnected'
    return 'Connected'
  }, [isOnline, isConnected])

  const status: ConnectionStatus = {
    isOnline,
    isConnected,
    lastConnected,
    connectionAttempts,
    connectionError
  }

  return {
    ...status,
    statusMessage: getStatusMessage()
  }
}
