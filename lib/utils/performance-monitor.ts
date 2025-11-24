// lib/utils/performance-monitor.ts

/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private thresholds: Map<string, number> = new Map()

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, any>) {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    })
  }

  /**
   * End timing an operation
   */
  end(name: string): number | null {
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`No metric found for: ${name}`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    // Check threshold
    const threshold = this.thresholds.get(name)
    if (threshold && duration > threshold) {
      console.warn(`⚠️ Performance threshold exceeded for "${name}": ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`)
    }

    return duration
  }

  /**
   * Set performance threshold for an operation
   */
  setThreshold(name: string, milliseconds: number) {
    this.thresholds.set(name, milliseconds)
  }

  /**
   * Get metric by name
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name)
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear()
  }

  /**
   * Log performance summary
   */
  logSummary() {
    const metrics = this.getAllMetrics()
    const completed = metrics.filter(m => m.duration !== undefined)

    if (completed.length === 0) {
      console.log('No completed metrics')
      return
    }

    console.group('📊 Performance Summary')
    completed
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .forEach(metric => {
        const duration = metric.duration!.toFixed(2)
        const threshold = this.thresholds.get(metric.name)
        const exceeds = threshold && metric.duration! > threshold

        console.log(
          `${exceeds ? '⚠️' : '✅'} ${metric.name}: ${duration}ms${
            threshold ? ` (threshold: ${threshold}ms)` : ''
          }`
        )

        if (metric.metadata) {
          console.log('  Metadata:', metric.metadata)
        }
      })
    console.groupEnd()
  }

  /**
   * Measure async function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata)
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }
}

// Global instance
export const perfMonitor = new PerformanceMonitor()

/**
 * HOC to measure component render time
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function MonitoredComponent(props: P) {
    perfMonitor.start(`render:${componentName}`)

    React.useEffect(() => {
      perfMonitor.end(`render:${componentName}`)
    }, [])

    return <Component {...props} />
  }
}

/**
 * Decorator for measuring function execution time
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const metricName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      perfMonitor.start(metricName)
      try {
        const result = await originalMethod.apply(this, args)
        perfMonitor.end(metricName)
        return result
      } catch (error) {
        perfMonitor.end(metricName)
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Log component re-renders
 */
export function useRenderLogger(componentName: string) {
  const renderCount = React.useRef(0)

  React.useEffect(() => {
    renderCount.current += 1
    console.log(`🔄 ${componentName} rendered ${renderCount.current} times`)
  })
}

/**
 * Measure time between two points
 */
export function measureTime(label: string) {
  const start = performance.now()

  return () => {
    const end = performance.now()
    const duration = end - start
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
    return duration
  }
}

/**
 * Check if rendering is slow
 */
export function checkRenderPerformance(threshold = 16.67) {
  // 16.67ms = 60fps
  if (typeof window === 'undefined') return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > threshold) {
        console.warn(
          `🐌 Slow render detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`
        )
      }
    }
  })

  observer.observe({ entryTypes: ['measure'] })

  return () => observer.disconnect()
}

/**
 * Log memory usage
 */
export function logMemoryUsage() {
  if (typeof window === 'undefined' || !(performance as any).memory) {
    console.warn('Memory API not available')
    return
  }

  const memory = (performance as any).memory
  console.group('💾 Memory Usage')
  console.log(`Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`)
  console.log(`Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`)
  console.log(`Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`)
  console.groupEnd()
}

/**
 * Detect memory leaks
 */
export function detectMemoryLeaks(interval = 5000) {
  if (typeof window === 'undefined' || !(performance as any).memory) {
    return
  }

  const measurements: number[] = []
  const threshold = 10 // MB

  const intervalId = setInterval(() => {
    const memory = (performance as any).memory
    const usedMB = memory.usedJSHeapSize / 1048576

    measurements.push(usedMB)

    if (measurements.length > 10) {
      measurements.shift()
    }

    if (measurements.length === 10) {
      const trend = measurements[9] - measurements[0]
      if (trend > threshold) {
        console.warn(
          `🚨 Potential memory leak detected! Memory increased by ${trend.toFixed(2)} MB`
        )
      }
    }
  }, interval)

  return () => clearInterval(intervalId)
}

import React from 'react'
