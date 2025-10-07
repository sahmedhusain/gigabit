'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Search, 
  User, 
  MessageCircle, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Globe, 
  UserCheck, 
  UserPlus,
  MapPin,
  Calendar,
  Eye,
  Grid3X3,
  Hash,
  Plus,
  ArrowUp,
  ArrowDown,
  Minus,
  Check,
  Clock3,
  XCircle,
  ShieldCheck,
  Lock
} from 'lucide-react'
import { api, User as UserType, GroupResponse, GroupMemberStatus } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus } from '@/hooks'
import FollowHandler, { FollowStatus, getFollowStatusFromAPI } from './FollowHandler'
import CreateGroup from './CreateGroup'

const normalizeGroupStatus = (group: { member_status?: GroupMemberStatus; is_member?: boolean }): GroupMemberStatus => {
  const status = group.member_status ?? (group.is_member ? 'member' : 'none')
  if (status === 'member' || status === 'sent' || status === 'rejected') {
    return status
  }
  return 'none'
}

interface UserWithFollowStatus extends UserType {
  followStatus: FollowStatus
  mutualFollowers?: number
  memberSince?: string
  recentActivity?: string
  location?: string
  isOnline?: boolean
}

interface GroupWithJoinStatus extends GroupResponse {
  recent_activity?: string
  trending_score?: number
}

interface TrendingTag {
  tag: string
  count: number
  growth: number
  trend: 'up' | 'down' | 'stable'
}

type UserFilter = 'all' | 'not_following' | 'online' | 'new_members'
type GroupFilter = 'all' | 'available' | 'joined' | 'active'
type SortBy = 'newest' | 'members' | 'active' | 'name_asc' | 'name_desc'
type DiscoverTab = 'users' | 'groups' | 'trending'

