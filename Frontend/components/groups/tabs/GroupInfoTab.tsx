'use client'
import React, { useState, useEffect } from 'react'
import { Users, Calendar, Globe, Lock, Crown, Shield, User, LogOut, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { api, GroupResponse, Member } from '@/lib/api'
import { getAvatarUrl, getUserInitials, getGroupInitials } from '@/utils/avatarUtils'
import Image from 'next/image'
import ImagePreviewModal from '@/components/ui/ImagePreviewModal'

interface GroupInfoTabProps {
  groupId: number
  onLeaveGroup?: (groupId: number) => void
  onManageAdmins?: () => void
  onClose?: () => void
}

const GroupInfoTab: React.FC<GroupInfoTabProps> = ({ groupId, onLeaveGroup, onManageAdmins, onClose }) => {
  const [groupInfo, setGroupInfo] = useState<GroupResponse | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [nextAdmin, setNextAdmin] = useState<string>('')
  const [hasExistingAdmins, setHasExistingAdmins] = useState(false)
  const [hasOtherAdmins, setHasOtherAdmins] = useState(false)
  const [imagePreviewState, setImagePreviewState] = useState({ isOpen: false, url: null as string | null })
  const { user } = useAuth()
  const router = useRouter()
  const { onlineUsers, isConnected } = useWebSocket()

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true)
        const [groupData, membersData, roleData] = await Promise.all([
          api.getGroup(groupId),
          api.getGroupMembers(groupId),
          api.getUserRole(groupId)
        ])
        setGroupInfo(groupData)
        setMembers(membersData.members)
        setUserRole(roleData.role)
        
        // Fetch next admin info for creators and check other admins for admin users
        if (roleData.role === 'creator') {
          try {
            const nextAdminData = await api.getNextAdmin(groupId)
            setHasExistingAdmins(nextAdminData.has_admins)
            // Use first_member as next admin if no admins exist
            setNextAdmin(nextAdminData.has_admins ? nextAdminData.next_admin : nextAdminData.first_member)
          } catch (error) {
            console.error('Failed to fetch next admin:', error)
            setNextAdmin('No eligible members')
            setHasExistingAdmins(false)
          }
        } else if (roleData.role === 'admin') {
          try {
            const nextAdminData = await api.getNextAdmin(groupId)
            // For admins, check if there are other admins (has_admins means there are admins besides creator)
            setHasOtherAdmins(nextAdminData.has_admins)
          } catch (error) {
            console.error('Failed to check other admins:', error)
            setHasOtherAdmins(false)
          }
        }
      } catch (error) {
        console.error('Failed to fetch group data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroupData()
  }, [groupId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'Recently joined'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getUserStatus = (userId: number) => {
    const onlineUser = onlineUsers.find(ou => ou.user_id === userId)
    // Normalize to lowercase and fallback: if it's the current user and WS is connected, show online
    const raw = onlineUser?.status ?? ((userId === user?.id && isConnected) ? 'online' : 'offline')
    return String(raw).toLowerCase() as 'online' | 'busy' | 'away' | 'invisible' | 'offline'
  }

  const handleMemberClick = (memberId: number) => {
    router.push(`/profile/${memberId}`)
  }

  const handleLeaveGroup = () => {
    // Find next admin if user is creator
    if (userRole === 'creator') {
      const admins = members.filter(member => 
        member.role === 'admin' && member.user.id !== user?.id
      );
      
      if (admins.length === 0) {
        // No other admins, find first non-creator member
        const firstMember = members.find(member => 
          member.role === 'member' && member.user.id !== user?.id
        );
        setNextAdmin(firstMember ? `${firstMember.user.first_name} ${firstMember.user.last_name}` : 'No eligible members');
      } else {
        setNextAdmin('');
      }
    }
    setShowLeaveConfirm(true)
  }

  const confirmLeaveGroup = async () => {
    try {
      if (onLeaveGroup) {
        onLeaveGroup(groupId)
      } else {
        await api.leaveGroup(groupId)
      }
      setShowLeaveConfirm(false)
      setUserRole('')
      setNextAdmin('')
      // Close the chat window after leaving
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Failed to leave group:', error)
      setShowLeaveConfirm(false)
    }
  }

  const handleManageAdmins = () => {
    setShowLeaveConfirm(false)
    if (onManageAdmins) {
      onManageAdmins()
    }
  }

  // Image preview handlers
  const handleGroupAvatarClick = () => {
    if (groupInfo?.avatar && getAvatarUrl(groupInfo.avatar)) {
      setImagePreviewState({ isOpen: true, url: getAvatarUrl(groupInfo.avatar)! })
    }
  }

  const handleImagePreviewClose = () => {
    setImagePreviewState({ isOpen: false, url: null })
  }

  const getOnlineGroupMembersCount = () => {
    if (!isConnected || !members.length) return 0
    
    return members.filter(member => {
      // Exclude current user
      if (member.user.id === user?.id) return false
      
      // Check if member is online
      const onlineUser = onlineUsers.find(ou => ou.user_id === member.user.id)
      return onlineUser && onlineUser.status === 'online'
    }).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
        />
      </div>
    )
  }

  if (!groupInfo) {
    return (
      <div className="flex items-center justify-center h-full text-white/60">
        Failed to load group information
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-scroll scrollbar-hide p-6 space-y-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Group Header */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Leave Group Button - Inline with Avatar */}
          {groupInfo.is_member && (
            <motion.div
              className="absolute top-0 right-0 z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.button
                onClick={handleLeaveGroup}
                className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-red-500/25 hover:to-orange-500/25 border border-amber-400/30 hover:border-red-400/50 text-amber-400 hover:text-red-300 rounded-xl transition-all duration-300 flex items-center space-x-2 font-medium text-sm backdrop-blur-sm shadow-lg hover:shadow-red-500/25 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>Leave</span>
              </motion.button>
            </motion.div>
          )}

          <div className="flex flex-col items-center text-center">
            <div 
              className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-4 ring-white/20 ${groupInfo?.avatar && getAvatarUrl(groupInfo.avatar) ? 'cursor-pointer hover:ring-emerald-400/60 transition-all duration-300' : ''}`}
              onClick={groupInfo?.avatar && getAvatarUrl(groupInfo.avatar) ? handleGroupAvatarClick : undefined}
              title={groupInfo?.avatar && getAvatarUrl(groupInfo.avatar) ? 'Click to view full size' : undefined}
            >
              {groupInfo?.avatar && getAvatarUrl(groupInfo.avatar) ? (
                <Image
                  src={getAvatarUrl(groupInfo.avatar)!}
                  alt={groupInfo.title}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover rounded-full hover:brightness-110 transition-all duration-200"
                />
              ) : (
                getGroupInitials(groupInfo?.title || '')
              )}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-4">
              {groupInfo.title}
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
              {groupInfo.description}
            </p>
          </div>
        </motion.div>

        {/* Group Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 text-center hover:shadow-emerald-500/10 transition-all duration-500 group">
            <Users className="w-8 h-8 text-emerald-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
            <div className="text-2xl font-bold text-white mb-1">{groupInfo.member_count}</div>
            <div className="text-white/60 text-sm">Members</div>
          </div>

          <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 text-center hover:shadow-emerald-500/10 transition-all duration-500 group">
            <div className="w-8 h-8 mx-auto mb-3 relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-green-500/50 shadow-lg"></div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{getOnlineGroupMembersCount()}</div>
            <div className="text-white/60 text-sm">Online</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 text-center hover:shadow-emerald-500/10 transition-all duration-500 group">
            <Calendar className="w-8 h-8 text-teal-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
            <div className="text-lg font-semibold text-white mb-1">{formatDate(groupInfo.created_at)}</div>
            <div className="text-white/60 text-sm">Created</div>
          </div>

          <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 text-center hover:shadow-emerald-500/10 transition-all duration-500 group">
            {groupInfo.privacy === 'public' ? (
              <Globe className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <Lock className="w-8 h-8 text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
            )}
            <div className="text-lg font-semibold text-white mb-1 capitalize">{groupInfo.privacy}</div>
            <div className="text-white/60 text-sm">Group</div>
          </div>
        </motion.div>

        {/* Group Creator */}
        {groupInfo.creator && (
          <motion.div
            className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Crown className="w-5 h-5 text-yellow-400 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Group Creator
            </h3>
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:bg-white/5 rounded-xl p-4 -m-4 transition-all duration-200 group"
              onClick={() => groupInfo.creator && handleMemberClick(groupInfo.creator.id)}
            >
              <div className="relative">
                {groupInfo.creator.avatar ? (
                  <Image
                    src={groupInfo.creator.avatar}
                    alt={`${groupInfo.creator.first_name} ${groupInfo.creator.last_name}`}
                    width={56}
                      height={56}
                    className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-white/20 group-hover:ring-emerald-400/50 transition-all duration-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-white/20 group-hover:ring-emerald-400/50 transition-all duration-300">
                    {getUserInitials(groupInfo.creator)}
                  </div>
                )}
                
                {/* Status Indicator */}
                {isConnected && groupInfo.creator && (
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white/20 ${
                    getUserStatus(groupInfo.creator.id) === 'online' ? 'bg-green-500' :
                    getUserStatus(groupInfo.creator.id) === 'busy' ? 'bg-red-500' :
                    getUserStatus(groupInfo.creator.id) === 'away' ? 'bg-yellow-500' :
                    getUserStatus(groupInfo.creator.id) === 'invisible' ? 'bg-gray-500' :
                    'bg-gray-400' // offline
                  }`}></div>
                )}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white group-hover:text-emerald-200 transition-colors duration-300">
                  {groupInfo.creator.first_name} {groupInfo.creator.last_name}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor('creator')}`}>
                    {getRoleIcon('creator')}
                    <span>Creator</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* All Members */}
        {members.length > 0 && (
          <motion.div
            className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Users className="w-5 h-5 text-emerald-400 mr-2 group-hover:scale-110 transition-transform duration-300" />
              All Members
              <div className="ml-3 px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full border border-emerald-400/30">
                <span className="text-emerald-300 text-sm font-medium">{members.length}</span>
              </div>
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-scroll scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[...members].sort((a, b) => {
                const roleOrder = { creator: 0, admin: 1, member: 2 }
                const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3
                const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3
                return aOrder - bOrder
              }).map((member, index) => {
                const userStatus = getUserStatus(member.user.id)
                return (
                  <motion.div
                    key={member.id}
                    className="flex items-center space-x-4 p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl hover:from-white/10 hover:to-white/15 transition-all duration-200 cursor-pointer group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleMemberClick(member.user.id)}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {member.user.avatar ? (
                        <Image
                          src={member.user.avatar}
                          alt={`${member.user.first_name} ${member.user.last_name}`}
                          width={56}
                          height={56}
                          className="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-white/20 group-hover:ring-emerald-400/50 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-white/20 group-hover:ring-emerald-400/50 transition-all duration-300">
                          {getUserInitials(member.user)}
                        </div>
                      )}
                      
                      {/* Status Indicator (show for all, including current user) */}
                      {isConnected && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white/20 ${
                          userStatus === 'online' ? 'bg-green-500' :
                          userStatus === 'busy' ? 'bg-red-500' :
                          userStatus === 'away' ? 'bg-yellow-500' :
                          userStatus === 'invisible' ? 'bg-gray-500' :
                          'bg-gray-400' // offline
                        }`}></div>
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-white truncate group-hover:text-emerald-200 transition-colors duration-300">
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

                      {/* Username */}
                      {member.user.nickname && (
                        <p className="text-white/50 text-sm mt-1">
                          @{member.user.nickname}
                        </p>
                      )}

                      {/* Join Date */}
                      <p className="text-white/60 text-xs mt-2">
                        Joined {formatJoinDate(member.joined_at)}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewState.isOpen}
        imageUrl={imagePreviewState.url}
        alt={`${groupInfo?.title} avatar`}
        onClose={handleImagePreviewClose}
      />
      
      {/* Leave Group Confirmation Dialog */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2 flex items-center justify-center">
                  {userRole === 'creator' ? <Crown className="w-4 h-4 text-yellow-400 mr-2" /> :
                   userRole === 'admin' ? <Shield className="w-4 h-4 text-blue-400 mr-2" /> : null}
                  Leave Group
                </h3>
                
                {/* Different messages based on user role */}
                {userRole === 'creator' && (
                  <div className="mb-6">
                    {hasExistingAdmins ? (
                      <p className="text-white/70 text-sm mb-3">
                        As the group creator, leaving will transfer ownership to the next admin.
                      </p>
                    ) : (
                      <p className="text-white/70 text-sm mb-3">
                        As the group creator, since there are no admins, ownership will be transferred to the first added member (like WhatsApp).
                      </p>
                    )}
                    
                    {nextAdmin && nextAdmin !== 'No eligible members' ? (
                      <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 mb-4">
                        <p className="text-yellow-200 text-sm font-medium flex items-center">
                          <Crown className="w-4 h-4 mr-2" />
                          {hasExistingAdmins ? 'Next Admin Owner:' : 'Next Owner (First Member):'} {nextAdmin}
                        </p>
                      </div>
                    ) : nextAdmin === 'No eligible members' ? (
                      <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-4">
                        <p className="text-red-200 text-sm font-medium">
                          No eligible members to transfer ownership to.
                        </p>
                      </div>
                    ) : null}
                    
                    {!hasExistingAdmins && nextAdmin && nextAdmin !== 'No eligible members' ? (
                      <p className="text-white/60 text-xs">
                        You can select an admin before leaving, or proceed to transfer ownership to the first member.
                      </p>
                    ) : hasExistingAdmins ? (
                      <p className="text-white/60 text-xs">
                        You can manage admins before leaving, or proceed to leave the group.
                      </p>
                    ) : (
                      <p className="text-white/60 text-xs">
                        Add some admins first, or the group will be transferred to the first member.
                      </p>
                    )}
                  </div>
                )}
                
                {userRole === 'admin' && (
                  <div className="mb-6">
                    <p className="text-white/70 text-sm mb-3">
                      Are you sure you want to leave &quot;{groupInfo?.title}&quot;? As an admin, you will lose your administrative privileges.
                    </p>
                    {hasOtherAdmins ? (
                      <p className="text-white/60 text-xs">
                        Since there are other admins in the group, you can leave normally. You will need to be re-invited to rejoin.
                      </p>
                    ) : (
                      <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3">
                        <p className="text-yellow-200 text-sm font-medium flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          You are the only admin. Consider promoting someone before leaving.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {userRole === 'member' && (
                  <p className="text-white/70 text-sm mb-6">
                    Are you sure you want to leave &quot;{groupInfo?.title}&quot;? You will no longer receive messages from this group and will need to be re-invited to rejoin.
                  </p>
                )}

                {/* Buttons based on user role and conditions */}
                {userRole === 'creator' ? (
                  nextAdmin && nextAdmin !== 'No eligible members' ? (
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowLeaveConfirm(false)}
                          className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleManageAdmins}
                          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>{hasExistingAdmins ? 'Manage Admins' : 'Add Admin'}</span>
                        </button>
                      </div>
                      <button
                        onClick={confirmLeaveGroup}
                        className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all duration-200"
                      >
                        {hasExistingAdmins ? 'Leave Group' : 'Leave & Transfer to First Member'}
                      </button>
                    </div>
                  ) : (
                    /* No eligible members case */
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowLeaveConfirm(false)}
                        className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleManageAdmins}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Add Members</span>
                      </button>
                    </div>
                  )
                ) : userRole === 'admin' ? (
                  /* Admin buttons - show manage admins only if they're the only admin */
                  !hasOtherAdmins ? (
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowLeaveConfirm(false)}
                          className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleManageAdmins}
                          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Add Admin</span>
                        </button>
                      </div>
                      <button
                        onClick={confirmLeaveGroup}
                        className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all duration-200"
                      >
                        Leave Anyway
                      </button>
                    </div>
                  ) : (
                    /* Normal admin leave when other admins exist */
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowLeaveConfirm(false)}
                        className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmLeaveGroup}
                        className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all duration-200"
                      >
                        Leave Group
                      </button>
                    </div>
                  )
                ) : (
                  /* Member buttons - simple leave */
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowLeaveConfirm(false)}
                      className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmLeaveGroup}
                      className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all duration-200"
                    >
                      Leave Group
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupInfoTab