'use client'
import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'

const DEBUG = process.env.DEBUG;

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false)
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date>(new Date())
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  
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

  
  useEffect(() => {
    const handleOnline = async () => {
      const isConnected = await checkNetworkConnection()
      setIsOffline(!isConnected)
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine)
      
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      
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
