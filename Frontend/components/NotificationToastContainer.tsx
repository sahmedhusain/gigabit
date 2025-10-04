'use client'

import { useEffect, useState } from 'react'
import NotificationToast, { ToastNotification } from './NotificationToast'
import { useNotificationToasts } from '@/context/NotificationToastContext'

const NotificationToastContainer = () => {
  const { notifications, removeNotification } = useNotificationToasts()

  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-3 pointer-events-none">
      <div className="pointer-events-auto space-y-3">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
            duration={6000}
          />
        ))}
      </div>
    </div>
  )
}

export default NotificationToastContainer

