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
      
      
      setHasMore(data.length === limit)
      
      
      if (!reset) {
        setOffset(prev => prev + limit)
      }
      
      
      try {
        const unreadRes = await api.getUnreadNotificationCount()
        setUnread(unreadRes.unread_count)
      } catch (unreadErr) {
        
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
      
      setItems(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
      
      
      await api.markAllNotificationsAsRead()
      success('All notifications marked as read')
    } catch (e: any) {
      console.error('Failed to mark all as read:', e)
      error('Failed to mark all notifications as read')
      
      fetchNotifications()
    }
  }, [fetchNotifications, success, error])

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      
      setItems(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnread(prev => Math.max(0, prev - 1))
      
      
      await api.markNotificationAsRead([notificationId])
    } catch (e: any) {
      console.error('Failed to mark notification as read:', e)
      error('Failed to mark notification as read')
      
      fetchNotifications()
    }
  }, [fetchNotifications, error])

  const deleteNotification = useCallback(async (notificationId: number, showToast: boolean = true) => {
    try {
      
      const notificationToDelete = items.find(n => n.id === notificationId)
      setItems(prev => prev.filter(n => n.id !== notificationId))
      
      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnread(prev => Math.max(0, prev - 1))
      }
      
      
      await api.deleteNotification(notificationId)
      
      if (showToast) {
        success('Notification deleted')
      }
    } catch (e: any) {
      console.error('Failed to delete notification:', e)
      error('Failed to delete notification')
      
      fetchNotifications()
    }
  }, [items, success, error, fetchNotifications])

  
  const { isConnected } = useWebSocketSubscription({
    messageTypes: ['notification'],
    onMessage: (msg) => {
      if (msg.type === 'notification' && msg.data) {
        
        const notification = msg.data as NotificationResponse
        
        
        if (notification.id && notification.id > 0) {
          setItems(prev => {
            
            const exists = prev.some(n => n.id === notification.id)
            if (exists) return prev
            
            return [notification, ...prev]
          })
          setUnread(u => u + 1)
          
          
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
