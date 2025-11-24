// lib/cache/client-cache.ts
// Client-side cache utilities

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 3600,     // 1 hour
  VERY_LONG: 86400 // 24 hours
}

// In-memory cache for client-side
const clientCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

/**
 * Get data from client cache
 */
export function getClientCache<T>(key: string): T | null {
  const cached = clientCache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
    return cached.data as T
  }
  return null
}

/**
 * Set data in client cache
 */
export function setClientCache(key: string, data: any, ttl: number = CACHE_TTL.MEDIUM): void {
  clientCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

/**
 * Delete data from client cache
 */
export function deleteClientCache(key: string): void {
  clientCache.delete(key)
}

/**
 * Clear client cache by pattern
 */
export function clearClientCachePattern(pattern: string): void {
  for (const key of clientCache.keys()) {
    if (key.includes(pattern)) {
      clientCache.delete(key)
    }
  }
}

/**
 * Clear all client cache
 */
export function clearAllClientCache(): void {
  clientCache.clear()
}

/**
 * Cache wrapper for functions
 */
export function withClientCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args)
    
    // Try to get from cache
    const cached = getClientCache<R>(key)
    if (cached !== null) {
      return cached
    }
    
    // Execute function and cache result
    const result = await fn(...args)
    setClientCache(key, result, ttl)
    
    return result
  }
}

/**
 * Cache keys generator
 */
export const CACHE_KEYS = {
  UNITS: (page: number, limit: number, search?: string, status?: string) => 
    `units:${page}:${limit}:${search || ''}:${status || ''}`,
  
  BILLS: (page: number, limit: number, unitId?: string, status?: string) => 
    `bills:${page}:${limit}:${unitId || ''}:${status || ''}`,
  
  USER_GROUPS: (userId: string, projectId?: string) => 
    `user_groups:${userId}:${projectId || 'global'}`,
  
  USER_PERMISSIONS: (userId: string, projectId?: string) => 
    `user_permissions:${userId}:${projectId || 'global'}`,
  
  DASHBOARD_STATS: (projectId?: string) => 
    `dashboard_stats:${projectId || 'global'}`,
  
  ANALYTICS: (type: string, projectId?: string) => 
    `analytics:${type}:${projectId || 'global'}`
}
