'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWebSocket, type OnlineUser } from '@/context/WebSocketContext'
import { useAuth } from '@/context/AuthContext'
import { api, AuthenticationError } from '@/lib/api'

export interface UserStatus extends OnlineUser {
  lastSeen?: string
}

export interface DatabaseUserStatus {
  user_id: number
  status: 'online' | 'away' | 'busy' | 'invisible' | 'offline'
  last_status_change: string
  is_online: boolean
}

export function useOnlineStatus() {
  const { user, isAuthenticated } = useAuth()
  const { onlineUsers, isConnected, sendMessage } = useWebSocket()
  const [userStatuses, setUserStatuses] = useState<Map<number, UserStatus>>(new Map())
  const [myStatus, setMyStatus] = useState<DatabaseUserStatus | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Fetch user's own status from the database
  const fetchMyStatus = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setMyStatus(null)
      return
    }

    try {
      const statusData = await api.getMyStatus()
      setMyStatus({
        user_id: statusData.user_id,
        status: statusData.status as 'online' | 'away' | 'busy' | 'invisible' | 'offline',
        last_status_change: statusData.last_status_change,
        is_online: statusData.is_online
      })
      setSessionExpired(false)
    } catch (error) {
      console.error('Failed to fetch user status:', error)
      // If API call fails, likely session expired
      if (error instanceof AuthenticationError) {
        setSessionExpired(true)
        setMyStatus(null)
      }
    }
  }, [isAuthenticated, user])

  // Update user statuses when onlineUsers changes or when session state changes
  useEffect(() => {
    const statusMap = new Map<number, UserStatus>()
    
    onlineUsers.forEach(onlineUser => {
      statusMap.set(onlineUser.user_id, {
        ...onlineUser,
        lastSeen: onlineUser.status !== 'online' ? onlineUser.last_status_change : undefined
      })
    })

    // Handle user's own status display based on session and database state
    if (user) {
      if (sessionExpired) {
        // If session expired, show user as offline regardless of database status
        statusMap.set(user.id, {
          user_id: user.id,
          username: `${user.first_name} ${user.last_name}`,
          status: 'offline',
          last_status_change: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        })
      } else if (myStatus) {
        // If authenticated and we have database status, use it (unless invisible)
        const displayStatus = myStatus.status === 'invisible' ? 'offline' : myStatus.status
        statusMap.set(user.id, {
          user_id: user.id,
          username: `${user.first_name} ${user.last_name}`,
          status: displayStatus as 'online' | 'away' | 'busy' | 'offline',
          last_status_change: myStatus.last_status_change,
          lastSeen: displayStatus !== 'online' ? myStatus.last_status_change : undefined
        })
      }
    }
    
    setUserStatuses(statusMap)
  }, [onlineUsers, user, sessionExpired, myStatus])

  // Fetch user status on component mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyStatus()
    } else {
      setMyStatus(null)
      setSessionExpired(false)
    }
  }, [isAuthenticated, fetchMyStatus])

  // Also fetch status when WebSocket connects to ensure we have latest database state
  useEffect(() => {
    if (isConnected && isAuthenticated) {
      // Small delay to ensure WebSocket connection is fully established
      const timer = setTimeout(() => {
        fetchMyStatus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isConnected, isAuthenticated, fetchMyStatus])

  const isUserOnline = useCallback((userId: number): boolean => {
    const userStatus = userStatuses.get(userId)
    return userStatus?.status === 'online' || false
  }, [userStatuses])

  const getUserStatus = useCallback((userId: number): UserStatus | null => {
    return userStatuses.get(userId) || null
  }, [userStatuses])

  const setStatus = useCallback(async (status: 'online' | 'away' | 'busy' | 'invisible') => {
    if (!user) return

    try {
      // Update status via REST API first
      await api.updateMyStatus(status)
      
      // Also send via WebSocket if connected (except for invisible status)
      if (isConnected && status !== 'invisible') {
        sendMessage({
          type: 'user_status',
          data: {
            action: 'status_change',
            user_id: user.id,
            status
          }
        })
      }
      
      // Refresh user's own status from database
      await fetchMyStatus()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }, [isConnected, user, sendMessage, fetchMyStatus])

  const getOnlineCount = useCallback((): number => {
    return Array.from(userStatuses.values()).filter(status => status.status === 'online').length
  }, [userStatuses])

  const getOnlineUsers = useCallback((): UserStatus[] => {
    return Array.from(userStatuses.values()).filter(status => status.status === 'online')
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
    refreshOnlineUsers,
    myStatus,
    sessionExpired,
    fetchMyStatus
  }
}
