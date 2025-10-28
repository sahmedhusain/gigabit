'use client'
import React from 'react'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { LoadMoreButtonProps } from '@/types/groups'

export default function LoadMoreButton({ onClick }: LoadMoreButtonProps) {
  return (
    <motion.div
      className="flex justify-center py-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <motion.button
        onClick={onClick}
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 backdrop-blur-sm border border-white/20 rounded-xl text-white/80 hover:text-white transition-all duration-200 shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronDown className="w-4 h-4 rotate-180" />
        <span className="text-sm font-medium">Load Previous Messages</span>
      </motion.button>
    </motion.div>
  )
}