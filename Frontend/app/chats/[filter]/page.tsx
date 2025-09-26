'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import ChatWindow from '@/components/ChatWindow'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useToast } from '@/context/ToastContext'
import { useNotifications, useConversations } from '@/hooks'
import {
  api,
  Group,
  Chat,
  NetworkError
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
  const filter = params.filter as string
  const { user } = useAuth()
  const { isConnected, onlineUsers } = useWebSocket()
  const { success, error } = useToast()
  const { items: _liveNotifications, unread: _liveUnreadCount } = useNotifications()
  const { conversations: _liveConversations } = useConversations()

  const [chatSubTab, setChatSubTab] = useState(filter === 'groups' ? 'group' : filter || 'all')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateDirectMessage, setShowCreateDirectMessage] = useState(false)

  // Data State
  const [chats, setChats] = useState<Chat[]>([])
  const [_groups, setGroups] = useState<Group[]>([])
  const [_isLoadingChats, setIsLoadingChats] = useState(false)
  const [_isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [followers, setFollowers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [_following, setFollowing] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)

  // Chat window state
  const [openChatWindow, setOpenChatWindow] = useState<{
    conversationId: number
    type: 'private' | 'group',
    name: string
    participantId?: number
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

  // Update URL when filter changes
  useEffect(() => {
    const urlFilter = chatSubTab === 'group' ? 'groups' : chatSubTab
    if (urlFilter !== filter) {
      router.replace(`/chats/${urlFilter}`)
    }
  }, [chatSubTab, filter, router])

  // Open chat from URL parameter
  useEffect(() => {
    if (openChatWindow && openChatWindow.conversationId) {
      router.replace(`/chats/${filter}?chat=${openChatWindow.conversationId}`)
    } else {
      router.replace(`/chats/${filter}`)
    }
  }, [openChatWindow, filter, router])

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

  const fetchConversations = async () => {
    try {
      setIsLoadingChats(true)
      const data = await api.getConversations()
      const dataObj = data as unknown as Record<string, unknown> | undefined
      const convsRaw: unknown[] = dataObj && Array.isArray(dataObj['conversations']) ? dataObj['conversations'] as unknown[] : []

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
          actualId: group?.['id'] ?? participant?.['id']
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

      setFollowers(Array.isArray(followersData?.followers) ? followersData.followers : [])
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

  const isUserOnline = (userId: number): boolean => {
    return onlineUsers.some(u => u.user_id === userId && u.status === 'online')
  }

  const handleStartDirectMessage = async (userId: number, userName: string) => {
    try {
      // Get existing conversations to check if one already exists
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
        // Create a new conversation
        const newConversation = await api.createConversation(userId);
        setOpenChatWindow({
          conversationId: newConversation.id,
          type: 'private',
          name: userName,
          participantId: userId
        })
      }

      // Close the create direct message modal
      setShowCreateDirectMessage(false)

      // Refresh conversations list
      fetchConversations()

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

  // Calculate unread counts
  const _chatUnreadAll = (chats || []).reduce((sum, c) => sum + (c.unread || 0), 0)
  const _chatUnreadDirect = (chats || []).filter(c => !c.isGroup).reduce((sum, c) => sum + (c.unread || 0), 0)
  const _chatUnreadGroups = (chats || []).filter(c => c.isGroup).reduce((sum, c) => sum + (c.unread || 0), 0)

  // Mark intentionally unused values as used so the linter doesn't complain.
  // These values are kept for clarity and future use but aren't referenced in this view.
  void isConnected
  void _liveNotifications
  void _liveUnreadCount
  void _liveConversations
  void _groups
  void _isLoadingChats
  void _isLoadingGroups
  void _following
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
        followers={followers}
        isLoading={isLoadingFollowers}
        onStartChat={(followerId: number) => {
          const follower = followers.find(f => f.id === followerId)
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
          participantName={openChatWindow.name}
          participantId={openChatWindow.participantId}
          onClose={() => setOpenChatWindow(null)}
        />
      ) : (
        <ChatsSection
          chatSubTab={chatSubTab}
          onChatClick={(chat) => {
            setOpenChatWindow({
              conversationId: parseInt(chat.conversationId),
              type: chat.type,
              name: chat.name,
              participantId: chat.participantId
            });
          }}
          isUserOnline={isUserOnline}
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