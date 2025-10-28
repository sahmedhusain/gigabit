'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL, api } from '@/lib/api'
import ChatWindow from '@/components/chat/window/ChatWindow'
import CreateGroupPost from '@/components/groups/CreateGroupPost'
import CreateGroupEvent from '@/components/groups/CreateGroupEvent'
import { MessageCircle, Users, Hash, FileText, Calendar } from 'lucide-react'
import { useRealTimeMessages, useConnectionStatus } from '@/hooks'
import { getAvatarUrl, getUserInitials } from '@/utils/avatarUtils'
import Image from 'next/image'
import { GroupChatProps } from '@/types/groups'

const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupTitle }) => {
  const { isConnected: connectionStatus } = useConnectionStatus()
  const { getUnreadCount } = useRealTimeMessages()
  
  const [showChat, setShowChat] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState<unknown[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [isResolvingConversation, setIsResolvingConversation] = useState(false)
  
  
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)

  
  const onlineMemberCount = 0 
  const unreadCount = getUnreadCount(groupId)

  const fetchMemberCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setMemberCount(data.members?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching member count:', error)
    }
  }, [groupId])

  useEffect(() => {
    
    fetchMemberCount()
  }, [groupId, fetchMemberCount])

  useEffect(() => {
    
    if (!showChat) {
      const fetchRecentMessages = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/messages/group/${groupId}?limit=3`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          if (response.ok) {
            const data = await response.json()
            setRecentMessages(data.messages || [])
          }
        } catch (error) {
          console.error('Error fetching recent messages:', error)
        }
      }
      fetchRecentMessages()
    }
  }, [showChat, groupId])

  
  const resolveConversationId = useCallback(async () => {
    try {
      setIsResolvingConversation(true)
      const convs = await api.getConversations()
      const match = (convs.conversations || []).find(c => c.type === 'group' && c.group && c.group.id === groupId)
      if (match) {
        setConversationId(match.id)
      } else {
        
        setConversationId(null)
      }
    } catch (err) {
      console.error('Failed to resolve group conversation ID:', err)
    } finally {
      setIsResolvingConversation(false)
    }
  }, [groupId])

  useEffect(() => {
    
    resolveConversationId()
  }, [resolveConversationId])

  const handleOpenChat = () => {
    
    if (conversationId === null && !isResolvingConversation) {
      
      resolveConversationId()
    }
    setShowChat(true)
  }

  const handleCloseChat = () => {
    setShowChat(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{groupTitle}</h3>
            <div className="flex items-center space-x-2 text-sm text-white/60">
              <Users className="w-4 h-4" />
              <span>{memberCount} members</span>
              {onlineMemberCount > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{onlineMemberCount} online</span>
                  </div>
                </>
              )}
              <div className={`w-2 h-2 rounded-full ${connectionStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{connectionStatus ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {!showChat && (
          <div className="flex items-center space-x-3">
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreatePost(true)}
                disabled={!connectionStatus}
                className={`flex items-center px-3 py-2 rounded-xl text-white transition-all duration-200 text-sm ${
                  connectionStatus 
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30' 
                    : 'bg-gray-500/20 cursor-not-allowed border border-gray-500/30'
                }`}
                title="Create Post"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Post</span>
              </button>
              <button
                onClick={() => setShowCreateEvent(true)}
                disabled={!connectionStatus}
                className={`flex items-center px-3 py-2 rounded-xl text-white transition-all duration-200 text-sm ${
                  connectionStatus 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30' 
                    : 'bg-gray-500/20 cursor-not-allowed border border-gray-500/30'
                }`}
                title="Create Event"
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Event</span>
              </button>
            </div>

            {/* Chat Button */}
            <div className="relative">
              <button
                onClick={handleOpenChat}
                disabled={!connectionStatus}
                className={`flex items-center px-4 py-2 rounded-xl text-white transition-all duration-200 ${
                  connectionStatus 
                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                    : 'bg-gray-500 cursor-not-allowed'
                }`}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {connectionStatus ? 'Open Chat' : 'Offline'}
              </button>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Content */}
      <div className="flex-1 relative">
        {showChat ? (
          <div className="absolute inset-0 z-10">
            {isResolvingConversation && !conversationId && (
              <div className="flex items-center justify-center h-full text-white/60 text-sm">
                Resolving conversation...
              </div>
            )}
            {!isResolvingConversation && (
              <ChatWindow
                conversationId={conversationId || groupId}
                conversationType="group"
                participantName={groupTitle}
                groupId={groupId}
                onConversationResolved={(realId) => {
                  if (realId !== conversationId) {
                    setConversationId(realId)
                  }
                }}
                onClose={() => {
                  handleCloseChat()
                  
                  resolveConversationId()
                }}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Recent Messages Preview */}
            <div className="flex-1 p-4 space-y-3">
              <div className="text-center mb-4">
                <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-2" />
                <h4 className="text-lg font-semibold text-white mb-1">Group Chat</h4>
                <p className="text-white/70 text-sm">
                  Connect with fellow group members in real-time
                </p>
              </div>

              {recentMessages.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-white/80 text-sm font-medium mb-2">Recent Messages</h5>
                        {recentMessages.slice(0, 3).map((message, index) => {
                          const m = (message as Record<string, unknown>) || {};
                          const sender = (m.sender as Record<string, unknown>) || {};

                          const senderName = (typeof sender.first_name === 'string' && typeof sender.last_name === 'string')
                            ? `${sender.first_name} ${sender.last_name}`
                            : (typeof sender.nickname === 'string' ? sender.nickname : 'Unknown User');

                          const createdAt = typeof m.created_at === 'string' ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                          const content = typeof m.content === 'string' ? m.content : '';
                          const senderAvatar = typeof sender.avatar === 'string' ? sender.avatar : null;

                          return (
                            <div key={(m.id as string) || index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                              <div className="flex items-center space-x-2 mb-1">
                                {(() => {
                                  const avatarUrl = senderAvatar ? getAvatarUrl(senderAvatar) : null;
                                  return avatarUrl ? (
                                    <Image
                                      src={avatarUrl}
                                      alt={senderName}
                                      width={24}
                                      height={24}
                                      unoptimized={avatarUrl.includes('/svg')}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-semibold">{getUserInitials(sender)}</span>
                                    </div>
                                  );
                                })()}
                                <span className="text-white/80 text-sm font-medium">{senderName}</span>
                                <span className="text-white/50 text-xs">{createdAt}</span>
                              </div>
                              <p className="text-white/70 text-sm truncate">{content}</p>
                            </div>
                          );
                        })}
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleOpenChat}
                  disabled={!connectionStatus}
                  className={`flex items-center px-6 py-3 rounded-xl text-white transition-all duration-200 mx-auto ${
                    connectionStatus 
                      ? 'bg-emerald-500 hover:bg-emerald-600' 
                      : 'bg-gray-500 cursor-not-allowed'
                  }`}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {connectionStatus 
                    ? (recentMessages.length > 0 ? 'Continue Chat' : 'Start Chatting')
                    : 'Chat Offline'}
                </button>
                {!connectionStatus && (
                  <p className="text-center text-white/50 text-xs mt-2">
                    Chat will be available when connection is restored
                  </p>
                )}
                {conversationId && !showChat && (
                  <p className="text-center text-white/30 text-[10px] mt-2">Conversation ID: {conversationId}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <CreateGroupPost
        show={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        groupId={groupId}
        groupTitle={groupTitle}
        onPostCreated={() => {
          
        }}
      />

      {/* Create Event Modal */}
      <CreateGroupEvent
        show={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        groupId={groupId}
        groupTitle={groupTitle}
        onEventCreated={() => {
          
        }}
      />
    </div>
  )
}

export default GroupChat
