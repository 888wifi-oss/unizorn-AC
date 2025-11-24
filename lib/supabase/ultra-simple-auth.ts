// lib/supabase/ultra-simple-auth.ts
"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Ultra Simple Authentication
 * ใช้แค่ username + password ใน units table
 * ไม่ต้องใช้ Supabase Auth เลย
 */
export async function signInUltraSimple(username: string, password: string) {
  const supabase = await createClient()
  
  try {
    console.log(`[Ultra Simple] Attempting login for: ${username}`)
    
    // หา unit ที่มี username หรือ unit_number ตรงกัน
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, unit_number, owner_name, owner_email, username, password, resident_name, registered_by, project_id')
      .or(`username.eq.${username},unit_number.eq.${username}`)
      .single()
    
    if (unitError || !unit) {
      console.log(`[Ultra Simple] Unit not found: ${username}`)
      throw new Error("ไม่พบชื่อผู้ใช้นี้ในระบบ")
    }
    
    console.log(`[Ultra Simple] Found unit: ${unit.unit_number}`)
    
    // ตรวจสอบรหัสผ่าน
    if (!unit.password) {
      throw new Error("ห้องชุดนี้ยังไม่ได้ตั้งรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ")
    }
    
    if (unit.password !== password) {
      throw new Error("รหัสผ่านไม่ถูกต้อง")
    }
    
    console.log(`[Ultra Simple] Login successful!`)
    
    // หาชื่อผู้ลงทะเบียนจริงจาก View
    let displayName = null
    
    // ลำดับการหาชื่อ: 1. หาจาก tenants ก่อน (ผู้เช่าที่ active)
    try {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('name, status, email, phone')
        .eq('unit_id', unit.id)
        .eq('status', 'active')
        .limit(1)
      
      if (tenants && tenants.length > 0) {
        displayName = tenants[0].name
        console.log(`[Ultra Simple] Found active tenant: ${displayName}`)
      }
    } catch (error) {
      console.log(`[Ultra Simple] Error fetching tenants:`, error)
    }
    
    // 2. ถ้ายังไม่มี หาจาก owners (เจ้าของหลัก)
    if (!displayName) {
      try {
        const { data: owners } = await supabase
          .from('owners')
          .select('name, is_primary, email, phone')
          .eq('unit_id', unit.id)
          .eq('is_primary', true)
          .limit(1)
        
        if (owners && owners.length > 0) {
          displayName = owners[0].name
          console.log(`[Ultra Simple] Found primary owner: ${displayName}`)
        }
      } catch (error) {
        console.log(`[Ultra Simple] Error fetching owners:`, error)
      }
    }
    
    // 3. ถ้ามี resident_name ให้ใช้ resident_name
    if (!displayName && unit.resident_name) {
      displayName = unit.resident_name
      console.log(`[Ultra Simple] Using resident_name: ${displayName}`)
    }
    
    // 4. ถ้ายังไม่มี ใช้ owner_name (ชื่อเจ้าของห้อง)
    if (!displayName) {
      displayName = unit.owner_name
      console.log(`[Ultra Simple] Using owner_name: ${displayName}`)
    }
    
    // 5. ถ้ายังไม่มี ให้ใช้ชื่อ generic
    if (!displayName) {
      displayName = `ผู้อาศัยห้อง ${unit.unit_number}`
      console.log(`[Ultra Simple] Using generic name: ${displayName}`)
    }
    
    console.log(`[Ultra Simple] Login successful for: ${displayName} (${unit.unit_number})`)
    
    return {
      success: true,
      resident: {
        id: unit.id,
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email,
        resident_name: displayName,
        project_id: unit.project_id
      },
      username: unit.username || unit.unit_number
    }
    
  } catch (error: any) {
    console.error(`[Ultra Simple] Error:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create account ultra simple
 * เก็บ username + password ใน units table
 */
export async function createAccountUltraSimple(
  username: string,
  password: string,
  unitId: string
) {
  const supabase = await createClient()
  
  try {
    console.log(`[Ultra Simple Create] Creating account for: ${username}`)
    
    // ตรวจสอบว่า username ซ้ำหรือไม่
    const { data: existingUnit } = await supabase
      .from('units')
      .select('id')
      .eq('username', username)
      .single()
    
    if (existingUnit) {
      throw new Error("ชื่อผู้ใช้นี้ถูกใช้แล้ว")
    }
    
    // อัปเดต unit ด้วย username และ password
    const { error: updateError } = await supabase
      .from('units')
      .update({
        username: username,
        password: password
      })
      .eq('id', unitId)
    
    if (updateError) {
      throw new Error(`ไม่สามารถสร้างบัญชีได้: ${updateError.message}`)
    }
    
    console.log(`[Ultra Simple Create] Account created successfully`)
    
    return {
      success: true,
      message: "สร้างบัญชีสำเร็จ"
    }
    
  } catch (error: any) {
    console.error(`[Ultra Simple Create] Error:`, error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function signOutUltraSimple() {
  // ไม่ต้องทำอะไร เพราะไม่ได้ใช้ session
  return { success: true }
}
