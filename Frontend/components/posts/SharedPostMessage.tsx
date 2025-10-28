'use client'
import React from 'react'
import { Heart, MessageSquare, Send } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getAvatarUrl, getUserInitials } from '@/utils/avatarUtils'
import { SharedPostMessageProps } from '@/types/posts'

const SharedPostMessage: React.FC<SharedPostMessageProps> = ({ sharedPost, isCurrentUser, messageId, messageCreatedAt, canDelete = false, onDeleteClick }) => {
  const router = useRouter()

  
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

  const formatMessageTime = (dateString: string) => {
    const date = parseDate(dateString)
    if (isNaN(date.getTime()) || date.getTime() === 0) return ''
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <div className={`w-full max-w-md ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}>
      {/* Shared Post Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
          <Send className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-xs font-medium text-white/70">
          Shared a post
        </span>
        <span className="text-xs text-white/50">·</span>
        <span className="text-xs text-white/60">
          {formatMessageTime(messageCreatedAt)}
        </span>
      </div>

      {/* Post Content Container */}
      <motion.div
        className={`relative rounded-xl p-4 border transition-all duration-300 hover:shadow-lg cursor-pointer bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:from-white/15 hover:to-white/10 ${
          isCurrentUser ? 'rounded-br-lg' : 'rounded-bl-lg'
        }`}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.2 }}
        onClick={() => router.push(`/post/${sharedPost.id}`)}
      >
        {/* Message menu button - positioned outside container in top right */}
        {canDelete && onDeleteClick && (
          <motion.button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDeleteClick(messageId, e)
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
        {/* Post Header */}
        <div className="flex items-start space-x-3 mb-3">
          {/* Author Avatar */}
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/profile/${sharedPost.user.id}`)
            }}
          >
            {sharedPost.user.avatar && getAvatarUrl(sharedPost.user.avatar) ? (
              <div className="relative">
                <Image
                  src={getAvatarUrl(sharedPost.user.avatar)!}
                  alt={`${sharedPost.user.first_name} ${sharedPost.user.last_name}`}
                  width={36}
                  height={36}
                  unoptimized={true}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white/20">
                {getUserInitials(sharedPost.user)}
              </div>
            )}
          </motion.div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <motion.h4
                className="font-semibold text-white text-sm truncate hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/profile/${sharedPost.user.id}`)
                }}
              >
                {sharedPost.user.first_name} {sharedPost.user.last_name}
              </motion.h4>
              {sharedPost.user.nickname && (
                <span className="text-xs text-white/60 truncate">
                  @{sharedPost.user.nickname}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
            {sharedPost.content}
          </p>
        </div>

        {/* Post Image */}
        {sharedPost.image_url && (
          <div className="mb-3 flex justify-center">
            <motion.div
              className="inline-block rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={sharedPost.image_url.startsWith('http')
                  ? sharedPost.image_url
                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${sharedPost.image_url}`
                }
                alt="Shared post image"
                width={400}
                height={250}
                unoptimized={true}
                className="w-full h-auto max-h-48 object-cover"
              />
            </motion.div>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center space-x-4">
            {/* Comments */}
            <motion.button
              className="flex items-center space-x-1 text-white/70 hover:text-white transition-colors group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">{sharedPost.comment_count}</span>
            </motion.button>

            {/* Likes */}
            <motion.button
              className="flex items-center space-x-1 text-white/70 hover:text-white transition-colors group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">{sharedPost.like_count}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SharedPostMessage