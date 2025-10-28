'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Theme, BackgroundThemeContextType, BackgroundThemeProviderProps } from '@/types/ui';

const BackgroundThemeContext = createContext<BackgroundThemeContextType | undefined>(undefined);

export function useBackgroundTheme() {
  const context = useContext(BackgroundThemeContext);
  if (context === undefined) {
    throw new Error('useBackgroundTheme must be used within a BackgroundThemeProvider');
  }
  return context;
}

export default function BackgroundThemeProvider({ children }: BackgroundThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  
  useEffect(() => {
    const savedTheme = localStorage.getItem('backgroundTheme') || 'system';
    
    let appliedTheme: Theme;
    if (savedTheme === 'system') {
      
      appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      appliedTheme = savedTheme as Theme;
    }
    
    setTheme(appliedTheme);
    setMounted(true);
  }, []);

  
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

  
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('backgroundTheme', theme);
    }
  }, [theme, mounted]);

  
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <BackgroundThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </BackgroundThemeContext.Provider>
  );
}