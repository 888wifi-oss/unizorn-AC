// lib/performance/monitor.ts
"use server"

interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000 // Keep only last 1000 metrics

  /**
   * Record a performance metric
   */
  record(operation: string, duration: number, success: boolean, error?: string) {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      error
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow operations
    if (duration > 1000) { // More than 1 second
      console.warn(`Slow operation: ${operation} took ${duration}ms`)
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const now = Date.now()
    const lastHour = this.metrics.filter(m => now - m.timestamp < 3600000)
    const lastDay = this.metrics.filter(m => now - m.timestamp < 86400000)

    const stats = {
      total: this.metrics.length,
      lastHour: lastHour.length,
      lastDay: lastDay.length,
      averageResponseTime: this.calculateAverage(this.metrics),
      slowestOperations: this.getSlowestOperations(10),
      errorRate: this.calculateErrorRate(this.metrics),
      operationsByType: this.getOperationsByType()
    }

    return stats
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit: number = 10) {
    return this.metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(m => ({
        operation: m.operation,
        duration: m.duration,
        timestamp: new Date(m.timestamp).toISOString()
      }))
  }

  /**
   * Calculate average response time
   */
  private calculateAverage(metrics: PerformanceMetric[]) {
    if (metrics.length === 0) return 0
    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return Math.round(total / metrics.length)
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(metrics: PerformanceMetric[]) {
    if (metrics.length === 0) return 0
    const errors = metrics.filter(m => !m.success).length
    return Math.round((errors / metrics.length) * 100)
  }

  /**
   * Get operations grouped by type
   */
  private getOperationsByType() {
    const groups: Record<string, { count: number; avgDuration: number }> = {}
    
    this.metrics.forEach(metric => {
      if (!groups[metric.operation]) {
        groups[metric.operation] = { count: 0, avgDuration: 0 }
      }
      groups[metric.operation].count++
      groups[metric.operation].avgDuration += metric.duration
    })

    // Calculate averages
    Object.keys(groups).forEach(operation => {
      groups[operation].avgDuration = Math.round(
        groups[operation].avgDuration / groups[operation].count
      )
    })

    return groups
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = []
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Performance decorator for functions
 */
export function measurePerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const start = Date.now()
      let success = true
      let error: string | undefined

      try {
        const result = await method.apply(this, args)
        return result
      } catch (err) {
        success = false
        error = err instanceof Error ? err.message : 'Unknown error'
        throw err
      } finally {
        const duration = Date.now() - start
        performanceMonitor.record(operationName, duration, success, error)
      }
    }
  }
}

/**
 * Performance wrapper for async functions
 */
export async function withPerformanceMeasurement<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  let success = true
  let error: string | undefined

  try {
    const result = await fn()
    return result
  } catch (err) {
    success = false
    error = err instanceof Error ? err.message : 'Unknown error'
    throw err
  } finally {
    const duration = Date.now() - start
    performanceMonitor.record(operationName, duration, success, error)
  }
}

/**
 * Database query performance measurement
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return withPerformanceMeasurement(`db:${queryName}`, queryFn)
}

/**
 * API endpoint performance measurement
 */
export async function measureAPI<T>(
  endpointName: string,
  apiFn: () => Promise<T>
): Promise<T> {
  return withPerformanceMeasurement(`api:${endpointName}`, apiFn)
}

/**
 * Get performance report
 */
export function getPerformanceReport() {
  return performanceMonitor.getStats()
}

/**
 * Get slow queries report
 */
export function getSlowQueriesReport() {
  return performanceMonitor.getSlowestOperations(20)
}
