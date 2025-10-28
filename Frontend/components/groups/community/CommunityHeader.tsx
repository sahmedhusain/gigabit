'use client'
import React from 'react'
import { Calendar, Activity, Plus, EyeOff, ArrowDown, ArrowUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { CommunityHeaderProps } from '@/types/groups'

export default function CommunityHeader({
  communitySubTab,
  eventsSubTab,
  sortBy,
  hideEndedEvents,
  onSortChange,
  onHideEndedToggle,
  onCreateEvent
}: CommunityHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex-shrink-0 mb-6"
    >
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-4 hover:shadow-emerald-500/10 transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Header Icon */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
                {communitySubTab === 'events' ? (
                  <Calendar className="w-5 h-5 text-white drop-shadow-sm" />
                ) : (
                  <Activity className="w-5 h-5 text-white drop-shadow-sm" />
                )}
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>

            {/* Title and Description */}
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors duration-300">
                {communitySubTab === 'events' && (
                  eventsSubTab === 'going' ? 'Going Events' :
                  eventsSubTab === 'not-going' ? 'Not Going Events' :
                  'All Events'
                )}
                {communitySubTab === 'activity' && 'Activity History'}
              </h1>
              <p className="text-white/80 text-sm leading-relaxed">
                {communitySubTab === 'events' && (
                  eventsSubTab === 'going' ? 'Events you\'re attending' :
                  eventsSubTab === 'not-going' ? 'Events you declined' :
                  'Discover and join events'
                )}
                {communitySubTab === 'activity' && 'Your recent interactions'}
              </p>
            </div>
          </div>

          {/* Controls Section */}
          {communitySubTab === 'events' && (
            <div className="flex items-center space-x-4">
              {/* Filter Controls */}
              <div className="flex items-center space-x-3">
                {/* Hide Ended Events Toggle */}
                <button
                  onClick={onHideEndedToggle}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all duration-300 hover:scale-105 ${
                    hideEndedEvents
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-emerald-300'
                      : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white/70 hover:text-white'
                  }`}
                  title={hideEndedEvents ? 'Show ended events' : 'Hide ended events'}
                >
                  <EyeOff className={`w-3 h-3 ${hideEndedEvents ? 'text-emerald-400' : ''}`} />
                  <span className="text-xs font-medium">Hide Ended</span>
                </button>

                {/* Sort Toggle */}
                <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/20">
                  <button
                    onClick={() => onSortChange('newest')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      sortBy === 'newest'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>Newest</span>
                  </button>
                  <button
                    onClick={() => onSortChange('oldest')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      sortBy === 'oldest'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>Oldest</span>
                  </button>
                </div>
              </div>

              {/* Enhanced Create Event Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateEvent}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <Plus className="w-5 h-5 relative z-10" />
                <span className="font-semibold relative z-10">Create Event</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}