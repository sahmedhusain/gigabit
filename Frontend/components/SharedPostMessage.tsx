'use client'
import React from 'react'
import { Globe, EyeOff, Lock, User as UserIcon, Heart, MessageSquare, Send } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getAvatarUrl } from '@/utils/avatarUtils'

interface SharedPostMessageProps {
  sharedPost: {
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
    }
    like_count: number
    comment_count: number
    share_count: number
  }
  isCurrentUser: boolean
  messageId: number
  messageCreatedAt: string
}

const SharedPostMessage: React.FC<SharedPostMessageProps> = ({ sharedPost, isCurrentUser, messageId, messageCreatedAt }) => {
  const router = useRouter()

  // Parse various timestamp formats robustly: ISO strings, milliseconds, or seconds
  const parseDate = (value: string | number | undefined | null): Date => {
    if (!value && value !== 0) return new Date(0)
    const raw = typeof value === 'number' ? value : String(value).trim()

    // If purely numeric string, attempt to detect units (seconds, milliseconds, microseconds)
    if (/^\d+$/.test(String(raw))) {
      const n = Number(raw)
      // Try as milliseconds first
      const asMs = new Date(n)
      if (asMs.getFullYear() >= 2000) return asMs

      // Try as seconds
      const asSeconds = new Date(n * 1000)
      if (asSeconds.getFullYear() >= 2000) return asSeconds

      // Try as microseconds (divide by 1000)
      const asMicros = new Date(Math.floor(n / 1000))
      if (asMicros.getFullYear() >= 2000) return asMicros

      // Fallback: prefer asSeconds if it looks reasonable, else asMs
      if (asSeconds.getTime() !== 0) return asSeconds
      // Log suspicious value
      console.warn('parseDate: suspicious numeric date value', value, '->', asMs)
      return asMs
    }

    // Fallback: let Date parse ISO-like strings
    const d = new Date(String(raw))
    if (isNaN(d.getTime())) {
      // If parsing failed, log and return epoch 0
      console.warn('parseDate: failed to parse date', value)
      return new Date(0)
    }
    return d
  }

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-3 h-3" />
      case 'followers':
        return <EyeOff className="w-3 h-3" />
      case 'friends':
        return <Lock className="w-3 h-3" />
      case 'listed':
        return <UserIcon className="w-3 h-3" />
      default:
        return <Globe className="w-3 h-3" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatMessageTime = (dateString: string) => {
    const date = parseDate(dateString)
    if (isNaN(date.getTime()) || date.getTime() === 0) return ''
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <motion.div
      className={`relative px-5 py-4 rounded-2xl shadow-xl backdrop-blur-lg border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
        isCurrentUser
          ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-emerald-400/40 rounded-br-lg shadow-emerald-500/20'
          : 'bg-gradient-to-br from-white/15 to-white/10 text-white border-white/25 rounded-bl-lg hover:from-white/20 hover:to-white/15 shadow-white/10'
      }`}
      data-message-id={messageId}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/post/${sharedPost.id}`)}
    >
      {/* Shared Post Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
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
        className={`rounded-xl p-4 border transition-all duration-300 ${
          isCurrentUser
            ? 'bg-white/10 border-white/20 hover:bg-white/15'
            : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-400/20 hover:from-emerald-500/15 hover:to-teal-500/15'
        }`}
        whileHover={{ y: -1 }}
      >
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
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white/20">
                {sharedPost.user.first_name[0]}{sharedPost.user.last_name[0]}
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

            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-white/60">
                {formatTimeAgo(sharedPost.created_at)}
              </span>
              <span className="text-xs text-white/40">·</span>
              <div className="flex items-center space-x-1 text-white/60">
                {getPrivacyIcon(sharedPost.privacy)}
                <span className="text-xs capitalize">{sharedPost.privacy}</span>
              </div>
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
                className="w-full h-auto max-h-48 object-cover"
                unoptimized={sharedPost.image_url.includes('/svg')}
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
              className={`flex items-center space-x-1 transition-colors group ${
                sharedPost.like_count > 0 ? 'text-red-400' : 'text-white/70 hover:text-red-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                sharedPost.like_count > 0 ? 'fill-current' : ''
              }`} />
              <span className="text-xs font-medium">{sharedPost.like_count}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Message tail */}
      <div className={`absolute bottom-0 ${
        isCurrentUser
          ? '-right-2 border-l-emerald-400 border-l-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
          : '-left-2 border-r-white/20 border-r-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
      }`}></div>

      {/* Hover effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 rounded-2xl"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}

export default SharedPostMessage