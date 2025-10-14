'use client'
import React, { useState, useEffect } from 'react'
import { Users, Calendar, Globe, Lock, Crown, Shield, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { api, GroupResponse, Member } from '@/lib/api'

interface GroupInfoTabProps {
  groupId: number
}

const GroupInfoTab: React.FC<GroupInfoTabProps> = ({ groupId }) => {
  const [groupInfo, setGroupInfo] = useState<GroupResponse | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true)
        const [groupData, membersData] = await Promise.all([
          api.getGroup(groupId),
          api.getGroupMembers(groupId)
        ])
        setGroupInfo(groupData)
        setMembers(membersData.members)
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
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Group Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-4 ring-white/20">
            #
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-4">
            {groupInfo.title}
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
            {groupInfo.description}
          </p>
        </motion.div>

        {/* Group Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
            <Users className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{groupInfo.member_count}</div>
            <div className="text-white/60 text-sm">Members</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
            <Calendar className="w-8 h-8 text-teal-400 mx-auto mb-3" />
            <div className="text-lg font-semibold text-white mb-1">{formatDate(groupInfo.created_at)}</div>
            <div className="text-white/60 text-sm">Created</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
            {groupInfo.privacy === 'public' ? (
              <Globe className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            ) : (
              <Lock className="w-8 h-8 text-orange-400 mx-auto mb-3" />
            )}
            <div className="text-lg font-semibold text-white mb-1 capitalize">{groupInfo.privacy}</div>
            <div className="text-white/60 text-sm">Group</div>
          </div>
        </motion.div>

        {/* Group Creator */}
        {groupInfo.creator && (
          <motion.div
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Crown className="w-5 h-5 text-yellow-400 mr-2" />
              Group Creator
            </h3>
            <div className="flex items-center space-x-4">
              {groupInfo.creator.avatar ? (
                <img
                  src={groupInfo.creator.avatar}
                  alt={`${groupInfo.creator.first_name} ${groupInfo.creator.last_name}`}
                  className="w-16 h-16 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {groupInfo.creator.first_name[0]}{groupInfo.creator.last_name[0]}
                </div>
              )}
              <div>
                <h4 className="text-lg font-semibold text-white">
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
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Users className="w-5 h-5 text-emerald-400 mr-2" />
              All Members
              <div className="ml-3 px-3 py-1 bg-white/10 rounded-full">
                <span className="text-white/70 text-sm font-medium">{members.length}</span>
              </div>
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[...members].sort((a, b) => {
                const roleOrder = { creator: 0, admin: 1, member: 2 }
                const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3
                const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3
                return aOrder - bOrder
              }).map((member, index) => (
                <motion.div
                  key={member.id}
                  className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
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
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default GroupInfoTab