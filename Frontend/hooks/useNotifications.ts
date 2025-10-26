'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type NotificationResponse } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useNotificationSettings } from './useNotificationSettings'

export function useNotifications() {
  const { error, success } = useToast()
  const { playNotification } = useNotificationSettings()
  const [items, setItems] = useState<NotificationResponse[]>([])
  const [unread, setUnread] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 20

  const fetchNotifications = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setLoading(true)
        setOffset(0)
      } else {
        setLoadingMore(true)
      }
      
      const currentOffset = reset ? 0 : offset
      const res = await api.getNotifications(limit, currentOffset)
      const data = Array.isArray(res.data) ? res.data : []
      
      if (reset) {
        setItems(data)
      } else {
        setItems(prev => [...prev, ...data])
      }
      
      // Update hasMore based on whether we got a full page
      setHasMore(data.length === limit)
      
      // Update offset for next fetch
      if (!reset) {
        setOffset(prev => prev + limit)
      }
      
      // Fetch unread count from backend instead of calculating locally
      try {
        const unreadRes = await api.getUnreadNotificationCount()
        setUnread(unreadRes.unread_count)
      } catch (unreadErr) {
        // Fallback to local calculation if API call fails
        setUnread(data.filter(n => !n.is_read).length)
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to load notifications'
      setErr(msg)
      error('Failed to load notifications.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [error, offset, limit])

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNotifications(false)
    }
  }, [fetchNotifications, loadingMore, hasMore])

  const markAllAsReadLocal = useCallback(async () => {
    try {
      // Optimistically update local state
      setItems(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
      
      // Call API to mark all as read on server
      await api.markAllNotificationsAsRead()
      success('All notifications marked as read')
    } catch (e: any) {
      console.error('Failed to mark all as read:', e)
      error('Failed to mark all notifications as read')
      // Revert optimistic update
      fetchNotifications()
    }
  }, [fetchNotifications, success, error])

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      // Optimistically update local state
      setItems(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnread(prev => Math.max(0, prev - 1))
      
      // Call API to mark as read on server
      await api.markNotificationAsRead([notificationId])
    } catch (e: any) {
      console.error('Failed to mark notification as read:', e)
      error('Failed to mark notification as read')
      // Revert optimistic update
      fetchNotifications()
    }
  }, [fetchNotifications, error])

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      // Optimistically update local state
      const notificationToDelete = items.find(n => n.id === notificationId)
      setItems(prev => prev.filter(n => n.id !== notificationId))
      
      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnread(prev => Math.max(0, prev - 1))
      }
      
      // Call API to delete notification on server
      await api.deleteNotification(notificationId)
      
      success('Notification deleted')
    } catch (e: any) {
      console.error('Failed to delete notification:', e)
      error('Failed to delete notification')
      // Revert optimistic update
      fetchNotifications()
    }
  }, [items, success, error, fetchNotifications])

  // Enhanced realtime listener with different notification types
  const { isConnected } = useWebSocketSubscription({
    messageTypes: ['notification'],
    onMessage: (msg) => {
      if (msg.type === 'notification' && msg.data) {
        // msg.data should be a complete NotificationResponse from the backend
        const notification = msg.data as NotificationResponse
        
        // Only add if it has a valid ID (from backend)
        if (notification.id && notification.id > 0) {
          setItems(prev => {
            // Check if notification already exists to avoid duplicates
            const exists = prev.some(n => n.id === notification.id)
            if (exists) return prev
            
            return [notification, ...prev]
          })
          setUnread(u => u + 1)
          
          // Play notification sound and show browser notification for new notifications
          const actorName = notification.actor ? `${notification.actor.first_name} ${notification.actor.last_name}` : 'Someone';
          playNotification(undefined, actorName, notification.message)
        }
      }
    }
  })

  useEffect(() => {
    fetchNotifications(true)
  }, [])

  return useMemo(() => ({
    items,
    unread,
    loading,
    loadingMore,
    hasMore,
    error: err,
    isConnected,
    refetch: () => fetchNotifications(true),
    loadMore,
    markAllAsReadLocal,
    markAsRead,
    deleteNotification,
    notify: success,
  }), [items, unread, loading, loadingMore, hasMore, err, isConnected, fetchNotifications, loadMore, markAllAsReadLocal, markAsRead, deleteNotification, success])
}
