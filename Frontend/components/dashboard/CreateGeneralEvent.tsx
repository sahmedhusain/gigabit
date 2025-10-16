'use client'
import { X, Calendar, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useGroups } from '@/hooks/useGroups'
import { api } from '@/lib/api'

interface CreateGeneralEventProps {
  show: boolean
  onClose: () => void
  onEventCreated?: () => void
}

export default function CreateGeneralEvent({
  show,
  onClose,
  onEventCreated
}: CreateGeneralEventProps) {
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { success, error: showError } = useToast()
  const { groups, loading: groupsLoading } = useGroups()
  const { user } = useAuth()

  // Only show groups where user is admin or creator
  const eligibleGroups = groups.filter(group => {
    if (!user) return false
    // User is creator (no role field available on GroupResponse)
    return group.creator_id === user.id
  })

  useEffect(() => {
    if (show && eligibleGroups.length === 1) {
      // Auto-select if there's only one eligible group
      setSelectedGroupId(eligibleGroups[0].id.toString())
    }
  }, [show, eligibleGroups])

  const handleCreateEvent = async () => {
    // Validation
    if (!eventTitle.trim()) {
      setError('Event title is required')
      return
    }

    if (!eventDate) {
      setError('Event date is required')
      return
    }

    if (!eventTime) {
      setError('Event time is required')
      return
    }

    if (!selectedGroupId) {
      setError('Please select a group for this event')
      return
    }

    if (eventTitle.length > 100) {
      setError('Event title cannot exceed 100 characters')
      return
    }

    if (eventDescription.length > 500) {
      setError('Event description cannot exceed 500 characters')
      return
    }

    if (eventLocation.length > 200) {
      setError('Event location cannot exceed 200 characters')
      return
    }

    // Combine date and time
    const eventDateTime = new Date(`${eventDate}T${eventTime}`)
    
    if (eventDateTime <= new Date()) {
      setError('Event must be scheduled for a future date and time')
      return
    }

    const eventData = {
      title: eventTitle.trim(),
      description: eventDescription.trim(),
      location: eventLocation.trim() || undefined,
      event_time: eventDateTime.toISOString()
    }

    setError('')
    setIsLoading(true)
    
    try {
      await api.createEvent(parseInt(selectedGroupId), eventData)
      
      success('Event created successfully!')
      
      // Reset form
      setEventTitle('')
      setEventDescription('')
      setEventDate('')
      setEventTime('')
      setSelectedGroupId('')
      setError('')
      
      onEventCreated?.()
      onClose()
      
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      showError(msg || 'Failed to create event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreateEvent()
    }
  }

  if (!show) return null

  // Get tomorrow's date as minimum date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

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
            className="relative w-full max-w-2xl h-[80vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
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
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 text-white drop-shadow-sm" />
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
                      Create New Event
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Bring your community together
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
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
                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-red-300 text-sm font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Group Selection */}
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
                    <span>Select Group *</span>
                    {eligibleGroups.length === 0 && !groupsLoading && (
                      <span className="ml-2 text-xs text-yellow-400/80 font-normal">
                        (Admin/Creator only)
                      </span>
                    )}
                  </motion.label>
                  {groupsLoading ? (
                    <div className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white/50 animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-white/20 rounded-full animate-spin"></div>
                        <span>Loading groups...</span>
                      </div>
                    </div>
                  ) : eligibleGroups.length === 0 ? (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-4">
                      <p className="text-yellow-300 text-sm font-medium">
                        You need to be a member of at least one group to create events.
                      </p>
                    </div>
                  ) : (
                    <motion.select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      title="Select a group for this event"
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                      disabled={eligibleGroups.length === 0}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    >
                      <option value="" className="bg-gray-800 text-gray-200">
                        {eligibleGroups.length === 0 ? 'No groups available (admin/creator only)' : 'Choose a group...'}
                      </option>
                      {eligibleGroups.map((group) => (
                        <option key={group.id} value={group.id} className="bg-gray-800 text-gray-200">
                          {group.title} {group.creator_id === user?.id ? '(Creator)' : '(Admin)'}
                        </option>
                      ))}
                    </motion.select>
                  )}
                </motion.div>

                {/* Event Title */}
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
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>Event Title *</span>
                  </motion.label>
                  <div className="relative">
                    <motion.input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter an exciting event title..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                      maxLength={100}
                      disabled={eligibleGroups.length === 0}
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
                      {eventTitle.length}/100
                    </motion.div>
                  </div>
                </motion.div>

                {/* Event Description */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span>Description</span>
                  </motion.label>
                  <div className="relative">
                    <motion.textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Tell people what this event is about, what's the agenda, what to expect..."
                      className="w-full h-28 lg:h-32 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      maxLength={500}
                      disabled={eligibleGroups.length === 0}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute bottom-4 right-4 text-xs text-white/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.3 }}
                    >
                      {eventDescription.length}/500
                    </motion.div>
                  </div>
                </motion.div>

                {/* Event Location */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span>Location</span>
                  </motion.label>
                  <div className="relative">
                    <motion.textarea
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Where will the event take place? Include address, virtual meeting link, or venue details..."
                      className="w-full h-24 lg:h-28 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      maxLength={200}
                      disabled={eligibleGroups.length === 0}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute bottom-4 right-4 text-xs text-white/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9, duration: 0.3 }}
                    >
                      {eventLocation.length}/200
                    </motion.div>
                  </div>
                </motion.div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                  >
                    <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span>Date *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        min={minDate}
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-4 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                        title="Select event date"
                        disabled={eligibleGroups.length === 0}
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                  >
                    <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      <span>Time *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-4 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                        title="Select event time"
                        disabled={eligibleGroups.length === 0}
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                </div>
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
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  disabled={isLoading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCreateEvent}
                  disabled={isLoading || !eventTitle.trim() || !eventDate || !eventTime || !selectedGroupId || eligibleGroups.length === 0}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg ${
                    isLoading || !eventTitle.trim() || !eventDate || !eventTime || !selectedGroupId || eligibleGroups.length === 0
                      ? 'bg-white/20 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  }`}
                  whileHover={{ scale: (isLoading || !eventTitle.trim() || !eventDate || !eventTime || !selectedGroupId || eligibleGroups.length === 0) ? 1 : 1.05 }}
                  whileTap={{ scale: (isLoading || !eventTitle.trim() || !eventDate || !eventTime || !selectedGroupId || eligibleGroups.length === 0) ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  title={eligibleGroups.length === 0 ? 'You must be a group admin or creator to create events' : ''}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Creating Event...</span>
                    </div>
                  ) : (
                    'Create Event'
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