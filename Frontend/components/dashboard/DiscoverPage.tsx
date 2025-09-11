'use client'
import React, { useState, useEffect } from 'react'
import { 
  Search, 
  User, 
  MessageCircle, 
  Filter, 
  RefreshCw, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Globe, 
  Star, 
  UserCheck, 
  UserPlus,
  MapPin,
  Calendar,
  Award,
  Eye,
  Heart,
  Grid3X3
} from 'lucide-react'
import { api, User as UserType } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus } from '@/hooks'
import FollowHandler, { FollowStatus, getFollowStatusFromAPI } from './FollowHandler'

interface UserWithFollowStatus extends UserType {
  followStatus: FollowStatus
  isOnline?: boolean
  mutualFollowers?: number
  recentActivity?: string
  location?: string
  memberSince?: string
}

interface DiscoverPageProps {
  onClose?: () => void
}

type DiscoverFilter = 'all' | 'popular' | 'recent' | 'suggested' | 'location' | 'mutual'
type SortBy = 'name' | 'recent' | 'popular' | 'followers'

export default function DiscoverPage({ onClose }: DiscoverPageProps) {
  const { user: currentUser } = useAuth()
  const { success, error, warning } = useToast()
  const { isConnected } = useConnectionStatus()
  
  const [users, setUsers] = useState<UserWithFollowStatus[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithFollowStatus[]>([])
  const [following, setFollowing] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  useEffect(() => {
    fetchUsersAndFollowing()
  }, [currentUser])

  useEffect(() => {
    applyFiltersAndSort()
  }, [users, searchQuery, activeFilter, sortBy])

  const fetchUsersAndFollowing = async () => {
    if (!currentUser) return

    try {
      setIsLoading(true)
      
      // Fetch all users and current user's following list in parallel
      const [usersResponse, followingResponse] = await Promise.all([
        api.getUsers(),
        api.getFollowing(currentUser.id)
      ])

      const allUsers = usersResponse.users || []
      const followingUsers = followingResponse.following || []
      
      // Create a set of following user IDs for quick lookup
      const followingIds = new Set(followingUsers.map(u => u.id))
      
      // Filter out current user and add follow status
      const usersWithStatus: UserWithFollowStatus[] = allUsers
        .filter((u: UserType) => u.id !== currentUser.id)
        .map((u: UserType) => ({
          ...u,
          followStatus: getFollowStatusFromAPI(followingIds.has(u.id)),
          isOnline: false, // This would be populated from WebSocket data
          mutualFollowers: Math.floor(Math.random() * 10), // Mock data
          recentActivity: getRandomActivity(),
          location: getRandomLocation(),
          memberSince: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toLocaleDateString()
        }))

      setUsers(usersWithStatus)
      setFollowing(followingUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
      error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchUsersAndFollowing()
    setIsRefreshing(false)
    success('User list refreshed!')
  }

  const applyFiltersAndSort = () => {
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
    switch (activeFilter) {
      case 'popular':
        filtered = filtered.filter(user => user.mutualFollowers && user.mutualFollowers > 5)
        break
      case 'recent':
        filtered = filtered.filter(user => {
          const memberDate = new Date(user.memberSince || '')
          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
          return memberDate > sixMonthsAgo
        })
        break
      case 'suggested':
        filtered = filtered.filter(user => !user.followStatus.isFollowing && user.mutualFollowers && user.mutualFollowers > 0)
        break
      case 'location':
        filtered = filtered.filter(user => user.location === getRandomLocation())
        break
      case 'mutual':
        filtered = filtered.filter(user => user.mutualFollowers && user.mutualFollowers > 0)
        break
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
        break
      case 'recent':
        filtered.sort((a, b) => new Date(b.memberSince || '').getTime() - new Date(a.memberSince || '').getTime())
        break
      case 'popular':
        filtered.sort((a, b) => (b.mutualFollowers || 0) - (a.mutualFollowers || 0))
        break
      case 'followers':
        filtered.sort((a, b) => (b.mutualFollowers || 0) - (a.mutualFollowers || 0))
        break
    }

    setFilteredUsers(filtered)
  }

  const handleFollowStatusChange = (userId: number, newStatus: FollowStatus) => {
    // Update the user's follow status in both lists
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, followStatus: newStatus }
        : u
    ))

    // Update following list based on new status
    if (newStatus.isFollowing) {
      setFollowing(prev => {
        const isAlreadyFollowing = prev.some(u => u.id === userId)
        if (isAlreadyFollowing) return prev
        
        const userToAdd = users.find(u => u.id === userId)
        return userToAdd ? [...prev, userToAdd] : prev
      })
    } else if (!newStatus.isPending) {
      setFollowing(prev => prev.filter(u => u.id !== userId))
    }
  }

  const getRandomActivity = () => {
    const activities = ['Posted recently', 'Active in groups', 'Shared a photo', 'Joined recently', 'Very active']
    return activities[Math.floor(Math.random() * activities.length)]
  }

  const getRandomLocation = () => {
    const locations = ['San Francisco', 'New York', 'London', 'Tokyo', 'Berlin', 'Paris', 'Sydney', 'Toronto']
    return locations[Math.floor(Math.random() * locations.length)]
  }

  const filters: { id: DiscoverFilter; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'all', label: 'All Users', icon: <Users className="w-4 h-4" />, count: users.length },
    { id: 'suggested', label: 'Suggested', icon: <Sparkles className="w-4 h-4" />, count: users.filter(u => !u.followStatus.isFollowing && u.mutualFollowers && u.mutualFollowers > 0).length },
    { id: 'popular', label: 'Popular', icon: <TrendingUp className="w-4 h-4" />, count: users.filter(u => u.mutualFollowers && u.mutualFollowers > 5).length },
    { id: 'recent', label: 'New Members', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'mutual', label: 'Mutual Connections', icon: <UserCheck className="w-4 h-4" />, count: users.filter(u => u.mutualFollowers && u.mutualFollowers > 0).length },
    { id: 'location', label: 'Nearby', icon: <MapPin className="w-4 h-4" /> }
  ]

  const sortOptions: { id: SortBy; label: string }[] = [
    { id: 'name', label: 'Name (A-Z)' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'recent', label: 'Recently Joined' },
    { id: 'followers', label: 'Most Connections' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-zinc-900/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-white/20 rounded-lg w-1/3"></div>
                <div className="h-4 bg-white/20 rounded w-2/3"></div>
              </div>
            </div>
            
            {/* Filters Skeleton */}
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-white/10 rounded-xl w-24 animate-pulse"></div>
              ))}
            </div>
            
            {/* Users Grid Skeleton */}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-zinc-900/95 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Search className="w-8 h-8 text-purple-400 mr-3" />
                Discover People
              </h1>
              <p className="text-white/70 mt-2">
                Find and connect with amazing people in your network
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
                title="Refresh users"
              >
                <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              placeholder="Search users by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-200"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-400/20">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-lg font-bold text-white">{users.length}</p>
                  <p className="text-xs text-white/60">Total Users</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 border border-emerald-400/20">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-lg font-bold text-white">{following.length}</p>
                  <p className="text-xs text-white/60">Following</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-400/20">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-lg font-bold text-white">{users.filter(u => !u.followStatus.isFollowing && u.mutualFollowers && u.mutualFollowers > 0).length}</p>
                  <p className="text-xs text-white/60">Suggested</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-400/20">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-lg font-bold text-white">{filteredUsers.length}</p>
                  <p className="text-xs text-white/60">Filtered</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeFilter === filter.id
                    ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 text-white'
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
          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50"
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
                  viewMode === 'list' ? 'bg-purple-500/30 text-white' : 'text-white/60 hover:text-white'
                }`}
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
                  viewMode === 'grid' ? 'bg-purple-500/30 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Offline Warning */}
        {!isConnected && (
          <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400 font-medium">You're offline. Follow actions are disabled.</p>
            </div>
          </div>
        )}

        {/* Users Display */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
            <p className="text-white/60">
              {searchQuery ? 'Try adjusting your search or filters' : 'No users match the selected filters'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
          }>
            {filteredUsers.map((user) => (
              <div key={user.id} className={`group ${
                viewMode === 'grid' 
                  ? 'bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 text-center'
                  : 'bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300'
              }`}>
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div className="relative mb-4">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={`${user.first_name} ${user.last_name}`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/20 group-hover:border-white/40 transition-colors mx-auto"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center border-2 border-white/20 group-hover:border-white/40 transition-colors mx-auto">
                          <User className="w-7 h-7 text-white" />
                        </div>
                      )}
                      {/* Online status indicator */}
                      {isConnected && (
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white/20 ${
                          user.isOnline ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <h3 className="text-white font-semibold group-hover:text-blue-200 transition-colors">
                          {user.first_name} {user.last_name}
                        </h3>
                        {user.is_private && (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Private account"></div>
                        )}
                      </div>
                      <p className="text-white/70 text-sm">
                        {user.nickname ? `@${user.nickname}` : `@${user.email.split('@')[0]}`}
                      </p>
                      {user.location && (
                        <p className="text-white/50 text-xs mt-1 flex items-center justify-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {user.location}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="mb-4 space-y-2">
                      {user.mutualFollowers && user.mutualFollowers > 0 && (
                        <div className="text-xs text-white/60 flex items-center justify-center">
                          <UserCheck className="w-3 h-3 mr-1" />
                          {user.mutualFollowers} mutual connections
                        </div>
                      )}
                      {user.memberSince && (
                        <div className="text-xs text-white/60 flex items-center justify-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined {user.memberSince}
                        </div>
                      )}
                      {user.recentActivity && (
                        <div className="text-xs text-emerald-400 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {user.recentActivity}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center space-x-2">
                      {user.followStatus.isFollowing && (
                        <button
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                          title="Send message"
                          disabled={!isConnected}
                          onClick={() => warning('Messaging feature coming soon!')}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      <FollowHandler
                        targetUser={user}
                        currentFollowStatus={user.followStatus}
                        onStatusChange={(newStatus) => handleFollowStatusChange(user.id, newStatus)}
                        disabled={!isConnected}
                        size="sm"
                      />
                    </div>
                  </>
                ) : (
                  // List View
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative flex-shrink-0">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={`${user.first_name} ${user.last_name}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20 group-hover:border-white/40 transition-colors"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center border-2 border-white/20 group-hover:border-white/40 transition-colors">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        {/* Online status indicator */}
                        {isConnected && (
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white/20 ${
                            user.isOnline ? 'bg-green-500' : 'bg-gray-500'
                          }`}></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-white font-semibold group-hover:text-blue-200 transition-colors truncate">
                            {user.first_name} {user.last_name}
                          </h3>
                          {user.is_private && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" title="Private account"></div>
                          )}
                        </div>
                        <p className="text-white/70 text-sm truncate">
                          {user.nickname ? `@${user.nickname}` : `@${user.email.split('@')[0]}`}
                        </p>
                        
                        {/* Additional info in list view */}
                        <div className="flex items-center space-x-4 mt-1 text-xs text-white/50">
                          {user.location && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {user.location}
                            </span>
                          )}
                          {user.mutualFollowers && user.mutualFollowers > 0 && (
                            <span className="flex items-center">
                              <UserCheck className="w-3 h-3 mr-1" />
                              {user.mutualFollowers} mutual
                            </span>
                          )}
                          {user.recentActivity && (
                            <span className="flex items-center text-emerald-400">
                              <Sparkles className="w-3 h-3 mr-1" />
                              {user.recentActivity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {user.followStatus.isFollowing && (
                        <button
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                          title="Send message"
                          disabled={!isConnected}
                          onClick={() => warning('Messaging feature coming soon!')}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      <FollowHandler
                        targetUser={user}
                        currentFollowStatus={user.followStatus}
                        onStatusChange={(newStatus) => handleFollowStatusChange(user.id, newStatus)}
                        disabled={!isConnected}
                        size="sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
