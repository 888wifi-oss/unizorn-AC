/**
 * Error handling utilities
 * จัดการ errors แบบ centralized และ user-friendly
 */

export interface AppError {
  message: string
  code?: string
  status?: number
  details?: any
}

/**
 * แปลง error เป็น user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
}

/**
 * แปลง error เป็น AppError object
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack,
    }
  }
  
  if (error && typeof error === 'object') {
    const err = error as any
    return {
      message: err.message || 'เกิดข้อผิดพลาด',
      code: err.code,
      status: err.status,
      details: err.details || err,
    }
  }
  
  return {
    message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
  }
}

/**
 * Log error (TODO: Send to error logging service)
 */
export function logError(error: unknown, context?: string) {
  const normalized = normalizeError(error)
  
  console.error(`[Error${context ? `: ${context}` : ''}]`, {
    message: normalized.message,
    code: normalized.code,
    status: normalized.status,
    details: normalized.details,
  })
  
  // TODO: Send to error logging service
  // Example:
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { tags: { context } })
  // }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

/**
 * Safe async function wrapper
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await fn()
    return { data }
  } catch (error) {
    const normalized = normalizeError(error)
    logError(error)
    return { error: normalized, data: fallback }
  }
}

