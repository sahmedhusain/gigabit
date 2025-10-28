'use client'
import React from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GroupRemoveModalProps } from '@/types/groups'

export default function GroupRemoveModal({
  isOpen,
  onClose,
  pendingAction,
  onConfirm
}: GroupRemoveModalProps) {
  if (!pendingAction) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-4">Remove Member</h3>

              <div className="text-left space-y-4 mb-6">
                <p className="text-white/70 text-sm">
                  Are you sure you want to remove{' '}
                  <span className="font-medium text-white">{pendingAction.memberName}</span> from this group?
                </p>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <h4 className="text-red-300 font-medium mb-2 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>This will:</span>
                  </h4>
                  <ul className="text-red-200/70 text-sm space-y-1">
                    <li>• Remove them from the group immediately</li>
                    <li>• Delete all their posts and comments</li>
                    <li>• Remove them from all group conversations</li>
                    <li>• They will need to be re-invited to rejoin</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300 font-medium">Warning</span>
                  </div>
                  <p className="text-yellow-200/80 text-sm">
                    This action cannot be undone. The member will lose access to all group content.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all duration-200"
                >
                  Remove Member
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}