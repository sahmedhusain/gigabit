'use client'
import React, { useState, useRef } from 'react'
import { X, Send, Smile, Paperclip, Image, Check, CheckCheck, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRealTimeMessages, useTypingIndicator, useConnectionStatus } from '@/hooks'

interface Message {
  id: number | string
  content: string
  sender_id: number
  sender_name: string
  created_at: string
  is_own: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  type?: 'text' | 'image' | 'file'
  file_url?: string
  file_name?: string,
  sender: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  }
}

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
    isConnected: messagesConnected,
    isLoading
  } = useRealTimeMessages()

  // Typing indicator integration
  const {
    typingUsers,
    startTyping,
    stopTyping
  } = useTypingIndicator(conversationId)

  // Connection status monitoring
  const { isConnected, connectionQuality } = useConnectionStatus()

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
      let fileUrl = ''
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
          const uploadData = await uploadResponse.json()
          fileUrl = `/uploads/${uploadData.filename}`
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

  const renderSimpleMessageContent = (message: any) => {
    return <div className="text-sm">{message.content}</div>
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
          title="Close chat"
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
              {Array.from(messages.get(conversationId) || []).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-2xl ${
                      message.sender_id === user?.id
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    {conversationType === 'group' && message.sender_id !== user?.id && (
                      <div className="text-xs text-white/60 mb-1 font-medium">
                        {message.sender.first_name} {message.sender.last_name}
                      </div>
                    )}
                    {renderSimpleMessageContent(message)}
                    <div className={`flex items-center justify-between mt-1 ${
                      message.sender_id === user?.id ? 'text-white/80' : 'text-white/60'
                    }`}>
                      <span className="text-xs">{formatTime(message.created_at)}</span>
                      {message.sender_id === user?.id && renderMessageStatus('sent')}
                    </div>
                  </div>
                </div>
              ))}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-2">
                    <div className="flex items-center space-x-2">
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
      <div className="p-4 border-t border-white/20">
        {/* Selected File Display */}
        {selectedFile && (
          <div className="mb-3 p-2 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedFile?.type.startsWith('image/') ? (
                  <Image className="w-4 h-4 text-white/70" />
                ) : (
                  <Paperclip className="w-4 h-4 text-white/70" />
                )}
                <span className="text-white/80 text-sm truncate">{selectedFile?.name}</span>
                <span className="text-white/50 text-xs">
                  ({((selectedFile as File).size / 1024 / 1024).toFixed(1)}MB)
                </span>
              </div>
              <button
                onClick={removeSelectedFile}
                className="p-1 text-white/60 hover:text-white transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
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
            className="p-2 text-white/60 hover:text-white transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${conversationType === 'group' ? `#${participantName}` : participantName}...`}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 pr-20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 text-sm"
            />
            
            {/* Emoji Picker Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 text-white/60 hover:text-white transition-colors"
              title="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || !isConnected || isUploading}
            className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            {isUploading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-50">
            <div className="bg-white/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl p-2">
              <div className="grid grid-cols-8 gap-1 max-w-xs">
                {['😀', '😂', '❤️', '👍', '👎', '🔥', '💯', '🎉', '🤔', '😢', '😮', '🙌', '👏', '💪', '🤝', '✨'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(newMessage.length > 0 || selectedFile) && (
          <div className="text-xs text-white/50 mt-1 text-right">
            Press Enter to send
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatWindow
