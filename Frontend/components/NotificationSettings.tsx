'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Volume2, VolumeX, Smartphone, Clock, Moon, MessageSquare, Save, TestTube, Check, X, VolumeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useConnectionStatus } from '@/hooks';
import { playNotificationSound, SoundTheme } from '@/lib/notificationSounds';
import { api } from '@/lib/api';
import { ChatItem } from '@/types/chat';
import Image from 'next/image';

interface NotificationSettings {
  sound_enabled: boolean;
  sound_theme: SoundTheme;
  browser_push_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  muted_conversations: Array<{id: number, type: 'private' | 'group'}>;
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const { isConnected } = useConnectionStatus();
  const [settings, setSettings] = useState<NotificationSettings>({
    sound_enabled: true,
    sound_theme: 'classic',
    browser_push_enabled: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    muted_conversations: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [message, setMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [conversations, setConversations] = useState<ChatItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.getNotificationSettings();
      setSettings({
        sound_enabled: response.sound_enabled,
        sound_theme: response.sound_theme as SoundTheme,
        browser_push_enabled: response.browser_push_enabled,
        quiet_hours_enabled: response.quiet_hours_enabled,
        quiet_hours_start: response.quiet_hours_start,
        quiet_hours_end: response.quiet_hours_end,
        muted_conversations: response.muted_conversations || []
      });
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoadingConversations(true);
    try {
      const response = await api.getChats();
      setConversations(response.chats);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      // Don't show error message for conversations, just log it
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchConversations();
    }
  }, [user, fetchSettings, fetchConversations]);

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    setSaveStatus('saving');
    setMessage('');
    try {
      await api.updateNotificationSettings({
        sound_enabled: settings.sound_enabled,
        sound_theme: settings.sound_theme,
        browser_push_enabled: settings.browser_push_enabled,
        quiet_hours_enabled: settings.quiet_hours_enabled,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end,
        muted_conversations: settings.muted_conversations
      });

      // Also save to localStorage as backup
      localStorage.setItem('notificationSettings', JSON.stringify(settings));

      setMessage('Notification settings updated successfully!');
      setSaveStatus('saved');
      // reset saved state after a short delay so UI returns to normal
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setMessage('Failed to update notification settings');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testSoundTheme = async (theme: SoundTheme) => {
    if (testingSound) return;

    setTestingSound(true);
    try {
      await playNotificationSound(theme, 0.5);
    } catch (error) {
      console.warn('Failed to test sound:', error);
    } finally {
      setTimeout(() => setTestingSound(false), 1000);
    }
  };

  const toggleConversationMute = (conversationId: number, conversationType: 'private' | 'group') => {
    setSettings(prev => {
      const isMuted = prev.muted_conversations.some(muted => muted.id === conversationId && muted.type === conversationType);
      if (isMuted) {
        // Unmute: remove from muted list
        return {
          ...prev,
          muted_conversations: prev.muted_conversations.filter(muted => !(muted.id === conversationId && muted.type === conversationType))
        };
      } else {
        // Mute: add to muted list
        return {
          ...prev,
          muted_conversations: [...prev.muted_conversations, { id: conversationId, type: conversationType }]
        };
      }
    });
  };

  const hasChanges = () => {
    // Get saved settings from localStorage as backup
    const saved = localStorage.getItem('notificationSettings');
    if (!saved) return true; // If no saved settings, consider it as having changes

    try {
      const savedSettings = JSON.parse(saved);
      return (
        settings.sound_enabled !== savedSettings.sound_enabled ||
        settings.sound_theme !== savedSettings.sound_theme ||
        settings.browser_push_enabled !== savedSettings.browser_push_enabled ||
        settings.quiet_hours_enabled !== savedSettings.quiet_hours_enabled ||
        settings.quiet_hours_start !== savedSettings.quiet_hours_start ||
        settings.quiet_hours_end !== savedSettings.quiet_hours_end ||
        JSON.stringify(settings.muted_conversations) !== JSON.stringify(savedSettings.muted_conversations)
      );
    } catch {
      return true; // If parsing fails, consider it as having changes
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Header Section (matches other settings tabs) */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-3 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl border border-emerald-400/30 shadow-xl"
          >
            <Bell className="w-6 h-6 text-emerald-400" />
          </motion.div>
          <div>
            <motion.h2
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent"
            >
              Notification Settings
            </motion.h2>
            <motion.p
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-emerald-200/70"
            >
              Customize how and when you receive notifications
            </motion.p>
          </div>
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
          {/* Sound Settings */}
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
                    <Volume2 className="w-6 h-6 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Sound Notifications</h3>
                    <p className="text-emerald-200/70">Configure audio notifications and themes</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {settings.sound_enabled ? (
                        <Volume2 className="w-5 h-5 text-slate-400" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <span className="text-white font-medium">Enable Sound</span>
                        <p className="text-white/60 text-sm">Play sounds for new notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting('sound_enabled', !settings.sound_enabled)}
                      aria-label={`Turn ${settings.sound_enabled ? 'off' : 'on'} sound notifications`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.sound_enabled ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  {settings.sound_enabled && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-white font-medium">Sound Theme</label>
                          <motion.button
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => testSoundTheme(settings.sound_theme)}
                            disabled={testingSound}
                            className="px-3 py-1.5 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                          >
                            <TestTube className="w-3.5 h-3.5" />
                            {testingSound ? 'Testing...' : 'Test'}
                          </motion.button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {(['classic', 'soft', 'modern'] as SoundTheme[]).map((theme) => (
                            <motion.button
                              key={theme}
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => updateSetting('sound_theme', theme)}
                              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                settings.sound_theme === theme
                                  ? 'bg-emerald-500 text-white shadow-lg'
                                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                              }`}
                            >
                              {theme.charAt(0).toUpperCase() + theme.slice(1)}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Browser Push Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-blue-400/20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-blue-400/30 shadow-lg"
                  >
                    <Smartphone className="w-6 h-6 text-blue-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Browser Notifications</h3>
                    <p className="text-blue-200/70">Receive notifications even when the app is closed</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="text-white font-medium">Browser Push Notifications</span>
                      <p className="text-white/60 text-sm">Receive notifications even when the app is closed</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('browser_push_enabled', !settings.browser_push_enabled)}
                    aria-label={`Turn ${settings.browser_push_enabled ? 'off' : 'on'} browser push notifications`}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.browser_push_enabled ? 'bg-blue-500' : 'bg-slate-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.browser_push_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quiet Hours */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-500/20 via-slate-500/20 to-zinc-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-gray-400/20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-slate-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 bg-gradient-to-br from-gray-500/20 to-slate-500/20 backdrop-blur-xl rounded-2xl border border-gray-400/30 shadow-lg"
                  >
                    <Moon className="w-6 h-6 text-gray-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Quiet Hours</h3>
                    <p className="text-gray-200/70">Pause notifications during specified hours</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <div>
                        <span className="text-white font-medium">Enable Quiet Hours</span>
                        <p className="text-white/60 text-sm">Pause notifications during specified hours</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSetting('quiet_hours_enabled', !settings.quiet_hours_enabled)}
                      aria-label={`Turn ${settings.quiet_hours_enabled ? 'off' : 'on'} quiet hours`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.quiet_hours_enabled ? 'bg-gray-500' : 'bg-slate-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.quiet_hours_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  {settings.quiet_hours_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="quiet-hours-start" className="block text-white font-medium mb-2">Start Time</label>
                        <input
                          id="quiet-hours-start"
                          type="time"
                          value={settings.quiet_hours_start}
                          onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                          aria-label="Quiet hours start time"
                        />
                      </div>
                      <div>
                        <label htmlFor="quiet-hours-end" className="block text-white font-medium mb-2">End Time</label>
                        <input
                          id="quiet-hours-end"
                          type="time"
                          value={settings.quiet_hours_end}
                          onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                          aria-label="Quiet hours end time"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Conversation Muting */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-yellow-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-orange-400/20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl rounded-2xl border border-orange-400/30 shadow-lg"
                  >
                    <MessageSquare className="w-6 h-6 text-orange-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Conversation Muting</h3>
                    <p className="text-orange-200/70">Control notifications from specific conversations</p>
                  </div>
                </div>

                <div className="text-white/70">
                  <p>Mute specific conversations to stop receiving notifications from them.</p>
                  <p className="mt-2 text-white/50">Select conversations below to mute their notifications.</p>
                </div>

                <div className="mt-6 space-y-3">
                  {loadingConversations ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        className="w-6 h-6 border-2 border-orange-400/30 border-t-orange-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-white/50">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No conversations found</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => {
                      const isMuted = settings.muted_conversations.some(muted => muted.id === (conversation.conversationId || conversation.id) && muted.type === conversation.type);
                      
                      return (
                        <motion.div
                          key={conversation.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center justify-between p-4 rounded-2xl backdrop-blur-xl border-2 transition-all duration-300 ${
                            isMuted
                              ? 'bg-orange-500/10 border-orange-400/30'
                              : 'bg-white/5 border-white/10 hover:border-orange-400/30'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {(() => {
                                const avatarUrl = conversation.avatar || conversation.participant?.avatar || conversation.group?.avatar;
                                return avatarUrl ? (
                                  <Image
                                    src={avatarUrl}
                                    alt={conversation.name || conversation.participant?.first_name || 'Avatar'}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full border border-orange-400/30 object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full flex items-center justify-center border border-orange-400/30">
                                    <span className="text-orange-400 font-semibold text-sm">
                                      {conversation.type === 'group'
                                        ? (conversation.name || conversation.group?.title || 'G').charAt(0).toUpperCase()
                                        : (conversation.participant?.first_name || conversation.participant?.nickname || 'U').charAt(0).toUpperCase()
                                      }
                                    </span>
                                  </div>
                                );
                              })()}
                              {conversation.hasUnread && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-slate-800"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium truncate">
                                {conversation.name || conversation.participant?.first_name + ' ' + conversation.participant?.last_name || 'Unknown'}
                              </h4>
                              <p className="text-white/60 text-sm truncate">
                                {conversation.type === 'group' ? 'Group' : 'Private'}
                              </p>
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleConversationMute(conversation.conversationId || conversation.id, conversation.type)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                              isMuted
                                ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                          >
                            {isMuted ? (
                              <>
                                <VolumeOff className="w-4 h-4" />
                                <span className="text-sm font-medium">Muted</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Active</span>
                              </>
                            )}
                          </motion.button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.4 }}
            className="flex justify-end"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveSettings}
              disabled={saving || !isConnected || !hasChanges()}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:via-green-400 hover:to-teal-400 text-white font-bold rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-emerald-500/30 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              {saving ? (
                <div className="flex items-center justify-center space-x-3">
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Saving...</span>
                </div>
              ) : saveStatus === 'saved' ? (
                <span className="flex items-center space-x-2">
                  <Check className="w-5 h-5" />
                  <span>Saved!</span>
                </span>
              ) : isConnected && hasChanges() ? (
                <span className="flex items-center space-x-2">
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </span>
              ) : !hasChanges() ? (
                <span className="flex items-center space-x-2">
                  <Check className="w-5 h-5" />
                  <span>No Changes</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <X className="w-5 h-5" />
                  <span>Offline</span>
                </span>
              )}
            </motion.button>
          </motion.div>
      </div>
    </motion.div>
  );
}