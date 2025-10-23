'use client'
import { useState, useEffect, use } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import ChatWindow from '@/components/ChatWindow'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useNotifications, useConversations } from '@/hooks'
import { X } from 'lucide-react'
import {
  api,
  Group,
  Chat,
  NetworkError,
  ConversationResponse
} from '@/lib/api'

// Import AppLayout instead of individual components
import AppLayout from '@/components/AppLayout'

// Import dashboard components
import ChatsSection from '@/components/dashboard/ChatsSection'
import CreateGroup from '@/components/dashboard/CreateGroup'
import CreateDirectMessage from '@/components/dashboard/CreateDirectMessage'

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

  // Get URL parameters
  const chatId = searchParams.get('chat')
  const groupId = searchParams.get('group')
  const userParam = searchParams.get('user')
  const highlightMessageParam = searchParams.get('message')

  const [chatSubTab, setChatSubTab] = useState(filter === 'groups' ? 'group' : filter || 'all')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateDirectMessage, setShowCreateDirectMessage] = useState(false)

  // Data State
  const [chats, setChats] = useState<Chat[]>([])
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [_groups, setGroups] = useState<Group[]>([])
  const [_isLoadingChats, setIsLoadingChats] = useState(false)
  const [_isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [following, setFollowing] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)

  // Chat window state
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
  } | null>(null)

  // Current User Processing
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

  // Trending topics
  const _trendingTopics = [
    '#SocialNetwork', '#TechNews', '#WebDev', '#AI', '#Startups',
    '#React', '#TypeScript', '#NodeJS', '#Python', '#DevOps'
  ]

  // Update URL when filter changes - allow private/groups tabs, redirect others to /chats/all
  useEffect(() => {
    if (filter !== 'all' && filter !== 'private' && filter !== 'groups') {
      router.replace('/chats/all')
    }
  }, [filter, router])

  // Open chat from URL parameter - respect current filter tab
  useEffect(() => {
    if (openChatWindow && openChatWindow.conversationId) {
      const param = openChatWindow.type === 'group' ? 'group' : 'chat'
      // If we're on the 'all' tab, use /chats/all with query params for deep linking
      if (filter === 'all') {
        router.replace(`/chats/all?${param}=${openChatWindow.conversationId}`)
      } else {
        // If we're on private/groups tabs, stay on current path but add query params
        router.replace(`/chats/${filter}?${param}=${openChatWindow.conversationId}`)
      }
    } else {
      // When closing chat, remove query params but stay on current filter
      if (filter === 'all') {
        router.replace('/chats/all')
      } else {
        router.replace(`/chats/${filter}`)
      }
    }
  }, [openChatWindow, router, filter])

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchGroups()
      fetchFollowers()
    }
  // fetch* functions are stable for this effect; intentionally only run when `user` changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Update chat online status when online users change
  useEffect(() => {
    if (chats.length > 0) {
      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat.isGroup) return chat // Groups don't have online status

          const isOnline = chat.participantId
            ? onlineUsers.some(u => u.user_id === chat.participantId && u.status === 'online')
            : false

          return { ...chat, isOnline }
        })
      )
    }
  }, [onlineUsers, chats.length])

  // Open chat from URL parameters
  useEffect(() => {
    // Direct conversation open via ?chat=
    if (chatId) {
      const id = parseInt(chatId)
      if (!isNaN(id)) {
        // If chats already loaded, try to find details; otherwise open with minimal info
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

    // Direct group open via ?group=
    if (groupId) {
      const id = parseInt(groupId)
      if (!isNaN(id)) {
        // If chats already loaded, try to find details; otherwise open with minimal info
        const chat = chats.find(c => c.isGroup && c.groupId === id)
        setOpenChatWindow({
          conversationId: chat?.id || id, // Use conversation ID if found, otherwise use group ID
          type: 'group',
          name: chat?.name || 'Group Chat',
          groupId: id,
          highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined
        })
        return
      }
    }

    // Open direct message via ?user=
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
  }, [chatId, groupId, chats, userParam, highlightMessageParam])

  const fetchConversations = async () => {
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
  }

  const fetchGroups = async () => {
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
  }

  const fetchFollowers = async () => {
    if (!user) return

    try {
      setIsLoadingFollowers(true)
      const [followersData, followingData] = await Promise.all([
        api.getFollowers(user.id),
        api.getFollowing(user.id)
      ])

      setFollowing(Array.isArray(followingData?.following) ? followingData.following : [])
    } catch (err) {
      console.error('Error fetching followers:', err)
    } finally {
      setIsLoadingFollowers(false)
    }
  }

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

  const getUserStatus = (userId: number): string => {
    const onlineUser = onlineUsers.find(u => u.user_id === userId)
    if (!onlineUser) return 'offline'
    if (onlineUser.status === 'invisible' || onlineUser.status === 'offline') return 'offline'
    return onlineUser.status // 'online', 'busy', 'away'
  }

  const handleStartDirectMessage = async (userId: number, userName: string) => {
    try {
      // Check if there's already an existing conversation
      const conversationsData = await api.getConversations()

      // Find existing conversation with this user
      const existingConversation = conversationsData.conversations.find(
        conv => conv.type === 'private' && conv.participant?.id === userId
      )

      if (existingConversation) {
        // Open existing conversation
        setOpenChatWindow({
          conversationId: existingConversation.id,
          type: 'private',
          name: userName,
          participantId: userId
        })
      } else {
        // Create a temporary conversation ID for the chat window
        // The actual conversation will be created when the first message is sent
        const tempConversationId = `temp_private_${userId}_${Date.now()}`

        setOpenChatWindow({
          conversationId: parseInt(tempConversationId.split('_')[2]), // Use userId as conversation ID temporarily
          type: 'private',
          name: userName,
          participantId: userId
        })

        // Refresh conversations after opening chat to get any updates
        await fetchConversations()
      }

      // Close the create direct message modal
      setShowCreateDirectMessage(false)

      success(`Started conversation with ${userName}`)
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

  // Calculate unread counts (conversation count, not message count)
  const _chatUnreadAll = (chats || []).filter(c => (c.unread || 0) > 0).length
  const _chatUnreadDirect = (chats || []).filter(c => !c.isGroup && (c.unread || 0) > 0).length
  const _chatUnreadGroups = (chats || []).filter(c => c.isGroup && (c.unread || 0) > 0).length

  // Mark intentionally unused values as used so the linter doesn't complain.
  // These values are kept for clarity and future use but aren't referenced in this view.
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
          success('Group created successfully!')
        }}
      />

      {openChatWindow ? (
        <ChatWindow
          conversationId={openChatWindow.conversationId}
          conversationType={openChatWindow.type}
          chatType={openChatWindow.type} // Explicitly set chatType to trigger tabbed interface for groups
          participantName={openChatWindow.name}
          participantId={openChatWindow.participantId}
          groupId={openChatWindow.type === 'group' ? (openChatWindow.groupId || openChatWindow.conversationId) : undefined}
          highlightMessageId={openChatWindow.highlightMessageId}
          initialTab={openChatWindow.initialTab}
          onClose={() => setOpenChatWindow(null)}
        />
      ) : (
        <ChatsSection
          chatSubTab={chatSubTab}
          onChatClick={async (chat) => {
            if (chat.type === 'group') {
              try {
                // For groups, we need to fetch group details to get membership info
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
                  initialTab: chat.initialTab,
                  highlightMessageId: chat.highlightMessageId
                })
              } catch (err) {
                console.error('Error fetching group info:', err)
                // Fallback to basic group window
                setOpenChatWindow({
                  conversationId: chat.conversationId,
                  type: chat.type,
                  name: chat.name,
                  participantId: chat.participantId,
                  groupId: chat.groupId || chat.conversationId,
                  isGroupMember: true,
                  userRole: 'member',
                  initialTab: chat.initialTab,
                  highlightMessageId: chat.highlightMessageId
                })
              }
            } else {
              setOpenChatWindow({
                conversationId: chat.conversationId,
                type: chat.type,
                name: chat.name,
                  participantId: chat.participantId,
                  initialTab: chat.initialTab,
                  highlightMessageId: chat.highlightMessageId
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

// Wrap the entire component with ProtectedRoute
function ProtectedChatsFilterPage() {
  return (
    <ProtectedRoute>
      <ChatsFilterPage />
    </ProtectedRoute>
  )
}

export default ProtectedChatsFilterPage