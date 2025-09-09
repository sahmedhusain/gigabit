'use client'
import { X, Calendar, Clock, Users } from 'lucide-react'
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

    // Combine date and time
    const eventDateTime = new Date(`${eventDate}T${eventTime}`)
    
    if (eventDateTime <= new Date()) {
      setError('Event must be scheduled for a future date and time')
      return
    }

    const eventData = {
      title: eventTitle.trim(),
      description: eventDescription.trim(),
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 shadow-2xl"></div>

        <div className="relative p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-white">Create New Event</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Group Selection */}
            <div className="space-y-2">
              <label className="text-white font-medium text-sm lg:text-base">Select Group *</label>
              {groupsLoading ? (
              <div className="w-full bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white/50">
                Loading groups...
              </div>
            ) : eligibleGroups.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-3">
                <p className="text-yellow-400 text-sm">
                  You need to be a member of at least one group to create events.
                </p>
              </div>
            ) : (
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  title="Select a group for this event"
                  className="w-full bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 text-sm lg:text-base"
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

            {/* Event Title */}
            <div className="space-y-2">
              <label className="text-white font-medium text-sm lg:text-base">Event Title *</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter event title..."
                className="w-full bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 text-sm lg:text-base"
                maxLength={100}
                disabled={eligibleGroups.length === 0}
              />
              <div className="text-xs text-white/50 text-right">
                {eventTitle.length}/100
              </div>
            </div>

            {/* Event Description */}
            <div className="space-y-2">
              <label className="text-white font-medium text-sm lg:text-base">Description</label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Describe your event..."
                className="w-full h-24 lg:h-32 bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none text-sm lg:text-base"
                maxLength={500}
                disabled={eligibleGroups.length === 0}
              />
              <div className="text-xs text-white/50 text-right">
                {eventDescription.length}/500
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-white font-medium text-sm lg:text-base">Date *</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={minDate}
                  className="w-full bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 text-sm lg:text-base"
                  title="Select event date"
                  disabled={eligibleGroups.length === 0}
                />
              </div>
              <div className="space-y-2">
                <label className="text-white font-medium text-sm lg:text-base">Time *</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 text-sm lg:text-base"
                  title="Select event time"
                  disabled={eligibleGroups.length === 0}
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Info Section */}
            <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-emerald-300">
                  <p className="font-medium mb-1">Group Event Features:</p>
                  <ul className="space-y-1 text-emerald-200/80">
                    <li>• Only visible to group members</li>
                    <li>• Group members can respond "Going" or "Not going"</li>
                    <li>• Track attendance and member responses</li>
                    <li>• Permissions managed by group admins</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 lg:px-6 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-sm lg:text-base"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={isLoading || !eventTitle.trim() || !eventDate || !eventTime || !selectedGroupId || eligibleGroups.length === 0}
                className={`w-full sm:w-auto px-4 lg:px-6 py-2 rounded-xl text-white transition-all duration-200 text-sm lg:text-base ${
                  isLoading || !eventTitle.trim() || !eventDate || !eventTime || !selectedGroupId || eligibleGroups.length === 0
                    ? 'bg-white/20 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                }`}
              >
                {isLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
