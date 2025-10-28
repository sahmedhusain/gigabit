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
import { parseConversationId, findChatByConversationId } from '@/utils/chatUtils'


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
        const rawId = conv['id']
        // Parse the conversation ID properly (handles "private_123" or "group_456")
        const parsedId = parseConversationId(rawId as string | number)
        const id = parsedId.numericId
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
    if (!user?.id) return
    
    try {
      setIsLoadingGroups(true)
      const data = await api.getUserGroups(user.id)
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
  }, [user?.id, error])

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
    if (openChatWindow) {
      if (openChatWindow.type === 'group') {
        const groupIdValue = openChatWindow.groupId
        if (groupIdValue) {
          if (filter === 'all') {
            router.replace(`/chats/all?group=${groupIdValue}`)
          } else {
            router.replace(`/chats/${filter}?group=${groupIdValue}`)
          }
        }
      } else {
        // For private chats: use chat ID if conversation exists, otherwise use user param
        if (openChatWindow.conversationId && openChatWindow.conversationId > 0) {
          if (filter === 'all') {
            router.replace(`/chats/all?chat=${openChatWindow.conversationId}`)
          } else {
            router.replace(`/chats/${filter}?chat=${openChatWindow.conversationId}`)
          }
        } else if (openChatWindow.participantId) {
          // New conversation - use user param
          if (filter === 'all') {
            router.replace(`/chats/all?user=${openChatWindow.participantId}`)
          } else {
            router.replace(`/chats/${filter}?user=${openChatWindow.participantId}`)
          }
        }
      }
    } else {
      
      if (filter === 'all') {
        router.replace('/chats/all')
      } else {
        router.replace(`/chats/${filter}`)
      }
    }
  }, [openChatWindow, router, filter])

  
  // Fetch data once when user is available
  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchGroups()
      fetchFollowers()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])  // Only refetch when user changes

  
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
    // Wait for chats to load before processing URL parameters
    if (chats.length === 0) return
    
    
    if (chatId) {
      const id = parseInt(chatId)
      if (!isNaN(id)) {
        // Find private chat by conversation ID
        const chat = findChatByConversationId(chats, id, 'private')
        if (chat) {
          setOpenChatWindow({
            conversationId: id,
            type: 'private',
            name: chat.name || 'Chat',
            participantId: chat.participantId,
            highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined
          })
        }
        return
      }
    }

    
    if (groupId) {
      const id = parseInt(groupId)
      if (!isNaN(id)) {
        // Find group chat by group ID (not conversation ID)
        const chat = chats.find(c => c.isGroup && c.groupId === id)
        if (chat) {
          setOpenChatWindow({
            conversationId: chat.id,
            type: 'group',
            name: chat.name || 'Group Chat',
            groupId: id,
            initialTab: tabParam || 'chat',
            highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined,
            highlightPollId: highlightPollParam ? parseInt(highlightPollParam) : undefined
          })
        } else {
          console.warn(`Group with ID ${id} not found in chats list - user may not be a member`)
        }
        return
      }
    }

    
    if (userParam) {
      const participantId = parseInt(userParam)
      if (!isNaN(participantId)) {
        const existing = chats.find(c => !c.isGroup && c.participantId === participantId)
        if (existing) {
          setOpenChatWindow({
            conversationId: existing.id,
            type: 'private',
            name: existing.name,
            participantId,
            highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined
          })
        } else {
          // New conversation - try to get user name from following
          const userInFollowing = following.find(f => f.id === participantId)
          if (userInFollowing) {
            const userName = `${userInFollowing.first_name} ${userInFollowing.last_name}`.trim() || userInFollowing.nickname || userInFollowing.email
            setOpenChatWindow({
              conversationId: 0,
              type: 'private',
              name: userName,
              participantId,
              highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined
            })
          }
        }
      }
    }
  }, [chatId, groupId, chats, userParam, highlightMessageParam, highlightPollParam, tabParam, following])



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
        // Parse the conversation ID to get the numeric part
        const parsedId = parseConversationId(existingConversation.id)
        setOpenChatWindow({
          conversationId: parsedId.numericId,
          type: 'private',
          name: userName,
          participantId: userId
        })
      } else {
        
        // For new conversations, use conversationId = 0 and rely on participantId
        setOpenChatWindow({
          conversationId: 0, 
          type: 'private',
          name: userName,
          participantId: userId
        })
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
        onGroupCreated={async () => {
          setShowCreateGroup(false)
          success('Group created!')
          // Refetch both conversations and groups to include the new group
          await Promise.all([
            fetchConversations(),
            fetchGroups()
          ])
        }}
      />

      {openChatWindow ? (
        <ChatWindow
          conversationId={openChatWindow.conversationId}
          conversationType={openChatWindow.type}
          chatType={openChatWindow.type} 
          participantName={openChatWindow.name}
          participantId={openChatWindow.participantId}
          groupId={openChatWindow.type === 'group' ? openChatWindow.groupId : undefined}
          highlightMessageId={openChatWindow.highlightMessageId}
          highlightPollId={openChatWindow.highlightPollId}
          initialTab={openChatWindow.initialTab}
          onConversationResolved={(newConversationId) => {
            // Update the conversation ID when it's resolved from 0 to actual ID
            setOpenChatWindow(prev => prev ? {
              ...prev,
              conversationId: newConversationId
            } : null)
            // Refresh conversations to get the new conversation
            fetchConversations()
          }}
          onClose={() => setOpenChatWindow(null)}
        />
      ) : (
        <ChatsSection
          chatSubTab={chatSubTab}
          onChatClick={async (chat) => {
            if (chat.type === 'group') {
              try {
                if (!chat.groupId) {
                  console.error('Group chat missing groupId:', chat);
                  return;
                }
                
                const groupInfo = await api.getGroup(chat.groupId)
                
                setOpenChatWindow({
                  conversationId: chat.conversationId,
                  type: chat.type,
                  name: chat.name,
                  participantId: chat.participantId,
                  groupId: chat.groupId,
                  isGroupMember: groupInfo.is_member,
                  userRole: groupInfo.role || 'member',
                  initialTab: tabParam || chat.initialTab,
                  highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : chat.highlightMessageId,
                  highlightPollId: highlightPollParam ? parseInt(highlightPollParam) : undefined
                })
              } catch (err) {
                console.error('Error fetching group info:', err)
                // ✅ FIX: Always use groupId, never conversationId for group identification
                if (!chat.groupId) {
                  console.error('Group chat missing groupId:', chat);
                  return;
                }
                setOpenChatWindow({
                  conversationId: chat.conversationId,
                  type: chat.type,
                  name: chat.name,
                  participantId: chat.participantId,
                  groupId: chat.groupId,
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