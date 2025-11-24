// app/api/v1/bills/route.ts

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, createApiResponse, createErrorResponse, logApiUsage } from '@/lib/api/middleware'
import { PaginatedResponse } from '@/lib/api/types'

// GET /api/v1/bills - Get all bills
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
      const unitId = url.searchParams.get('unit_id') || ''
      const status = url.searchParams.get('status') || ''
      const month = url.searchParams.get('month') || ''
      const year = url.searchParams.get('year') || ''
      const sort = url.searchParams.get('sort') || 'created_at'
      const order = url.searchParams.get('order') || 'desc'

      const supabase = await createClient()
      
      let query = supabase
        .from('bills')
        .select(`
          *,
          unit:units(unit_number, owner_name)
        `, { count: 'exact' })
        .order(sort, { ascending: order === 'asc' })

      // Apply filters
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
        query = query.eq('year', parseInt(year))
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: bills, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      const totalPages = Math.ceil((count || 0) / limit)
      
      const response: PaginatedResponse<any> = {
        success: true,
        data: bills || [],
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
        '/api/v1/bills',
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
        '/api/v1/bills',
        'GET',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// POST /api/v1/bills - Create new bill
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('bills:write')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const body = await req.json()
      const { 
        unit_id, 
        bill_number, 
        month, 
        year, 
        common_fee, 
        water_fee, 
        electricity_fee, 
        parking_fee, 
        other_fee, 
        due_date 
      } = body

      // Validate required fields
      if (!unit_id || !bill_number || !month || !year || !due_date) {
        return createErrorResponse('Missing required fields', 400)
      }

      const supabase = await createClient()
      
      // Check if unit exists
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id')
        .eq('id', unit_id)
        .single()

      if (unitError) {
        return createErrorResponse('Unit not found', 404)
      }

      // Calculate total
      const total = (common_fee || 0) + (water_fee || 0) + (electricity_fee || 0) + (parking_fee || 0) + (other_fee || 0)

      const { data: bill, error } = await supabase
        .from('bills')
        .insert([{
          unit_id,
          bill_number,
          month,
          year,
          common_fee: common_fee || 0,
          water_fee: water_fee || 0,
          electricity_fee: electricity_fee || 0,
          parking_fee: parking_fee || 0,
          other_fee: other_fee || 0,
          total,
          due_date,
          status: 'pending'
        }])
        .select(`
          *,
          unit:units(unit_number, owner_name)
        `)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/bills',
        'POST',
        201,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(bill, true, 'Bill created successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/bills',
        'POST',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}
