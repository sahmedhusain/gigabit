'use client'
import React from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Member } from '@/lib/api'
import { getUserInitials } from '@/utils/avatarUtils'

interface GroupRequestsTabProps {
  isAdmin: boolean
  receivedRequests: Member[]
  sentRequests: Member[]
  onRespondToRequest: (userId: number, action: 'accept' | 'decline') => void
  onCancelInvitation: (invitationId: number) => void
  formatJoinDate: (dateString?: string) => string
}

export default function GroupRequestsTab({
  isAdmin,
  receivedRequests,
  sentRequests,
  onRespondToRequest,
  onCancelInvitation,
  formatJoinDate
}: GroupRequestsTabProps) {
  if (!isAdmin) return null

  return (
    <motion.div
      key="requests"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
    >
      <div className="space-y-6">
        {/* Received Requests */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Join Requests ({(receivedRequests || []).length})</h3>
          {(receivedRequests || []).length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No pending join requests
            </div>
          ) : (
            <div className="space-y-3">
              {(receivedRequests || []).map((request) => (
                <div key={request.id} className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-4 hover:shadow-emerald-500/10 transition-all duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {request.user.avatar ? (
                        <Image
                          src={request.user.avatar}
                          alt={request.user.first_name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                          {getUserInitials(request.user)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">
                          {request.user.first_name} {request.user.last_name}
                        </div>
                        <div className="text-white/60 text-sm">
                          Requested {request.joined_at ? formatJoinDate(request.joined_at) : 'recently'}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => onRespondToRequest(request.user.id, 'accept')}
                        className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-2xl hover:bg-emerald-500/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Accept
                      </motion.button>
                      <motion.button
                        onClick={() => onRespondToRequest(request.user.id, 'decline')}
                        className="px-4 py-2 bg-red-500/20 text-red-300 rounded-2xl hover:bg-red-500/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Decline
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sent Requests */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Sent Invitations ({(sentRequests || []).length})</h3>
          {(sentRequests || []).length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No sent invitations
            </div>
          ) : (
            <div className="space-y-3">
              {(sentRequests || []).map((request) => (
                <div key={request.id} className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-3xl p-4 hover:shadow-emerald-500/10 transition-all duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {request.user.avatar ? (
                        <Image
                          src={request.user.avatar}
                          alt={request.user.first_name}
                          width={40}
                          height={40}
                          unoptimized={true}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                          {getUserInitials(request.user)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">
                          {request.user.first_name} {request.user.last_name}
                        </div>
                        <div className="text-white/60 text-sm">
                          Invited {request.joined_at ? formatJoinDate(request.joined_at) : 'recently'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white/60 text-sm">Pending response</span>
                      <motion.button
                        onClick={() => onCancelInvitation(request.id)}
                        className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl transition-all duration-200 text-xs font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}