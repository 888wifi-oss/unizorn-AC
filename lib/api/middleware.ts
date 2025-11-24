// lib/api/middleware.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse, ApiKey, RateLimit } from './types'

// Rate limiting configuration
const RATE_LIMITS = {
  default: { requests: 100, window: 3600 }, // 100 requests per hour
  auth: { requests: 10, window: 3600 }, // 10 requests per hour
  upload: { requests: 20, window: 3600 }, // 20 requests per hour
  admin: { requests: 1000, window: 3600 }, // 1000 requests per hour
}

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimit>()

export async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; key?: ApiKey; error?: string }> {
  try {
    const apiKey = request.headers.get('x-api-key')
    
    if (!apiKey) {
      return { valid: false, error: 'API key is required' }
    }

    const supabase = await createClient()
    
    // Check if API key exists and is active
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single()

    if (error || !keyData) {
      return { valid: false, error: 'Invalid API key' }
    }

    // Check if key is expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' }
    }

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id)

    return { valid: true, key: keyData }
  } catch (error: any) {
    console.error('API key validation error:', error)
    return { valid: false, error: 'Internal server error' }
  }
}

export async function checkRateLimit(
  apiKey: string, 
  endpoint: string, 
  method: string
): Promise<{ allowed: boolean; remaining?: number; resetTime?: number; error?: string }> {
  try {
    const key = `${apiKey}:${endpoint}:${method}`
    const now = Date.now()
    
    // Get rate limit configuration based on endpoint
    let config = RATE_LIMITS.default
    if (endpoint.includes('/auth')) config = RATE_LIMITS.auth
    if (endpoint.includes('/upload')) config = RATE_LIMITS.upload
    if (endpoint.includes('/admin')) config = RATE_LIMITS.admin

    const windowStart = Math.floor(now / (config.window * 1000)) * (config.window * 1000)
    const windowEnd = windowStart + (config.window * 1000)

    const current = rateLimitStore.get(key)
    
    if (!current || current.windowEnd <= now) {
      // New window or expired window
      rateLimitStore.set(key, {
        keyId: apiKey,
        endpoint,
        requests: 1,
        windowStart,
        windowEnd
      })
      return { allowed: true, remaining: config.requests - 1, resetTime: windowEnd }
    }

    if (current.requests >= config.requests) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: current.windowEnd,
        error: 'Rate limit exceeded' 
      }
    }

    // Increment request count
    current.requests++
    rateLimitStore.set(key, current)

    return { 
      allowed: true, 
      remaining: config.requests - current.requests, 
      resetTime: current.windowEnd 
    }
  } catch (error: any) {
    console.error('Rate limit check error:', error)
    return { allowed: false, error: 'Internal server error' }
  }
}

export function createApiResponse<T>(
  data?: T, 
  success = true, 
  message?: string, 
  error?: string
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success,
    data,
    message,
    error,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID()
  }

  return NextResponse.json(response, {
    status: success ? 200 : 400,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.requestId
    }
  })
}

export function createErrorResponse(
  error: string, 
  statusCode = 400, 
  details?: any
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID()
  }

  if (details) {
    response.data = details
  }

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.requestId
    }
  })
}

export async function withApiAuth(
  request: NextRequest,
  handler: (request: NextRequest, apiKey: ApiKey) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Validate API key
    const { valid, key, error } = await validateApiKey(request)
    if (!valid || !key) {
      return createErrorResponse(error || 'Unauthorized', 401)
    }

    // Check rate limit
    const url = new URL(request.url)
    const endpoint = url.pathname
    const method = request.method
    
    const rateLimit = await checkRateLimit(key.key, endpoint, method)
    if (!rateLimit.allowed) {
      return createErrorResponse(
        rateLimit.error || 'Rate limit exceeded', 
        429,
        {
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime
        }
      )
    }

    // Add rate limit headers
    const response = await handler(request, key)
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining?.toString() || '0')
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime?.toString() || '0')
    
    return response
  } catch (error: any) {
    console.error('API auth middleware error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export function logApiUsage(
  apiKey: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  ipAddress: string,
  userAgent?: string
) {
  // In production, log to database or external service
  console.log('API Usage:', {
    apiKey,
    endpoint,
    method,
    statusCode,
    responseTime,
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString()
  })
}
