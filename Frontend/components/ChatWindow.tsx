'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useWebSocket } from '@/context/WebSocketContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { X, Send, Smile } from 'lucide-react'

interface Message {
  id: number
  content: string
  sender_id: number
  sender_name: string
  created_at: string
  is_own: boolean
}

interface ChatWindowProps {
  conversationId: number
  conversationType: 'private' | 'group'
  participantName: string
  onClose: () => void
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  conversationType,
  participantName,
  onClose
}) => {
  const { user } = useAuth()
  const { isConnected, addMessageListener, sendMessage } = useWebSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load chat messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true)
        // Load real messages from API
        let messagesData: Message[] = []
        
        if (conversationType === 'private') {
          // For private conversations, we need to extract user ID from participant name
          // This is a temporary solution - ideally we'd pass the user ID directly
          const response = await fetch(`http://localhost:8080/api/messages/private/${conversationId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          if (response.ok) {
            const data = await response.json()
            messagesData = data.messages?.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sender_id: msg.sender_id,
              sender_name: msg.sender_name || 'Unknown',
              created_at: msg.created_at,
              is_own: msg.sender_id === user?.id
            })) || []
          }
        } else {
          // Group messages
          const response = await fetch(`http://localhost:8080/api/messages/group/${conversationId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          if (response.ok) {
            const data = await response.json()
            messagesData = data.messages?.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sender_id: msg.sender_id,
              sender_name: msg.sender_name || 'Unknown',
              created_at: msg.created_at,
              is_own: msg.sender_id === user?.id
            })) || []
          }
        }
        
        setMessages(messagesData)
      } catch (error) {
        console.error('Error loading messages:', error)
        setMessages([]) // Set empty array on error
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [conversationId, user, conversationType])

  // WebSocket message listener
  useEffect(() => {
    if (!isConnected) return

    const removeListener = addMessageListener((wsMessage) => {
      if (wsMessage.type === 'message' && wsMessage.data.conversation_id === conversationId) {
        const newMsg: Message = {
          id: wsMessage.data.id || Date.now(),
          content: wsMessage.data.content,
          sender_id: wsMessage.data.sender_id,
          sender_name: wsMessage.data.sender_name || 'Unknown',
          created_at: wsMessage.data.created_at || wsMessage.timestamp,
          is_own: wsMessage.data.sender_id === user?.id
        }
        
        setMessages(prev => [...prev, newMsg])
      } else if (wsMessage.type === 'typing' && wsMessage.data.conversation_id === conversationId) {
        setIsTyping(wsMessage.data.is_typing && wsMessage.data.sender_id !== user?.id)
      }
    })

    return removeListener
  }, [isConnected, addMessageListener, conversationId, user?.id])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return

    try {
      // Send via WebSocket for real-time delivery
      sendMessage({
        type: 'message',
        data: {
          conversation_id: conversationId,
          content: newMessage,
          conversation_type: conversationType
        }
      })

      // Add to local state immediately for better UX
      const tempMessage: Message = {
        id: Date.now(),
        content: newMessage,
        sender_id: user?.id || 0,
        sender_name: user ? `${user.first_name} ${user.last_name}` : 'You',
        created_at: new Date().toISOString(),
        is_own: true
      }
      
      setMessages(prev => [...prev, tempMessage])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTyping = () => {
    if (!isConnected) return

    // Send typing indicator
    sendMessage({
      type: 'typing',
      data: {
        conversation_id: conversationId,
        is_typing: true
      }
    })

    // Clear previous timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendMessage({
        type: 'typing',
        data: {
          conversation_id: conversationId,
          is_typing: false
        }
      })
    }, 2000)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">{participantName}</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-white/60">{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60">Loading messages...</div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-2xl ${
                    message.is_own
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className={`text-xs mt-1 ${message.is_own ? 'text-white/80' : 'text-white/60'}`}>
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow