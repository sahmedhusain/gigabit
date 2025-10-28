'use client'
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { mutate } from 'swr'
import { useWebSocket } from '@/context/WebSocketContext'
import { useRealTimeMessages, useTypingIndicator } from '@/hooks'
import { api, User, GroupResponse, Member, ConversationResponse, PostResponse, EventResponse } from '@/lib/api'
import { PollResponse } from '@/types/polls'
import { useUpload } from '@/hooks/useUpload'
import ImagePreviewModal from '@/components/ui/ImagePreviewModal'
import { EmojiData, Message, ChatWindowProps } from '@/types/chat'
import { useToast } from '@/context/ToastContext'


import GroupChatTab from '../../groups/tabs/GroupChatTab'
import GroupPostsTab from '../../groups/tabs/GroupPostsTab'
import GroupEventsTab from '../../groups/tabs/GroupEventsTab'
import GroupPollsTab from '../../groups/tabs/GroupPollsTab'
import GroupSettingsTab from '../../groups/tabs/GroupSettingsTab'
import GroupInfoTab from '../../groups/tabs/GroupInfoTab'


import ChatInput from '../input/ChatInput'
import MessageMenu from '../actions/MessageMenu'
import DeleteConfirmationModal from '../actions/DeleteConfirmationModal'
import GroupChatTabs from '../tabs/GroupChatTabs'
import GroupChatHeader from './GroupChatHeader'
import PrivateChatHeader from './PrivateChatHeader'
import MessagesArea from './MessagesArea'
import { formatLastOnlineTime } from '@/utils/chatUtils'

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  conversationType,
  chatType, 
  participantId,
  participantName,
  groupId,
  initialTab,
  highlightMessageId,
  highlightPollId,
  onConversationResolved,
  onClose,
  hideHeader
}) => {
  
  const effectiveChatType = chatType || conversationType;

  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab || 'chat') 
  const [groupData, setGroupData] = useState<GroupResponse | null>(null) 
  const [groupMembers, setGroupMembers] = useState<Member[]>([])
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLDivElement | null>(null)
  const highlightLoadAttemptsRef = useRef<number>(0)
  const [participantData, setParticipantData] = useState<User | null>(null)
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { user } = useAuth()

  const { success: showSuccessToast, error: showErrorToast } = useToast()

  
  const [newPostsCount, setNewPostsCount] = useState(0)
  const [unrespondedPollsCount, setUnrespondedPollsCount] = useState(0)
  const [unrespondedEventsCount, setUnrespondedEventsCount] = useState(0)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, isUploading: isUploadingImage } = useUpload()

  
  const [imagePreviewState, setImagePreviewState] = useState<{ isOpen: boolean; url: string | null }>({ isOpen: false, url: null })

  
  const [messageMenuState, setMessageMenuState] = useState<{ isOpen: boolean; messageId: number | null; x: number; y: number }>({ isOpen: false, messageId: null, x: 0, y: 0 })

  
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; messageId: number | null }>({ isOpen: false, messageId: null })

  
  const {
    messages,
    sendMessage: sendRealTimeMessage,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    fetchConversationMessages,
    refreshConversations,
    conversations,
    markAsRead,
    registerConversationIdCallback,
    unregisterConversationIdCallback
  } = useRealTimeMessages()

  
  const [effectiveConversationId, setEffectiveConversationId] = useState<number>(conversationId)

  
  useEffect(() => {
  }, [messages, effectiveConversationId])

  
  useEffect(() => {
    
    
    const needsResolution = conversationType === 'private'
      ? (conversationId === 0 || !conversations.find(c => c.id === conversationId && c.type === 'private'))
      : !!(conversationType === 'group' && groupId && conversationId === groupId)

    
    if (needsResolution && conversationId !== undefined) {
      registerConversationIdCallback(conversationId, (newId: number) => {
        setEffectiveConversationId(newId)
        onConversationResolved?.(newId)
      })
    }

    
    return () => {
      if (needsResolution && conversationId !== undefined) {
        unregisterConversationIdCallback(conversationId)
      }
    }
  }, [conversationId, conversationType, groupId, conversations, registerConversationIdCallback, unregisterConversationIdCallback, onConversationResolved])

  
  useEffect(() => {
    if (conversationType === 'group') {
      if (conversationId !== effectiveConversationId) {
        setEffectiveConversationId(conversationId)
      }
    } else {
      setEffectiveConversationId(conversationId)
    }
  }, [conversationId, conversationType, effectiveConversationId])

  
  
  
  const typingConversationId = conversationType === 'group' && groupId ? groupId : (participantId || effectiveConversationId)
  const {
    typingUsers,
    startTyping
  } = useTypingIndicator(typingConversationId, conversationType)

  
  const { isConnected, onlineUsers } = useWebSocket()

  
  useEffect(() => {
    if (effectiveConversationId && effectiveConversationId > 0 && conversationType) {
      // For group chats, pass groupId to ensure correct message fetching
      const groupIdToPass = conversationType === 'group' ? groupId : undefined
      fetchConversationMessages(effectiveConversationId, conversationType, participantId, 20, 0, false, groupIdToPass)
    }
  }, [effectiveConversationId, conversationType, participantId, groupId, fetchConversationMessages])

  
  
  useEffect(() => {
    if (!highlightMessageId) return
    if (conversationType === 'group') {
      
      return
    }

    const list = Array.from(messages.get(effectiveConversationId) || [])

    if (list.length === 0) return

    
    setTimeout(() => {
      
      const el = document.querySelector(`[data-message-id="${highlightMessageId}"]`) as HTMLDivElement | null

      if (el && messagesContainerRef.current) {
        highlightedRef.current = el
        el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-transparent')

        
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }, 50)

        
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-transparent')
        }, 2500)
        
        highlightLoadAttemptsRef.current = 0
      } else {
        
        const attempts = highlightLoadAttemptsRef.current
        const canLoadMore = hasMoreMessages.get(effectiveConversationId) && !isLoadingMore.get(effectiveConversationId)
        if (attempts < 5 && canLoadMore) {
          highlightLoadAttemptsRef.current = attempts + 1
          // For group chats, pass groupId to ensure correct message fetching
          loadMoreMessages(effectiveConversationId, conversationType, participantId, groupId)
        }
      }
    }, 100)
  }, [messages, effectiveConversationId, highlightMessageId, hasMoreMessages, isLoadingMore, loadMoreMessages, conversationType, participantId, groupId])

  
  useEffect(() => {
    if (!effectiveConversationId || !user) return
    const convMsgs = Array.from(messages.get(effectiveConversationId) || [])
    if (convMsgs.length === 0) return

    const unreadIds = convMsgs
      .filter(m => m.sender_id !== user.id && !m.is_read)
      .map(m => m.id)

    if (unreadIds.length === 0) return

    
    markAsRead(effectiveConversationId)

    
    api.markMessagesAsRead(unreadIds)
      .then(() => {
        
        mutate('chats')
        
        refreshConversations()
      })
      .catch(err => {
        console.error('Failed to mark messages as read on server:', err)
      })

    
    mutate('chats', (current: ConversationResponse[] | { conversations: ConversationResponse[] } | undefined) => {
      if (!current) return current
      const list = Array.isArray(current) ? current : current.conversations
      if (!Array.isArray(list)) return current
      const next = list.map((c: ConversationResponse) => c?.id === effectiveConversationId ? { ...c, unread_count: 0 } : c)
      return Array.isArray(current) ? next : { ...current, conversations: next }
    }, false)
  }, [effectiveConversationId, messages, user, markAsRead, refreshConversations])

  
  useEffect(() => {
    if (conversationType !== 'group') return
    if (!groupId) return
    
    if (effectiveConversationId === groupId) {
      
      const match = conversations.find(c => c.type === 'group' && c.group && c.group.id === groupId)
      if (match && match.id !== effectiveConversationId) {
        setEffectiveConversationId(match.id)
        onConversationResolved?.(match.id)
        
        fetchConversationMessages(match.id, 'group', undefined, 20, 0, false)
      }
    }
  }, [conversations, effectiveConversationId, groupId, conversationType, fetchConversationMessages, onConversationResolved])

  
  useEffect(() => {
    if (conversationType === 'private' && participantId) {
      const fetchParticipantData = async () => {
        try {
          const userData = await api.getProfile(participantId)
          setParticipantData(userData)
        } catch (error) {
          console.error('Failed to fetch participant data:', error)
        }
      }
      fetchParticipantData()
    }
  }, [conversationType, participantId])

  
  useEffect(() => {
    if (effectiveChatType === 'group' && groupId) {
      const fetchGroupData = async () => {
        try {
          const data = await api.getGroup(groupId)
          setGroupData(data)
        } catch (error) {
          console.error('Failed to fetch group data:', error)
        }
      }
      fetchGroupData()
    }
  }, [effectiveChatType, groupId])

  
  useEffect(() => {
    if (effectiveChatType === 'group' && activeTab === 'settings' && groupData) {
      const isAdminOrCreator = groupData?.role === 'admin' || groupData?.role === 'creator';

      if (!isAdminOrCreator) {
        
        setActiveTab('info');
      }
    }
  }, [activeTab, effectiveChatType, groupData])

  
  useEffect(() => {
    if (effectiveChatType === 'group' && groupId) {
      const fetchGroupMembers = async () => {
        try {
          const members = await api.getGroupMembers(groupId)
          setGroupMembers(members.members)
        } catch (error: any) {
          // Silently ignore 403 errors (user not a member) - this is expected behavior
          if (error?.status !== 403 && !(error?.name === 'NetworkError' && error?.message?.includes('forbidden'))) {
            console.error('Failed to fetch group members:', error?.message || error)
          }
        }
      }
      fetchGroupMembers()
    }
  }, [effectiveChatType, groupId])

  
  useEffect(() => {
    if (effectiveChatType === 'group' && groupId) {
      const fetchTabCounts = async () => {
        try {
          
          const postsResponse = await api.getGroupPosts(groupId, 1, 100) 
          const lastViewedPostsKey = `group_${groupId}_last_viewed_posts`
          const lastViewedPosts = localStorage.getItem(lastViewedPostsKey)
          const lastViewedDate = lastViewedPosts ? new Date(lastViewedPosts) : new Date(0)
          const unreadPosts = (postsResponse.posts || []).filter((post: PostResponse) => new Date(post.created_at) > lastViewedDate)
          setNewPostsCount(unreadPosts.length || 0)

          
          const pollsResponse = await api.getGroupPolls(groupId, 20, 0)
          const unrespondedPolls = (pollsResponse || []).filter((poll: PollResponse) => {
            
            const hasVoted = Boolean(poll.user_voted) || (poll.user_votes && poll.user_votes.length > 0)
            const isExpired = Boolean(poll.is_expired)
            const isOwnPoll = poll.user_id === user?.id
            const shouldInclude = !hasVoted && !isExpired && !isOwnPoll


            return shouldInclude
          })
          setUnrespondedPollsCount(unrespondedPolls.length || 0)

          
          const eventsResponse = await api.getGroupEvents(groupId, 1, 1)
          const unrespondedEvents = (eventsResponse?.events || []).filter((event: EventResponse) => {
            
            const isEventEnded = (event: EventResponse): boolean => {
              if (event.canceled) return true
              const eventTime = new Date(event.event_time)
              const now = new Date()
              return eventTime < now
            }

            
            return event.user_response !== 'going' && event.user_response !== 'not_going' && !isEventEnded(event)
          })
          setUnrespondedEventsCount(unrespondedEvents.length || 0)

          
          if (groupData?.role === 'admin' || groupData?.role === 'creator') {
            const requestsResponse = await api.getReceivedJoinRequests(groupId)
            setPendingRequestsCount(requestsResponse.count || 0)
          }
        } catch (error: any) {
          // Silently ignore 403 errors (user not a member) - this is expected behavior
          if (error?.status !== 403 && !(error?.name === 'NetworkError' && error?.message?.includes('forbidden'))) {
            console.error('Failed to fetch tab counts:', error?.message || error)
          }
        }
      }
      fetchTabCounts()
    }
  }, [effectiveChatType, groupId, groupData?.role, user?.id])

  
  useEffect(() => {
    if (effectiveChatType === 'group' && groupId) {
      const lastAccessedKey = `group_${groupId}_last_accessed`
      localStorage.setItem(lastAccessedKey, new Date().toISOString())
    }
  }, [effectiveChatType, groupId])

  
  const handleLoadPreviousMessages = React.useCallback(async () => {
    if (conversationId && conversationType && hasMoreMessages.get(conversationId) && !isLoadingMore.get(conversationId)) {
      
      const currentScrollTop = messagesContainerRef.current?.scrollTop || 0
      setIsLoadingHistorical(true)

      // For group chats, pass groupId to ensure correct message fetching
      const groupIdToPass = conversationType === 'group' ? groupId : undefined
      await loadMoreMessages(conversationId, conversationType, participantId, groupIdToPass)

      
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = currentScrollTop
        }
        setIsLoadingHistorical(false)
      }, 50)
    }
  }, [conversationId, conversationType, participantId, groupId, hasMoreMessages, isLoadingMore, loadMoreMessages])

  
  const handleScroll = React.useCallback(() => {
    
  }, [])

  
  const scrollToBottom = React.useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  
  const getUnreadMessagesInfo = React.useCallback(() => {
    const convMsgs = Array.from(messages.get(effectiveConversationId) || [])
    const unreadMessages = convMsgs.filter(m => m.sender_id !== user?.id && !m.is_read)

    if (unreadMessages.length === 0) {
      return { hasUnread: false, firstUnreadMessage: null, unreadCount: 0 }
    }

    
    const firstUnreadMessage = unreadMessages[0]

    return {
      hasUnread: true,
      firstUnreadMessage,
      unreadCount: unreadMessages.length
    }
  }, [messages, effectiveConversationId, user])

  // Track previous messages count to detect new messages
  const prevMessagesCountRef = useRef<number>(0)
  
  const handleMessagesChange = React.useCallback(() => {
    if (isLoadingHistorical) {
      
      
      return
    }

    const currentMessages = Array.from(messages.get(effectiveConversationId) || [])
    const currentCount = currentMessages.length
    
    
    if (isInitialLoad && currentCount > 0) {
      const unreadInfo = getUnreadMessagesInfo()

      if (unreadInfo.hasUnread && unreadInfo.firstUnreadMessage) {
        
        setTimeout(() => {
          const messageElement = document.querySelector(`[data-message-id="${unreadInfo.firstUnreadMessage!.id}"]`) as HTMLElement
          if (messageElement && messagesContainerRef.current) {
            messageElement.scrollIntoView({ behavior: 'instant', block: 'start' })
          }
        }, 100)
      } else {
        
        setTimeout(() => scrollToBottom(), 100)
      }

      setIsInitialLoad(false)
      prevMessagesCountRef.current = currentCount
      return
    }

    // Check if new message was added
    if (currentCount > prevMessagesCountRef.current && currentCount > 0) {
      const lastMessage = currentMessages[currentMessages.length - 1]
      
      // If the last message is from the current user, force scroll to bottom
      if (lastMessage && lastMessage.sender_id === user?.id) {
        setTimeout(() => {
          scrollToBottom()
        }, 100)
      }
    }
    
    prevMessagesCountRef.current = currentCount
  }, [isLoadingHistorical, isInitialLoad, messages, effectiveConversationId, scrollToBottom, getUnreadMessagesInfo, user?.id])

  useEffect(() => {
    handleMessagesChange()
  }, [handleMessagesChange])

  const handleLeaveGroup = async (groupIdToLeave: number) => {
    try {
      await api.leaveGroup(groupIdToLeave)
      
      mutate('chats')
      showSuccessToast('Left group!')
      
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to leave group:', error)
      showErrorToast('Failed to leave group')
    }
  }

  const handleManageAdmins = () => {
    setActiveTab('settings')
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return

    try {
      // Determine the correct recipient/group ID
      let actualRecipientId: number | undefined = undefined
      let actualGroupId: number | undefined = undefined

      if (conversationType === 'private') {
        // For private chats, ensure we have participantId
        actualRecipientId = participantId
        
        // If participantId is missing, try to get it from participantData
        if (!actualRecipientId && participantData) {
          actualRecipientId = participantData.id
        }

        // If still missing, try to derive from conversations
        if (!actualRecipientId) {
          const conv = conversations.find(c => c.id === effectiveConversationId && c.type === 'private')
          if (conv && conv.participant) {
            actualRecipientId = conv.participant.id
          }
        }

        if (!actualRecipientId) {
          console.error('Cannot send private message: recipient ID not found', { 
            participantId, 
            participantData, 
            effectiveConversationId,
            conversationType 
          })
          showErrorToast('Cannot send message: recipient not found')
          return
        }
      } else if (conversationType === 'group') {
        // For group chats, use groupId or fallback to effectiveConversationId
        actualGroupId = groupId || effectiveConversationId
      }

      await sendRealTimeMessage(
        effectiveConversationId,
        newMessage.trim(),
        'text',
        actualRecipientId,
        actualGroupId
      )

      setNewMessage('')

      // The conversation ID resolution is now handled automatically by the
      // registerConversationIdCallback mechanism in the useEffect above
    } catch (error) {
      console.error('Error sending message:', error)
      showErrorToast('Failed to send message')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTyping = () => {
    if (isConnected) {
      startTyping()
    }
  }

  const handleEmojiClick = (emojiData: EmojiData) => {
    setNewMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadImage(file)

      // Determine the correct recipient/group ID (same logic as handleSendMessage)
      let actualRecipientId: number | undefined = undefined
      let actualGroupId: number | undefined = undefined

      if (conversationType === 'private') {
        actualRecipientId = participantId
        
        if (!actualRecipientId && participantData) {
          actualRecipientId = participantData.id
        }

        if (!actualRecipientId) {
          const conv = conversations.find(c => c.id === effectiveConversationId && c.type === 'private')
          if (conv && conv.participant) {
            actualRecipientId = conv.participant.id
          }
        }

        if (!actualRecipientId) {
          console.error('Cannot send image: recipient ID not found')
          showErrorToast('Cannot send image: recipient not found')
          return
        }
      } else if (conversationType === 'group') {
        actualGroupId = groupId || effectiveConversationId
      }

      await sendRealTimeMessage(
        effectiveConversationId,
        result.url, 
        'image', 
        actualRecipientId,
        actualGroupId
      )

      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      showErrorToast('Failed to upload image')
    }
  }

  // Image preview handlers
  const handleImagePreviewOpen = (imageUrl: string) => {
    setImagePreviewState({ isOpen: true, url: imageUrl })
  }

  const handleImagePreviewClose = () => {
    setImagePreviewState({ isOpen: false, url: null })
  }

  // Message menu handlers
  const handleMessageMenuOpen = (messageId: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setMessageMenuState({
      isOpen: true,
      messageId,
      x: rect.left,
      y: rect.bottom + 5
    })
  }

  const handleMessageMenuClose = () => {
    setMessageMenuState({ isOpen: false, messageId: null, x: 0, y: 0 })
  }

  const handleDeleteMessage = async () => {
    const messageId = Number(deleteConfirmState.messageId)

    // More robust validation
    if (!deleteConfirmState.messageId ||
        typeof deleteConfirmState.messageId !== 'number' ||
        isNaN(messageId) ||
        !Number.isInteger(messageId) ||
        messageId <= 0 ||
        messageId >= 1000000000000) {
      console.error('Invalid message ID:', deleteConfirmState.messageId)
      return
    }

    try {
      await api.deleteMessage(messageId)
      showSuccessToast('Message deleted!')
      
      setDeleteConfirmState({ isOpen: false, messageId: null })
      handleMessageMenuClose()
    } catch (error) {
      console.error('Failed to delete message:', error)
      showErrorToast('Failed to delete message')
    }
  }

  
  const canDeleteMessage = (message: Message) => {
    if (message.sender_id !== user?.id) return false
    if (message.content === "XdeletedbyuserX") return false 
    if (message.id >= 1000000000000) return false 

    const messageDate = new Date(message.created_at)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 72 
  }

  
  const getOnlineGroupMembersCount = () => {
    if (!groupMembers.length || !onlineUsers.length) return 0
    return onlineUsers.filter(onlineUser =>
      onlineUser.user_id !== user?.id && 
      groupMembers.some(member => member.user.id === onlineUser.user_id) && 
      (onlineUser.status === 'online' || onlineUser.status === 'busy' || onlineUser.status === 'away') 
    ).length
  }

  const getParticipantStatus = (): string => {
    if (!participantId) return 'offline'
    const onlineUser = onlineUsers.find(u => u.user_id === participantId)
    if (!onlineUser) return 'offline'
    if (onlineUser.status === 'invisible' || onlineUser.status === 'offline') return 'offline'
    return onlineUser.status 
  }

  
  if (effectiveChatType === 'group') {
    
    const isAdminOrCreator = groupData?.role === 'admin' || groupData?.role === 'creator';

    return (
      <motion.div
        className="h-full max-h-[calc(100vh-6rem)] flex flex-col rounded-3xl border border-white/30 overflow-hidden shadow-2xl ring-1 ring-white/20 mt-4"
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 30 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
      >
        <GroupChatHeader
          participantName={participantName}
          groupData={groupData}
          getOnlineGroupMembersCount={getOnlineGroupMembersCount}
          typingUsers={typingUsers}
          hideHeader={hideHeader}
          onClose={onClose}
          onInfoClick={() => setActiveTab('info')}
        />

        <GroupChatTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          newPostsCount={newPostsCount}
          unrespondedPollsCount={unrespondedPollsCount}
          unrespondedEventsCount={unrespondedEventsCount}
          pendingRequestsCount={pendingRequestsCount}
          isAdminOrCreator={isAdminOrCreator}
        />

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="h-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'info' && groupId && (
                <GroupInfoTab
                  groupId={groupId}
                  onLeaveGroup={handleLeaveGroup}
                  onManageAdmins={handleManageAdmins}
                  onClose={onClose}
                />
              )}
              {activeTab === 'chat' && (
                <GroupChatTab
                  conversationId={effectiveConversationId}
                  groupId={groupId}
                  highlightMessageId={highlightMessageId}
                  onConversationResolved={onConversationResolved}
                />
              )}
              {activeTab === 'posts' && groupId && (
                <GroupPostsTab groupId={groupId} groupTitle={participantName} />
              )}
              {activeTab === 'events' && groupId && (
                <GroupEventsTab groupId={groupId} groupTitle={participantName} />
              )}
              {activeTab === 'polls' && groupId && <GroupPollsTab groupId={groupId} highlightPollId={highlightPollId} />}
              {activeTab === 'settings' && groupId && (
                <GroupSettingsTab groupId={groupId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  
  return (
    <motion.div
      className="h-full max-h-[calc(100vh-6rem)] flex flex-col rounded-3xl border border-white/30 overflow-hidden shadow-2xl ring-1 ring-white/20 mt-4"
      initial={{ opacity: 0, scale: 0.96, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 30 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
    >
      <PrivateChatHeader
        conversationType={conversationType}
        participantId={participantId}
        participantData={participantData}
        participantName={participantName}
        isConnected={isConnected}
        typingUsers={typingUsers}
        getParticipantStatus={getParticipantStatus}
        formatLastOnlineTime={formatLastOnlineTime}
        hideHeader={hideHeader}
        onClose={onClose}
      />

      <MessagesArea
        messages={Array.from(messages.get(effectiveConversationId) || [])}
        effectiveConversationId={effectiveConversationId}
        conversationType={conversationType}
        user={user}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        isLoadingHistorical={isLoadingHistorical}
        hasMoreMessages={hasMoreMessages}
        getUnreadMessagesInfo={getUnreadMessagesInfo}
        onMessageMenuOpen={handleMessageMenuOpen}
        onImagePreviewOpen={handleImagePreviewOpen}
        canDeleteMessage={canDeleteMessage}
        onLoadPreviousMessages={handleLoadPreviousMessages}
        onScroll={handleScroll}
        participantData={participantData}
        participantName={participantName}
      />

      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        isConnected={isConnected}
        isUploadingImage={isUploadingImage}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        onTyping={handleTyping}
        onEmojiClick={handleEmojiClick}
        onImageSelect={handleImageSelect}
        participantData={participantData}
        participantName={participantName}
        conversationType={conversationType}
      />

      <ImagePreviewModal
        isOpen={imagePreviewState.isOpen}
        imageUrl={imagePreviewState.url}
        onClose={handleImagePreviewClose}
      />

      <MessageMenu
        isOpen={messageMenuState.isOpen}
        messageId={messageMenuState.messageId}
        x={messageMenuState.x}
        y={messageMenuState.y}
        onClose={handleMessageMenuClose}
        onDeleteClick={() => setDeleteConfirmState({ isOpen: true, messageId: messageMenuState.messageId })}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState({ isOpen: false, messageId: null })}
        onConfirm={handleDeleteMessage}
      />
    </motion.div>
  )
}

export default ChatWindow