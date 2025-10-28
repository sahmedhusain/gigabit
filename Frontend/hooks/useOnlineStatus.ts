'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/context/WebSocketContext'
import { useAuth } from '@/context/AuthContext'
import { api, AuthenticationError } from '@/lib/api'
import { OnlineUser } from '@/types/contexts'
import { UserStatus, DatabaseUserStatus } from '@/types/hooks'

export function useOnlineStatus() {
  const { user, isAuthenticated } = useAuth()
  const { onlineUsers, isConnected, sendMessage } = useWebSocket()
  const [userStatuses, setUserStatuses] = useState<Map<number, UserStatus>>(new Map())
  const [myStatus, setMyStatus] = useState<DatabaseUserStatus | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  
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
      
      if (error instanceof AuthenticationError) {
        setSessionExpired(true)
        setMyStatus(null)
      }
    }
  }, [isAuthenticated, user])

  
  useEffect(() => {
    const statusMap = new Map<number, UserStatus>()
    
    onlineUsers.forEach(onlineUser => {
      statusMap.set(onlineUser.user_id, {
        ...onlineUser,
        lastSeen: onlineUser.status !== 'online' ? onlineUser.last_status_change : undefined
      } as UserStatus)
    })

    
    if (user) {
      if (sessionExpired) {
        
        statusMap.set(user.id, {
          user_id: user.id,
          username: `${user.first_name} ${user.last_name}`,
          status: 'offline',
          last_status_change: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        } as UserStatus)
      } else if (myStatus) {
        
        const displayStatus = myStatus.status === 'invisible' ? 'offline' : myStatus.status
        statusMap.set(user.id, {
          user_id: user.id,
          username: `${user.first_name} ${user.last_name}`,
          status: displayStatus as 'online' | 'away' | 'busy' | 'offline',
          last_status_change: myStatus.last_status_change,
          lastSeen: displayStatus !== 'online' ? myStatus.last_status_change : undefined
        } as UserStatus)
      }
    }
    
    setUserStatuses(statusMap)
  }, [onlineUsers, user, sessionExpired, myStatus])

  
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyStatus()
    } else {
      setMyStatus(null)
      setSessionExpired(false)
    }
  }, [isAuthenticated, fetchMyStatus])

  
  useEffect(() => {
    if (isConnected && isAuthenticated) {
      
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
      
      await api.updateMyStatus(status)
      
      
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
