'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api, Group, Event, User, API_BASE_URL, getToken } from '@/lib/api'
import GroupChat from '@/components/GroupChat'
import {
  Users,
  Calendar,
  MessageCircle,
  Settings,
  UserPlus,
  LogOut,
  Crown,
  MapPin,
  Clock,
  ArrowLeft,
  X
} from 'lucide-react'

interface GroupDetails {
  id: number
  title: string
  description: string
  creator_id: number
  member_count: number
  is_member: boolean
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
  members: Array<{
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    avatar: string
    joined_at: string
  }>
  events: Event[]
}

function GroupDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useToast()

  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isJoining, setIsJoining] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchGroupDetails()
    }
  }, [id])

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true)
      const groupId = parseInt(id as string)

      // Fetch group details directly by ID
      const groupInfo = await api.getGroup(groupId)

      // Fetch group members
      const membersData = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
        },
        credentials: 'include'
      })
      const members = membersData.ok ? await membersData.json() : { members: [] }

      // Fetch group events
      const eventsData = await api.getUserEvents()
      const groupEvents = eventsData.data.filter((event: Event) => event.group_id === groupId)

      setGroup({
        ...groupInfo,
        creator: {
          id: groupInfo.creator_id,
          username: '',
          email: '',
          first_name: 'Unknown',
          last_name: 'User',
          avatar: ''
        },
        members: members.members || [],
        events: groupEvents
      })
    } catch (err) {
      console.error('Error fetching group details:', err)
      error('Failed to load group details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!group) return

    try {
      setIsJoining(true)
      await fetch(`${API_BASE_URL}/api/groups/${group.id}/join`, {
        method: 'POST',
        credentials: 'include'
      })

      success('Successfully joined the group!')
      fetchGroupDetails()
    } catch (err) {
      console.error('Error joining group:', err)
      error('Failed to join group')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!group) return

    try {
      await fetch(`${API_BASE_URL}/api/groups/${group.id}/leave`, {
        method: 'DELETE',
        credentials: 'include'
      })

      success('Successfully left the group')
      router.push('/dashboard')
    } catch (err) {
      console.error('Error leaving group:', err)
      error('Failed to leave group')
    }
  }

  const handleInviteUser = async () => {
    if (!group || !inviteEmail.trim()) return

    try {
      setIsInviting(true)
      await fetch(`${API_BASE_URL}/api/groups/${group.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail.trim() })
      })

      success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setShowInviteModal(false)
    } catch (err) {
      console.error('Error inviting user:', err)
      error('Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const isGroupCreator = group && user && group.creator_id === user.id

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading group details...</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
        <div className="text-white text-xl">Group not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">{group.title}</h1>
                <p className="text-white/70 mt-1">{group.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isGroupCreator && (
                <button className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-200">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </button>
              )}

              {group.is_member ? (
                <button
                  onClick={handleLeaveGroup}
                  className="flex items-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-red-300 hover:text-red-200 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Group
                </button>
              ) : (
                <button
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                  className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isJoining ? 'Joining...' : 'Join Group'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black/10 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Users },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'chat', label: 'Chat', icon: MessageCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-4 border-b-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-white/70 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Group Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-emerald-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{group.member_count}</div>
                    <div className="text-white/70">Members</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{group.events.length}</div>
                    <div className="text-white/70">Events</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-lg font-semibold text-white">{group.creator.first_name} {group.creator.last_name}</div>
                    <div className="text-white/70">Creator</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Members */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Members</h3>
              <div className="space-y-3">
                {group.members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.first_name[0]}{member.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{member.first_name} {member.last_name}</div>
                        <div className="text-white/50 text-sm">@{member.username}</div>
                      </div>
                    </div>
                    <div className="text-white/50 text-sm">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Group Members ({group.members.length})</h3>
              {isGroupCreator && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Members
                </button>
              )}
            </div>

            <div className="space-y-4">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {member.first_name[0]}{member.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium flex items-center">
                        {member.first_name} {member.last_name}
                        {member.id === group.creator_id && (
                          <Crown className="w-4 h-4 ml-2 text-yellow-400" />
                        )}
                      </div>
                      <div className="text-white/50 text-sm">@{member.username}</div>
                    </div>
                  </div>
                  <div className="text-white/50 text-sm">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Group Events</h3>
              {isGroupCreator && (
                <button className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200">
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Event
                </button>
              )}
            </div>

            {group.events.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">No events yet</h4>
                <p className="text-white/70">Create the first event for this group!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {group.events.map((event) => (
                  <div key={event.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-white mb-2">{event.title}</h4>
                        <p className="text-white/70 mb-4">{event.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-white/60">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(event.event_time).toLocaleDateString()} at {new Date(event.event_time).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white/60 mb-2">Responses</div>
                        <div className="space-y-1">
                          <div className="text-emerald-400">Going: {event.going_count}</div>
                          <div className="text-red-400">Not Going: {event.not_going_count}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 h-[600px]">
            <GroupChat groupId={parseInt(id as string)} groupTitle={group.title} />
          </div>
        )}
      </div>

      {/* Invite Members Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"></div>

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Invite Members</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white font-medium text-sm">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteUser}
                    disabled={isInviting || !inviteEmail.trim()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInviting ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedGroupDetails() {
  return (
    <ProtectedRoute>
      <GroupDetailsPage />
    </ProtectedRoute>
  )
}

export default ProtectedGroupDetails
