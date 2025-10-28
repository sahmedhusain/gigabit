'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ChatWindow from '@/components/chat/window/ChatWindow'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useNotifications, useConversations } from '@/hooks'
import {
  api,
  Group,
  Chat,
  NetworkError,
  ConversationResponse
} from '@/lib/api'


import AppLayout from '@/components/layout/AppLayout'


import ChatsSection from '@/components/chat/ChatsSection'
import CreateGroup from '@/components/groups/CreateGroup'
import CreateDirectMessage from '@/components/chat/CreateDirectMessage'

function ChatsFilterPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const filter = (params as { filter: string }).filter
  const { user } = useAuth()
  const { isConnected, onlineUsers } = useWebSocket()
  const { success, error } = useToast()
  const { items: _liveNotifications, unread: _liveUnreadCount } = useNotifications()
  const { conversations: _liveConversations } = useConversations()

  
  const chatId = searchParams?.get('chat')
  const groupId = searchParams?.get('group')
  const userParam = searchParams?.get('user')
  const highlightMessageParam = searchParams?.get('message')
  const tabParam = searchParams?.get('tab')
  const highlightPollParam = searchParams?.get('highlight')

  const [chatSubTab, setChatSubTab] = useState(filter === 'groups' ? 'group' : filter || 'all')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateDirectMessage, setShowCreateDirectMessage] = useState(false)

  
  const [chats, setChats] = useState<Chat[]>([])
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [_groups, setGroups] = useState<Group[]>([])
  const [_isLoadingChats, setIsLoadingChats] = useState(false)
  const [_isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [following, setFollowing] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)

  
  const [openChatWindow, setOpenChatWindow] = useState<{
    conversationId: number
    type: 'private' | 'group',
    name: string
    participantId?: number
    groupId?: number
    isGroupMember?: boolean
    userRole?: 'creator' | 'admin' | 'member'
    initialTab?: string
    highlightMessageId?: number
    highlightPollId?: number
  } | null>(null)

  
  const _currentUser = user ? {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    username: user.nickname || user.email.split('@')[0],
    avatar: user.avatar,
    isPrivate: user.is_private,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    dateOfBirth: user.date_of_birth,
    nickname: user.nickname,
    aboutMe: user.about_me,
    memberSince: user.created_at,
    followers: 0,
    following: 0
  } : null

  
  const _trendingTopics = [
    '#SocialNetwork', '#TechNews', '#WebDev', '#AI', '#Startups',
    '#React', '#TypeScript', '#NodeJS', '#Python', '#DevOps'
  ]

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

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingChats(true)
      const data = await api.getConversations()
      const conversationsData = data.conversations || []
      setConversations(conversationsData)

      const convsRaw: unknown[] = conversationsData as unknown[]

      setChats(convsRaw.map((convRaw) => {
        const conv = convRaw as Record<string, unknown>
        const type = String(conv['type'] ?? '')
        const participant = conv['participant'] as Record<string, unknown> | undefined
        const group = conv['group'] as Record<string, unknown> | undefined
        const last_message = conv['last_message'] as Record<string, unknown> | undefined
        const id = Number(conv['id'] ?? 0)
        const participantId = participant?.['id'] ? Number(participant['id']) : undefined

        const participantName = type === 'private'
          ? `${String(participant?.['first_name'] ?? '')} ${String(participant?.['last_name'] ?? '')}`.trim() || 'Unknown User'
          : String(group?.['title'] ?? group?.['name'] ?? 'Unknown Group')

        const isOnline = type === 'private' && participantId
          ? onlineUsers.some(u => u.user_id === participantId && u.status === 'online')
          : false

        return {
          id,
          name: participantName,
          lastMessage: String(last_message?.['content'] ?? ''),
          time: formatTimeAgo(String(conv['updated_at'] ?? new Date().toISOString())),
          timestamp: String(conv['updated_at'] ?? new Date().toISOString()),
          unread: Number(conv['unread_count'] ?? 0),
          isOnline,
          isGroup: Boolean(group?.['id']),
          participantId,
          participantAvatar: String(participant?.['avatar'] ?? ''),
          lastMessageSenderId: Number(last_message?.['sender_id'] ?? 0),
          actualId: group?.['id'] ?? participant?.['id'],
          groupId: group?.['id'] ? Number(group['id']) : undefined,
          type: type as 'private' | 'group'
        }
      }))
    } catch (err) {
      console.error('Error fetching conversations:', err)
      if (err instanceof NetworkError) {
        error('Failed to load conversations.')
      } else {
        error('Unable to load conversations right now.')
      }
    } finally {
      setIsLoadingChats(false)
    }
  }, [onlineUsers, error])

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true)
      const data = await api.getUserGroups(user?.id || 0)
      const dataObj = data as unknown as Record<string, unknown> | undefined
      let groupsArrRaw: unknown[] = []
      if (dataObj) {
        if (Array.isArray(dataObj['groups'])) groupsArrRaw = dataObj['groups'] as unknown[]
        else if (Array.isArray(dataObj['data'])) groupsArrRaw = dataObj['data'] as unknown[]
      }

      type PartialGroup = { [k: string]: unknown }
      setGroups(groupsArrRaw.map((g) => {
        const group = g as PartialGroup
        return {
          id: Number(group['id'] ?? 0),
          name: String(group['title'] ?? group['name'] ?? ''),
          description: String(group['description'] ?? ''),
          members: Number(group['member_count'] ?? 0),
          isJoined: Boolean(group['is_member'] ?? group['isMember'] ?? false),
          lastActivity: formatTimeAgo(String(group['updated_at'] ?? group['updatedAt'] ?? new Date().toISOString())),
          timestamp: String(group['updated_at'] ?? group['updatedAt'] ?? new Date().toISOString())
        }
      }))
    } catch (err) {
      console.error('Error fetching groups:', err)
      if (err instanceof NetworkError) {
        error('Failed to load groups.')
      } else {
        error('Unable to load groups right now.')
      }
    } finally {
      setIsLoadingGroups(false)
    }
  }, [user, error])

  const fetchFollowers = useCallback(async () => {
    if (!user) return

    try {
      setIsLoadingFollowers(true)
      const [, followingData] = await Promise.all([
        api.getFollowers(user.id),
        api.getFollowing(user.id)
      ])

      setFollowing(Array.isArray(followingData?.following) ? followingData.following : [])
    } catch (err) {
      console.error('Error fetching followers:', err)
    } finally {
      setIsLoadingFollowers(false)
    }
  }, [user])

  
  useEffect(() => {
    if (filter !== 'all' && filter !== 'private' && filter !== 'groups') {
      router.replace('/chats/all')
    }
  }, [filter, router])

  
  useEffect(() => {
    if (openChatWindow && openChatWindow.conversationId) {
      const param = openChatWindow.type === 'group' ? 'group' : 'chat'
      
      if (filter === 'all') {
        router.replace(`/chats/all?${param}=${openChatWindow.conversationId}`)
      } else {
        
        router.replace(`/chats/${filter}?${param}=${openChatWindow.conversationId}`)
      }
    } else {
      
      if (filter === 'all') {
        router.replace('/chats/all')
      } else {
        router.replace(`/chats/${filter}`)
      }
    }
  }, [openChatWindow, router, filter])

  
  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchGroups()
      fetchFollowers()
    }
  }, [user, fetchConversations, fetchFollowers, fetchGroups])

  
  useEffect(() => {
    if (chats.length > 0) {
      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat.isGroup) return chat 

          const isOnline = chat.participantId
            ? onlineUsers.some(u => u.user_id === chat.participantId && u.status === 'online')
            : false

          return { ...chat, isOnline }
        })
      )
    }
  }, [onlineUsers, chats.length])

  
  useEffect(() => {
    
    if (chatId) {
      const id = parseInt(chatId)
      if (!isNaN(id)) {
        
        const chat = chats.find(c => c.id === id)
        setOpenChatWindow({
          conversationId: id,
          type: chat?.isGroup ? 'group' : 'private',
          name: chat?.name || 'Chat',
          participantId: chat?.participantId,
          groupId: chat?.isGroup ? chat.groupId : undefined,
          highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined
        })
        return
      }
    }

    
    if (groupId) {
      const id = parseInt(groupId)
      if (!isNaN(id)) {
        
        const chat = chats.find(c => c.isGroup && c.groupId === id)
        setOpenChatWindow({
          conversationId: chat?.id || id, 
          type: 'group',
          name: chat?.name || 'Group Chat',
          groupId: id,
          initialTab: tabParam || 'chat',
          highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined,
          highlightPollId: highlightPollParam ? parseInt(highlightPollParam) : undefined
        })
        return
      }
    }

    
    if (userParam) {
      const participantId = parseInt(userParam)
      if (!isNaN(participantId)) {
        const existing = chats.find(c => !c.isGroup && c.participantId === participantId)
        setOpenChatWindow({
          conversationId: existing?.id || 0,
          type: 'private',
          name: existing?.name || 'Direct Message',
          participantId,
          highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined
        })
      }
    }
  }, [chatId, groupId, chats, userParam, highlightMessageParam, highlightPollParam, tabParam])



  const getUserStatus = (userId: number): string => {
    const onlineUser = onlineUsers.find(u => u.user_id === userId)
    if (!onlineUser) return 'offline'
    if (onlineUser.status === 'invisible' || onlineUser.status === 'offline') return 'offline'
    return onlineUser.status 
  }

  const handleStartDirectMessage = async (userId: number, userName: string) => {
    try {
      
      const conversationsData = await api.getConversations()

      
      const existingConversation = conversationsData.conversations.find(
        conv => conv.type === 'private' && conv.participant?.id === userId
      )

      if (existingConversation) {
        
        setOpenChatWindow({
          conversationId: existingConversation.id,
          type: 'private',
          name: userName,
          participantId: userId
        })
      } else {
        
        
        const tempConversationId = `temp_private_${userId}_${Date.now()}`

        setOpenChatWindow({
          conversationId: parseInt(tempConversationId.split('_')[2]), 
          type: 'private',
          name: userName,
          participantId: userId
        })

        
        await fetchConversations()
      }

      
      setShowCreateDirectMessage(false)

      success('Conversation started!')
    } catch (err) {
      console.error('Error starting direct message:', err)
      if (err instanceof NetworkError) {
        error('Failed to start conversation. Please try again.')
      } else {
        error('Unable to start conversation right now.')
      }
    }
  }

  const _handleTabChange = (newTab: string) => {
    router.push(`/${newTab}`)
  }

  
  const _chatUnreadAll = (chats || []).filter(c => (c.unread || 0) > 0).length
  const _chatUnreadDirect = (chats || []).filter(c => !c.isGroup && (c.unread || 0) > 0).length
  const _chatUnreadGroups = (chats || []).filter(c => c.isGroup && (c.unread || 0) > 0).length

  
  
  void isConnected
  void _liveNotifications
  void _liveUnreadCount
  void _liveConversations
  void _groups
  void _isLoadingChats
  void _isLoadingGroups
  void _currentUser
  void _trendingTopics
  void _handleTabChange
  void _chatUnreadAll
  void _chatUnreadDirect
  void _chatUnreadGroups

  return (
    <AppLayout 
      activeTab="chats"
      chatSubTab={chatSubTab}
      setChatSubTab={setChatSubTab}
    >
      <CreateDirectMessage
        show={showCreateDirectMessage}
        onClose={() => setShowCreateDirectMessage(false)}
        followings={following}
        conversations={conversations}
        isLoading={isLoadingFollowers}
        getUserStatus={getUserStatus}
        onStartChat={(followerId: number) => {
          const follower = following.find(f => f.id === followerId)
          if (follower) {
            const userName = `${follower.first_name} ${follower.last_name}`.trim() || follower.nickname || follower.email
            handleStartDirectMessage(followerId, userName)
          }
        }}
      />

      <CreateGroup
        show={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={() => {
          fetchGroups()
          setShowCreateGroup(false)
          success('Group created!')
        }}
      />

      {openChatWindow ? (
        <ChatWindow
          conversationId={openChatWindow.conversationId}
          conversationType={openChatWindow.type}
          chatType={openChatWindow.type} 
          participantName={openChatWindow.name}
          participantId={openChatWindow.participantId}
          groupId={openChatWindow.type === 'group' ? (openChatWindow.groupId || openChatWindow.conversationId) : undefined}
          highlightMessageId={openChatWindow.highlightMessageId}
          highlightPollId={openChatWindow.highlightPollId}
          initialTab={openChatWindow.initialTab}
          onClose={() => setOpenChatWindow(null)}
        />
      ) : (
        <ChatsSection
          chatSubTab={chatSubTab}
          onChatClick={async (chat) => {
            if (chat.type === 'group') {
              try {
                
                const groupId = chat.groupId || chat.conversationId
                
                const groupInfo = await api.getGroup(groupId)
                
                setOpenChatWindow({
                  conversationId: chat.conversationId,
                  type: chat.type,
                  name: chat.name,
                  participantId: chat.participantId,
                  groupId: groupId,
                  isGroupMember: groupInfo.is_member,
                  userRole: groupInfo.role || 'member',
                  initialTab: tabParam || chat.initialTab,
                  highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : chat.highlightMessageId,
                  highlightPollId: highlightPollParam ? parseInt(highlightPollParam) : undefined
                })
              } catch (err) {
                console.error('Error fetching group info:', err)
                
                setOpenChatWindow({
                  conversationId: chat.conversationId,
                  type: chat.type,
                  name: chat.name,
                  participantId: chat.participantId,
                  groupId: chat.groupId || chat.conversationId,
                  isGroupMember: true,
                  userRole: 'member',
                  initialTab: tabParam || chat.initialTab,
                  highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : chat.highlightMessageId,
                  highlightPollId: highlightPollParam ? parseInt(highlightPollParam) : undefined
                })
              }
            } else {
              setOpenChatWindow({
                conversationId: chat.conversationId,
                type: chat.type,
                name: chat.name,
                participantId: chat.participantId,
                initialTab: chat.initialTab,
                highlightMessageId: chat.highlightMessageId,
                highlightPollId: undefined
              })
            }
          }}
          getUserStatus={getUserStatus}
          currentUser={user}
          showCreateGroup={showCreateGroup}
          setShowCreateDirectMessage={setShowCreateDirectMessage}
          setShowCreateGroup={setShowCreateGroup}
        />
      )}
    </AppLayout>
  )
}


function ProtectedChatsFilterPage() {
  return (
    <ProtectedRoute>
      <ChatsFilterPage />
    </ProtectedRoute>
  )
}

export default ProtectedChatsFilterPage