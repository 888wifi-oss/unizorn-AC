// lib/cache/server-cache.ts
"use server"

// Note: Using memory cache instead of Redis for simplicity
// In production, you can add Redis by installing ioredis package

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 3600,     // 1 hour
  VERY_LONG: 86400 // 24 hours
}

// In-memory cache for server-side
const serverCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

/**
 * Get data from cache (memory)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = serverCache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return cached.data as T
    }
    return null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set data in cache (memory)
 */
export async function setCache(key: string, data: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
  try {
    serverCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

/**
 * Delete data from cache
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    serverCache.delete(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

/**
 * Clear cache by pattern
 */
export async function clearCachePattern(pattern: string): Promise<void> {
  try {
    for (const key of serverCache.keys()) {
      if (key.includes(pattern)) {
        serverCache.delete(key)
      }
    }
  } catch (error) {
    console.error('Cache clear pattern error:', error)
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    serverCache.clear()
  } catch (error) {
    console.error('Clear all cache error:', error)
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
