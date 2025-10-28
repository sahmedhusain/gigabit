import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ChatItem } from '@/types/chat'
import { UnifiedChatItem, parseConversationId } from '@/utils/chatUtils'
import { User } from '@/lib/api'
import ChatItemComponent from '@/components/chat/ChatItem'
import { mutate } from 'swr'

interface ChatListProps {
  chats: UnifiedChatItem[]
  getUserStatus: (userId: number) => string
  typingChats: Record<string, string[]>
  currentUser: User | null
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number; groupId?: number; initialTab?: string; highlightMessageId?: number }) => void
  onDelete: (conversationId: number) => void
  onMarkAsRead: (conversationId: number) => void
  onMarkAsUnread: (conversationId: number) => void
  onShowInfo: (conversationId: number, type: 'private' | 'group') => void
  onLeaveGroup: (groupId: number) => void
  onShowSettings: (conversationId: number, type: 'private' | 'group') => void
  mutedConversations: number[]
  onToggleMute: (conversationId: number) => void
  groupTabCounts: Record<number, { newPostsCount: number; unrespondedPollsCount: number; unrespondedEventsCount: number; pendingRequestsCount: number }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
}

export default function ChatList({
  chats,
  getUserStatus,
  typingChats,
  currentUser,
  onChatClick,
  onDelete,
  onMarkAsRead,
  onMarkAsUnread,
  onShowInfo,
  onLeaveGroup,
  onShowSettings,
  mutedConversations,
  onToggleMute,
  groupTabCounts
}: ChatListProps) {
  return (
    <LayoutGroup>
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {chats.map((chat) => {
            // Use the utility function to properly extract numeric conversation ID
            const chatIdNum = typeof chat.id === 'number' ? chat.id : parseConversationId(chat.id).numericId;
            const avatar = chat.avatar && typeof chat.avatar === 'string' ? chat.avatar : undefined;

            
            if (!chatIdNum || isNaN(chatIdNum)) {
              return null;
            }

            // Create unique key combining type and numeric ID to avoid collisions between private_X and group_X
            const uniqueKey = `${chat.type}_${chatIdNum}`;

            const handleOpenChat = () => {
              
              mutate('chats', (current: ChatItem[] | { conversations: ChatItem[] } | undefined) => {
                if (!current) return current
                const updated = Array.isArray(current) ? current : current.conversations
                if (!Array.isArray(updated)) return current
                const next = updated.map((c: ChatItem) => {
                  const cIdNum = typeof c.id === 'number' ? c.id : parseConversationId(c.id).numericId;
                  return cIdNum === chatIdNum ? { ...c, unread_count: 0 } : c;
                })
                // Preserve original shape if needed
                return Array.isArray(current) ? next : { ...current, conversations: next }
              }, false)

              onChatClick({
                conversationId: chatIdNum,
                type: chat.type,
                name: chat.name || 'Unknown',
                participantId: chat.participantId,
                groupId: chat.groupId
              })
            }

            return (
              <motion.div
                key={uniqueKey}
                variants={itemVariants}
                layout
                exit="exit"
              >
                <ChatItemComponent
                  item={{
                    ...chat,
                    id: chatIdNum,
                    avatar,
                    conversationId: chatIdNum,
                    unreadCount: chat.unread || 0,
                    unread_count: chat.unread || 0,
                    lastMessageSenderId: chat.lastMessageSenderId,
                    lastMessageStatus: (chat.lastMessage && currentUser?.id && chat.lastMessageSenderId === currentUser.id) ? 'sent' : undefined,
                    updated_at: chat.timestamp || '',
                    groupId: chat.groupId, 
                    joinedAt: chat.joinedAt,
                  }}
                  getUserStatus={getUserStatus}
                  typingUsers={(() => {
                    
                    if (chat.groupId) {
                      const groupKey = `group_${chat.groupId}`
                      const typing = typingChats[groupKey] || []
                      return typing
                    }
                    
                    if (chat.participantId && currentUser?.id) {
                      const key = String(Math.min(chat.participantId, currentUser.id) * 1000000 + Math.max(chat.participantId, currentUser.id))
                      const typing = typingChats[key] || []
                      return typing
                    }
                    return []
                  })()}
                  onDelete={onDelete}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAsUnread={onMarkAsUnread}
                  onShowInfo={onShowInfo}
                  onLeaveGroup={onLeaveGroup}
                  onShowSettings={onShowSettings}
                  mutedConversations={mutedConversations}
                  onToggleMute={onToggleMute}
                  onClick={handleOpenChat}
                  currentUser={currentUser}
                  newPostsCount={chat.groupId ? groupTabCounts[chat.groupId]?.newPostsCount : 0}
                  unrespondedPollsCount={chat.groupId ? groupTabCounts[chat.groupId]?.unrespondedPollsCount : 0}
                  unrespondedEventsCount={chat.groupId ? groupTabCounts[chat.groupId]?.unrespondedEventsCount : 0}
                  pendingRequestsCount={chat.groupId ? groupTabCounts[chat.groupId]?.pendingRequestsCount : 0}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  )
}