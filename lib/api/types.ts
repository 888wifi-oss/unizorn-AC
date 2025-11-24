// lib/api/types.ts

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
  requestId: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  expiresAt?: string
  isActive: boolean
  createdAt: string
  lastUsedAt?: string
}

export interface ApiUsage {
  keyId: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: string
  ipAddress: string
  userAgent?: string
}

export interface RateLimit {
  keyId: string
  endpoint: string
  requests: number
  windowStart: number
  windowEnd: number
}
