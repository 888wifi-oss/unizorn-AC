"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Upload image to Supabase Storage
 * @param file - File object from form
 * @param bucket - Storage bucket name (default: 'maintenance-images')
 * @param folder - Folder path (default: 'requests')
 * @returns URL of uploaded image
 */
export async function uploadImageToStorage(
  file: File,
  bucket: string = 'maintenance-images',
  folder: string = 'requests'
): Promise<string> {
  const supabase = await createClient()
  
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${timestamp}-${randomStr}.${fileExt}`
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (error) {
      console.error('[uploadImageToStorage] Error:', error)
      throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${error.message}`)
    }
    
    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(fileName)
    
    console.log('[uploadImageToStorage] Upload successful:', urlData.publicUrl)
    return urlData.publicUrl
    
  } catch (error: any) {
    console.error('[uploadImageToStorage] Error:', error)
    throw error
  }
}

/**
 * Upload multiple images to Supabase Storage
 * @param files - Array of File objects
 * @param bucket - Storage bucket name (default: 'maintenance-images')
 * @param folder - Folder path (default: 'requests')
 * @returns Array of image URLs
 */
export async function uploadMultipleImagesToStorage(
  files: File[],
  bucket: string = 'maintenance-images',
  folder: string = 'requests'
): Promise<string[]> {
  const supabase = await createClient()
  
  try {
    const uploadPromises = files.map(file => uploadImageToStorage(file, bucket, folder))
    const urls = await Promise.all(uploadPromises)
    
    console.log('[uploadMultipleImagesToStorage] All uploads successful:', urls.length)
    return urls
    
  } catch (error: any) {
    console.error('[uploadMultipleImagesToStorage] Error:', error)
    throw error
  }
}

/**
 * Delete image from Supabase Storage
 * @param imageUrl - Public URL of the image
 * @param bucket - Storage bucket name (default: 'maintenance-images')
 */
export async function deleteImageFromStorage(
  imageUrl: string,
  bucket: string = 'maintenance-images'
): Promise<void> {
  const supabase = await createClient()
  
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const folder = 'requests'
    const fullPath = `${folder}/${fileName}`
    
    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([fullPath])
    
    if (error) {
      console.error('[deleteImageFromStorage] Error:', error)
      throw new Error(`ไม่สามารถลบรูปภาพได้: ${error.message}`)
    }
    
    console.log('[deleteImageFromStorage] Delete successful:', fullPath)
    
  } catch (error: any) {
    console.error('[deleteImageFromStorage] Error:', error)
    throw error
  }
}

















