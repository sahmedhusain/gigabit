'use client'
import { X, Calendar, Clock, MapPin, CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus } from '@/hooks'
import { api } from '@/lib/api'
import { CreateGroupEventProps } from '@/types/groups'

export default function CreateGroupEvent({
  show,
  onClose,
  groupId,
  groupTitle,
  onEventCreated
}: CreateGroupEventProps) {
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { success, error: showError } = useToast()
  const { isConnected } = useConnectionStatus()

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

    if (!isConnected) {
      showError('Cannot create event while offline')
      return
    }

    
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
      await api.createEvent(groupId, eventData)

      success('Event created!')

      // Reset form
      setEventTitle('')
      setEventDescription('')
      setEventDate('')
      setEventTime('')
      setEventLocation('')
      setError('')

      onEventCreated?.()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create event. Please try again.'
      showError(`Failed to create event: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && eventTitle.trim() && eventDate && eventTime) {
      e.preventDefault()
      handleCreateEvent()
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
                      <CalendarPlus className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <div>
                    <motion.h3
                      className="text-xl lg:text-2xl font-bold text-white mb-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Create Event in {groupTitle}
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Build memories with your community
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

                {/* Event Title */}
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
                    <span>Event Title *</span>
                  </motion.label>
                  <div className="relative">
                    <motion.input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Enter a catchy event name..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 hover:bg-white/15 text-sm lg:text-base"
                      maxLength={100}
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
                      {eventTitle.length}/100
                    </motion.div>
                  </div>
                </motion.div>

                {/* Event Description */}
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
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span>Description</span>
                  </motion.label>
                  <div className="relative">
                    <motion.textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Describe what your event is about, its purpose, and what attendees can expect..."
                      className="w-full h-32 lg:h-36 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      maxLength={500}
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
                      {eventDescription.length}/500
                    </motion.div>
                  </div>
                </motion.div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span>Date *</span>
                    </motion.label>
                    <div className="relative">
                      <motion.input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-gradient-to-r from-white/15 via-white/10 to-white/5 backdrop-blur-sm border border-white/30 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 transition-all duration-300 text-sm lg:text-base hover:bg-gradient-to-r hover:from-white/20 hover:via-white/15 hover:to-white/10 shadow-lg hover:shadow-emerald-500/10"
                        title="Select event date"
                        aria-label="Event date"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.3 }}
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
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
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      <span>Time *</span>
                    </motion.label>
                    <div className="relative">
                      <motion.input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full bg-gradient-to-r from-white/15 via-white/10 to-white/5 backdrop-blur-sm border border-white/30 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:border-teal-400/60 transition-all duration-300 text-sm lg:text-base hover:bg-gradient-to-r hover:from-white/20 hover:via-white/15 hover:to-white/10 shadow-lg hover:shadow-teal-500/10"
                        title="Select event time"
                        aria-label="Event time"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.3 }}
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Event Location */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span>Location (Optional)</span>
                  </motion.label>
                  <div className="relative">
                    <motion.input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., Conference Room 4, Online via Zoom"
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 hover:bg-white/15 text-sm lg:text-base"
                      maxLength={200}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9, duration: 0.3 }}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>
                  <motion.div
                    className="text-xs text-white/50 px-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.3 }}
                  >
                    {eventLocation.length}/200
                  </motion.div>
                </motion.div>

                {/* Connection Status */}
                <AnimatePresence>
                  {!isConnected && (
                    <motion.div
                      className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-red-300 text-sm font-medium">You are currently offline. Event will be created when connection is restored.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCreateEvent}
                  disabled={isLoading || !isConnected || !eventTitle.trim() || !eventDate || !eventTime}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 ${
                    isLoading || !isConnected || !eventTitle.trim() || !eventDate || !eventTime
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  }`}
                  whileHover={{ scale: (isLoading || !isConnected || !eventTitle.trim() || !eventDate || !eventTime) ? 1 : 1.05 }}
                  whileTap={{ scale: (isLoading || !isConnected || !eventTitle.trim() || !eventDate || !eventTime) ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Scheduling...</span>
                    </div>
                  ) : !isConnected ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      />
                      <span>Offline</span>
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
