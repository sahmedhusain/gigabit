'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function PrivacySettings() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const userData = await response.json();
        setIsPrivate(userData.is_private);
      }
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_private: !isPrivate }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setIsPrivate(updatedUser.is_private);
        setMessage('Privacy settings updated successfully!');
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      setMessage('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Privacy Settings</h2>
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

      <div className="space-y-6">
        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-3">Profile Visibility</h3>
          <p className="text-white/70 mb-6">
            Control who can see your profile and posts. When your profile is private, only approved followers can see your content.
          </p>

          <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
            <div>
              <h4 className="font-semibold text-white">{isPrivate ? 'Private Profile' : 'Public Profile'}</h4>
              <p className="text-sm text-white/60">
                {isPrivate
                  ? 'Only approved followers can see your profile and posts'
                  : 'Anyone can see your profile and posts'
                }
              </p>
            </div>

            <button
              onClick={handleTogglePrivacy}
              disabled={saving}
              aria-label={`Switch to ${isPrivate ? 'public' : 'private'} profile`}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent ${
                isPrivate ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  isPrivate ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
          <h4 className="font-semibold text-white mb-4">What happens when you change your privacy setting?</h4>
          <ul className="text-sm text-white/70 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-1">•</span>
              <span>Public: Anyone can see your profile, posts, and follow you</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-1">•</span>
              <span>Private: Only people you approve can follow you and see your content</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-1">•</span>
              <span>Existing followers will keep their access</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-1">•</span>
              <span>You can change this setting at any time</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}