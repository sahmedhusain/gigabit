'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type NotificationResponse } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { useWebSocketSubscription } from './useWebSocketSubscription'

export function useNotifications() {
  const { error, success } = useToast()
  const [items, setItems] = useState<NotificationResponse[]>([])
  const [unread, setUnread] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getNotifications(20, 0)
      const data = Array.isArray(res.data) ? res.data : []
      setItems(data)
      setUnread(data.filter(n => !n.is_read).length)
    } catch (e: any) {
      const msg = e?.message || 'Failed to load notifications'
      setErr(msg)
      error('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [error])

  const markAllAsReadLocal = useCallback(() => {
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }, [])

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      // Optimistically update local state
      setItems(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnread(prev => Math.max(0, prev - 1))
      
      // TODO: Call API to mark as read on server
      // await api.markNotificationAsRead(notificationId)
    } catch (e: any) {
      console.error('Failed to mark notification as read:', e)
      // Revert optimistic update
      fetchNotifications()
    }
  }, [fetchNotifications])

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      // Optimistically update local state
      const notificationToDelete = items.find(n => n.id === notificationId)
      setItems(prev => prev.filter(n => n.id !== notificationId))
      
      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnread(prev => Math.max(0, prev - 1))
      }
      
      // TODO: Call API to delete notification on server
      // await api.deleteNotification(notificationId)
      
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
        const newNotification: NotificationResponse = {
          id: Date.now(),
          type: msg.data.type || 'general',
          message: msg.data.message || 'You have a new notification',
          actor: msg.data.actor || { 
            id: 0, 
            email: '', 
            first_name: 'Someone', 
            last_name: '', 
            avatar: '', 
            nickname: '', 
            about_me: '', 
            date_of_birth: '', 
            is_private: false, 
            created_at: '', 
            updated_at: '' 
          },
          is_read: false,
          created_at: new Date().toISOString()
        }
        
        setItems(prev => [newNotification, ...prev])
        setUnread(u => u + 1)
        
        // Show toast notification based on type
        const notificationTypes = {
          'like': '👍 Someone liked your post',
          'comment': '💬 New comment on your post', 
          'follow': '👤 Someone started following you',
          'group_invite': '👥 Group invitation received',
          'event_invite': '📅 Event invitation received',
          'message': '📨 New message received'
        }
        
        const displayMessage = notificationTypes[msg.data.type as keyof typeof notificationTypes] || msg.data.message
        success(displayMessage)
      }
    }
  })

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return useMemo(() => ({
    items,
    unread,
    loading,
    error: err,
    isConnected,
    refetch: fetchNotifications,
    markAllAsReadLocal,
    markAsRead,
    deleteNotification,
    notify: success,
  }), [items, unread, loading, err, isConnected, fetchNotifications, markAllAsReadLocal, markAsRead, deleteNotification, success])
}
