'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { MessageCircle, Users, Plus, Search, MessageSquarePlus } from 'lucide-react'
import { api } from '@/lib/api'
import { ChatItem as ChatItemType } from '@/types/chat'
import ChatItem from '@/components/chat/ChatItem'
import ChatSkeleton from '@/components/chat/ChatSkeleton'
import { User } from '@/lib/api'

interface ChatsSectionProps {
  chatSubTab: string
  onChatClick: (chat: { conversationId: string; type: 'private' | 'group'; name: string; participantId?: number }) => void
  isUserOnline: (userId: number) => boolean
  currentUser: User | null
  showCreateGroup: boolean
  setShowCreateDirectMessage: (show: boolean) => void
  setShowCreateGroup: (show: boolean) => void
}

const fetcher = () => api.getChats().then(data => data.chats)

export default function ChatsSection({
  chatSubTab,
  onChatClick,
  isUserOnline,
  currentUser,
  setShowCreateDirectMessage,
  showCreateGroup,
  setShowCreateGroup
}: ChatsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: chats, error, isLoading } = useSWR('chats', fetcher, { refreshInterval: 5000 })

  const filteredChats = chats?.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (chatSubTab === 'all') return matchesSearch
    return chat.type === chatSubTab && matchesSearch
  }) || []

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <ChatSkeleton key={i} />)}
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-red-500/70 mx-auto mb-4" />
          <p className="text-white/60">Failed to load chats. Please try again later.</p>
        </div>
      )
    }

    if (filteredChats.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">No conversations yet</h2>
          <p className="text-white/60 mt-2">Start a new conversation to see it here.</p>
          <button
            onClick={() => {
              // TODO: Implement a modal to select a user to chat with
              setShowCreateDirectMessage(true);
            }}
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center space-x-2 mx-auto"
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span>Start a Chat</span>
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {filteredChats.map((chat) => (
          <ChatItem
            key={chat.id}
            item={chat}
            isUserOnline={isUserOnline}
            onClick={() => onChatClick({
              conversationId: chat.id,
              type: chat.type,
              name: chat.name,
              participantId: chat.type === 'private' ? parseInt(chat.id.replace('private_', '')) : undefined
            })}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Chats</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // TODO: Implement a modal to select a user to chat with
              setShowCreateDirectMessage(true);
            }}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2 border border-white/20"
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span>New Message</span>
          </button>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-shrink-0 relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {renderContent()}
      </div>
    </div>
  )
}
