'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette, Home, Check, Monitor, Moon, Sun, Globe, Users, Heart, Calendar, Search, User, UserPlus, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackgroundTheme } from '@/components/ui/BackgroundThemeProvider';

export default function AppearanceSettings() {
  const { setTheme: setBackgroundTheme } = useBackgroundTheme();
  const [defaultRoute, setDefaultRoute] = useState('/feed/all');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedThemePreference, setSelectedThemePreference] = useState('system');
  const messageRef = useRef<HTMLDivElement>(null);

  // Load saved settings on component mount
  useEffect(() => {
    const savedRoute = localStorage.getItem('defaultRoute');
    if (savedRoute) {
      setDefaultRoute(savedRoute);
    }
    
    const savedThemePreference = localStorage.getItem('backgroundTheme') || 'system';
    setSelectedThemePreference(savedThemePreference);
  }, []);

  // Listen for system theme changes to update the applied theme when system is selected
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (selectedThemePreference === 'system') {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        setBackgroundTheme(newSystemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Set initial system theme if system is selected
    if (selectedThemePreference === 'system') {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      setBackgroundTheme(systemTheme);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [selectedThemePreference, setBackgroundTheme]);

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
      localStorage.setItem('backgroundTheme', selectedThemePreference);
      localStorage.setItem('defaultRoute', defaultRoute);

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

  const handleThemeChange = (themeId: string) => {
    setSelectedThemePreference(themeId);
    
    if (themeId === 'system') {
      // For system theme, detect system preference and apply it
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setBackgroundTheme(systemTheme);
    } else {
      setBackgroundTheme(themeId as 'light' | 'dark');
    }
  };

  const hasChanges = () => {
    const savedRoute = localStorage.getItem('defaultRoute') || '/feed/all';
    const savedTheme = localStorage.getItem('backgroundTheme') || 'system';
    return defaultRoute !== savedRoute || selectedThemePreference !== savedTheme;
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
          <Palette className="w-6 h-6 text-emerald-400" />
        </motion.div>
        <div>
          <motion.h2
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent"
          >
            Appearance
          </motion.h2>
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-emerald-200/70"
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

      {/* Background Theme Section */}
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
                <Palette className="w-6 h-6 text-emerald-400" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">Background Theme</h3>
                <p className="text-emerald-200/70">Choose your preferred visual theme</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {backgroundThemes.map((theme) => {
                const Icon = theme.icon;
                const isSelected = selectedThemePreference === theme.id;
                const currentSystemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

                return (
                  <motion.button
                    key={theme.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`relative p-6 rounded-2xl backdrop-blur-xl border-2 transition-all duration-500 ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border-emerald-400/50 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                        : 'bg-white/5 border-white/10 hover:border-emerald-400/30 hover:bg-emerald-500/10'
                    }`}
                  >
                      <div className="flex flex-col items-center space-y-4">
                        <div className={`relative p-4 rounded-2xl transition-all duration-300 ${
                          isSelected ? 'bg-emerald-500/20' : 'bg-white/10'
                        }`}>
                          <Icon className={`w-8 h-8 transition-colors ${
                            isSelected ? 'text-emerald-400' : 'text-white/80'
                          }`} />
                          {theme.id === 'system' && (
                            <div className="absolute -top-1 -left-1 p-1 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-full shadow-lg">
                              {currentSystemTheme === 'dark' ? (
                                <Moon className="w-3 h-3 text-blue-400" />
                              ) : (
                                <Sun className="w-3 h-3 text-yellow-400" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-center">
                          <h4 className={`font-bold text-sm transition-colors ${
                            isSelected ? 'text-emerald-200' : 'text-white/90'
                          }`}>
                            {theme.name}
                          </h4>
                          <p className={`text-xs mt-1 transition-colors ${
                            isSelected ? 'text-emerald-300/70' : 'text-white/60'
                          }`}>
                            {theme.description}
                          </p>
                        </div>
                      </div>                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 p-1 bg-emerald-500 rounded-full"
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
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
        <div className="relative p-8 bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-2xl border-2 border-green-400/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full translate-y-6 -translate-x-6"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                transition={{ duration: 0.3 }}
                className="p-3 bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl border border-green-400/30 shadow-lg"
              >
                <Home className="w-6 h-6 text-green-400" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">Default Home</h3>
                <p className="text-green-200/70">Choose where you land when you open the app</p>
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
                        ? 'bg-gradient-to-r from-green-500/20 via-blue-500/20 to-cyan-500/20 border-green-400/50 shadow-xl shadow-green-500/20'
                        : 'bg-white/5 border-white/10 hover:border-green-400/30 hover:bg-green-500/10'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isSelected ? 'bg-green-500/20' : 'bg-white/10'
                      }`}>
                        <route.icon className={`w-5 h-5 transition-colors ${
                          isSelected ? 'text-green-400' : 'text-white/80'
                        }`} />
                      </div>

                      <div className="flex-1 text-left">
                        <h4 className={`font-bold text-sm transition-colors ${
                          isSelected ? 'text-green-200' : 'text-white/90'
                        }`}>
                          {route.name}
                        </h4>
                        <p className={`text-xs mt-1 transition-colors ${
                          isSelected ? 'text-green-300/70' : 'text-white/60'
                        }`}>
                          {route.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 bg-green-500 rounded-full"
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