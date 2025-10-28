'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type GroupResponse, type CreateGroupRequest } from '@/lib/api'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export function useRealTimeGroups() {
  const { user } = useAuth()
  const { error, success } = useToast()
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [unreadUpdates, setUnreadUpdates] = useState<Map<number, number>>(new Map())
  const lastFetchTime = useRef<number>(Date.now())

  const { performUpdate: optimisticUpdate } = useOptimisticUpdate(groups, {
    onError: (error, rollbackData) => {
      console.error('Groups optimistic update failed:', error)
      if (rollbackData) {
        setGroups(rollbackData)
      }
    }
  })

  
  const { isConnected } = useWebSocketSubscription({
    messageTypes: ['group_update'],
    onMessage: (message) => {
      const now = Date.now()
      
      if (message.type === 'group_update' && message.data) {
        const { action, group_id, group, user_id } = message.data

        switch (action) {
          case 'created':
            if (group) {
              setGroups(prev => [group, ...prev])
              
            }
            break

          case 'updated':
            if (group_id) {
              setGroups(prev => prev.map(g => 
                g.id === group_id 
                  ? { ...g, ...message.data.updates }
                  : g
              ))
              setUnreadUpdates(prev => {
                const updated = new Map(prev)
                if (message.data.updates?.creator_id !== user?.id) {
                  updated.set(group_id, (updated.get(group_id) || 0) + 1)
                }
                return updated
              })
            }
            break

          case 'member_joined':
            if (group_id && user_id) {
              setGroups(prev => prev.map(g => 
                g.id === group_id 
                  ? { 
                      ...g, 
                      member_count: g.member_count + 1,
                      is_member: user_id === user?.id ? true : g.is_member
                    }
                  : g
              ))
              
              if (user_id === user?.id) {
                success(`You joined the group`)
              } else if (now > lastFetchTime.current) {
                setUnreadUpdates(prev => {
                  const updated = new Map(prev)
                  updated.set(group_id, (updated.get(group_id) || 0) + 1)
                  return updated
                })
              }
            }
            break

          case 'member_left':
            if (group_id && user_id) {
              setGroups(prev => prev.map(g => 
                g.id === group_id 
                  ? { 
                      ...g, 
                      member_count: Math.max(0, g.member_count - 1),
                      is_member: user_id === user?.id ? false : g.is_member
                    }
                  : g
              ))

              if (user_id === user?.id) {
                success(`You left the group`)
              }
            }
            break

          case 'deleted':
            if (group_id) {
              setGroups(prev => prev.filter(g => g.id !== group_id))
              success(`A group was deleted`)
            }
            break

          case 'new_post':
            if (group_id && user_id !== user?.id && now > lastFetchTime.current) {
              setUnreadUpdates(prev => {
                const updated = new Map(prev)
                updated.set(group_id, (updated.get(group_id) || 0) + 1)
                return updated
              })
            }
            break
        }
      }
    }
  })

  const fetchGroups = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setErr(null)
      
      const res = await api.getUserGroups(user.id)
      const groupsData = Array.isArray(res?.groups) ? res.groups : []
      
      setGroups(groupsData)
      lastFetchTime.current = Date.now()
      setUnreadUpdates(new Map()) 
      
    } catch (e: any) {
      const msg = e?.message || 'Failed to load groups'
      setErr(msg)
      error('Failed to load groups.')
    } finally {
      setIsLoading(false)
    }
  }, [user, error])

  const createGroup = useCallback(async (payload: CreateGroupRequest) => {
    try {
      return await optimisticUpdate(
        (currentGroups) => {
          
          const optimisticGroup: GroupResponse = {
            id: Date.now(), 
            title: payload.title,
            description: payload.description || '',
            privacy: payload.privacy,
            create_posts: payload.create_posts,
            create_polls: payload.create_polls,
            create_events: payload.create_events,
            send_messages: payload.send_messages,
            creator_id: user?.id || 0,
            member_count: 1,
            is_member: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          return [optimisticGroup, ...(currentGroups || [])]
        },
        async () => {
          const res = await api.createGroup(payload)
          success('Group created')
          await fetchGroups() 
          return res
        }
      )
    } catch (err: any) {
      console.error('Failed to create group:', err)
      throw err
    }
  }, [optimisticUpdate, user, success, fetchGroups])

  const joinGroup = useCallback(async (groupId: number) => {
    try {
      return await optimisticUpdate(
        (currentGroups) => (currentGroups || []).map(group => 
          group.id === groupId
            ? { 
                ...group, 
                is_member: true,
                member_count: group.member_count + 1
              }
            : group
        ),
        async () => {
          await api.joinGroup(groupId)
          success('Join request sent')
          return { success: true }
        }
      )
    } catch (err: any) {
      console.error('Failed to join group:', err)
      throw err
    }
  }, [optimisticUpdate, success])

  const leaveGroup = useCallback(async (groupId: number) => {
    try {
      return await optimisticUpdate(
        (currentGroups) => (currentGroups || []).map(group => 
          group.id === groupId
            ? { 
                ...group, 
                is_member: false,
                member_count: Math.max(0, group.member_count - 1)
              }
            : group
        ),
        async () => {
          await api.leaveGroup(groupId)
          success('Left group')
          return { success: true }
        }
      )
    } catch (err: any) {
      console.error('Failed to leave group:', err)
      throw err
    }
  }, [optimisticUpdate, success])

  const getGroup = useCallback(async (groupId: number) => {
    try {
      return await api.getGroup(groupId)
    } catch (err: any) {
      console.error('Failed to get group:', err)
      throw err
    }
  }, [])

  const markGroupAsRead = useCallback((groupId: number) => {
    setUnreadUpdates(prev => {
      const updated = new Map(prev)
      updated.delete(groupId)
      return updated
    })
  }, [])

  const getUnreadCount = useCallback((groupId?: number): number => {
    if (groupId) {
      return unreadUpdates.get(groupId) || 0
    }
    
    return Array.from(unreadUpdates.values()).reduce((sum, count) => sum + count, 0)
  }, [unreadUpdates])

  
  useEffect(() => {
    if (user) {
      fetchGroups()
    }
  }, [fetchGroups, user])

  return {
    groups,
    loading: isLoading,
    error: err,
    unreadUpdates,
    isConnected,
    refetch: fetchGroups,
    create: createGroup,
    join: joinGroup,
    leave: leaveGroup,
    getGroup,
    markGroupAsRead,
    getUnreadCount
  }
}
