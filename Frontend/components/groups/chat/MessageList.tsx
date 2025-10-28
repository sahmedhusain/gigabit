'use client'
import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Message } from '@/types/hooks'
import MessageItem from './MessageItem'
import LoadMoreButton from './LoadMoreButton'
import EmptyState from './EmptyState'
import { MessageListProps } from '@/types/groups'

export default function MessageList({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  onDeleteClick,
  onImageClick,
  formatDateSeparator,
  formatTime,
  parseDate,
  unreadCount,
  lastReadMessageId,
  isGroupChat,
  canDeleteMessage
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const prevMessagesLengthRef = useRef<number>(0)

  
  useEffect(() => {
    // Only auto-scroll if user is near bottom and new messages were added
    const hasNewMessages = messages.length > prevMessagesLengthRef.current
    
    if (shouldAutoScroll && isNearBottom && hasNewMessages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
    
    prevMessagesLengthRef.current = messages.length
  }, [messages, shouldAutoScroll, isNearBottom])

  
  const checkScrollPosition = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const nearBottom = distanceFromBottom < 100 
      setIsNearBottom(nearBottom)
      setShouldAutoScroll(nearBottom)
    }
  }

  
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollPosition)
      return () => container.removeEventListener('scroll', checkScrollPosition)
    }
  }, [])

  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  
  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | null): boolean => {
    if (!previousMessage) return true

    const currentDate = parseDate(currentMessage.created_at)
    const previousDate = parseDate(previousMessage.created_at)

    return currentDate.toDateString() !== previousDate.toDateString()
  }

  
  const shouldShowAvatar = (currentMessage: Message, previousMessage: Message | null, isGroupChat: boolean, isCurrentUser: boolean): boolean => {
    // Never show avatar for current user's messages
    if (isCurrentUser) return false
    
    // Show avatar for all received messages in group chats
    if (isGroupChat) return true
    
    return false
  }

  
  const shouldShowSenderName = (currentMessage: Message, previousMessage: Message | null, isGroupChat: boolean, isCurrentUser: boolean): boolean => {
    // Never show sender name for current user's messages
    if (isCurrentUser) return false
    
    // Show sender name for all received messages in group chats
    if (isGroupChat) return true
    
    return false
  }

  
  const isFirstUnreadMessage = (message: Message, index: number): boolean => {
    if (unreadCount === 0 || !lastReadMessageId) return false

    
    const messageIndex = messages.findIndex(m => m.id === lastReadMessageId)
    return index === messageIndex + 1
  }

  if (messages.length === 0 && !isLoading) {
    return <EmptyState />
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="flex justify-center py-4">
          <LoadMoreButton onClick={onLoadMore} />
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <motion.div
          className="flex justify-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center space-x-2 text-white/60">
            <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
            <span className="text-sm">Loading messages...</span>
          </div>
        </motion.div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : null
            const isCurrentUser = message.sender.id === currentUserId
            const canDelete = canDeleteMessage(message)

            return (
              <MessageItem
                key={message.id}
                message={message}
                isCurrentUser={isCurrentUser}
                showAvatar={shouldShowAvatar(message, previousMessage, isGroupChat, isCurrentUser)}
                showSenderName={shouldShowSenderName(message, previousMessage, isGroupChat, isCurrentUser)}
                showDateSeparator={shouldShowDateSeparator(message, previousMessage)}
                isFirstUnreadMessage={isFirstUnreadMessage(message, index)}
                unreadCount={unreadCount}
                canDelete={canDelete}
                onDeleteClick={onDeleteClick}
                onImageClick={onImageClick}
                formatDateSeparator={formatDateSeparator}
                formatTime={formatTime}
                parseDate={parseDate}
              />
            )
          })}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {!isNearBottom && messages.length > 0 && (
        <motion.button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.button>
      )}
    </div>
  )
}