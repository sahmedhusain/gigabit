'use client'
import { useState, useMemo } from 'react'
import Image from 'next/image'
import { X, Search, MessageSquarePlus, MessageCircle } from 'lucide-react'

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg h-[85vh] flex flex-col">
        {/* Enhanced backdrop with multiple layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>

        {/* Fixed Header */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">New Message</h3>
                <p className="text-white/60 text-sm">Start a conversation with a follower</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
              title="Close"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="relative flex-shrink-0 px-6 lg:px-8 pb-4">
          <div className="space-y-3">
            <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Search Followers</span>
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or nickname..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 hover:bg-white/15 text-sm lg:text-base"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="relative flex-1 overflow-y-auto px-6 lg:px-8">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full animate-spin"></div>
                  <span className="text-white/70 text-sm lg:text-base">Loading followers...</span>
                </div>
              </div>
            ) : filteredFollowers.length > 0 ? (
              <div className="space-y-2">
                {filteredFollowers.map(follower => (
                  <button
                    key={follower.id}
                    onClick={() => onStartChat(follower.id)}
                    className="w-full flex items-center space-x-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 hover:scale-[1.02] group"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-all duration-300">
                        {follower.avatar ? (
                          <Image src={follower.avatar} alt={follower.first_name} width={48} height={48} unoptimized={follower.avatar.includes('/svg')} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          follower.first_name[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-white font-semibold text-sm lg:text-base truncate group-hover:text-white/90">
                        {`${follower.first_name} ${follower.last_name}`}
                      </p>
                      {follower.nickname && (
                        <p className="text-white/60 text-xs lg:text-sm truncate group-hover:text-white/70">
                          @{follower.nickname}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <MessageSquarePlus className="w-5 h-5 text-blue-400" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquarePlus className="w-8 h-8 text-white/40" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">
                  {searchQuery ? 'No followers found' : 'No followers to message'}
                </h3>
                <p className="text-white/60 text-sm lg:text-base">
                  {searchQuery
                    ? 'Try searching with a different name or nickname.'
                    : 'Follow some users to start messaging them.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pt-4">
          <div className="flex justify-end pt-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}