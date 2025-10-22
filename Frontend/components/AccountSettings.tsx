'use client';

import { useState } from 'react';
import { Shield, Trash2 } from 'lucide-react';

export default function AccountSettings() {
  const [changePasswordData, setChangePasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (changePasswordData.new_password !== changePasswordData.confirm_password) {
      setMessage('New passwords do not match');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: changePasswordData.current_password,
          new_password: changePasswordData.new_password,
        }),
      });

      if (response.ok) {
        setMessage('Password changed successfully!');
        setChangePasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      setMessage('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage('Please enter your password to confirm deletion');
      return;
    }

    setDeleting(true);
    setMessage('');

    try {
      const deleteResponse = await fetch('/api/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (deleteResponse.ok) {
        setMessage('Account deleted successfully. You will be logged out.');
        // Redirect to login or home page
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        const error = await deleteResponse.json();
        setMessage(error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      setMessage('Failed to delete account');
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
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="current_password" className="block text-sm font-medium text-white/90">
              Current Password
            </label>
            <input
              type="password"
              id="current_password"
              value={changePasswordData.current_password}
              onChange={(e) => setChangePasswordData(prev => ({ ...prev, current_password: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-xl transition-all duration-300"
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="new_password" className="block text-sm font-medium text-white/90">
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              value={changePasswordData.new_password}
              onChange={(e) => setChangePasswordData(prev => ({ ...prev, new_password: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-xl transition-all duration-300"
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm_password" className="block text-sm font-medium text-white/90">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              value={changePasswordData.confirm_password}
              onChange={(e) => setChangePasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-xl transition-all duration-300"
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Changing...</span>
                </div>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
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

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="delete_password" className="block text-sm font-medium text-white/90">
                Enter your password to confirm deletion
              </label>
              <input
                type="password"
                id="delete_password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent backdrop-blur-xl transition-all duration-300"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {deleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Confirm Delete'
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}