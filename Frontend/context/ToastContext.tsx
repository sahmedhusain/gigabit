'use client'
import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove toast after duration
    if (toast.duration !== 0) { // 0 means don't auto-remove
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
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
      case 'success': return 'border-green-400/30 bg-green-500/10'
      case 'error': return 'border-red-400/30 bg-red-500/10'
      case 'warning': return 'border-yellow-400/30 bg-yellow-500/10'
      case 'info': return 'border-blue-400/30 bg-blue-500/10'
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
      
      {/* Toast Container - Centered at top */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] space-y-2 max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              ${getToastStyles(toast.type)}
              backdrop-blur-xl border rounded-xl p-4 shadow-2xl
              transform transition-all duration-300 ease-in-out
              animate-in slide-in-from-top
              mx-auto
            `}
          >
            <div className="flex items-start space-x-3">
              {getToastIcon(toast.type)}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium text-center">{toast.message}</p>
                {toast.action && (
                  <div className="text-center">
                    <button
                      onClick={toast.action.onClick}
                      className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      {toast.action.label}
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white transition-colors flex-shrink-0"
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