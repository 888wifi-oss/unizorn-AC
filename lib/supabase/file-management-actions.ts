"use server"

import { createClient } from "@/lib/supabase/server"
import { 
  FileCategory, 
  FileItem, 
  FilePermission, 
  FileDownload, 
  FileUploadData, 
  FileSearchFilters, 
  FileStats 
} from "@/lib/types/file-management"

// File Categories
export async function getFileCategories(): Promise<{ success: boolean; categories?: FileCategory[]; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('file_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Error fetching file categories:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, categories: data || [] }
  } catch (error: any) {
    console.error('Exception in getFileCategories:', error)
    return { success: false, error: error.message }
  }
}

export async function createFileCategory(category: Omit<FileCategory, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; category?: FileCategory; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('file_categories')
      .insert([category])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating file category:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, category: data }
  } catch (error: any) {
    console.error('Exception in createFileCategory:', error)
    return { success: false, error: error.message }
  }
}

// Files
export async function getFiles(filters?: FileSearchFilters, limit = 50, offset = 0): Promise<{ success: boolean; files?: FileItem[]; total?: number; error?: string }> {
  const supabase = await createClient()
  
  try {
    let query = supabase
      .from('files')
      .select(`
        *,
        category:file_categories(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.unit_number) {
      query = query.eq('unit_number', filters.unit_number)
    }
    if (filters?.mime_type) {
      query = query.eq('mime_type', filters.mime_type)
    }
    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    }
    if (filters?.uploaded_by) {
      query = query.eq('uploaded_by', filters.uploaded_by)
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }
    
    // Get total count
    const { count } = await query.select('*', { count: 'exact', head: true })
    
    // Get paginated results
    const { data, error } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching files:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, files: data || [], total: count || 0 }
  } catch (error: any) {
    console.error('Exception in getFiles:', error)
    return { success: false, error: error.message }
  }
}

export async function getFileById(fileId: string): Promise<{ success: boolean; file?: FileItem; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        category:file_categories(*)
      `)
      .eq('id', fileId)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Error fetching file:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, file: data }
  } catch (error: any) {
    console.error('Exception in getFileById:', error)
    return { success: false, error: error.message }
  }
}

