'use client'
import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import ChatWindow from '@/components/ChatWindow'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages'
import { api } from '@/lib/api'
import { ArrowLeft, MessageCircle, Users, Search, Plus } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

interface Conversation {
  id: number
  type: 'private' | 'group'
  participant?: {
    id: number
    first_name: string
    last_name: string
    avatar?: string
    nickname?: string
  }
  group?: {
    id: number
    title: string
    description?: string
  }
  last_message?: {
    content: string
    created_at: string
  }
  unread_count: number
  updated_at: string
}

function DirectMessagesPage() {
  const { user } = useAuth()
  const { isConnected } = useWebSocket()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)

  // Real-time messaging
  const {
    messages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    isConnected: messagesConnected
  } = useRealTimeMessages()

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const response = await api.getConversations()
      setConversations(response.conversations || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    // Mark as read when opening
    if (conversation.unread_count > 0) {
      markAsRead(conversation.id)
    }
  }

  const handleCloseChat = () => {
    setSelectedConversation(null)
  }

  const handleStartDirectMessage = (userId: number) => {
    // For now, we'll create a temporary conversation object
    // In a real implementation, you'd fetch or create the conversation from the backend
    const tempConversation: Conversation = {
      id: Date.now(), // Temporary ID
      type: 'private',
      participant: {
        id: userId,
        first_name: 'User', // You'd fetch the actual user data
        last_name: '',
        avatar: '/default-avatar.png'
      },
      last_message: undefined,
      unread_count: 0,
      updated_at: new Date().toISOString()
    }
    setSelectedConversation(tempConversation)
    setShowNewChat(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'private' && conversation.participant) {
      return `${conversation.participant.first_name} ${conversation.participant.last_name}`.trim() ||
             conversation.participant.nickname ||
             'Unknown User'
    } else if (conversation.type === 'group' && conversation.group) {
      return conversation.group.title
    }
    return 'Unknown'
  }

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'private' && conversation.participant?.avatar) {
      return conversation.participant.avatar
    } else if (conversation.type === 'group') {
      return '/group-avatar.png' // You can add a default group avatar
    }
    return '/default-avatar.png'
  }

  const filteredConversations = conversations.filter(conversation => {
    const name = getConversationName(conversation).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-white text-2xl font-bold">Direct Messages</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-white/60">
                    {isConnected ? 'Connected' : 'Disconnected'}
                    {totalUnreadCount > 0 && ` • ${totalUnreadCount} unread`}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg"
              aria-label="Start new conversation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b border-white/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-white/60">Loading conversations...</div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <MessageCircle className="w-12 h-12 text-white/40 mb-4" />
                    <div className="text-white/60 text-lg mb-2">
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </div>
                    <div className="text-white/40 text-sm">
                      {searchQuery ? 'Try a different search term' : 'Start a new conversation to get started'}
                    </div>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation)}
                      className={`p-4 border-b border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200 ${
                        selectedConversation?.id === conversation.id ? 'bg-white/20' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={getConversationAvatar(conversation)}
                            alt={getConversationName(conversation)}
                            className="w-12 h-12 rounded-full border-2 border-white/20"
                          />
                          {conversation.type === 'private' && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                          )}
                          {conversation.unread_count > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-semibold truncate">
                              {getConversationName(conversation)}
                            </h3>
                            <span className="text-white/50 text-xs">
                              {conversation.last_message ? formatTime(conversation.last_message.created_at) : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {conversation.type === 'group' && (
                              <Users className="w-3 h-3 text-white/50" />
                            )}
                            <p className="text-white/60 text-sm truncate">
                              {conversation.last_message?.content || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <ChatWindow
                  conversationId={selectedConversation.id}
                  conversationType={selectedConversation.type}
                  participantName={getConversationName(selectedConversation)}
                  participantId={selectedConversation.participant?.id}
                  onClose={handleCloseChat}
                />
              ) : (
                <div className="h-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex flex-col items-center justify-center text-center">
                  <MessageCircle className="w-16 h-16 text-white/40 mb-4" />
                  <h2 className="text-white text-xl font-semibold mb-2">Select a conversation</h2>
                  <p className="text-white/60 text-sm max-w-md">
                    Choose a conversation from the list to start messaging, or create a new chat to connect with someone.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Chat Modal - Placeholder for now */}
        {showNewChat && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full">
              <h3 className="text-white text-xl font-semibold mb-4">Start New Conversation</h3>
              <p className="text-white/60 text-sm mb-6">
                This feature is coming soon! For now, you can start conversations from the dashboard.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function ProtectedDirectMessages() {
  return (
    <ProtectedRoute>
      <DirectMessagesPage />
    </ProtectedRoute>
  )
}

export default ProtectedDirectMessages
