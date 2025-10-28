'use client'
import React from 'react'
import Image from 'next/image'
import { Users, Shield, User as UserIcon, UserPlus, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Member, User } from '@/lib/api'
import { getUserInitials } from '@/utils/avatarUtils'

interface GroupMembersTabProps {
  members: Member[]
  isLoading: boolean
  isAdmin: boolean
  user: User | null
  onInviteClick: () => void
  onPromoteMember: (memberId: number, memberName: string) => void
  onDemoteMember: (memberId: number, memberName: string) => void
  onRemoveMember: (memberId: number, memberName: string) => void
  formatJoinDate: (dateString?: string) => string
  getRoleIcon: (role?: string) => React.ReactNode
  getRoleLabel: (role?: string) => string
  getRoleColor: (role?: string) => string
  canManageMember: (member: Member) => boolean
}

export default function GroupMembersTab({
  members,
  isLoading,
  isAdmin,
  user,
  onInviteClick,
  onPromoteMember,
  onDemoteMember,
  onRemoveMember,
  formatJoinDate,
  getRoleIcon,
  getRoleLabel,
  getRoleColor,
  canManageMember
}: GroupMembersTabProps) {
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { creator: 0, admin: 1, member: 2 }
    const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3
    const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3
    return aOrder - bOrder
  })

  return (
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
            onClick={onInviteClick}
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
                      <Image
                        src={member.user.avatar}
                        alt={`${member.user.first_name} ${member.user.last_name}`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold shadow-lg">
                        {getUserInitials(member.user)}
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
                        onClick={() => onPromoteMember(member.user.id, `${member.user.first_name} ${member.user.last_name}`)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-xl transition-all duration-200 text-sm font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Make Admin</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => onDemoteMember(member.user.id, `${member.user.first_name} ${member.user.last_name}`)}
                        className="flex items-center space-x-2 px-3 py-2 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 rounded-xl transition-all duration-200 text-sm font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>Make Member</span>
                      </motion.button>
                    )}

                    <motion.button
                      onClick={() => onRemoveMember(member.user.id, `${member.user.first_name} ${member.user.last_name}`)}
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
  )
}