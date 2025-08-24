'use client'
import { Check, X } from 'lucide-react'

interface Notification {
  id: number
  type: string
  user: string
  message: string
  time: string
  isRead: boolean
}

interface NotificationsDropdownProps {
  show: boolean
  notifications: Notification[]
  fetchNotifications: () => void
}

export default function NotificationsDropdown({
  show,
  notifications,
  fetchNotifications
}: NotificationsDropdownProps) {
  if (!show) return null

  return (
    <div className="fixed top-14 lg:top-16 right-2 lg:right-6 w-72 sm:w-80 max-h-80 lg:max-h-96 overflow-y-auto bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/20 shadow-2xl z-40">
      <div className="p-3 lg:p-4">
        <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Notifications</h3>
        <div className="space-y-2 lg:space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${
                  notification.isRead ? 'bg-white/5' : 'bg-emerald-500/10 border border-emerald-400/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs lg:text-sm">
                      <span className="font-medium">{notification.user}</span>
                      {' '}{notification.message}
                    </p>
                    <p className="text-white/60 text-xs mt-1">{notification.time}</p>
                  </div>
                  {notification.type === 'follow_request' && (
                    <div className="flex space-x-1 lg:space-x-2 ml-2 lg:ml-3 flex-shrink-0">
                      <button className="p-1 bg-emerald-500 rounded-md lg:rounded-lg hover:bg-emerald-600 transition-colors">
                        <Check className="w-3 h-3 text-white" />
                      </button>
                      <button className="p-1 bg-red-500 rounded-md lg:rounded-lg hover:bg-red-600 transition-colors">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
