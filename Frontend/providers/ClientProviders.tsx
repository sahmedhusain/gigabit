'use client'

import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from "@emotion/react";
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';

import { ReactNode } from "react";
import { useEffect } from 'react';
import createEmotionCache from "@/lib/createEmotionCache";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { ToastProvider } from "@/context/ToastContext";
import { NotificationToastProvider } from "@/context/NotificationToastContext";
import { SidebarDataProvider } from "@/context/SidebarDataContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import NotificationToastContainer from "@/components/notifications/NotificationToastContainer";
import BackgroundThemeProvider from "@/providers/BackgroundThemeProvider";
import type { EmotionCache } from '@emotion/cache';


const clientSideEmotionCache = createEmotionCache();

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10b981', 
    },
    secondary: {
      main: '#14b8a6', 
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            transition: 'background 0.2s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 255, 255, 0.25)',
          },
        },
      },
    },
  },
});

interface ClientProvidersProps {
  children: ReactNode;
  emotionCache?: EmotionCache;
}

export default function ClientProviders({
  children,
  emotionCache = clientSideEmotionCache,
}: ClientProvidersProps) {
  useEffect(() => {
    
  }, []);

  
  useServerInsertedHTML(() => {
    const names = emotionCache?.inserted || {};
    const styles = Object.keys(names).map((name) => {
      const style = emotionCache?.inserted[name];
      if (style) {
        return (
          <style
            key={name}
            data-emotion={`${emotionCache?.key}-${name}`}
            dangerouslySetInnerHTML={{ __html: style }}
          />
        );
      }
      return null;
    });
    return <>{styles}</>;
  });

  return (
    <CacheProvider value={emotionCache}>
      <MUIThemeProvider theme={theme}>
        {/* <CssBaseline /> */}
        <ErrorBoundary>
          <BackgroundThemeProvider>
            <AuthProvider>
              <WebSocketProvider>
                <SidebarDataProvider>
                  <ToastProvider>
                    <NotificationToastProvider>
                      {children}
                      <NotificationToastContainer />
                    </NotificationToastProvider>
                  </ToastProvider>
                </SidebarDataProvider>
              </WebSocketProvider>
            </AuthProvider>
          </BackgroundThemeProvider>
        </ErrorBoundary>
      </MUIThemeProvider>
    </CacheProvider>
  );
}