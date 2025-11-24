// app/api/v1/maintenance/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, createApiResponse, createErrorResponse, logApiUsage } from '@/lib/api/middleware'

// GET /api/v1/maintenance/[id] - Get maintenance request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      const { id } = params
      
      if (!id) {
        return createErrorResponse('Maintenance request ID is required', 400)
      }

      const supabase = await createClient()
      
      const { data: maintenanceRequest, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          unit:units(unit_number, owner_name, owner_phone, owner_email)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('Maintenance request not found', 404)
        }
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/maintenance/${id}`,
        'GET',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(maintenanceRequest)
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/maintenance/${params.id}`,
        'GET',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// PUT /api/v1/maintenance/[id] - Update maintenance request
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('maintenance:write')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const { id } = params
      
      if (!id) {
        return createErrorResponse('Maintenance request ID is required', 400)
      }

      const body = await req.json()
      const { 
        title, 
        description, 
        category, 
        priority, 
        status,
        location,
        contact_phone,
        contact_name,
        preferred_date,
        preferred_time,
        assigned_to,
        scheduled_date,
        scheduled_time,
        completed_at,
        technician_notes,
        cost,
        images
      } = body

      const supabase = await createClient()
      
      // Check if maintenance request exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('maintenance_requests')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return createErrorResponse('Maintenance request not found', 404)
        }
        throw new Error(checkError.message)
      }

      // Update maintenance request
      const updateData: any = {}
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (category !== undefined) updateData.category = category
      if (priority !== undefined) updateData.priority = priority
      if (status !== undefined) updateData.status = status
      if (location !== undefined) updateData.location = location
      if (contact_phone !== undefined) updateData.contact_phone = contact_phone
      if (contact_name !== undefined) updateData.contact_name = contact_name
      if (preferred_date !== undefined) updateData.preferred_date = preferred_date
      if (preferred_time !== undefined) updateData.preferred_time = preferred_time
      if (assigned_to !== undefined) updateData.assigned_to = assigned_to
      if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date
      if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time
      if (completed_at !== undefined) updateData.completed_at = completed_at
      if (technician_notes !== undefined) updateData.technician_notes = technician_notes
      if (cost !== undefined) updateData.cost = cost
      if (images !== undefined) updateData.images = images

      // Auto-set completed_at if status is completed
      if (status === 'completed' && !completed_at) {
        updateData.completed_at = new Date().toISOString()
      }

      const { data: maintenanceRequest, error } = await supabase
        .from('maintenance_requests')
        .update(updateData)
        .eq('id', id)
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
        `/api/v1/maintenance/${id}`,
        'PUT',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(maintenanceRequest, true, 'Maintenance request updated successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/maintenance/${params.id}`,
        'PUT',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// DELETE /api/v1/maintenance/[id] - Delete maintenance request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('maintenance:delete')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const { id } = params
      
      if (!id) {
        return createErrorResponse('Maintenance request ID is required', 400)
      }

      const supabase = await createClient()
      
      // Check if maintenance request exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('maintenance_requests')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return createErrorResponse('Maintenance request not found', 404)
        }
        throw new Error(checkError.message)
      }

      // Delete maintenance request
      const { error } = await supabase
        .from('maintenance_requests')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/maintenance/${id}`,
        'DELETE',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(null, true, 'Maintenance request deleted successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/maintenance/${params.id}`,
        'DELETE',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}
