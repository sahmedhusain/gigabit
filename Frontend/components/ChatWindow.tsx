'use client'
import React, { useState, useRef } from 'react'
import { X, Send, Smile, Paperclip, Image, Check, CheckCheck, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRealTimeMessages, useTypingIndicator, useConnectionStatus, useOnlineStatus } from '@/hooks'

interface ChatWindowProps {
  conversationId: number
  conversationType: 'private' | 'group'
  participantId?: number
  participantName: string
  onClose: () => void
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  conversationType,
  participantId,
  participantName,
  onClose
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  // Real-time messaging integration
  const {
    messages,
    sendMessage: sendRealTimeMessage,
    isLoading,
    fetchConversationMessages
  } = useRealTimeMessages()

  // Typing indicator integration
  const {
    typingUsers,
    startTyping
  } = useTypingIndicator(conversationId)

  // Connection status monitoring
  const { isConnected, connectionQuality } = useConnectionStatus()
  const { isUserOnline } = useOnlineStatus()

  // Load conversation messages when component mounts or conversation changes
  React.useEffect(() => {
    if (conversationId && conversationType) {
      fetchConversationMessages(conversationId, conversationType, participantId)
    }
  }, [conversationId, conversationType, participantId, fetchConversationMessages])

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !isConnected) return

    try {
      let messageContent = newMessage.trim()
      let messageType: 'text' | 'image' | 'file' = 'text'

      if (selectedFile) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })

        if (uploadResponse.ok) {
          messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file'
          if (!messageContent) {
            messageContent = selectedFile.name
          }
        } else {
          console.error('Failed to upload file')
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      await sendRealTimeMessage(
        conversationId,
        messageContent,
        messageType,
        conversationType === 'private' ? participantId : undefined,
        conversationType === 'group' ? conversationId : undefined
      )

      setNewMessage('')
      setSelectedFile(null)
    } catch (error) {
      console.error('Error sending message:', error)
      setIsUploading(false)
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

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const renderMessageStatus = (status?: string) => {
    if (!status) return null

    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-white/50" />
      case 'sent':
        return <Check className="w-3 h-3 text-white/50" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-white/50" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-400" />
      default:
        return null
    }
  }

  const renderSimpleMessageContent = (message: unknown) => {
    if (message && typeof message === 'object' && 'content' in message) {
  const content = (message as { content?: unknown }).content
      if (typeof content === 'string') {
        return <div className="text-sm">{content || 'No content'}</div>
      }
      // fallback for non-string content
      return <div className="text-sm">{String(content ?? 'No content')}</div>
    }

    // Unknown message shape
    return <div className="text-sm">No content</div>
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-white text-xl font-bold">{participantName}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                conversationType === 'private' && participantId 
                  ? (isUserOnline(participantId) ? 'bg-green-500' : 'bg-gray-500') 
                  : (isConnected ? 'bg-green-500' : 'bg-red-500')
              }`}></div>
              <span className="text-xs text-white/60">
                {conversationType === 'private' && participantId 
                  ? (isUserOnline(participantId) ? 'Online' : 'Offline') 
                  : (isConnected ? 'Connected' : 'Disconnected')
                }
                {connectionQuality && ` • ${connectionQuality}`}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          title="Close chat"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/60 text-lg">Loading messages...</div>
            </div>
          ) : (
            <>
              {Array.from(messages.get(conversationId) || []).length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-white/40 text-6xl mb-4">💬</div>
                    <div className="text-white/60 text-lg">No messages yet</div>
                    <div className="text-white/40 text-sm mt-2">Start the conversation!</div>
                    <div className="text-white/30 text-xs mt-4">
                      Conversation ID: {conversationId}<br/>
                      Messages count: {Array.from(messages.get(conversationId) || []).length}
                    </div>
                  </div>
                </div>
              ) : (
                Array.from(messages.get(conversationId) || []).map((message) => {
                  console.log('Rendering message:', message)
                  return (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                        message.sender_id === user?.id
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      {conversationType === 'group' && message.sender_id !== user?.id && (
                        <div className="text-xs text-white/60 mb-2 font-medium">
                          {message.sender.first_name} {message.sender.last_name}
                        </div>
                      )}
                      {renderSimpleMessageContent(message)}
                      <div className={`flex items-center justify-between mt-2 ${
                        message.sender_id === user?.id ? 'text-white/80' : 'text-white/60'
                      }`}>
                        <span className="text-xs">{formatTime(message.created_at)}</span>
                        {message.sender_id === user?.id && renderMessageStatus('sent')}
                      </div>
                    </div>
                  </div>
                  )
                })
              )}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150"></div>
                      </div>
                      <span className="text-white/60 text-sm">
                        {conversationType === 'group' && typingUsers.length > 0
                          ? `${typingUsers.map(u => u.username || 'User').join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`
                          : 'Someone is typing...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
      </div>

      {/* Input */}
      <div className="bg-white/5 backdrop-blur-xl border-t border-white/20 p-6 flex-shrink-0">
        {/* Selected File Display */}
        {selectedFile && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedFile.type.startsWith('image/') ? (
                  <Image className="w-5 h-5 text-white/70" aria-label="Image file" />
                ) : (
                  <Paperclip className="w-5 h-5 text-white/70" />
                )}
                <span className="text-white/80 text-sm truncate">{selectedFile.name}</span>
                <span className="text-white/50 text-xs">
                  ({((selectedFile as File).size / 1024 / 1024).toFixed(1)}MB)
                </span>
              </div>
              <button
                onClick={removeSelectedFile}
                className="p-2 text-white/60 hover:text-white transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-4">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            className="hidden"
            title="Attach file"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${conversationType === 'group' ? `#${participantName}` : participantName}...`}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-24 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none min-h-[44px] max-h-32 text-sm overflow-y-auto"
              rows={1}
            />
            
            {/* Emoji Picker Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-16 top-1/2 transform -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || !isConnected || isUploading}
            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="Send message"
          >
            {isUploading ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full right-6 mb-4 z-50">
            <div className="bg-white/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl p-3">
              <div className="grid grid-cols-8 gap-2 max-w-sm">
                {['😀', '😂', '❤️', '👍', '👎', '🔥', '💯', '🎉', '🤔', '😢', '😮', '🙌', '👏', '💪', '🤝', '✨'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-10 h-10 hover:bg-gray-100 rounded-lg flex items-center justify-center text-xl transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(newMessage.length > 0 || selectedFile) && (
          <div className="text-xs text-white/50 mt-3 text-right">
            Press Enter to send • Shift+Enter for new line
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatWindow
