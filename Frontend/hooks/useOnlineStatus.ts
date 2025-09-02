'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWebSocket, type OnlineUser } from '@/context/WebSocketContext'
import { useAuth } from '@/context/AuthContext'

export interface UserStatus extends OnlineUser {
  lastSeen?: string
  status?: 'online' | 'offline' | 'away' | 'busy'
}

export function useOnlineStatus() {
  const { user } = useAuth()
  const { onlineUsers, isConnected, sendMessage } = useWebSocket()
  const [userStatuses, setUserStatuses] = useState<Map<number, UserStatus>>(new Map())

  // Update user statuses when onlineUsers changes
  useEffect(() => {
    const statusMap = new Map<number, UserStatus>()
    
    onlineUsers.forEach(onlineUser => {
      statusMap.set(onlineUser.user_id, {
        ...onlineUser,
        status: onlineUser.is_online ? 'online' : 'offline'
      })
    })
    
    setUserStatuses(statusMap)
  }, [onlineUsers])

  const isUserOnline = useCallback((userId: number): boolean => {
    const userStatus = userStatuses.get(userId)
    return userStatus?.is_online || false
  }, [userStatuses])

  const getUserStatus = useCallback((userId: number): UserStatus | null => {
    return userStatuses.get(userId) || null
  }, [userStatuses])

  const setStatus = useCallback((status: 'online' | 'away' | 'busy') => {
    if (!isConnected || !user) return

    sendMessage({
      type: 'user_status',
      data: {
        action: 'status_change',
        user_id: user.id,
        status
      }
    })
  }, [isConnected, user, sendMessage])

  const getOnlineCount = useCallback((): number => {
    return Array.from(userStatuses.values()).filter(status => status.is_online).length
  }, [userStatuses])

  const getOnlineUsers = useCallback((): UserStatus[] => {
    return Array.from(userStatuses.values()).filter(status => status.is_online)
  }, [userStatuses])

  const refreshOnlineUsers = useCallback(() => {
    if (!isConnected) return

    sendMessage({
      type: 'user_status',
      data: { action: 'get_online_users' }
    })
  }, [isConnected, sendMessage])

  return {
    onlineUsers: getOnlineUsers(),
    onlineCount: getOnlineCount(),
    isConnected,
    isUserOnline,
    getUserStatus,
    setStatus,
    refreshOnlineUsers
  }
}
