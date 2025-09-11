'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useAuth } from '@/context/AuthContext'

interface FollowerCounts {
  followers_count: number
  following_count: number
}

export function useFollowerCounts(initialFollowersCount = 0, initialFollowingCount = 0) {
  const { user } = useAuth()
  const [followerCounts, setFollowerCounts] = useState<FollowerCounts>({
    followers_count: initialFollowersCount,
    following_count: initialFollowingCount
  })

  // WebSocket subscription for real-time follower count updates
  const { isConnected } = useWebSocketSubscription({
    messageTypes: ['follower_count_update'],
    onMessage: (message) => {
      if (message.type === 'follower_count_update' && message.data) {
        const data = message.data

        // Check if the update is for the current user
        const userKey = `user_${user?.id}`
        if (data[userKey]) {
          const userCounts = data[userKey]
          setFollowerCounts({
            followers_count: userCounts.followers_count || 0,
            following_count: userCounts.following_count || 0
          })
        }

        // Also check if the data directly contains user_id for current user
        if (data.user_id === user?.id) {
          setFollowerCounts({
            followers_count: data.followers_count || 0,
            following_count: data.following_count || 0
          })
        }
      }
    }
  })

  // Update local state when initial values change
  useEffect(() => {
    setFollowerCounts({
      followers_count: initialFollowersCount,
      following_count: initialFollowingCount
    })
  }, [initialFollowersCount, initialFollowingCount])

  const updateCounts = useCallback((newFollowersCount: number, newFollowingCount: number) => {
    setFollowerCounts({
      followers_count: newFollowersCount,
      following_count: newFollowingCount
    })
  }, [])

  return {
    followerCounts,
    isConnected,
    updateCounts
  }
}
