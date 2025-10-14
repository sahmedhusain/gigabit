'use client'
import React, { useState, useEffect } from 'react'
import { Plus, BarChart3, Users, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'

interface PollOption {
  id: number
  text: string
  votes: number
  voters: string[] // Array of usernames who voted for this option
}

interface Poll {
  id: number
  title: string
  description?: string
  options: PollOption[]
  creator: {
    id: number
    first_name: string
    last_name: string
  }
  created_at: string
  expires_at?: string
  total_votes: number
  user_voted: boolean
  user_vote_option?: number
}

interface GroupPollsTabProps {
  groupId?: number
}

const GroupPollsTab: React.FC<GroupPollsTabProps> = ({ groupId }) => {
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    options: ['', '']
  })
  const [isCreating, setIsCreating] = useState(false)
  const { user } = useAuth()

  // Mock data for demonstration since backend doesn't support polls yet
  useEffect(() => {
    if (groupId) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        setPolls([
          {
            id: 1,
            title: 'What should our next group event be?',
            description: 'Help us decide on our next community gathering',
            options: [
              { id: 1, text: 'Networking Mixer', votes: 12, voters: ['john_doe', 'jane_smith'] },
              { id: 2, text: 'Workshop Series', votes: 8, voters: ['mike_johnson'] },
              { id: 3, text: 'Social Meetup', votes: 15, voters: ['sarah_lee', 'tom_wilson'] }
            ],
            creator: { id: 1, first_name: 'John', last_name: 'Doe' },
            created_at: '2024-01-15T10:00:00Z',
            expires_at: '2024-02-15T10:00:00Z',
            total_votes: 35,
            user_voted: false,
            user_vote_option: undefined
          },
          {
            id: 2,
            title: 'Best time for weekly meetings?',
            options: [
              { id: 1, text: 'Monday 6 PM', votes: 5, voters: ['alice_brown'] },
              { id: 2, text: 'Wednesday 7 PM', votes: 18, voters: ['bob_garcia', 'emma_davis'] },
              { id: 3, text: 'Friday 5 PM', votes: 7, voters: ['charlie_moore'] }
            ],
            creator: { id: 2, first_name: 'Sarah', last_name: 'Wilson' },
            created_at: '2024-01-10T14:30:00Z',
            total_votes: 30,
            user_voted: true,
            user_vote_option: 2
          }
        ])
        setIsLoading(false)
      }, 1000)
    }
  }, [groupId])

  const handleCreatePoll = async () => {
    if (!newPoll.title.trim() || newPoll.options.filter(opt => opt.trim()).length < 2 || isCreating) return

    try {
      setIsCreating(true)
      // TODO: Implement actual API call when backend supports polls
      console.log('Creating poll:', newPoll)
      
      // Mock successful creation
      const mockPoll: Poll = {
        id: Date.now(),
        title: newPoll.title,
        description: newPoll.description,
        options: newPoll.options.filter(opt => opt.trim()).map((text, index) => ({
          id: index + 1,
          text: text.trim(),
          votes: 0,
          voters: []
        })),
        creator: { 
          id: user?.id || 0, 
          first_name: user?.first_name || 'You', 
          last_name: user?.last_name || '' 
        },
        created_at: new Date().toISOString(),
        total_votes: 0,
        user_voted: false
      }

      setPolls([mockPoll, ...polls])
      setNewPoll({ title: '', description: '', options: ['', ''] })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create poll:', error)
      alert('Failed to create poll. This feature is not yet implemented in the backend.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleVote = (pollId: number, optionId: number) => {
    // TODO: Implement actual voting API call
    console.log('Voting on poll:', pollId, 'option:', optionId)
    
    // Mock voting
    setPolls(polls.map(poll => {
      if (poll.id === pollId && !poll.user_voted) {
        return {
          ...poll,
          user_voted: true,
          user_vote_option: optionId,
          total_votes: poll.total_votes + 1,
          options: poll.options.map(option => 
            option.id === optionId 
              ? { ...option, votes: option.votes + 1, voters: [...option.voters, `${user?.first_name} ${user?.last_name}` || 'You'] }
              : option
          )
        }
      }
      return poll
    }))
  }

  const addPollOption = () => {
    if (newPoll.options.length < 5) {
      setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })
    }
  }

  const updatePollOption = (index: number, value: string) => {
    const updatedOptions = [...newPoll.options]
    updatedOptions[index] = value
    setNewPoll({ ...newPoll, options: updatedOptions })
  }

  const removePollOption = (index: number) => {
    if (newPoll.options.length > 2) {
      const updatedOptions = newPoll.options.filter((_, i) => i !== index)
      setNewPoll({ ...newPoll, options: updatedOptions })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Create Poll Button */}
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

      {/* Polls Content */}
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
            <motion.div
              key={poll.id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Poll Header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-2">{poll.title}</h3>
                {poll.description && (
                  <p className="text-white/70 text-sm mb-3">{poll.description}</p>
                )}
                <div className="flex items-center space-x-4 text-xs text-white/60">
                  <span>By {poll.creator.first_name} {poll.creator.last_name}</span>
                  <span>•</span>
                  <span>{formatDate(poll.created_at)}</span>
                  {poll.expires_at && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Expires {formatDate(poll.expires_at)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Poll Options */}
              <div className="space-y-3 mb-4">
                {poll.options.map((option) => {
                  const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0
                  const isUserVote = poll.user_vote_option === option.id
                  const canVote = !poll.user_voted

                  return (
                    <motion.div
                      key={option.id}
                      className={`relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        canVote 
                          ? 'hover:bg-white/10 border-white/30 hover:border-purple-400/50' 
                          : 'border-white/20'
                      } ${
                        isUserVote ? 'bg-purple-500/20 border-purple-400/50' : 'bg-white/5'
                      }`}
                      onClick={() => canVote && handleVote(poll.id, option.id)}
                      whileHover={canVote ? { scale: 1.02 } : {}}
                      whileTap={canVote ? { scale: 0.98 } : {}}
                    >
                      {/* Vote percentage background */}
                      <motion.div 
                        className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-500 ${
                          isUserVote ? 'bg-purple-500/30' : 'bg-white/10'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      
                      <div className="relative flex items-center justify-between">
                        <span className="text-white font-medium">{option.text}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white/80 font-semibold">{option.votes}</span>
                          <span className="text-white/60 text-sm">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Poll Stats */}
              <div className="flex items-center justify-between text-sm text-white/60 pt-3 border-t border-white/10">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{poll.total_votes} total votes</span>
                </div>
                {poll.user_voted && (
                  <span className="text-purple-300 font-medium">✓ You voted</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-6">Create New Poll</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="poll-title" className="block text-white/80 text-sm font-medium mb-2">Poll Title</label>
                  <input
                    id="poll-title"
                    type="text"
                    value={newPoll.title}
                    onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                    placeholder="What's your question?"
                  />
                </div>

                <div>
                  <label htmlFor="poll-description" className="block text-white/80 text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    id="poll-description"
                    value={newPoll.description}
                    onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/60 resize-none"
                    placeholder="Add more context (optional)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-3">Poll Options</label>
                  <div className="space-y-3">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
                          placeholder={`Option ${index + 1}`}
                        />
                        {newPoll.options.length > 2 && (
                          <button
                            onClick={() => removePollOption(index)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors duration-200"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {newPoll.options.length < 5 && (
                    <button
                      onClick={addPollOption}
                      className="mt-3 text-purple-300 hover:text-purple-200 text-sm font-medium transition-colors duration-200"
                    >
                      + Add another option
                    </button>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePoll}
                  disabled={!newPoll.title.trim() || newPoll.options.filter(opt => opt.trim()).length < 2 || isCreating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-200"
                >
                  {isCreating ? 'Creating...' : 'Create Poll'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupPollsTab