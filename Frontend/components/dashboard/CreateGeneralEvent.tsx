'use client'
import { X, Calendar, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
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

  // For now, show all groups the user is a member of
  // The backend will handle permissions for creating events
  const eligibleGroups = groups

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
      
    } catch (err: any) {
      showError(err.message || 'Failed to create event')
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
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">Create New Event</h3>
                <p className="text-white/60 text-sm">Bring your community together</p>
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
            {/* Group Selection - Enhanced */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Select Group</span>
                <span className="text-red-400">*</span>
              </label>
              {groupsLoading ? (
                <div className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white/50 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-white/20 rounded-full animate-spin"></div>
                    <span>Loading groups...</span>
                  </div>
                </div>
              ) : eligibleGroups.length === 0 ? (
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-2xl p-4">
                  <p className="text-yellow-300 text-sm font-medium">
                    You need to be a member of at least one group to create events.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  title="Select a group for this event"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                >
                  <option value="" className="bg-gray-800 text-gray-200">
                    Choose a group...
                  </option>
                  {eligibleGroups.map((group) => (
                    <option key={group.id} value={group.id} className="bg-gray-800 text-gray-200">
                      {group.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Event Title - Enhanced */}
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
                  onKeyPress={handleKeyPress}
                  placeholder="Enter an exciting event title..."
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                  maxLength={100}
                  disabled={eligibleGroups.length === 0}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xs text-white/50 text-right">
                {eventTitle.length}/100
              </div>
            </div>

            {/* Event Description - Enhanced */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span>Description</span>
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Tell people what this event is about, what's the agenda, what to expect..."
                className="w-full h-28 lg:h-32 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                maxLength={500}
                disabled={eligibleGroups.length === 0}
              />
              <div className="text-xs text-white/50 text-right">
                {eventDescription.length}/500
              </div>
            </div>

            {/* Event Location - Enhanced */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Location</span>
              </label>
              <textarea
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Where will the event take place? Include address, virtual meeting link, or venue details..."
                className="w-full h-24 lg:h-28 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                maxLength={200}
                disabled={eligibleGroups.length === 0}
              />
              <div className="text-xs text-white/50 text-right">
                {eventLocation.length}/200
              </div>
            </div>

            {/* Date and Time - Enhanced Grid */}
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
                    min={minDate}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 text-sm lg:text-base hover:bg-white/15"
                    title="Select event date"
                    disabled={eligibleGroups.length === 0}
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
                    disabled={eligibleGroups.length === 0}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display - Enhanced */}
            {error && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pt-4">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium hover:scale-105"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateEvent}
              disabled={isLoading || !eventTitle.trim() || !eventDate || !eventTime || !selectedGroupId || eligibleGroups.length === 0}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg ${
                isLoading || !eventTitle.trim() || !eventDate || !eventTime || !selectedGroupId || eligibleGroups.length === 0
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
