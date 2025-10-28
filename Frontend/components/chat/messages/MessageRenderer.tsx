'use client'
import React from 'react'
import { MessageSquare } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { User } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { getAvatarUrl, getUserInitials } from '@/utils/avatarUtils'
import SharedPostMessage from './SharedPostMessage'
import ImageMessage from './ImageMessage'

interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  message_type: 'text' | 'image' | 'file'
  created_at: string
  is_read: boolean
  sender: {
    id: number
    first_name: string
    last_name: string
    avatar: string
  }
  shared_post?: {
    id: number
    user_id: number
    content: string
    image_url?: string
    privacy: string
    created_at: string
    user: {
      id: number
      email: string
      first_name: string
      last_name: string
      avatar?: string
      nickname?: string
      is_private?: boolean
    }
    like_count: number
    comment_count: number
    share_count: number
  }
}

interface MessageRendererProps {
  messages: Message[]
  conversationType: 'private' | 'group'
  user: User | null
  getUnreadMessagesInfo: () => { hasUnread: boolean; firstUnreadMessage: Message | null; unreadCount: number }
  onMessageMenuOpen: (messageId: number, event: React.MouseEvent) => void
  onImagePreviewOpen: (imageUrl: string) => void
  canDeleteMessage: (message: Message) => boolean
}


const parseDate = (value: string | number | undefined | null): Date => {
  if (!value && value !== 0) return new Date(0)
  const raw = typeof value === 'number' ? value : String(value).trim()

  
  if (/^\d+$/.test(String(raw))) {
    const n = Number(raw)
    
    const asMs = new Date(n)
    if (asMs.getFullYear() >= 2000) return asMs

    
    const asSeconds = new Date(n * 1000)
    if (asSeconds.getFullYear() >= 2000) return asSeconds

    
    const asMicros = new Date(Math.floor(n / 1000))
    if (asMicros.getFullYear() >= 2000) return asMicros

    
    if (asSeconds.getTime() !== 0) return asSeconds
    
    console.warn('parseDate: suspicious numeric date value', value, '->', asMs)
    return asMs
  }

  
  const d = new Date(String(raw))
  if (isNaN(d.getTime())) {
    
    console.warn('parseDate: failed to parse date', value)
    return new Date(0)
  }
  return d
}

const formatTime = (dateString: string | number) => {
  const date = parseDate(dateString)
  if (isNaN(date.getTime()) || date.getTime() === 0) return ''
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
}


const shouldShowDateSeparator = (message: Message, index: number, messages: Message[]): boolean => {
  if (index === 0) return true
  const prevMessage = messages[index - 1]
  if (!prevMessage) return true

  
  const getValidDate = (val: string | number | undefined) => {
    const d = parseDate(val)
    if (isNaN(d.getTime()) || d.getTime() === 0) return new Date()
    return d
  }

  const messageDate = getValidDate(message.created_at)
  const prevMessageDate = getValidDate(prevMessage.created_at)
  return messageDate.toDateString() !== prevMessageDate.toDateString()
}


