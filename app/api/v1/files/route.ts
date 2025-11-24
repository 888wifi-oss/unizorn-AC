// app/api/v1/files/route.ts

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withApiAuth, createApiResponse, createErrorResponse, logApiUsage } from '@/lib/api/middleware'
import { PaginatedResponse } from '@/lib/api/types'

// GET /api/v1/files - Get all files
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
      const categoryId = url.searchParams.get('category_id') || ''
      const unitNumber = url.searchParams.get('unit_number') || ''
      const mimeType = url.searchParams.get('mime_type') || ''
      const isPublic = url.searchParams.get('is_public') || ''
      const search = url.searchParams.get('search') || ''
      const sort = url.searchParams.get('sort') || 'created_at'
      const order = url.searchParams.get('order') || 'desc'

      const supabase = await createClient()
      
      let query = supabase
        .from('files')
        .select(`
          *,
          category:file_categories(name, icon, color)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order(sort, { ascending: order === 'asc' })

      // Apply filters
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }
      if (unitNumber) {
        query = query.eq('unit_number', unitNumber)
      }
      if (mimeType) {
        query = query.eq('mime_type', mimeType)
      }
      if (isPublic !== '') {
        query = query.eq('is_public', isPublic === 'true')
      }
      if (search) {
        query = query.or(`original_filename.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: files, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      const totalPages = Math.ceil((count || 0) / limit)
      
      const response: PaginatedResponse<any> = {
        success: true,
        data: files || [],
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
        '/api/v1/files',
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
        '/api/v1/files',
        'GET',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}

// POST /api/v1/files - Upload file
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req, apiKey) => {
    const startTime = Date.now()
    
    try {
      // Check permissions
      if (!apiKey.permissions.includes('files:write')) {
        return createErrorResponse('Insufficient permissions', 403)
      }

      const formData = await req.formData()
      const file = formData.get('file') as File
      const categoryId = formData.get('category_id') as string
      const unitNumber = formData.get('unit_number') as string
      const description = formData.get('description') as string
      const tags = formData.get('tags') as string
      const isPublic = formData.get('is_public') === 'true'

      if (!file) {
        return createErrorResponse('File is required', 400)
      }

      const supabase = await createClient()
      
      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop() || ''
      const filename = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`
      
      // Upload file to Supabase Storage (you'll need to configure this)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(filename, file)

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`)
      }

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filename)

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('files')
        .insert([{
          filename,
          original_filename: file.name,
          file_path: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          file_extension: fileExtension,
          category_id: categoryId || null,
          uploaded_by: apiKey.name,
          unit_number: unitNumber || null,
          description: description || null,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : null,
          is_public: isPublic,
          version: 1
        }])
        .select(`
          *,
          category:file_categories(name, icon, color)
        `)
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('files').remove([filename])
        throw new Error(dbError.message)
      }

      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/files',
        'POST',
        201,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )

      return createApiResponse(fileRecord, true, 'File uploaded successfully')
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      logApiUsage(
        apiKey.key,
        '/api/v1/files',
        'POST',
        500,
        responseTime,
        req.headers.get('x-forwarded-for') || 'unknown'
      )
      
      return createErrorResponse(error.message, 500)
    }
  })
}
