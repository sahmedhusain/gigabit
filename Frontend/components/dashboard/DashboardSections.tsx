"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { User, Users, Plus, MessageCircle, Calendar, MapPin} from 'lucide-react'
import { useRealTimeGroups, useRealTimeEvents, useConnectionStatus, useOnlineStatus } from '@/hooks'

// Clean DashboardSections: Followers, Groups, Settings

interface FollowersSectionProps {
  followers: any[]
  following: any[]
  isLoadingFollowers: boolean
}

export function FollowersSection({ followers, following, isLoadingFollowers }: FollowersSectionProps) {
  const { isConnected } = useConnectionStatus()
  const { onlineUsers } = useOnlineStatus()
  
  // Helper function to check if a follower is online
  const isFollowerOnline = (followerId: number) => {
    return onlineUsers.some(user => user.user_id === followerId && user.is_online)
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Followers</h2>
          <div className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isConnected ? 'Live Status' : 'Offline'}
          </div>
        </div>
        {isLoadingFollowers ? (
          <div className="text-white/60">Loading...</div>
        ) : (followers || []).length === 0 ? (
          <div className="text-white/60">No followers yet.</div>
        ) : (
          (followers || []).map((f) => {
            const online = isFollowerOnline(f.id)
            return (
              <div key={f.id} className="flex items-center justify-between p-2 bg-white/3 rounded-md mb-2">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <User className="w-5 h-5 text-white" />
                    {isConnected && (
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="text-white">{f.first_name} {f.last_name}</div>
                    {isConnected && (
                      <div className={`text-xs ${online ? 'text-green-400' : 'text-gray-400'}`}>
                        {online ? 'Online' : 'Offline'}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  aria-label="Message" 
                  title="Message" 
                  disabled={!isConnected}
                  className={`text-white transition-colors ${
                    isConnected ? 'hover:text-emerald-400' : 'text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Message
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

interface Group {
  id: number
  name: string
  description: string
  members: number
  isJoined: boolean
  lastActivity: string
}

interface GroupsSectionProps {
  groups: Group[]
  onCreateGroup?: () => void
}

export function GroupsSection({ groups, onCreateGroup }: GroupsSectionProps) {
  const router = useRouter()
  const { isConnected } = useConnectionStatus()
  const { groups: liveGroups, unreadUpdates, loading } = useRealTimeGroups()
  
  // Use live groups if available, fallback to props
  const displayGroups = liveGroups && liveGroups.length > 0 ? liveGroups : groups

  const handleGroupClick = (groupId: number) => {
    router.push(`/group/${groupId}`)
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-white">My Groups</h2>
            <div className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
          </div>
          <button 
            aria-label="Create Group" 
            title="Create Group" 
            disabled={!isConnected}
            className={`flex items-center px-3 py-2 rounded-md text-white transition-colors ${
              isConnected 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : 'bg-gray-500 cursor-not-allowed'
            }`} 
            onClick={onCreateGroup}
          >
            <Plus className="w-4 h-4 mr-2" /> {isConnected ? 'Create' : 'Offline'}
          </button>
        </div>

        {displayGroups.length === 0 ? (
          <div className="text-white/60">No groups yet.</div>
        ) : (
          (displayGroups || []).map((g) => {
            const unreadCount = unreadUpdates.get(g.id) || 0
            return (
              <div key={g.id} className="p-3 mb-2 bg-white/3 rounded-md text-white cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleGroupClick(g.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold flex items-center space-x-2">
                      <span>{(g as any).title || (g as any).name}</span>
                      {unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-white/70">{g.description}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <button 
                      aria-label="Message Group" 
                      title="Message"
                      disabled={!isConnected} 
                      className={`transition-colors ${
                        isConnected ? 'text-white hover:text-emerald-400' : 'text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}// Events Section
interface Event {
  id: number
  group_id: number
  creator_id: number
  title: string
  description: string
  event_time: string
  created_at: string
  updated_at: string
  creator: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    avatar: string
  }
  group: {
    id: number
    title: string
  }
  going_count: number
  not_going_count: number
  user_response: string
  responses?: Array<{
    id: number
    event_id: number
    user: {
      id: number
      username: string
      email: string
      first_name: string
      last_name: string
      avatar: string
    }
    option: string
    created_at: string
  }>
}

interface EventsSectionProps {
  events: Event[]
}

export function EventsSection({ events }: EventsSectionProps) {
  const { isConnected } = useConnectionStatus()
  const { events: liveEvents, loading } = useRealTimeEvents()
  
  // Use live events if available, fallback to props
  const displayEvents = liveEvents && liveEvents.length > 0 ? liveEvents : events

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl lg:text-2xl font-bold text-white">Upcoming Events</h2>
            <div className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
          </div>
          <button 
            disabled={!isConnected}
            className={`flex items-center px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl text-white transition-all duration-200 text-sm lg:text-base w-full sm:w-auto justify-center ${
              isConnected 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' 
                : 'bg-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isConnected ? 'Create Event' : 'Offline'}
          </button>
        </div>
        
        <div className="space-y-3 lg:space-y-4">
          {displayEvents.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <p className="text-lg">No upcoming events</p>
              <p className="text-sm mt-2">Create or join events to stay connected with your community!</p>
            </div>
          ) : (
            displayEvents.map((event) => (
              <div key={event.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 mb-3 lg:mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">{event.title}</h3>
                    <p className="text-white/70 mb-3 text-sm lg:text-base">{event.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs lg:text-sm text-white/60">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                        {new Date(event.event_time).toLocaleDateString()} at {new Date(event.event_time).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center lg:text-right">
                    <div className="text-xs lg:text-sm text-white/60 mb-2">From: {event.group.title}</div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button 
                        disabled={!isConnected}
                        className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                          event.user_response === 'going' 
                            ? 'bg-emerald-500 text-white' 
                            : isConnected
                              ? 'border border-white/30 text-white hover:bg-white/10'
                              : 'border border-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Going ({event.going_count})
                      </button>
                      <button 
                        disabled={!isConnected}
                        className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                          event.user_response === 'not_going' 
                            ? 'bg-red-500 text-white' 
                            : isConnected
                              ? 'border border-white/30 text-white hover:bg-white/10'
                              : 'border border-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Not Going ({event.not_going_count})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface SettingsSectionProps {
  currentUser: {
    isPrivate: boolean
  } | null
  testTokenExpiration: () => void
}

export function SettingsSection({ currentUser, testTokenExpiration }: SettingsSectionProps) {
  const { isConnected } = useConnectionStatus()
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/70">Manage your account preferences</p>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
          <div className="space-y-3">
            <div className={`p-3 rounded-md transition-colors ${
              isConnected ? 'bg-white/3 text-white hover:bg-white/5 cursor-pointer' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}>
              Privacy & Security {!isConnected && '(Offline)'}
            </div>
            <div className={`p-3 rounded-md transition-colors ${
              isConnected ? 'bg-white/3 text-white hover:bg-white/5 cursor-pointer' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}>
              Notifications {!isConnected && '(Offline)'}
            </div>
            <div className="p-3 bg-white/3 rounded-md text-white">
              <button 
                onClick={testTokenExpiration} 
                disabled={!isConnected}
                className={`transition-colors ${
                  isConnected ? 'text-yellow-300 hover:text-yellow-200' : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                Test Token Expiration {!isConnected && '(Offline)'}
              </button>
            </div>
            {!isConnected && (
              <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-md">
                <p className="text-red-400 text-sm">Some settings require an internet connection</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
