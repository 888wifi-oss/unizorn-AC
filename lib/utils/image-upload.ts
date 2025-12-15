// lib/utils/image-upload.ts
import { createClient } from "@/lib/supabase/client"

export async function uploadImageToStorage(file: File, folder: string = 'parcels'): Promise<string | null> {
  try {
    const supabase = createClient()
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomStr}.${fileExt}`
    
    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`${folder}/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      throw error
    }
    
    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('images')
      .getPublicUrl(data.path)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

// Alternative: Convert file to data URL (no upload needed)
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


















