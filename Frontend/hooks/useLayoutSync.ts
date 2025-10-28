'use client'
import { useEffect, useCallback } from 'react'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useAuth } from '@/context/AuthContext'
import { LayoutSyncData } from '@/types/hooks'

export function useLayoutSync() {
  const { user } = useAuth()

  
  const { send, isConnected } = useWebSocketSubscription({
    messageTypes: ['layout_sync'],
    onMessage: (message) => {
      if (message.type === 'layout_sync' && message.data && message.from === user?.id) {
        
        const syncData: LayoutSyncData = message.data
        
        
        
        window.dispatchEvent(new CustomEvent('layoutSync', {
          detail: syncData
        }))
      }
    }
  })

  
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

    send(message)
  }, [isConnected, user, send])

  
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