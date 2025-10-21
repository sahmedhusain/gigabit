'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Users,
  Globe,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  X,
  MessageCircle,
  Eye,
  Filter,
  Grid3X3,
  List,
  UserX,
  ArrowRightLeft,
  Bell,
  Send,
  Inbox,
  UserMinus,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  Lock,
  Heart
} from 'lucide-react'
import { useRealTimePosts, useFollowers, useConnectionStatus, useFollowerCounts } from '@/hooks'
import { getAvatarUrl } from '@/utils/avatarUtils'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { FollowStatus } from './FollowHandler'
import { User, api, GroupResponse, FollowRequestItem } from '@/lib/api'
import FollowHandler from './FollowHandler'

// Letter Avatar Component with Chat Style
function LetterAvatar({
  name,
  size = 64,
  className = ''
}: {
  name: string
  size?: number
  className?: string
}) {
  const firstTwoLetters = name.substring(0, 2).toUpperCase()
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ]
  const colorIndex = name.length % colors.length
  const bgColor = colors[colorIndex]

  const sizeClasses = {
    48: 'w-12 h-12 text-sm',
    64: 'w-16 h-16 text-lg'
  }

  return (
    <motion.div
      className={`w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden ${className}`}
      whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-white font-bold text-xl">
        {firstTwoLetters}
      </span>
    </motion.div>
  )
}

interface DiscoverUser extends User {
  followStatus: FollowStatus & { isFollowedBy: boolean }
  isOnline: boolean
}

interface DiscoverGroup extends GroupResponse {
  joinStatus: 'none' | 'sent' | 'requested' | 'member' | 'rejected'
}

interface GroupJoinRequest {
  id: number
  group: GroupResponse
  user: User
  requested_at: string
  status: 'pending' | 'accepted' | 'declined'
}

type RequestItem = {
  request_id: number
  user: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  }
  requested_at: string
  type: 'follow'
  direction?: 'incoming' | 'outgoing'
} | {
  request_id: number
  user: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  }
  requested_at: string
  type: 'group_join'
  group: GroupResponse
  direction?: 'incoming' | 'outgoing'
} | {
  request_id: number
  user: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  }
  requested_at: string
  type: 'group_invitation'
  group: GroupResponse
  direction?: 'incoming' | 'outgoing'
}

type ViewMode = 'grid' | 'list'
type ActiveTab = 'users' | 'groups' | 'requests'
type UserFilter = 'all' | 'following' | 'not_following' | 'pending'
type GroupFilter = 'all' | 'member' | 'not_member' | 'requested' | 'sent' | 'rejected'
type RequestType = 'all' | 'incoming' | 'outgoing'

