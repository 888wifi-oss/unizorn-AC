// lib/hooks/use-cached-data.ts

import { useState, useEffect, useCallback } from 'react'

interface CacheConfig {
  ttl?: number // Time to live in milliseconds
  key: string
  fetcher: () => Promise<any>
}

interface CacheEntry {
  data: any
  timestamp: number
  loading: boolean
}

// In-memory cache store
const cacheStore = new Map<string, CacheEntry>()

// Pending requests to prevent duplicate fetches
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Custom hook for cached data fetching
 * Automatically handles caching, loading states, and refetching
 */
export function useCachedData<T>(config: CacheConfig) {
  const { key, fetcher, ttl = 5 * 60 * 1000 } = config // Default 5 minutes
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchData = useCallback(async (force = false) => {
    // Check cache first
    const cached = cacheStore.get(key)
    const now = Date.now()
    
    if (!force && cached && (now - cached.timestamp < ttl)) {
      setData(cached.data)
      setLoading(false)
      return cached.data
    }
    
    // Check if there's already a pending request
    if (pendingRequests.has(key)) {
      try {
        const result = await pendingRequests.get(key)
        setData(result)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      }
    }
    
    setLoading(true)
    setError(null)
    
    // Create new request
    const request = fetcher()
      .then((result) => {
        // Update cache
        cacheStore.set(key, {
          data: result,
          timestamp: Date.now(),
          loading: false
        })
        
        setData(result)
        setLoading(false)
        pendingRequests.delete(key)
        
        return result
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
        pendingRequests.delete(key)
        throw err
      })
    
    pendingRequests.set(key, request)
    return request
  }, [key, fetcher, ttl])
  
  const refetch = useCallback(() => {
    return fetchData(true)
  }, [fetchData])
  
  const invalidate = useCallback(() => {
    cacheStore.delete(key)
  }, [key])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  cacheStore.clear()
  pendingRequests.clear()
}

/**
 * Clear cache by key pattern
 */
export function clearCacheByPattern(pattern: string) {
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key)
    }
  }
}

/**
 * Prefetch data and store in cache
 */
export async function prefetchData(key: string, fetcher: () => Promise<any>) {
  if (cacheStore.has(key)) {
    return cacheStore.get(key)?.data
  }
  
  try {
    const data = await fetcher()
    cacheStore.set(key, {
      data,
      timestamp: Date.now(),
      loading: false
    })
    return data
  } catch (error) {
    console.error(`Prefetch error for ${key}:`, error)
    return null
  }
}
