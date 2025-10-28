'use client'
import React from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { GroupChatHeaderProps } from '@/types/chat'
import { getAvatarUrl } from '@/utils/avatarUtils'

const GroupChatHeader: React.FC<GroupChatHeaderProps> = ({
  participantName,
  groupData,
  getOnlineGroupMembersCount,
  typingUsers,
  hideHeader,
  onClose,
  onInfoClick
}) => {
  
  const getGroupInitials = (groupName: string): string => {
    if (!groupName) return '??'
    const words = groupName.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  if (hideHeader) return null

  return (
    <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 shadow-xl relative">
      <div className="flex items-center space-x-4 relative z-10 flex-1 min-w-0">
        <motion.div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold shadow-2xl ring-2 ring-white/30 cursor-pointer overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onInfoClick}
          title="View group info"
        >
          {groupData?.avatar && getAvatarUrl(groupData.avatar) ? (
            <Image
              src={getAvatarUrl(groupData.avatar)!}
              alt={participantName}
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            getGroupInitials(participantName)
          )}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <motion.h1
              className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent leading-tight cursor-pointer hover:from-emerald-200 hover:to-white/90 transition-all duration-200"
              onClick={onInfoClick}
              whileHover={{ scale: 1.02 }}
              title="View group info"
            >
              {participantName}
            </motion.h1>
            {/* Online users count - inline and smaller */}
            {getOnlineGroupMembersCount() > 0 && (
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-green-500/20 border-green-400/30 text-green-300 border">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-green-400/50 shadow-lg animate-pulse" />
                <span className="text-xs font-medium">{getOnlineGroupMembersCount()}</span>
              </div>
            )}
          </div>
          {/* Group description */}
          {groupData?.description && (
            <motion.p
              className="text-sm text-white/60 mt-1 leading-relaxed cursor-pointer hover:text-white/80 transition-colors duration-200"
              onClick={onInfoClick}
              title="View group info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {groupData.description}
            </motion.p>
          )}
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <motion.div
              className="flex items-center space-x-2 mt-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 backdrop-blur-sm">
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
                <span className="text-xs font-medium">
                  {typingUsers.length === 1
                    ? `${typingUsers[0].username || 'Someone'} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {onClose && (
        <motion.button
          onClick={onClose}
          className="p-3 text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 rounded-2xl border border-white/20 hover:border-red-400/30 transition-all duration-300 group backdrop-blur-sm relative z-10 ml-4"
          title="Close chat"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </motion.button>
      )}
    </div>
  )
}

export default GroupChatHeader