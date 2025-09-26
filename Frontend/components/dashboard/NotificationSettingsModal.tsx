'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, Bell, Volume2, VolumeX, Mail, Smartphone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useConnectionStatus } from '@/hooks'

interface NotificationSettingsModalProps {
  show: boolean
  onClose: () => void
}

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  sound_enabled: boolean
  follow_requests: boolean
  group_invites: boolean
  event_notifications: boolean
  post_likes: boolean
  post_comments: boolean
  group_posts: boolean
  new_messages: boolean
}

export default function NotificationSettingsModal({ show, onClose }: NotificationSettingsModalProps) {
  const { user } = useAuth()
  const { isConnected } = useConnectionStatus()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    sound_enabled: true,
    follow_requests: true,
    group_invites: true,
    event_notifications: true,
    post_likes: true,
    post_comments: true,
    group_posts: true,
    new_messages: true
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPreferences = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || preferences)
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err)
    } finally {
      setLoading(false)
    }
  }, [user, preferences])

  useEffect(() => {
    if (show && user) {
      fetchPreferences()
    }
  }, [show, user, fetchPreferences])

  const savePreferences = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ preferences })
      })

      if (response.ok) {
        onClose()
      } else {
        console.error('Failed to save preferences')
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err)
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </h2>
            <div className="flex items-center space-x-3">
              <div className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </div>
              <button
                type="button"
                title="Close notification settings"
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {!isConnected && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                You are currently offline. Changes will be saved when connection is restored.
              </p>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* General Settings */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">
                  General
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-white text-sm">Email Notifications</span>
                    </div>
                    <button
                      onClick={() => updatePreference('email_notifications', !preferences.email_notifications)}
                      aria-label={`Turn ${preferences.email_notifications ? 'off' : 'on'} email notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.email_notifications ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.email_notifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span className="text-white text-sm">Push Notifications</span>
                    </div>
                    <button
                      onClick={() => updatePreference('push_notifications', !preferences.push_notifications)}
                      aria-label={`Turn ${preferences.push_notifications ? 'off' : 'on'} push notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.push_notifications ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.push_notifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {preferences.sound_enabled ? (
                        <Volume2 className="w-4 h-4 text-slate-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-white text-sm">Sound Effects</span>
                    </div>
                    <button
                      onClick={() => updatePreference('sound_enabled', !preferences.sound_enabled)}
                      aria-label={`Turn ${preferences.sound_enabled ? 'off' : 'on'} sound effects`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.sound_enabled ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Notifications */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">
                  Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Follow Requests</span>
                    <button
                      onClick={() => updatePreference('follow_requests', !preferences.follow_requests)}
                      aria-label={`Turn ${preferences.follow_requests ? 'off' : 'on'} follow request notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.follow_requests ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.follow_requests ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Group Invites</span>
                    <button
                      onClick={() => updatePreference('group_invites', !preferences.group_invites)}
                      aria-label={`Turn ${preferences.group_invites ? 'off' : 'on'} group invite notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.group_invites ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.group_invites ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Event Notifications</span>
                    <button
                      onClick={() => updatePreference('event_notifications', !preferences.event_notifications)}
                      aria-label={`Turn ${preferences.event_notifications ? 'off' : 'on'} event notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.event_notifications ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.event_notifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Notifications */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wide">
                  Content
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Post Likes</span>
                    <button
                      onClick={() => updatePreference('post_likes', !preferences.post_likes)}
                      aria-label={`Turn ${preferences.post_likes ? 'off' : 'on'} post like notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.post_likes ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.post_likes ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Post Comments</span>
                    <button
                      onClick={() => updatePreference('post_comments', !preferences.post_comments)}
                      aria-label={`Turn ${preferences.post_comments ? 'off' : 'on'} post comment notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.post_comments ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.post_comments ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Group Posts</span>
                    <button
                      onClick={() => updatePreference('group_posts', !preferences.group_posts)}
                      aria-label={`Turn ${preferences.group_posts ? 'off' : 'on'} group post notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.group_posts ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.group_posts ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">New Messages</span>
                    <button
                      onClick={() => updatePreference('new_messages', !preferences.new_messages)}
                      aria-label={`Turn ${preferences.new_messages ? 'off' : 'on'} new message notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.new_messages ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.new_messages ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700/50 bg-slate-800/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              disabled={saving || !isConnected}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                isConnected 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-gray-500 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? 'Saving...' : isConnected ? 'Save Settings' : 'Offline'}
            </button>
          </div>
          {!isConnected && (
            <p className="text-center text-slate-400 text-xs mt-2">
              Settings will be saved when connection is restored
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
