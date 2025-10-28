'use client'
import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { ToastType, Toast, ToastContextType, ToastProviderProps } from '@/types/contexts'

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [progress, setProgress] = useState<{[key: string]: number}>({})

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
    setProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[id]
      return newProgress
    })
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    if (toast.duration !== 0) {
      const duration = toast.duration || 1500
      setProgress(prev => ({ ...prev, [id]: 100 }))
      
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, ((duration - elapsed) / duration) * 100)
        setProgress(prev => ({ ...prev, [id]: remaining }))
        
        if (remaining <= 0) {
          clearInterval(interval)
          removeToast(id)
        }
      }, 50)
      
      setTimeout(() => {
        clearInterval(interval)
        removeToast(id)
      }, duration)
    }
    
    return id
  }, [removeToast])

  const success = useCallback((message: string, duration?: number) => 
    addToast({ message, type: 'success', duration }), [addToast])
  
  const error = useCallback((message: string, duration?: number) => 
    addToast({ message, type: 'error', duration }), [addToast])
  
  const warning = useCallback((message: string, duration?: number) => 
    addToast({ message, type: 'warning', duration }), [addToast])
  
  const info = useCallback((message: string, duration?: number) => 
    addToast({ message, type: 'info', duration }), [addToast])

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'info': return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-400/20 shadow-xl shadow-emerald-500/10'
      case 'error': return 'bg-gradient-to-br from-red-500/10 via-pink-500/10 to-rose-500/10 backdrop-blur-xl border border-red-400/20 shadow-xl shadow-red-500/10'
      case 'warning': return 'bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-amber-500/10 backdrop-blur-xl border border-yellow-400/20 shadow-xl shadow-yellow-500/10'
      case 'info': return 'bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 backdrop-blur-xl border border-blue-400/20 shadow-xl shadow-blue-500/10'
    }
  }

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-[9999] w-72">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`
              ${getToastStyles(toast.type)}
              backdrop-blur-xl border rounded-2xl p-4 shadow-xl
              transform transition-all duration-500 ease-out
              animate-in slide-in-from-left-full
              hover:scale-[1.02] hover:shadow-2xl
              mx-auto relative overflow-hidden
              min-h-[60px] group
            `}
            style={{
              position: 'absolute',
              bottom: `${index * 80}px`, // Stack with 80px offset
              right: 0,
              zIndex: toasts.length - index // Newer toasts have higher z-index
            }}
          >
            {/* Progress bar */}
            {toast.duration !== 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div
                  className={`h-full transition-all duration-75 ease-linear ${
                    toast.type === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                    toast.type === 'error' ? 'bg-gradient-to-r from-red-400 to-pink-400' :
                    toast.type === 'warning' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                    'bg-gradient-to-r from-blue-400 to-cyan-400'
                  }`}
                  style={{ width: `${progress[toast.id] || 100}%` }}
                />
              </div>
            )}
            {/* Subtle overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="flex items-start space-x-3 relative z-10">
              <div className="flex-shrink-0 mt-0.5">
                {getToastIcon(toast.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">{toast.message}</p>
                {toast.action && (
                  <div className="mt-3">
                    <button
                      onClick={toast.action.onClick}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 border border-white/20 hover:border-white/30"
                    >
                      {toast.action.label}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/60 hover:text-white transition-all duration-200 flex-shrink-0 hover:scale-110 p-1 rounded-lg hover:bg-white/10"
                aria-label="Close toast notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}