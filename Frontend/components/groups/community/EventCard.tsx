'use client'
import React from 'react'
import { Calendar, MapPin, Users, Check, X, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { EventCardProps } from '@/types/groups'

export default function EventCard({
  event,
  isHighlighted,
  respondingToEvent,
  user,
  groupRoles,
  dropdownOpen,
  onDropdownToggle,
  onEditEvent,
  onCancelEvent,
  onDeleteEvent,
  onEventResponse,
  formatDate,
  formatTime,
  formatTimeAgo,
  formatCancellationReason,
  isEventEnded
}: EventCardProps) {
  return (
    <motion.div
      id={`event-${event.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
      className={`group relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer animate-fade-in animate-slide-in-from-bottom ${
        isHighlighted
          ? 'border-emerald-400/60 shadow-emerald-400/30 ring-4 ring-emerald-400/20'
          : 'border-white/20'
      }`}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br rounded-3xl transition-opacity duration-300 ${
        isHighlighted
          ? 'from-emerald-500/20 via-teal-500/10 to-emerald-500/20 opacity-100'
          : 'from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100'
      }`}></div>

      <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="text-white font-bold text-xl group-hover:text-emerald-200 transition-colors duration-200">{event.title}</h3>
                {event.canceled && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                    CANCELED
                  </span>
                )}
                {isEventEnded(event) && (
                  <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full font-medium">
                    ENDED
                  </span>
                )}
              </div>
              <p className="text-white/80 mb-4 leading-relaxed">{event.description}</p>
              {event.canceled && event.cancel_reason && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-red-300 text-sm">
                    <span className="font-medium">Cancellation reason:</span> {formatCancellationReason(event.cancel_reason)}
                  </p>
                </div>
              )}
            </div>
            {/* Three-dots menu for event creator or group admins/creators */}
            {(user && event.group && (event.creator_id === user.id || groupRoles[event.group.id]?.is_admin_or_creator)) && (
              <div className="relative ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDropdownToggle(event.id);
                  }}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Event options"
                  title="Event Options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen === event.id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50">
                    {!event.canceled && !isEventEnded(event) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(event);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-3 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors rounded-t-lg"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-medium">Edit Event</span>
                      </button>
                    )}
                    {!event.canceled && !isEventEnded(event) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelEvent(event);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-3 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Cancel Event</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event);
                      }}
                      className={`w-full flex items-center space-x-2 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${!isEventEnded(event) ? 'rounded-b-lg' : 'rounded-lg'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete Event</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Date & Time */}
            <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">{formatDate(event.event_time)}</p>
                <p className="text-white/60 text-xs">{formatTime(event.event_time)}</p>
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium">Location</p>
                  <p className="text-white/60 text-xs truncate max-w-32">{event.location}</p>
                </div>
              </div>
            )}

            {/* Group */}
            <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">Group</p>
                <p className="text-white/60 text-xs">{event.group.title}</p>
              </div>
            </div>
          </div>

          {/* Creator & Time */}
          <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
            <span>Created by {event.creator.first_name} {event.creator.last_name}</span>
            <span>{formatTimeAgo(event.created_at)}</span>
          </div>
        </div>

        {/* Right Side - Response Section */}
        <div className="flex flex-col items-end space-y-4 lg:min-w-48">
          {/* Response Counts */}
          <div className="flex items-center space-x-4 bg-white/5 rounded-2xl p-3 border border-white/10 w-full">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-white/80 text-sm font-medium">{event.going_count}</span>
              <span className="text-white/60 text-xs">going</span>
            </div>
            <div className="flex items-center space-x-2">
              <X className="w-4 h-4 text-red-400" />
              <span className="text-white/80 text-sm font-medium">{event.not_going_count}</span>
              <span className="text-white/60 text-xs">not going</span>
            </div>
          </div>

          {/* Response Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            {event.user_response === 'going' ? (
              <button
                onClick={() => onEventResponse(event.id, 'going')}
                disabled={respondingToEvent === event.id || event.canceled || isEventEnded(event)}
                className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
              >
                <Check className="w-4 h-4" />
                <span>Going</span>
              </button>
            ) : (
              <button
                onClick={() => onEventResponse(event.id, 'going')}
                disabled={respondingToEvent === event.id || event.canceled || isEventEnded(event)}
                className={`flex-1 bg-white/10 hover:bg-emerald-600 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-emerald-400/50 ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
              >
                <Check className="w-4 h-4" />
                <span>Going</span>
              </button>
            )}

            {event.user_response === 'not_going' ? (
              <button
                onClick={() => onEventResponse(event.id, 'not_going')}
                disabled={respondingToEvent === event.id || event.canceled || isEventEnded(event)}
                className={`flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
              >
                <X className="w-4 h-4" />
                <span>Not Going</span>
              </button>
            ) : (
              <button
                onClick={() => onEventResponse(event.id, 'not_going')}
                disabled={respondingToEvent === event.id || event.canceled || isEventEnded(event)}
                className={`flex-1 bg-white/10 hover:bg-red-600 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-white/20 hover:border-red-400/50 ${event.canceled || isEventEnded(event) ? 'cursor-not-allowed' : ''}`}
              >
                <X className="w-4 h-4" />
                <span>Not Going</span>
              </button>
            )}
          </div>

          {/* Loading indicator */}
          {respondingToEvent === event.id && (
            <div className="flex items-center space-x-2 text-white/60 text-xs bg-white/5 rounded-2xl px-3 py-2 w-full lg:w-auto justify-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}