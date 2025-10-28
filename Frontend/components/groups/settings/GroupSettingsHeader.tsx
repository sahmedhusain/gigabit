'use client'
import React from 'react'
import { Settings, Edit3 } from 'lucide-react'
import { motion } from 'framer-motion'

interface GroupSettingsHeaderProps {
  isAdmin: boolean
  onEditClick: () => void
}

export default function GroupSettingsHeader({ isAdmin, onEditClick }: GroupSettingsHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6 mt-4 hover:shadow-emerald-500/10 transition-all duration-500 mx-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
              <Settings className="w-4 h-4 text-white drop-shadow-sm" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-white mb-0.5">Group Settings</h2>
            <p className="text-white/70 text-xs lg:text-sm">Manage your group preferences, permissions, and members</p>
          </div>
        </div>
        {isAdmin && (
          <motion.button
            onClick={onEditClick}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-medium transition-all duration-300 shadow-md hover:shadow-lg self-start sm:self-center text-sm"
            whileHover={{ scale: 1.02, y: -0.5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Group Info</span>
          </motion.button>
        )}
      </div>
    </div>
  )
}