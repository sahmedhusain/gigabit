'use client'
import { X, Calendar, Clock, Users } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { useConnectionStatus } from '@/hooks'
import { api } from '@/lib/api'

interface CreateGroupEventProps {
  show: boolean
  onClose: () => void
  groupId: number
  groupTitle: string
  onEventCreated?: () => void
}

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
      await api.createEvent(groupId, eventData)
      
      success('Event created successfully!')
      
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

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl h-[90vh] flex flex-col">
        {/* Enhanced backdrop with multiple layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>

        {/* Fixed Header */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">Create Group Event</h3>
                <p className="text-white/60 text-sm">Organize an event for {groupTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
              title="Close"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="relative flex-1 overflow-y-auto px-6 lg:px-8">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Event Title */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Event Title</span>
                <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Enter an exciting event title..."
                  maxLength={100}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xs text-white/50 text-right">
                {eventTitle.length}/100
              </div>
            </div>

            {/* Event Description */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span>Description</span>
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Tell people what this event is about, what's the agenda, what to expect..."
                maxLength={500}
                className="w-full h-28 lg:h-32 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
              />
              <div className="text-xs text-white/50 text-right">
                {eventDescription.length}/500
              </div>
            </div>

            {/* Event Location */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Location</span>
              </label>
              <textarea
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Where will the event take place? Include address, virtual meeting link, or venue details..."
                maxLength={200}
                className="w-full h-24 lg:h-28 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
              />
              <div className="text-xs text-white/50 text-right">
                {eventLocation.length}/200
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Date</span>
                  <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                    title="Select event date"
                    aria-label="Event date"
                    placeholder="Select date"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                  <span>Time</span>
                  <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                    title="Select event time"
                    aria-label="Event time"
                    placeholder="Select time"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                <p className="text-red-300 text-sm font-medium">You are currently offline. Event will be created when connection is restored.</p>
              </div>
            )}

            {/* Group Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Event for {groupTitle}</p>
                  <p className="text-white/60 text-xs">All group members will be invited to this event</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pt-4">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateEvent}
              disabled={isLoading || !isConnected || !eventTitle.trim() || !eventDate || !eventTime}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg ${
                isLoading || !isConnected || !eventTitle.trim() || !eventDate || !eventTime
                  ? 'bg-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 shadow-emerald-500/25'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Event...</span>
                </div>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}