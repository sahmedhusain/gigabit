'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { MessageRounded } from '@mui/icons-material'

export default function EmptyState() {
  return (
    <motion.div
      className="flex items-center justify-center h-full"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1] }}
    >
      <div className="text-center max-w-md mx-auto">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="text-6xl mb-6 filter drop-shadow-lg"
        >
          <MessageRounded className="w-16 h-16 text-white/40 mx-auto mb-6" />
        </motion.div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-3">
          No messages yet
        </h3>
        <p className="text-white/60 text-base mb-6 leading-relaxed">
          Start the conversation in this group!
        </p>
      </div>
    </motion.div>
  )
}