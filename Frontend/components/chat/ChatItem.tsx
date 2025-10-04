import { ChatItem as ChatItemType } from '@/types/chat';
import { Users, MessageCircle, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface ChatItemProps {
  item: ChatItemType;
  onClick: () => void;
  onDelete?: (conversationId: number) => void;
  getUserStatus: (userId: number) => string;
  typingUsers?: string[];
}

export default function ChatItem({ item, onClick, onDelete, getUserStatus, typingUsers = [] }: ChatItemProps) {
  const isGroup = item.type === 'group';
  const participantId = item.participantId;
  const [imageError, setImageError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Robust timestamp parser: handles ISO strings, milliseconds, or seconds
  const parseDate = (value: string | number | undefined | null): Date => {
    if (!value && value !== 0) return new Date(0)
    const raw = typeof value === 'number' ? value : String(value).trim()

    if (/^\d+$/.test(String(raw))) {
      const n = Number(raw)
      if (n > 0 && n < 1e11) {
        // looks like seconds
        return new Date(n * 1000)
      }
      return new Date(n)
    }

    const d = new Date(String(raw))
    if (isNaN(d.getTime())) return new Date(0)
    return d
  }

  const formatTime = (value: string | number | undefined | null) => {
    const d = parseDate(value)
    if (d.getTime() === 0) return 'No messages'
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const gradient = isGroup
    ? 'from-blue-400 via-indigo-500 to-purple-600'
    : 'from-emerald-400 via-teal-500 to-cyan-600';

  const hasTypingUsers = typingUsers && typingUsers.length > 0;
  const hasUnread = item.unreadCount && item.unreadCount > 0;

  const handleDelete = async () => {
    if (onDelete && item.conversationId) {
      onDelete(item.conversationId);
    }
    setShowDeleteConfirm(false);
  };

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
          {participantId ? (
            <div className={`w-14 h-14 rounded-full p-0.5 flex-shrink-0 transition-all duration-300 ${getUserStatus(participantId) === 'online' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
              getUserStatus(participantId) === 'busy' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                getUserStatus(participantId) === 'away' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                  'bg-gradient-to-r from-gray-400 to-gray-500'
              }`}>
              <motion.div
                className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                {item.avatar && !imageError ? (
                  <Image
                    src={item.avatar}
                    alt={item.name || 'Avatar'}
                    width={52}
                    height={52}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  item.name?.charAt(0).toUpperCase()
                )}
              </motion.div>
            </div>
          ) : (
            <motion.div
              className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-white/10 group-hover:ring-white/20 transition-all duration-300 overflow-hidden`}
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
                <Users className="w-7 h-7" />
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
              <span>{formatTime(item.lastMessageTime)}</span>
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

        {/* Delete button */}
        {onDelete && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="absolute top-2 right-2 p-2 text-white/60 hover:text-red-400 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white text-lg font-semibold mb-4">Delete Conversation</h3>
              <p className="text-white/70 mb-6">
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <motion.button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
