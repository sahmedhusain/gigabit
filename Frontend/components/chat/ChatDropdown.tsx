'use client'
import { MessageSquare, User, Users } from 'lucide-react'
import { useRealTimeMessages, useOnlineStatus, useConnectionStatus } from '@/hooks'

interface Chat {
  id: number
  name: string
  lastMessage: string
  time: string
  unread: number
  status: 'online' | 'busy' | 'away' | 'invisible' | 'offline'
  isGroup: boolean
}

interface ChatDropdownProps {
  show: boolean
  chats: Chat[]
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string }) => void
  onClose: () => void
  isUserOnline: (username: string) => boolean
}

export default function ChatDropdown({
  show,
  chats,
  onChatClick,
  onClose,
}: ChatDropdownProps) {
  const { getUnreadCount: getMessageUnread } = useRealTimeMessages()
  const { onlineUsers } = useOnlineStatus()
  const { isConnected } = useConnectionStatus()
  
  
  const enhancedChats = chats.map(chat => {
    const unreadCount = getMessageUnread(chat.id)
    const onlineUser = chat.isGroup ? null : onlineUsers.find(user => user.username === chat.name)
    const status = chat.isGroup ? 'offline' : (onlineUser?.status || 'offline')
    
    return {
      ...chat,
      unread: unreadCount,
      status: status as 'online' | 'busy' | 'away' | 'invisible' | 'offline'
    }
  })

  if (!show) return null

  return (
    <div className="fixed top-14 lg:top-16 right-2 lg:right-6 w-72 sm:w-80 h-80 lg:h-96 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/20 shadow-2xl z-40 flex flex-col">
      <div className="p-3 lg:p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <h3 className="text-base lg:text-lg font-semibold text-white">Messages</h3>
          {!isConnected && (
            <span className="text-xs text-red-400">Offline</span>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 lg:p-4">
        <div className="space-y-2 lg:space-y-3">
          {enhancedChats.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            enhancedChats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center space-x-2 lg:space-x-3 p-2 lg:p-3 rounded-lg lg:rounded-xl hover:bg-white/10 cursor-pointer transition-all duration-200"
                onClick={() => {
                  if (isConnected) {
                    onChatClick({
                      conversationId: chat.id,
                      type: chat.isGroup ? 'group' : 'private',
                      name: chat.name
                    })
                    onClose()
                  }
                }}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    {chat.isGroup ? (
                      <Users className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    ) : (
                      <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    )}
                  </div>
                  {!chat.isGroup && chat.status !== 'offline' && chat.status !== 'invisible' && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 lg:w-3 lg:h-3 rounded-full border border-white ${
                      chat.status === 'online' ? 'bg-green-500' :
                      chat.status === 'busy' ? 'bg-red-500' :
                      chat.status === 'away' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium truncate text-sm lg:text-base">{chat.name}</h4>
                    <span className="text-white/60 text-xs flex-shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-white/70 text-xs lg:text-sm truncate">
                    {chat.lastMessage === 'XdeletedbyuserX' ? 'Message deleted' : chat.lastMessage}
                  </p>
                </div>
                
                {chat.unread > 0 && (
                  <div className="bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 min-w-[20px] h-5 px-2">
                    <span className="text-white text-xs">{chat.unread > 99 ? '99+' : chat.unread}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="p-3 lg:p-4 border-t border-white/20">
        <button 
          disabled={!isConnected}
          className={`w-full flex items-center justify-center py-2 rounded-lg lg:rounded-xl text-white transition-all duration-200 text-sm lg:text-base ${
            isConnected 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
              : 'bg-white/20 cursor-not-allowed'
          }`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {isConnected ? 'New Message' : 'Offline'}
        </button>
      </div>
    </div>
  )
}
