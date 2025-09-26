'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { UserPlus, UserMinus, X } from 'lucide-react'
import { useWebSocket, WebSocketMessage } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { User } from '@/lib/api'

export interface FollowStatus {
  isFollowing: boolean
  isPending: boolean
  status: 'not_following' | 'pending' | 'following'
}

interface FollowHandlerProps {
  targetUser: User
  currentFollowStatus: FollowStatus
  onStatusChange: (newStatus: FollowStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function FollowHandler({
  targetUser,
  currentFollowStatus,
  onStatusChange,
  disabled = false,
  size = 'md'
}: FollowHandlerProps) {
  const { sendMessage, addMessageListener, isConnected } = useWebSocket()
  const { success, error, warning } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState<FollowStatus>(currentFollowStatus)

  useEffect(() => {
    setLocalStatus(currentFollowStatus)
  }, [currentFollowStatus])

  const handleFollowUpdateMessage = useCallback((message: WebSocketMessage) => {
    const data = message.data
    if (!data) return

    setIsLoading(false)

    switch (data.status) {
      case 'following':
        const newFollowingStatus: FollowStatus = {
          isFollowing: true,
          isPending: false,
          status: 'following'
        }
        setLocalStatus(newFollowingStatus)
        onStatusChange(newFollowingStatus)
        success(data.message || `Now following ${data.user_name}`)
        break

      case 'pending':
        const newPendingStatus: FollowStatus = {
          isFollowing: false,
          isPending: true,
          status: 'pending'
        }
        setLocalStatus(newPendingStatus)
        onStatusChange(newPendingStatus)
        success(data.message || `Follow request sent to ${data.user_name}`)
        break

      case 'not_following':
        const newNotFollowingStatus: FollowStatus = {
          isFollowing: false,
          isPending: false,
          status: 'not_following'
        }
        setLocalStatus(newNotFollowingStatus)
        onStatusChange(newNotFollowingStatus)
        success(data.message || `Unfollowed ${data.user_name}`)
        break

      default:
        console.warn('Unknown follow status:', data.status)
    }
  }, [onStatusChange, success])

  // Listen for WebSocket follow update messages
  useEffect(() => {
    const removeListener = addMessageListener((message: WebSocketMessage) => {
      if (message.type === 'follow_update' && message.data?.user_id === targetUser.id) {
        handleFollowUpdateMessage(message)
      } else if (message.type === 'error' && isLoading) {
        // Handle error messages when we're waiting for a follow response
        setIsLoading(false)
        error(message.content || 'An error occurred')
      }
    })

    return removeListener
  }, [addMessageListener, targetUser.id, isLoading, error, handleFollowUpdateMessage])

  const handleFollowAction = useCallback(async () => {
    if (!isConnected || disabled || isLoading) {
      if (!isConnected) {
        warning('You need to be online to follow users')
      }
      return
    }

    setIsLoading(true)

    try {
      let messageType: WebSocketMessage['type']
      let action: string

      if (localStatus.isFollowing) {
        // User is currently following, so unfollow
        messageType = 'unfollow'
        action = 'unfollow'
      } else if (localStatus.isPending) {
        // User has pending request, so cancel it
        messageType = 'cancel_follow_request'
        action = 'cancel_request'
      } else {
        // User is not following, determine if it's public or private
        if (targetUser.is_private) {
          messageType = 'follow_request'
          action = 'request'
        } else {
          messageType = 'follow'
          action = 'follow'
        }
      }

      const message: Omit<WebSocketMessage, 'timestamp'> = {
        type: messageType,
        to: targetUser.id,
        action: action,
        data: {
          user_id: targetUser.id,
          user_name: `${targetUser.first_name} ${targetUser.last_name}`,
          is_private: targetUser.is_private
        }
      }

      sendMessage(message)

      // Set a timeout in case we don't receive a response
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false)
          error('Request timed out. Please try again.')
        }
      }, 10000) // 10 second timeout

    } catch (err) {
      setIsLoading(false)
      error('Failed to send follow request')
      console.error('Follow action error:', err)
    }
  }, [
    isConnected,
    disabled,
    isLoading,
    localStatus,
    targetUser,
    sendMessage,
    warning,
    error
  ])

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
          <span>Loading...</span>
        </div>
      )
    }

    if (localStatus.isFollowing) {
      return (
        <div className="flex items-center">
          <UserMinus className="w-3 h-3 mr-1" />
          <span>Unfollow</span>
        </div>
      )
    }

    if (localStatus.isPending) {
      return (
        <div className="flex items-center">
          <X className="w-3 h-3 mr-1" />
          <span>Cancel Request</span>
        </div>
      )
    }

    return (
      <div className="flex items-center">
        <UserPlus className="w-3 h-3 mr-1" />
        <span>Follow</span>
      </div>
    )
  }

  const getButtonStyle = () => {
    const baseStyle = "transition-all duration-200 font-medium rounded-lg border "
    
    let sizeStyle = ""
    switch (size) {
      case 'sm':
        sizeStyle = "px-2 py-1 text-xs "
        break
      case 'lg':
        sizeStyle = "px-4 py-2 text-base "
        break
      default:
        sizeStyle = "px-3 py-1.5 text-sm "
    }

    if (isLoading || disabled || !isConnected) {
      return baseStyle + sizeStyle + "bg-gray-500/20 text-gray-400 border-gray-400/30 cursor-not-allowed"
    }

    if (localStatus.isFollowing) {
      return baseStyle + sizeStyle + "bg-red-500/20 text-red-400 border-red-400/30 hover:bg-red-500/30 hover:text-red-300"
    }

    if (localStatus.isPending) {
      return baseStyle + sizeStyle + "bg-yellow-500/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-500/30 hover:text-yellow-300"
    }

    return baseStyle + sizeStyle + "bg-emerald-500/20 text-emerald-400 border-emerald-400/30 hover:bg-emerald-500/30 hover:text-emerald-300"
  }

  const getButtonTitle = () => {
    if (!isConnected) {
      return 'You need to be online to follow users'
    }
    
    if (disabled) {
      return 'Follow action disabled'
    }

    if (isLoading) {
      return 'Processing...'
    }

    if (localStatus.isFollowing) {
      return 'Unfollow user'
    }

    if (localStatus.isPending) {
      return 'Cancel follow request'
    }

    if (targetUser.is_private) {
      return 'Send follow request (private account)'
    }

    return 'Follow user'
  }

  return (
    <button
      onClick={handleFollowAction}
      disabled={isLoading || disabled || !isConnected}
      className={getButtonStyle()}
      title={getButtonTitle()}
    >
      {getButtonContent()}
    </button>
  )
}

// Helper hook for managing follow status
export function useFollowStatus(initialStatus: FollowStatus) {
  const [status, setStatus] = useState<FollowStatus>(initialStatus)

  const updateStatus = useCallback((newStatus: FollowStatus) => {
    setStatus(newStatus)
  }, [])

  return {
    status,
    updateStatus
  }
}

// Helper function to determine follow status from API data
export function getFollowStatusFromAPI(
  isFollowing: boolean,
  followStatus?: string
): FollowStatus {
  if (isFollowing) {
    return {
      isFollowing: true,
      isPending: false,
      status: 'following'
    }
  }

  if (followStatus === 'pending') {
    return {
      isFollowing: false,
      isPending: true,
      status: 'pending'
    }
  }

  return {
    isFollowing: false,
    isPending: false,
    status: 'not_following'
  }
}



