import { ChatItem as ChatItemType } from '@/types/chat';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatItemProps {
  item: ChatItemType;
  onClick: () => void;
  isUserOnline: (userId: number) => boolean;
}

export default function ChatItem({ item, onClick, isUserOnline }: ChatItemProps) {
  const isGroup = item.type === 'group';
  const participantId = item.id.startsWith('private_') ? parseInt(item.id.replace('private_', '')) : undefined;

  const gradient = isGroup
    ? 'from-blue-400 to-indigo-500'
    : 'from-purple-400 to-pink-500';

  return (
    <motion.div
      onClick={onClick}
      className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-lg rounded-xl hover:bg-white/20 transition-all cursor-pointer border border-white/20 shadow-lg"
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <div className="relative w-14 h-14">
        <div className={`w-14 h-14 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center text-white font-bold text-xl`}>
          {isGroup ? <Users className="w-7 h-7" /> : item.name.charAt(0).toUpperCase()}
        </div>
        {participantId && isUserOnline(participantId) && (
          <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-400 border-2 border-gray-800 shadow-md"></span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg truncate">{item.name}</h3>
          <span className="text-white/70 text-xs flex-shrink-0 ml-2">
            {new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-sm truncate">
            {item.lastMessage || (isGroup ? 'Group created' : 'No messages yet')}
          </p>
          {item.unreadCount > 0 && (
            <div className="bg-emerald-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 ml-2">
              {item.unreadCount}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
