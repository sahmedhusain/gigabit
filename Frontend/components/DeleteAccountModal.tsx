'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Lock, Shield, Clock, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface DeleteAccountModalProps {
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  deleteConfirmation: string;
  setDeleteConfirmation: (confirmation: string) => void;
  deletePassword: string;
  setDeletePassword: (password: string) => void;
  deleteCountdown: number;
  setDeleteCountdown: (countdown: number) => void;
  deletePasswordError: string;
  setDeletePasswordError: (error: string) => void;
}

export default function DeleteAccountModal({
  showDeleteModal,
  setShowDeleteModal,
  deleteConfirmation,
  setDeleteConfirmation,
  deletePassword,
  setDeletePassword,
  deleteCountdown,
  setDeleteCountdown,
  deletePasswordError,
  setDeletePasswordError,
}: DeleteAccountModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showDeleteModal && deleteCountdown > 0) {
      interval = setInterval(() => {
        setDeleteCountdown(deleteCountdown - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showDeleteModal, deleteCountdown, setDeleteCountdown]);

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim() || deleteConfirmation !== 'DELETE' || deleteCountdown > 0) {
      return;
    }

    setDeleting(true);
    setMessage('');

    const token = localStorage.getItem('token');

    try {
      const deleteResponse = await fetch(`${API_BASE_URL}/api/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (deleteResponse.ok) {
        setMessage('Account deleted successfully. You will be logged out.');
        // Clear local storage and redirect
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        const error = await deleteResponse.json();
        // Check if it's a password error
        if ((deleteResponse.status === 401 && error.error?.toLowerCase().includes('password')) || error.error?.toLowerCase().includes('invalid password') || error.error?.toLowerCase().includes('wrong password')) {
          setDeletePasswordError('Password is incorrect');
        } else {
          setMessage(error.error || 'Failed to delete account');
          setShowDeleteModal(false);
          setDeleteConfirmation('');
          setDeleteCountdown(5);
          setDeletePasswordError('');
        }
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      setMessage('Failed to delete account');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      setDeleteCountdown(5);
      setDeletePasswordError('');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteConfirmation('');
            setDeletePassword('');
            setDeleteCountdown(5);
            setDeletePasswordError('');
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto relative z-[10000]"
            style={{ maxWidth: '800px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-700 rounded-xl">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Delete Account Forever</h3>
                <p className="text-red-300/80 text-sm">This action cannot be undone</p>
              </div>
            </div>

            {/* Warning Section */}
            <motion.div
              className="bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/40 rounded-2xl p-4 mb-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h4 className="text-red-300 font-bold text-sm">⚠️ Permanent Data Loss</h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-red-200 font-medium text-sm">Profile & Identity</p>
                    <p className="text-red-200/70 text-xs">Your username, profile picture, bio, and all personal information will be permanently deleted</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-red-200 font-medium text-sm">Posts & Content</p>
                    <p className="text-red-200/70 text-xs">All your posts, comments, and uploaded media will be permanently removed</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-red-200 font-medium text-sm">Connections & Relationships</p>
                    <p className="text-red-200/70 text-xs">All friendships, group memberships, and follow relationships will be severed</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-red-200 font-medium text-sm">Messages & Conversations</p>
                    <p className="text-red-200/70 text-xs">All private messages and group conversations will be permanently deleted</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Password Confirmation */}
            <motion.div
              className="bg-gradient-to-r from-orange-600/20 to-yellow-500/20 border border-yellow-500/40 rounded-2xl p-4 mb-4"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="flex items-center space-x-2 mb-3">
                <Lock className="w-4 h-4 text-yellow-400" />
                <h4 className="text-yellow-300 font-bold text-sm">Password Verification Required</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-yellow-200 text-xs font-medium mb-2">
                    Enter your current password to confirm:
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deletePasswordError) {
                        setDeletePasswordError('');
                      }
                    }}
                    placeholder="Enter your password..."
                    className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-white placeholder-yellow-200/50 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                      deletePasswordError
                        ? 'border-red-400/50 focus:ring-red-400/50 focus:border-red-400/50'
                        : 'border-yellow-500/30 focus:ring-yellow-400/50 focus:border-yellow-400/50'
                    }`}
                  />
                  {deletePasswordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-lg p-2 border border-red-400/20 mt-2"
                    >
                      <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300/90 text-xs leading-relaxed">{deletePasswordError}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Safety Confirmation */}
            <motion.div
              className="bg-gradient-to-r from-yellow-600/20 to-orange-500/20 border border-yellow-500/40 rounded-2xl p-4 mb-4"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="w-4 h-4 text-yellow-400" />
                <h4 className="text-yellow-300 font-bold text-sm">Safety Confirmation Required</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-yellow-200 text-xs font-medium mb-2">
                    Type <strong className="text-yellow-300">&quot;DELETE&quot;</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE here..."
                    className="w-full px-3 py-2 bg-slate-800/50 border border-yellow-500/30 rounded-lg text-white placeholder-yellow-200/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-yellow-200/80 text-sm">
                    {deleteCountdown > 0 ? `Wait ${deleteCountdown} seconds...` : 'Ready to delete'}
                  </span>
                  <div className="flex items-center space-x-2">
                    {deleteCountdown > 0 && (
                      <motion.div
                        className="w-2 h-2 bg-yellow-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                    <span className={`text-sm font-medium ${
                      deleteCountdown > 0 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {deleteCountdown > 0 ? '⏳' : '✅'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <motion.button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeletePassword('');
                  setDeleteCountdown(5);
                  setDeletePasswordError('');
                }}
                className="flex-1 px-4 py-3 border-2 border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-semibold text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={deleting}
              >
                Cancel - Keep Account Safe
              </motion.button>

              <motion.button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0 || !deletePassword.trim()}
                className={`flex-1 px-4 py-3 rounded-2xl font-bold text-white transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 text-sm ${
                  deleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0 || !deletePassword.trim()
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25 hover:shadow-red-500/40'
                }`}
                whileHover={{
                  scale: (deleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0 || !deletePassword.trim()) ? 1 : 1.02,
                  y: (deleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0 || !deletePassword.trim()) ? 0 : -1
                }}
                whileTap={{
                  scale: (deleting || deleteConfirmation !== 'DELETE' || deleteCountdown > 0 || !deletePassword.trim()) ? 1 : 0.98
                }}
              >
                {deleting ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Deleting Account...</span>
                  </>
                ) : deleteCountdown > 0 ? (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>Wait {deleteCountdown}s</span>
                  </>
                ) : deleteConfirmation !== 'DELETE' ? (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    <span>Type DELETE</span>
                  </>
                ) : !deletePassword.trim() ? (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Enter Password</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>Delete Forever</span>
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Final Warning */}
            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <p className="text-red-200/50 text-xs">
                💀 This is your final warning. Account deletion is permanent and irreversible.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}