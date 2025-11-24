// lib/supabase/simple-username-auth.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Simple Username Authentication
 * ใช้ username เป็น email format และเก็บใน units table
 */
export async function signInWithUsernameSimple(username: string, password: string) {
  const supabase = await createClient()
  
  try {
    console.log(`[Simple Auth] Attempting login for username: ${username}`)
    
    // 1. หา unit ที่มี username ตรงกัน หรือ unit_number ตรงกัน
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, unit_number, owner_name, owner_email, user_id, username, password')
      .or(`username.eq.${username},unit_number.eq.${username}`)
      .single()
    
    if (unitError || !unit) {
      console.log(`[Simple Auth] Unit not found for username: ${username}`)
      throw new Error("ไม่พบชื่อผู้ใช้นี้ในระบบ")
    }
    
    console.log(`[Simple Auth] Found unit: ${unit.unit_number}, username: ${unit.username}`)
    
    // 2. ถ้ามี user_id ให้ใช้ Supabase Auth
    if (unit.user_id) {
      console.log(`[Simple Auth] Using Supabase Auth for user_id: ${unit.user_id}`)
      
      // สร้าง email format จาก username
      const userEmail = `${username}@unizorn.local`
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password
      })
      
      if (authError) {
        console.log(`[Simple Auth] Auth failed: ${authError.message}`)
        throw new Error(`การยืนยันตัวตนล้มเหลว: ${authError.message}`)
      }
      
      console.log(`[Simple Auth] Login successful with Supabase Auth`)
      
      return {
        success: true,
        resident: {
          id: unit.id,
          unit_number: unit.unit_number,
          owner_name: unit.owner_name,
          owner_email: unit.owner_email
        },
        session: authData.session,
        username: username
      }
    }
    
    // 3. ถ้าไม่มี user_id ให้ใช้ simple password check
    console.log(`[Simple Auth] Using simple password check`)
    
    // ตรวจสอบรหัสผ่าน (ต้องเก็บใน units table)
    if (!unit.password) {
      throw new Error("ห้องชุดนี้ยังไม่ได้ตั้งรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ")
    }
    
    if (unit.password !== password) {
      throw new Error("รหัสผ่านไม่ถูกต้อง")
    }
    
    console.log(`[Simple Auth] Login successful with simple auth`)
    
    return {
      success: true,
      resident: {
        id: unit.id,
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email
      },
      username: unit.username || unit.unit_number
    }
    
  } catch (error: any) {
    console.error(`[Simple Auth] Error:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create account with simple username system
 */
export async function createAccountSimple(
  username: string,
  password: string,
  unitId: string,
  email?: string
) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  
  try {
    console.log(`[Simple Create] Creating account for username: ${username}`)
    
    // 1. ตรวจสอบว่า username ซ้ำหรือไม่
    const { data: existingUnit } = await supabase
      .from('units')
      .select('id')
      .eq('username', username)
      .single()
    
    if (existingUnit) {
      throw new Error("ชื่อผู้ใช้นี้ถูกใช้แล้ว")
    }
    
    // 2. สร้าง auth user
    const userEmail = email || `${username}@unizorn.local`
    
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: userEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: username,
        user_type: 'resident'
      }
    })
    
    if (authError) {
      throw new Error(`ไม่สามารถสร้างบัญชีได้: ${authError.message}`)
    }
    
    // 3. อัปเดต unit
    const { error: updateError } = await supabase
      .from('units')
      .update({
        user_id: authData.user.id,
        username: username,
        password: null, // ลบ plain text password
        owner_email: userEmail
      })
      .eq('id', unitId)
    
    if (updateError) {
      // ลบ auth user ถ้าอัปเดต unit ไม่สำเร็จ
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(`ไม่สามารถเชื่อมโยงบัญชีได้: ${updateError.message}`)
    }
    
    console.log(`[Simple Create] Account created successfully`)
    
    return {
      success: true,
      user: authData.user,
      message: "สร้างบัญชีสำเร็จ"
    }
    
  } catch (error: any) {
    console.error(`[Simple Create] Error:`, error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function signOutResidentSimple() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error("Error signing out:", error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}
