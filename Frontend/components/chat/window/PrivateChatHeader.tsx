'use client'
import React from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PrivateChatHeaderProps } from '@/types/chat'
import { getUserInitials } from '@/utils/avatarUtils'

const PrivateChatHeader: React.FC<PrivateChatHeaderProps> = ({
  conversationType,
  participantId,
  participantData,
  participantName,
  isConnected,
  typingUsers,
  getParticipantStatus,
  formatLastOnlineTime,
  hideHeader,
  onClose
}) => {
  const router = useRouter()

  if (hideHeader) return null

  return (
    <motion.div
      className="px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-xl relative"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
    >
      <div className="flex items-center space-x-4 relative z-10">
        {}
        <motion.div
          className={`relative ${conversationType === 'private' && participantId ? 'cursor-pointer' : ''}`}
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onClick={() => {
            if (conversationType === 'private' && participantId) {
              router.push(`/profile/${participantId}`)
            }
          }}
        >
          {conversationType === 'private' && participantData?.avatar ? (
            <Image
              src={participantData.avatar}
              alt={participantData.first_name + ' ' + participantData.last_name}
              width={56}
              height={56}
              className={`w-14 h-14 rounded-full object-cover shadow-2xl ring-2 ring-white/30 ${
                conversationType === 'private' && participantId ? 'hover:ring-emerald-400/60 hover:shadow-emerald-400/20' : ''
              } transition-all duration-300 hover:shadow-2xl`}
            />
          ) : (
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold shadow-2xl ring-2 ring-white/30 ${
              conversationType === 'private' && participantId ? 'hover:ring-emerald-400/60 hover:shadow-emerald-400/20' : ''
            } transition-all duration-300 hover:shadow-2xl hover:scale-105`}>
              {conversationType === 'private' ? (participantData ? getUserInitials(participantData) : participantName[0].toUpperCase()) : '#'}
            </div>
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Enhanced Username */}
          <motion.h1
            className={`text-2xl font-bold truncate leading-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent ${
              conversationType === 'private' && participantId
                ? 'cursor-pointer hover:from-emerald-300 hover:to-teal-300 transition-all duration-300'
                : ''
            }`}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
            onClick={() => {
              if (conversationType === 'private' && participantId) {
                router.push(`/profile/${participantId}`)
              }
            }}
          >
            {conversationType === 'private' && participantData
              ? `${participantData.first_name} ${participantData.last_name}`.trim()
              : participantName}
          </motion.h1>

          {/* Enhanced Status */}
          <motion.div
            className="flex items-center space-x-3 mt-2"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4, ease: [0.23, 1, 0.320, 1] }}
          >
            {/* Typing indicator for private chats */}
            {conversationType === 'private' && typingUsers.length > 0 ? (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300">
                <div className="flex space-x-1">
                  <motion.div
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
                <span className="text-xs font-semibold">typing...</span>
              </div>
            ) : (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full backdrop-blur-sm border ${
                conversationType === 'private' && participantId
                  ? (getParticipantStatus() === 'online' ? 'bg-green-500/20 border-green-400/30 text-green-300' :
                     getParticipantStatus() === 'busy' ? 'bg-red-500/20 border-red-400/30 text-red-300' :
                     getParticipantStatus() === 'away' ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300' :
                     'bg-gray-500/20 border-gray-400/30 text-gray-300')
                  : (isConnected ? 'bg-green-500/20 border-green-400/30 text-green-300' : 'bg-red-500/20 border-red-400/30 text-red-300')
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  conversationType === 'private' && participantId
                    ? (getParticipantStatus() === 'online' ? 'bg-green-400 shadow-green-400/50' :
                       getParticipantStatus() === 'busy' ? 'bg-red-400 shadow-red-400/50' :
                       getParticipantStatus() === 'away' ? 'bg-yellow-400 shadow-yellow-400/50' :
                       'bg-gray-400 shadow-gray-400/50')
                    : (isConnected ? 'bg-green-400 shadow-green-400/50' : 'bg-red-400 shadow-red-400/50')
                } shadow-lg`} />
                <span className="text-xs font-semibold">
                  {conversationType === 'private' && participantId
                    ? (getParticipantStatus() === 'online' ? 'Online' :
                       getParticipantStatus() === 'busy' ? 'Busy' :
                       getParticipantStatus() === 'away' ? 'Away' :
                       participantData?.last_status_change ? formatLastOnlineTime(participantData.last_status_change) : 'Offline')
                    : (isConnected ? 'Connected' : 'Disconnected')
                  }
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="flex items-center space-x-2 relative z-10">
        {/* Enhanced Close button */}
        {onClose && (
          <motion.button
            onClick={onClose}
            className="p-3 text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 rounded-2xl border border-white/20 hover:border-red-400/30 transition-all duration-300 group backdrop-blur-sm"
            title="Close chat"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default PrivateChatHeader