'use client'
import { useState } from 'react'
import { MessageCircle, Users, Plus, Search, Clock } from 'lucide-react'
import { Chat, Group } from '@/lib/api'

interface ChatsSectionProps {
  chats: Chat[]
  groups: Group[]
  isLoadingChats: boolean
  isLoadingGroups: boolean
  chatSubTab: string
  setChatSubTab: (tab: string) => void
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string }) => void
  isUserOnline: (username: string) => boolean
  showCreateGroup: boolean
  setShowCreateGroup: (show: boolean) => void
}

export default function ChatsSection({
  chats,
  groups,
  isLoadingChats,
  isLoadingGroups,
  chatSubTab,
  setChatSubTab,
  onChatClick,
  isUserOnline,
  showCreateGroup,
  setShowCreateGroup
}: ChatsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const directMessages = filteredChats.filter(chat => !chat.isGroup)
  const groupChats = filteredChats.filter(chat => chat.isGroup)

  const renderChatList = (chatList: Chat[]) => (
    <div className="space-y-2">
      {chatList.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onChatClick({
            conversationId: chat.id,
            type: chat.isGroup ? 'group' : 'private',
            name: chat.name
          })}
          className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all cursor-pointer border border-white/20"
        >
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
              {chat.isGroup ? <Users className="w-6 h-6" /> : chat.name[0]?.toUpperCase()}
            </div>
            {!chat.isGroup && (
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isUserOnline(chat.name) ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium truncate">{chat.name}</h3>
              <span className="text-white/60 text-sm">{chat.time}</span>
            </div>
            <p className="text-white/70 text-sm truncate">{chat.lastMessage}</p>
          </div>
          
          {chat.unread > 0 && (
            <div className="bg-emerald-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {chat.unread}
            </div>
          )}
        </div>
      ))}
      
      {chatList.length === 0 && !isLoadingChats && (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">
            {chatSubTab === 'direct' ? 'No direct messages yet' : 
             chatSubTab === 'groups' ? 'No group chats yet' : 'No conversations yet'}
          </p>
        </div>
      )}
    </div>
  )

  const renderGroupList = () => (
    <div className="space-y-2">
      {filteredGroups.map((group) => (
        <div
          key={group.id}
          className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all cursor-pointer border border-white/20"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
            <Users className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">{group.name}</h3>
              <span className="text-white/60 text-sm">{group.lastActivity}</span>
            </div>
            <p className="text-white/70 text-sm">{group.members} members</p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs ${
            group.isJoined 
              ? 'bg-emerald-500 text-white' 
              : 'bg-white/20 text-white/80'
          }`}>
            {group.isJoined ? 'Joined' : 'Join'}
          </div>
        </div>
      ))}
      
      {filteredGroups.length === 0 && !isLoadingGroups && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">No groups found</p>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    if (isLoadingChats || isLoadingGroups) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )
    }

    switch (chatSubTab) {
      case 'direct':
        return renderChatList(directMessages)
      case 'groups':
        return renderGroupList()
      default:
        return (
          <>
            {renderChatList(filteredChats)}
            {filteredChats.length > 0 && filteredGroups.length > 0 && (
              <div className="border-t border-white/20 my-6" />
            )}
            {renderGroupList()}
          </>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Chats</h1>
          <p className="text-white/70">Connect with friends and groups</p>
        </div>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Group</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
        {[
          { id: 'all', label: 'All', icon: MessageCircle },
          { id: 'direct', label: 'Direct Messages', icon: MessageCircle },
          { id: 'groups', label: 'Groups', icon: Users }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setChatSubTab(id)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all ${
              chatSubTab === id
                ? 'bg-white text-emerald-600 shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-96">
        {renderContent()}
      </div>
    </div>
  )
}