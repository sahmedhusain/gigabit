'use client'
import React from 'react'
import { ChevronDown } from 'lucide-react'
import { MessageRounded } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { User } from '@/lib/api'
import MessageRenderer from '../messages/MessageRenderer'

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

interface UnreadMessagesInfo {
  hasUnread: boolean
  firstUnreadMessage: Message | null
  unreadCount: number
}

interface MessagesAreaProps {
  messages: Message[]
  effectiveConversationId: number
  conversationType: 'private' | 'group'
  user: User | null
  isLoading: boolean
  isLoadingMore: Map<number, boolean>
  isLoadingHistorical: boolean
  hasMoreMessages: Map<number, boolean>
  getUnreadMessagesInfo: () => UnreadMessagesInfo
  onMessageMenuOpen: (messageId: number, event: React.MouseEvent) => void
  onImagePreviewOpen: (imageUrl: string) => void
  canDeleteMessage: (message: Message) => boolean
  onLoadPreviousMessages: () => void
  onScroll: () => void
  participantData: User | null
  participantName: string
}

const MessagesArea: React.FC<MessagesAreaProps> = ({
  messages,
  effectiveConversationId,
  conversationType,
  user,
  isLoading,
  isLoadingMore,
  isLoadingHistorical,
  hasMoreMessages,
  getUnreadMessagesInfo,
  onMessageMenuOpen,
  onImagePreviewOpen,
  canDeleteMessage,
  onLoadPreviousMessages,
  onScroll,
  participantData,
  participantName
}) => {
  return (
    <motion.div
      className="flex-1 overflow-y-scroll scrollbar-hide px-6 py-4 space-y-4 min-h-0 transition-colors duration-200 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.23, 1, 0.320, 1] }}
      onScroll={onScroll}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
        {/* Load Previous Messages Button */}
            {hasMoreMessages.get(effectiveConversationId) && !isLoadingMore.get(effectiveConversationId) && messages.length > 0 && !isLoadingHistorical && (
          <motion.div
            className="flex justify-center py-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={onLoadPreviousMessages}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 backdrop-blur-sm border border-white/20 rounded-xl text-white/80 hover:text-white transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Load previous messages"
            >
              <motion.div
                animate={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">Load Previous Messages</span>
            </motion.button>
          </motion.div>
        )}

        {isLoading ? (
          <motion.div
            className="flex items-center justify-center h-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full mx-auto mb-4"
              />
              <div className="text-white/60 text-lg">Loading messages...</div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Loading more indicator */}
            {isLoadingMore.get(effectiveConversationId) && (
              <motion.div
                className="flex items-center justify-center py-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center space-x-2 text-white/60">
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white/60 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-sm">Loading more messages...</span>
                </div>
              </motion.div>
            )}

            {messages.length === 0 ? (
              <motion.div
                className="flex items-center justify-center h-full"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1] }}
              >
                <div className="text-center max-w-md mx-auto">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-6xl mb-6 filter drop-shadow-lg"
                  >
                  <MessageRounded className="w-16 h-16 text-white/40 mx-auto mb-6" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-3">
                      No messages yet
                    </h3>
                    <p className="text-white/60 text-base mb-6 leading-relaxed">
                      Start the conversation with {conversationType === 'private' && participantData
                        ? `${participantData.first_name} ${participantData.last_name}`.trim()
                        : conversationType === 'group' ? `#${participantName}` : participantName}!
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <MessageRenderer
                messages={messages}
                conversationType={conversationType}
                user={user}
                getUnreadMessagesInfo={getUnreadMessagesInfo}
                onMessageMenuOpen={onMessageMenuOpen}
                onImagePreviewOpen={onImagePreviewOpen}
                canDeleteMessage={canDeleteMessage}
              />
            )}
          </>
        )}
    </motion.div>
  )
}

export default MessagesArea