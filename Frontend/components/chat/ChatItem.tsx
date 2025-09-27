import { ChatItem as ChatItemType } from '@/types/chat';
import { Users, MessageCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface ChatItemProps {
  item: ChatItemType;
  onClick: () => void;
  getUserStatus: (userId: number) => string;
  typingUsers?: string[];
}

export default function ChatItem({ item, onClick, getUserStatus, typingUsers = [] }: ChatItemProps) {
  const isGroup = item.type === 'group';
  const participantId = item.participantId;
  const [imageError, setImageError] = useState(false);

  const gradient = isGroup
    ? 'from-blue-400 via-indigo-500 to-purple-600'
    : 'from-emerald-400 via-teal-500 to-cyan-600';

  const hasTypingUsers = typingUsers && typingUsers.length > 0;
  const hasUnread = item.unreadCount && item.unreadCount > 0;

  return (
    <motion.div
      onClick={onClick}
      className="group relative overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Background with animated gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
        initial={false}
        animate={{ opacity: hasUnread ? 0.15 : 0 }}
      />

      {/* Main container */}
      <div className="relative flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-lg rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl group-hover:shadow-emerald-500/10">
        {/* Avatar with enhanced effects */}
        <div className="relative flex-shrink-0">
          <motion.div
            className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-white/10 group-hover:ring-white/20 transition-all duration-300 overflow-hidden`}
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            {item.avatar && !imageError ? (
              <Image
                src={item.avatar}
                alt={item.name || 'Avatar'}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              isGroup ? <Users className="w-7 h-7" /> : item.name?.charAt(0).toUpperCase()
            )}
          </motion.div>

          {/* Online status with pulse animation */}
          {participantId && (
            <motion.div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-white flex items-center justify-center"
              animate={{ scale: getUserStatus(participantId) !== 'offline' ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className={`w-2 h-2 rounded-full ${
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
                className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg"
              >
                {item.unreadCount && item.unreadCount > 99 ? '99+' : item.unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center justify-between mb-1">
            <motion.h3
              className="text-white font-semibold text-lg truncate group-hover:text-emerald-300 transition-colors duration-300"
              layoutId={`chat-name-${item.id}`}
            >
              {item.name}
            </motion.h3>
            <div className="flex items-center space-x-1 text-white/60 text-xs flex-shrink-0">
              <Clock className="w-3 h-3" />
              <span>{item.lastMessageTime ? new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No messages'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
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
                    className="text-white/70 text-sm truncate"
                  >
                    {item.lastMessage || (isGroup ? 'Group created' : 'No messages yet')}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Message status for private chats */}
            {!isGroup && item.lastMessage && (
              <div className="flex-shrink-0 ml-2">
                <MessageCircle className="w-4 h-4 text-white/40" />
              </div>
            )}
          </div>
        </div>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          initial={false}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );
}
