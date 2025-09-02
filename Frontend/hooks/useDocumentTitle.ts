'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

export interface DocumentTitleOptions {
  separator?: string
  includeUnreadCount?: boolean
  maxUnreadDisplay?: number
  template?: string
  showFavicon?: boolean
}

export function useDocumentTitle(
  baseTitle: string = 'Social Network',
  options: DocumentTitleOptions = {}
) {
  const {
    separator = ' | ',
    includeUnreadCount = true,
    maxUnreadDisplay = 99,
    template = '{unread} {title}',
    showFavicon = true
  } = options

  const [unreadCount, setUnreadCount] = useState(0)
  const [currentPage, setCurrentPage] = useState('')
  const [isVisible, setIsVisible] = useState(true)
  const originalFavicon = useRef<string>('')

  // Store original favicon
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (favicon) {
      originalFavicon.current = favicon.href
    }
  }, [])

  // Monitor page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Update document title
  useEffect(() => {
    let title = baseTitle
    
    if (currentPage) {
      title = `${currentPage}${separator}${baseTitle}`
    }
    
    if (includeUnreadCount && unreadCount > 0 && !isVisible) {
      const displayCount = unreadCount > maxUnreadDisplay ? `${maxUnreadDisplay}+` : unreadCount.toString()
      title = template
        .replace('{unread}', `(${displayCount})`)
        .replace('{title}', title)
    }
    
    document.title = title
  }, [baseTitle, currentPage, unreadCount, isVisible, includeUnreadCount, maxUnreadDisplay, template, separator])

  // Update favicon for unread notifications
  useEffect(() => {
    if (!showFavicon) return

    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (!favicon) return

    if (unreadCount > 0 && !isVisible) {
      // Create a canvas to draw notification badge
      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Draw red circle
        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.arc(16, 16, 14, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw count text
        ctx.fillStyle = 'white'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        const text = unreadCount > 9 ? '9+' : unreadCount.toString()
        ctx.fillText(text, 16, 16)
        
        favicon.href = canvas.toDataURL('image/png')
      }
    } else {
      favicon.href = originalFavicon.current
    }
  }, [unreadCount, isVisible, showFavicon])

  const setPageTitle = useCallback((title: string) => {
    setCurrentPage(title)
  }, [])

  const setUnread = useCallback((count: number) => {
    setUnreadCount(Math.max(0, count))
  }, [])

  const incrementUnread = useCallback((increment: number = 1) => {
    setUnreadCount(prev => prev + increment)
  }, [])

  const clearUnread = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return {
    unreadCount,
    currentPage,
    isVisible,
    setPageTitle,
    setUnread,
    incrementUnread,
    clearUnread
  }
}
