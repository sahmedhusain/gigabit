'use client';

import { useState, useEffect } from 'react';
import { Shield, Trash2, Eye, EyeOff, Lock, Check, X, AlertTriangle, Clock } from 'lucide-react';
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

export default function AccountSettings() {
  const [changePasswordData, setChangePasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteCountdown, setDeleteCountdown] = useState(5);

  // Countdown timer for delete confirmation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showDeleteModal && deleteCountdown > 0) {
      interval = setInterval(() => {
        setDeleteCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showDeleteModal, deleteCountdown]);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE' || deleteCountdown > 0) {
      return;
    }

    setDeleting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
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
        setMessage(error.message || 'Failed to delete account');
        setShowDeleteModal(false);
        setDeleteConfirmation('');
        setDeleteCountdown(5);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      setMessage('Failed to delete account');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      setDeleteCountdown(5);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Account Settings</h2>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl backdrop-blur-xl border transition-all duration-300 ${
          message.includes('success')
            ? 'bg-green-500/20 border-green-400/30 text-green-100'
            : 'bg-red-500/20 border-red-400/30 text-red-100'
        }`}>
          {message}
        </div>
      )}

      {/* Change Password Section */}
      <div className="mb-8 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        
        {!showPasswordForm ? (
          <div className="flex justify-start">
            <button
              onClick={handleShowPasswordForm}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Change Password
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="current_password" className="block text-sm font-medium text-white/90">
                  Current Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    <Lock className={`h-4 w-4 transition-colors ${
                      passwordErrors.current ? 'text-red-400' : 'text-purple-400/70 group-focus-within:text-purple-400'
                    }`} />
                  </div>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="current_password"
                    value={changePasswordData.current_password}
                    onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                    className={`w-full pl-11 pr-12 py-3.5 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 ${
                      passwordErrors.current
                        ? 'bg-red-500/10 border border-red-400/50'
                        : 'bg-white/10 border border-white/20'
                    }`}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center z-10 hover:scale-110 transition-transform duration-200"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-white/70 hover:text-white/90 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/70 hover:text-white/90 transition-colors" />
                    )}
                  </button>
                </div>
                {passwordErrors.current && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                  >
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300/90 text-xs leading-relaxed">{passwordErrors.current}</p>
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="new_password" className="block text-sm font-medium text-white/90">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    {passwordValidations.new ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Lock className={`h-4 w-4 transition-colors ${
                        passwordErrors.new ? 'text-red-400' : 'text-purple-400/70 group-focus-within:text-purple-400'
                      }`} />
                    )}
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="new_password"
                    value={changePasswordData.new_password}
                    onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                    onBlur={() => handlePasswordBlur('new_password')}
                    className={`w-full pl-11 pr-12 py-3.5 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 ${
                      passwordErrors.new
                        ? 'bg-red-500/10 border border-red-400/50'
                        : passwordValidations.new
                        ? 'bg-emerald-500/10 border border-emerald-400/50'
                        : 'bg-white/10 border border-white/20'
                    }`}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center z-10 hover:scale-110 transition-transform duration-200"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-white/70 hover:text-white/90 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/70 hover:text-white/90 transition-colors" />
                    )}
                  </button>
                </div>
                {passwordErrors.new && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                  >
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300/90 text-xs leading-relaxed">{passwordErrors.new}</p>
                  </motion.div>
                )}
                {passwordValidations.new && !passwordErrors.new && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2 bg-emerald-500/10 backdrop-blur-sm rounded-xl p-3 border border-emerald-400/20"
                  >
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-300/90 text-xs leading-relaxed">Password meets requirements</p>
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm_password" className="block text-sm font-medium text-white/90">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    {passwordValidations.confirm ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Lock className={`h-4 w-4 transition-colors ${
                        passwordErrors.confirm ? 'text-red-400' : 'text-purple-400/70 group-focus-within:text-purple-400'
                      }`} />
                    )}
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm_password"
                    value={changePasswordData.confirm_password}
                    onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                    onBlur={() => handlePasswordBlur('confirm_password')}
                    className={`w-full pl-11 pr-12 py-3.5 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-xl transition-all duration-300 ${
                      passwordErrors.confirm
                        ? 'bg-red-500/10 border border-red-400/50'
                        : passwordValidations.confirm
                        ? 'bg-emerald-500/10 border border-emerald-400/50'
                        : 'bg-white/10 border border-white/20'
                    }`}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center z-10 hover:scale-110 transition-transform duration-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-white/70 hover:text-white/90 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/70 hover:text-white/90 transition-colors" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirm && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 border border-red-400/20"
                  >
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300/90 text-xs leading-relaxed">{passwordErrors.confirm}</p>
                  </motion.div>
                )}
                {passwordValidations.confirm && !passwordErrors.confirm && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2 bg-emerald-500/10 backdrop-blur-sm rounded-xl p-3 border border-emerald-400/20"
                  >
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-300/90 text-xs leading-relaxed">Passwords match</p>
                  </motion.div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 backdrop-blur-xl border border-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !hasPasswordChanges() || hasPasswordErrors()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105"
                >
                  {saving ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Changing...</span>
                    </div>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Delete Account Section */}
      <div className="p-6 bg-red-500/10 backdrop-blur-xl border border-red-400/20 rounded-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-red-500 to-red-700 rounded-lg">
            <Trash2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-red-300">Danger Zone</h3>
        </div>
        <p className="text-white/70 mb-6">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        <button
          onClick={() => {
            setShowDeleteModal(true);
            setDeleteCountdown(5);
          }}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Delete Account
        </button>
      </div>

      {/* Password Change Confirmation Modal */}
      {showPasswordConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Password Change</h3>
            </div>

            <p className="text-white/80 mb-6">
              Are you sure you want to change your password? This action will log you out of all other devices.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPasswordConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 backdrop-blur-xl border border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPasswordChange}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {saving ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Changing...</span>
                  </div>
                ) : (
                  'Confirm Change'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmation('');
              setDeletePassword('');
              setDeleteCountdown(5);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
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
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password..."
                      className="w-full px-3 py-2 bg-slate-800/50 border border-yellow-500/30 rounded-lg text-white placeholder-yellow-200/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 text-sm"
                    />
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
                      Type <strong className="text-yellow-300">"DELETE"</strong> to confirm:
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
    </div>
  );
}