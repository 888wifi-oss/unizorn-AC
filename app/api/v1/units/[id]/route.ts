// app/api/v1/units/[id]/route.ts

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, createApiResponse, createErrorResponse, logApiUsage } from '@/lib/api/middleware'

// GET /api/v1/units/[id] - Get unit by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      const { id } = params
      
      if (!id) {
        return createErrorResponse('Unit ID is required', 400)
      }

      const supabase = await createClient()
      
      const { data: unit, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('Unit not found', 404)
        }
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/units/${id}`,
        'GET',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(unit)
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/units/${id}`,
        'GET',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// PUT /api/v1/units/[id] - Update unit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('units:write')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const { id } = params
      
      if (!id) {
        return createErrorResponse('Unit ID is required', 400)
      }

      const body = await req.json()
      const { floor, size, owner_name, owner_phone, owner_email, residents, status } = body

      const supabase = await createClient()
      
      // Check if unit exists
      const { data: existingUnit, error: checkError } = await supabase
        .from('units')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return createErrorResponse('Unit not found', 404)
        }
        throw new Error(checkError.message)
      }

      // Update unit
      const updateData: any = {}
      if (floor !== undefined) updateData.floor = floor
      if (size !== undefined) updateData.size = size
      if (owner_name !== undefined) updateData.owner_name = owner_name
      if (owner_phone !== undefined) updateData.owner_phone = owner_phone
      if (owner_email !== undefined) updateData.owner_email = owner_email
      if (residents !== undefined) updateData.residents = residents
      if (status !== undefined) updateData.status = status

      const { data: unit, error } = await supabase
        .from('units')
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
        `/api/v1/units/${id}`,
        'PUT',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(unit, true, 'Unit updated successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/units/${id}`,
        'PUT',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// DELETE /api/v1/units/[id] - Delete unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('units:delete')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const { id } = params
      
      if (!id) {
        return createErrorResponse('Unit ID is required', 400)
      }

      const supabase = await createClient()
      
      // Check if unit exists
      const { data: existingUnit, error: checkError } = await supabase
        .from('units')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return createErrorResponse('Unit not found', 404)
        }
        throw new Error(checkError.message)
      }

      // Delete unit
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/units/${id}`,
        'DELETE',
        200,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(null, true, 'Unit deleted successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        `/api/v1/units/${id}`,
        'DELETE',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}
