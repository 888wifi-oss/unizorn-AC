// app/api/v1/api-keys/route.ts

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, createApiResponse, createErrorResponse, logApiUsage } from '@/lib/api/middleware'
import { PaginatedResponse, ApiKey } from '@/lib/api/types'

// GET /api/v1/api-keys - Get all API keys
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('admin')) {
        return createErrorResponse('Admin access required', 403)
      }

      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
      const isActive = url.searchParams.get('is_active') || ''
      const sort = url.searchParams.get('sort') || 'created_at'
      const order = url.searchParams.get('order') || 'desc'

      const supabase = await createClient()
      
      let query = supabase
        .from('api_keys')
        .select('*', { count: 'exact' })
        .order(sort, { ascending: order === 'asc' })

      // Apply filters
      if (isActive !== '') {
        query = query.eq('is_active', isActive === 'true')
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: apiKeys, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Remove sensitive data
      const sanitizedKeys = (apiKeys || []).map((key: any) => ({
        ...key,
        key: key.key.substring(0, 8) + '...' // Only show first 8 characters
      }))

      const totalPages = Math.ceil((count || 0) / limit)
      
      const response: PaginatedResponse<ApiKey> = {
        success: true,
        data: sanitizedKeys,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/api-keys',
        'GET',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return NextResponse.json(response)
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/api-keys',
        'GET',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// POST /api/v1/api-keys - Create new API key
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('admin')) {
        return createErrorResponse('Admin access required', 403)
      }

      const body = await req.json()
      const { name, permissions, expiresAt } = body

      // Validate required fields
      if (!name || !permissions || !Array.isArray(permissions)) {
        return createErrorResponse('Missing required fields', 400)
      }

      // Generate API key
      const key = `sk_${crypto.randomUUID().replace(/-/g, '')}`

      const supabase = await createClient()
      
      const { data: newApiKey, error } = await supabase
        .from('api_keys')
        .insert([{
          name,
          key,
          permissions,
          expires_at: expiresAt || null,
          is_active: true
        }])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/api-keys',
        'POST',
        201,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(newApiKey, true, 'API key created successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/api-keys',
        'POST',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}
