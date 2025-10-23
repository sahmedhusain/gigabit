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
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-full max-w-2xl h-[85vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <motion.div
              className="relative flex-shrink-0 p-6 lg:p-8 pb-4 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                    />
                  </motion.div>
                  <div>
                    <motion.h3
                      className="text-xl lg:text-2xl font-bold text-white mb-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Create New Poll
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Gather opinions from {groupId ? 'group members' : 'your followers'}
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClose}
                  disabled={isCreating}
                  className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 disabled:opacity-50"
                  title="Close"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                </motion.button>
              </div>
            </motion.div>

            {/* Scrollable Content Area */}
            <motion.div
              className="relative flex-1 overflow-y-auto px-6 lg:px-8 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Poll Title */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>Poll Question *</span>
                  </motion.label>
                  <div className="relative">
                    <motion.input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What's your question?"
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 hover:bg-white/15 text-sm lg:text-base"
                      maxLength={200}
                      disabled={isCreating}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute bottom-4 right-4 text-xs text-white/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      {title.length}/200
                    </motion.div>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                    <span>Description (Optional)</span>
                  </motion.label>
                  <div className="relative">
                    <motion.textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add more context to your poll..."
                      className="w-full h-20 lg:h-24 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      maxLength={500}
                      disabled={isCreating}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute bottom-4 right-4 text-xs text-white/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                    >
                      {description.length}/500
                    </motion.div>
                  </div>
                </motion.div>

                {/* Poll Options */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Poll Options *</span>
                    <span className="text-white/50 text-xs font-normal">(Min: 2, Max: 10)</span>
                  </label>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center space-x-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 + 0.6 }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white/70 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleUpdateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                          maxLength={100}
                          disabled={isCreating}
                        />
                        {options.length > 2 && (
                          <motion.button
                            onClick={() => handleRemoveOption(index)}
                            disabled={isCreating}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 disabled:opacity-50"
                            title="Remove option"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-5 h-5" />
                          </motion.button>
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
                </motion.div>

                {/* Settings */}
                <motion.div
                  className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-4 lg:p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
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
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                        allowMultipleChoices
                          ? 'border-emerald-400 bg-emerald-400 shadow-lg shadow-emerald-400/25'
                          : 'border-white/40 group-hover:border-white/60'
                      }`}>
                        {allowMultipleChoices && (
                          <CheckSquare className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
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
                    title="Set expiration date"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      disabled={isCreating}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 text-sm transition-all duration-300 hover:bg-white/15"
                    />
                    <p className="text-white/50 text-xs">
                      Leave empty for polls that never expire
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="relative flex-shrink-0 p-6 lg:p-8 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <motion.button
                  onClick={handleClose}
                  disabled={isCreating}
                  className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSubmit}
                  disabled={isCreating || !title.trim() || options.filter(opt => opt.trim()).length < 2}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg ${
                    isCreating || !title.trim() || options.filter(opt => opt.trim()).length < 2
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  }`}
                  whileHover={{ scale: (isCreating || !title.trim() || options.filter(opt => opt.trim()).length < 2) ? 1 : 1.05 }}
                  whileTap={{ scale: (isCreating || !title.trim() || options.filter(opt => opt.trim()).length < 2) ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Creating Poll...</span>
                    </div>
                  ) : (
                    'Create Poll'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}