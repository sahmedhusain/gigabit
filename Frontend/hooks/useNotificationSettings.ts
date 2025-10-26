'use client'
import { useState, useEffect, useCallback } from 'react'
import { SoundTheme, playNotificationSound } from '@/lib/notificationSounds'

export interface NotificationSettings {
  sound_enabled: boolean
  sound_theme: SoundTheme
  browser_push_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  muted_conversations: number[]
}

const DEFAULT_SETTINGS: NotificationSettings = {
  sound_enabled: true,
  sound_theme: 'classic',
  browser_push_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  muted_conversations: []
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (error) {
        console.warn('Failed to parse notification settings:', error)
      }
    }
    setLoaded(true)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('notificationSettings', JSON.stringify(settings))
    }
  }, [settings, loaded])

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const isInQuietHours = useCallback(() => {
    if (!settings.quiet_hours_enabled) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const [startHour, startMinute] = settings.quiet_hours_start.split(':').map(Number)
    const [endHour, endMinute] = settings.quiet_hours_end.split(':').map(Number)

    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute

    if (startTime <= endTime) {
      // Same day range (e.g., 08:00 to 22:00)
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Overnight range (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime
    }
  }, [settings.quiet_hours_enabled, settings.quiet_hours_start, settings.quiet_hours_end])

  const shouldPlaySound = useCallback((conversationId?: number) => {
    if (!settings.sound_enabled) return false
    if (isInQuietHours()) return false
    if (conversationId && settings.muted_conversations.includes(conversationId)) return false
    return true
  }, [settings.sound_enabled, settings.muted_conversations, isInQuietHours])

  const shouldShowBrowserNotification = useCallback(() => {
    return settings.browser_push_enabled && !isInQuietHours()
  }, [settings.browser_push_enabled, isInQuietHours])

  const showBrowserNotification = useCallback(async (title: string, body: string, icon?: string) => {
    if (!shouldShowBrowserNotification()) return

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          tag: 'social-network-notification',
          requireInteraction: false,
          silent: true // We handle sound separately
        })

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)

        return notification
      } else if (Notification.permission !== 'denied') {
        // Request permission if not already denied
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          return showBrowserNotification(title, body, icon)
        }
      }
    }
  }, [shouldShowBrowserNotification])

  const playNotification = useCallback(async (conversationId?: number, title?: string, body?: string, icon?: string) => {
    // Play sound if enabled
    if (shouldPlaySound(conversationId)) {
      try {
        await playNotificationSound(settings.sound_theme, 0.7)
      } catch (error) {
        console.warn('Failed to play notification sound:', error)
      }
    }

    // Show browser notification if enabled
    if (title && body) {
      try {
        await showBrowserNotification(title, body, icon)
      } catch (error) {
        console.warn('Failed to show browser notification:', error)
      }
    }
  }, [shouldPlaySound, settings.sound_theme, showBrowserNotification])

  return {
    settings,
    loaded,
    updateSettings,
    isInQuietHours,
    shouldPlaySound,
    playNotification,
    shouldShowBrowserNotification,
    showBrowserNotification
  }
}