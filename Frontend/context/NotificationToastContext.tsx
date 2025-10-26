'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useWebSocket } from './WebSocketContext'
import { useAuth } from './AuthContext'
import { ToastNotification } from '@/components/NotificationToast'

interface NotificationToastContextType {
  notifications: ToastNotification[]
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void
  removeNotification: (id: number) => void
  clearAll: () => void
}

const NotificationToastContext = createContext<NotificationToastContextType | undefined>(undefined)

export const NotificationToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([])
  const { addMessageListener, isConnected } = useWebSocket()
  const { user } = useAuth()
  // Track if user is on a chat route to suppress chat toasts
  const [isOnChatRoute, setIsOnChatRoute] = useState(false)
  const notificationIdCounter = React.useRef(1)

  const addNotification = useCallback((notification: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const newNotification: ToastNotification = {
      ...notification,
      id: notificationIdCounter.current++,
      timestamp: Date.now(),
    }

    setNotifications((prev) => [...prev, newNotification])

    // Auto-remove after 6 seconds if not manually closed
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id))
    }, 6000)
  }, [])

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Track route changes to determine if user is inside chats
  useEffect(() => {
    const update = () => {
      try {
        const path = window.location.pathname
        setIsOnChatRoute(path.startsWith('/chats'))
      } catch {}
    }
    update()
    window.addEventListener('popstate', update)
    window.addEventListener('pushState', update as any)
    window.addEventListener('replaceState', update as any)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('pushState', update as any)
      window.removeEventListener('replaceState', update as any)
    }
  }, [])

  // Listen to WebSocket messages for real-time notifications
  useEffect(() => {
    if (!isConnected || !user) return

    const removeListener = addMessageListener((message) => {
      // Don't show notification for own actions
      if (message.from === user.id) return

      switch (message.type) {
        case 'notification':
          // Handle structured notification messages (support both persisted and transient)
          if (message.data) {
            const { type, message: msg, actor, entity_id, entity_type } = message.data
            
            let notificationType: ToastNotification['type'] = 'general'
            let link: string | undefined
            let title = 'New Notification'

            switch (type) {
              case 'post_liked':
              case 'group_post_liked':
                notificationType = 'like'
                title = 'Post Liked'
                link = `/post/${entity_id}`
                break
              case 'post_commented':
              case 'group_post_commented':
                notificationType = 'comment'
                title = 'New Comment'
                link = `/post/${entity_id}`
                break
              case 'follow_request':
              case 'follow_accepted':
                notificationType = 'follow'
                title = type === 'follow_request' ? 'Follow Request' : 'Follow Accepted'
                link = `/profile/${actor?.id}`
                break
              case 'group_invite':
              case 'join_request':
                notificationType = 'group'
                title = type === 'group_invite' ? 'Group Invitation' : 'Join Request'
                link = `/group/${entity_id}`
                break
              case 'event_created':
                notificationType = 'event'
                title = 'New Event'
                link = `/events?event=${entity_id}`
                break
              case 'new_message':
                notificationType = 'message'
                title = 'New Message'
                link = '/direct-messages'
                break
              case 'image_shared':
                notificationType = 'message'
                title = 'Image Shared'
                link = '/direct-messages'
                break
              case 'post_shared':
                notificationType = 'message'
                title = 'Post Shared'
                link = '/direct-messages'
                break
              case 'group_post':
                notificationType = 'group'
                title = 'New Group Post'
                link = `/group/${entity_id}`
                break
            }

            addNotification({
              type: notificationType,
              title,
              message: msg || 'You have a new notification',
              avatar: actor?.avatar,
              actorName: actor ? `${actor.first_name} ${actor.last_name}` : undefined,
              link,
            })
          }
          break

        case 'private_message':
          // Handle direct private messages
          if (!isOnChatRoute && message.data && message.from !== user.id) {
            const sender = message.data.sender
            addNotification({
              type: 'message',
              title: 'New Message',
              message: `${sender?.first_name || 'Someone'} sent you a message`,
              avatar: sender?.avatar,
              actorName: sender ? `${sender.first_name} ${sender.last_name}` : undefined,
              link: '/direct-messages',
            })
          }
          break

        case 'group_message':
          // Handle group messages
          if (!isOnChatRoute && message.data && message.from !== user.id) {
            const sender = message.data.sender
            addNotification({
              type: 'group',
              title: 'New Group Message',
              message: `${sender?.first_name || 'Someone'} sent a message in a group`,
              avatar: sender?.avatar,
              actorName: sender ? `${sender.first_name} ${sender.last_name}` : undefined,
              link: `/chats/all`,
            })
          }
          break

        case 'like':
          // Handle post likes
          if (message.data?.post_id && message.from !== user.id) {
            addNotification({
              type: 'like',
              title: 'Post Liked',
              message: 'Someone liked your post',
              link: `/post/${message.data.post_id}`,
            })
          }
          break

        case 'comment_update':
          // Handle new comments
          if (message.action === 'create' && message.data?.post_id && message.from !== user.id) {
            const commenter = message.data.user
            addNotification({
              type: 'comment',
              title: 'New Comment',
              message: `${commenter?.first_name || 'Someone'} commented on your post`,
              avatar: commenter?.avatar,
              actorName: commenter ? `${commenter.first_name} ${commenter.last_name}` : undefined,
              link: `/post/${message.data.post_id}`,
            })
          }
          break

        case 'follow_update':
          // Suppress toasts for sender; structured notifications will arrive via 'notification'
          break

        case 'group_update':
          // Handle group invitations and join requests
          if (message.data && message.from !== user.id) {
            const { action, group_id, group_name } = message.data
            if (action === 'invite') {
              addNotification({
                type: 'group',
                title: 'Group Invitation',
                message: `You've been invited to join ${group_name || 'a group'}`,
                link: `/group/${group_id}`,
              })
            } else if (action === 'join_request') {
              addNotification({
                type: 'group',
                title: 'Join Request',
                message: `Someone wants to join your group`,
                link: `/group/${group_id}`,
              })
            }
          }
          break

        case 'event_update':
          // Handle event notifications
          if (message.data && message.from !== user.id) {
            const { action, event_id, event_name } = message.data
            if (action === 'created') {
              addNotification({
                type: 'event',
                title: 'New Event',
                message: `${event_name || 'An event'} has been created`,
                link: `/events?event=${event_id}`,
              })
            }
          }
          break
      }
    })

    return () => {
      removeListener()
    }
  }, [isConnected, user, addMessageListener, addNotification])

  return (
    <NotificationToastContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationToastContext.Provider>
  )
}

export const useNotificationToasts = () => {
  const context = useContext(NotificationToastContext)
  if (!context) {
    throw new Error('useNotificationToasts must be used within NotificationToastProvider')
  }
  return context
}

