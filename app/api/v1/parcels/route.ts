// app/api/v1/parcels/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, createApiResponse, createErrorResponse, logApiUsage } from '@/lib/api/middleware'
import { PaginatedResponse } from '@/lib/api/types'

// GET /api/v1/parcels - Get all parcels
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
      const unitNumber = url.searchParams.get('unit_number') || ''
      const status = url.searchParams.get('status') || ''
      const courier = url.searchParams.get('courier') || ''
      const search = url.searchParams.get('search') || ''
      const sort = url.searchParams.get('sort') || 'received_at'
      const order = url.searchParams.get('order') || 'desc'

      const supabase = await createClient()
      
      let query = supabase
        .from('parcels')
        .select('*', { count: 'exact' })
        .order(sort, { ascending: order === 'asc' })

      // Apply filters
      if (unitNumber) {
        query = query.eq('unit_number', unitNumber)
      }
      if (status) {
        query = query.eq('status', status)
      }
      if (courier) {
        query = query.ilike('courier', `%${courier}%`)
      }
      if (search) {
        query = query.or(`recipient_name.ilike.%${search}%,tracking_number.ilike.%${search}%`)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: parcels, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      const totalPages = Math.ceil((count || 0) / limit)
      
      const response: PaginatedResponse<any> = {
        success: true,
        data: parcels || [],
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
        '/api/v1/parcels',
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
        '/api/v1/parcels',
        'GET',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// POST /api/v1/parcels - Register new parcel
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('parcels:write')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const body = await req.json()
      const { 
        unit_number, 
        recipient_name, 
        courier, 
        tracking_number,
        size,
        notes,
        photo_url,
        received_by
      } = body

      // Validate required fields
      if (!unit_number || !recipient_name || !courier) {
        return createErrorResponse('Missing required fields', 400)
      }

      const supabase = await createClient()
      
      // Check if unit exists
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('unit_number')
        .eq('unit_number', unit_number)
        .single()

      if (unitError) {
        return createErrorResponse('Unit not found', 404)
      }

      // Generate QR code (simplified version)
      const qrCode = `PARCEL_${Date.now()}_${unit_number}`

      const { data: parcel, error } = await supabase
        .from('parcels')
        .insert([{
          unit_number,
          recipient_name,
          courier,
          tracking_number: tracking_number || null,
          size: size || 'medium',
          notes: notes || null,
          photo_url: photo_url || null,
          received_by: received_by || apiKey.name,
          received_at: new Date().toISOString(),
          status: 'pending',
          qr_code: qrCode
        }])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/parcels',
        'POST',
        201,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(parcel, true, 'Parcel registered successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/parcels',
        'POST',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}
