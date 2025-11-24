// lib/supabase/optimized-queries.ts
"use server"

import { createClient } from '@/lib/supabase/server'

/**
 * Optimized query helpers for better performance
 */

// Cache duration in seconds
const CACHE_DURATION = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 3600,     // 1 hour
}

// In-memory cache (in production, use Redis)
const queryCache = new Map<string, { data: any; timestamp: number }>()

/**
 * Get cached data or fetch from database
 */
function getCachedData<T>(key: string, ttl: number): T | null {
  const cached = queryCache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl * 1000) {
    return cached.data as T
  }
  return null
}

/**
 * Set data in cache
 */
function setCachedData(key: string, data: any) {
  queryCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Clear cache by key pattern
 */
export function clearCache(pattern?: string) {
  if (!pattern) {
    queryCache.clear()
    return
  }
  
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key)
    }
  }
}

/**
 * Optimized Units Query
 * Uses select with specific fields instead of *
 */
export async function getUnitsOptimized(options: {
  page?: number
  limit?: number
  search?: string
  status?: string
  useCache?: boolean
}) {
  const { page = 1, limit = 50, search, status, useCache = true } = options
  const cacheKey = `units:${page}:${limit}:${search}:${status}`
  
  // Check cache
  if (useCache) {
    const cached = getCachedData(cacheKey, CACHE_DURATION.MEDIUM)
    if (cached) {
      return cached
    }
  }
  
  const supabase = await createClient()
  
  // Select only needed fields for better performance
  let query = supabase
    .from('units')
    .select('id, unit_number, floor, size, owner_name, status, residents', { count: 'exact' })
    .order('unit_number')
  
  if (search) {
    query = query.or(`unit_number.ilike.%${search}%,owner_name.ilike.%${search}%`)
  }
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(error.message)
  }
  
  const result = {
    success: true,
    units: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
  
  // Cache result
  if (useCache) {
    setCachedData(cacheKey, result)
  }
  
  return result
}

/**
 * Optimized Bills Query with Join
 * Uses join instead of separate queries
 */
