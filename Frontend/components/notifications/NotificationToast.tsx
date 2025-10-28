'use client'

import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { NotificationToastProps } from '@/types/notifications'

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  notification, 
  onClose, 
  duration = 5000 
}) => {
  const router = useRouter()
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  
  const getInitialsFromName = (name: string | undefined): string => {
    if (!name) return '?'
    const trimmed = name.trim()
    if (trimmed.length === 0) return '?'
    if (trimmed.length === 1) return trimmed.toUpperCase()
    return trimmed.charAt(0).toUpperCase() + trimmed.charAt(1).toUpperCase()
  }

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(notification.id)
    }, 300)
  }, [onClose, notification.id])

  useEffect(() => {
    
    const startTime = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
    }, 50)

    
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(timer)
    }
  }, [duration, handleClose])

  const handleClick = () => {
    if (notification.link) {
      router.push(notification.link)
      handleClose()
    }
  }

  const getBgGradient = () => {
    switch (notification.type) {
      case 'like':
        return 'from-red-500/20 to-pink-500/20 border-red-500/30'
      case 'comment':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      case 'follow':
        return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
      case 'message':
        return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
      case 'group':
        return 'from-orange-500/20 to-amber-500/20 border-orange-500/30'
      case 'event':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      default:
        return 'from-gray-500/20 to-slate-500/20 border-gray-500/30'
    }
  }

  return (
    <div
      className={`
        relative w-96 max-w-[calc(100vw-2rem)] 
        bg-gradient-to-br ${getBgGradient()}
        backdrop-blur-xl rounded-2xl border shadow-2xl
        overflow-hidden
        transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}
        ${notification.link ? 'cursor-pointer hover:scale-[1.02]' : ''}
      `}
      onClick={handleClick}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 pt-5">
        <div className="flex items-start space-x-3">
          {/* Icon/Avatar */}
          <div className="flex-shrink-0">
            {notification.avatar ? (
              <Image
                src={notification.avatar}
                alt={notification.actorName || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center border-2 border-white/20">
                <span className="text-white font-bold text-sm">
                  {getInitialsFromName(notification.actorName)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              {notification.title}
            </p>
            <p className="text-white/80 text-sm mt-1 leading-snug">
              {notification.message}
            </p>
            <p className="text-white/50 text-xs mt-2">
              Just now
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            className="flex-shrink-0 p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationToast

