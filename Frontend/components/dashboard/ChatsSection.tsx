'use client'
import { useState } from 'react'
import { MessageCircle, Users, Plus, Search, MessageSquarePlus } from 'lucide-react'
import { Chat, Group, User } from '@/lib/api'

interface ChatsSectionProps {
  chats: (Chat & { participantId?: number; lastMessageSenderId?: number })[]
  groups: Group[]
  isLoadingChats: boolean
  isLoadingGroups: boolean
  chatSubTab: string
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number }) => void
  isUserOnline: (userId: number) => boolean
  currentUser: User | null
  showCreateGroup: boolean
  setShowCreateDirectMessage: (show: boolean) => void
  setShowCreateGroup: (show: boolean) => void
}

export default function ChatsSection({
  chats,
  groups,
  isLoadingChats,
  isLoadingGroups,
  chatSubTab,
  onChatClick,
  isUserOnline,
  currentUser,
  setShowCreateDirectMessage,
  showCreateGroup,
  setShowCreateGroup
}: ChatsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Helper function to format last message with "You: " prefix
  const formatLastMessage = (chat: Chat & { participantId?: number; lastMessageSenderId?: number }) => {
    if (!chat.lastMessage) return ''
    
    // For private chats, check if current user sent the last message
    if (!chat.isGroup && currentUser && chat.lastMessageSenderId === currentUser.id) {
      return `You: ${chat.lastMessage}`
    }
    
    return chat.lastMessage
  }

  // Sort function for chats by last message time, then by name
  const sortChats = (chatsToSort: (Chat & { participantId?: number })[]) => {
    return [...chatsToSort].sort((a, b) => {
      // First, try to sort by timestamp (most recent first)
      if (a.timestamp && b.timestamp) {
        const aTime = new Date(a.timestamp).getTime()
        const bTime = new Date(b.timestamp).getTime()
        
        if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
          return bTime - aTime // Most recent first
        }
      }
      
      // If timestamps are missing or same, sort by name alphabetically
      return a.name.localeCompare(b.name)
    })
  }

  // Sort function for groups by last activity time, then by name
  const sortGroups = (groupsToSort: Group[]) => {
    return [...groupsToSort].sort((a, b) => {
      // First, try to sort by timestamp (most recent first)
      if (a.timestamp && b.timestamp) {
        const aTime = new Date(a.timestamp).getTime()
        const bTime = new Date(b.timestamp).getTime()
        
        if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
          return bTime - aTime // Most recent first
        }
      }
      
      // If timestamps are missing or same, sort by name alphabetically
      return a.name.localeCompare(b.name)
    })
  }

  const filteredChats = sortChats(chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  ))

  const filteredGroups = sortGroups(groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  ))

  // Combine conversations and groups for "all" tab
  const getCombinedAllItems = () => {
    const combinedItems: Array<{
      id: number
      name: string
      timestamp: string
      type: 'conversation' | 'group'
      data: any
    }> = []

    // Add all conversations
    filteredChats.forEach(chat => {
      combinedItems.push({
        id: chat.id,
        name: chat.name,
        timestamp: chat.timestamp || new Date().toISOString(),
        type: 'conversation',
        data: chat
      })
    })

    // Add groups that don't have conversations
    filteredGroups.forEach(group => {
      const hasConversation = filteredChats.some(chat => 
        chat.isGroup && chat.name === group.name
      )
      
      if (!hasConversation) {
        combinedItems.push({
          id: group.id,
          name: group.name,
          timestamp: group.timestamp || new Date().toISOString(),
          type: 'group',
          data: group
        })
      }
    })

    // Sort by timestamp (most recent first), then by name
    return combinedItems.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime()
      const bTime = new Date(b.timestamp).getTime()
      
      if (aTime !== bTime) {
        return bTime - aTime // Most recent first
      }
      
      // If timestamps are the same, sort by name
      return a.name.localeCompare(b.name)
    })
  }

  const renderCombinedAllList = () => {
    const combinedItems = getCombinedAllItems()
    
    return (
      <div className="space-y-2">
        {combinedItems.map((item) => {
          if (item.type === 'conversation') {
            const chat = item.data
            return (
              <div
                key={`conv-${chat.id}`}
                onClick={() => onChatClick({
                  conversationId: chat.id,
                  type: chat.isGroup ? 'group' : 'private',
                  name: chat.name,
                  participantId: chat.participantId
                })}
                className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all cursor-pointer border border-white/20"
              >
                <div className="relative">
                  {chat.participantAvatar ? (
                    <img
                      src={chat.participantAvatar.startsWith('http') 
                        ? chat.participantAvatar 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${chat.participantAvatar}`
                      }
                      alt={chat.name}
                      className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                      {chat.isGroup ? <Users className="w-6 h-6" /> : chat.name[0]?.toUpperCase()}
                    </div>
                  )}
                  {!chat.isGroup && (
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      chat.participantId && isUserOnline(chat.participantId) ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium truncate">{chat.name}</h3>
                    <span className="text-white/60 text-sm">{chat.time}</span>
                  </div>
                  <p className="text-white/70 text-sm truncate">{formatLastMessage(chat)}</p>
                </div>
                
                {chat.unread > 0 && (
                  <div className="bg-emerald-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {chat.unread}
                  </div>
                )}
              </div>
            )
          } else {
            const group = item.data
            // Find if this group has a conversation with messages
            const groupConversation = filteredChats.find(chat => 
              chat.isGroup && chat.name === group.name
            )
            
            // Determine what to show as the last message/activity
            let displayText = ''
            let displayTime = group.lastActivity
            
            if (groupConversation && groupConversation.lastMessage) {
              // Group has messages, show last message
              displayText = formatLastMessage(groupConversation)
              displayTime = groupConversation.time
            } else {
              // Group has no messages, show join information with date
              const joinDate = new Date(group.lastActivity).toLocaleDateString()
              displayText = `You joined this group on ${joinDate}`
              // Keep the lastActivity time which should be the join/creation time
            }
            
            return (
              <div
                key={`group-${group.id}`}
                onClick={() => {
                  // Find the conversation for this group
                  const conversation = filteredChats.find(chat => 
                    chat.isGroup && chat.name === group.name
                  )
                  if (conversation) {
                    onChatClick({
                      conversationId: conversation.id,
                      type: 'group',
                      name: group.name
                    })
                  } else {
                    // If no conversation exists yet, we could create one or show a message
                    console.log('Group has no conversations yet:', group.name)
                  }
                }}
                className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all cursor-pointer border border-white/20"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  <Users className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">{group.name}</h3>
                    <span className="text-white/60 text-sm">{displayTime}</span>
                  </div>
                  <p className="text-white/70 text-sm">{displayText}</p>
                </div>
              </div>
            )
          }
        })}
        
        {combinedItems.length === 0 && !isLoadingChats && !isLoadingGroups && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No conversations yet</p>
          </div>
        )}
      </div>
    )
  }

  const directMessages = sortChats(filteredChats.filter(chat => !chat.isGroup))
  const groupChats = sortChats(filteredChats.filter(chat => chat.isGroup))

  const renderChatList = (chatList: (Chat & { participantId?: number })[]) => (
    <div className="space-y-2">
      {chatList.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onChatClick({
            conversationId: chat.id,
            type: chat.isGroup ? 'group' : 'private',
            name: chat.name,
            participantId: chat.participantId
          })}
          className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all cursor-pointer border border-white/20"
        >
                <div className="relative">
                  {chat.participantAvatar ? (
                    <img
                      src={chat.participantAvatar.startsWith('http') 
                        ? chat.participantAvatar 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${chat.participantAvatar}`
                      }
                      alt={chat.name}
                      className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                      {chat.isGroup ? <Users className="w-6 h-6" /> : chat.name[0]?.toUpperCase()}
                    </div>
                  )}
                  {!chat.isGroup && (
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      chat.participantId && isUserOnline(chat.participantId) ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  )}
                </div>          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium truncate">{chat.name}</h3>
              <span className="text-white/60 text-sm">{chat.time}</span>
            </div>
            <p className="text-white/70 text-sm truncate">{formatLastMessage(chat)}</p>
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
             chatSubTab === 'groups' ? 'No group conversations yet' : 'No conversations yet'}
          </p>
        </div>
      )}
    </div>
  )

  const renderGroupList = () => (
    <div className="space-y-2">
      {filteredGroups.map((group) => {
        // Find if this group has a conversation with messages
        const groupConversation = filteredChats.find(chat => 
          chat.isGroup && chat.name === group.name
        )
        
        // Determine what to show as the last message/activity
        let displayText = ''
        let displayTime = group.lastActivity
        
        if (groupConversation && groupConversation.lastMessage) {
          // Group has messages, show last message
          displayText = formatLastMessage(groupConversation)
          displayTime = groupConversation.time
        } else {
          // Group has no messages, show join information with date
          const joinDate = new Date(group.lastActivity).toLocaleDateString()
          displayText = `You joined this group on ${joinDate}`
          // Keep the lastActivity time which should be the join/creation time
        }
        
        return (
          <div
            key={group.id}
            onClick={() => {
              // Find the conversation for this group
              const conversation = filteredChats.find(chat => 
                chat.isGroup && chat.name === group.name
              )
              if (conversation) {
                onChatClick({
                  conversationId: conversation.id,
                  type: 'group',
                  name: group.name
                })
              } else {
                // If no conversation exists yet, we could create one or show a message
                // For now, just don't do anything (group might not be clickable if no messages)
                console.log('Group has no conversations yet:', group.name)
              }
            }}
            className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all cursor-pointer border border-white/20"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
              <Users className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">{group.name}</h3>
                <span className="text-white/60 text-sm">{displayTime}</span>
              </div>
              <p className="text-white/70 text-sm">{displayText}</p>
            </div>
          </div>
        )
      })}
      
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
        // For "all" tab, show all conversations and groups combined
        return renderCombinedAllList()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Chats</h1>
          <p className="text-white/70">Connect with friends and groups</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateDirectMessage(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2 border border-white/20"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>New Message</span>
          </button>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-shrink-0 relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}