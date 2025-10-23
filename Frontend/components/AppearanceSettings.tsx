'use client';

import { useState, useEffect, useRef } from 'react';
import { Palette, Home, Check, Monitor, Moon, Sun, Globe, Users, Heart, Calendar, Search, User, UserPlus, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AppearanceSettingsProps {}

export default function AppearanceSettings({}: AppearanceSettingsProps) {
  const [backgroundTheme, setBackgroundTheme] = useState('light');
  const [defaultRoute, setDefaultRoute] = useState('/feed/all');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const messageRef = useRef<HTMLDivElement>(null);

  // Load saved preferences on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('backgroundTheme') || 'light';
    const savedRoute = localStorage.getItem('defaultRoute') || '/feed/all';
    setBackgroundTheme(savedTheme);
    setDefaultRoute(savedRoute);
  }, []);

  const backgroundThemes = [
    {
      id: 'dark',
      name: 'Dark',
      description: 'Deep space theme with dark backgrounds',
      icon: Moon
    },
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: Sun
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follow your system preference',
      icon: Monitor
    }
  ];

  const defaultRoutes = [
    {
      id: '/feed/all',
      name: 'Public Feed',
      description: 'See all public posts from everyone',
      icon: Globe
    },
    {
      id: '/feed/following',
      name: 'Following',
      description: 'Posts from people you follow',
      icon: Users
    },
    {
      id: '/feed/friends',
      name: 'Friends',
      description: 'Posts from your friends only',
      icon: Heart
    },
    {
      id: '/events/all',
      name: 'All Events',
      description: 'Browse all available events',
      icon: Calendar
    },
    {
      id: '/discover',
      name: 'Discover',
      description: 'Explore new content and people',
      icon: Search
    },
    {
      id: '/profile/me',
      name: 'My Profile',
      description: 'View and manage your own profile',
      icon: User
    },
    {
      id: '/discover/requests',
      name: 'Requests',
      description: 'Manage your requests',
      icon: UserPlus
    },
    {
      id: '/notifications',
      name: 'Notifications',
      description: 'View your notifications',
      icon: Bell
    }
  ];

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Save to localStorage
      localStorage.setItem('backgroundTheme', backgroundTheme);
      localStorage.setItem('defaultRoute', defaultRoute);

      // Apply theme immediately
      applyTheme(backgroundTheme);

      setMessage('Appearance settings saved successfully!');
      
      // Scroll to the message after a brief delay to ensure it's rendered
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings');
      
      // Scroll to the message after a brief delay to ensure it's rendered
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: string) => {
    // This would typically update CSS variables or apply theme classes
    // For now, we'll just save the preference
    document.documentElement.setAttribute('data-theme', theme);
  };

  const hasChanges = () => {
    const savedTheme = localStorage.getItem('backgroundTheme') || 'light';
    const savedRoute = localStorage.getItem('defaultRoute') || '/feed/all';
    return backgroundTheme !== savedTheme || defaultRoute !== savedRoute;
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
          className="p-3 bg-gradient-to-br from-purple-500/20 via-violet-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl border border-purple-400/30 shadow-xl"
        >
          <Palette className="w-6 h-6 text-purple-400" />
        </motion.div>
        <div>
          <motion.h2
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent"
          >
            Appearance
          </motion.h2>
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-purple-200/70"
          >
            Customize your visual experience and default navigation
          </motion.p>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            ref={messageRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`p-6 rounded-2xl backdrop-blur-xl border-2 shadow-2xl transition-all duration-500 ${
              message.includes('success')
                ? 'bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-indigo-500/20 border-purple-400/40 text-purple-100 shadow-purple-500/20'
                : 'bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20 border-red-400/40 text-red-100 shadow-red-500/20'
            }`}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: message.includes('success') ? 360 : 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`p-2 rounded-xl ${
                  message.includes('success')
                    ? 'bg-purple-500/20'
                    : 'bg-red-500/20'
                }`}
              >
                {message.includes('success') ? (
                  <Check className="w-5 h-5 text-purple-400" />
                ) : (
                  <X className="w-5 h-5 text-red-400" />
                )}
              </motion.div>
              <span className="font-semibold">{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Theme Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
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
                <Palette className="w-6 h-6 text-purple-400" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">Background Theme</h3>
                <p className="text-purple-200/70">Choose your preferred visual theme</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {backgroundThemes.map((theme) => {
                const Icon = theme.icon;
                const isSelected = backgroundTheme === theme.id;

                return (
                  <motion.button
                    key={theme.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setBackgroundTheme(theme.id)}
                    className={`relative p-6 rounded-2xl backdrop-blur-xl border-2 transition-all duration-500 ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-500/20 via-violet-500/20 to-indigo-500/20 border-purple-400/50 shadow-xl shadow-purple-500/20 scale-[1.02]'
                        : 'bg-white/5 border-white/10 hover:border-purple-400/30 hover:bg-purple-500/10'
                    }`}
                  >
                      <div className="flex flex-col items-center space-y-4">
                        <div className={`p-4 rounded-2xl transition-all duration-300 ${
                          isSelected ? 'bg-purple-500/20' : 'bg-white/10'
                        }`}>
                          <Icon className={`w-8 h-8 transition-colors ${
                            isSelected ? 'text-purple-400' : 'text-white/80'
                          }`} />
                        </div>

                        <div className="text-center">
                          <h4 className={`font-bold text-sm transition-colors ${
                            isSelected ? 'text-purple-200' : 'text-white/90'
                          }`}>
                            {theme.name}
                          </h4>
                          <p className={`text-xs mt-1 transition-colors ${
                            isSelected ? 'text-purple-300/70' : 'text-white/60'
                          }`}>
                            {theme.description}
                          </p>
                        </div>
                      </div>                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 p-1 bg-purple-500 rounded-full"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Default Route Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
        <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-indigo-400/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ duration: 0.3 }}
                className="p-3 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl border border-indigo-400/30 shadow-lg"
              >
                <Home className="w-6 h-6 text-indigo-400" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">Default Home</h3>
                <p className="text-indigo-200/70">Choose where you land when you open the app</p>
              </div>
            </div>

            <div className="space-y-3">
              {defaultRoutes.map((route) => {
                const isSelected = defaultRoute === route.id;

                return (
                  <motion.button
                    key={route.id}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setDefaultRoute(route.id)}
                    className={`relative w-full p-4 rounded-2xl backdrop-blur-xl border-2 transition-all duration-500 ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-cyan-500/20 border-indigo-400/50 shadow-xl shadow-indigo-500/20'
                        : 'bg-white/5 border-white/10 hover:border-indigo-400/30 hover:bg-indigo-500/10'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isSelected ? 'bg-indigo-500/20' : 'bg-white/10'
                      }`}>
                        <route.icon className={`w-5 h-5 transition-colors ${
                          isSelected ? 'text-indigo-400' : 'text-white/80'
                        }`} />
                      </div>

                      <div className="flex-1 text-left">
                        <h4 className={`font-bold text-sm transition-colors ${
                          isSelected ? 'text-indigo-200' : 'text-white/90'
                        }`}>
                          {route.name}
                        </h4>
                        <p className={`text-xs mt-1 transition-colors ${
                          isSelected ? 'text-indigo-300/70' : 'text-white/60'
                        }`}>
                          {route.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 bg-indigo-500 rounded-full"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="flex justify-end"
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveSettings}
          disabled={saving || !hasChanges()}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 hover:from-purple-400 hover:via-violet-400 hover:to-indigo-400 text-white font-bold rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-purple-500/30 focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:ring-offset-2 focus:ring-offset-transparent"
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
          ) : (
            <span className="flex items-center space-x-2">
              <Check className="w-5 h-5" />
              <span>Save Changes</span>
            </span>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}