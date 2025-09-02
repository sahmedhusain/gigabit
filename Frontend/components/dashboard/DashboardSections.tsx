"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { User, Users, Plus, MessageCircle, Calendar, MapPin} from 'lucide-react'

// Clean DashboardSections: Followers, Groups, Settings

interface FollowersSectionProps {
  followers: any[]
  following: any[]
  isLoadingFollowers: boolean
}

export function FollowersSection({ followers, following, isLoadingFollowers }: FollowersSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
        <h2 className="text-xl font-bold text-white mb-4">Followers</h2>
        {isLoadingFollowers ? (
          <div className="text-white/60">Loading...</div>
        ) : (followers || []).length === 0 ? (
          <div className="text-white/60">No followers yet.</div>
        ) : (
          (followers || []).map((f) => (
            <div key={f.id} className="flex items-center justify-between p-2 bg-white/3 rounded-md mb-2">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-white" />
                <div className="text-white">{f.first_name} {f.last_name}</div>
              </div>
              <button aria-label="Message" title="Message" className="text-white">Message</button>
            </div>
          ))
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

  const handleGroupClick = (groupId: number) => {
    router.push(`/group/${groupId}`)
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">My Groups</h2>
          <button aria-label="Create Group" title="Create Group" className="flex items-center px-3 py-2 bg-emerald-500 rounded-md text-white hover:bg-emerald-600 transition-colors" onClick={onCreateGroup}>
            <Plus className="w-4 h-4 mr-2" /> Create
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-white/60">No groups yet.</div>
        ) : (
          (groups || []).map((g) => (
            <div key={g.id} className="p-3 mb-2 bg-white/3 rounded-md text-white cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleGroupClick(g.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-sm text-white/70">{g.description}</div>
                </div>
                <button aria-label="Message Group" title="Message" className="text-white"><MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
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
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Upcoming Events</h2>
          <button className="flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        </div>
        
        <div className="space-y-3 lg:space-y-4">
          {events.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <p className="text-lg">No upcoming events</p>
              <p className="text-sm mt-2">Create or join events to stay connected with your community!</p>
            </div>
          ) : (
            events.map((event) => (
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
                      <button className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                        event.user_response === 'going' 
                          ? 'bg-emerald-500 text-white' 
                          : 'border border-white/30 text-white hover:bg-white/10'
                      }`}>
                        Going ({event.going_count})
                      </button>
                      <button className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                        event.user_response === 'not_going' 
                          ? 'bg-red-500 text-white' 
                          : 'border border-white/30 text-white hover:bg-white/10'
                      }`}>
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
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
        <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
        <div className="space-y-3">
          <div className="p-3 bg-white/3 rounded-md text-white">Privacy & Security</div>
          <div className="p-3 bg-white/3 rounded-md text-white">Notifications</div>
          <div className="p-3 bg-white/3 rounded-md text-white">
            <button onClick={testTokenExpiration} className="text-yellow-300">Test Token Expiration</button>
          </div>
        </div>
      </div>
    </div>
  )
}
