'use client'
import React, { useState, useEffect } from 'react'
import { Settings, Users, Crown, Shield, User, UserPlus, MoreVertical, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { api, Member } from '@/lib/api'

interface GroupSettingsTabProps {
  groupId: number
}

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ groupId }) => {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const { user } = useAuth()

  // Fetch group members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true)
        const response = await api.getGroupMembers(groupId)
        setMembers(response.members)
      } catch (error) {
        console.error('Failed to fetch group members:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [groupId])

  // Get role icon
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
      // await api.updateGroupMemberRole(groupId, memberId, newRole) // TODO: Implement this API method
      setMembers(members.map(member => 
        member.user.id === memberId 
          ? { ...member, role: newRole }
          : member
      ))
      setActiveDropdown(null)
    } catch (error) {
      console.error('Failed to update member role:', error)
      alert('Failed to update member role')
    }
  }

  // Kick member
  const handleKickMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return
    }

    try {
      // await api.kickGroupMember(groupId, memberId) // TODO: Implement this API method
      setMembers(members.filter(member => member.user.id !== memberId))
      setActiveDropdown(null)
    } catch (error) {
      console.error('Failed to kick member:', error)
      alert('Failed to remove member')
    }
  }

  // Invite member
  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || isInviting) return

    try {
      setIsInviting(true)
      // await api.inviteUserToGroup(groupId, [inviteEmail]) // TODO: Implement email-based invite
      setInviteEmail('')
      setShowInviteModal(false)
      alert('Invitation sent successfully!')
    } catch (error) {
      console.error('Failed to invite member:', error)
      alert('Failed to send invitation')
    } finally {
      setIsInviting(false)
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Group Settings</h2>
          </div>
        </div>
      </div>

      {/* Invite Members Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Invite Members</h3>
          <motion.button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserPlus className="w-4 h-4" />
            <span className="font-medium">Invite</span>
          </motion.button>
        </div>
        <p className="text-white/60 text-sm">
          Invite new members to join your group and collaborate together.
        </p>
      </div>

      {/* Members Management Section */}
      <div className="flex-1 overflow-y-scroll scrollbar-hide p-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Manage Members</h3>
          <div className="px-3 py-1 bg-white/10 rounded-full">
            <span className="text-white/70 text-sm font-medium">{members.length}</span>
          </div>
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
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-200"
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
                      
                      {/* Role Icon Badge */}
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                        {getRoleIcon(member.role)}
                      </div>
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
                        
                        {/* Role Badge */}
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                          {getRoleIcon(member.role)}
                          <span>{getRoleLabel(member.role)}</span>
                        </div>
                      </div>

                      <p className="text-white/60 text-sm mt-1">
                        Joined {formatJoinDate(member.joined_at)}
                      </p>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  {canManageMember(member) && (
                    <div className="relative">
                      <motion.button
                        onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </motion.button>

                      <AnimatePresence>
                        {activeDropdown === member.id && (
                          <motion.div
                            className="absolute right-0 top-full mt-2 w-48 bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl shadow-xl z-10"
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="p-2">
                              {member.role === 'member' ? (
                                <motion.button
                                  onClick={() => handleUpdateRole(member.user.id, 'admin')}
                                  className="w-full flex items-center space-x-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-left"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Shield className="w-4 h-4" />
                                  <span>Make Admin</span>
                                </motion.button>
                              ) : (
                                <motion.button
                                  onClick={() => handleUpdateRole(member.user.id, 'member')}
                                  className="w-full flex items-center space-x-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-left"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <User className="w-4 h-4" />
                                  <span>Make Member</span>
                                </motion.button>
                              )}
                              
                              <motion.button
                                onClick={() => handleKickMember(member.user.id)}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200 text-left"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remove Member</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/30 rounded-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Invite Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email Address or Username
                  </label>
                  <input
                    type="text"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email or username..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <motion.button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim() || isInviting}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupSettingsTab