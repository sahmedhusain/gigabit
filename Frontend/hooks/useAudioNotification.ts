'use client'
import { useState, useEffect, useCallback } from 'react'

export interface AudioNotificationOptions {
  volume?: number
  enabled?: boolean
  soundUrl?: string
  vibrationPattern?: number[]
}

export function useAudioNotification(options: AudioNotificationOptions = {}) {
  const {
    volume = 0.7,
    enabled = true,
    soundUrl = '/sounds/notification.mp3',
    vibrationPattern = [200, 100, 200]
  } = options

  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  // Initialize audio and check permissions
  useEffect(() => {
    // Check if audio is supported
    const audioSupported = typeof Audio !== 'undefined'
    setIsSupported(audioSupported)

    // Initialize audio
    if (audioSupported) {
      const audioElement = new Audio(soundUrl)
      audioElement.volume = volume
      audioElement.preload = 'auto'
      setAudio(audioElement)
    }

    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    return () => {
      if (audio) {
        audio.pause()
        audio.src = ''
      }
    }
  }, [soundUrl, volume])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return 'denied'
  }, [])

  const playSound = useCallback(async () => {
    if (!enabled || !audio || !isSupported) return

    try {
      // Reset audio to beginning
      audio.currentTime = 0
      await audio.play()
    } catch (error) {
      console.warn('Failed to play notification sound:', error)
    }
  }, [enabled, audio, isSupported])

  const vibrate = useCallback(() => {
    if (!enabled || !('vibrate' in navigator)) return

    try {
      navigator.vibrate(vibrationPattern)
    } catch (error) {
      console.warn('Failed to vibrate:', error)
    }
  }, [enabled, vibrationPattern])

  const showNotification = useCallback(async (
    title: string,
    options: {
      body?: string
      icon?: string
      badge?: string
      tag?: string
      requireInteraction?: boolean
      onClick?: () => void
    } = {}
  ) => {
    // Request permission if needed
    if (permission === 'default') {
      const newPermission = await requestPermission()
      if (newPermission !== 'granted') return
    }

    if (permission !== 'granted' || !('Notification' in window)) return

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/icon-192x192.png',
        tag: options.tag || 'default',
        requireInteraction: options.requireInteraction || false
      })

      if (options.onClick) {
        notification.onclick = options.onClick
      }

      // Auto close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      return notification
    } catch (error) {
      console.warn('Failed to show notification:', error)
    }
  }, [permission, requestPermission])

  const notify = useCallback(async (
    title: string,
    message?: string,
    options: {
      playSound?: boolean
      vibrate?: boolean
      showNotification?: boolean
      icon?: string
      onClick?: () => void
    } = {}
  ) => {
    const {
      playSound: shouldPlaySound = true,
      vibrate: shouldVibrate = true,
      showNotification: shouldShowNotification = true,
      icon,
      onClick
    } = options

    if (!enabled) return

    // Play sound
    if (shouldPlaySound) {
      await playSound()
    }

    // Vibrate
    if (shouldVibrate) {
      vibrate()
    }

    // Show browser notification
    if (shouldShowNotification) {
      await showNotification(title, {
        body: message,
        icon,
        onClick
      })
    }
  }, [enabled, playSound, vibrate, showNotification])

  const updateVolume = useCallback((newVolume: number) => {
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, newVolume))
    }
  }, [audio])

  return {
    isSupported,
    permission,
    notify,
    playSound,
    vibrate,
    showNotification,
    requestPermission,
    updateVolume
  }
}
