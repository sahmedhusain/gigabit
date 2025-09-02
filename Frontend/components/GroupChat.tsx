'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { api, API_BASE_URL } from '@/lib/api'
import ChatWindow from '@/components/ChatWindow'
import { MessageCircle, Users, Hash, User } from 'lucide-react'

interface GroupChatProps {
  groupId: number
  groupTitle: string
}

const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupTitle }) => {
  const { user } = useAuth()
  const { isConnected, onlineUsers } = useWebSocket()
  const [showChat, setShowChat] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [onlineMemberCount, setOnlineMemberCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState<any[]>([])

  useEffect(() => {
    // Fetch member count
    const fetchMemberCount = async () => {
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
    }

    fetchMemberCount()
  }, [groupId])

  useEffect(() => {
    // Count online members (simplified - in a real app you'd check which group members are online)
    setOnlineMemberCount(Math.min(onlineUsers.length, memberCount))
  }, [onlineUsers, memberCount])

  useEffect(() => {
    // Fetch recent messages when chat is not open
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

  const handleOpenChat = () => {
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
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {!showChat && (
          <button
            onClick={handleOpenChat}
            className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Open Chat
          </button>
        )}
      </div>

      {/* Chat Content */}
      <div className="flex-1 relative">
        {showChat ? (
          <div className="absolute inset-0 z-10">
            <ChatWindow
              conversationId={groupId}
              conversationType="group"
              participantName={groupTitle}
              onClose={handleCloseChat}
            />
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
                  {recentMessages.slice(0, 3).map((message, index) => (
                    <div key={message.id || index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {message.sender?.first_name?.[0] || message.sender?.nickname?.[0] || 'U'}
                          </span>
                        </div>
                        <span className="text-white/80 text-sm font-medium">
                          {message.sender?.first_name && message.sender?.last_name
                            ? `${message.sender.first_name} ${message.sender.last_name}`
                            : message.sender?.nickname || 'Unknown User'}
                        </span>
                        <span className="text-white/50 text-xs">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm truncate">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleOpenChat}
                  className="flex items-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200 mx-auto"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {recentMessages.length > 0 ? 'Continue Chat' : 'Start Chatting'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupChat
