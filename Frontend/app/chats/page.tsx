'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ChatWindow from '@/components/chat/ChatWindow'
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
import { formatConversationPreview } from '@/utils/chatUtils'

// Import dashboard components
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import RightSidebar from '@/components/layout/RightSidebar'
import ChatsSection from '@/components/chat/ChatsSection'
import CreateGroup from '@/components/groups/CreateGroup'
import CreateDirectMessage from '@/components/chat/CreateDirectMessage'

function ChatsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { isConnected: _isConnected, onlineUsers, addMessageListener: _addMessageListener } = useWebSocket()
  const { success, error } = useToast()
  const { items: _liveNotifications, unread: liveUnreadCount } = useNotifications()
  const { conversations: liveConversations } = useConversations()

  // Get filter from URL params
  const filterParam = searchParams?.get('filter') || 'all'
  const chatId = searchParams?.get('chat')
  // Support deep link params from search suggestions (legacy)
  const groupParam = searchParams?.get('group')
  const userParam = searchParams?.get('user')
  const highlightMessageParam = searchParams?.get('message')
  
  const [chatSubTab, setChatSubTab] = useState(filterParam)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen] = useState(false)
  const [_isSidebarCollapsed] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateDirectMessage, setShowCreateDirectMessage] = useState(false)

  // Data State
  const [chats, setChats] = useState<Chat[]>([])
  const [_groups, setGroups] = useState<Group[]>([])
  const [_isLoadingChats, setIsLoadingChats] = useState(false)
  const [_isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [followers, setFollowers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [following, setFollowing] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)

  // Chat window state
  const [openChatWindow, setOpenChatWindow] = useState<{
    conversationId: number
    type: 'private' | 'group',
    name: string
    participantId?: number
    groupId?: number
    initialTab?: string
    highlightMessageId?: number
  } | null>(null)

  // Current User Processing
  const currentUser = user ? {
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
    following: 0,
    posts: 0,
    status: user.status,
    lastStatusChange: user.last_status_change
  } : null

  // Update URL when filter or open chat changes (preserve deep-link params for highlight)
  useEffect(() => {
    const params = new URLSearchParams()
    // lock to /chats/all as per requirement, but preserve filter in param for state
    params.set('filter', chatSubTab)
    if (openChatWindow && openChatWindow.conversationId) {
      if (openChatWindow.type === 'group') {
        params.set('group', (openChatWindow.groupId || openChatWindow.conversationId).toString())
      } else {
        params.set('chat', openChatWindow.conversationId.toString())
      }
    }
    if (openChatWindow?.highlightMessageId || highlightMessageParam) {
      params.set('message', (openChatWindow?.highlightMessageId || highlightMessageParam)!.toString())
    }
    // Preserve user parameter if it exists
    if (userParam) {
      params.set('user', userParam)
    }
    router.replace(`/chats/all?${params}`)
  }, [chatSubTab, openChatWindow, router, userParam, highlightMessageParam])

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

  const getUserStatus = useCallback((userId: number): string => {
    const matched = onlineUsers.find(u => u.user_id === userId)
    return matched?.status || 'offline'
  }, [onlineUsers])

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingChats(true)
      const data = await api.getConversations()
      setChats((data.conversations || []).map(conversation => {
        const formattedLastMessage = formatConversationPreview(conversation, user?.id)
        const participantName = conversation.type === 'private'
          ? `${conversation.participant?.first_name || ''} ${conversation.participant?.last_name || ''}`.trim() || 'Unknown User'
          : conversation.group?.title || 'Unknown Group'
        
        // Check if participant is online for private conversations
        const isOnline = conversation.type === 'private' && conversation.participant?.id
          ? getUserStatus(conversation.participant.id) === 'online'
          : false
        
        return {
          id: conversation.id,
          name: participantName,
          lastMessage: formattedLastMessage,
          time: formatTimeAgo(conversation.updated_at || new Date().toISOString()),
          timestamp: conversation.updated_at || new Date().toISOString(),
          unread: conversation.unread_count || 0,
          isOnline: isOnline,
          isGroup: !!conversation.group?.id,
          type: conversation.type,
          participantId: conversation.participant?.id,
          participantAvatar: conversation.participant?.avatar,
          lastMessageSenderId: conversation.last_message?.sender_id,
          // Store the actual group/participant ID for API calls
          // For group chats, keep the raw group id so we can fetch group data or resolve conversation id
          groupId: conversation.group?.id
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
  }, [user?.id, getUserStatus, error])

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true)
      const data = await api.getUserGroups(user?.id || 0)
      const groupsArr = data.groups || []
      setGroups(groupsArr.map((group) => ({
        id: group.id,
        name: group.title,
        description: group.description,
        members: group.member_count,
        isJoined: !!group.is_member,
        lastActivity: formatTimeAgo(group.updated_at),
        timestamp: group.updated_at
      })))
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
  }, [user])

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchGroups()
      fetchFollowers()
    }
  }, [user, fetchConversations, fetchFollowers, fetchGroups])

  // Open chat from URL params after conversations are loaded
  useEffect(() => {
    if (chats.length > 0 && !openChatWindow) {
      let chatToOpen = null
      if (chatId) {
        // Find private chat
        chatToOpen = chats.find(c => c.id === parseInt(chatId) && c.type === 'private')
        if (chatToOpen) {
          setOpenChatWindow({
            conversationId: chatToOpen.id,
            type: 'private',
            name: chatToOpen.name,
            participantId: chatToOpen.participantId,
            highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined
          })
        }
      } else if (groupParam) {
        // Find group chat
        chatToOpen = chats.find(c => c.groupId === parseInt(groupParam) || c.id === parseInt(groupParam))
        if (chatToOpen) {
          setOpenChatWindow({
            conversationId: chatToOpen.id,
            type: 'group',
            name: chatToOpen.name,
            groupId: chatToOpen.groupId,
            highlightMessageId: highlightMessageParam ? parseInt(highlightMessageParam) : undefined
          })
        }
      }
    }
  }, [chats, chatId, groupParam, highlightMessageParam, openChatWindow])

  // Update chat online status when online users change
  useEffect(() => {
    if (chats.length > 0) {
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.isGroup) return chat // Groups don't have online status
          
          const isOnline = chat.participantId 
            ? getUserStatus(chat.participantId) === 'online'
            : false
          
          return { ...chat, isOnline }
        })
      )
    }
  }, [onlineUsers, chats.length, getUserStatus])

  const handleStartDirectMessage = async (userId: number, userName: string) => {
    try {
      // Get existing conversations to check if one already exists
      const conversationsData = await api.getConversations()
      
      // Find existing conversation with this user
      const existingConversation = conversationsData.conversations.find(
        conv => conv.type === 'private' && conv.participant?.id === userId
      )
      
      // Open existing conversation or create a new one by opening chat window
      // (conversation will be created automatically when first message is sent)
      setOpenChatWindow({
        conversationId: existingConversation?.id || 0, // 0 for new conversation
        type: 'private',
        name: userName,
        participantId: userId
      })
      
      // Close the create direct message modal
      setShowCreateDirectMessage(false)
      
      // Refresh conversations list
      if (existingConversation) {
        fetchConversations()
      }
      
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

  const handleTabChange = (newTab: string) => {
    router.push(`/${newTab}`)
  }

  const handleNotificationsToggle = () => {
    router.push('/notifications')
  }

  const handleDiscoverToggle = () => {
    router.push('/discover')
  }

  // Calculate unread counts (conversation count, not message count)
  const chatUnreadAll = (chats || []).filter(c => (c.unread || 0) > 0).length
  const chatUnreadDirect = (chats || []).filter(c => !c.isGroup && (c.unread || 0) > 0).length
  const chatUnreadGroups = (chats || []).filter(c => c.isGroup && (c.unread || 0) > 0).length

  // Mark intentionally unused values as used so the linter doesn't complain.
  // These values are kept for clarity and future use but aren't referenced in this view.
  void _isConnected
  void _addMessageListener
  void _liveNotifications
  void _groups
  void _isLoadingChats
  void _isLoadingGroups

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab="chats"
        setActiveTab={handleTabChange}
        feedSubTab="all"
        setFeedSubTab={() => {}}
        activitySubTab="liked"
        setActivitySubTab={() => {}}
        chatSubTab={chatSubTab}
        setChatSubTab={setChatSubTab}
        eventsSubTab="all"
        setEventsSubTab={() => {}}
        chatUnreadAll={chatUnreadAll}
        chatUnreadDirect={chatUnreadDirect}
        chatUnreadGroups={chatUnreadGroups}
      />

      <TopBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab="chats"
        onNotificationsClick={handleNotificationsToggle}
        unreadCount={liveUnreadCount || 0}
        onDiscoverClick={handleDiscoverToggle}
        isMobileRightSidebarOpen={isMobileRightSidebarOpen}
        setIsMobileRightSidebarOpen={setIsMobileRightSidebarOpen}
      />

      <CreateDirectMessage
        show={showCreateDirectMessage}
        onClose={() => setShowCreateDirectMessage(false)}
        followings={following}
        conversations={liveConversations || []}
        isLoading={isLoadingFollowers}
        getUserStatus={getUserStatus}
        onStartChat={(followerId: number) => {
          const followingUser = following.find(f => f.id === followerId)
          if (followingUser) {
            const userName = `${followingUser.first_name} ${followingUser.last_name}`.trim() || followingUser.nickname || followingUser.email
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
        }}
      />

      {/* Main Content */}
      <div className={`main-content-layout p-4 lg:p-6 relative z-10 has-fixed-sidebar ${_isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex flex-col lg:flex-row gap-6 h-full pt-2">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 h-full">
              {openChatWindow ? (
                <ChatWindow
                  conversationId={openChatWindow.conversationId}
                  conversationType={openChatWindow.type}
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
                  onChatClick={(chat) => {
                    console.log('🖱️ [ChatsPage] Chat clicked:', chat)
                    const conversationId = chat.conversationId
                    const participantId = chat.type === 'private' ? chat.participantId : undefined

                    console.log('📤 [ChatsPage] Opening chat window with:', {
                      conversationId,
                      type: chat.type,
                      name: chat.name,
                      participantId
                    })
                    
                    setOpenChatWindow({
                      conversationId: conversationId,
                      type: chat.type,
                      name: chat.name,
                      participantId: participantId,
                      groupId: chat.groupId,
                      initialTab: chat.initialTab,
                      highlightMessageId: chat.highlightMessageId
                    });
                  }}
                  getUserStatus={getUserStatus}
                  currentUser={user}
                  showCreateGroup={showCreateGroup}
                  setShowCreateDirectMessage={setShowCreateDirectMessage}
                  setShowCreateGroup={setShowCreateGroup}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Right Sidebar */}
      <RightSidebar
        onlineUsers={onlineUsers}
        followingUsers={following}
        followersUsers={followers}
        onUserClick={(user) => {
          router.push(`/profile/${user.id}`)
        }}
        currentUser={currentUser}
        setActiveTab={handleTabChange}
        logout={() => router.push('/login')}
        isMobileOpen={isMobileRightSidebarOpen}
      />
    </div>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedChatsPage() {
  return (
    <ProtectedRoute>
      <ChatsPage />
    </ProtectedRoute>
  )
}

export default ProtectedChatsPage