export default function DiscoverPage() {
  const { user: currentUser } = useAuth()
  const { success, error, warning } = useToast()
  const { isConnected } = useConnectionStatus()
  const { sendMessage } = useWebSocket()
  const router = useRouter()

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('users')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Filter states
  const [userFilter, setUserFilter] = useState<UserFilter>('all')
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  const [requestType, setRequestType] = useState<RequestType>('all')

  // Data state
  const [users, setUsers] = useState<DiscoverUser[]>([])
  const [groups, setGroups] = useState<DiscoverGroup[]>([])
  const [followRequests, setFollowRequests] = useState<{
    incoming: FollowRequestItem[]
    outgoing: FollowRequestItem[]
  }>({ incoming: [], outgoing: [] })
  const [groupRequests, setGroupRequests] = useState<{
    incoming: GroupJoinRequest[]
    outgoing: GroupJoinRequest[]
  }>({ incoming: [], outgoing: [] })
  const [groupInvitations, setGroupInvitations] = useState<{
    incoming: GroupJoinRequest[]
    outgoing: GroupJoinRequest[]
  }>({ incoming: [], outgoing: [] })

  // Confirmation modal states
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState<{ userId: number; userName: string } | null>(null)

  // Filtered data
  const [filteredUsers, setFilteredUsers] = useState<DiscoverUser[]>([])
  const [filteredGroups, setFilteredGroups] = useState<DiscoverGroup[]>([])
  const [filteredRequests, setFilteredRequests] = useState<RequestItem[]>([])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!currentUser) return

    try {
      const [usersResponse] = await Promise.all([
        api.getUsers()
      ])

      // Get follow status for each user to determine mutual follows
      const followStatusPromises = usersResponse.users
        .filter(u => u.id !== currentUser.id)
        .map(user => api.getFollowStatus(user.id).catch(() => ({ is_following: false, is_pending: false, is_followed_by: false, status: 'not_following' })))

      const followStatuses = await Promise.all(followStatusPromises)

      const discoverUsers: DiscoverUser[] = usersResponse.users
        .filter(u => u.id !== currentUser.id)
        .map((user, index) => {
          const followStatus = followStatuses[index] || { is_following: false, is_pending: false, is_followed_by: false, status: 'not_following' }
          const isFollowing = followStatus.is_following
          const isPending = followStatus.is_pending
          const isFollowedBy = followStatus.is_followed_by || false

          let status: FollowStatus['status'] = 'not_following'
          if (isPending) {
            status = 'pending'
          } else if (isFollowing) {
            status = isFollowedBy ? 'follow_back' : 'following'
          } else if (isFollowedBy) {
            status = 'follow_back'
          }

          return {
            ...user,
            followStatus: {
              isFollowing,
              isPending,
              isFollowedBy,
              status
            },
            isOnline: Math.random() > 0.5 // Mock online status
          }
        })

      setUsers(discoverUsers)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      error('Failed to load users')
    }
  }, [currentUser, error])

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    if (!currentUser) return

    try {
      const [allGroupsResponse, userGroupsResponse] = await Promise.all([
        api.getAllGroups(50, 0),
        api.getUserGroups(currentUser.id)
      ])

      const userGroupIds = new Set(userGroupsResponse.groups.map(g => g.id))
      const userGroupRoles = new Map(userGroupsResponse.groups.map(g => [g.id, g.role]))

      const publicGroups: DiscoverGroup[] = allGroupsResponse.groups
        .filter(group => group.privacy === 'public')
        .map(group => ({
          ...group,
          joinStatus: group.member_status || (userGroupIds.has(group.id) ? 'member' : 'none'),
          role: userGroupRoles.get(group.id)
        }))

      setGroups(publicGroups)
    } catch (err) {
      console.error('Failed to fetch groups:', err)
      error('Failed to load groups')
    }
  }, [currentUser, error])

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!currentUser) return

    try {
      const [followRequestsResponse, outgoingFollowRequestsResponse, groupInvitationsResponse, outgoingGroupJoinRequestsResponse] = await Promise.all([
        api.getFollowRequests(),
        api.getOutgoingFollowRequests(),
        api.getGroupInvitations ? api.getGroupInvitations() : Promise.resolve({ invitations: [] }),
        api.getOutgoingGroupJoinRequests()
      ])

      // Get group requests for groups where user is admin
      const adminGroups = groups.filter(group => group.role === 'admin' || group.role === 'creator')

      const groupRequestsPromises = adminGroups
        .map(group => api.getPendingJoinRequests(group.id))

      const groupRequestsResponses = await Promise.all(groupRequestsPromises)

      const incomingGroupRequests: GroupJoinRequest[] = []
      groupRequestsResponses.forEach((response, index) => {
        const group = groups.filter(g => g.role === 'admin' || g.role === 'creator')[index]
        if (response.requests) {
          response.requests.forEach(request => {
            incomingGroupRequests.push({
              id: Math.random(), // Mock ID
              group,
              user: request.user,
              requested_at: request.requested_at,
              status: 'pending'
            })
          })
        }
      })

      // Process outgoing group join requests
      const outgoingGroupRequests: GroupJoinRequest[] = (outgoingGroupJoinRequestsResponse.requests || [])
        .filter((request: any) => request.group) // Filter out requests with no group
        .map((request: any) => ({
          id: request.id,
          group: request.group,
          user: request.user || { id: currentUser.id, first_name: currentUser.first_name, last_name: currentUser.last_name, avatar: currentUser.avatar, nickname: currentUser.nickname },
          requested_at: request.created_at,
          status: 'pending'
        }))

      // Process group invitations
      const incomingGroupInvitations: GroupJoinRequest[] = (groupInvitationsResponse.invitations || [])
        .filter((invitation: any) => invitation.invited_by || invitation.user) // Filter out invitations with no user
        .map((invitation: any) => ({
          id: invitation.id,
          group: invitation.group,
          user: invitation.invited_by || invitation.user, // The user who sent the invitation
          requested_at: invitation.invited_at || invitation.requested_at,
          status: 'pending'
        }))

      const outgoingGroupInvitations: GroupJoinRequest[] = []

      setFollowRequests({
        incoming: followRequestsResponse.requests || [],
        outgoing: outgoingFollowRequestsResponse.requests || []
      })

      setGroupRequests({
        incoming: incomingGroupRequests,
        outgoing: outgoingGroupRequests
      })

      setGroupInvitations({
        incoming: incomingGroupInvitations,
        outgoing: outgoingGroupInvitations
      })
    } catch (err) {
      console.error('Failed to fetch requests:', err)
      setFollowRequests({ incoming: [], outgoing: [] })
      setGroupRequests({ incoming: [], outgoing: [] })
      setGroupInvitations({ incoming: [], outgoing: [] })
    }
  }, [currentUser, groups])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchUsers(), fetchGroups()])
      setIsLoading(false)
    }

    loadData()
  }, [fetchUsers, fetchGroups])

  // Load requests when groups are loaded
  useEffect(() => {
    if (groups.length > 0) {
      fetchRequests()
    }
  }, [groups, fetchRequests])

  // Filter data based on search and filters
  useEffect(() => {
    if (activeTab === 'users') {
      let filtered = users.filter(user =>
        searchQuery === '' ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
      )

      // Apply user filter
      switch (userFilter) {
        case 'following':
          filtered = filtered.filter(user => user.followStatus.isFollowing)
          break
        case 'not_following':
          filtered = filtered.filter(user => !user.followStatus.isFollowing && !user.followStatus.isPending)
          break
        case 'pending':
          filtered = filtered.filter(user => user.followStatus.isPending)
          break
      }

      setFilteredUsers(filtered)
    } else if (activeTab === 'groups') {
      let filtered = groups.filter(group =>
        searchQuery === '' ||
        group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )

      // Apply group filter
      switch (groupFilter) {
        case 'member':
          filtered = filtered.filter(group => group.joinStatus === 'member')
          break
        case 'not_member':
          filtered = filtered.filter(group => group.joinStatus === 'none')
          break
        case 'requested':
          filtered = filtered.filter(group => group.joinStatus === 'requested')
          break
        case 'sent':
          filtered = filtered.filter(group => group.joinStatus === 'sent')
          break
        case 'rejected':
          filtered = filtered.filter(group => group.joinStatus === 'rejected')
          break
      }

      setFilteredGroups(filtered)
    } else if (activeTab === 'requests') {
      const requests = requestType === 'incoming'
        ? [
            ...(followRequests.incoming || [])
              .filter(r => r.user) // Filter out requests with no user
              .map(r => ({
                request_id: r.user.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'follow' as const
              })),
            ...(groupRequests.incoming || [])
              .filter(r => r.user) // Filter out requests with no user
              .map(r => ({
                request_id: r.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'group_join' as const,
                group: r.group
              })),
            ...(groupInvitations.incoming || [])
              .filter(r => r.user) // Filter out requests with no user
              .map(r => ({
                request_id: r.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'group_invitation' as const,
                group: r.group
              }))
          ]
        : requestType === 'outgoing'
        ? [
            ...(followRequests.outgoing || [])
              .filter(r => r.user) // Filter out requests with no user
              .map(r => ({
                request_id: r.request_id || r.user.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'follow' as const
              })),
            ...(groupRequests.outgoing || [])
              .filter(r => r.user) // Filter out requests with no user
              .map(r => ({
                request_id: r.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'group_join' as const,
                group: r.group
              })),
            ...(groupInvitations.outgoing || [])
              .filter(r => r.user) // Filter out requests with no user
              .map(r => ({
                request_id: r.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'group_invitation' as const,
                group: r.group
              }))
          ]
        : [
            // All requests
            ...(followRequests.incoming || [])
              .filter(r => r.user)
              .map(r => ({
                request_id: r.user.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'follow' as const,
                direction: 'incoming' as const
              })),
            ...(followRequests.outgoing || [])
              .filter(r => r.user)
              .map(r => ({
                request_id: r.request_id || r.user.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'follow' as const,
                direction: 'outgoing' as const
              })),
            ...(groupRequests.incoming || [])
              .filter(r => r.user)
              .map(r => ({
                request_id: r.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'group_join' as const,
                group: r.group,
                direction: 'incoming' as const
              })),
            ...(groupRequests.outgoing || [])
              .filter(r => r.user)
              .map(r => ({
                request_id: r.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'group_join' as const,
                group: r.group,
                direction: 'outgoing' as const
              })),
            ...(groupInvitations.incoming || [])
              .filter(r => r.user)
              .map(r => ({
                request_id: r.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'group_invitation' as const,
                group: r.group,
                direction: 'incoming' as const
              })),
            ...(groupInvitations.outgoing || [])
              .filter(r => r.user)
              .map(r => ({
                request_id: r.id,
                user: r.user,
                requested_at: r.requested_at,
                type: 'group_invitation' as const,
                group: r.group,
                direction: 'outgoing' as const
              }))
          ]

      const filtered = requests.filter(request =>
        searchQuery === '' ||
        `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.user?.nickname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.type === 'group_join' && request.group?.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (request.type === 'group_invitation' && request.group?.title?.toLowerCase().includes(searchQuery.toLowerCase()))
      )

      setFilteredRequests(filtered)
    }
  }, [users, groups, followRequests, groupRequests, groupInvitations, searchQuery, activeTab, userFilter, groupFilter, requestType])

  // Handle unfollow confirmation
  const handleUnfollowConfirm = (userId: number, userName: string) => {
    setShowUnfollowConfirm({ userId, userName })
  }

  // Handle confirmed unfollow
  const handleConfirmedUnfollow = async () => {
    if (!showUnfollowConfirm) return

    // Update the follow status directly
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === showUnfollowConfirm.userId
          ? { ...user, followStatus: { ...user.followStatus, isFollowing: false, status: user.followStatus.isFollowedBy ? 'follow_back' : 'not_following' } }
          : user
      )
    )

    // Send unfollow WebSocket message
    sendMessage({
      type: 'unfollow' as const,
      to: showUnfollowConfirm.userId,
      action: 'unfollow',
      data: {
        user_id: showUnfollowConfirm.userId,
        user_name: showUnfollowConfirm.userName,
        is_private: false // We don't have this info in the discover context
      }
    })

    setShowUnfollowConfirm(null)
  }

  // Handle follow status change
  const handleFollowStatusChange = (userId: number, status: FollowStatus) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, followStatus: status }
          : user
      )
    )
  }

  // Handle user click
  const handleUserClick = (userId: number) => {
    router.push(`/profile/${userId}`)
  }

  // Handle group join
  const handleJoinGroup = async (groupId: number) => {
    if (!isConnected) {
      warning('Connection required to join groups')
      return
    }

    try {
      await api.joinGroup(groupId)
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === groupId
            ? { ...group, joinStatus: 'requested' }
            : group
        )
      )
      success('Join request sent! Waiting for approval.')
    } catch (err) {
      error('Failed to send join request')
    }
  }

  // Handle group leave
  const handleLeaveGroup = async (groupId: number) => {
    if (!isConnected) {
      warning('Connection required to leave groups')
      return
    }

    try {
      await api.leaveGroup(groupId)
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === groupId
            ? { ...group, joinStatus: 'none' }
            : group
        )
      )
      success('Successfully left the group!')
    } catch (err) {
      error('Failed to leave group')
    }
  }

  // Handle open group
  const handleOpenGroup = (groupId: number) => {
    router.push(`/group/${groupId}`)
  }

  // Handle cancel join request
  const handleCancelJoinRequest = async (groupId: number) => {
    if (!isConnected) {
      warning('Connection required to cancel join request')
      return
    }

    try {
      await api.leaveGroup(groupId)
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === groupId
            ? { ...group, joinStatus: 'none' }
            : group
        )
      )
      success('Join request cancelled!')
    } catch (err) {
      error('Failed to cancel join request')
    }
  }

  // Handle follow request response
  const handleFollowRequestResponse = async (userId: number, action: 'accept' | 'decline') => {
    try {
      await api.respondToFollowRequest(userId, action)
      setFollowRequests(prev => ({
        ...prev,
        incoming: prev.incoming.filter(r => r.user.id !== userId)
      }))
      success(`Follow request ${action}ed`)
    } catch (err) {
      error('Failed to respond to follow request')
    }
  }

  // Handle group invitation response
  const handleGroupInvitationResponse = async (groupId: number, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        await api.acceptGroupInvitation(groupId)
        setGroups(prevGroups =>
          prevGroups.map(group =>
            group.id === groupId
              ? { ...group, joinStatus: 'member' }
              : group
          )
        )
      } else {
        await api.declineGroupInvitation(groupId)
        setGroups(prevGroups =>
          prevGroups.map(group =>
            group.id === groupId
              ? { ...group, joinStatus: 'none' }
              : group
          )
        )
      }
      setGroupInvitations(prev => ({
        ...prev,
        incoming: prev.incoming.filter(r => r.group.id !== groupId)
      }))
      success(`Group invitation ${action}ed`)
    } catch (err) {
      error('Failed to respond to group invitation')
    }
  }

  // Handle group join request response
  const handleGroupJoinRequestResponse = async (groupId: number, userId: number, action: 'accept' | 'decline') => {
    try {
      await api.respondToJoinRequest(groupId, userId, action)
      setGroupRequests(prev => ({
        ...prev,
        incoming: prev.incoming.filter(r => r.group.id !== groupId || r.user.id !== userId)
      }))
      success(`Join request ${action}ed`)
    } catch (err) {
      error('Failed to respond to group join request')
    }
  }

  // Handle cancel follow request
  const handleCancelFollowRequest = async (userId: number) => {
    if (!isConnected) {
      warning('Connection required to cancel follow request')
      return
    }

    try {
      // Use DELETE unfollow endpoint to cancel an outgoing follow request
      // Try DELETE first (current server expects this for cancelling your outgoing request).
      // If the server returns not-found or doesn't support this semantic, fall back to the PUT 'remove' action.
      console.debug('Attempting to cancel outgoing follow request (DELETE) for user:', userId)
      await api.unfollowUser(userId)
      setFollowRequests(prev => ({
        ...prev,
        outgoing: prev.outgoing.filter(r => r.user.id !== userId)
      }))
      success('Follow request cancelled!')
    } catch (err) {
      // If unfollow returned 404/not found, some servers expect a PUT remove action where the follower id
      // is in the URL and the authenticated user is the target (remove follower). Try the alternate path.
      console.debug('unfollowUser failed, attempting fallback respondToFollowRequest remove. error=', err)
  const status = (err as any)?.status || (err as any)?.statusCode || (err instanceof Error && (err as any).status)
      if (status === 404) {
        try {
          await api.respondToFollowRequest(userId, 'remove')
          setFollowRequests(prev => ({
            ...prev,
            outgoing: prev.outgoing.filter(r => r.user.id !== userId)
          }))
          success('Follow request cancelled!')
          return
        } catch (err2) {
          console.error('Fallback respondToFollowRequest remove failed:', err2)
        }
      }

      error('Failed to cancel follow request')
    }
  }

  // Handle cancel group join request
  const handleCancelGroupJoinRequest = async (groupId: number) => {
    if (!isConnected) {
      warning('Connection required to cancel join request')
      return
    }

    try {
      // Use existing leaveGroup method to cancel request
      await api.leaveGroup(groupId)
      setGroupRequests(prev => ({
        ...prev,
        outgoing: prev.outgoing.filter(r => r.group.id !== groupId)
      }))
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === groupId
            ? { ...group, joinStatus: 'none' }
            : group
        )
      )
      success('Join request cancelled!')
    } catch (err) {
      error('Failed to cancel join request')
    }
  }

  // Handle cancel group invitation
  const handleCancelGroupInvitation = async (groupId: number, userId: number) => {
    if (!isConnected) {
      warning('Connection required to cancel invitation')
      return
    }

    try {
      // For now, just remove from local state since API method may not exist
      setGroupInvitations(prev => ({
        ...prev,
        outgoing: prev.outgoing.filter(r => r.group.id !== groupId && r.user.id !== userId)
      }))
      success('Invitation cancelled!')
    } catch (err) {
      error('Failed to cancel invitation')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 min-w-0 max-h-screen overflow-hidden">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b border-white/10">
            <div className="animate-pulse">
              <div className="h-6 bg-white/10 rounded-xl w-40 mb-2"></div>
              <div className="h-3 bg-white/10 rounded-lg w-48"></div>
            </div>
          </div>
          <div className="flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-white/20 rounded-full mx-auto"></div>
                    <div className="h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-white/20 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 max-h-screen overflow-hidden">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <Search className="w-7 h-7 text-emerald-400 mr-2" />
                Discover
              </h1>
              <p className="text-white/70 mt-1 text-sm">
                Find new people and communities
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
              title="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-2xl p-1.5 mb-4 border border-white/10 shadow-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl transition-all duration-300 flex-1 justify-center text-sm font-medium ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl transition-all duration-300 flex-1 justify-center text-sm font-medium ${
                activeTab === 'groups'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Groups</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl transition-all duration-300 flex-1 justify-center text-sm font-medium ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>
                Requests
                {((followRequests.incoming?.length || 0) + (groupRequests.incoming?.length || 0) + (groupInvitations.incoming?.length || 0) + (followRequests.outgoing?.length || 0) + (groupRequests.outgoing?.length || 0) + (groupInvitations.outgoing?.length || 0)) > 0 && (
                  <span className="ml-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-lg">
                    {(followRequests.incoming?.length || 0) + (groupRequests.incoming?.length || 0) + (groupInvitations.incoming?.length || 0) + (followRequests.outgoing?.length || 0) + (groupRequests.outgoing?.length || 0) + (groupInvitations.outgoing?.length || 0)}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200 text-sm shadow-lg"
              />
            </div>

            <div className="flex items-center space-x-2">
              {/* Filters */}
              {activeTab === 'users' && (
                <div className="relative">
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as UserFilter)}
                    className="px-3 py-2 pr-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200 shadow-lg appearance-none cursor-pointer hover:bg-white/10"
                    title="Filter users"
                  >
                    <option value="all">All Users</option>
                    <option value="following">Following</option>
                    <option value="not_following">Not Following</option>
                    <option value="pending">Pending</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="relative">
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value as GroupFilter)}
                    className="px-3 py-2 pr-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200 shadow-lg appearance-none cursor-pointer hover:bg-white/10"
                    title="Filter groups"
                  >
                    <option value="all">All Groups</option>
                    <option value="member">Member</option>
                    <option value="not_member">Not Member</option>
                    <option value="requested">Requested</option>
                    <option value="sent">Invited</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="flex bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10 shadow-lg">
                  <button
                    onClick={() => setRequestType('all')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      requestType === 'all' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    <span>All</span>
                  </button>
                  <button
                    onClick={() => setRequestType('incoming')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      requestType === 'incoming' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>Incoming</span>
                  </button>
                  <button
                    onClick={() => setRequestType('outgoing')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      requestType === 'outgoing' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>Outgoing</span>
                  </button>
                </div>
              )}

              {/* View Mode */}
              {activeTab !== 'requests' && (
                <div className="flex bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10 shadow-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    title="Grid view"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 min-h-0">
          {activeTab === 'users' ? (
            <UsersSection
              users={filteredUsers}
              viewMode={viewMode}
              onUserClick={handleUserClick}
              onFollowStatusChange={handleFollowStatusChange}
              onUnfollowConfirm={handleUnfollowConfirm}
              isConnected={isConnected}
            />
          ) : activeTab === 'groups' ? (
            <GroupsSection
              groups={filteredGroups}
              viewMode={viewMode}
              onJoinGroup={handleJoinGroup}
              onLeaveGroup={handleLeaveGroup}
              onOpenGroup={handleOpenGroup}
              onCancelJoinRequest={handleCancelJoinRequest}
              onGroupInvitationResponse={handleGroupInvitationResponse}
              isConnected={isConnected}
            />
          ) : (
            <RequestsSection
              requests={filteredRequests}
              requestType={requestType}
              onFollowResponse={handleFollowRequestResponse}
              onGroupJoinResponse={handleGroupJoinRequestResponse}
              onGroupInvitationResponse={handleGroupInvitationResponse}
              onCancelFollowRequest={handleCancelFollowRequest}
              onCancelGroupJoinRequest={handleCancelGroupJoinRequest}
              onCancelGroupInvitation={handleCancelGroupInvitation}
              isConnected={isConnected}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>

      {/* Unfollow Confirmation Modal */}
      <AnimatePresence>
        {showUnfollowConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUnfollowConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserMinus className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Unfollow User</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to unfollow <span className="text-white font-medium">{showUnfollowConfirm.userName}</span>?
                  You will no longer see their posts in your feed.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUnfollowConfirm(null)}
                    className="flex-1 px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleConfirmedUnfollow()
                    }}
                    className="flex-1 px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/25"
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Users Section Component
function UsersSection({
  users,
  viewMode,
  onUserClick,
  onFollowStatusChange,
  onUnfollowConfirm,
  isConnected
}: {
  users: DiscoverUser[]
  viewMode: ViewMode
  onUserClick: (userId: number) => void
  onFollowStatusChange: (userId: number, status: FollowStatus) => void
  onUnfollowConfirm: (userId: number, userName: string) => void
  isConnected: boolean
}) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white/70 mb-2">No users found</h3>
        <p className="text-white/50">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className={viewMode === 'grid'
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      : "space-y-3"
    }>
      {users.map((user) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`group relative overflow-hidden ${
            viewMode === 'grid'
              ? 'bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-emerald-500/10 p-6 hover:bg-gradient-to-br hover:from-white/12 hover:to-white/6'
              : 'bg-gradient-to-r from-white/8 to-white/4 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-emerald-500/10 p-6 hover:bg-gradient-to-r hover:from-white/12 hover:to-white/6 flex items-center space-x-6'
          } transition-all duration-500 cursor-pointer`}
          whileHover={{ y: -4 }}
          onClick={() => onUserClick(user.id)}
        >
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {viewMode === 'grid' && (
            <>
              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                {user.is_private && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-sm shadow-lg"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </motion.span>
                )}
                {user.followStatus.isFollowedBy && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm shadow-lg"
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    Follows You
                  </motion.span>
                )}
              </div>
            </>
          )}

          {/* Avatar Section */}
          <div className={`relative ${viewMode === 'grid' ? 'mb-6' : ''}`}>
            <div className={`relative ${viewMode === 'grid' ? 'mx-auto w-fit' : ''}`}>
              {/* Avatar glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 scale-110" />

              {user.avatar ? (
                <motion.div
                  className={`relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300 ${viewMode === 'grid' ? '' : ''}`}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={user.avatar}
                    alt={`${user.first_name} ${user.last_name}`}
                    width={viewMode === 'list' ? 56 : 64}
                    height={viewMode === 'list' ? 56 : 64}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const letterAvatar = document.createElement('div')
                        letterAvatar.className = `flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold rounded-full w-full h-full text-xl`
                        letterAvatar.textContent = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
                        parent.appendChild(letterAvatar)
                      }
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  className={`relative ${viewMode === 'grid' ? '' : ''}`}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <LetterAvatar
                    name={`${user.first_name} ${user.last_name}`}
                    size={viewMode === 'list' ? 56 : 64}
                    className="ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className={`flex-1 relative z-10 ${viewMode === 'grid' ? 'text-center' : ''}`}>
            {viewMode === 'list' ? (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <motion.h3
                    className="font-bold text-white text-xl mb-2 group-hover:text-emerald-300 transition-colors duration-300"
                    initial={{ opacity: 0.9 }}
                    whileHover={{ opacity: 1 }}
                  >
                    {user.first_name} {user.last_name}
                  </motion.h3>
                  {user.nickname && (
                    <p className="text-emerald-400 text-sm mb-2 group-hover:text-emerald-300 transition-colors duration-300">
                      @{user.nickname}
                    </p>
                  )}
                  <p className="text-white/60 text-sm group-hover:text-white/80 transition-colors duration-300">
                    {user.email}
                  </p>
                </div>
                <div className="flex flex-col gap-1 ml-4">
                  {user.is_private && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-sm shadow-lg"
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </motion.span>
                  )}
                  {user.followStatus.isFollowedBy && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm shadow-lg"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      Follows You
                    </motion.span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <motion.h3
                  className="font-bold text-white text-xl mb-2 group-hover:text-emerald-300 transition-colors duration-300"
                  initial={{ opacity: 0.9 }}
                  whileHover={{ opacity: 1 }}
                >
                  {user.first_name} {user.last_name}
                </motion.h3>
                {user.nickname && (
                  <p className="text-emerald-400 text-sm mb-2 group-hover:text-emerald-300 transition-colors duration-300">
                    @{user.nickname}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Action Button */}
          <div className={`relative z-10 ${viewMode === 'grid' ? 'mt-auto flex justify-center' : ''}`}>
            <div onClick={(e) => e.stopPropagation()}>
              <FollowHandler
                targetUser={user}
                currentFollowStatus={user.followStatus}
                onStatusChange={(status) => onFollowStatusChange(user.id, status)}
                confirmUnfollow={true}
                onUnfollowConfirm={() => onUnfollowConfirm(user.id, `${user.first_name} ${user.last_name}`)}
                size={viewMode === 'list' ? 'sm' : 'md'}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Groups Section Component
function GroupsSection({
  groups,
  viewMode,
  onJoinGroup,
  onLeaveGroup,
  onOpenGroup,
  onCancelJoinRequest,
  onGroupInvitationResponse,
  isConnected
}: {
  groups: DiscoverGroup[]
  viewMode: ViewMode
  onJoinGroup: (groupId: number) => void
  onLeaveGroup: (groupId: number) => void
  onOpenGroup: (groupId: number) => void
  onCancelJoinRequest: (groupId: number) => void
  onGroupInvitationResponse: (groupId: number, action: 'accept' | 'decline') => void
  isConnected: boolean
}) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white/70 mb-2">No groups found</h3>
        <p className="text-white/50">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className={viewMode === 'grid'
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      : "space-y-4"
    }>
      {groups.map((group) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`group relative overflow-hidden ${
            viewMode === 'grid'
              ? 'bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-emerald-500/10 p-6 hover:bg-gradient-to-br hover:from-white/12 hover:to-white/6'
              : 'bg-gradient-to-r from-white/8 to-white/4 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-emerald-500/10 p-6 hover:bg-gradient-to-r hover:from-white/12 hover:to-white/6 flex items-center space-x-6'
          } transition-all duration-500 cursor-pointer`}
          whileHover={{ y: -4 }}
        >
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {viewMode === 'grid' && (
            <>
              {/* Badges - repositioned for better visibility */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                {group.joinStatus === 'sent' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-sm shadow-lg"
                  >
                    <Bell className="w-3 h-3 mr-1.5" />
                    Invited
                  </motion.span>
                )}
                {(group.role === 'admin' || group.role === 'creator') && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-sm shadow-lg"
                  >
                    <UserCheck className="w-3 h-3 mr-1.5" />
                    Admin
                  </motion.span>
                )}
                {group.joinStatus === 'member' && !(group.role === 'admin' || group.role === 'creator') && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm shadow-lg"
                  >
                    <Users className="w-3 h-3 mr-1.5" />
                    Member
                  </motion.span>
                )}
                {group.joinStatus === 'requested' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-400/30 backdrop-blur-sm shadow-lg"
                  >
                    <Clock className="w-3 h-3 mr-1.5" />
                    Requested
                  </motion.span>
                )}
                {group.joinStatus === 'rejected' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-400/30 backdrop-blur-sm shadow-lg"
                  >
                    <X className="w-3 h-3 mr-1.5" />
                    Rejected
                  </motion.span>
                )}
              </div>
            </>
          )}

          {/* Avatar Section */}
          <div className={`relative ${viewMode === 'grid' ? 'mb-6' : ''}`}>
            <div className={`relative ${viewMode === 'grid' ? 'mx-auto w-fit' : ''}`}>
              {/* Avatar glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 scale-110" />

              {group.avatar ? (
                <motion.div
                  className={`relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300 ${viewMode === 'grid' ? '' : ''}`}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={group.avatar}
                    alt={group.title}
                    width={viewMode === 'list' ? 56 : 64}
                    height={viewMode === 'list' ? 56 : 64}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const letterAvatar = document.createElement('div')
                        letterAvatar.className = `flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold rounded-full w-full h-full text-xl`
                        letterAvatar.textContent = group.title.substring(0, 2).toUpperCase()
                        parent.appendChild(letterAvatar)
                      }
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  className={`relative ${viewMode === 'grid' ? '' : ''}`}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <LetterAvatar
                    name={group.title}
                    size={viewMode === 'list' ? 56 : 64}
                    className="ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className={`flex-1 relative z-10 ${viewMode === 'grid' ? 'text-center' : ''}`}>
            <motion.h3
              className="font-bold text-white text-xl mb-2 group-hover:text-emerald-300 transition-colors duration-300"
              initial={{ opacity: 0.9 }}
              whileHover={{ opacity: 1 }}
            >
              {group.title}
            </motion.h3>
            <p className="text-white/70 text-sm mb-4 line-clamp-2 leading-relaxed group-hover:text-white/80 transition-colors duration-300">
              {group.description || 'No description available'}
            </p>

            {/* Stats */}
            <div className={`flex items-center ${viewMode === 'grid' ? 'justify-center' : ''} space-x-6 mb-6 text-sm text-white/60`}>
              <motion.div
                className="flex items-center space-x-2 group-hover:text-emerald-400 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">{group.member_count || 0}</span>
              </motion.div>
              <motion.div
                className="flex items-center space-x-2 group-hover:text-blue-400 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <Eye className="w-4 h-4" />
                <span className="font-medium">Public</span>
              </motion.div>

              {viewMode === 'list' && (
                <div className="flex flex-col gap-1 ml-1">
                  {group.joinStatus === 'sent' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-sm shadow-lg"
                    >
                      <Bell className="w-3 h-3 mr-1" />
                      Invited
                    </motion.span>
                  )}
                  {(group.role === 'admin' || group.role === 'creator') && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-sm shadow-lg"
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      Admin
                    </motion.span>
                  )}
                  {group.joinStatus === 'member' && !(group.role === 'admin' || group.role === 'creator') && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm shadow-lg"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Member
                    </motion.span>
                  )}
                  {group.joinStatus === 'requested' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-400/30 backdrop-blur-sm shadow-lg"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Requested
                    </motion.span>
                  )}
                  {group.joinStatus === 'rejected' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-400/30 backdrop-blur-sm shadow-lg"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Rejected
                    </motion.span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className={`relative z-10 ${viewMode === 'grid' ? 'mt-auto' : ''}`}>
            {group.joinStatus === 'member' ? (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenGroup(group.id)
                }}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white/80 hover:text-white border border-white/30 hover:border-white/50 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Open Group
              </motion.button>
            ) : group.joinStatus === 'sent' ? (
              <div className="flex space-x-3">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    onGroupInvitationResponse(group.id, 'accept')
                  }}
                  disabled={!isConnected}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    onGroupInvitationResponse(group.id, 'decline')
                  }}
                  disabled={!isConnected}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </motion.button>
              </div>
            ) : group.joinStatus === 'requested' ? (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  onCancelJoinRequest(group.id)
                }}
                disabled={!isConnected}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg shadow-yellow-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Request
              </motion.button>
            ) : group.joinStatus === 'rejected' ? (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  onJoinGroup(group.id)
                }}
                disabled={!isConnected}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Try Again
              </motion.button>
            ) : (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  onJoinGroup(group.id)
                }}
                disabled={!isConnected}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Join Group
              </motion.button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Requests Section Component
function RequestsSection({
  requests,
  requestType,
  onFollowResponse,
  onGroupJoinResponse,
  onGroupInvitationResponse,
  onCancelFollowRequest,
  onCancelGroupJoinRequest,
  onCancelGroupInvitation,
  isConnected,
  currentUser
}: {
  requests: RequestItem[]
  requestType: RequestType
  onFollowResponse: (userId: number, action: 'accept' | 'decline') => void
  onGroupJoinResponse: (groupId: number, userId: number, action: 'accept' | 'decline') => void
  onGroupInvitationResponse: (groupId: number, action: 'accept' | 'decline') => void
  onCancelFollowRequest: (userId: number) => void
  onCancelGroupJoinRequest: (groupId: number) => void
  onCancelGroupInvitation: (groupId: number, userId: number) => void
  isConnected: boolean
  currentUser: User | null
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white/70 mb-2">
          No {requestType === 'all' ? '' : requestType} requests
        </h3>
        <p className="text-white/50">
          {requestType === 'incoming'
            ? 'You have no pending requests to respond to'
            : requestType === 'outgoing'
            ? 'You have no pending requests sent'
            : 'You have no pending requests'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <motion.div
          key={request.request_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="group relative overflow-hidden bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-emerald-500/10 p-6 hover:bg-gradient-to-br hover:from-white/12 hover:to-white/6 transition-all duration-500"
          whileHover={{ y: -2 }}
        >
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar display logic */}
              {(request.type === 'group_join' || request.type === 'group_invitation') && request.group ? (
                request.group.avatar ? (
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-emerald-400 to-teal-600">
                      <motion.div
                        className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Image
                          src={request.group.avatar}
                          alt={request.group.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              const letterAvatar = document.createElement('div')
                              letterAvatar.className = `flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold rounded-full w-full h-full text-xl`
                              letterAvatar.textContent = request.group.title.substring(0, 2).toUpperCase()
                              parent.appendChild(letterAvatar)
                            }
                          }}
                        />
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    className="relative"
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LetterAvatar
                      name={request.group.title}
                      size={56}
                      className="ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                    />
                  </motion.div>
                )
              ) : request.user?.avatar ? (
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-emerald-400 to-teal-600">
                    <motion.div
                      className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                      whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={request.user.avatar}
                        alt={`${request.user?.first_name || 'User'} ${request.user?.last_name || ''}`}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const letterAvatar = document.createElement('div')
                            letterAvatar.className = `flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold rounded-full w-full h-full text-xl`
                            letterAvatar.textContent = `${(request.user?.first_name || 'U').charAt(0)}${(request.user?.last_name || '').charAt(0) || (request.user?.first_name || 'U').charAt(1) || 'U'}`.toUpperCase()
                            parent.appendChild(letterAvatar)
                          }
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
              ) : (
                <motion.div
                  className="relative"
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <LetterAvatar
                    name={`${request.user?.first_name || 'Unknown'} ${request.user?.last_name || 'User'}`}
                    size={56}
                    className="ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                  />
                </motion.div>
              )}
              <div className="flex-1">
                <motion.h3
                  className="font-bold text-white text-xl mb-1 group-hover:text-emerald-300 transition-colors duration-300"
                  initial={{ opacity: 0.9 }}
                  whileHover={{ opacity: 1 }}
                >
                  {(request.type === 'group_join' || request.type === 'group_invitation') && request.group
                    ? request.group.title || 'Unknown Group'
                    : `${request.user?.first_name || 'Unknown'} ${request.user?.last_name || 'User'}`}
                </motion.h3>
                {(request.type === 'group_join' || request.type === 'group_invitation') && request.group ? (
                  <p className="text-emerald-400 text-sm mb-2 group-hover:text-emerald-300 transition-colors duration-300">
                    {((request.type === 'group_join' || request.type === 'group_invitation') && request.user?.id === currentUser?.id)
                      ? `by you`
                      : `by ${request.user?.first_name || 'Unknown'} ${request.user?.last_name || 'User'}${request.user?.nickname ? ` (@${request.user.nickname})` : ''}`
                    }
                  </p>
                ) : (
                  request.user?.nickname && (
                    <p className="text-emerald-400 text-sm mb-2 group-hover:text-emerald-300 transition-colors duration-300">
                      @{request.user.nickname}
                    </p>
                  )
                )}
                <p className="text-white/70 text-sm mb-2 group-hover:text-white/80 transition-colors duration-300">
                  {request.type === 'follow'
                    ? (request.direction === 'incoming' ? 'Wants to follow you' : 'Follow request sent')
                    : request.type === 'group_join'
                    ? (request.user?.id === currentUser?.id ? 'Join request sent' : 'Join request received')
                    : (request.user?.id === currentUser?.id ? 'Group invitation sent' : 'Group invitation received')
                  }
                </p>
                <p className="text-white/50 text-xs group-hover:text-white/60 transition-colors duration-300">
                  {(() => {
                    try {
                      const dateStr = request.requested_at
                      if (!dateStr) return 'Date unavailable'

                      // Try different date parsing strategies
                      let date: Date | null = null

                      // Strategy 1: Direct Date constructor (ISO format)
                      date = new Date(dateStr)
                      if (isNaN(date.getTime())) {
                        // Strategy 2: Replace space with 'T' for ISO-like format
                        const isoStr = dateStr.replace(' ', 'T')
                        date = new Date(isoStr)
                      }
                      if (isNaN(date.getTime())) {
                        // Strategy 3: Try parsing as YYYY-MM-DD HH:mm:ss
                        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
                        if (match) {
                          date = new Date(
                            parseInt(match[1]),
                            parseInt(match[2]) - 1, // Month is 0-indexed
                            parseInt(match[3]),
                            parseInt(match[4]),
                            parseInt(match[5]),
                            parseInt(match[6])
                          )
                        }
                      }
                      if (isNaN(date.getTime())) {
                        // Strategy 4: Try parsing as DD/MM/YYYY or MM/DD/YYYY
                        const parts = dateStr.split(/[/\-]/)
                        if (parts.length === 3) {
                          // Assume MM/DD/YYYY format
                          date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
                          if (isNaN(date.getTime())) {
                            // Try DD/MM/YYYY format
                            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
                          }
                        }
                      }

                      if (date && !isNaN(date.getTime())) {
                        return date.toLocaleDateString()
                      }

                      return 'Date unavailable'
                    } catch {
                      return 'Date unavailable'
                    }
                  })()}
                </p>
              </div>
            </div>

            {((request.type === 'follow' && request.direction === 'incoming') ||
              ((request.type === 'group_join' || request.type === 'group_invitation') && request.user?.id !== currentUser?.id) ||
              requestType === 'incoming') ? (
              <div className="flex space-x-3">
                {request.type === 'follow' ? (
                  <>
                    <motion.button
                      onClick={() => request.user?.id && onFollowResponse(request.user.id, 'accept')}
                      disabled={!isConnected || !request.user?.id}
                      className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </motion.button>
                    <motion.button
                      onClick={() => request.user?.id && onFollowResponse(request.user.id, 'decline')}
                      disabled={!isConnected || !request.user?.id}
                      className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold backdrop-blur-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </motion.button>
                  </>
                ) : request.type === 'group_join' ? (
                  <>
                    <motion.button
                      onClick={() => request.user?.id && request.group?.id && onGroupJoinResponse(request.group.id, request.user.id, 'accept')}
                      disabled={!isConnected || !request.user?.id || !request.group?.id}
                      className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </motion.button>
                    <motion.button
                      onClick={() => request.user?.id && request.group?.id && onGroupJoinResponse(request.group.id, request.user.id, 'decline')}
                      disabled={!isConnected || !request.user?.id || !request.group?.id}
                      className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold backdrop-blur-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      onClick={() => request.group?.id && onGroupInvitationResponse(request.group.id, 'accept')}
                      disabled={!isConnected || !request.group?.id}
                      className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </motion.button>
                    <motion.button
                      onClick={() => request.group?.id && onGroupInvitationResponse(request.group.id, 'decline')}
                      disabled={!isConnected || !request.group?.id}
                      className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold backdrop-blur-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </motion.button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex space-x-3">
                {request.type === 'follow' ? (
                  <motion.button
                    onClick={() => request.user?.id && onCancelFollowRequest(request.user.id)}
                    disabled={!isConnected || !request.user?.id}
                    className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg shadow-yellow-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Request
                  </motion.button>
                ) : request.type === 'group_join' ? (
                  <motion.button
                    onClick={() => request.group?.id && onCancelGroupJoinRequest(request.group.id)}
                    disabled={!isConnected || !request.group?.id}
                    className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg shadow-yellow-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Request
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => request.group?.id && request.user?.id && onCancelGroupInvitation(request.group.id, request.user.id)}
                    disabled={!isConnected || !request.group?.id || !request.user?.id}
                    className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg shadow-yellow-500/25 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Invitation
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