export async function getBillsOptimized(options: {
  page?: number
  limit?: number
  unitId?: string
  status?: string
  month?: string
  year?: number
  useCache?: boolean
}) {
  const { page = 1, limit = 50, unitId, status, month, year, useCache = true } = options
  const cacheKey = `bills:${page}:${limit}:${unitId}:${status}:${month}:${year}`
  
  // Check cache
  if (useCache) {
    const cached = getCachedData(cacheKey, CACHE_DURATION.SHORT)
    if (cached) {
      return cached
    }
  }
  
  const supabase = await createClient()
  
  // Use join to get unit data in single query
  let query = supabase
    .from('bills')
    .select(`
      id, bill_number, month, year, total, status, due_date, created_at,
      unit:units!inner(id, unit_number, owner_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
  
  if (unitId) {
    query = query.eq('unit_id', unitId)
  }
  
  if (status) {
    query = query.eq('status', status)
  }
  
  if (month) {
    query = query.eq('month', month)
  }
  
  if (year) {
    query = query.eq('year', year)
  }
  
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(error.message)
  }
  
  const result = {
    success: true,
    bills: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
  
  // Cache result
  if (useCache) {
    setCachedData(cacheKey, result)
  }
  
  return result
}

/**
 * Batch fetch units by IDs
 * More efficient than multiple single queries
 */
export async function getUnitsByIds(ids: string[]) {
  if (ids.length === 0) return []
  
  const cacheKey = `units:batch:${ids.sort().join(',')}`
  const cached = getCachedData(cacheKey, CACHE_DURATION.LONG)
  if (cached) {
    return cached
  }
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('units')
    .select('id, unit_number, owner_name, owner_phone, owner_email')
    .in('id', ids)
  
  if (error) {
    throw new Error(error.message)
  }
  
  setCachedData(cacheKey, data || [])
  return data || []
}

/**
 * Get dashboard statistics (optimized)
 * Uses aggregate functions instead of counting rows
 */
export async function getDashboardStats(useCache = true) {
  const cacheKey = 'dashboard:stats'
  
  if (useCache) {
    const cached = getCachedData(cacheKey, CACHE_DURATION.MEDIUM)
    if (cached) {
      return cached
    }
  }
  
  const supabase = await createClient()
  
  // Run all queries in parallel
  const [unitsResult, billsResult, maintenanceResult, parcelsResult] = await Promise.all([
    // Units stats
    supabase
      .from('units')
      .select('status', { count: 'exact', head: true }),
    
    // Bills stats (only count)
    supabase
      .from('bills')
      .select('status', { count: 'exact', head: true })
      .eq('status', 'pending'),
    
    // Maintenance stats
    supabase
      .from('maintenance_requests')
      .select('status', { count: 'exact', head: true })
      .eq('status', 'pending'),
    
    // Parcels stats
    supabase
      .from('parcels')
      .select('status', { count: 'exact', head: true })
      .eq('status', 'pending')
  ])
  
  const stats = {
    totalUnits: unitsResult.count || 0,
    pendingBills: billsResult.count || 0,
    pendingMaintenance: maintenanceResult.count || 0,
    pendingParcels: parcelsResult.count || 0
  }
  
  setCachedData(cacheKey, stats)
  return stats
}

/**
 * Search across multiple tables (optimized)
 * Uses text search with indexes
 */
export async function globalSearch(query: string, limit = 20) {
  if (!query || query.length < 2) {
    return { units: [], bills: [], maintenance: [], parcels: [] }
  }
  
  const supabase = await createClient()
  const searchPattern = `%${query}%`
  
  // Run searches in parallel
  const [unitsResult, billsResult, maintenanceResult, parcelsResult] = await Promise.all([
    supabase
      .from('units')
      .select('id, unit_number, owner_name')
      .or(`unit_number.ilike.${searchPattern},owner_name.ilike.${searchPattern}`)
      .limit(limit),
    
    supabase
      .from('bills')
      .select('id, bill_number, unit:units(unit_number)')
      .ilike('bill_number', searchPattern)
      .limit(limit),
    
    supabase
      .from('maintenance_requests')
      .select('id, request_number, title')
      .or(`request_number.ilike.${searchPattern},title.ilike.${searchPattern}`)
      .limit(limit),
    
    supabase
      .from('parcels')
      .select('id, unit_number, recipient_name, tracking_number')
      .or(`unit_number.ilike.${searchPattern},recipient_name.ilike.${searchPattern},tracking_number.ilike.${searchPattern}`)
      .limit(limit)
  ])
  
  return {
    units: unitsResult.data || [],
    bills: billsResult.data || [],
    maintenance: maintenanceResult.data || [],
    parcels: parcelsResult.data || []
  }
}

/**
 * Get recent activities (optimized)
 * Fetches latest activities from multiple tables
 */
export async function getRecentActivities(limit = 10) {
  const cacheKey = `activities:recent:${limit}`
  const cached = getCachedData(cacheKey, CACHE_DURATION.SHORT)
  if (cached) {
    return cached
  }
  
  const supabase = await createClient()
  
  // Get recent activities from different tables
  const [bills, maintenance, parcels] = await Promise.all([
    supabase
      .from('bills')
      .select('id, bill_number, created_at, unit:units(unit_number)')
      .order('created_at', { ascending: false })
      .limit(limit),
    
    supabase
      .from('maintenance_requests')
      .select('id, request_number, title, created_at, unit:units(unit_number)')
      .order('created_at', { ascending: false })
      .limit(limit),
    
    supabase
      .from('parcels')
      .select('id, unit_number, recipient_name, received_at')
      .order('received_at', { ascending: false })
      .limit(limit)
  ])
  
  // Combine and sort by timestamp
  const activities = [
    ...(bills.data || []).map(b => ({ type: 'bill', ...b, timestamp: b.created_at })),
    ...(maintenance.data || []).map(m => ({ type: 'maintenance', ...m, timestamp: m.created_at })),
    ...(parcels.data || []).map(p => ({ type: 'parcel', ...p, timestamp: p.received_at }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
  
  setCachedData(cacheKey, activities)
  return activities
}
