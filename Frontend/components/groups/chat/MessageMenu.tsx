'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { MessageMenuProps } from '@/types/groups'

export default function MessageMenu({ isOpen, x, y, onClose, onDelete }: MessageMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Click outside overlay - positioned only around the dropdown */}
          <motion.div
            className="fixed z-30"
            style={{
              left: Math.max(0, x - 50),
              top: Math.max(0, y - 50),
              width: Math.min(300, window.innerWidth - x + 50),
              height: Math.min(200, window.innerHeight - y + 50)
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Dropdown menu */}
          <motion.div
            className="fixed z-40 w-48 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden"
            style={{
              left: Math.max(0, x - 192), 
              top: Math.max(0, y - 10), 
              transform: 'translate(0, 0)'
            }}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onDelete()
                onClose()
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Delete message</span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}