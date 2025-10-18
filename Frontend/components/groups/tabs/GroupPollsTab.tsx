'use client'
import React, { useState, useEffect } from 'react'
import { Plus, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useWebSocket } from '@/context/WebSocketContext'
import { useAuth } from '@/context/AuthContext'
import { api, PollResponse } from '@/lib/api'
import CreatePollModal from '@/components/polls/CreatePollModal'
import PollCard from '@/components/polls/PollCard'

interface GroupPollsTabProps {
  groupId?: number
}

const GroupPollsTab: React.FC<GroupPollsTabProps> = ({ groupId }) => {
  const [polls, setPolls] = useState<PollResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userRole, setUserRole] = useState<{ role: string; is_admin_or_creator: boolean } | null>(null)
  const { user } = useAuth()
  const { addMessageListener } = useWebSocket()

  useEffect(() => {
    if (groupId) {
      fetchPolls()
      fetchUserRole()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  // WebSocket listener for real-time poll updates
  useEffect(() => {
    const cleanup = addMessageListener((message) => {
      if ((message.type === 'poll_update' || message.type === 'poll_vote_update') && message.GroupID === groupId) {
        console.log('Received poll update via WebSocket:', message)
        // Refresh polls to show the latest data
        fetchPolls()
      }
    })

    return cleanup
  }, [groupId, addMessageListener])

  const fetchPolls = async () => {
    if (!groupId)return
    setIsLoading(true)
    try {
      const pollsData = await api.getGroupPolls(groupId)
      setPolls(pollsData)
    } catch (error) {
      console.error('Failed to fetch polls:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserRole = async () => {
    if (!groupId) return
    try {
      const roleData = await api.getUserRole(groupId)
      setUserRole(roleData)
    } catch (error) {
      console.error('Failed to fetch user role:', error)
    }
  }

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

      // Refetch polls to ensure data is fresh
      await fetchPolls()
    } catch (error) {
      console.error('Failed to create poll:', error)
      throw error
    }
  }

  const handleVote = async (pollId: number, optionIds: number[]) => {
    try {
      await api.votePoll(pollId, optionIds)
      // Refetch polls to ensure data is fresh
      await fetchPolls()
    } catch (error) {
      console.error('Failed to vote:', error)
      throw error
    }
  }

  const handleUnvote = async (pollId: number) => {
    try {
      await api.unvotePoll(pollId)
      // Refetch polls to ensure data is fresh
      await fetchPolls()
    } catch (error) {
      console.error('Failed to unvote:', error)
      throw error
    }
  }

  const handleDeletePoll = async (pollId: number) => {
    try {
      await api.deletePoll(pollId)
      // Refetch polls to ensure data is fresh
      await fetchPolls()
    } catch (error) {
      console.error('Failed to delete poll:', error)
      throw error
    }
  }

  const handleExpirePoll = async (pollId: number) => {
    try {
      await api.expirePoll(pollId)
      // Refetch polls to ensure data is fresh
      await fetchPolls()
    } catch (error) {
      console.error('Failed to expire poll:', error)
      throw error
    }
  }

  const canManagePoll = (poll: PollResponse) => {
    if (!user) return false
    // User can manage if they are the creator
    if (poll.user_id === user.id) return true
    // User can manage if they are a group admin or creator
    if (userRole?.is_admin_or_creator) return true
    return false
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Group Polls</h2>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Poll</span>
          </motion.button>
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
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create First Poll
              </motion.button>
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
