// lib/supabase/username-auth-actions.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Sign in with username instead of email
 */
export async function signInWithUsername(username: string, password: string) {
  const supabase = await createClient()
  
  try {
    console.log(`[signInWithUsername] Attempting login for username: ${username}`)
    
    // 1. เช็ค username mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('username_mapping')
      .select(`
        id,
        username,
        auth_user_id,
        unit_id
      `)
      .eq('username', username)
      .single()
    
    if (mappingError) {
      console.log(`[signInWithUsername] Mapping error for username: ${username}`, mappingError)
      if (mappingError.code === 'PGRST116') {
        throw new Error("ไม่พบชื่อผู้ใช้นี้ในระบบ")
      }
      throw new Error(`เกิดข้อผิดพลาดในการค้นหาข้อมูล: ${mappingError.message}`)
    }
    
    if (!mapping) {
      console.log(`[signInWithUsername] Username not found: ${username}`)
      throw new Error("ไม่พบชื่อผู้ใช้นี้ในระบบ")
    }
    
    console.log(`[signInWithUsername] Found mapping for username: ${username}`, mapping)
    
    // 2. ใช้ Admin Client เพื่อดึงข้อมูล auth user
    const adminSupabase = createAdminClient()
    const { data: authUser, error: authUserError } = await adminSupabase.auth.admin.getUserById(mapping.auth_user_id)
    
    if (authUserError || !authUser.user) {
      console.log(`[signInWithUsername] Auth user not found for ID: ${mapping.auth_user_id}`, authUserError)
      throw new Error("ไม่พบข้อมูลการยืนยันตัวตน")
    }
    
    console.log(`[signInWithUsername] Found auth user:`, authUser.user.email)
    
    // 3. ใช้ Supabase Auth ด้วย email ของ auth user
    const authUserEmail = authUser.user.email
    if (!authUserEmail) {
      throw new Error("ไม่พบข้อมูลการยืนยันตัวตน")
    }
    
    console.log(`[signInWithUsername] Attempting auth with email: ${authUserEmail}`)
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: authUserEmail,
      password
    })
    
    if (authError) {
      console.log(`[signInWithUsername] Auth failed: ${authError.message}`)
      throw new Error(`การยืนยันตัวตนล้มเหลว: ${authError.message}`)
    }
    
    if (!authData.user) {
      throw new Error("ข้อมูลการยืนยันตัวตนไม่ถูกต้อง")
    }
    
    console.log(`[signInWithUsername] Auth successful for user: ${authData.user.id}`)
    
    // 4. ดึงข้อมูล unit
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, unit_number, owner_name, owner_email')
      .eq('id', mapping.unit_id)
      .single()
    
    if (unitError || !unit) {
      console.log(`[signInWithUsername] Unit not found: ${unitError?.message}`)
      throw new Error("ไม่พบข้อมูลห้องชุด")
    }
    
    console.log(`[signInWithUsername] Login successful for unit: ${unit.unit_number}`)
    
    return {
      success: true,
      resident: {
        id: unit.id,
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email
      },
      session: authData.session,
      username: mapping.username
    }
  } catch (error: any) {
    console.error(`[signInWithUsername] Error:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create username mapping after successful account creation
 */
export async function createUsernameMapping(
  username: string, 
  authUserId: string, 
  unitId: string
) {
  const supabase = await createClient()
  
  try {
    console.log(`[createUsernameMapping] Creating mapping for username: ${username}`)
    
    // เช็คว่า username ซ้ำหรือไม่
    const { data: existing, error: checkError } = await supabase
      .from('username_mapping')
      .select('id')
      .eq('username', username)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found (username available)
      console.error(`[createUsernameMapping] Check error:`, checkError)
      throw new Error(`ไม่สามารถตรวจสอบ username ได้: ${checkError.message}`)
    }
    
    if (existing) {
      console.log(`[createUsernameMapping] Username already exists: ${username}`)
      throw new Error("ชื่อผู้ใช้นี้ถูกใช้แล้ว")
    }
    
    console.log(`[createUsernameMapping] Username available: ${username}`)
    
    // สร้าง mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('username_mapping')
      .insert({
        username,
        auth_user_id: authUserId,
        unit_id: unitId
      })
      .select()
      .single()
    
    if (mappingError) {
      console.error(`[createUsernameMapping] Error:`, mappingError)
      throw new Error(`ไม่สามารถสร้าง username mapping ได้: ${mappingError.message}`)
    }
    
    console.log(`[createUsernameMapping] Mapping created successfully: ${mapping.id}`)
    
    return {
      success: true,
      mapping
    }
  } catch (error: any) {
    console.error(`[createUsernameMapping] Error:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(username: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('username_mapping')
      .select('id')
      .eq('username', username)
      .single()
    
    if (error && error.code === 'PGRST116') {
      // No rows found - username is available
      return {
        success: true,
        available: true
      }
    }
    
    if (error) {
      throw new Error(`ไม่สามารถตรวจสอบ username ได้: ${error.message}`)
    }
    
    // Username exists
    return {
      success: true,
      available: false
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get username by auth user ID
 */
export async function getUsernameByAuthUserId(authUserId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('username_mapping')
      .select('username')
      .eq('auth_user_id', authUserId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: true,
          username: null
        }
      }
      throw new Error(`ไม่สามารถดึง username ได้: ${error.message}`)
    }
    
    return {
      success: true,
      username: data.username
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
