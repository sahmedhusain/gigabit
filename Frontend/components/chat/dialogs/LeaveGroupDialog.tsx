import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Settings } from 'lucide-react';

interface LeaveGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  nextAdmin: string;
  hasExistingAdmins: boolean;
  hasOtherAdmins: boolean;
  groupName: string;
  onConfirmLeave: () => void;
  onManageAdmins: () => void;
}

export default function LeaveGroupDialog({
  isOpen,
  onClose,
  userRole,
  nextAdmin,
  hasExistingAdmins,
  hasOtherAdmins,
  groupName,
  onConfirmLeave,
  onManageAdmins
}: LeaveGroupDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onMouseDown={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm mx-4"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
              {userRole === 'creator' ? <Crown className="w-4 h-4 text-yellow-400 mr-2" /> :
               userRole === 'admin' ? <Shield className="w-4 h-4 text-blue-400 mr-2" /> : null}
              Leave Group
            </h3>

            {/* Different messages based on user role */}
            {userRole === 'creator' && (
              <div className="mb-6">
                {hasExistingAdmins ? (
                  <p className="text-white/70 mb-3">
                    As the group creator, leaving will transfer ownership to the next admin.
                  </p>
                ) : (
                  <p className="text-white/70 mb-3">
                    As the group creator, since there are no admins, ownership will be transferred to the first added member (like WhatsApp).
                  </p>
                )}

                {nextAdmin && nextAdmin !== 'No eligible members' ? (
                  <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 mb-4">
                    <p className="text-yellow-200 text-sm font-medium flex items-center">
                      <Crown className="w-4 h-4 mr-2" />
                      {hasExistingAdmins ? 'Next Admin Owner:' : 'Next Owner (First Member):'} {nextAdmin}
                    </p>
                  </div>
                ) : nextAdmin === 'No eligible members' ? (
                  <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-4">
                    <p className="text-red-200 text-sm font-medium">
                      No eligible members to transfer ownership to.
                    </p>
                  </div>
                ) : null}

                {!hasExistingAdmins && nextAdmin && nextAdmin !== 'No eligible members' ? (
                  <p className="text-white/60 text-sm">
                    You can select an admin before leaving, or proceed to transfer ownership to the first member.
                  </p>
                ) : hasExistingAdmins ? (
                  <p className="text-white/60 text-sm">
                    You can manage admins before leaving, or proceed to leave the group.
                  </p>
                ) : (
                  <p className="text-white/60 text-sm">
                    Add some admins first, or the group will be transferred to the first member.
                  </p>
                )}
              </div>
            )}

            {userRole === 'admin' && (
              <div className="mb-6">
                <p className="text-white/70 mb-3">
                  Are you sure you want to leave &quot;{groupName}&quot;? As an admin, you will lose your administrative privileges.
                </p>
                {hasOtherAdmins ? (
                  <p className="text-white/60 text-sm">
                    Since there are other admins in the group, you can leave normally. You will need to be re-invited to rejoin.
                  </p>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3">
                    <p className="text-yellow-200 text-sm font-medium flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      You are the only admin. Consider promoting someone before leaving.
                    </p>
                  </div>
                )}
              </div>
            )}

            {userRole === 'member' && (
              <p className="text-white/70 mb-6">
                Are you sure you want to leave &quot;{groupName}&quot;? You will no longer receive messages from this group and will need to be re-invited to rejoin.
              </p>
            )}

            {/* Buttons based on user role and conditions */}
            {userRole === 'creator' ? (
              nextAdmin && nextAdmin !== 'No eligible members' ? (
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <motion.button
                      onClick={onClose}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-white/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={onManageAdmins}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl border border-blue-400/30 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Settings className="w-4 h-4" />
                      <span>{hasExistingAdmins ? 'Manage Admins' : 'Add Admin'}</span>
                    </motion.button>
                  </div>
                  <motion.button
                    onClick={onConfirmLeave}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl border border-amber-400/30 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {hasExistingAdmins ? 'Leave Group' : 'Leave & Transfer to First Member'}
                  </motion.button>
                </div>
              ) : (
                                <div className="flex space-x-3">
                  <motion.button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-white/10"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={onManageAdmins}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl border border-blue-400/30 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Add Members</span>
                  </motion.button>
                </div>
              )
            ) : userRole === 'admin' ? (
                            !hasOtherAdmins ? (
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <motion.button
                      onClick={onClose}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-white/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={onManageAdmins}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl border border-blue-400/30 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Add Admin</span>
                    </motion.button>
                  </div>
                  <motion.button
                    onClick={onConfirmLeave}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl border border-amber-400/30 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Leave Anyway
                  </motion.button>
                </div>
              ) : (
                                <div className="flex space-x-3">
                  <motion.button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-white/10"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={onConfirmLeave}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl border border-amber-400/30 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Leave Group
                  </motion.button>
                </div>
              )
            ) : (
                            <div className="flex space-x-3">
                <motion.button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 text-white rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-white/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={onConfirmLeave}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl border border-amber-400/30 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Leave Group
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}