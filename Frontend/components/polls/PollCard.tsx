'use client'
import React, { useState } from 'react'
import { Users, Clock, CheckCircle, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PollResponse } from '@/lib/api'

interface PollCardProps {
  poll: PollResponse
  onVote: (pollId: number, optionIds: number[]) => Promise<void>
  onUnvote: (pollId: number) => Promise<void>
}

export default function PollCard({ poll, onVote, onUnvote }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(poll.user_votes || [])
  const [isVoting, setIsVoting] = useState(false)

  const handleOptionClick = async (optionId: number) => {
    if (poll.is_expired || isVoting) return

    const newSelection = poll.allow_multiple_choices
      ? selectedOptions.includes(optionId)
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId]
      : [optionId]

    setSelectedOptions(newSelection)

    // Vote immediately
    if (newSelection.length > 0) {
      setIsVoting(true)
      try {
        await onVote(poll.id, newSelection)
      } catch (error) {
        console.error('Failed to vote:', error)
        // Revert selection on error
        setSelectedOptions(poll.user_votes || [])
      } finally {
        setIsVoting(false)
      }
    } else {
      // If no options selected, unvote
      setIsVoting(true)
      try {
        await onUnvote(poll.id)
      } catch (error) {
        console.error('Failed to unvote:', error)
        setSelectedOptions(poll.user_votes || [])
      } finally {
        setIsVoting(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = poll.is_expired || (poll.expires_at && new Date(poll.expires_at) < new Date())
  const canVote = !isExpired && !isVoting

  return (
    <motion.div
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:from-white/15 hover:to-white/10 transition-all duration-300 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Poll Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg lg:text-xl font-bold text-white flex-1">{poll.title}</h3>
          {isExpired && (
            <span className="ml-3 px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-red-300 text-xs font-semibold">
              Expired
            </span>
          )}
        </div>
        {poll.description && (
          <p className="text-white/70 text-sm lg:text-base mb-4 leading-relaxed">{poll.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
          <div className="flex items-center space-x-2">
            {poll.creator.avatar ? (
              <img
                src={poll.creator.avatar}
                alt={`${poll.creator.first_name} ${poll.creator.last_name}`}
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {poll.creator.first_name[0]}{poll.creator.last_name[0]}
                </span>
              </div>
            )}
            <span className="font-medium text-white/80">
              {poll.creator.first_name} {poll.creator.last_name}
            </span>
          </div>
          <span>•</span>
          <span>{formatDate(poll.created_at)}</span>
          {poll.expires_at && !isExpired && (
            <>
              <span>•</span>
              <div className="flex items-center space-x-1 text-cyan-300">
                <Clock className="w-3 h-3" />
                <span>Expires {formatDate(poll.expires_at)}</span>
              </div>
            </>
          )}
          {poll.allow_multiple_choices && (
            <>
              <span>•</span>
              <div className="flex items-center space-x-1 text-purple-300">
                <CheckCircle className="w-3 h-3" />
                <span>Multiple choice</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-3 mb-5">
        <AnimatePresence>
          {poll.options.map((option) => {
            const percentage = option.percentage || 0
            const isSelected = selectedOptions.includes(option.id)
            const isUserVote = poll.user_votes?.includes(option.id)

            return (
              <motion.div
                key={option.id}
                className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  canVote
                    ? 'hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10'
                    : ''
                } ${
                  isSelected || isUserVote
                    ? 'bg-purple-500/20 border-purple-400/50 shadow-md shadow-purple-500/20'
                    : 'bg-white/5 border-white/20'
                }`}
                onClick={() => canVote && handleOptionClick(option.id)}
                whileHover={canVote ? { scale: 1.02, x: 4 } : {}}
                whileTap={canVote ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Vote percentage background */}
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-500 ${
                    isSelected || isUserVote ? 'bg-purple-500/30' : 'bg-white/10'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Checkbox/Radio indicator */}
                    <div className={`w-5 h-5 rounded-${poll.allow_multiple_choices ? 'lg' : 'full'} border-2 flex-shrink-0 transition-all duration-300 flex items-center justify-center ${
                      isSelected || isUserVote
                        ? 'border-purple-300 bg-purple-400 shadow-lg shadow-purple-400/30'
                        : 'border-white/40'
                    }`}>
                      {(isSelected || isUserVote) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </div>
                    <span className="text-white font-medium text-sm lg:text-base flex-1">
                      {option.option_text}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="w-4 h-4 text-white/60" />
                      <span className="text-white/90 font-semibold text-sm">
                        {option.vote_count}
                      </span>
                    </div>
                    <span className="text-white/70 text-sm font-medium min-w-[45px] text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Voters list (if available) */}
                {option.voters && option.voters.length > 0 && (
                  <div className="relative mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center space-x-2 text-xs text-white/60">
                      <Users className="w-3 h-3" />
                      <span className="truncate">
                        {option.voters.slice(0, 3).join(', ')}
                        {option.voters.length > 3 && ` +${option.voters.length - 3} more`}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Poll Stats */}
      <div className="flex items-center justify-between text-sm pt-4 border-t border-white/10">
        <div className="flex items-center space-x-2 text-white/70">
          <Users className="w-4 h-4" />
          <span className="font-medium">
            {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
        {poll.user_voted && (
          <motion.div
            className="flex items-center space-x-1 text-purple-300 font-semibold"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <CheckCircle className="w-4 h-4" />
            <span>You voted</span>
          </motion.div>
        )}
      </div>

      {/* Voting indicator */}
      {isVoting && (
        <motion.div
          className="mt-3 flex items-center justify-center space-x-2 text-purple-300 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin"></div>
          <span>Updating vote...</span>
        </motion.div>
      )}
    </motion.div>
  )
}
