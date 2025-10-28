'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Plus, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useWebSocket } from '@/context/WebSocketContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { PollResponse } from '@/types/polls'
import CreatePollModal from '@/components/polls/CreatePollModal'
import PollCard from '@/components/polls/PollCard'
import { GroupPollsTabProps } from '@/types/groups'

const GroupPollsTab: React.FC<GroupPollsTabProps> = ({ groupId, highlightPollId }) => {
  const [polls, setPolls] = useState<PollResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userRole, setUserRole] = useState<{ role: string; is_admin_or_creator: boolean } | null>(null)
  const [groupPermissions, setGroupPermissions] = useState<{ create_polls: 'all_members' | 'admins_only' } | null>(null)
  const { user } = useAuth()
  const { addMessageListener } = useWebSocket()

  const fetchPolls = useCallback(async () => {
    if (!groupId)return
    setIsLoading(true)
    try {
      const pollsData = await api.getGroupPolls(groupId)
      setPolls(pollsData)
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('Failed to fetch polls, endpoint may not be implemented:', err.message)
      
      setPolls([])
    } finally {
      setIsLoading(false)
    }
  }, [groupId])

  const fetchUserRole = useCallback(async () => {
    if (!groupId) return
    try {
      const roleData = await api.getUserRole(groupId)
      setUserRole(roleData)
      
      
      const groupData = await api.getGroup(groupId)
      setGroupPermissions({
        create_polls: groupData.create_polls
      })
    } catch (error) {
      console.error('Failed to fetch user role:', error)
    }
  }, [groupId])

  useEffect(() => {
    if (groupId) {
      fetchPolls()
      fetchUserRole()
    }
  }, [groupId, fetchPolls, fetchUserRole])

  // Highlight poll when highlightPollId is provided
  useEffect(() => {
    if (highlightPollId && polls.length > 0) {
      const pollElement = document.querySelector(`[data-poll-id="${highlightPollId}"]`) as HTMLElement
      if (pollElement) {
        // Scroll to the poll
        pollElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Add highlight effect
        pollElement.classList.add('ring-2', 'ring-emerald-400', 'ring-offset-2', 'ring-offset-transparent')
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          pollElement.classList.remove('ring-2', 'ring-emerald-400', 'ring-offset-2', 'ring-offset-transparent')
        }, 3000)
      }
    }
  }, [highlightPollId, polls])

  
  useEffect(() => {
    const cleanup = addMessageListener((message) => {
      if ((message.type === 'poll_update' || message.type === 'poll_vote_update') && message.GroupID === groupId) {
        
        fetchPolls()
      }
    })

    return cleanup
  }, [groupId, addMessageListener, fetchPolls])

  const handleCreatePoll = async (pollData: {
    title: string
    description: string
    options: string[]
    allowMultipleChoices: boolean
    expiresAt?: string
  }) => {
    try {
      await api.createPoll({
        group_id: groupId,
        title: pollData.title,
        description: pollData.description,
        options: pollData.options,
        allow_multiple_choices: pollData.allowMultipleChoices,
        expires_at: pollData.expiresAt ? new Date(pollData.expiresAt).toISOString() : undefined
      })

      
      await fetchPolls()
    } catch (error) {
      console.error('Failed to create poll:', error)
      throw error
    }
  }

  const handleVote = async (pollId: number, optionIds: number[]) => {
    try {
      await api.votePoll(pollId, optionIds)
      
      await fetchPolls()
    } catch (error) {
      console.error('Failed to vote:', error)
      throw error
    }
  }

  const handleUnvote = async (pollId: number) => {
    try {
      await api.unvotePoll(pollId)
      
      await fetchPolls()
    } catch (error) {
      console.error('Failed to unvote:', error)
      throw error
    }
  }

  const handleDeletePoll = async (pollId: number) => {
    try {
      await api.deletePoll(pollId)
      
      await fetchPolls()
    } catch (error) {
      console.error('Failed to delete poll:', error)
      throw error
    }
  }

  const handleExpirePoll = async (pollId: number) => {
    try {
      await api.expirePoll(pollId)
      
      await fetchPolls()
    } catch (error) {
      console.error('Failed to expire poll:', error)
      throw error
    }
  }

  const canManagePoll = (poll: PollResponse) => {
    if (!user) return false
    
    if (poll.user_id === user.id) return true
    
    if (userRole?.is_admin_or_creator) return true
    return false
  }

  
  const hasVotedInAllPolls = polls && polls.length > 0 && polls.every(poll => poll.user_votes && poll.user_votes.length > 0)

  const canCreatePolls = () => {
    if (!groupPermissions) return false
    return userRole?.is_admin_or_creator || groupPermissions.create_polls === 'all_members'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6 mt-2 hover:shadow-emerald-500/10 transition-all duration-500 mx-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                <BarChart3 className="w-4 h-4 text-white drop-shadow-sm" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white mb-0.5">Group Polls</h2>
              <p className="text-white/70 text-xs lg:text-sm">Create polls and gather opinions from group members</p>
            </div>
          </div>
          {canCreatePolls() ? (
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-medium transition-all duration-300 shadow-md hover:shadow-lg self-start sm:self-center text-sm"
              whileHover={{ scale: 1.02, y: -0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Poll</span>
            </motion.button>
          ) : (
            <div className="text-white/60 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 self-start sm:self-center">
              Only admins and creators can create polls
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-scroll scrollbar-hide p-6 space-y-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
            />
          </div>
        ) : !polls || polls.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto">
              <BarChart3 className="w-16 h-16 text-white/40 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white/80 mb-3">No polls yet</h3>
              <p className="text-white/60 text-base leading-relaxed mb-6">
                Create the first poll to start gathering opinions from group members.
              </p>
              {canCreatePolls() ? (
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create First Poll
                </motion.button>
              ) : (
                <div className="text-white/60 text-sm bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                  Only admins and creators can create polls
                </div>
              )}
            </div>
          </div>
        ) : (
          polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              onUnvote={handleUnvote}
              onDelete={handleDeletePoll}
              onExpire={handleExpirePoll}
              canManage={canManagePoll(poll)}
              hideCounts={hasVotedInAllPolls}
            />
          ))
        )}
      </div>

      <CreatePollModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePoll={handleCreatePoll}
        groupId={groupId}
      />
    </div>
  )
}

export default GroupPollsTab
