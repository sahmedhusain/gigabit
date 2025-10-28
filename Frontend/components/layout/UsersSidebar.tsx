'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { User, MessageCircle } from 'lucide-react'
import { api, User as UserType } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus } from '@/hooks'
import { useWebSocket } from '@/context/WebSocketContext'
import FollowHandler, { getFollowStatusFromAPI } from '../profile/FollowHandler'
import Image from 'next/image'
import { UserWithFollowStatus, UsersSidebarProps, FollowStatus } from '@/types/sidebar'

export default function UsersSidebar({ className = '', onUserClick }: UsersSidebarProps) {
  const { user: currentUser } = useAuth()
  const { error, warning } = useToast()
  const { isConnected } = useConnectionStatus()
  const { onlineUsers, addMessageListener } = useWebSocket()
  
  const [users, setUsers] = useState<UserWithFollowStatus[]>([])
  const [following, setFollowing] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsersAndFollowing = useCallback(async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      
      // Fetch all users and current user's following list in parallel
      const [usersResponse, followingResponse] = await Promise.all([
        api.getUsers(),
        api.getFollowing(currentUser.id)
      ])

      const allUsers = usersResponse.users || []
      const followingUsers = followingResponse.following || []
      
      
      const followingIds = new Set(followingUsers.map((u: UserType) => u.id))
      
      
      const usersWithStatus: UserWithFollowStatus[] = allUsers
        .filter((u: UserType) => u.id !== currentUser.id)
        .map((u: UserType) => {
          
          const onlineUser = onlineUsers.find(ou => ou.user_id === u.id)
          const status = onlineUser ? onlineUser.status : 'offline'
          
          return {
            ...u,
            followStatus: getFollowStatusFromAPI(followingIds.has(u.id)),
            status: status as 'online' | 'busy' | 'away' | 'invisible' | 'offline',
            lastStatusChange: onlineUser?.last_status_change
          }
        })

      setUsers(usersWithStatus)
      setFollowing(followingUsers)
    } catch (err: unknown) {
      console.error('Error fetching users:', err)
      const msg = err instanceof Error ? err.message : String(err)
      error(msg || 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, onlineUsers, error])

  useEffect(() => {
    void fetchUsersAndFollowing()
  }, [fetchUsersAndFollowing])

  
  useEffect(() => {
    const cleanup = addMessageListener((message) => {
      if (message.type === 'user_status' && message.data?.user_id) {
        setUsers(prev => prev.map(u => 
          u.id === message.data.user_id 
            ? { 
                ...u, 
                status: message.data.status || 'offline',
                lastStatusChange: message.data.last_status_change
              }
            : u
        ))
      }
    })

    return cleanup
  }, [addMessageListener])

  
  useEffect(() => {
    setUsers(prev => prev.map(u => {
      const onlineUser = onlineUsers.find(ou => ou.user_id === u.id)
      return onlineUser 
        ? { 
            ...u, 
            status: onlineUser.status,
            lastStatusChange: onlineUser.last_status_change
          }
        : { ...u, status: 'offline' as const }
    }))
  }, [onlineUsers])



  const handleFollowStatusChange = (userId: number, newStatus: FollowStatus) => {
    
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, followStatus: newStatus }
        : u
    ))

    
    if (newStatus.isFollowing) {
      
      setFollowing(prev => {
        const isAlreadyFollowing = prev.some(u => u.id === userId)
        if (isAlreadyFollowing) return prev
        
        const userToAdd = users.find(u => u.id === userId)
        return userToAdd ? [...prev, userToAdd] : prev
      })
    } else if (!newStatus.isPending) {
      
      setFollowing(prev => prev.filter(u => u.id !== userId))
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Discover Users</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-white/20 rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-20 h-3 bg-white/20 rounded"></div>
                  <div className="w-16 h-2 bg-white/20 rounded"></div>
                </div>
              </div>
              <div className="w-16 h-7 bg-white/20 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {!className?.includes('border-none') && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base mb-4 flex items-center">
            <span className="text-lg mr-2.5">👥</span>
            Discover Users
          </h3>
          <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
      )}
      
      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-xl">
          <p className="text-yellow-400 text-sm">You are offline. Follow actions are disabled.</p>
        </div>
      )}
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {users.length === 0 ? (
          <div className="text-center text-white/60 py-6">
            <p className="text-sm">No users to discover</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group">
              <div 
                className="flex items-center space-x-3 flex-1 cursor-pointer"
                onClick={() => onUserClick?.(user)}
              >
                <div className="relative flex-shrink-0">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={`${user.first_name} ${user.last_name}`}
                      width={36}
                      height={36}
                      unoptimized={user.avatar.includes('/svg')}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white/20 group-hover:border-white/40 transition-colors"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center border-2 border-white/20 group-hover:border-white/40 transition-colors">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {/* Status indicator */}
                  {isConnected && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white/20 ${
                      user.status === 'online' ? 'bg-green-500' :
                      user.status === 'busy' ? 'bg-red-500' :
                      user.status === 'away' ? 'bg-yellow-500' :
                      user.status === 'invisible' ? 'bg-gray-500' :
                      'bg-gray-400' // offline
                    }`}></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <p className="text-white text-sm font-semibold truncate group-hover:text-blue-200 transition-colors">
                      {user.first_name} {user.last_name}
                    </p>
                    {user.is_private && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" title="Private account"></div>
                    )}
                  </div>
                  <p className="text-white/70 text-xs truncate">
                    {user.nickname ? `@${user.nickname}` : `@${user.email.split('@')[0]}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Message button - only show for following users */}
                {user.followStatus.isFollowing && (
                  <button
                    className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    title="Send message"
                    disabled={!isConnected}
                    onClick={() => {
                      
                      warning('Messaging feature coming soon!')
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                )}
                
                {/* Follow/Unfollow button using FollowHandler */}
                <FollowHandler
                  targetUser={user}
                  currentFollowStatus={user.followStatus}
                  onStatusChange={(newStatus) => handleFollowStatusChange(user.id, newStatus)}
                  disabled={!isConnected}
                  size="sm"
                />
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer with stats - only show if not using custom className */}
      {!className?.includes('border-none') && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex justify-between text-xs text-white/60">
            <span className="font-medium">Following: {following.length}</span>
            <span className="font-medium">Users: {users.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
