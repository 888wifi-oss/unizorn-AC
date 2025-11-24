// lib/actions/optimized-actions.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { getCache, setCache, CACHE_TTL, CACHE_KEYS } from '@/lib/cache/server-cache'

/**
 * Optimized Units Actions with Caching
 */
export async function getUnitsOptimized(options: {
  page?: number
  limit?: number
  search?: string
  status?: string
  projectId?: string
  useCache?: boolean
}) {
  const { page = 1, limit = 50, search, status, projectId, useCache = true } = options
  const cacheKey = CACHE_KEYS.UNITS(page, limit, search, status)
  
  // Check cache first
  if (useCache) {
    const cached = await getCache(cacheKey)
    if (cached) {
      return cached
    }
  }
  
  const supabase = await createClient()
  
  // Build optimized query
  let query = supabase
    .from('units')
    .select('id, unit_number, floor, size, owner_name, status, residents, project_id', { count: 'exact' })
    .order('unit_number')
  
  if (projectId) {
    query = query.eq('project_id', projectId)
  }
  
  if (search) {
    query = query.or(`unit_number.ilike.%${search}%,owner_name.ilike.%${search}%`)
  }
  
  if (status) {
    query = query.eq('status', status)
  }
  
  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Failed to fetch units: ${error.message}`)
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
    await setCache(cacheKey, result, CACHE_TTL.MEDIUM)
  }
  
  return result
}

/**
 * Optimized Bills Actions with Join
 */
export async function getBillsOptimized(options: {
  page?: number
  limit?: number
  unitId?: string
  status?: string
  month?: string
  year?: number
  projectId?: string
  useCache?: boolean
}) {
  const { page = 1, limit = 50, unitId, status, month, year, projectId, useCache = true } = options
  const cacheKey = CACHE_KEYS.BILLS(page, limit, unitId, status)
  
  // Check cache first
  if (useCache) {
    const cached = await getCache(cacheKey)
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
      unit:units!inner(id, unit_number, owner_name, project_id)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
  
  if (projectId) {
    query = query.eq('units.project_id', projectId)
  }
  
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
  
  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Failed to fetch bills: ${error.message}`)
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
    await setCache(cacheKey, result, CACHE_TTL.SHORT)
  }
  
  return result
}

/**
 * Optimized User Groups with Caching
 */
