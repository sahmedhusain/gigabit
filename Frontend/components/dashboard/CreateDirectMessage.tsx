'use client'
import { useState, useMemo } from 'react'
import { X, Search, MessageSquarePlus } from 'lucide-react'

interface Follower {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar?: string
  nickname?: string
}

interface CreateDirectMessageProps {
  show: boolean
  onClose: () => void
  followers: Follower[]
  onStartChat: (followerId: number) => void
  isLoading: boolean
}

export default function CreateDirectMessage({
  show,
  onClose,
  followers,
  onStartChat,
  isLoading
}: CreateDirectMessageProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFollowers = useMemo(() => {
    if (!searchQuery) return followers
    return followers.filter(follower => {
      const fullName = `${follower.first_name} ${follower.last_name}`.toLowerCase()
      const nickname = follower.nickname?.toLowerCase() || ''
      const query = searchQuery.toLowerCase()
      return fullName.includes(query) || nickname.includes(query)
    })
  }, [followers, searchQuery])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-800 to-slate-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">New Message</h2>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Followers List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : filteredFollowers.length > 0 ? (
            <ul className="space-y-2">
              {filteredFollowers.map(follower => (
                <li key={follower.id}>
                  <button
                    onClick={() => onStartChat(follower.id)}
                    className="w-full flex items-center space-x-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                      {follower.avatar ? (
                        <img src={follower.avatar} alt={follower.first_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        follower.first_name[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{`${follower.first_name} ${follower.last_name}`}</p>
                      {follower.nickname && <p className="text-white/60 text-sm truncate">@{follower.nickname}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 text-white/60">
              <MessageSquarePlus className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p>No followers found to message.</p>
              {searchQuery && <p className="text-sm mt-1">Try a different search.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}