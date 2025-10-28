'use client'
import React from 'react'
import { Activity, Heart, MessageCircle, Users, Calendar, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { ActivityHistoryProps } from '@/types/groups'

export default function ActivityHistory({
  notifications,
  isLoadingNotifications
}: ActivityHistoryProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-400" />
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-400" />
      case 'follow':
        return <Users className="w-4 h-4 text-emerald-400" />
      case 'event':
        return <Calendar className="w-4 h-4 text-blue-400" />
      default:
        return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  if (isLoadingNotifications) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center py-12"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </motion.div>
    )
  }

  
  const activityItems = [
    ...notifications.map(notification => ({
      id: `notification-${notification.id}`,
      type: notification.type,
      title: notification.message,
      user: notification.user,
      time: notification.time,
      isRead: notification.isRead
    })),
    
    {
      id: 'activity-1',
      type: 'post_created',
      title: 'You created a new post',
      user: 'You',
      time: '2h ago',
      isRead: true
    },
    {
      id: 'activity-2',
      type: 'event_created',
      title: 'You created a new event',
      user: 'You',
      time: '1d ago',
      isRead: true
    }
  ].sort((a, b) => {
    
    const timeA = a.time.includes('ago') ? Date.now() : new Date(a.time).getTime()
    const timeB = b.time.includes('ago') ? Date.now() : new Date(b.time).getTime()
    return timeB - timeA
  })

  if (activityItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-center py-16"
      >
        <Activity className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-white/60">No activity history yet</p>
        <p className="text-white/40 text-sm mt-2">Your interactions and activities will appear here</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      {activityItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.05,
            ease: "easeOut"
          }}
          className={`bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 transition-all ${
            !item.isRead ? 'bg-emerald-500/10 border-emerald-400/30' : 'hover:bg-white/15'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(item.type)}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!item.isRead ? 'text-white font-medium' : 'text-white/80'}`}>
                {item.title}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-white/60 text-xs">by {item.user}</p>
                <span className="text-white/50 text-xs">{item.time}</span>
              </div>
            </div>

            {!item.isRead && (
              <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}