const formatDateSeparator = (dateString: string | number): string => {
  const messageDate = parseDate(dateString)
  if (isNaN(messageDate.getTime()) || messageDate.getTime() === 0) return ''
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (messageDate.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return messageDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
}

const MessageRenderer: React.FC<MessageRendererProps> = ({
  messages,
  conversationType,
  user,
  getUnreadMessagesInfo,
  onMessageMenuOpen,
  onImagePreviewOpen,
  canDeleteMessage
}) => {
  const router = useRouter()

  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.sender_id === user?.id
    const showAvatar = conversationType === 'group' && !isCurrentUser
    const showSenderName = conversationType === 'group' && !isCurrentUser

    
    let createdAt = message.created_at
    const parsedDate = parseDate(createdAt)
    if (isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0) {
      console.warn('renderMessage: invalid or missing created_at, using now', message)
      createdAt = new Date().toISOString()
    }

    const showDateSeparator = shouldShowDateSeparator(message, index, messages)

    
    const unreadInfo = getUnreadMessagesInfo()
    const isFirstUnreadMessage = unreadInfo.hasUnread && unreadInfo.firstUnreadMessage?.id === message.id

return (
      <div key={message.id} className="space-y-3">
        {/* Date separator */}
        {showDateSeparator && (
          <motion.div
            className="flex items-center justify-center py-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <span className="text-xs text-white/60 font-medium">
                {formatDateSeparator(createdAt)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Unread messages separator */}
        {isFirstUnreadMessage && (
          <motion.div
            className="flex items-center justify-center py-4"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-sm rounded-full px-6 py-3 border border-blue-400/30 shadow-lg">
              <span className="text-sm text-blue-200 font-semibold">
                {unreadInfo.unreadCount} unread message{unreadInfo.unreadCount !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        )}

        {/* Enhanced Message Card */}
        <motion.div
          className={`flex items-end space-x-4 ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.320, 1] }}
          whileHover={{ scale: 1.01 }}
        >
          {/* Avatar for group chats */}
          {showAvatar && (
            <motion.div
              className="flex-shrink-0 cursor-pointer"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => {
                router.push(`/profile/${message.sender.id}`)
              }}
            >
              {(() => {
                const avatarUrl = message.sender.avatar ? getAvatarUrl(message.sender.avatar) : null;
                return avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${message.sender.first_name} ${message.sender.last_name}`}
                    width={40}
                    height={40}
                    unoptimized={avatarUrl.includes('/svg')}
                    className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200">
                    {getUserInitials(message.sender)}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* For shared posts, render without container */}
          {message.content === "XdeletedbyuserX" ? (
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
              {/* Sender name for group chats */}
              {showSenderName && (
                <motion.span
                  className="text-xs text-white/60 mb-2 px-3 font-medium cursor-pointer hover:text-emerald-300 transition-colors duration-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => {
                    window.location.href = `/profile/${message.sender.id}`
                  }}
                >
                  {message.sender.first_name} {message.sender.last_name}
                </motion.span>
              )}

              {/* Enhanced Message Bubble Card */}
              <motion.div
                className={`relative px-6 py-5 rounded-3xl shadow-2xl backdrop-blur-xl border-2 transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] group-hover:shadow-emerald-500/10 ${
                  isCurrentUser
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-emerald-400/50 rounded-br-xl shadow-emerald-500/30'
                    : 'bg-gradient-to-br from-white/20 to-white/15 text-white border-white/30 rounded-bl-xl hover:from-white/25 hover:to-white/20 shadow-white/20'
                }`}
                data-message-id={message.id}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Message content */}
                <div className="text-sm leading-relaxed break-words font-medium">
                  <div className="flex items-center space-x-2 text-white/50 italic">
                    <MessageSquare className="w-4 h-4" />
                    <span>Message has been deleted</span>
                  </div>
                </div>

                {/* Enhanced Message Footer */}
                <motion.div
                  className={`flex items-center justify-between mt-3 space-x-3 ${
                    isCurrentUser ? 'text-emerald-100' : 'text-white/70'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-xs opacity-80 font-medium">
                    {formatTime(createdAt)}
                  </span>
                </motion.div>

                {/* Enhanced Message Tail */}
                <div className={`absolute bottom-0 ${
                  isCurrentUser
                    ? '-right-3 border-l-emerald-400 border-l-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                    : '-left-3 border-r-white/30 border-r-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                }`}></div>

                {/* Enhanced Hover Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 rounded-3xl"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            </div>
          ) : message.shared_post ? (
            <SharedPostMessage
              sharedPost={message.shared_post}
              isCurrentUser={isCurrentUser}
              messageId={message.id}
              messageCreatedAt={createdAt}
              canDelete={canDeleteMessage(message)}
              onDeleteClick={onMessageMenuOpen}
            />
          ) : (message as Message).message_type === 'image' || message.content?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <ImageMessage
              message={message}
              isCurrentUser={isCurrentUser}
              createdAt={createdAt}
              onImageClick={onImagePreviewOpen}
              canDelete={canDeleteMessage(message)}
              onDeleteClick={onMessageMenuOpen}
            />
          ) : (
            /* Enhanced Message Content Card */
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
              {/* Sender name for group chats */}
              {showSenderName && (
                <motion.span
                  className="text-xs text-white/60 mb-2 px-3 font-medium cursor-pointer hover:text-emerald-300 transition-colors duration-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => {
                    window.location.href = `/profile/${message.sender.id}`
                  }}
                >
                  {message.sender.first_name} {message.sender.last_name}
                </motion.span>
              )}

              {/* Enhanced Message Bubble Card */}
              <motion.div
                className={`relative px-6 py-5 rounded-3xl shadow-2xl backdrop-blur-xl border-2 transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] group-hover:shadow-emerald-500/10 ${
                  isCurrentUser
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-emerald-400/50 rounded-br-xl shadow-emerald-500/30'
                    : 'bg-gradient-to-br from-white/20 to-white/15 text-white border-white/30 rounded-bl-xl hover:from-white/25 hover:to-white/20 shadow-white/20'
                }`}
                data-message-id={message.id}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Message menu button - positioned outside bubble in top right */}
                {isCurrentUser && canDeleteMessage(message) && (
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onMessageMenuOpen(message.id, e)
                    }}
                    className="absolute -top-4 -right-1 z-20 p-2 text-white/70 hover:text-white transition-all duration-200 rounded-full hover:bg-white/10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Message options"
                  >
                    <div className="flex space-x-0.5">
                      <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                      <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                      <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                    </div>
                  </motion.button>
                )}

                {/* Message content */}
                <div className="text-sm leading-relaxed break-words font-medium">
                  {message.content}
                </div>

                {/* Enhanced Message Footer */}
                <motion.div
                  className={`flex items-center justify-between mt-3 space-x-3 ${
                    isCurrentUser ? 'text-emerald-100' : 'text-white/70'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-xs opacity-80 font-medium">
                    {formatTime(createdAt)}
                  </span>
                </motion.div>

                {/* Enhanced Message Tail */}
                <div className={`absolute bottom-0 ${
                  isCurrentUser
                    ? '-right-3 border-l-emerald-400 border-l-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                    : '-left-3 border-r-white/30 border-r-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                }`}></div>

                {/* Enhanced Hover Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 rounded-3xl"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {messages.map((message, index) => renderMessage(message, index))}
    </>
  )
}

export default MessageRenderer