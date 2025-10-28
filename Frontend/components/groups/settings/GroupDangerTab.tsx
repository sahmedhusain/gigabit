'use client'
import React, { useState } from 'react'
import { Trash2, AlertTriangle, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import GroupDeleteModal from './GroupDeleteModal'

interface GroupDangerTabProps {
  userRole: string
  groupTitle: string
  memberCount: number
  onDeleteGroup: () => void
  isDeleting: boolean
}

export default function GroupDangerTab({
  userRole,
  groupTitle,
  memberCount,
  onDeleteGroup,
  isDeleting
}: GroupDangerTabProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  if (userRole !== 'creator') return null

  return (
    <>
      <motion.div
        key="danger"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6"
      >
        {/* Delete Group Section */}
        <motion.div
          className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent backdrop-blur-xl rounded-3xl border border-red-500/30 shadow-2xl p-6 hover:shadow-red-500/10 transition-all duration-500"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-300">Delete Group</h3>
                <p className="text-red-200/60 text-sm">Permanently remove this group and all its data</p>
              </div>
            </div>

            {/* Impact indicator */}
            <motion.div
              className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-red-300 text-xs font-medium">Critical</span>
            </motion.div>
          </div>

          {/* Data Impact Summary */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6">
            <h4 className="text-red-300 font-medium mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Data that will be permanently deleted:</span>
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                <span className="text-red-200/80 text-sm">All posts and comments</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                <span className="text-red-200/80 text-sm">Group messages and chats</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                <span className="text-red-200/80 text-sm">All events and polls</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                <span className="text-red-200/80 text-sm">Member relationships</span>
              </div>
            </div>
          </div>

          <motion.button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Trash2 className="w-5 h-5" />
            </motion.div>
            <span>Delete This Group</span>
            <motion.div
              animate={{
                x: [0, 3, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.button>

          <motion.p
            className="text-red-200/50 text-xs text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            ⚠️ This action cannot be undone. All group data will be permanently lost.
          </motion.p>
        </motion.div>
      </motion.div>

      <GroupDeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        groupTitle={groupTitle}
        memberCount={memberCount}
        onDeleteGroup={onDeleteGroup}
        isDeleting={isDeleting}
      />
    </>
  )
}