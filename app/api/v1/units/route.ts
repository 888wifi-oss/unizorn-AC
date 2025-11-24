// app/api/v1/units/route.ts

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, createApiResponse, createErrorResponse, logApiUsage } from '@/lib/api/middleware'
import { PaginationParams, PaginatedResponse } from '@/lib/api/types'

// GET /api/v1/units - Get all units
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
      const search = url.searchParams.get('search') || ''
      const status = url.searchParams.get('status') || ''
      const sort = url.searchParams.get('sort') || 'unit_number'
      const order = url.searchParams.get('order') || 'asc'

      const supabase = await createClient()
      
      let query = supabase
        .from('units')
        .select('*', { count: 'exact' })
        .order(sort, { ascending: order === 'asc' })

      // Apply filters
      if (search) {
        query = query.or(`unit_number.ilike.%${search}%,owner_name.ilike.%${search}%`)
      }
      if (status) {
        query = query.eq('status', status)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: units, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      const totalPages = Math.ceil((count || 0) / limit)
      
      const response: PaginatedResponse<any> = {
        success: true,
        data: units || [],
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
        '/api/v1/units',
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
        '/api/v1/units',
        'GET',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// POST /api/v1/units - Create new unit
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('units:write')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const body = await req.json()
      const { unit_number, floor, size, owner_name, owner_phone, owner_email, residents, status } = body

      // Validate required fields
      if (!unit_number || !floor || !size || !owner_name) {
        return createErrorResponse('Missing required fields', 400)
      }

      const supabase = await createClient()
      
      const { data: unit, error } = await supabase
        .from('units')
        .insert([{
          unit_number,
          floor,
          size,
          owner_name,
          owner_phone,
          owner_email,
          residents: residents || 1,
          status: status || 'occupied'
        }])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/units',
        'POST',
        201,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(unit, true, 'Unit created successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/units',
        'POST',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}