export default function DiscoverPage() {
  const { user: currentUser } = useAuth()
  const { success, error, warning } = useToast()
  const { isConnected } = useConnectionStatus()
  const router = useRouter()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<DiscoverTab>('users')
  
  // Users state
  const [users, setUsers] = useState<UserWithFollowStatus[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithFollowStatus[]>([])
  const [userFilter, setUserFilter] = useState<UserFilter>('not_following')
  
  // Groups state
  const [groups, setGroups] = useState<GroupWithJoinStatus[]>([])
  const [filteredGroups, setFilteredGroups] = useState<GroupWithJoinStatus[]>([])
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  
  // Trending tags state
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([])
  
  // General state
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const [usersResponse, followingResponse] = await Promise.all([
        api.getUsers(),
        api.getFollowing(currentUser!.id)
      ])

      const allUsers = usersResponse.users || []
      const followingUsers = followingResponse.following || []
      
      const followingIds = new Set(followingUsers.map(u => u.id))
      
      const usersWithStatus: UserWithFollowStatus[] = allUsers
        .filter((u: UserType) => u.id !== currentUser!.id)
        .map((u: UserType) => ({
          ...u,
          followStatus: getFollowStatusFromAPI(followingIds.has(u.id)),
          mutualFollowers: Math.floor(Math.random() * 10),
          memberSince: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          recentActivity: Math.random() > 0.7 ? 'Active today' : undefined,
          location: Math.random() > 0.6 ? ['New York', 'London', 'Paris', 'Tokyo', 'Sydney'][Math.floor(Math.random() * 5)] : undefined,
          isOnline: Math.random() > 0.5
        }))

      setUsers(usersWithStatus)
    } catch (err: unknown) {
      console.error('Failed to fetch users:', err)
    }
  }, [currentUser])

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.getAllGroups(50, 0)
      
      let userGroups: GroupResponse[] = []
      try {
        const userGroupsResponse = await api.getUserGroups(currentUser!.id)
        userGroups = Array.isArray(userGroupsResponse.groups) ? userGroupsResponse.groups : []
      } catch {
        userGroups = []
      }

      const userGroupMeta = new Map(
        userGroups.map(group => [
          group.id,
          {
            status: normalizeGroupStatus(group),
            role: group.role
          }
        ])
      )

      const groupsWithStatus: GroupWithJoinStatus[] = (response.groups || []).map(group => {
        const meta = userGroupMeta.get(group.id)
        const normalizedStatus = normalizeGroupStatus({
          member_status: group.member_status ?? meta?.status,
          is_member: group.is_member ?? (meta?.status === 'member')
        })
        return {
          ...group,
          is_member: normalizedStatus === 'member',
          member_status: normalizedStatus,
          role: group.role ?? meta?.role,
          recent_activity: Math.random() > 0.6 ? `${Math.floor(Math.random() * 10) + 1} recent posts` : undefined,
          trending_score: Math.random() * 100
        }
      })

      setGroups(groupsWithStatus)
    } catch (err: unknown) {
      console.error('Failed to fetch groups:', err)
    }
  }, [currentUser])

  const fetchTrendingTags = useCallback(async () => {
    // Mock trending tags data - replace with real API call when available
    const mockTags: TrendingTag[] = [
      { tag: 'technology', count: 1250, growth: 15.3, trend: 'up' },
      { tag: 'photography', count: 892, growth: 8.7, trend: 'up' },
      { tag: 'travel', count: 756, growth: -2.1, trend: 'down' },
      { tag: 'coding', count: 634, growth: 22.4, trend: 'up' },
      { tag: 'food', count: 543, growth: 0.8, trend: 'stable' },
      { tag: 'music', count: 432, growth: 12.1, trend: 'up' },
      { tag: 'fitness', count: 321, growth: 5.6, trend: 'up' },
      { tag: 'art', count: 298, growth: -1.2, trend: 'down' },
      { tag: 'gaming', count: 267, growth: 18.9, trend: 'up' },
      { tag: 'nature', count: 234, growth: 3.4, trend: 'stable' }
    ]
    
    setTrendingTags(mockTags)
  }, [])

  const fetchData = useCallback(async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      
      await Promise.all([
        fetchUsers(),
        fetchGroups(),
        fetchTrendingTags()
      ])
    } catch (err: unknown) {
      console.error('Failed to fetch discover data:', err)
      error('Failed to load discover data')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, error, fetchUsers, fetchGroups, fetchTrendingTags])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const applyUserFiltersAndSort = useCallback(() => {
    let filtered = [...users]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(query) ||
        user.nickname?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    switch (userFilter) {
      case 'not_following':
        filtered = filtered.filter(user => !user.followStatus.isFollowing)
        break
      case 'online':
        filtered = filtered.filter(user => user.isOnline)
        break
      case 'new_members':
        filtered = filtered.filter(user => {
          const memberDate = new Date(user.memberSince || '')
          const oneMonthAgo = new Date()
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
          return memberDate > oneMonthAgo
        })
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        case 'name_desc':
          return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`)
        case 'newest':
          return new Date(b.memberSince || '').getTime() - new Date(a.memberSince || '').getTime()
        case 'members':
          return (b.mutualFollowers || 0) - (a.mutualFollowers || 0)
        case 'active':
          return (b.mutualFollowers || 0) - (a.mutualFollowers || 0)
        default:
          return 0
      }
    })

    setFilteredUsers(filtered)
  }, [users, searchQuery, userFilter, sortBy])

  const applyGroupFiltersAndSort = useCallback(() => {
    let filtered = [...groups]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(group => 
        group.title.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    switch (groupFilter) {
      case 'available':
        filtered = filtered.filter(group => {
          const status = normalizeGroupStatus(group)
          return status === 'none' || status === 'rejected'
        })
        break
      case 'joined':
        filtered = filtered.filter(group => normalizeGroupStatus(group) === 'member')
        break
      case 'active':
        filtered = filtered.filter(group => group.recent_activity)
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.title.localeCompare(b.title)
        case 'name_desc':
          return b.title.localeCompare(a.title)
        case 'newest':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        case 'members':
          return (b.member_count || 0) - (a.member_count || 0)
        case 'active':
          return (b.trending_score || 0) - (a.trending_score || 0)
        default:
          return 0
      }
    })

    setFilteredGroups(filtered)
  }, [groups, searchQuery, groupFilter, sortBy])

  useEffect(() => {
    if (activeTab === 'users') {
      applyUserFiltersAndSort()
    } else if (activeTab === 'groups') {
      applyGroupFiltersAndSort()
    }
  }, [users, groups, searchQuery, userFilter, groupFilter, sortBy, activeTab, applyUserFiltersAndSort, applyGroupFiltersAndSort])

  const handleFollowStatusChange = (userId: number, newStatus: FollowStatus) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, followStatus: newStatus }
          : user
      )
    )
  }

  const handleUserClick = (userId: number) => {
    if (!currentUser) return
    
    // Check if clicking on own profile
    if (userId === currentUser.id) {
      // Navigate to own profile route
      router.push(`/profile/${userId}`) // or router.push('/dashboard') to go to dashboard profile tab
    } else {
      // Navigate to other user's profile page
      router.push(`/profile/${userId}`)
    }
  }

  const handleJoinGroup = async (groupId: number) => {
    if (!isConnected) {
      warning('Connection required to join groups')
      return
    }

    try {
      await api.joinGroup(groupId)
      const targetGroup = groups.find(group => group.id === groupId)
      const joinStatus: GroupMemberStatus = targetGroup?.privacy === 'private' ? 'sent' : 'member'
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { 
                ...group, 
                is_member: joinStatus === 'member',
                member_status: joinStatus,
                role: joinStatus === 'member' ? (group.role ?? 'member') : group.role
              }
            : group
        )
      )
      success(joinStatus === 'member' ? 'Successfully joined the group!' : 'Join request sent for approval')
    } catch {
      error('Failed to join group')
    }
  }

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
            ? { 
                ...group, 
                is_member: false,
                member_status: 'none',
                role: undefined
              }
            : group
        )
      )
      success('Successfully left the group!')
    } catch {
      error('Failed to leave group')
    }
  }

  const userFilters = [
    { id: 'all', label: 'All Users', icon: <Users className="w-4 h-4" />, count: users.length },
    { id: 'not_following', label: 'Not Following', icon: <UserPlus className="w-4 h-4" />, count: users.filter(u => !u.followStatus.isFollowing).length },
    { id: 'online', label: 'Online Now', icon: <Eye className="w-4 h-4" />, count: users.filter(u => u.isOnline).length },
    { id: 'new_members', label: 'New Members', icon: <Sparkles className="w-4 h-4" /> }
  ]

  const groupFilters = [
    { id: 'all', label: 'All Groups', icon: <Users className="w-4 h-4" />, count: groups.length },
    { id: 'available', label: 'Available to Join', icon: <Plus className="w-4 h-4" />, count: groups.filter(g => {
      const status = normalizeGroupStatus(g)
      return status === 'none' || status === 'rejected'
    }).length },
    { id: 'joined', label: 'Already Joined', icon: <Check className="w-4 h-4" />, count: groups.filter(g => normalizeGroupStatus(g) === 'member').length },
    { id: 'active', label: 'Most Active', icon: <TrendingUp className="w-4 h-4" />, count: groups.filter(g => g.recent_activity).length }
  ]

  const sortOptions: { id: SortBy; label: string }[] = [
    { id: 'newest', label: 'Newest First' },
    { id: 'name_asc', label: 'Name (A-Z)' },
    { id: 'name_desc', label: 'Name (Z-A)' },
    { id: 'members', label: 'Most Members' },
    { id: 'active', label: 'Most Active' }
  ]

  if (isLoading) {
    return (
      <div className="flex-1 min-w-0 max-h-screen overflow-hidden">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
          {/* Fixed Header */}
          <div className="flex-shrink-0 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <Search className="w-8 h-8 text-emerald-400 mr-3" />
                  Discover
                </h1>
                <p className="text-white/70 mt-2">
                  Find new people, groups, and trending topics
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white/10 rounded-xl p-1 mt-6">
              {[
                { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
                { id: 'groups', label: 'Groups', icon: <Globe className="w-4 h-4" /> },
                { id: 'trending', label: 'Trending', icon: <Hash className="w-4 h-4" /> }
              ].map((tab) => (
                <div key={tab.id} className="flex items-center space-x-2 px-4 py-3 rounded-lg flex-1 justify-center bg-white/5 animate-pulse">
                  {tab.icon}
                  <span className="font-medium text-white/50">{tab.label}</span>
                  <div className="bg-white/20 h-5 w-8 rounded-full"></div>
                </div>
              ))}
            </div>

            {/* Search Bar Skeleton */}
            <div className="relative mt-4">
              <div className="w-full h-12 bg-white/10 rounded-xl animate-pulse"></div>
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 animate-pulse">
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

  // Users Tab Component
  function UsersTab() {
    const displayUsers = filteredUsers

    if (displayUsers.length === 0) {
      return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
          <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
          <p className="text-white/60">
            {searchQuery ? 'Try adjusting your search or filters' : 'No users match the selected filters'}
          </p>
        </div>
      )
    }

    return (
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        : 'space-y-3'
      }>
        {displayUsers.map((user) => (
          <div 
            key={user.id} 
            className={`group cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 text-center'
                : 'bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300'
            }`}
            onClick={() => handleUserClick(user.id)}
          >
            {viewMode === 'grid' ? (
              // Grid View
              <>
                <div className="relative mb-4">
                  {user.avatar ? (
                    <Image 
                      src={user.avatar} 
                      alt={`${user.first_name} ${user.last_name}`} 
                      width={80} 
                      height={80} 
                      className="rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white text-2xl font-bold">
                        {(user.first_name?.charAt(0) || user.last_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                      </span>
                    </div>
                  )}
                  {user.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white group-hover:text-emerald-200 transition-colors">
                    {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Anonymous'}
                  </h3>
                  {user.mutualFollowers !== undefined && user.mutualFollowers > 0 && (
                    <p className="text-emerald-400 text-sm">
                      {user.mutualFollowers} mutual connection{user.mutualFollowers !== 1 ? 's' : ''}
                    </p>
                  )}
                  <div className="flex justify-center space-x-2">
                    <FollowHandler
                      targetUser={user}
                      currentFollowStatus={user.followStatus || { isFollowing: false, isPending: false, status: 'not_following' }}
                      onStatusChange={(newStatus) => handleFollowStatusChange(user.id, newStatus)}
                      disabled={!isConnected}
                      size="sm"
                    />
                    <button
                      disabled={!isConnected}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isConnected 
                          ? 'text-white/70 hover:text-white hover:bg-white/10' 
                          : 'text-white/30 cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        warning('Messaging feature coming soon!')
                      }}
                      title="Send message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // List View
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    {user.avatar ? (
                      <Image 
                        src={user.avatar} 
                        alt={`${user.first_name} ${user.last_name}`} 
                        width={48} 
                        height={48} 
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {(user.first_name?.charAt(0) || user.last_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                        </span>
                      </div>
                    )}
                    {user.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white group-hover:text-emerald-200 transition-colors truncate">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Anonymous'}
                    </div>
                    {user.mutualFollowers !== undefined && user.mutualFollowers > 0 && (
                      <div className="text-emerald-400 text-sm">
                        {user.mutualFollowers} mutual connection{user.mutualFollowers !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <FollowHandler
                    targetUser={user}
                    currentFollowStatus={user.followStatus || { isFollowing: false, isPending: false, status: 'not_following' }}
                    onStatusChange={(newStatus) => handleFollowStatusChange(user.id, newStatus)}
                    disabled={!isConnected}
                    size="sm"
                  />
                  <button
                    disabled={!isConnected}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isConnected 
                        ? 'text-white/70 hover:text-white hover:bg-white/10' 
                        : 'text-white/30 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      warning('Messaging feature coming soon!')
                    }}
                    title="Send message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Groups Tab Component
  function GroupsTab() {
    const displayGroups = filteredGroups

    if (displayGroups.length === 0) {
      return (
        <div className="space-y-6">
          {/* Create Group CTA */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-xl rounded-2xl border border-emerald-400/20 p-8 text-center">
            <Users className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Create Your First Group</h3>
            <p className="text-white/60 mb-6">
              Start a community around shared interests and connect with like-minded people.
            </p>
            <button
              onClick={() => setShowCreateGroup(true)}
              disabled={!isConnected}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnected ? 'Create Group' : 'Offline'}
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No groups found</h3>
            <p className="text-white/60">
              {searchQuery ? 'Try adjusting your search or filters' : 'No groups match the selected filters'}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {displayGroups.map((group) => {
          const status = normalizeGroupStatus(group)
          const role = group.role
          const privacy = group.privacy
          const statusBadge = (() => {
            switch (status) {
              case 'member':
                return {
                  label: role === 'admin' ? 'Admin' : 'Member',
                  className: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
                  icon: role === 'admin' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />
                }
              case 'sent':
                return {
                  label: 'Pending',
                  className: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
                  icon: <Clock3 className="w-3 h-3 mr-1" />
                }
              case 'rejected':
                return {
                  label: 'Declined',
                  className: 'bg-rose-500/20 text-rose-200 border border-rose-400/30',
                  icon: <XCircle className="w-3 h-3 mr-1" />
                }
              default:
                return null
            }
          })()
          const privacyBadge = privacy ? {
            label: privacy === 'private' ? 'Private' : 'Public',
            className: privacy === 'private'
              ? 'bg-slate-500/30 text-slate-200 border border-slate-400/30'
              : 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30',
            icon: privacy === 'private' ? <Lock className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />
          } : null

          const statusMessage = status === 'sent'
            ? 'Join request pending approval'
            : status === 'rejected'
              ? 'Your join request was declined'
              : undefined
          const isMember = status === 'member'
          const joinDisabled = !isConnected || status === 'sent'
          const joinLabel = status === 'sent' ? 'Request Pending' : status === 'rejected' ? 'Request Again' : 'Join Group'
          const joinButtonTone = status === 'sent'
            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/20'
            : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-white border border-emerald-400/20'

          return (
            <div key={group.id} className={`group ${
              viewMode === 'grid' 
                ? 'bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300'
                : 'bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300'
            }`}>
              {viewMode === 'grid' ? (
                // Grid View
                <>
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-semibold group-hover:text-emerald-200 transition-colors flex-1">
                        {group.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 justify-end ml-2">
                        {statusBadge && (
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${statusBadge.className}`}>
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        )}
                        {privacyBadge && (
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${privacyBadge.className}`}>
                            {privacyBadge.icon}
                            {privacyBadge.label}
                          </span>
                        )}
                      </div>
                    </div>
                    {group.description && (
                      <p className="text-white/70 text-sm line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    {statusMessage && (
                      <div className={`text-xs mt-2 ${status === 'rejected' ? 'text-rose-200' : 'text-amber-200'}`}>
                        {statusMessage}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-white/60 text-sm">
                      <Users className="w-4 h-4 mr-2" />
                      {group.member_count} members
                    </div>
                    {group.recent_activity && (
                      <div className="flex items-center text-emerald-400 text-sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {group.recent_activity}
                      </div>
                    )}
                    <div className="flex items-center text-white/60 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created {new Date(group.created_at || '').toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {isMember ? (
                      <button
                        onClick={() => handleLeaveGroup(group.id)}
                        disabled={!isConnected}
                        className="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/20 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium"
                      >
                        Leave Group
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={joinDisabled}
                        className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium ${joinButtonTone}`}
                      >
                        {joinLabel}
                      </button>
                    )}
                    <button
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      title="View group"
                      onClick={() => warning('Group details coming soon!')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                // List View
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h3 className="text-white font-semibold group-hover:text-emerald-200 transition-colors truncate">
                        {group.title}
                      </h3>
                      {statusBadge && (
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${statusBadge.className}`}>
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      )}
                      {privacyBadge && (
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${privacyBadge.className}`}>
                          {privacyBadge.icon}
                          {privacyBadge.label}
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-white/70 text-sm truncate mb-2">
                        {group.description}
                      </p>
                    )}
                    {statusMessage && (
                      <div className={`text-xs mb-2 ${status === 'rejected' ? 'text-rose-200' : 'text-amber-200'}`}>
                        {statusMessage}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-white/50">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {group.member_count} members
                      </span>
                      {group.recent_activity && (
                        <span className="flex items-center text-emerald-400">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {group.recent_activity}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {isMember ? (
                      <button
                        onClick={() => handleLeaveGroup(group.id)}
                        disabled={!isConnected}
                        className="py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/20 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={joinDisabled}
                        className={`py-1.5 px-3 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm ${joinButtonTone}`}
                      >
                        {joinLabel === 'Join Group' ? 'Join' : joinLabel}
                      </button>
                    )}
                    <button
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      title="View group"
                      onClick={() => warning('Group details coming soon!')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Trending Tab Component
  function TrendingTab() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trendingTags.map((tag, index) => (
          <div key={tag.tag} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/20' : 'bg-white/10'
                }`}>
                  <Hash className={`w-5 h-5 ${index < 3 ? 'text-yellow-400' : 'text-white/60'}`} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  index < 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/20' : 'bg-white/10 text-white/60'
                }`}>
                  #{index + 1}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className={`w-4 h-4 ${index < 3 ? 'text-yellow-400' : 'text-white/60'}`} />
                <span className={`text-xs font-medium ${index < 3 ? 'text-yellow-400' : 'text-white/60'}`}>
                  Trending
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-200 transition-colors">
                #{tag.tag}
              </h3>
              <p className="text-white/70 text-sm">
                {tag.count.toLocaleString()} posts
              </p>
            </div>
            
            <button 
              className="w-full py-2 px-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-white border border-emerald-400/20 rounded-lg transition-all duration-200 text-sm font-medium"
              onClick={() => warning('Tag exploration coming soon!')}
            >
              Explore Tag
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 max-h-screen overflow-hidden">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
        {/* Fixed Header - Non-scrollable */}
        <div className="flex-shrink-0 p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Search className="w-8 h-8 text-emerald-400 mr-3" />
                Discover
              </h1>
              <p className="text-white/70 mt-2">
                Find new people, groups, and trending topics
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/10 rounded-xl p-1 mb-6">
            {[
              { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, count: users.filter(u => !u.followStatus.isFollowing).length },
              { id: 'groups', label: 'Groups', icon: <Globe className="w-4 h-4" />, count: groups.length },
              { id: 'trending', label: 'Trending', icon: <Hash className="w-4 h-4" />, count: trendingTags.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DiscoverTab)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-400/50 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200"
            />
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {(activeTab === 'users' ? userFilters : activeTab === 'groups' ? groupFilters : []).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    if (activeTab === 'users') {
                      setUserFilter(filter.id as UserFilter)
                    } else {
                      setGroupFilter(filter.id as GroupFilter)
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    (activeTab === 'users' ? userFilter : groupFilter) === filter.id
                      ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-400/50 text-white'
                      : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {filter.icon}
                  <span className="text-sm font-medium">{filter.label}</span>
                  {filter.count !== undefined && (
                    <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{filter.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort and View Controls */}
            {activeTab !== 'trending' && (
              <div className="flex items-center space-x-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  title="Sort options"
                  aria-label="Sort by"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-gray-800">
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex bg-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' ? 'bg-emerald-500/30 text-white' : 'text-white/60 hover:text-white'
                    }`}
                    title="List view"
                    aria-label="Switch to list view"
                  >
                    <div className="flex flex-col space-y-0.5">
                      <div className="w-3 h-0.5 bg-current"></div>
                      <div className="w-3 h-0.5 bg-current"></div>
                      <div className="w-3 h-0.5 bg-current"></div>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' ? 'bg-emerald-500/30 text-white' : 'text-white/60 hover:text-white'
                    }`}
                    title="Grid view"
                    aria-label="Switch to grid view"
                  >
                    <Grid3X3 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Offline Warning */}
          {!isConnected && (
            <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-4 mt-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 font-medium">You&apos;re offline. Actions are disabled.</p>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'groups' && <GroupsTab />}
          {activeTab === 'trending' && <TrendingTab />}
        </div>
      </div>

      <CreateGroup
        show={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={() => {
          fetchGroups()
          setShowCreateGroup(false)
          success('Group created successfully!')
        }}
      />
    </div>
  )
}
