'use client'
import React, { useState, useEffect } from 'react'
import { Users, Crown, Shield, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useOnlineStatus } from '@/hooks'
import { api, Member } from '@/lib/api'

interface GroupMembersTabProps {
  groupId: number
}

const GroupMembersTab: React.FC<GroupMembersTabProps> = ({ groupId }) => {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { onlineUsers } = useOnlineStatus()

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">Group Members</h2>
          <div className="px-3 py-1 bg-white/10 rounded-full">
            <span className="text-white/70 text-sm font-medium">{members.length}</span>
          </div>
        </div>
      </div>

      {/* Members Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMembers.map((member, index) => {
              // Check if member is online
              const isMemberOnline = onlineUsers.some(u => u.user_id === member.user.id && u.status === 'online')
              
              return (
                <motion.div
                  key={member.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
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
                      
                      {/* Online Status Indicator */}
                      {isMemberOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white/20 rounded-full"></div>
                      )}
                      
                      {/* Role Icon Badge */}
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                        {getRoleIcon(member.role)}
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-white truncate">
                          {member.user.first_name} {member.user.last_name}
                          {member.user.id === user?.id && (
                            <span className="text-white/60 text-sm font-normal ml-1">(You)</span>
                          )}
                        </h3>
                        
                        {/* Online Status Text */}
                        {isMemberOnline && (
                          <span className="text-green-400 text-xs">• Online</span>
                        )}
                        
                        {/* Role Badge */}
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                          {getRoleIcon(member.role)}
                          <span>{getRoleLabel(member.role)}</span>
                        </div>
                      </div>

                      {/* Join Date */}
                      <p className="text-white/60 text-sm mt-1">
                        Joined {formatJoinDate(member.joined_at)}
                      </p>

                      {/* Nickname */}
                      {member.user.nickname && (
                        <p className="text-white/50 text-sm mt-1">
                          @{member.user.nickname}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupMembersTab