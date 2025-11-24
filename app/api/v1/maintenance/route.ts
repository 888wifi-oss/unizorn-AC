// app/api/v1/maintenance/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, createApiResponse, createErrorResponse, logApiUsage } from '@/lib/api/middleware'
import { PaginatedResponse } from '@/lib/api/types'

// GET /api/v1/maintenance - Get all maintenance requests
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
      const unitId = url.searchParams.get('unit_id') || ''
      const status = url.searchParams.get('status') || ''
      const category = url.searchParams.get('category') || ''
      const priority = url.searchParams.get('priority') || ''
      const search = url.searchParams.get('search') || ''
      const sort = url.searchParams.get('sort') || 'created_at'
      const order = url.searchParams.get('order') || 'desc'

      const supabase = await createClient()
      
      let query = supabase
        .from('maintenance_requests')
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
      if (category) {
        query = query.eq('category', category)
      }
      if (priority) {
        query = query.eq('priority', priority)
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: requests, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      const totalPages = Math.ceil((count || 0) / limit)
      
      const response: PaginatedResponse<any> = {
        success: true,
        data: requests || [],
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
        '/api/v1/maintenance',
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
        '/api/v1/maintenance',
        'GET',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// POST /api/v1/maintenance - Create new maintenance request
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('maintenance:write')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const body = await req.json()
      const { 
        unit_id, 
        title, 
        description, 
        category, 
        priority, 
        location,
        contact_phone,
        contact_name,
        preferred_date,
        preferred_time,
        images
      } = body

      // Validate required fields
      if (!unit_id || !title || !description || !category) {
        return createErrorResponse('Missing required fields', 400)
      }

      const supabase = await createClient()
      
      // Check if unit exists
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id, unit_number')
        .eq('id', unit_id)
        .single()

      if (unitError) {
        return createErrorResponse('Unit not found', 404)
      }

      // Generate request number
      const requestNumber = `MR${Date.now()}`

      const { data: maintenanceRequest, error } = await supabase
        .from('maintenance_requests')
        .insert([{
          unit_id,
          request_number: requestNumber,
          title,
          description,
          category,
          priority: priority || 'medium',
          status: 'pending',
          location: location || null,
          contact_phone: contact_phone || null,
          contact_name: contact_name || null,
          preferred_date: preferred_date || null,
          preferred_time: preferred_time || null,
          images: images || null,
          created_by: apiKey.name
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
        '/api/v1/maintenance',
        'POST',
        201,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(maintenanceRequest, true, 'Maintenance request created successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/maintenance',
        'POST',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}
