'use client'
import React, { useState, useEffect } from 'react'
import { Settings, Users, Crown, Shield, User, UserPlus, Trash2, Lock, Unlock, Eye, EyeOff, AlertTriangle, Search, Check, X, Edit3, Send, Clock, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConnectionStatus, useUpload } from '@/hooks'
import { api, Member, User as UserType, GroupResponse } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'

interface GroupSettingsTabProps {
  groupId: number
}

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ groupId }) => {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'privacy' | 'requests' | 'danger'>('members')
  const [groupInfo, setGroupInfo] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [invitableUsers, setInvitableUsers] = useState<UserType[]>([])
  const [allUsers, setAllUsers] = useState<UserType[]>([])
  const [followingUsers, setFollowingUsers] = useState<UserType[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sentRequests, setSentRequests] = useState<Member[]>([])
  const [receivedRequests, setReceivedRequests] = useState<Member[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteCountdown, setDeleteCountdown] = useState(5)
  const { user } = useAuth()
  const { success, error: toastError } = useToast()
  const { isConnected } = useConnectionStatus()
  const { uploadImage, isUploading: isUploadingAvatar } = useUpload()

  // Confirmation modals
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'promote' | 'demote' | 'remove'
    memberId: number
    memberName: string
  } | null>(null)

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true)
        const [membersResponse, groupResponse, roleResponse] = await Promise.all([
          api.getGroupMembers(groupId),
          api.getGroup(groupId),
          api.getUserRole(groupId)
        ])
        setMembers(membersResponse.members)
        setGroupInfo(groupResponse)
        setUserRole(roleResponse.role)
        setEditTitle(groupResponse.title)
        setEditDescription(groupResponse.description || '')
      } catch (error) {
        console.error('Failed to fetch group data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroupData()
  }, [groupId])

  // Handle privacy update
  const handleUpdatePrivacy = async (privacy: 'public' | 'private') => {
    try {
      await api.updateGroupPrivacy(groupId, privacy)
      setGroupInfo((prev: GroupResponse | null) => prev ? { ...prev, privacy } : null)
    } catch (error) {
      console.error('Failed to update group privacy:', error)
    }
  }

  // Handle permissions update
  const handleUpdatePermissions = async (permissions: { create_posts: 'all_members' | 'admins_only'; create_polls: 'all_members' | 'admins_only'; create_events: 'all_members' | 'admins_only'; send_messages: 'all_members' | 'admins_only' }) => {
    try {
      await api.updateGroupPermissions(groupId, permissions)
      setGroupInfo((prev: GroupResponse | null) => prev ? { ...prev, ...permissions } : null)
    } catch (error) {
      console.error('Failed to update group permissions:', error)
    }
  }

  // Handle avatar file selection and preview
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setAvatarFile(file)
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
    } else {
      setAvatarPreview(null)
    }
  }

  // Handle group update
  const handleUpdateGroup = async () => {
    // Validation
    if (!editTitle.trim()) {
      toastError('Group title is required')
      return
    }

    if (editTitle.length > 100) {
      toastError('Group title cannot exceed 100 characters')
      return
    }

    if (editDescription.length > 500) {
      toastError('Group description cannot exceed 500 characters')
      return
    }

    if (!isConnected) {
      toastError('Cannot update group while offline')
      return
    }

    setIsUpdating(true)

    let avatar = avatarUrl
    if (avatarFile) {
      try {
        const result = await uploadImage(avatarFile)
        avatar = result.url
        setAvatarUrl(avatar)
      } catch (err) {
        toastError('Failed to upload avatar')
        setIsUpdating(false)
        return
      }
    }

    try {
      await api.updateGroup(groupId, { 
        title: editTitle.trim(), 
        description: editDescription.trim() || undefined,
        avatar: avatar
      })
      setGroupInfo((prev: GroupResponse | null) => prev ? { ...prev, title: editTitle.trim(), description: editDescription.trim(), avatar: avatar } : null)
      setShowEditModal(false)
      success('Group updated successfully!')
    } catch (error) {
      console.error('Failed to update group:', error)
      toastError('Failed to update group. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle group deletion
  const handleDeleteGroup = async () => {
    if (deleteConfirmation !== 'DELETE' || deleteCountdown > 0) {
      return
    }

    setIsDeleting(true)
    try {
      await api.deleteGroup(groupId)
      // Redirect to groups page or home
      window.location.href = '/groups'
    } catch (error) {
      console.error('Failed to delete group:', error)
      setIsDeleting(false)
    }
  }

  // Handle member kick
  const handleKickMember = async (userId: number) => {
    try {
      await api.kickMember(groupId, userId)
      setMembers(members.filter(member => member.user.id !== userId))
    } catch (error) {
      console.error('Failed to kick member:', error)
    }
  }

  // Handle invite user
  const handleInviteUser = async (userId: number) => {
    try {
      setIsInviting(true)
      await api.inviteUserToGroup(groupId, userId)
      // Refresh sent requests
      fetchJoinRequests()
    } catch (error) {
      console.error('Failed to invite user:', error)
    } finally {
      setIsInviting(false)
    }
  }

  // Handle invite multiple users
  const handleInviteMultipleUsers = async () => {
    if (selectedUsers.length === 0) {
      toastError('Please select at least one user to invite')
      return
    }

    try {
      setIsInviting(true)
      await api.inviteUsersToGroup(groupId, selectedUsers)
      
      success(`Invitations sent to ${selectedUsers.length} ${selectedUsers.length === 1 ? 'user' : 'users'}!`)
      
      // Reset selection and close modal
      setSelectedUsers([])
      setShowInviteModal(false)
      
      // Refresh sent requests
      fetchJoinRequests()
    } catch (error) {
      console.error('Failed to invite users:', error)
      toastError('Failed to send invitations. Please try again.')
    } finally {
      setIsInviting(false)
    }
  }

  // Handle user selection
  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  // Handle respond to request
  const handleRespondToRequest = async (userId: number, action: 'accept' | 'decline') => {
    try {
      await api.respondToJoinRequest(groupId, userId, action)
      // Refresh requests
      fetchJoinRequests()
    } catch (error) {
      console.error('Failed to respond to request:', error)
    }
  }

  // Handle search users (client-side filtering)
  const handleSearchUsers = (term: string) => {
    setSearchTerm(term)
    if (term.trim() === '') {
      setFilteredUsers(allUsers)
    } else {
      const filtered = allUsers.filter(user =>
        user.first_name.toLowerCase().includes(term.toLowerCase()) ||
        user.last_name.toLowerCase().includes(term.toLowerCase()) ||
        (user.nickname && user.nickname.toLowerCase().includes(term.toLowerCase()))
      )
      setFilteredUsers(filtered)
    }
  }

  // Load all invitable users when modal opens
  const loadInvitableUsers = async () => {
    try {
      // Get all invitable users
      const invitableResponse = await api.getInvitableUsers(groupId)
      setInvitableUsers(invitableResponse.users)
      
      // Get following users for filtering private profiles
      if (user?.id) {
        const followingResponse = await api.getFollowing(user.id)
        setFollowingUsers(followingResponse.following)
        
        // Filter users: exclude private users not followed by admin
        const followingIds = new Set(followingResponse.following.map(f => f.id))
        const filtered = invitableResponse.users.filter(u => 
          !u.is_private || followingIds.has(u.id)
        )
        
        setAllUsers(filtered)
        setFilteredUsers(filtered)
      }
    } catch (error) {
      console.error('Failed to load invitable users:', error)
    }
  }

  // Load invitable users when modal opens
  useEffect(() => {
    if (showInviteModal && user?.id) {
      loadInvitableUsers()
    } else if (!showInviteModal) {
      // Reset search when modal closes
      setSearchTerm('')
      setFilteredUsers([])
      setAllUsers([])
      setFollowingUsers([])
      setSelectedUsers([])
    }
  }, [showInviteModal, user?.id])

  // Countdown timer for delete confirmation
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showDeleteModal && deleteCountdown > 0) {
      timer = setTimeout(() => {
        setDeleteCountdown(prev => prev - 1)
      }, 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showDeleteModal, deleteCountdown])

  const isAdmin = userRole === 'admin' || userRole === 'creator'

  // Fetch join requests when requests tab becomes active
  useEffect(() => {
    console.log('useEffect triggered - activeTab:', activeTab, 'isAdmin:', isAdmin)
    if (activeTab === 'requests' && isAdmin) {
      console.log('Fetching join requests...')
      fetchJoinRequests()
    }
  }, [activeTab, isAdmin])

  // Fetch join requests
  const fetchJoinRequests = async () => {
    try {
      console.log('Making API calls for join requests...')
      const [sentResponse, receivedResponse] = await Promise.all([
        api.getSentJoinRequests(groupId),
        api.getReceivedJoinRequests(groupId)
      ])
      console.log('Sent response:', sentResponse)
      console.log('Received response:', receivedResponse)
      setSentRequests(sentResponse.requests || [])
      setReceivedRequests(receivedResponse.requests || [])
      console.log('State updated - sentRequests:', (sentResponse.requests || []).length, 'receivedRequests:', (receivedResponse.requests || []).length)
    } catch (error) {
      console.error('Failed to fetch join requests:', error)
      // Set to empty arrays on error
      setSentRequests([])
      setReceivedRequests([])
    }
  }

  // Format join date
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'Recently joined'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }  // Get role icon
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'creator':
        return <Crown className="w-4 h-4 text-yellow-400" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-400" />
      default:
        return <User className="w-4 h-4 text-gray-400" />
    }
  }

  // Get role label
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'creator':
        return 'Creator'
      case 'admin':
        return 'Admin'
      default:
        return 'Member'
    }
  }

  // Get role color
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'creator':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
      case 'admin':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/30'
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
    }
  }

  // Update member role
  const handleUpdateRole = async (memberId: number, newRole: string) => {
    try {
      await api.updateMemberRole(groupId, memberId, newRole as 'admin' | 'member')
      setMembers(members.map(member => 
        member.user.id === memberId ? { ...member, role: newRole } : member
      ))
    } catch (error) {
      console.error('Failed to update member role:', error)
    }
  }

  // Sort members by role priority
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { creator: 0, admin: 1, member: 2 }
    const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3
    const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3
    return aOrder - bOrder
  })



  // Check if current user can manage a member
  const canManageMember = (member: Member) => {
    if (member.user.id === user?.id) return false // Can't manage self
    if (member.role === 'creator') return false // Can't manage creator
    return true
  }

  // Handle cancel invitation
  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await api.cancelInvitation(groupId, invitationId)
      success('Invitation cancelled successfully!')
      // Refresh sent requests
      fetchJoinRequests()
    } catch (error) {
      console.error('Failed to cancel invitation:', error)
      toastError('Failed to cancel invitation. Please try again.')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6 mt-4 hover:shadow-emerald-500/10 transition-all duration-500 mx-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                <Settings className="w-4 h-4 text-white drop-shadow-sm" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white mb-0.5">Group Settings</h2>
              <p className="text-white/70 text-xs lg:text-sm">Manage your group preferences, permissions, and members</p>
            </div>
          </div>
          {isAdmin && (
            <motion.button
              onClick={() => {
                setEditTitle(groupInfo?.title || '')
                setEditDescription(groupInfo?.description || '')
                setAvatarFile(null)
                setAvatarPreview(null)
                setAvatarUrl(null)
                setShowEditModal(true)
              }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-medium transition-all duration-300 shadow-md hover:shadow-lg self-start sm:self-center text-sm"
              whileHover={{ scale: 1.02, y: -0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Group Info</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-1 hover:shadow-emerald-500/10 transition-all duration-500">
          <div className="flex space-x-1">
            {[
              { id: 'members', label: 'Members', icon: Users },
              { id: 'privacy', label: 'Privacy & Permissions', icon: Lock },
              { id: 'requests', label: 'Join Requests', icon: UserPlus },
              { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Members Tab */}
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              {/* Members Management Section */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">Manage Members</h3>
                  <div className="px-3 py-1 bg-white/10 rounded-full">
                    <span className="text-white/70 text-sm font-medium">{members.length}</span>
                  </div>
                </div>
                {isAdmin && (
                  <motion.button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-medium transition-all duration-300 shadow-md hover:shadow-lg self-start sm:self-center text-sm"
                    whileHover={{ scale: 1.02, y: -0.5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Members</span>
                  </motion.button>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-4 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Avatar */}
                          <div className="relative">
                            {member.user.avatar ? (
                              <img
                                src={member.user.avatar}
                                alt={`${member.user.first_name} ${member.user.last_name}`}
                                className="w-12 h-12 rounded-full object-cover shadow-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold shadow-lg">
                                {member.user.first_name[0]}{member.user.last_name[0]}
                              </div>
                            )}
                          </div>

                          {/* Member Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold text-white truncate">
                                {member.user.first_name} {member.user.last_name}
                                {member.user.id === user?.id && (
                                  <span className="text-white/60 text-sm font-normal ml-1">(You)</span>
                                )}
                              </h4>
                              
                              {/* Role Badge - Only show for admins and creators */}
                              {(member.role === 'admin' || member.role === 'creator') && (
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                                  {getRoleIcon(member.role)}
                                  <span>{getRoleLabel(member.role)}</span>
                                </div>
                              )}
                            </div>

                            <p className="text-white/60 text-sm mt-1">
                              Joined {formatJoinDate(member.joined_at)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        {canManageMember(member) && isAdmin && (
                          <div className="flex items-center space-x-2">
                            {member.role === 'member' ? (
                              <motion.button
                                onClick={() => {
                                  setPendingAction({
                                    type: 'promote',
                                    memberId: member.user.id,
                                    memberName: `${member.user.first_name} ${member.user.last_name}`
                                  })
                                  setShowRoleModal(true)
                                }}
                                className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-xl transition-all duration-200 text-sm font-medium"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Shield className="w-4 h-4" />
                                <span>Make Admin</span>
                              </motion.button>
                            ) : (
                              <motion.button
                                onClick={() => {
                                  setPendingAction({
                                    type: 'demote',
                                    memberId: member.user.id,
                                    memberName: `${member.user.first_name} ${member.user.last_name}`
                                  })
                                  setShowRoleModal(true)
                                }}
                                className="flex items-center space-x-2 px-3 py-2 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 rounded-xl transition-all duration-200 text-sm font-medium"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <User className="w-4 h-4" />
                                <span>Make Member</span>
                              </motion.button>
                            )}

                            <motion.button
                              onClick={() => {
                                setPendingAction({
                                  type: 'remove',
                                  memberId: member.user.id,
                                  memberName: `${member.user.first_name} ${member.user.last_name}`
                                })
                                setShowRemoveModal(true)
                              }}
                              className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl transition-all duration-200 text-sm font-medium"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remove</span>
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Privacy & Permissions Tab */}
          {activeTab === 'privacy' && isAdmin && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-6"
            >
              {/* Group Privacy */}
              <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500">
                <div className="flex items-center space-x-3 mb-6">
                  {groupInfo?.privacy === 'public' ? (
                    <Unlock className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Lock className="w-6 h-6 text-orange-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">Group Privacy</h3>
                    <p className="text-white/60 text-sm">Control who can discover and join your group</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      {groupInfo?.privacy === 'public' ? (
                        <Unlock className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-orange-400" />
                      )}
                      <div>
                        <div className="font-medium text-white">
                          {groupInfo?.privacy === 'public' ? 'Public Group' : 'Private Group'}
                        </div>
                        <div className="text-sm text-white/60">
                          {groupInfo?.privacy === 'public'
                            ? 'Anyone can find and join this group'
                            : 'Only invited members can join this group'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleUpdatePrivacy(groupInfo?.privacy === 'public' ? 'private' : 'public')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        groupInfo?.privacy === 'public'
                          ? 'bg-emerald-500'
                          : 'bg-orange-500'
                      }`}
                      title={`Switch to ${groupInfo?.privacy === 'public' ? 'private' : 'public'} group`}
                      aria-label={`Switch to ${groupInfo?.privacy === 'public' ? 'private' : 'public'} group`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          groupInfo?.privacy === 'public'
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Permissions */}
              <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500">
                <div className="flex items-center space-x-3 mb-6">
                  <Eye className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Content Permissions</h3>
                    <p className="text-white/60 text-sm">Control who can create different types of content in this group</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Posts Permission */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      <Edit3 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="font-medium text-white">Posts</div>
                        <div className="text-sm text-white/60">
                          {groupInfo?.create_posts === 'all_members'
                            ? 'Any member can create posts'
                            : 'Only admins can create posts'
                          }
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdatePermissions({
                        create_posts: groupInfo?.create_posts === 'all_members' ? 'admins_only' : 'all_members',
                        create_polls: groupInfo?.create_polls || 'all_members',
                        create_events: groupInfo?.create_events || 'all_members',
                        send_messages: groupInfo?.send_messages || 'all_members'
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        groupInfo?.create_posts === 'all_members'
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                      }`}
                      title={`Switch posts permission to ${groupInfo?.create_posts === 'all_members' ? 'admins only' : 'all members'}`}
                      aria-label={`Switch posts permission to ${groupInfo?.create_posts === 'all_members' ? 'admins only' : 'all members'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          groupInfo?.create_posts === 'all_members'
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Polls Permission */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-teal-400" />
                      <div>
                        <div className="font-medium text-white">Polls</div>
                        <div className="text-sm text-white/60">
                          {groupInfo?.create_polls === 'all_members'
                            ? 'Any member can create polls'
                            : 'Only admins can create polls'
                          }
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdatePermissions({
                        create_posts: groupInfo?.create_posts || 'all_members',
                        create_polls: groupInfo?.create_polls === 'all_members' ? 'admins_only' : 'all_members',
                        create_events: groupInfo?.create_events || 'all_members',
                        send_messages: groupInfo?.send_messages || 'all_members'
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        groupInfo?.create_polls === 'all_members'
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                      }`}
                      title={`Switch polls permission to ${groupInfo?.create_polls === 'all_members' ? 'admins only' : 'all members'}`}
                      aria-label={`Switch polls permission to ${groupInfo?.create_polls === 'all_members' ? 'admins only' : 'all members'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          groupInfo?.create_polls === 'all_members'
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Events Permission */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      <Crown className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="font-medium text-white">Events</div>
                        <div className="text-sm text-white/60">
                          {groupInfo?.create_events === 'all_members'
                            ? 'Any member can create events'
                            : 'Only admins can create events'
                          }
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdatePermissions({
                        create_posts: groupInfo?.create_posts || 'all_members',
                        create_polls: groupInfo?.create_polls || 'all_members',
                        create_events: groupInfo?.create_events === 'all_members' ? 'admins_only' : 'all_members',
                        send_messages: groupInfo?.send_messages || 'all_members'
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        groupInfo?.create_events === 'all_members'
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                      }`}
                      title={`Switch events permission to ${groupInfo?.create_events === 'all_members' ? 'admins only' : 'all members'}`}
                      aria-label={`Switch events permission to ${groupInfo?.create_events === 'all_members' ? 'admins only' : 'all members'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          groupInfo?.create_events === 'all_members'
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Messages Permission */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="font-medium text-white">Messages</div>
                        <div className="text-sm text-white/60">
                          {groupInfo?.send_messages === 'all_members'
                            ? 'Any member can send messages'
                            : 'Only admins can send messages'
                          }
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdatePermissions({
                        create_posts: groupInfo?.create_posts || 'all_members',
                        create_polls: groupInfo?.create_polls || 'all_members',
                        create_events: groupInfo?.create_events || 'all_members',
                        send_messages: groupInfo?.send_messages === 'all_members' ? 'admins_only' : 'all_members'
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        groupInfo?.send_messages === 'all_members'
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                      }`}
                      title={`Switch messages permission to ${groupInfo?.send_messages === 'all_members' ? 'admins only' : 'all members'}`}
                      aria-label={`Switch messages permission to ${groupInfo?.send_messages === 'all_members' ? 'admins only' : 'all members'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          groupInfo?.send_messages === 'all_members'
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Join Requests Tab */}
          {activeTab === 'requests' && isAdmin && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="space-y-6">
                {/* Received Requests */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Join Requests ({(receivedRequests || []).length})</h3>
                  {(receivedRequests || []).length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      No pending join requests
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(receivedRequests || []).map((request) => (
                        <div key={request.id} className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-4 hover:shadow-emerald-500/10 transition-all duration-500">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {request.user.avatar ? (
                                <img
                                  src={request.user.avatar}
                                  alt={request.user.first_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                                  {request.user.first_name[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-white">
                                  {request.user.first_name} {request.user.last_name}
                                </div>
                                <div className="text-white/60 text-sm">
                                  Requested {request.joined_at ? formatJoinDate(request.joined_at) : 'recently'}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <motion.button
                                onClick={() => handleRespondToRequest(request.user.id, 'accept')}
                                className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-2xl hover:bg-emerald-500/30 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Accept
                              </motion.button>
                              <motion.button
                                onClick={() => handleRespondToRequest(request.user.id, 'decline')}
                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-2xl hover:bg-red-500/30 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Decline
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent Requests */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Sent Invitations ({(sentRequests || []).length})</h3>
                  {(sentRequests || []).length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      No sent invitations
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(sentRequests || []).map((request) => (
                        <div key={request.id} className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-4 hover:shadow-emerald-500/10 transition-all duration-500">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {request.user.avatar ? (
                                <img
                                  src={request.user.avatar}
                                  alt={request.user.first_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                                  {request.user.first_name[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-white">
                                  {request.user.first_name} {request.user.last_name}
                                </div>
                                <div className="text-white/60 text-sm">
                                  Invited {request.joined_at ? formatJoinDate(request.joined_at) : 'recently'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white/60 text-sm">Pending response</span>
                              <motion.button
                                onClick={() => handleCancelInvitation(request.id)}
                                className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl transition-all duration-200 text-xs font-medium"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <X className="w-3 h-3" />
                                <span>Cancel</span>
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && userRole === 'creator' && (
            <motion.div
              key="danger"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              {/* Delete Group Section */}
              <motion.div
                className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent backdrop-blur-xl rounded-3xl border border-red-500/30 shadow-2xl p-6 hover:shadow-red-500/10 transition-all duration-500"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-300">Delete Group</h3>
                      <p className="text-red-200/60 text-sm">Permanently remove this group and all its data</p>
                    </div>
                  </div>

                  {/* Impact indicator */}
                  <motion.div
                    className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="text-red-300 text-xs font-medium">Critical</span>
                  </motion.div>
                </div>

                {/* Data Impact Summary */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6">
                  <h4 className="text-red-300 font-medium mb-3 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Data that will be permanently deleted:</span>
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span className="text-red-200/80 text-sm">All posts and comments</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span className="text-red-200/80 text-sm">Group messages and chats</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span className="text-red-200/80 text-sm">All events and polls</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span className="text-red-200/80 text-sm">Member relationships</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.div>
                  <span>Delete This Group</span>
                  <motion.div
                    animate={{
                      x: [0, 3, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </motion.button>

                <motion.p
                  className="text-red-200/50 text-xs text-center mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  ⚠️ This action cannot be undone. All group data will be permanently lost.
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative w-full max-w-2xl h-[80vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* Header */}
              <motion.div
                className="relative flex-shrink-0 p-6 lg:p-8 pb-4 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserPlus className="w-6 h-6 text-white drop-shadow-sm" />
                      </div>
                      <motion.div
                        className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    <div>
                      <motion.h3
                        className="text-xl lg:text-2xl font-bold text-white mb-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        Invite Members to {groupInfo?.title}
                      </motion.h3>
                      <motion.p
                        className="text-white/60 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                      >
                        Select users to invite to your group
                      </motion.p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setShowInviteModal(false)}
                    className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    title="Close"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                  </motion.button>
                </div>

                {/* Selection Summary */}
                {selectedUsers.length > 0 && (
                  <motion.div
                    className="bg-emerald-500/20 border border-emerald-400/50 rounded-xl p-4 mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <p className="text-emerald-200 text-sm font-medium">
                      Selected: {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'}
                    </p>
                  </motion.div>
                )}

                {/* Search Input */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-cyan-500/20 backdrop-blur-sm rounded-xl border border-white/20"></div>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-white/60">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users by name or username..."
                      value={searchTerm}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => handleSearchUsers('')}
                        className="absolute right-4 text-white/60 hover:text-white transition-colors"
                        title="Clear search"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              {/* Scrollable Content Area */}
              <motion.div
                className="relative flex-1 overflow-y-auto px-6 lg:px-8 py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="space-y-3">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <motion.div
                        key={user.id}
                        onClick={() => handleUserSelect(user.id)}
                        className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          selectedUsers.includes(user.id)
                            ? 'bg-emerald-500/20 border-emerald-400/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + filteredUsers.indexOf(user) * 0.05, duration: 0.3 }}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={`${user.first_name} ${user.last_name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {user.first_name[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          {selectedUsers.includes(user.id) && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-white font-medium text-sm truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            {user.is_private && (
                              <Lock className="w-3 h-3 text-orange-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-white/60 text-xs">
                            @{user.nickname || user.first_name.toLowerCase()}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : allUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white/60 text-sm">Loading users...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">No users found matching your search</p>
                      <p className="text-white/40 text-sm mt-2">Try a different search term</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div
                className="relative flex-shrink-0 p-6 lg:p-8 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                  <motion.button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleInviteMultipleUsers}
                    disabled={isInviting || selectedUsers.length === 0}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 ${
                      isInviting || selectedUsers.length === 0
                        ? 'bg-white/20 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                    }`}
                    whileHover={{ scale: (isInviting || selectedUsers.length === 0) ? 1 : 1.05 }}
                    whileTap={{ scale: (isInviting || selectedUsers.length === 0) ? 1 : 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {isInviting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Invitations ({selectedUsers.length})</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Group Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteModal(false)
              setDeleteConfirmation('')
              setDeleteCountdown(5)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-slate-900/95 via-red-900/10 to-slate-900/95 backdrop-blur-2xl border-2 border-red-500/30 rounded-3xl p-4 max-w-md w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl shadow-red-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Scrollable Content */}
              <div className="max-h-[calc(90vh-2rem)] overflow-y-auto">
                {/* Header with pulsing warning */}
              <motion.div
                className="text-center mb-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(239, 68, 68, 0.4)",
                      "0 0 60px rgba(239, 68, 68, 0.8)",
                      "0 0 30px rgba(239, 68, 68, 0.4)"
                    ],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Trash2 className="w-8 h-8 text-white" />
                </motion.div>
                <motion.h3
                  className="text-xl font-bold text-red-300 mb-2"
                  animate={{
                    color: ["#fca5a5", "#ef4444", "#fca5a5"]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ⚠️ Delete Group Forever
                </motion.h3>
                <p className="text-red-200/80 text-sm">
                  This action <strong>cannot be undone</strong> and will permanently destroy everything.
                </p>
              </motion.div>

              {/* Critical Impact Warning */}
              <motion.div
                className="bg-gradient-to-r from-red-600/20 to-red-500/20 border-2 border-red-500/40 rounded-2xl p-4 mb-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <h4 className="text-red-300 font-bold text-base">Critical Impact</h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-red-200 font-medium text-sm">Complete Data Loss</p>
                      <p className="text-red-200/70 text-xs">All posts, comments, likes, and media will be permanently deleted</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-red-200 font-medium text-sm">Communication History</p>
                      <p className="text-red-200/70 text-xs">All group messages and chat history will be erased</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-red-200 font-medium text-sm">Member Relationships</p>
                      <p className="text-red-200/70 text-xs">All member connections and roles will be permanently removed</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-red-200 font-medium text-sm">Events & Activities</p>
                      <p className="text-red-200/70 text-xs">All events, polls, and group activities will be destroyed</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Safety Confirmation */}
              <motion.div
                className="bg-gradient-to-r from-yellow-600/20 to-orange-500/20 border border-yellow-500/40 rounded-2xl p-4 mb-4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-yellow-300 font-bold text-sm">Safety Confirmation Required</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-yellow-200 text-xs font-medium mb-2">
                      Type <strong className="text-yellow-300">"DELETE"</strong> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Type DELETE here..."
                      className="w-full px-3 py-2 bg-slate-800/50 border border-yellow-500/30 rounded-lg text-white placeholder-yellow-200/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-yellow-200/80 text-sm">
                      {deleteCountdown > 0 ? `Wait ${deleteCountdown} seconds...` : 'Ready to delete'}
                    </span>
                    <div className="flex items-center space-x-2">
                      {deleteCountdown > 0 && (
                        <motion.div
                          className="w-2 h-2 bg-yellow-400 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                      <span className={`text-sm font-medium ${
                        deleteCountdown > 0 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {deleteCountdown > 0 ? '⏳' : '✅'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <motion.button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmation('')
                    setDeleteCountdown(5)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-semibold text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isDeleting}
                >
                  Cancel - Keep Group Safe
                </motion.button>

                <motion.button
                  onClick={handleDeleteGroup}
                  disabled={isDeleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0}
                  className={`flex-1 px-4 py-3 rounded-2xl font-bold text-white transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 text-sm ${
                    isDeleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0
                      ? 'bg-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25 hover:shadow-red-500/40'
                  }`}
                  whileHover={{
                    scale: (isDeleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0) ? 1 : 1.02,
                    y: (isDeleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0) ? 0 : -1
                  }}
                  whileTap={{
                    scale: (isDeleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0) ? 1 : 0.98
                  }}
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Deleting Group...</span>
                    </>
                  ) : deleteCountdown > 0 ? (
                    <>
                      <Clock className="w-5 h-5" />
                      <span>Wait {deleteCountdown}s</span>
                    </>
                  ) : deleteConfirmation !== 'DELETE' ? (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      <span>Type DELETE</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span>Delete Forever</span>
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* Final Warning */}
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <p className="text-red-200/50 text-xs">
                  💀 This is your final warning. Deletion is permanent and irreversible.
                </p>
              </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Change Confirmation Modal */}
      <AnimatePresence>
        {showRoleModal && pendingAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRoleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  pendingAction.type === 'promote' ? 'bg-blue-500/20' : 'bg-orange-500/20'
                }`}>
                  {pendingAction.type === 'promote' ? (
                    <Shield className="w-6 h-6 text-blue-400" />
                  ) : (
                    <User className="w-6 h-6 text-orange-400" />
                  )}
                </div>
                <h3 className="text-white font-semibold text-lg mb-4">
                  {pendingAction.type === 'promote' ? 'Promote to Admin' : 'Demote to Member'}
                </h3>

                <div className="text-left space-y-4 mb-6">
                  <p className="text-white/70 text-sm">
                    Are you sure you want to {pendingAction.type === 'promote' ? 'promote' : 'demote'}{' '}
                    <span className="font-medium text-white">{pendingAction.memberName}</span>?
                  </p>

                  <div className={`p-4 rounded-xl border ${
                    pendingAction.type === 'promote'
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : 'bg-orange-500/10 border-orange-500/20'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {pendingAction.type === 'promote' ? (
                        <Shield className="w-4 h-4 text-blue-400" />
                      ) : (
                        <User className="w-4 h-4 text-orange-400" />
                      )}
                      <span className={`font-medium ${
                        pendingAction.type === 'promote' ? 'text-blue-300' : 'text-orange-300'
                      }`}>
                        {pendingAction.type === 'promote' ? 'Admin Privileges' : 'Member Privileges'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      pendingAction.type === 'promote' ? 'text-blue-200/80' : 'text-orange-200/80'
                    }`}>
                      {pendingAction.type === 'promote'
                        ? 'Admins can manage members, create content, and moderate the group.'
                        : 'Members have basic access and cannot manage other members.'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRoleModal(false)
                      setPendingAction(null)
                    }}
                    className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (pendingAction) {
                        handleUpdateRole(pendingAction.memberId, pendingAction.type === 'promote' ? 'admin' : 'member')
                        setShowRoleModal(false)
                        setPendingAction(null)
                      }
                    }}
                    className={`flex-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
                      pendingAction.type === 'promote'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {pendingAction.type === 'promote' ? 'Promote' : 'Demote'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Member Confirmation Modal */}
      <AnimatePresence>
        {showRemoveModal && pendingAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRemoveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-4">Remove Member</h3>

                <div className="text-left space-y-4 mb-6">
                  <p className="text-white/70 text-sm">
                    Are you sure you want to remove{' '}
                    <span className="font-medium text-white">{pendingAction.memberName}</span> from this group?
                  </p>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <h4 className="text-red-300 font-medium mb-2 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>This will:</span>
                    </h4>
                    <ul className="text-red-200/70 text-sm space-y-1">
                      <li>• Remove them from the group immediately</li>
                      <li>• Delete all their posts and comments</li>
                      <li>• Remove them from all group conversations</li>
                      <li>• They will need to be re-invited to rejoin</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 font-medium">Warning</span>
                    </div>
                    <p className="text-yellow-200/80 text-sm">
                      This action cannot be undone. The member will lose access to all group content.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRemoveModal(false)
                      setPendingAction(null)
                    }}
                    className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (pendingAction) {
                        handleKickMember(pendingAction.memberId)
                        setShowRemoveModal(false)
                        setPendingAction(null)
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all duration-200"
                  >
                    Remove Member
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

export default GroupSettingsTab