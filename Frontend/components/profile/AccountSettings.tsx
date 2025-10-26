'use client';

import { useState, useEffect } from 'react';
import { Shield, Trash2, Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';

// Password validation function from registration form
function validatePassword(password: string) {
  const upper = /[A-Z]/
  const lower = /[a-z]/
  const number = /[0-9]/
  const space = /\s/
  // Allow only ASCII printable characters (excluding space, but including common symbols)
  const allowedChars = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/

  const errors = []

  if (password.length < 8 || password.length > 32) {
    errors.push("be between 8 and 32 characters long")
  }

  if (!upper.test(password)) {
    errors.push("contain at least one uppercase letter")
  }

  if (!lower.test(password)) {
    errors.push("contain at least one lowercase letter")
  }

  if (!number.test(password)) {
    errors.push("contain at least one number")
  }

  if (space.test(password)) {
    errors.push("not contain any spaces")
  }

  if (!allowedChars.test(password)) {
    errors.push("only contain English letters, numbers, and common symbols (no emojis or special characters)")
  }

  // combine errors into a single message
  if (errors.length > 0) {
    const lastError = errors.pop() // for adding 'and' before the last error
    return "Password must " + (errors.length ? errors.join(", ") + ", and " + lastError : lastError)
  }

  return null
}

interface AccountSettingsProps {
  showDeleteModal?: boolean;
  setShowDeleteModal?: (show: boolean) => void;
  deleteCountdown?: number;
  setDeleteCountdown?: (countdown: number) => void;
  setDeletePasswordError?: (error: string) => void;
  deleteConfirmation?: string;
  setDeleteConfirmation?: (confirmation: string) => void;
  deletePassword?: string;
  setDeletePassword?: (password: string) => void;
  deletePasswordError?: string;
}

export default function AccountSettings({
  showDeleteModal,
  setShowDeleteModal,
  deleteCountdown,
  setDeleteCountdown,
  setDeletePasswordError,
  setDeleteConfirmation,
  setDeletePassword,
}: AccountSettingsProps) {
  const [changePasswordData, setChangePasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordValidations, setPasswordValidations] = useState({
    new: false,
    confirm: false,
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showDeleteModal && deleteCountdown && deleteCountdown > 0) {
      interval = setInterval(() => {
        setDeleteCountdown?.(deleteCountdown - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showDeleteModal, deleteCountdown, setDeleteCountdown]);

  const handlePasswordChange = (field: string, value: string) => {
    setChangePasswordData(prev => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear validations when user starts typing
    if (field === 'new_password') {
      setPasswordValidations(prev => ({ ...prev, new: false }));
    }
    if (field === 'confirm_password') {
      setPasswordValidations(prev => ({ ...prev, confirm: false }));
    }
  };

  const hasPasswordChanges = () => {
    return (
      changePasswordData.current_password.trim() !== '' ||
      changePasswordData.new_password.trim() !== '' ||
      changePasswordData.confirm_password.trim() !== ''
    );
  };

  const hasPasswordErrors = () => {
    return (
      passwordErrors.current !== '' ||
      passwordErrors.new !== '' ||
      passwordErrors.confirm !== ''
    );
  };

  const handleShowPasswordForm = () => {
    setShowPasswordForm(true);
    setMessage('');
    setPasswordErrors({ current: '', new: '', confirm: '' });
    setPasswordValidations({ new: false, confirm: false });
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordForm(false);
    setChangePasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setPasswordErrors({ current: '', new: '', confirm: '' });
    setPasswordValidations({ new: false, confirm: false });
    setMessage('');
  };

  const handlePasswordBlur = (field: string) => {
    // Validate on blur (when user leaves the field)
    if (field === 'new_password') {
      const value = changePasswordData.new_password;
      if (value.trim()) {
        // Check if new password is the same as current password
        if (value === changePasswordData.current_password) {
          setPasswordErrors(prev => ({ ...prev, new: 'New password cannot be the same as current password' }));
          setPasswordValidations(prev => ({ ...prev, new: false }));
          return;
        }
        
        const validation = validatePassword(value);
        setPasswordValidations(prev => ({ ...prev, new: !validation }));
        if (validation) {
          setPasswordErrors(prev => ({ ...prev, new: validation }));
        } else {
          // Clear error if password is now valid
          setPasswordErrors(prev => ({ ...prev, new: '' }));
        }
      } else {
        setPasswordValidations(prev => ({ ...prev, new: false }));
      }
    }

    if (field === 'confirm_password') {
      const value = changePasswordData.confirm_password;
      if (value.trim()) {
        const matches = value === changePasswordData.new_password;
        setPasswordValidations(prev => ({ ...prev, confirm: matches }));
        setPasswordErrors(prev => ({
          ...prev,
          confirm: matches ? '' : 'New passwords do not match'
        }));
      } else {
        setPasswordValidations(prev => ({ ...prev, confirm: false }));
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setPasswordErrors({ current: '', new: '', confirm: '' });

    // Client-side validation
    let hasErrors = false;
    const errors = { current: '', new: '', confirm: '' };

    // Check if current password is provided
    if (!changePasswordData.current_password.trim()) {
      errors.current = 'Current password is required';
      hasErrors = true;
    }

    // Check if new password is provided
    if (!changePasswordData.new_password.trim()) {
      errors.new = 'New password is required';
      hasErrors = true;
    } else {
      // Check if new password is the same as current password
      if (changePasswordData.new_password === changePasswordData.current_password) {
        errors.new = 'New password cannot be the same as current password';
        hasErrors = true;
      } else {
        // Validate new password format
        const passwordValidation = validatePassword(changePasswordData.new_password);
        if (passwordValidation) {
          errors.new = passwordValidation;
          hasErrors = true;
        }
      }
    }

    // Check if confirm password matches
    if (!changePasswordData.confirm_password.trim()) {
      errors.confirm = 'Please confirm your new password';
      hasErrors = true;
    } else if (changePasswordData.new_password !== changePasswordData.confirm_password) {
      errors.confirm = 'New passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setPasswordErrors(errors);
      return;
    }

    // Show confirmation modal
    setShowPasswordConfirmModal(true);
  };

  const handleConfirmPasswordChange = async () => {
    setShowPasswordConfirmModal(false);
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          current_password: changePasswordData.current_password,
          new_password: changePasswordData.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password changed successfully!');
        setChangePasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setPasswordErrors({ current: '', new: '', confirm: '' });
        setPasswordValidations({ new: false, confirm: false });
        setShowPasswordForm(false);

        // Update token if provided (session was invalidated)
        if (data.new_token) {
          localStorage.setItem('token', data.new_token);
        }
      } else {
        // Handle specific error messages from backend
        if (response.status === 401 && data.message?.includes('Current password is incorrect')) {
          setPasswordErrors(prev => ({ ...prev, current: 'Current password is incorrect' }));
        } else if (response.status === 400 && data.message?.includes('Password must')) {
          setPasswordErrors(prev => ({ ...prev, new: data.message }));
        } else {
          setMessage(data.message || 'Failed to change password');
        }
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      setMessage('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
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
            Account Settings
          </motion.h2>
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-emerald-200/70"
          >
            Manage your account security and preferences
          </motion.p>
        </div>
      </div>

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

      {/* Change Password Section */}
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
                <Lock className="w-6 h-6 text-emerald-400" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <p className="text-emerald-200/70">Update your account password securely</p>
              </div>
            </div>

            {!showPasswordForm ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShowPasswordForm}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white font-bold rounded-2xl hover:from-emerald-400 hover:via-green-400 hover:to-teal-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 transform shadow-xl hover:shadow-emerald-500/25"
                >
                  <span className="flex items-center space-x-2">
                    <Lock className="w-5 h-5" />
                    <span>Change Password</span>
                  </span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
              >
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-emerald-200 uppercase tracking-wider">
                      Current Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Lock className={`h-5 w-5 transition-colors duration-300 ${
                          passwordErrors.current ? 'text-red-400' : 'text-emerald-400/70 group-focus-within:text-emerald-400'
                        }`} />
                      </div>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="current_password"
                        value={changePasswordData.current_password}
                        onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                        className={`w-full pl-12 pr-14 py-4 rounded-2xl text-white placeholder-emerald-200/50 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 focus:border-transparent backdrop-blur-xl transition-all duration-500 text-lg ${
                          passwordErrors.current
                            ? 'bg-red-500/10 border-2 border-red-400/50 shadow-red-500/20'
                            : 'bg-gradient-to-r from-white/10 to-white/5 border-2 border-emerald-400/30 shadow-emerald-500/10'
                        }`}
                        placeholder="Enter current password"
                        required
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 hover:scale-110 transition-transform duration-300"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-emerald-300/70 hover:text-emerald-200 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-emerald-300/70 hover:text-emerald-200 transition-colors" />
                        )}
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {passwordErrors.current && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="flex items-start space-x-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 backdrop-blur-xl rounded-2xl p-4 border-2 border-red-400/30 shadow-red-500/20"
                        >
                          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-200/90 text-sm leading-relaxed font-medium">{passwordErrors.current}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-emerald-200 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        {passwordValidations.new ? (
                          <Check className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Lock className={`h-5 w-5 transition-colors duration-300 ${
                            passwordErrors.new ? 'text-red-400' : 'text-emerald-400/70 group-focus-within:text-emerald-400'
                          }`} />
                        )}
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="new_password"
                        value={changePasswordData.new_password}
                        onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                        onBlur={() => handlePasswordBlur('new_password')}
                        className={`w-full pl-12 pr-14 py-4 rounded-2xl text-white placeholder-emerald-200/50 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 focus:border-transparent backdrop-blur-xl transition-all duration-500 text-lg ${
                          passwordErrors.new
                            ? 'bg-red-500/10 border-2 border-red-400/50 shadow-red-500/20'
                            : passwordValidations.new
                            ? 'bg-emerald-500/10 border-2 border-emerald-400/50 shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-white/10 to-white/5 border-2 border-emerald-400/30 shadow-emerald-500/10'
                        }`}
                        placeholder="Enter new password"
                        required
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 hover:scale-110 transition-transform duration-300"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-emerald-300/70 hover:text-emerald-200 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-emerald-300/70 hover:text-emerald-200 transition-colors" />
                        )}
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {passwordErrors.new && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="flex items-start space-x-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 backdrop-blur-xl rounded-2xl p-4 border-2 border-red-400/30 shadow-red-500/20"
                        >
                          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-200/90 text-sm leading-relaxed font-medium">{passwordErrors.new}</p>
                        </motion.div>
                      )}
                      {passwordValidations.new && !passwordErrors.new && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="flex items-start space-x-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-2xl p-4 border-2 border-emerald-400/30 shadow-emerald-500/20"
                        >
                          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <p className="text-emerald-200/90 text-sm leading-relaxed font-medium">Password meets requirements</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-emerald-200 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        {passwordValidations.confirm ? (
                          <Check className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Lock className={`h-5 w-5 transition-colors duration-300 ${
                            passwordErrors.confirm ? 'text-red-400' : 'text-emerald-400/70 group-focus-within:text-emerald-400'
                          }`} />
                        )}
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirm_password"
                        value={changePasswordData.confirm_password}
                        onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                        onBlur={() => handlePasswordBlur('confirm_password')}
                        className={`w-full pl-12 pr-14 py-4 rounded-2xl text-white placeholder-emerald-200/50 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 focus:border-transparent backdrop-blur-xl transition-all duration-500 text-lg ${
                          passwordErrors.confirm
                            ? 'bg-red-500/10 border-2 border-red-400/50 shadow-red-500/20'
                            : passwordValidations.confirm
                            ? 'bg-emerald-500/10 border-2 border-emerald-400/50 shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-white/10 to-white/5 border-2 border-emerald-400/30 shadow-emerald-500/10'
                        }`}
                        placeholder="Confirm new password"
                        required
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 hover:scale-110 transition-transform duration-300"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-emerald-300/70 hover:text-emerald-200 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-emerald-300/70 hover:text-emerald-200 transition-colors" />
                        )}
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {passwordErrors.confirm && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="flex items-start space-x-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 backdrop-blur-xl rounded-2xl p-4 border-2 border-red-400/30 shadow-red-500/20"
                        >
                          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-200/90 text-sm leading-relaxed font-medium">{passwordErrors.confirm}</p>
                        </motion.div>
                      )}
                      {passwordValidations.confirm && !passwordErrors.confirm && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="flex items-start space-x-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-2xl p-4 border-2 border-emerald-400/30 shadow-emerald-500/20"
                        >
                          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <p className="text-emerald-200/90 text-sm leading-relaxed font-medium">Passwords match</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="flex space-x-4 pt-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleCancelPasswordChange}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-600/50 to-slate-700/50 hover:from-slate-500/50 hover:to-slate-600/50 text-white rounded-2xl transition-all duration-500 backdrop-blur-xl border-2 border-slate-400/30 hover:border-slate-300/40 shadow-lg hover:shadow-slate-500/20 font-semibold"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={saving || !hasPasswordChanges() || hasPasswordErrors()}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:via-green-400 hover:to-teal-400 text-white font-bold rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-emerald-500/30 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:ring-offset-2 focus:ring-offset-transparent"
                    >
                      {saving ? (
                        <div className="flex items-center justify-center space-x-3">
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Changing...</span>
                        </div>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <Check className="w-5 h-5" />
                          <span>Change Password</span>
                        </span>
                      )}
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
        <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-red-400/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-rose-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ duration: 0.3 }}
                className="p-3 bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-xl rounded-2xl border border-red-400/30 shadow-lg"
              >
                <Trash2 className="w-6 h-6 text-red-400" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">Danger Zone</h3>
                <p className="text-red-200/70">Permanently delete your account</p>
              </div>
            </div>
            <p className="text-red-200/80 mb-8 leading-relaxed">
              Once you delete your account, there is no going back. This action cannot be undone and will permanently remove all your data.
            </p>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowDeleteModal?.(true);
                setDeleteCountdown?.(5);
                setDeletePasswordError?.('');
                setDeleteConfirmation?.('');
                setDeletePassword?.('');
              }}
              className="px-8 py-4 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white font-bold rounded-2xl hover:from-red-400 hover:via-rose-400 hover:to-pink-400 focus:outline-none focus:ring-4 focus:ring-red-400/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-500 transform shadow-xl hover:shadow-red-500/25"
            >
              <span className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <span>Delete Account</span>
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Password Change Confirmation Modal */}
      <AnimatePresence>
        {showPasswordConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-2xl border-2 border-emerald-400/20 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center space-x-4 mb-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-2xl border border-emerald-400/30"
                >
                  <Lock className="w-6 h-6 text-emerald-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white">Confirm Password Change</h3>
              </div>

              <p className="text-emerald-200/80 mb-8 leading-relaxed">
                Are you sure you want to change your password? This action will log you out of all other devices for security.
              </p>

              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPasswordConfirmModal(false)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-600/50 to-slate-700/50 hover:from-slate-500/50 hover:to-slate-600/50 text-white rounded-2xl transition-all duration-500 backdrop-blur-xl border-2 border-slate-400/30 hover:border-slate-300/40 shadow-lg hover:shadow-slate-500/20 font-semibold"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmPasswordChange}
                  disabled={saving}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:via-green-400 hover:to-teal-400 text-white font-bold rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-emerald-500/30 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  {saving ? (
                    <div className="flex items-center justify-center space-x-3">
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Changing...</span>
                    </div>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <Check className="w-5 h-5" />
                      <span>Confirm Change</span>
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}