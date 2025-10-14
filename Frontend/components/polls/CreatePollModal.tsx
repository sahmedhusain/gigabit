'use client'
import React, { useState } from 'react'
import { X, Plus, Trash2, BarChart3, Calendar, CheckSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CreatePollModalProps {
  show: boolean
  onClose: () => void
  onCreatePoll: (pollData: {
    title: string
    description: string
    options: string[]
    allowMultipleChoices: boolean
    expiresAt?: string
  }) => Promise<void>
  groupId?: number
}

export default function CreatePollModal({
  show,
  onClose,
  onCreatePoll,
  groupId
}: CreatePollModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async () => {
    const validOptions = options.filter(opt => opt.trim() !== '')
    
    if (!title.trim()) {
      alert('Please enter a poll title')
      return
    }

    if (validOptions.length < 2) {
      alert('Please provide at least 2 options')
      return
    }

    setIsCreating(true)
    try {
      await onCreatePoll({
        title: title.trim(),
        description: description.trim(),
        options: validOptions,
        allowMultipleChoices,
        expiresAt: expiresAt || undefined
      })

      // Reset form
      setTitle('')
      setDescription('')
      setOptions(['', ''])
      setAllowMultipleChoices(false)
      setExpiresAt('')
      onClose()
    } catch (error) {
      console.error('Failed to create poll:', error)
      alert('Failed to create poll. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setTitle('')
      setDescription('')
      setOptions(['', ''])
      setAllowMultipleChoices(false)
      setExpiresAt('')
      onClose()
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl h-[85vh] flex flex-col">
        {/* Enhanced backdrop with multiple layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-blue-500/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>

        {/* Fixed Header */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">Create New Poll</h3>
                <p className="text-white/60 text-sm">Gather opinions from {groupId ? 'group members' : 'your followers'}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
              title="Close"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="relative flex-1 overflow-y-auto px-6 lg:px-8">
          <div className="space-y-6">
            {/* Poll Title */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Poll Question</span>
                <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your question?"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                  maxLength={200}
                  disabled={isCreating}
                />
                <div className="absolute bottom-3 right-4 text-xs text-white/50">
                  {title.length}/200
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                <span>Description (Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more context to your poll..."
                className="w-full h-20 lg:h-24 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                maxLength={500}
                disabled={isCreating}
              />
              <div className="text-xs text-white/50 text-right">
                {description.length}/500
              </div>
            </div>

            {/* Poll Options */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Poll Options</span>
                <span className="text-red-400">*</span>
                <span className="text-white/50 text-xs font-normal">(Min: 2, Max: 10)</span>
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white/70 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleUpdateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      maxLength={100}
                      disabled={isCreating}
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(index)}
                        disabled={isCreating}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 disabled:opacity-50"
                        title="Remove option"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {options.length < 10 && (
                <motion.button
                  onClick={handleAddOption}
                  disabled={isCreating}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white/80 hover:text-white transition-all duration-300 text-sm font-medium disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Option</span>
                </motion.button>
              )}
            </div>

            {/* Settings */}
            <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Poll Settings</span>
              </label>

              {/* Multiple Choices */}
              <label className="flex items-start space-x-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={allowMultipleChoices}
                    onChange={(e) => setAllowMultipleChoices(e.target.checked)}
                    disabled={isCreating}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                    allowMultipleChoices
                      ? 'border-purple-400 bg-purple-400 shadow-lg shadow-purple-400/25'
                      : 'border-white/40 group-hover:border-white/60'
                  }`}>
                    {allowMultipleChoices && (
                      <CheckSquare className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <CheckSquare className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-all duration-300 ${
                  allowMultipleChoices ? 'text-purple-400' : 'text-white/70 group-hover:text-white/90'
                }`} />
                <div className="flex-1">
                  <div className={`font-semibold text-sm lg:text-base transition-all duration-300 ${
                    allowMultipleChoices ? 'text-white' : 'text-white/90 group-hover:text-white'
                  }`}>
                    Allow Multiple Choices
                  </div>
                  <div className="text-white/60 text-xs lg:text-sm">
                    Voters can select more than one option
                  </div>
                </div>
              </label>

              {/* Expiration Date */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white/80 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>Expiration Date (Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  disabled={isCreating}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 text-sm transition-all duration-300 hover:bg-white/15"
                />
                <p className="text-white/50 text-xs">
                  Leave empty for polls that never expire
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pt-4">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-white/10">
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium hover:scale-105 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating || !title.trim() || options.filter(opt => opt.trim()).length < 2}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg ${
                isCreating || !title.trim() || options.filter(opt => opt.trim()).length < 2
                  ? 'bg-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 hover:from-purple-600 hover:via-indigo-700 hover:to-blue-700 shadow-purple-500/25'
              }`}
            >
              {isCreating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Poll...</span>
                </div>
              ) : (
                'Create Poll'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
