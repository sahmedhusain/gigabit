'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface BackgroundThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const BackgroundThemeContext = createContext<BackgroundThemeContextType | undefined>(undefined);

export function useBackgroundTheme() {
  const context = useContext(BackgroundThemeContext);
  if (context === undefined) {
    throw new Error('useBackgroundTheme must be used within a BackgroundThemeProvider');
  }
  return context;
}

interface BackgroundThemeProviderProps {
  children: ReactNode;
}

export default function BackgroundThemeProvider({ children }: BackgroundThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('backgroundTheme') || 'system';
    
    let appliedTheme: Theme;
    if (savedTheme === 'system') {
      // For system theme, detect system preference
      appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      appliedTheme = savedTheme as Theme;
    }
    
    setTheme(appliedTheme);
    setMounted(true);
  }, []);

  // Listen for system theme changes when using system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('backgroundTheme') || 'system';
    
    if (savedTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Apply theme to document when theme changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('backgroundTheme', theme);
    }
  }, [theme, mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <BackgroundThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </BackgroundThemeContext.Provider>
  );
}