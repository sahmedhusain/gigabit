'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { CacheOptions, CacheEntry } from '@/types/hooks'

export function useCache<T>(options: CacheOptions<T> = {}) {
  const {
    maxAge = 5 * 60 * 1000, 
    maxSize = 100,
    keyGenerator = (params: any) => JSON.stringify(params),
    onCacheHit,
    onCacheMiss,
    onCacheInvalidate
  } = options

  const cache = useRef<Map<string, CacheEntry<T>>>(new Map())
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    size: 0
  })

  const isValidEntry = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp < maxAge
  }, [maxAge])

  const evictOldEntries = useCallback(() => {
    const now = Date.now()
    const entries = Array.from(cache.current.entries())
    
    
    entries.forEach(([key, entry]) => {
      if (!isValidEntry(entry)) {
        cache.current.delete(key)
        onCacheInvalidate?.(key)
      }
    })

    
    if (cache.current.size > maxSize) {
      const sortedEntries = Array.from(cache.current.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
      
      const toRemove = sortedEntries.slice(0, cache.current.size - maxSize)
      toRemove.forEach(([key]) => {
        cache.current.delete(key)
        onCacheInvalidate?.(key)
      })
    }

    setCacheStats(prev => ({ ...prev, size: cache.current.size }))
  }, [maxSize, isValidEntry, onCacheInvalidate])

  const get = useCallback(<P>(
    fetchFunction: (params: P) => Promise<T>,
    params: P,
    options: { skipCache?: boolean; forceRefresh?: boolean } = {}
  ): Promise<T> => {
    const key = keyGenerator(params)
    const { skipCache = false, forceRefresh = false } = options

    if (!skipCache && !forceRefresh && cache.current.has(key)) {
      const entry = cache.current.get(key)!
      
      if (isValidEntry(entry)) {
        
        entry.accessCount++
        entry.lastAccessed = Date.now()
        
        setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }))
        onCacheHit?.(key, entry.data)
        
        return Promise.resolve(entry.data)
      } else {
        
        cache.current.delete(key)
        onCacheInvalidate?.(key)
      }
    }

    
    setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }))
    onCacheMiss?.(key)

    return fetchFunction(params).then(data => {
      
      const now = Date.now()
      cache.current.set(key, {
        data,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now
      })

      
      evictOldEntries()

      return data
    })
  }, [keyGenerator, isValidEntry, onCacheHit, onCacheMiss, evictOldEntries])

  const set = useCallback((key: string, data: T) => {
    const now = Date.now()
    cache.current.set(key, {
      data,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now
    })
    
    evictOldEntries()
  }, [evictOldEntries])

  const invalidate = useCallback((key: string) => {
    const deleted = cache.current.delete(key)
    if (deleted) {
      onCacheInvalidate?.(key)
      setCacheStats(prev => ({ ...prev, size: prev.size - 1 }))
    }
    return deleted
  }, [onCacheInvalidate])

  const invalidatePattern = useCallback((pattern: RegExp | string) => {
    const keys = Array.from(cache.current.keys())
    const toDelete = keys.filter(key => 
      typeof pattern === 'string' 
        ? key.includes(pattern)
        : pattern.test(key)
    )
    
    toDelete.forEach(key => {
      cache.current.delete(key)
      onCacheInvalidate?.(key)
    })
    
    setCacheStats(prev => ({ ...prev, size: cache.current.size }))
    
    return toDelete.length
  }, [onCacheInvalidate])

  const clear = useCallback(() => {
    const size = cache.current.size
    cache.current.clear()
    setCacheStats({ hits: 0, misses: 0, size: 0 })
    return size
  }, [])

  const has = useCallback((key: string): boolean => {
    if (!cache.current.has(key)) {
      return false
    }
    
    const entry = cache.current.get(key)!
    if (!isValidEntry(entry)) {
      cache.current.delete(key)
      return false
    }
    
    return true
  }, [isValidEntry])

  
  useEffect(() => {
    const interval = setInterval(() => {
      evictOldEntries()
    }, maxAge / 4) 

    return () => clearInterval(interval)
  }, [maxAge, evictOldEntries])

  const hitRate = cacheStats.hits + cacheStats.misses > 0 
    ? cacheStats.hits / (cacheStats.hits + cacheStats.misses) 
    : 0

  return {
    get,
    set,
    invalidate,
    invalidatePattern,
    clear,
    has,
    stats: {
      ...cacheStats,
      hitRate: Math.round(hitRate * 100) / 100
    }
  }
}
