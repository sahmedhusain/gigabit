'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { Message } from '@/types/hooks'
import { getUserInitials } from '@/utils/avatarUtils'
import Image from 'next/image'
import SharedPostMessage from '../../posts/SharedPostMessage'
import { MessageItemProps } from '@/types/groups'

export default function MessageItem({
  message,
  isCurrentUser,
  showAvatar,
  showSenderName,
  showDateSeparator,
  isFirstUnreadMessage,
  unreadCount,
  canDelete,
  onDeleteClick,
  onImageClick,
  formatDateSeparator,
  formatTime,
  parseDate,
}: MessageItemProps) {
    const createdAt = message.created_at
  const parsedDate = parseDate(createdAt)
  const validCreatedAt = isNaN(parsedDate.getTime()) || parsedDate.getTime() === 0 ? new Date().toISOString() : createdAt

  return (
    <div key={message.id} className="space-y-3">
      {}
      {showDateSeparator && (
        <motion.div
          className="flex items-center justify-center py-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
            <span className="text-xs text-white/60 font-medium">
              {formatDateSeparator(validCreatedAt)}
            </span>
          </div>
        </motion.div>
      )}

      {}
      {isFirstUnreadMessage && (
        <motion.div
          className="flex items-center justify-center py-4"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-sm rounded-full px-6 py-3 border border-blue-400/30 shadow-lg">
            <span className="text-sm text-blue-200 font-semibold">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
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
            className="flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {message.sender.avatar ? (
              <Image
                src={message.sender.avatar}
                alt={`${message.sender.first_name} ${message.sender.last_name}`}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-2 ring-white/10 hover:ring-emerald-400/50 transition-all duration-200">
                {getUserInitials(message.sender)}
              </div>
            )}
          </motion.div>
        )}

        {/* For shared posts, render without container */}
        {message.shared_post ? (
          <SharedPostMessage
            sharedPost={message.shared_post}
            isCurrentUser={isCurrentUser}
            messageId={message.id}
            messageCreatedAt={validCreatedAt}
            canDelete={canDelete}
            onDeleteClick={onDeleteClick}
          />
        ) : message.message_type === 'image' ? (
          <ImageMessage
            message={message}
            isCurrentUser={isCurrentUser}
            createdAt={validCreatedAt}
            onImageClick={onImageClick}
            canDelete={canDelete}
            onDeleteClick={onDeleteClick}
            formatTime={formatTime}
          />
        ) : (
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
            {/* Sender name for group chats */}
            {showSenderName && (
              <motion.span
                className="text-xs text-white/60 mb-2 px-3 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
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
              {canDelete && (
                <motion.button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDeleteClick(message.id, e)
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
                {message.content === "XdeletedbyuserX" || message.content === "This message was deleted" ? (
                  <div className="flex items-center space-x-2 text-white/50 italic">
                    <MessageSquare className="w-4 h-4" />
                    <span>Message has been deleted</span>
                  </div>
                ) : (
                  message.content
                )}
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
                  {formatTime(validCreatedAt)}
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


const ImageMessage: React.FC<{
  message: Message
  isCurrentUser: boolean
  createdAt: string
  onImageClick: (imageUrl: string) => void
  canDelete: boolean
  onDeleteClick: (messageId: number, event: React.MouseEvent) => void
  formatTime: (dateString: string | number) => string
}> = ({ message, isCurrentUser, createdAt, onImageClick, canDelete, onDeleteClick, formatTime }) => {

  const imageUrl = message.content.startsWith('http')
    ? message.content
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${message.content}`

  return (
    <div className={`w-full max-w-md ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}>
      {/* Image Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
          <MessageSquare className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-xs font-medium text-white/70">
          Shared an image
        </span>
        <span className="text-xs text-white/50">·</span>
        <span className="text-xs text-white/60">
          {formatTime(createdAt)}
        </span>
      </div>

      {/* Image Content Container */}
      <motion.div
        className={`relative rounded-xl p-4 border transition-all duration-300 hover:shadow-lg cursor-pointer bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:from-white/15 hover:to-white/10 ${
          isCurrentUser ? 'rounded-br-lg' : 'rounded-bl-lg'
        }`}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          e.stopPropagation()
          onImageClick(imageUrl)
        }}
      >
        {/* Message menu button - positioned outside container in top right */}
        {canDelete && onDeleteClick && (
          <motion.button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDeleteClick(message.id, e)
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
        {/* Message tail */}
        <div className={`absolute bottom-0 ${
          isCurrentUser
            ? '-right-2 border-l-emerald-400 border-l-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
            : '-left-2 border-r-white/20 border-r-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
        }`}></div>

        {/* Image */}
        <motion.div
          className="relative rounded-lg overflow-hidden bg-gradient-to-br from-white/10 to-white/5 max-w-xs"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Image
            src={imageUrl}
            alt="Shared image"
            width={400}
            height={300}
            unoptimized={true}
            className="w-full h-auto max-h-96 object-cover rounded-lg hover:brightness-110 transition-all duration-200"
            onLoad={() => {}}
            onError={() => {}}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg cursor-pointer pointer-events-none hover:pointer-events-auto"
               onClick={(e) => {
                 e.stopPropagation()
                 onImageClick(imageUrl)
               }}>
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}