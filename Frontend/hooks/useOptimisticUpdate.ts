'use client'
import { useState, useCallback, useRef } from 'react'

export interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: any, rollbackData?: T) => void
  rollbackDelay?: number
}

export function useOptimisticUpdate<T>(
  initialState: T | null,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(initialState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rollbackTimer = useRef<NodeJS.Timeout | null>(null)
  const previousData = useRef<T | null>(null)

  const performUpdate = useCallback(
    async <R>(
      optimisticUpdate: (current: T | null) => T | null,
      asyncOperation: () => Promise<R>
    ): Promise<R> => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Apply optimistic update immediately
        const newData = optimisticUpdate(data)
        previousData.current = data
        setData(newData)
        
        // Perform the actual async operation
        const result = await asyncOperation()
        
        // If successful, call onSuccess callback with the optimistic data
        if (options.onSuccess && newData !== null) {
          options.onSuccess(newData)
        }
        
        return result
      } catch (err: any) {
        // Rollback optimistic update on error
        if (previousData.current !== null) {
          setData(previousData.current)
        }
        setError(err.message || 'Operation failed')
        
        // Call error callback with rollback data
        options.onError?.(err, previousData.current ?? undefined)
        
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [data, options]
  )

  const rollback = useCallback(() => {
    if (previousData.current !== null) {
      setData(previousData.current)
    }
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

  const setOptimisticData = useCallback((newData: T | null | ((current: T | null) => T | null)) => {
    setData((currentData) => {
      previousData.current = currentData
      return typeof newData === 'function' ? (newData as (current: T | null) => T | null)(currentData) : newData
    })
  }, [])

  return {
    data,
    setData,
    isLoading,
    error,
    performUpdate,
    rollback,
    scheduleRollback,
    cancelRollback,
    setOptimisticData
  }
}
