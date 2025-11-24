// lib/types/file-management.ts

export interface FileCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FileItem {
  id: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  file_extension?: string
  category_id?: string
  uploaded_by: string
  unit_number?: string
  description?: string
  tags?: string[]
  is_public: boolean
  is_active: boolean
  version: number
  parent_file_id?: string
  download_count: number
  created_at: string
  updated_at: string
  category?: FileCategory
}

export interface FilePermission {
  id: string
  file_id: string
  unit_number?: string
  permission_type: 'read' | 'write' | 'admin'
  granted_by: string
  granted_at: string
  expires_at?: string
  is_active: boolean
}

export interface FileDownload {
  id: string
  file_id: string
  downloaded_by: string
  unit_number?: string
  download_ip?: string
  user_agent?: string
  downloaded_at: string
}

export interface FileUploadData {
  file: File
  category_id?: string
  unit_number?: string
  description?: string
  tags?: string[]
  is_public?: boolean
}

export interface FileSearchFilters {
  category_id?: string
  unit_number?: string
  mime_type?: string
  tags?: string[]
  is_public?: boolean
  date_from?: string
  date_to?: string
  uploaded_by?: string
}

export interface FileStats {
  total_files: number
  total_size: number
  files_by_category: Array<{
    category_name: string
    count: number
    total_size: number
  }>
  files_by_type: Array<{
    mime_type: string
    count: number
    total_size: number
  }>
  recent_uploads: FileItem[]
  most_downloaded: FileItem[]
}

export interface FileUploadProgress {
  file_id: string
  filename: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}
