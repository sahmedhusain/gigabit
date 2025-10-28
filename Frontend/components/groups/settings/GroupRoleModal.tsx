'use client'
import React from 'react'
import { Shield, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface GroupRoleModalProps {
  isOpen: boolean
  onClose: () => void
  pendingAction: {
    type: 'promote' | 'demote'
    memberName: string
  } | null
  onConfirm: () => void
}

export default function GroupRoleModal({
  isOpen,
  onClose,
  pendingAction,
  onConfirm
}: GroupRoleModalProps) {
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
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                pendingAction.type === 'promote' ? 'bg-blue-500/20' : 'bg-orange-500/20'
              }`}>
                {pendingAction.type === 'promote' ? (
                  <Shield className="w-6 h-6 text-blue-400" />
                ) : (
                  <User className="w-6 h-6 text-orange-400" />
                )}
              </div>
              <h3 className="text-white font-semibold text-lg mb-4">
                {pendingAction.type === 'promote' ? 'Promote to Admin' : 'Demote to Member'}
              </h3>

              <div className="text-left space-y-4 mb-6">
                <p className="text-white/70 text-sm">
                  Are you sure you want to {pendingAction.type === 'promote' ? 'promote' : 'demote'}{' '}
                  <span className="font-medium text-white">{pendingAction.memberName}</span>?
                </p>

                <div className={`p-4 rounded-xl border ${
                  pendingAction.type === 'promote'
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : 'bg-orange-500/10 border-orange-500/20'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {pendingAction.type === 'promote' ? (
                      <Shield className="w-4 h-4 text-blue-400" />
                    ) : (
                      <User className="w-4 h-4 text-orange-400" />
                    )}
                    <span className={`font-medium ${
                      pendingAction.type === 'promote' ? 'text-blue-300' : 'text-orange-300'
                    }`}>
                      {pendingAction.type === 'promote' ? 'Admin Privileges' : 'Member Privileges'}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    pendingAction.type === 'promote' ? 'text-blue-200/80' : 'text-orange-200/80'
                  }`}>
                    {pendingAction.type === 'promote'
                      ? 'Admins can manage members, create content, and moderate the group.'
                      : 'Members have basic access and cannot manage other members.'
                    }
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
                  className={`flex-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
                    pendingAction.type === 'promote'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {pendingAction.type === 'promote' ? 'Promote' : 'Demote'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}