'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { UserPlus, UserMinus, X } from 'lucide-react'
import { useWebSocket } from '@/context/WebSocketContext'
import { WebSocketMessage } from '@/types/contexts'
import { useToast } from '@/context/ToastContext'
import { FollowStatus, FollowHandlerProps } from '@/types/profile'

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLocalStatus(currentFollowStatus)
  }, [currentFollowStatus])

  const handleFollowUpdateMessage = useCallback((message: WebSocketMessage) => {
    const data = message.data
    if (!data) return

    // Clear timeout since we got a response
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

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
        
        if (message.action !== 'status') {
          success('Following!')
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
        
        if (message.action !== 'status') {
          success('Request sent!')
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
        
        if (message.action !== 'status') {
          success('Unfollowed!')
        }
        break

      default:
        console.warn('Unknown follow status:', data.status)
    }
  }, [onStatusChange, success])

  
  useEffect(() => {
    const removeListener = addMessageListener((message: WebSocketMessage) => {
      if (message.type === 'follow_update' && message.data?.user_id === targetUser.id) {
        handleFollowUpdateMessage(message)
      } else if (message.type === 'error' && isLoading) {
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        setIsLoading(false)
        error(message.content || 'An error occurred')
      }
    })

    return removeListener
  }, [addMessageListener, targetUser.id, isLoading, error, handleFollowUpdateMessage])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleFollowAction = useCallback(async () => {
    if (!isConnected || disabled || isLoading) {
      if (!isConnected) {
        warning('You need to be online to follow users')
      }
      return
    }

    setIsLoading(true)

    try {
      
      if (confirmUnfollow && localStatus.isFollowing && onUnfollowConfirm) {
        setIsLoading(false) 
        onUnfollowConfirm(targetUser.id, `${targetUser.first_name} ${targetUser.last_name}`)
        return
      }

      let messageType: WebSocketMessage['type']
      let action: string

      if (localStatus.isFollowing) {
        
        messageType = 'unfollow'
        action = 'unfollow'
      } else if (localStatus.isPending) {
        
        messageType = 'cancel_follow_request'
        action = 'cancel_request'
      } else {
        
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

      // Set timeout to handle cases where WebSocket response never comes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false)
        error('Request timed out. Please check your connection and try again.')
        timeoutRef.current = null
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



