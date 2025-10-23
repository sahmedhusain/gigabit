'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Shield, Check, Users, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

// Public Profile Confirmation Modal
const PublicConfirmModal = ({ show, onClose, onConfirm, isUpdating }: {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isUpdating: boolean;
}) => {
  return (
    <AnimatePresence>
      {show && (
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
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Make Profile Public?</h3>
              <p className="text-white/70 text-sm mb-6">
                Are you sure you want to make your account public? Anyone will be able to see your profile and posts.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isUpdating}
                  className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    isUpdating
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  }`}
                >
                  {isUpdating ? 'Updating...' : 'Make Public'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function PrivacySettings() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [birthdayPrivacy, setBirthdayPrivacy] = useState('everyone');
  const [genderPrivacy, setGenderPrivacy] = useState('everyone');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPublicConfirm, setShowPublicConfirm] = useState(false);

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const userData = await api.getMe();
      setIsPrivate(userData.is_private);
      setBirthdayPrivacy(userData.birthday_privacy || 'everyone');
      setGenderPrivacy(userData.gender_privacy || 'everyone');
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = () => {
    if (isPrivate) {
      // If currently private, show confirmation to make public
      setShowPublicConfirm(true);
    } else {
      // If currently public, directly make private (no confirmation needed)
      updatePrivacySetting(true);
    }
  };

  const updatePrivacySetting = async (makePrivate: boolean) => {
    setSaving(true);
    setMessage('');
    setShowPublicConfirm(false);

    try {
      const result = await api.updateUserPrivacy(0, makePrivate); // userId not needed, will use authenticated user
      setIsPrivate(result.user.is_private);
      setMessage('Privacy settings updated successfully!');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      setMessage('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBirthdayPrivacyChange = async (value: string) => {
    setSaving(true);
    setMessage('');

    try {
      await api.updateBirthdayPrivacy(value);
      setBirthdayPrivacy(value);
      setMessage('Birthday privacy updated successfully!');
    } catch (error) {
      console.error('Failed to update birthday privacy:', error);
      setMessage('Failed to update birthday privacy');
    } finally {
      setSaving(false);
    }
  };

  const handleGenderPrivacyChange = async (value: string) => {
    setSaving(true);
    setMessage('');

    try {
      await api.updateGenderPrivacy(value);
      setGenderPrivacy(value);
      setMessage('Gender privacy updated successfully!');
    } catch (error) {
      console.error('Failed to update gender privacy:', error);
      setMessage('Failed to update gender privacy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <motion.div
          className="w-8 h-8 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    );
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex items-center space-x-4 mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="p-3 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl border border-emerald-400/30 shadow-xl"
        >
          <Shield className="w-6 h-6 text-emerald-400" />
        </motion.div>
        <div>
          <motion.h2
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent"
          >
            Privacy Settings
          </motion.h2>
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-emerald-200/70"
          >
            Control your privacy and visibility preferences
          </motion.p>
        </div>
      </div>

      {/* Status Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`p-6 rounded-2xl backdrop-blur-xl border-2 shadow-2xl transition-all duration-500 ${
              message.includes('success')
                ? 'bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 border-emerald-400/40 text-emerald-100 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20 border-red-400/40 text-red-100 shadow-red-500/20'
            }`}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: message.includes('success') ? 360 : 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`p-2 rounded-xl ${
                  message.includes('success')
                    ? 'bg-emerald-500/20'
                    : 'bg-red-500/20'
                }`}
              >
                {message.includes('success') ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-red-400" />
                )}
              </motion.div>
              <span className="font-semibold">{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {/* Profile Visibility Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-emerald-400/20 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-6">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-2xl border border-emerald-400/30 shadow-lg"
                >
                  {isPrivate ? (
                    <EyeOff className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Globe className="w-6 h-6 text-emerald-400" />
                  )}
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-white">Profile Visibility</h3>
                  <p className="text-emerald-200/70">Control who can see your profile and posts</p>
                </div>
              </div>

              <p className="text-emerald-200/80 mb-8 leading-relaxed">
                When your profile is private, only approved followers can see your content. Public profiles are visible to everyone on the platform.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border-2 border-emerald-400/20 rounded-2xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <motion.div
                        animate={{ scale: isPrivate ? 1 : 1.1 }}
                        transition={{ duration: 0.3 }}
                        className={`p-2 rounded-xl ${
                          isPrivate
                            ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                            : 'bg-gradient-to-br from-emerald-500/20 to-green-500/20'
                        }`}
                      >
                        {isPrivate ? (
                          <EyeOff className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Globe className="w-5 h-5 text-emerald-400" />
                        )}
                      </motion.div>
                      <h4 className="text-lg font-bold text-white">
                        {isPrivate ? 'Private Profile' : 'Public Profile'}
                      </h4>
                    </div>
                    <p className="text-emerald-200/70 text-sm leading-relaxed">
                      {isPrivate
                        ? 'Only approved followers can see your profile and posts'
                        : 'Anyone can see your profile and posts'
                      }
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTogglePrivacy}
                    disabled={saving}
                    aria-label={`Switch to ${isPrivate ? 'public' : 'private'} profile`}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:ring-offset-2 focus:ring-offset-transparent shadow-xl ${
                      isPrivate
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25'
                        : 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/25'
                    }`}
                  >
                    <motion.span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-500 ${
                        isPrivate ? 'translate-x-9' : 'translate-x-1'
                      }`}
                      layout
                    />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Personal Information Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-indigo-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-purple-400/20 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-violet-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-6">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 bg-gradient-to-br from-purple-500/20 to-violet-500/20 backdrop-blur-xl rounded-2xl border border-purple-400/30 shadow-lg"
                >
                  <Shield className="w-6 h-6 text-purple-400" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-white">Personal Information Privacy</h3>
                  <p className="text-purple-200/70">Control who can see your birthday and gender</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Birthday Privacy */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border-2 border-purple-400/20 rounded-2xl shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="p-2 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl"
                      >
                        <Eye className="w-5 h-5 text-purple-400" />
                      </motion.div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Birthday Visibility</h4>
                        <p className="text-purple-200/70 text-sm">Who can see your date of birth</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'everyone', label: 'Everyone', icon: Globe },
                      { value: 'friends', label: 'Friends', icon: Users },
                      { value: 'followers', label: 'Followers Only', icon: Lock }
                    ].map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBirthdayPrivacyChange(option.value)}
                        disabled={saving}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-xl ${
                          birthdayPrivacy === option.value
                            ? 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 border-purple-400 shadow-lg shadow-purple-500/20'
                            : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <option.icon className={`w-5 h-5 ${
                            birthdayPrivacy === option.value ? 'text-purple-400' : 'text-white/70'
                          }`} />
                          <span className={`text-sm font-medium ${
                            birthdayPrivacy === option.value ? 'text-purple-200' : 'text-white/70'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Gender Privacy */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border-2 border-purple-400/20 rounded-2xl shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="p-2 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl"
                      >
                        <Users className="w-5 h-5 text-purple-400" />
                      </motion.div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Gender Visibility</h4>
                        <p className="text-purple-200/70 text-sm">Who can see your gender information</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'everyone', label: 'Everyone', icon: Globe },
                      { value: 'friends', label: 'Friends', icon: Users },
                      { value: 'followers', label: 'Followers Only', icon: Lock }
                    ].map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGenderPrivacyChange(option.value)}
                        disabled={saving}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-xl ${
                          genderPrivacy === option.value
                            ? 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 border-purple-400 shadow-lg shadow-purple-500/20'
                            : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <option.icon className={`w-5 h-5 ${
                            genderPrivacy === option.value ? 'text-purple-400' : 'text-white/70'
                          }`} />
                          <span className={`text-sm font-medium ${
                            genderPrivacy === option.value ? 'text-purple-200' : 'text-white/70'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>

    {/* Public Profile Confirmation Modal */}
    <PublicConfirmModal
      show={showPublicConfirm}
      onClose={() => setShowPublicConfirm(false)}
      onConfirm={() => updatePrivacySetting(false)}
      isUpdating={saving}
    />
    </>
  );
}