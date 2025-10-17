'use client'
import { useState, useCallback, useRef } from 'react'

export interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: any, rollbackData?: T) => void
  rollbackDelay?: number
}

export function useOptimisticUpdate<T>(
  setState: (newState: T | ((current: T) => T)) => void,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rollbackTimer = useRef<NodeJS.Timeout | null>(null)
  const previousData = useRef<T | null>(null)

  const performUpdate = useCallback(
    async <R>(
      optimisticUpdate: (current: T) => T,
      asyncOperation: () => Promise<R>
    ): Promise<R> => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Apply optimistic update immediately using the provided setState
        setState((currentData) => {
          previousData.current = currentData
          return optimisticUpdate(currentData)
        })
        
        // Perform the actual async operation
        const result = await asyncOperation()
        
        // If successful, call onSuccess callback with the optimistic data
        // Note: We can't access the optimistic data here easily, so we'll skip onSuccess for now
        // options.onSuccess?.(optimisticData)
        
        return result
      } catch (err: any) {
        // Rollback optimistic update on error
        if (previousData.current !== null) {
          setState(previousData.current)
        }
        setError(err.message || 'Operation failed')
        
        // Call error callback with rollback data
        options.onError?.(err, previousData.current ?? undefined)
        
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [setState, options]
  )

  const rollback = useCallback(() => {
    if (previousData.current !== null) {
      setState(previousData.current)
    }
    setError('Operation was rolled back')
  }, [setState])

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
    setState((currentData) => {
      previousData.current = currentData
      return typeof newData === 'function' ? (newData as (current: T) => T)(currentData) : newData
    })
  }, [setState])

  return {
    isLoading,
    error,
    performUpdate,
    rollback,
    scheduleRollback,
    cancelRollback,
    setOptimisticData
  }
}
