import React, { type MouseEvent as ReactMouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, ShieldCheck, MoreHorizontal, VolumeOff } from 'lucide-react';
import Image from 'next/image';
import { ChatItem as ChatItemType } from '@/types/chat';
import { getGroupInitials } from '@/utils/avatarUtils';
import { getPrivateChatInitials, formatRelativeTime, formatLastMessagePreview, clampedPreview } from './ChatItemUtils';

interface ChatItemDisplayProps {
  item: ChatItemType;
  onClick: () => void;
  getUserStatus: (userId: number) => string;
  typingUsers?: string[];
  isMuted: boolean;
  hasUnread: boolean;
  hasUnreadTabContent: boolean;
  resolvedLastMessage: string;
  highlightStatus: boolean;
  lastMessageTimestamp: string | number | undefined | null;
  showAdminBadge: boolean;
  normalizedAvatar: string | null;
  resolvedUnread: number;
  isGroup: boolean;
  participantId?: number;
  gradient: string;
  hasTypingUsers: boolean;
  onMenuButtonClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export default function ChatItemDisplay({
  item,
  onClick,
  getUserStatus,
  typingUsers = [],
  isMuted,
  hasUnread,
  hasUnreadTabContent,
  resolvedLastMessage,
  highlightStatus,
  lastMessageTimestamp,
  showAdminBadge,
  normalizedAvatar,
  resolvedUnread,
  isGroup,
  participantId,
  gradient,
  hasTypingUsers,
  onMenuButtonClick,
  menuRef,
  buttonRef
}: ChatItemDisplayProps) {

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer"
      role="button"
      aria-label={`Open conversation ${item.name || ''}`}
    >
      {/* Background with animated gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}
        initial={false}
        animate={{ opacity: hasUnread ? 0.15 : 0 }}
      />

      {/* Main container */}
      <motion.div
        className={`relative flex items-center gap-4 p-3 md:p-4 bg-white/5 backdrop-blur-lg rounded-2xl transition-all duration-300 border ${hasUnread ? 'border-emerald-400/40 bg-emerald-500/5' : 'border-white/10 hover:bg-white/10 hover:border-white/20'} shadow-lg ${hasUnread ? 'hover:shadow-emerald-500/30' : 'hover:shadow-xl'} group-hover:shadow-emerald-500/10`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {hasUnread && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute -inset-x-20 -inset-y-10 bg-gradient-to-r from-transparent via-emerald-300/10 to-transparent animate-[shimmer_2s_infinite]" />
          </div>
        )}

        {/* Avatar with enhanced effects */}
        <div className="relative flex-shrink-0">
          {participantId ? (
            <div className={`w-14 h-14 rounded-full p-0.5 flex-shrink-0 transition-all duration-300 ${getUserStatus(participantId) === 'online' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
              getUserStatus(participantId) === 'busy' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                getUserStatus(participantId) === 'away' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                  'bg-gradient-to-r from-gray-400 to-gray-500'
              }`}>
              <motion.div
                className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                {normalizedAvatar ? (
                  <Image
                    src={normalizedAvatar}
                    alt={item.name || 'Avatar'}
                    width={52}
                    height={52}
                    className="w-full h-full object-cover rounded-full"
                  />
              ) : (
                <span className="text-white font-bold text-xl">
                  {getPrivateChatInitials(item.name)}
                </span>
              )}
              </motion.div>
            </div>
          ) : (
            <motion.div
              className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white/10 group-hover:ring-white/20 transition-all duration-300 overflow-hidden`}
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              {normalizedAvatar ? (
                <Image
                  src={normalizedAvatar}
                  alt={item.name || 'Group Avatar'}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {getGroupInitials(item.name || 'Group')}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Online status with pulse animation */}
          {participantId && (
            <motion.div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border-2 border-white flex items-center justify-center"
              animate={{ scale: getUserStatus(participantId) !== 'offline' ? [1, 1.2, 1] : 1 }}
            >
              <div className={`w-3 h-3 rounded-full ${
                getUserStatus(participantId) === 'online' ? 'bg-green-500' :
                getUserStatus(participantId) === 'busy' ? 'bg-red-500' :
                getUserStatus(participantId) === 'away' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`} />
            </motion.div>
          )}

          {/* Unread indicator */}
          <AnimatePresence>
            {hasUnread && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-full shadow-lg ring-2 ring-white/20 ${
                  resolvedUnread > 0
                    ? 'text-[10px] min-w-[20px] h-5 flex items-center justify-center px-1'
                    : 'w-3 h-3'
                }`}
              >
                {resolvedUnread > 0 ? (resolvedUnread > 99 ? '99+' : resolvedUnread) : ''}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Muted indicator */}
          {isMuted && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20"
            >
              <VolumeOff className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2 min-w-0 mb-0.5 md:mb-1">
            <motion.h3
              className="text-white font-semibold text-base md:text-lg truncate group-hover:text-emerald-300 transition-colors duration-300"
              layoutId={`chat-name-${item.id}`}
            >
              {item.name}
            </motion.h3>
            {/* Red dot indicator for unread tab content in groups */}
            {hasUnreadTabContent && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"
              />
            )}
            {/* Only show the Admin badge for group chats if current user is admin */}
            {showAdminBadge && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Admin
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <AnimatePresence mode="wait">
                {hasTypingUsers ? (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center space-x-2"
                  >
                    <div className="flex space-x-1">
                      <motion.div
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-emerald-400 text-sm italic">
                      {typingUsers.length === 1
                        ? `${typingUsers[0]} is typing...`
                        : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`
                      }
                    </span>
                  </motion.div>
                ) : (
                  <motion.p
                    key="message"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-[13px] md:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[22ch] md:max-w-[34ch] ${highlightStatus ? 'text-amber-200' : 'text-white/70'}`}
                  >
                    {clampedPreview(formatLastMessagePreview(resolvedLastMessage, item.lastMessageType))}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Message status for private chats */}
              {!isGroup && item.lastMessage && (
                <div className="text-white/40 flex items-center">
                  {item.lastMessageStatus === 'sending' && <Clock className="w-4 h-4 text-white/40" />}
                  {item.lastMessageStatus === 'sent' && <Check className="w-4 h-4 text-white/40" />}
                  {item.lastMessageStatus === 'delivered' && <Check className="w-4 h-4 text-white/40" />}
                  {item.lastMessageStatus === 'read' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
              )}

              {/* Timestamp centered vertically */}
              <div className="flex items-center space-x-1 text-white/50 text-[11px] md:text-xs">
                <Clock className="w-3 h-3" />
                <span className="tabular-nums">{formatRelativeTime(lastMessageTimestamp)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          initial={false}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        {/* Three-dots menu button */}
        <div
          className="absolute top-2 right-2 z-10"
          ref={menuRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <motion.button
            ref={buttonRef}
            onClick={onMenuButtonClick}
            className="p-2 text-white/40 hover:text-white hover:bg-white/20 rounded-lg opacity-60 group-hover:opacity-100 transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}