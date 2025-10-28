'use client'
import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { X, Trash2, Edit } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Event } from '@/lib/api'
import { EventModalsProps, EventModalsRef } from '@/types/groups'

const EventModals = forwardRef<EventModalsRef, EventModalsProps>(({
  onCancelEvent,
  onDeleteEvent,
  onEditEvent
}, ref) => {
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')

  const openCancelModal = (event: Event) => {
    setSelectedEvent(event)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const openDeleteModal = (event: Event) => {
    setSelectedEvent(event)
    setShowDeleteModal(true)
  }

  const openEditModal = (event: Event) => {
    setSelectedEvent(event)
    setEditLocation(event.location || '')
    const eventDate = new Date(event.event_time)
    setEditDate(eventDate.toISOString().split('T')[0])
    setEditTime(eventDate.toTimeString().slice(0, 5))
    setShowEditModal(true)
  }

  const closeCancelModal = () => {
    setShowCancelModal(false)
    setSelectedEvent(null)
    setCancelReason('')
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setSelectedEvent(null)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedEvent(null)
    setEditLocation('')
    setEditDate('')
    setEditTime('')
  }

  const handleConfirmCancel = async () => {
    if (!cancelReason || !selectedEvent) return
    try {
      await onCancelEvent(selectedEvent.id, cancelReason)
      closeCancelModal()
    } catch {
      // Error handled by parent
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return
    try {
      await onDeleteEvent(selectedEvent.id)
      closeDeleteModal()
    } catch {
      // Error handled by parent
    }
  }

  const handleConfirmEdit = async () => {
    if (!editDate || !editTime || !selectedEvent) return
    try {
      const eventDateTime = new Date(`${editDate}T${editTime}`)
      const eventData = {
        event_time: eventDateTime.toISOString(),
        location: editLocation.trim()
      }
      await onEditEvent(selectedEvent.id, eventData)
      closeEditModal()
    } catch {
      // Error handled by parent
    }
  }

  useImperativeHandle(ref, () => ({
    openCancelModal,
    openDeleteModal,
    openEditModal
  }))

  return (
    <>
      {/* Cancel Event Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && selectedEvent && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCancelModal}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Cancel Event</h3>
                  <p className="text-white/60 text-sm">Cancel &quot;{selectedEvent.title}&quot;</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="cancel-reason-community" className="block text-white/80 text-sm font-medium mb-2">
                    Reason for cancellation *
                  </label>
                  <select
                    id="cancel-reason-community"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-orange-400/50"
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="organizer_unavailable">Organizer unavailable</option>
                    <option value="venue_unavailable">Venue unavailable</option>
                    <option value="low_attendance">Low attendance</option>
                    <option value="weather_conditions">Weather conditions</option>
                    <option value="emergency">Emergency situation</option>
                    <option value="other">Other reason</option>
                  </select>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3">
                  <p className="text-orange-300 text-sm">
                    This will notify all attendees that the event has been cancelled.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeCancelModal}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  disabled={!cancelReason}
                >
                  Cancel Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Event Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedEvent && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDeleteModal}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Delete Event</h3>
                  <p className="text-white/60 text-sm">Delete &quot;{selectedEvent.title}&quot;</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-4">
                <p className="text-red-300 text-sm">
                  This action cannot be undone. This will permanently delete the event and remove all associated data.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {showEditModal && selectedEvent && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditModal}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Edit className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Edit Event</h3>
                  <p className="text-white/60 text-sm">Edit &quot;{selectedEvent.title}&quot;</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-location-community" className="block text-white/80 text-sm font-medium mb-2">
                    Location (optional)
                  </label>
                  <input
                    id="edit-location-community"
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Enter event location"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                  />
                </div>

                <div>
                  <label htmlFor="edit-date-community" className="block text-white/80 text-sm font-medium mb-2">
                    Date *
                  </label>
                  <input
                    id="edit-date-community"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white focus:outline-none focus:border-blue-400/50"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-time-community" className="block text-white/80 text-sm font-medium mb-2">
                    Time *
                  </label>
                  <input
                    id="edit-time-community"
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white focus:outline-none focus:border-blue-400/50"
                    required
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
                  <p className="text-blue-300 text-sm">
                    Only location, date, and time can be edited. Title and description cannot be changed.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})

EventModals.displayName = 'EventModals'

export default EventModals