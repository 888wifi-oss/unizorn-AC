// lib/actions/advanced-analytics-actions.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { getCache, setCache, CACHE_TTL, CACHE_KEYS } from '@/lib/cache/server-cache'

export interface RevenueData {
  month: string
  revenue: number
  budget: number
  variance: number
  growth: number
}

export interface OccupancyData {
  status: string
  count: number
  percentage: number
}

export interface MaintenanceData {
  month: string
  requests: number
  completed: number
  pending: number
  avgCompletionTime: number
}

export interface FinancialComparison {
  category: string
  current: number
  previous: number
  change: number
  changePercent: number
}

export interface ForecastingData {
  month: string
  value: number
  confidence: number
  upperBound: number
  lowerBound: number
}

export interface AnalyticsSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  occupancyRate: number
  maintenanceEfficiency: number
  growthRate: number
  forecastAccuracy: number
}

/**
 * Get Revenue Analytics with Budget Comparison
 */
export async function getRevenueAnalytics(
  projectId?: string,
  year?: number,
  useCache = true
): Promise<{ success: boolean; data?: RevenueData[]; error?: string }> {
  const cacheKey = `revenue_analytics:${projectId || 'global'}:${year || new Date().getFullYear()}`
  
  if (useCache) {
    const cached = await getCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  try {
    const supabase = await createClient()
    const currentYear = year || new Date().getFullYear()
    
    // Get revenue data
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select(`
        month, year, total, status,
        unit:units!inner(project_id)
      `)
      .eq('year', currentYear)
      .eq(projectId ? 'units.project_id' : 'year', projectId || currentYear)
      .eq('status', 'paid')

    if (billsError) throw billsError

    // Get budget data (mock for now)
    const budgetData = [
      { month: '01', budget: 500000 },
      { month: '02', budget: 520000 },
      { month: '03', budget: 480000 },
      { month: '04', budget: 550000 },
      { month: '05', budget: 530000 },
      { month: '06', budget: 580000 },
      { month: '07', budget: 600000 },
      { month: '08', budget: 620000 },
      { month: '09', budget: 580000 },
      { month: '10', budget: 650000 },
      { month: '11', budget: 680000 },
      { month: '12', budget: 700000 }
    ]

    // Process revenue data
    const monthlyRevenue = new Map<string, number>()
    bills?.forEach(bill => {
      const month = bill.month
      monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + (bill.total || 0))
    })

    // Calculate growth and variance
    const revenueData: RevenueData[] = budgetData.map((budget, index) => {
      const month = budget.month
      const revenue = monthlyRevenue.get(month) || 0
      const previousRevenue = index > 0 ? monthlyRevenue.get(budgetData[index - 1].month) || 0 : revenue
      const growth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0
      
      return {
        month: month,
        revenue,
        budget: budget.budget,
        variance: revenue - budget.budget,
        growth
      }
    })

    const result = { success: true, data: revenueData }
    
    if (useCache) {
      await setCache(cacheKey, result, CACHE_TTL.MEDIUM)
    }
    
    return result
  } catch (error) {
    console.error('Revenue analytics error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get Unit Occupancy Analytics
 */
export async function getOccupancyAnalytics(
  projectId?: string,
  useCache = true
): Promise<{ success: boolean; data?: OccupancyData[]; error?: string }> {
  const cacheKey = `occupancy_analytics:${projectId || 'global'}`
  
  if (useCache) {
    const cached = await getCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  try {
    const supabase = await createClient()
    
    const { data: units, error } = await supabase
      .from('units')
      .select('status')
      .eq(projectId ? 'project_id' : 'id', projectId || 'not-null')

    if (error) throw error

    // Count by status
    const statusCounts = new Map<string, number>()
    units?.forEach(unit => {
      const status = unit.status || 'unknown'
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
    })

    const total = units?.length || 0
    const occupancyData: OccupancyData[] = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }))

    const result = { success: true, data: occupancyData }
    
    if (useCache) {
      await setCache(cacheKey, result, CACHE_TTL.MEDIUM)
    }
    
    return result
  } catch (error) {
    console.error('Occupancy analytics error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get Maintenance Analytics
 */
export async function getMaintenanceAnalytics(
  projectId?: string,
  year?: number,
  useCache = true
): Promise<{ success: boolean; data?: MaintenanceData[]; error?: string }> {
  const cacheKey = `maintenance_analytics:${projectId || 'global'}:${year || new Date().getFullYear()}`
  
  if (useCache) {
    const cached = await getCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  try {
    const supabase = await createClient()
    const currentYear = year || new Date().getFullYear()
    
    const { data: maintenance, error } = await supabase
      .from('maintenance_requests')
      .select('status, priority, created_at, completed_at')
      .gte('created_at', `${currentYear}-01-01`)
      .lt('created_at', `${currentYear + 1}-01-01`)

    if (error) throw error

    // Group by month
    const monthlyData = new Map<string, {
      requests: number
      completed: number
      pending: number
      completionTimes: number[]
    }>()

    maintenance?.forEach(request => {
      const month = new Date(request.created_at).toISOString().substring(5, 7)
      const data = monthlyData.get(month) || { requests: 0, completed: 0, pending: 0, completionTimes: [] }
      
      data.requests++
      
      if (request.status === 'completed') {
        data.completed++
        if (request.completed_at) {
          const completionTime = new Date(request.completed_at).getTime() - new Date(request.created_at).getTime()
          data.completionTimes.push(completionTime / (1000 * 60 * 60 * 24)) // days
        }
      } else {
        data.pending++
      }
      
      monthlyData.set(month, data)
    })

    // Convert to array
    const maintenanceData: MaintenanceData[] = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0')
      const data = monthlyData.get(month) || { requests: 0, completed: 0, pending: 0, completionTimes: [] }
      
      return {
        month,
        requests: data.requests,
        completed: data.completed,
        pending: data.pending,
        avgCompletionTime: data.completionTimes.length > 0 
          ? data.completionTimes.reduce((a, b) => a + b, 0) / data.completionTimes.length 
          : 0
      }
    })

    const result = { success: true, data: maintenanceData }
    
    if (useCache) {
      await setCache(cacheKey, result, CACHE_TTL.MEDIUM)
    }
    
    return result
  } catch (error) {
    console.error('Maintenance analytics error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get Financial Comparison Analytics
 */
export async function getFinancialComparison(
  projectId?: string,
  useCache = true
): Promise<{ success: boolean; data?: FinancialComparison[]; error?: string }> {
  const cacheKey = `financial_comparison:${projectId || 'global'}`
  
  if (useCache) {
    const cached = await getCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  try {
    const supabase = await createClient()
    const currentYear = new Date().getFullYear()
    const previousYear = currentYear - 1
    
    // Get current year data
    const { data: currentBills, error: currentError } = await supabase
      .from('bills')
      .select('total, status')
      .eq('year', currentYear)
      .eq(projectId ? 'units.project_id' : 'year', projectId || currentYear)
      .eq('status', 'paid')

    if (currentError) throw currentError

    // Get previous year data
    const { data: previousBills, error: previousError } = await supabase
      .from('bills')
      .select('total, status')
      .eq('year', previousYear)
      .eq(projectId ? 'units.project_id' : 'year', projectId || previousYear)
      .eq('status', 'paid')

    if (previousError) throw previousError

    const currentRevenue = currentBills?.reduce((sum, bill) => sum + (bill.total || 0), 0) || 0
    const previousRevenue = previousBills?.reduce((sum, bill) => sum + (bill.total || 0), 0) || 0
    
    // Mock data for other categories
    const financialData: FinancialComparison[] = [
      {
        category: 'รายรับ',
        current: currentRevenue,
        previous: previousRevenue,
        change: currentRevenue - previousRevenue,
        changePercent: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      },
      {
        category: 'รายจ่าย',
        current: currentRevenue * 0.3, // Mock: 30% of revenue
        previous: previousRevenue * 0.3,
        change: (currentRevenue - previousRevenue) * 0.3,
        changePercent: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      },
      {
        category: 'กำไร',
        current: currentRevenue * 0.7, // Mock: 70% profit margin
        previous: previousRevenue * 0.7,
        change: (currentRevenue - previousRevenue) * 0.7,
        changePercent: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      },
      {
        category: 'งบประมาณ',
        current: currentRevenue * 1.1, // Mock: 110% of revenue
        previous: previousRevenue * 1.1,
        change: (currentRevenue - previousRevenue) * 1.1,
        changePercent: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
      },
      {
        category: 'ประสิทธิภาพ',
        current: 85, // Mock: 85% efficiency
        previous: 80, // Mock: 80% efficiency
        change: 5,
        changePercent: 6.25
      }
    ]

    const result = { success: true, data: financialData }
    
    if (useCache) {
      await setCache(cacheKey, result, CACHE_TTL.MEDIUM)
    }
    
    return result
  } catch (error) {
    console.error('Financial comparison error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get Forecasting Data
 */
export async function getForecastingData(
  projectId?: string,
  months = 6,
  useCache = true
): Promise<{ success: boolean; data?: ForecastingData[]; error?: string }> {
  const cacheKey = `forecasting:${projectId || 'global'}:${months}`
  
  if (useCache) {
    const cached = await getCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  try {
    const supabase = await createClient()
    const currentYear = new Date().getFullYear()
    
    // Get historical data (last 12 months)
    const { data: bills, error } = await supabase
      .from('bills')
      .select('month, year, total, status')
      .eq('year', currentYear)
      .eq(projectId ? 'units.project_id' : 'year', projectId || currentYear)
      .eq('status', 'paid')
      .order('month')

    if (error) throw error

    // Process historical data
    const monthlyRevenue = new Map<string, number>()
    bills?.forEach(bill => {
      const month = bill.month
      monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + (bill.total || 0))
    })

    // Simple linear regression for forecasting
    const historicalValues = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0')
      return monthlyRevenue.get(month) || 0
    })

    // Calculate trend
    const n = historicalValues.length
    const sumX = (n * (n - 1)) / 2
    const sumY = historicalValues.reduce((a, b) => a + b, 0)
    const sumXY = historicalValues.reduce((sum, value, index) => sum + (index * value), 0)
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Generate forecast
    const forecastData: ForecastingData[] = []
    for (let i = 0; i < months; i++) {
      const monthIndex = n + i
      const predictedValue = intercept + slope * monthIndex
      const confidence = Math.max(0.6, 1 - (i * 0.1)) // Decreasing confidence
      const variance = predictedValue * 0.1 * (1 - confidence) // Higher variance for lower confidence
      
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + i + 1)
      const month = futureDate.toISOString().substring(5, 7)
      
      forecastData.push({
        month,
        value: Math.max(0, predictedValue),
        confidence,
        upperBound: Math.max(0, predictedValue + variance),
        lowerBound: Math.max(0, predictedValue - variance)
      })
    }

    const result = { success: true, data: forecastData }
    
    if (useCache) {
      await setCache(cacheKey, result, CACHE_TTL.LONG)
    }
    
    return result
  } catch (error) {
    console.error('Forecasting error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get Analytics Summary
 */
export async function getAnalyticsSummary(
  projectId?: string,
  useCache = true
): Promise<{ success: boolean; data?: AnalyticsSummary; error?: string }> {
  const cacheKey = `analytics_summary:${projectId || 'global'}`
  
  if (useCache) {
    const cached = await getCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  try {
    // Get all analytics data in parallel
    const [
      revenueResult,
      occupancyResult,
      maintenanceResult,
      financialResult,
      forecastResult
    ] = await Promise.all([
      getRevenueAnalytics(projectId, undefined, false),
      getOccupancyAnalytics(projectId, false),
      getMaintenanceAnalytics(projectId, undefined, false),
      getFinancialComparison(projectId, false),
      getForecastingData(projectId, 3, false)
    ])

    if (!revenueResult.success || !occupancyResult.success || !maintenanceResult.success) {
      throw new Error('Failed to fetch analytics data')
    }

    // Calculate summary metrics
    const totalRevenue = revenueResult.data?.reduce((sum, item) => sum + item.revenue, 0) || 0
    const totalExpenses = totalRevenue * 0.3 // Mock: 30% of revenue
    const netProfit = totalRevenue - totalExpenses
    
    const occupiedUnits = occupancyResult.data?.find(item => item.status === 'occupied')?.count || 0
    const totalUnits = occupancyResult.data?.reduce((sum, item) => sum + item.count, 0) || 0
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
    
    const totalRequests = maintenanceResult.data?.reduce((sum, item) => sum + item.requests, 0) || 0
    const totalCompleted = maintenanceResult.data?.reduce((sum, item) => sum + item.completed, 0) || 0
    const maintenanceEfficiency = totalRequests > 0 ? (totalCompleted / totalRequests) * 100 : 0
    
    const currentRevenue = revenueResult.data?.[revenueResult.data.length - 1]?.revenue || 0
    const previousRevenue = revenueResult.data?.[revenueResult.data.length - 2]?.revenue || 0
    const growthRate = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
    
    const forecastAccuracy = 85 // Mock: 85% accuracy

    const summary: AnalyticsSummary = {
      totalRevenue,
      totalExpenses,
      netProfit,
      occupancyRate,
      maintenanceEfficiency,
      growthRate,
      forecastAccuracy
    }

    const result = { success: true, data: summary }
    
    if (useCache) {
      await setCache(cacheKey, result, CACHE_TTL.SHORT)
    }
    
    return result
  } catch (error) {
    console.error('Analytics summary error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