export async function createFileRecord(fileData: Omit<FileItem, 'id' | 'created_at' | 'updated_at' | 'download_count'>): Promise<{ success: boolean; file?: FileItem; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('files')
      .insert([fileData])
      .select(`
        *,
        category:file_categories(*)
      `)
      .single()
    
    if (error) {
      console.error('Error creating file record:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, file: data }
  } catch (error: any) {
    console.error('Exception in createFileRecord:', error)
    return { success: false, error: error.message }
  }
}

export async function updateFileRecord(fileId: string, updates: Partial<FileItem>): Promise<{ success: boolean; file?: FileItem; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', fileId)
      .select(`
        *,
        category:file_categories(*)
      `)
      .single()
    
    if (error) {
      console.error('Error updating file record:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, file: data }
  } catch (error: any) {
    console.error('Exception in updateFileRecord:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteFileRecord(fileId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('files')
      .update({ is_active: false })
      .eq('id', fileId)
    
    if (error) {
      console.error('Error deleting file record:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Exception in deleteFileRecord:', error)
    return { success: false, error: error.message }
  }
}

// File Permissions
export async function getFilePermissions(fileId: string): Promise<{ success: boolean; permissions?: FilePermission[]; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('file_permissions')
      .select('*')
      .eq('file_id', fileId)
      .eq('is_active', true)
      .order('granted_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching file permissions:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, permissions: data || [] }
  } catch (error: any) {
    console.error('Exception in getFilePermissions:', error)
    return { success: false, error: error.message }
  }
}

export async function createFilePermission(permission: Omit<FilePermission, 'id' | 'granted_at'>): Promise<{ success: boolean; permission?: FilePermission; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('file_permissions')
      .insert([permission])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating file permission:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, permission: data }
  } catch (error: any) {
    console.error('Exception in createFilePermission:', error)
    return { success: false, error: error.message }
  }
}

// File Downloads
export async function recordFileDownload(download: Omit<FileDownload, 'id' | 'downloaded_at'>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  try {
    // Record download
    const { error: downloadError } = await supabase
      .from('file_downloads')
      .insert([download])
    
    if (downloadError) {
      console.error('Error recording file download:', downloadError)
      return { success: false, error: downloadError.message }
    }
    
    // Update download count
    const { error: updateError } = await supabase
      .from('files')
      .update({ download_count: supabase.raw('download_count + 1') })
      .eq('id', download.file_id)
    
    if (updateError) {
      console.error('Error updating download count:', updateError)
      return { success: false, error: updateError.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Exception in recordFileDownload:', error)
    return { success: false, error: error.message }
  }
}

// File Statistics
export async function getFileStats(projectId?: string | null): Promise<{ success: boolean; stats?: FileStats; error?: string }> {
  const supabase = await createClient()
  
  try {
    // Get total files and size
    let totalQuery = supabase
      .from('files')
      .select('id, file_size')
      .eq('is_active', true)
    
    if (projectId) {
      totalQuery = totalQuery.eq('project_id', projectId)
    }
    
    const { data: totalData, error: totalError } = await totalQuery
    
    if (totalError) {
      console.error('Error fetching total files:', totalError)
      return { success: false, error: totalError.message }
    }
    
    const totalFiles = totalData?.length || 0
    const totalSize = totalData?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0
    
    // Get files by category
    let categoryQuery = supabase
      .from('files')
      .select(`
        category_id,
        file_categories!inner(name),
        file_size
      `)
      .eq('is_active', true)
    
    if (projectId) {
      categoryQuery = categoryQuery.eq('project_id', projectId)
    }
    
    const { data: categoryData, error: categoryError } = await categoryQuery
    
    if (categoryError) {
      console.error('Error fetching files by category:', categoryError)
      return { success: false, error: categoryError.message }
    }
    
    const filesByCategory = (categoryData || []).reduce((acc: any[], file: any) => {
      const categoryName = file.file_categories?.name || 'ไม่ระบุ'
      const existing = acc.find(item => item.category_name === categoryName)
      if (existing) {
        existing.count += 1
        existing.total_size += file.file_size || 0
      } else {
        acc.push({
          category_name: categoryName,
          count: 1,
          total_size: file.file_size || 0
        })
      }
      return acc
    }, [])
    
    // Get files by type
    const { data: typeData, error: typeError } = await supabase
      .from('files')
      .select('mime_type, file_size')
      .eq('is_active', true)
    
    if (typeError) {
      console.error('Error fetching files by type:', typeError)
      return { success: false, error: typeError.message }
    }
    
    const filesByType = (typeData || []).reduce((acc: any[], file: any) => {
      const existing = acc.find(item => item.mime_type === file.mime_type)
      if (existing) {
        existing.count += 1
        existing.total_size += file.file_size || 0
      } else {
        acc.push({
          mime_type: file.mime_type,
          count: 1,
          total_size: file.file_size || 0
        })
      }
      return acc
    }, [])
    
    // Get recent uploads
    const { data: recentData, error: recentError } = await supabase
      .from('files')
      .select(`
        *,
        category:file_categories(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (recentError) {
      console.error('Error fetching recent uploads:', recentError)
      return { success: false, error: recentError.message }
    }
    
    // Get most downloaded
    const { data: downloadedData, error: downloadedError } = await supabase
      .from('files')
      .select(`
        *,
        category:file_categories(*)
      `)
      .eq('is_active', true)
      .order('download_count', { ascending: false })
      .limit(10)
    
    if (downloadedError) {
      console.error('Error fetching most downloaded files:', downloadedError)
      return { success: false, error: downloadedError.message }
    }
    
    const stats: FileStats = {
      total_files: totalFiles,
      total_size: totalSize,
      files_by_category: filesByCategory,
      files_by_type: filesByType,
      recent_uploads: recentData || [],
      most_downloaded: downloadedData || []
    }
    
    return { success: true, stats }
  } catch (error: any) {
    console.error('Exception in getFileStats:', error)
    return { success: false, error: error.message }
  }
}
