'use client'
import React, { useState, useEffect } from 'react'
import { User, MessageCircle } from 'lucide-react'
import { api, User as UserType } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus } from '@/hooks'
import FollowHandler, { FollowStatus, getFollowStatusFromAPI, useFollowStatus } from './FollowHandler'

interface UserWithFollowStatus extends UserType {
  followStatus: FollowStatus
  isOnline?: boolean
}

interface UsersSidebarProps {
  className?: string
  onUserClick?: (user: UserType) => void
}

export default function UsersSidebar({ className = '', onUserClick }: UsersSidebarProps) {
  const { user: currentUser } = useAuth()
  const { success, error, warning } = useToast()
  const { isConnected } = useConnectionStatus()
  
  const [users, setUsers] = useState<UserWithFollowStatus[]>([])
  const [following, setFollowing] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsersAndFollowing()
  }, [currentUser])

  const fetchUsersAndFollowing = async () => {
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
      
      // Create a set of following user IDs for quick lookup
      const followingIds = new Set(followingUsers.map(u => u.id))
      
      // Filter out current user and add follow status
      const usersWithStatus: UserWithFollowStatus[] = allUsers
        .filter((u: UserType) => u.id !== currentUser.id)
        .map((u: UserType) => ({
          ...u,
          followStatus: getFollowStatusFromAPI(followingIds.has(u.id)),
          isOnline: false // This would be populated from WebSocket data
        }))

      setUsers(usersWithStatus)
      setFollowing(followingUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
      error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollowStatusChange = (userId: number, newStatus: FollowStatus) => {
    // Update the user's follow status in the list
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, followStatus: newStatus }
        : u
    ))

    // Update following list based on new status
    if (newStatus.isFollowing) {
      // Add to following list if not already there
      setFollowing(prev => {
        const isAlreadyFollowing = prev.some(u => u.id === userId)
        if (isAlreadyFollowing) return prev
        
        const userToAdd = users.find(u => u.id === userId)
        return userToAdd ? [...prev, userToAdd] : prev
      })
    } else if (!newStatus.isPending) {
      // Remove from following list if unfollowed (not just pending)
      setFollowing(prev => prev.filter(u => u.id !== userId))
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Discover Users</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                <div className="space-y-1">
                  <div className="w-20 h-3 bg-white/20 rounded"></div>
                  <div className="w-16 h-2 bg-white/20 rounded"></div>
                </div>
              </div>
              <div className="w-16 h-6 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Discover Users</h3>
        <div className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>
      
      {!isConnected && (
        <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
          <p className="text-yellow-400 text-xs">You're offline. Follow actions are disabled.</p>
        </div>
      )}
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {users.length === 0 ? (
          <div className="text-center text-white/60 py-4">
            <p className="text-sm">No users to discover</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <div 
                className="flex items-center space-x-3 flex-1 cursor-pointer"
                onClick={() => onUserClick?.(user)}
              >
                <div className="relative">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {/* Online status indicator */}
                  {isConnected && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white/20 ${
                      user.isOnline ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-white text-sm font-medium truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    {user.is_private && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Private account"></div>
                    )}
                  </div>
                  <p className="text-white/60 text-xs truncate">
                    {user.nickname ? `@${user.nickname}` : user.email.split('@')[0]}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Message button - only show for following users */}
                {user.followStatus.isFollowing && (
                  <button
                    className="p-1 text-white/60 hover:text-white transition-colors"
                    title="Send message"
                    disabled={!isConnected}
                    onClick={() => {
                      // TODO: Implement messaging
                      warning('Messaging feature coming soon!')
                    }}
                  >
                    <MessageCircle className="w-3 h-3" />
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
      
      {/* Footer with stats */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex justify-between text-xs text-white/60">
          <span>Following: {following.length}</span>
          <span>Users: {users.length}</span>
        </div>
      </div>
    </div>
  )
}
