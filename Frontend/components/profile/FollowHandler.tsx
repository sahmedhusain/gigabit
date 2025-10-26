'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { UserPlus, UserMinus, X } from 'lucide-react'
import { useWebSocket, WebSocketMessage } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { User } from '@/lib/api'

export interface FollowStatus {
  isFollowing: boolean
  isPending: boolean
  isFollowedBy: boolean  // Whether the target user is following the current user
  status: 'not_following' | 'pending' | 'following' | 'follow_back'
}

interface FollowHandlerProps {
  targetUser: User
  currentFollowStatus: FollowStatus
  onStatusChange: (newStatus: FollowStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  confirmUnfollow?: boolean
  onUnfollowConfirm?: (userId: number, userName: string) => void
  fullWidth?: boolean
}

export default function FollowHandler({
  targetUser,
  currentFollowStatus,
  onStatusChange,
  disabled = false,
  size = 'md',
  confirmUnfollow = false,
  onUnfollowConfirm,
  fullWidth = false
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
          isFollowedBy: data.is_followed_by || false,
          status: data.is_followed_by ? 'follow_back' : 'following'
        }
        setLocalStatus(newFollowingStatus)
        onStatusChange(newFollowingStatus)
        // Only show success message if this wasn't a status check
        if (message.action !== 'status') {
          success(data.message || `Now following ${data.user_name}`)
        }
        break

      case 'pending':
        const newPendingStatus: FollowStatus = {
          isFollowing: false,
          isPending: true,
          isFollowedBy: data.is_followed_by || false,
          status: 'pending'
        }
        setLocalStatus(newPendingStatus)
        onStatusChange(newPendingStatus)
        // Only show success message if this wasn't a status check
        if (message.action !== 'status') {
          success(data.message || `Follow request sent to ${data.user_name}`)
        }
        break

      case 'not_following':
        const newNotFollowingStatus: FollowStatus = {
          isFollowing: false,
          isPending: false,
          isFollowedBy: data.is_followed_by || false,
          status: data.is_followed_by ? 'follow_back' : 'not_following'
        }
        setLocalStatus(newNotFollowingStatus)
        onStatusChange(newNotFollowingStatus)
        // Only show success message if this wasn't a status check
        if (message.action !== 'status') {
          success(data.message || `Unfollowed ${data.user_name}`)
        }
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
      // Check if this is an unfollow action that requires confirmation
      if (confirmUnfollow && localStatus.isFollowing && onUnfollowConfirm) {
        setIsLoading(false) // Reset loading state since we're not proceeding with the action
        onUnfollowConfirm(targetUser.id, `${targetUser.first_name} ${targetUser.last_name}`)
        return
      }

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
    error,
    confirmUnfollow,
    onUnfollowConfirm
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
          <span>Requested</span>
        </div>
      )
    }

    if (localStatus.status === 'follow_back') {
      return (
        <div className="flex items-center">
          <UserPlus className="w-3 h-3 mr-1" />
          <span>Follow Back</span>
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
    const baseStyle = `${fullWidth ? 'w-full ' : ''}flex items-center justify-center transition-all duration-200 font-semibold rounded-xl `
    
    let sizeStyle = ""
    switch (size) {
      case 'sm':
        sizeStyle = "px-4 py-2.5 text-xs "
        break
      case 'lg':
        sizeStyle = "px-6 py-3 text-base "
        break
      default:
        sizeStyle = "px-6 py-3 text-sm "
    }

    if (isLoading || disabled || !isConnected) {
      return baseStyle + sizeStyle + "bg-white/20 text-gray-400 border-gray-400/30 cursor-not-allowed"
    }

    if (localStatus.isFollowing) {
      return baseStyle + sizeStyle + "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/25"
    }

    if (localStatus.isPending) {
      return baseStyle + sizeStyle + "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg shadow-yellow-500/25"
    }

    return baseStyle + sizeStyle + "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
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

    if (localStatus.status === 'follow_back') {
      return 'Follow back'
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
  followStatus?: string,
  isFollowedBy: boolean = false
): FollowStatus {
  if (isFollowing) {
    return {
      isFollowing: true,
      isPending: false,
      isFollowedBy: isFollowedBy,
      status: isFollowedBy ? 'follow_back' : 'following'
    }
  }

  if (followStatus === 'pending') {
    return {
      isFollowing: false,
      isPending: true,
      isFollowedBy: isFollowedBy,
      status: 'pending'
    }
  }

  return {
    isFollowing: false,
    isPending: false,
    isFollowedBy: isFollowedBy,
    status: isFollowedBy ? 'follow_back' : 'not_following'
  }
}



