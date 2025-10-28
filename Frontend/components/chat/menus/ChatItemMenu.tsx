import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, VolumeOff, User as UserIcon, Info, Settings, LogOut, Trash2 } from 'lucide-react';
import { ChatItemMenuProps } from '@/types/chat';

export default function ChatItemMenu({
  isOpen,
  position,
  openingUpward,
  hasUnread,
  isMuted,
  isGroup,
  showAdminSettings,
  onMarkAsRead,
  onMarkAsUnread,
  onToggleMute,
  onShowProfile,
  onShowInfo,
  onShowSettings,
  onLeaveGroup,
  onDeleteChat
}: ChatItemMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
            y: openingUpward ? 10 : -10,
            transformOrigin: openingUpward ? 'bottom' : 'top'
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: openingUpward ? 10 : -10
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed w-56 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-[9999]"
          style={{
            top: position.top,
            left: position.left,
            zIndex: 9999
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {/* Direction arrow indicator */}
          <div
            className={`absolute w-3 h-3 bg-slate-800 border-white/20 transform rotate-45 right-5 drop-shadow-md ${
              openingUpward
                ? 'bottom-[-6px] border-b border-r'
                : 'top-[-6px] border-t border-l'
            }`}
          />
          <div className="py-2">
            {/* Common options */}
            {hasUnread ? (
              <motion.button
                onClick={onMarkAsRead}
                className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                whileHover={{ x: 4 }}
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">Mark as read</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={onMarkAsUnread}
                className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                whileHover={{ x: 4 }}
              >
                <EyeOff className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Mark as unread</span>
              </motion.button>
            )}

            {/* Mute/Unmute option */}
            <motion.button
              onClick={onToggleMute}
              className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
              whileHover={{ x: 4 }}
            >
              <VolumeOff className={`w-4 h-4 ${isMuted ? 'text-orange-400' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">{isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
            </motion.button>

            {/* Private chat specific options */}
            {!isGroup && (
              <>
                {onShowProfile && (
                  <motion.button
                    onClick={onShowProfile}
                    className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <UserIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">View profile</span>
                  </motion.button>
                )}

                <div className="h-px bg-white/10 my-2" />

                {onDeleteChat && (
                  <motion.button
                    onClick={onDeleteChat}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete chat</span>
                  </motion.button>
                )}
              </>
            )}

            {/* Group chat specific options */}
            {isGroup && (
              <>
                {onShowInfo && (
                  <motion.button
                    onClick={onShowInfo}
                    className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">Show info</span>
                  </motion.button>
                )}

                {/* Show settings only if user is admin */}
                {showAdminSettings && onShowSettings && (
                  <motion.button
                    onClick={onShowSettings}
                    className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <Settings className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">Settings</span>
                  </motion.button>
                )}

                <div className="h-px bg-white/10 my-2" />

                {onLeaveGroup && (
                  <motion.button
                    onClick={onLeaveGroup}
                    className="w-full px-4 py-3 text-left text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Leave group</span>
                  </motion.button>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}