'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus, useOnlineStatus } from '@/hooks'
import { api, Event, API_BASE_URL, Member } from '@/lib/api'
import GroupWindow from '@/components/GroupWindow'
import {
  Users,
  Calendar,
  MessageCircle,
  Settings,
  UserPlus,
  LogOut,
  Crown,
  Clock,
  ArrowLeft,
  X,
  Shield,
  ShieldCheck
} from 'lucide-react'
import CreateEvent from '@/components/dashboard/CreateEvent'
import CreateGroupPost from '@/components/dashboard/CreateGroupPost'
import GroupFeed from '@/components/dashboard/GroupFeed'
import AppLayout from '@/components/AppLayout'

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
  members: Member[]
  events: Event[]
}

function GroupDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useToast()
  const { isConnected } = useConnectionStatus()
  const { onlineUsers } = useOnlineStatus()

  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  // User role state
  const [isAdminOrCreator, setIsAdminOrCreator] = useState(false)

  // Get online member count
  const onlineMemberCount = group?.members.filter(member => 
    onlineUsers.some(onlineUser => onlineUser.user_id === member.id && onlineUser.status === 'online')
  ).length || 0

  const fetchGroupDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      const groupId = parseInt(id as string)

      // Fetch group details directly by ID
      const groupInfo = await api.getGroup(groupId)

      // Fetch group members
      const membersData = await api.getGroupMembers(groupId)
      const members = membersData.members || []

      // Fetch group events
      const eventsData = await api.getUserEvents()
      const groupEvents = eventsData.events.filter((event: Event) => event.group_id === groupId)

      // Fetch group posts
      // const postsData = await api.getGroupPosts(groupId)
      // const groupPosts = postsData.posts || []

      // setPosts(groupPosts)

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
        members: members || [],
        events: groupEvents
      })

      // Fetch user role
      try {
        const roleData = await api.getUserRole(groupId)
        setIsAdminOrCreator(roleData.is_admin_or_creator)
      } catch (roleError) {
        console.error('Error fetching user role:', roleError)
        setIsAdminOrCreator(false)
      }
    } catch (err) {
      console.error('Error fetching group details:', err)
      error('Failed to load group details')
    } finally {
      setIsLoading(false)
    }
  }, [id, error])

  useEffect(() => {
    if (id) {
      fetchGroupDetails()
    }
  }, [id, fetchGroupDetails])

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
      router.push('/feed/all')
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

  const handlePromoteToAdmin = async (userId: number) => {
    if (!group) return

    try {
      await api.promoteToAdmin(group.id, userId)
      success('User promoted to admin successfully')
      fetchGroupDetails() // Refresh to update roles
    } catch (err) {
      console.error('Error promoting user:', err)
      error('Failed to promote user')
    }
  }

  const handleDemoteAdmin = async (userId: number) => {
    if (!group) return

    try {
      await api.demoteAdmin(group.id, userId)
      success('Admin demoted to member successfully')
      fetchGroupDetails() // Refresh to update roles
    } catch (err) {
      console.error('Error demoting admin:', err)
      error('Failed to demote admin')
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
    <AppLayout activeTab="chats" chatSubTab="groups">
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/feed/all')}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  title="Back to Feed"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center space-x-3">
                    <span>{group.title}</span>
                    <div className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isConnected ? 'Live' : 'Offline'}
                    </div>
                  </h1>
                  <p className="text-white/70 mt-1">{group.description}</p>
                  {!isConnected && (
                    <p className="text-yellow-400 text-sm mt-1">
                      Group data may be outdated while offline
                    </p>
                  )}
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
                    disabled={!isConnected}
                    className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 ${
                      isConnected 
                        ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 hover:text-red-200' 
                        : 'bg-gray-500 border border-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isConnected ? 'Leave Group' : 'Offline'}
                  </button>
                ) : (
                  <button
                    onClick={handleJoinGroup}
                    disabled={isJoining || !isConnected}
                    className={`flex items-center px-4 py-2 rounded-xl text-white transition-all duration-200 disabled:opacity-50 ${
                      isConnected 
                        ? 'bg-emerald-500 hover:bg-emerald-600' 
                        : 'bg-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isJoining ? 'Joining...' : isConnected ? 'Join Group' : 'Offline'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Group Window */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 h-[700px]">
            <GroupWindow 
              groupId={parseInt(id as string)} 
              groupTitle={group.title}
              isGroupMember={group.is_member}
              userRole={isAdminOrCreator ? 'admin' : 'member'}
            />
          </div>
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
    </AppLayout>
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
