'use client'
import { useState, useCallback, useRef } from 'react'

export interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: any, rollbackData?: T) => void
  rollbackDelay?: number
}

export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [data, setData] = useState<T>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rollbackTimer = useRef<NodeJS.Timeout | null>(null)
  const previousData = useRef<T>(initialData)

  const performUpdate = useCallback(
    async <R>(
      optimisticUpdate: (current: T) => T,
      asyncOperation: () => Promise<R>
    ): Promise<R> => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Store current data for potential rollback
        previousData.current = data
        
        // Apply optimistic update immediately
        const optimisticData = optimisticUpdate(data)
        setData(optimisticData)
        
        // Perform the actual async operation
        const result = await asyncOperation()
        
        // If successful, call onSuccess callback
        options.onSuccess?.(optimisticData)
        
        return result
      } catch (err: any) {
        // Rollback optimistic update on error
        setData(previousData.current)
        setError(err.message || 'Operation failed')
        
        // Call error callback with rollback data
        options.onError?.(err, previousData.current)
        
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [data, options]
  )

  const rollback = useCallback(() => {
    setData(previousData.current)
    setError('Operation was rolled back')
  }, [])

  const scheduleRollback = useCallback((delay: number = options.rollbackDelay || 5000) => {
    if (rollbackTimer.current) {
      clearTimeout(rollbackTimer.current)
    }
    
    rollbackTimer.current = setTimeout(() => {
      rollback()
    }, delay)
  }, [rollback, options.rollbackDelay])

  const cancelRollback = useCallback(() => {
    if (rollbackTimer.current) {
      clearTimeout(rollbackTimer.current)
      rollbackTimer.current = null
    }
  }, [])

  const setOptimisticData = useCallback((newData: T | ((current: T) => T)) => {
    previousData.current = data
    setData(typeof newData === 'function' ? (newData as (current: T) => T)(data) : newData)
  }, [data])

  return {
    data,
    isLoading,
    error,
    performUpdate,
    rollback,
    scheduleRollback,
    cancelRollback,
    setOptimisticData
  }
}
