'use client'
import React, { useState } from 'react'
import { Users, Clock, CheckCircle, BarChart3, Trash2, StopCircle, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PollResponse } from '@/lib/api'
import { getUserInitials } from '@/utils/avatarUtils'
import { useToast } from '@/context/ToastContext'
import Image from 'next/image'

interface PollCardProps {
  poll: PollResponse
  onVote: (pollId: number, optionIds: number[]) => Promise<void>
  onUnvote: (pollId: number) => Promise<void>
  onDelete?: (pollId: number) => Promise<void>
  onExpire?: (pollId: number) => Promise<void>
  canManage?: boolean // Whether current user can delete/expire this poll
}

export default function PollCard({ poll, onVote, onUnvote, onDelete, onExpire, canManage = false }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(poll.user_votes || [])
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpiring, setIsExpiring] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExpireConfirm, setShowExpireConfirm] = useState(false)

  const { error: showErrorToast } = useToast()

  // Update selectedOptions when poll changes
  React.useEffect(() => {
    setSelectedOptions(poll.user_votes || [])
  }, [poll.user_votes])

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return

    setIsDeleting(true)
    try {
      await onDelete(poll.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete poll'
      showErrorToast(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExpire = async () => {
    if (!onExpire || isExpiring) return

    setIsExpiring(true)
    try {
      await onExpire(poll.id)
      setShowExpireConfirm(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to expire poll'
      showErrorToast(errorMessage)
    } finally {
      setIsExpiring(false)
    }
  }

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
        const errorMessage = error instanceof Error ? error.message : 'Failed to vote'
        showErrorToast(errorMessage)
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
        const errorMessage = error instanceof Error ? error.message : 'Failed to unvote'
        showErrorToast(errorMessage)
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
      className="group relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      {/* Poll Header */}
      <div className="relative mb-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg lg:text-xl font-bold text-white flex-1">{poll.title}</h3>
          <div className="flex items-center space-x-2 ml-3">
            {isExpired && (
              <span className="px-3 py-1 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 rounded-full text-red-300 text-xs font-semibold shadow-lg shadow-red-500/10">
                Expired
              </span>
            )}
            {canManage && (
              <div className="flex items-center space-x-1">
                {!isExpired && (
                  <button
                    onClick={() => setShowExpireConfirm(true)}
                    disabled={isExpiring}
                    className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Expire poll"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete poll"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        {poll.description && (
          <p className="text-white/70 text-sm lg:text-base mb-4 leading-relaxed">{poll.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
          <div className="flex items-center space-x-2">
            {poll.creator.avatar ? (
              <Image
                src={poll.creator.avatar}
                alt={`${poll.creator.first_name} ${poll.creator.last_name}`}
                  width={32}
                  height={32}
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {getUserInitials(poll.creator)}
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
              <div className="flex items-center space-x-1 text-cyan-300 bg-cyan-500/10 rounded-full px-2 py-1 border border-cyan-400/20">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-medium">Expires {formatDate(poll.expires_at)}</span>
              </div>
            </>
          )}
          {poll.allow_multiple_choices && (
            <>
              <span>•</span>
              <div className="flex items-center space-x-1 text-emerald-300 bg-emerald-500/10 rounded-full px-2 py-1 border border-emerald-400/20">
                <CheckCircle className="w-3 h-3" />
                <span className="text-xs font-medium">Multiple choice</span>
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
                className={`relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  canVote
                    ? 'hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10'
                    : ''
                } ${
                  isSelected || isUserVote
                    ? 'bg-emerald-500/20 border-emerald-400/50 shadow-md shadow-emerald-500/20'
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
                  className={`absolute inset-y-0 left-0 rounded-2xl transition-all duration-500 ${
                    isSelected || isUserVote ? 'bg-gradient-to-r from-emerald-500/40 to-teal-500/40' : 'bg-gradient-to-r from-white/15 to-white/10'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Checkbox/Radio indicator - only show if poll is not expired */}
                    {!isExpired && (
                      <div className={`w-5 h-5 rounded-${poll.allow_multiple_choices ? 'lg' : 'full'} border-2 flex-shrink-0 transition-all duration-300 flex items-center justify-center shadow-lg ${
                        isSelected || isUserVote
                          ? 'border-emerald-300 bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-400/30'
                          : 'border-white/40 hover:border-white/60'
                      }`}>
                        {(isSelected || isUserVote) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-white rounded-full shadow-sm"
                          />
                        )}
                      </div>
                    )}
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
                        {option.total_voters > 3 && ` +${option.total_voters - 3} more`}
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
      <div className="relative flex items-center justify-between text-sm pt-4 border-t border-white/10">
        <div className="flex items-center space-x-2 text-white/70 bg-white/5 rounded-2xl px-3 py-2 border border-white/10">
          <Users className="w-4 h-4" />
          <span className="font-medium">
            {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
        {poll.user_voted && (
          <motion.div
            className="flex items-center space-x-1 text-emerald-300 font-semibold bg-emerald-500/10 rounded-2xl px-3 py-2 border border-emerald-400/20"
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
          className="relative mt-3 flex items-center justify-center space-x-2 text-emerald-300 text-sm bg-emerald-500/10 rounded-2xl px-4 py-2 border border-emerald-400/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-4 h-4 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin"></div>
          <span>Updating vote...</span>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Poll</h3>
                  <p className="text-white/70 text-sm">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-white/80 mb-6">
                Are you sure you want to delete this poll? All votes and responses will be permanently removed.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all duration-200 border border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                >
                  {isDeleting && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expire Confirmation Dialog */}
      <AnimatePresence>
        {showExpireConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <StopCircle className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Expire Poll</h3>
                  <p className="text-white/70 text-sm">End voting immediately.</p>
                </div>
              </div>
              <p className="text-white/80 mb-6">
                Are you sure you want to expire this poll? No more votes will be accepted, but existing votes will remain visible.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowExpireConfirm(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all duration-200 border border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExpire}
                  disabled={isExpiring}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                >
                  {isExpiring && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                  <span>{isExpiring ? 'Expiring...' : 'Expire'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
