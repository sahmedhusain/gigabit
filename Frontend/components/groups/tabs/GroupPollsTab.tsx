'use client'
import React, { useState, useEffect } from 'react'
import { Plus, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
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
  const { user } = useAuth()

  useEffect(() => {
    if (groupId) {
      fetchPolls()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

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

  const handleCreatePoll = async (pollData: {
    title: string
    description: string
    options: string[]
    allowMultipleChoices: boolean
    expiresAt?: string
  }) => {
    try {
      let expiresAtISO: string | undefined
      if (pollData.expiresAt) {
        expiresAtISO = new Date(pollData.expiresAt).toISOString()
      }

      const newPoll = await api.createPoll({
        group_id: groupId,
        title: pollData.title,
        description: pollData.description,
        options: pollData.options,
        allow_multiple_choices: pollData.allowMultipleChoices,
        expires_at: expiresAtISO
      })

      setPolls([newPoll, ...polls])
    } catch (error) {
      console.error('Failed to create poll:', error)
      throw error
    }
  }

  const handleVote = async (pollId: number, optionIds: number[]) => {
    try {
      const updatedPoll = await api.votePoll(pollId, optionIds)
      setPolls(polls.map(poll => poll.id === pollId ? updatedPoll : poll))
    } catch (error) {
      console.error('Failed to vote:', error)
      throw error
    }
  }

  const handleUnvote = async (pollId: number) => {
    try {
      const updatedPoll = await api.unvotePoll(pollId)
      setPolls(polls.map(poll => poll.id === pollId ? updatedPoll : poll))
    } catch (error) {
      console.error('Failed to unvote:', error)
      throw error
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Group Polls</h2>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Poll</span>
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
            />
          </div>
        ) : polls.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto">
              <BarChart3 className="w-16 h-16 text-white/40 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white/80 mb-3">No polls yet</h3>
              <p className="text-white/60 text-base leading-relaxed mb-6">
                Create the first poll to start gathering opinions from group members.
              </p>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
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