export async function getUserGroupsOptimized(userId: string, projectId?: string, companyId?: string) {
  const cacheKey = CACHE_KEYS.USER_GROUPS(userId, projectId)
  
  // Check cache first
  const cached = await getCache(cacheKey)
  if (cached) {
    return cached
  }
  
  const supabase = await createClient()
  
  // Build query with proper joins
  let query = supabase
    .from('user_groups')
    .select(`
      id, name, display_name, description, is_active, created_at,
      roles(id, name, display_name, level),
      user_group_members(count)
    `)
    .eq('is_active', true)
    .order('display_name')
  
  if (companyId) {
    query = query.eq('company_id', companyId)
  }
  
  const { data: groups, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch user groups: ${error.message}`)
  }
  
  const result = {
    success: true,
    groups: groups || []
  }
  
  // Cache result
  await setCache(cacheKey, result, CACHE_TTL.LONG)
  
  return result
}

/**
 * Optimized Dashboard Stats
 */
export async function getDashboardStatsOptimized(projectId?: string) {
  const cacheKey = CACHE_KEYS.DASHBOARD_STATS(projectId)
  
  // Check cache first
  const cached = await getCache(cacheKey)
  if (cached) {
    return cached
  }
  
  const supabase = await createClient()
  
  // Run all queries in parallel
  const [
    unitsResult,
    billsResult,
    maintenanceResult,
    parcelsResult,
    notificationsResult
  ] = await Promise.all([
    supabase
      .from('units')
      .select('id, status', { count: 'exact' })
      .eq(projectId ? 'project_id' : 'id', projectId || 'not-null'),
    
    supabase
      .from('bills')
      .select('id, status, total', { count: 'exact' })
      .eq(projectId ? 'units.project_id' : 'id', projectId || 'not-null'),
    
    supabase
      .from('maintenance_requests')
      .select('id, status', { count: 'exact' }),
    
    supabase
      .from('parcels')
      .select('id, status', { count: 'exact' }),
    
    supabase
      .from('notifications')
      .select('id, is_read', { count: 'exact' })
  ])
  
  // Calculate stats
  const stats = {
    success: true,
    data: {
      units: {
        total: unitsResult.count || 0,
        occupied: unitsResult.data?.filter(u => u.status === 'occupied').length || 0,
        vacant: unitsResult.data?.filter(u => u.status === 'vacant').length || 0
      },
      bills: {
        total: billsResult.count || 0,
        paid: billsResult.data?.filter(b => b.status === 'paid').length || 0,
        pending: billsResult.data?.filter(b => b.status === 'pending').length || 0,
        totalRevenue: billsResult.data?.reduce((sum, bill) => sum + (bill.total || 0), 0) || 0
      },
      maintenance: {
        total: maintenanceResult.count || 0,
        open: maintenanceResult.data?.filter(m => m.status === 'open').length || 0,
        completed: maintenanceResult.data?.filter(m => m.status === 'completed').length || 0
      },
      parcels: {
        total: parcelsResult.count || 0,
        pending: parcelsResult.data?.filter(p => p.status === 'pending').length || 0,
        delivered: parcelsResult.data?.filter(p => p.status === 'delivered').length || 0
      },
      notifications: {
        total: notificationsResult.count || 0,
        unread: notificationsResult.data?.filter(n => !n.is_read).length || 0
      }
    }
  }
  
  // Cache result
  await setCache(cacheKey, stats, CACHE_TTL.SHORT)
  
  return stats
}

/**
 * Batch Operations for Better Performance
 */
export async function batchUpdateUnits(updates: Array<{ id: string; data: any }>) {
  const supabase = await createClient()
  
  // Process in batches of 100
  const batchSize = 100
  const results = []
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize)
    
    const promises = batch.map(({ id, data }) =>
      supabase
        .from('units')
        .update(data)
        .eq('id', id)
    )
    
    const batchResults = await Promise.all(promises)
    results.push(...batchResults)
  }
  
  return {
    success: true,
    updated: results.filter(r => !r.error).length,
    errors: results.filter(r => r.error).length
  }
}

/**
 * Global Search with Optimization
 */
export async function globalSearchOptimized(query: string, limit = 20, projectId?: string) {
  if (!query || query.length < 2) {
    return { units: [], bills: [], maintenance: [], parcels: [] }
  }
  
  const cacheKey = `search:${query}:${limit}:${projectId || 'global'}`
  
  // Check cache first
  const cached = await getCache(cacheKey)
  if (cached) {
    return cached
  }
  
  const supabase = await createClient()
  const searchPattern = `%${query}%`
  
  // Run searches in parallel with optimized queries
  const [unitsResult, billsResult, maintenanceResult, parcelsResult] = await Promise.all([
    supabase
      .from('units')
      .select('id, unit_number, owner_name')
      .or(`unit_number.ilike.${searchPattern},owner_name.ilike.${searchPattern}`)
      .eq(projectId ? 'project_id' : 'id', projectId || 'not-null')
      .limit(limit),
    
    supabase
      .from('bills')
      .select('id, bill_number, unit:units(unit_number)')
      .ilike('bill_number', searchPattern)
      .eq(projectId ? 'units.project_id' : 'id', projectId || 'not-null')
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
  
  const result = {
    units: unitsResult.data || [],
    bills: billsResult.data || [],
    maintenance: maintenanceResult.data || [],
    parcels: parcelsResult.data || []
  }
  
  // Cache result for short time
  await setCache(cacheKey, result, CACHE_TTL.SHORT)
  
  return result
}
