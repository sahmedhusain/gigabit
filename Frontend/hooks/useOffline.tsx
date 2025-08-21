'use client'
import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false)
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date>(new Date())
  const checkIntervalRef = useRef<NodeJS.Timeout>()

  // Check network connectivity
  const checkNetworkConnection = async (): Promise<boolean> => {
    try {
      const isConnected = await api.checkConnection()
      setLastConnectionCheck(new Date())
      return isConnected
    } catch (error) {
      console.error('Network check failed:', error)
      return false
    }
  }

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Browser reported online')
      const isConnected = await checkNetworkConnection()
      setIsOffline(!isConnected)
    }

    const handleOffline = () => {
      console.log('Browser reported offline')
      setIsOffline(true)
    }

    // Initial check
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine)
      
      // Set up event listeners
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      // Periodic connectivity check (every 30 seconds)
      checkIntervalRef.current = setInterval(async () => {
        if (navigator.onLine) {
          const isConnected = await checkNetworkConnection()
          setIsOffline(!isConnected)
        }
      }, 30000)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  return {
    isOffline,
    isOnline: !isOffline,
    lastConnectionCheck,
    checkConnection: checkNetworkConnection
  }
}