import { motion, AnimatePresence } from 'framer-motion'
import { ConversationSearchResult } from '@/lib/api'
import ChatItemComponent from '@/components/chat/ChatItem'
import { User } from '@/lib/api'

interface SearchResultsProps {
  searchResults: ConversationSearchResult[]
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number; groupId?: number; initialTab?: string; highlightMessageId?: number }) => void
  currentUser: User | null
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

export default function SearchResults({
  searchResults,
  onChatClick,
  currentUser
}: SearchResultsProps) {

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {searchResults.map((result) => {
          
          const chatItem = {
            id: result.conversation_id,
            type: result.type,
            name: result.type === 'private' ? result.participant_name : (result.group_name || 'Unknown Group'),
            avatar: result.type === 'private' ? result.participant_avatar : result.group_avatar,
            lastMessage: result.matching_message,
            lastMessageTime: result.message_time,
            unread: 0, 
            participantId: result.participant_id,
            groupId: result.group_id,
            timestamp: result.message_time,
            lastMessageSenderId: undefined, 
          }


          const handleOpenChat = () => {
            onChatClick({
              conversationId: result.conversation_id,
              type: result.type,
              name: chatItem.name,
              participantId: result.participant_id,
              groupId: result.group_id,
              highlightMessageId: result.matching_message_id
            })
          }

          return (
            <motion.div
              key={`${result.type}_${result.conversation_id}_${result.message_time}`}
              variants={itemVariants}
              layout
              exit="exit"
            >
              <ChatItemComponent
                item={{
                  ...chatItem,
                  conversationId: result.conversation_id,
                  unreadCount: 0,
                  unread_count: 0,
                  lastMessageStatus: undefined,
                  updated_at: result.message_time,
                }}
                getUserStatus={() => 'offline'} 
                typingUsers={[]} 
                onDelete={() => {}} 
                onMarkAsRead={() => {}} 
                onMarkAsUnread={() => {}} 
                onShowInfo={() => {}} 
                onLeaveGroup={() => {}} 
                onShowSettings={() => {}} 
                mutedConversations={[]}
                onToggleMute={() => {}} 
                onClick={handleOpenChat}
                currentUser={currentUser}
                newPostsCount={0}
                unrespondedPollsCount={0}
                unrespondedEventsCount={0}
                pendingRequestsCount={0}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  )
}