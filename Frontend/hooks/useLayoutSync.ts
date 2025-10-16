'use client'
import { useEffect, useCallback } from 'react'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useAuth } from '@/context/AuthContext'

export interface LayoutSyncData {
  component: 'sidebar' | 'topbar' | 'navigation' | 'settings'
  action: 'update' | 'refresh' | 'toggle' | 'change'
  data: any
  timestamp: number
}

export function useLayoutSync() {
  const { user } = useAuth()

  // Subscribe to layout sync messages
  const { send, isConnected } = useWebSocketSubscription({
    messageTypes: ['layout_sync'],
    onMessage: (message) => {
      if (message.type === 'layout_sync' && message.data && message.from === user?.id) {
        // Only process layout sync messages from the same user (different tabs/windows)
        const syncData: LayoutSyncData = message.data
        
        console.log('Layout sync received:', syncData)
        
        // Dispatch a custom event that layout components can listen to
        window.dispatchEvent(new CustomEvent('layoutSync', {
          detail: syncData
        }))
      }
    }
  })

  // Function to broadcast layout changes to other tabs/windows
  const broadcastLayoutChange = useCallback((syncData: Omit<LayoutSyncData, 'timestamp'>) => {
    if (!isConnected || !user) return

    const message = {
      type: 'layout_sync' as const,
      from: user.id,
      data: {
        ...syncData,
        timestamp: Date.now()
      }
    }

    console.log('Broadcasting layout change:', message)
    send(message)
  }, [isConnected, user, send])

  // Helper functions for specific layout components
  const syncSidebarUpdate = useCallback((action: string, data?: any) => {
    broadcastLayoutChange({
      component: 'sidebar',
      action: action as any,
      data
    })
  }, [broadcastLayoutChange])

  const syncTopbarUpdate = useCallback((action: string, data?: any) => {
    broadcastLayoutChange({
      component: 'topbar',
      action: action as any,
      data
    })
  }, [broadcastLayoutChange])

  const syncNavigationUpdate = useCallback((action: string, data?: any) => {
    broadcastLayoutChange({
      component: 'navigation',
      action: action as any,
      data
    })
  }, [broadcastLayoutChange])

  const syncSettingsUpdate = useCallback((action: string, data?: any) => {
    broadcastLayoutChange({
      component: 'settings',
      action: action as any,
      data
    })
  }, [broadcastLayoutChange])

  // Hook to listen for layout sync events in components
  const useLayoutSyncListener = useCallback((
    component: string,
    callback: (data: LayoutSyncData) => void
  ) => {
    useEffect(() => {
      const handleLayoutSync = (event: CustomEvent<LayoutSyncData>) => {
        if (event.detail.component === component) {
          callback(event.detail)
        }
      }

      window.addEventListener('layoutSync', handleLayoutSync as EventListener)

      return () => {
        window.removeEventListener('layoutSync', handleLayoutSync as EventListener)
      }
    }, [callback, component])
  }, [])

  return {
    isConnected,
    broadcastLayoutChange,
    syncSidebarUpdate,
    syncTopbarUpdate,
    syncNavigationUpdate,
    syncSettingsUpdate,
    useLayoutSyncListener
  }
}

// Simple hook for components to listen to layout sync events
export function useLayoutSyncListener(
  component: 'sidebar' | 'topbar' | 'navigation' | 'settings',
  callback: (data: LayoutSyncData) => void
) {
  useEffect(() => {
    const handleLayoutSync = (event: CustomEvent<LayoutSyncData>) => {
      if (event.detail.component === component) {
        callback(event.detail)
      }
    }

    window.addEventListener('layoutSync', handleLayoutSync as EventListener)

    return () => {
      window.removeEventListener('layoutSync', handleLayoutSync as EventListener)
    }
  }, [callback, component])
}