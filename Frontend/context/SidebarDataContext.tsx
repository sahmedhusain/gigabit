'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useWebSocket } from './WebSocketContext'
import { api } from '@/lib/api'

interface SidebarData {
  followers: { id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]
  following: { id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]
  chats: any[]
  groups: any[]
  isLoadingChats: boolean
  isLoadingGroups: boolean
  refetchFollowers: () => void
  refetchChats: () => void
  refetchGroups: () => void
}

const SidebarDataContext = createContext<SidebarData | undefined>(undefined)

export function SidebarDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { isConnected, onlineUsers, addMessageListener } = useWebSocket()

  // Data state
  const [followers, setFollowers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [following, setFollowing] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)

  // Data loaded flags to prevent re-fetching
  const [followersLoaded, setFollowersLoaded] = useState(false)
  const [chatsLoaded, setChatsLoaded] = useState(false)
  const [groupsLoaded, setGroupsLoaded] = useState(false)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  }

  const fetchFollowers = async () => {
    if (!user) return

    try {
      const [followersData, followingData] = await Promise.all([
        api.getFollowers(user.id),
        api.getFollowing(user.id)
      ])

      setFollowers(Array.isArray(followersData?.followers) ? followersData.followers : [])
      setFollowing(Array.isArray(followingData?.following) ? followingData.following : [])
      setFollowersLoaded(true)
    } catch (err) {
      console.error('Error fetching followers:', err)
    }
  }

  const fetchConversations = async () => {
    try {
      setIsLoadingChats(true)
      const data = await api.getConversations()
      setChats(data.conversations.map(conversation => {
        const participantName = conversation.type === 'private'
          ? `${conversation.participant?.first_name || ''} ${conversation.participant?.last_name || ''}`.trim() || 'Unknown User'
          : conversation.group?.title || 'Unknown Group'

        const onlineUser = conversation.type === 'private' && conversation.participant?.id
          ? onlineUsers.find(u => u.user_id === conversation.participant?.id)
          : null
        const status = onlineUser ? onlineUser.status : 'offline'

        return {
          id: conversation.id,
          name: participantName,
          lastMessage: conversation.last_message.content,
          time: formatTimeAgo(conversation.updated_at),
          timestamp: conversation.updated_at,
          unread: conversation.unread_count,
          status: status,
          isGroup: conversation.type === 'group',
          participantId: conversation.participant?.id,
          participantAvatar: conversation.participant?.avatar,
          lastMessageSenderId: conversation.last_message.sender_id
        }
      }))
      setChatsLoaded(true)
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setIsLoadingChats(false)
    }
  }

  const fetchGroups = async () => {
    try {
      setIsLoadingGroups(true)
      const data = await api.getUserGroups(user?.id || 0)
      const dataAny: any = data
      const groupsArr = Array.isArray(dataAny?.groups) ? dataAny.groups : Array.isArray(dataAny?.data) ? dataAny.data : []
      setGroups(groupsArr.map((group: any) => ({
        id: group.id,
        name: group.title ?? group.name ?? '',
        description: group.description ?? '',
        members: group.member_count ?? 0,
        isJoined: !!group.is_member,
        lastActivity: formatTimeAgo(group.updated_at ?? group.updatedAt ?? new Date().toISOString()),
        timestamp: group.updated_at ?? group.updatedAt ?? new Date().toISOString()
      })))
      setGroupsLoaded(true)
    } catch (err) {
      console.error('Error fetching groups:', err)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      if (!followersLoaded) {
        fetchFollowers()
      }
      if (!chatsLoaded) {
        fetchConversations()
      }
      if (!groupsLoaded) {
        fetchGroups()
      }
    } else {
      // Reset data when user logs out
      setFollowers([])
      setFollowing([])
      setChats([])
      setGroups([])
      setFollowersLoaded(false)
      setChatsLoaded(false)
      setGroupsLoaded(false)
    }
  }, [user])

  // WebSocket real-time updates
  useEffect(() => {
    if (!isConnected || !user) return

    const removeListener = addMessageListener((message) => {
      switch (message.type) {
        case 'notification':
          console.log('New notification received:', message.data)
          break
        case 'follow_update':
        case 'follow':
        case 'unfollow':
        case 'follow_request':
        case 'cancel_follow_request':
        case 'follower_count_update':
          console.log('Follow update received:', message.data)
          fetchFollowers()
          break
        case 'private_message':
        case 'group_message':
          console.log('Chat message received:', message.data)
          fetchConversations()
          break
        case 'group_update':
          console.log('Group update received:', message.data)
          fetchGroups()
          break
        default:
          console.log('Received WebSocket message:', message)
      }
    })

    return removeListener
  }, [isConnected, addMessageListener, user])

  const value: SidebarData = {
    followers,
    following,
    chats,
    groups,
    isLoadingChats,
    isLoadingGroups,
    refetchFollowers: fetchFollowers,
    refetchChats: fetchConversations,
    refetchGroups: fetchGroups
  }

  return (
    <SidebarDataContext.Provider value={value}>
      {children}
    </SidebarDataContext.Provider>
  )
}

export function useSidebarData() {
  const context = useContext(SidebarDataContext)
  if (context === undefined) {
    throw new Error('useSidebarData must be used within a SidebarDataProvider')
  }
  return context
}