// app/api/v1/parcels/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, createApiResponse, createErrorResponse, logApiUsage } from '@/lib/api/middleware'

// GET /api/v1/parcels/[id] - Get parcel by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      const { id } = params
      
      if (!id) {
        return createErrorResponse('Parcel ID is required', 400)
      }

      const supabase = await createClient()
      
      const { data: parcel, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('Parcel not found', 404)
        }
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/parcels/${id}`,
        'GET',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(parcel)
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/parcels/${params.id}`,
        'GET',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// PUT /api/v1/parcels/[id] - Update parcel (e.g., mark as picked up)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('parcels:write')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const { id } = params
      
      if (!id) {
        return createErrorResponse('Parcel ID is required', 400)
      }

      const body = await req.json()
      const { 
        status,
        picked_up_by,
        picked_up_method,
        staff_delivered_by,
        digital_signature,
        delivery_photo_url,
        notes
      } = body

      const supabase = await createClient()
      
      // Check if parcel exists
      const { data: existingParcel, error: checkError } = await supabase
        .from('parcels')
        .select('id, status')
        .eq('id', id)
        .single()

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return createErrorResponse('Parcel not found', 404)
        }
        throw new Error(checkError.message)
      }

      // Update parcel
      const updateData: any = {}
      if (status !== undefined) updateData.status = status
      if (picked_up_by !== undefined) updateData.picked_up_by = picked_up_by
      if (picked_up_method !== undefined) updateData.picked_up_method = picked_up_method
      if (staff_delivered_by !== undefined) updateData.staff_delivered_by = staff_delivered_by
      if (digital_signature !== undefined) updateData.digital_signature = digital_signature
      if (delivery_photo_url !== undefined) updateData.delivery_photo_url = delivery_photo_url
      if (notes !== undefined) updateData.notes = notes

      // Auto-set picked_up_at if status is picked_up
      if (status === 'picked_up' && !updateData.picked_up_at) {
        updateData.picked_up_at = new Date().toISOString()
      }

      const { data: parcel, error } = await supabase
        .from('parcels')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/parcels/${id}`,
        'PUT',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(parcel, true, 'Parcel updated successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/parcels/${params.id}`,
        'PUT',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// DELETE /api/v1/parcels/[id] - Delete parcel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('parcels:delete')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const { id } = params
      
      if (!id) {
        return createErrorResponse('Parcel ID is required', 400)
      }

      const supabase = await createClient()
      
      // Check if parcel exists
      const { data: existingParcel, error: checkError } = await supabase
        .from('parcels')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return createErrorResponse('Parcel not found', 404)
        }
        throw new Error(checkError.message)
      }

      // Delete parcel
      const { error } = await supabase
        .from('parcels')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/parcels/${id}`,
        'DELETE',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(null, true, 'Parcel deleted successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/parcels/${params.id}`,
        'DELETE',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}
