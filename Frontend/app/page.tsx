'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Homepage from '@/components/homepage/Homepage';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { Zap, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);
  const [isFreshLogin, setIsFreshLogin] = useState(false);

  // Detect theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('backgroundTheme') || 'system';
    
    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    } else {
      setTheme(savedTheme as 'light' | 'dark');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('backgroundTheme') || 'system';
      if (savedTheme === 'system') {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check if this is a fresh login/registration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const freshLogin = sessionStorage.getItem('freshLogin') === 'true';
      setIsFreshLogin(freshLogin);
    }
  }, []);

  // Ensure minimum loading time of 2 seconds for fresh logins
  useEffect(() => {
    if (isFreshLogin) {
      const timer = setTimeout(() => {
        setMinLoadingTimePassed(true);
        // Clear the fresh login flag
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('freshLogin');
        }
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setMinLoadingTimePassed(true);
    }
  }, [isFreshLogin]);

  useEffect(() => {
    if (!isLoading && user && minLoadingTimePassed) {
      // Get the user's preferred default route, fallback to /feed/all
      const defaultRoute = localStorage.getItem('defaultRoute') || '/feed/all';
      router.push(defaultRoute);
    }
  }, [user, isLoading, minLoadingTimePassed, router]);

  if (isFreshLogin && (isLoading || !minLoadingTimePassed)) {
    const isDark = theme === 'dark';
    
    return (
      <div className={`fixed inset-0 h-screen w-screen overflow-hidden transition-colors duration-500 fullscreen-container ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50'
      }`}>
        <AnimatedBackground />
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          {/* Enhanced Logo Section */}
          <div className="mb-12 transform animate-fade-in">
            <div className={`relative p-8 rounded-3xl backdrop-blur-xl border-2 shadow-2xl transition-all duration-500 ${
              isDark
                ? 'bg-white/5 border-white/10 shadow-slate-500/20'
                : 'bg-white/80 border-white/20 shadow-blue-500/20'
            }`}>
              {/* Animated background glow */}
              <div className={`absolute inset-0 rounded-3xl blur-xl opacity-30 animate-pulse ${
                isDark
                  ? 'bg-gradient-to-r from-slate-500/20 via-pink-500/20 to-cyan-500/20'
                  : 'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20'
              }`}></div>
              
              <div className="relative flex flex-col items-center space-y-6">
                {/* Logo Image */}
                <div className="relative h-20 w-48 transform hover:scale-105 transition-transform duration-300">
                  <Image
                    src="/logo.png"
                    alt="Gigabit Logo"
                    fill
                    sizes="192px"
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
                
                {/* Brand Tagline */}
                <div className={`flex items-center space-x-3 px-4 py-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white/80'
                    : 'bg-white/60 border-white/30 text-gray-700'
                }`}>
                  <Zap className={`w-4 h-4 animate-pulse ${
                    isDark ? 'text-yellow-400' : 'text-yellow-500'
                  }`} />
                  <span className="text-sm font-medium">Social Network</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Loading Animation */}
          <div className="mb-8 transform animate-fade-in delay-200">
            <div className="relative">
              {/* Main spinner */}
              <div className={`animate-spin rounded-full h-20 w-20 border-4 mx-auto shadow-lg transition-all duration-500 ${
                isDark
                  ? 'border-slate-400/30 border-t-slate-400 shadow-slate-500/25'
                  : 'border-blue-400/30 border-t-blue-500 shadow-blue-500/25'
              }`}></div>
              
              {/* Secondary spinner */}
              <div className={`absolute inset-0 animate-spin rounded-full h-20 w-20 border-4 mx-auto border-transparent transition-all duration-500 ${
                isDark ? 'border-t-pink-400' : 'border-t-cyan-500'
              }`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              
              {/* Inner pulse */}
              <div className={`absolute inset-3 animate-pulse rounded-full transition-all duration-500 ${
                isDark
                  ? 'bg-gradient-to-r from-slate-400/20 to-pink-400/20'
                  : 'bg-gradient-to-r from-blue-400/20 to-cyan-400/20'
              }`}></div>
              
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className={`w-6 h-6 animate-spin transition-colors duration-500 ${
                  isDark ? 'text-slate-400' : 'text-blue-500'
                }`} />
              </div>
            </div>
          </div>

          {/* Enhanced Loading Text */}
          <div className="space-y-3 text-center transform animate-fade-in delay-300">
            <h2 className={`text-2xl font-bold transition-colors duration-500 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              Loading your experience
            </h2>
            <p className={`text-lg transition-colors duration-500 ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              Preparing everything just for you...
            </p>
          </div>

          {/* Enhanced Progress Animation */}
          <div className="mt-8 transform animate-fade-in delay-500">
            <div className="flex space-x-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    isDark
                      ? 'bg-gradient-to-r from-slate-400 to-pink-400'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}
                  style={{
                    animation: `bounce 1.4s ease-in-out ${index * 0.16}s infinite both`
                  }}
                ></div>
              ))}
            </div>
            
            {/* Progress bar */}
            <div className={`mt-6 w-64 h-1 rounded-full overflow-hidden backdrop-blur-sm transition-all duration-500 ${
              isDark ? 'bg-white/10' : 'bg-white/30'
            }`}>
              <div className={`h-full rounded-full animate-progress transition-all duration-1000 ease-out ${
                isDark
                  ? 'bg-gradient-to-r from-slate-400 to-pink-400'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}></div>
            </div>
          </div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 rounded-full opacity-20 animate-ping floating-particle ${
                  isDark ? 'bg-slate-400' : 'bg-blue-400'
                }`}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${2 + i * 0.5}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show homepage for non-authenticated users
  if (!user) {
    return <Homepage />;
  }

  // This should not be reached due to the useEffect redirect, but just in case
  return null;
}