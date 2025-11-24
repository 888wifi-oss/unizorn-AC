"use server"

import { createClient } from "@/lib/supabase/server"
import { getUnitsFromDB } from "@/lib/supabase/actions"
import { redirect } from "next/navigation"

// Simple authentication functions (no Supabase Auth required)
export async function signInResidentSimple(unitNumber: string, password: string) {
  try {
    const unitsResult = await getUnitsFromDB()
    
    if (!unitsResult.success) {
      return { success: false, error: `ไม่สามารถเข้าถึงข้อมูลห้องได้: ${unitsResult.error}` }
    }
    
    const units = unitsResult.units
    const unit = units.find(u => u.unit_number === unitNumber)
    
    if (!unit) {
      return { success: false, error: "ไม่พบห้องในระบบ" }
    }

    if (!unit.password) {
      return { success: false, error: "ห้องนี้ยังไม่ได้ตั้งรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ" }
    }

    if (unit.password !== password) {
      return { success: false, error: "รหัสผ่านไม่ถูกต้อง" }
    }

    return {
      success: true,
      resident: {
        id: unit.id,
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function signOutResidentSimple() {
  redirect("/portal/login")
}

export async function updateResidentPasswordSimple(unitNumber: string, newPassword: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('units')
      .update({ password: newPassword })
      .eq('unit_number', unitNumber)

    if (error) {
      throw new Error(`ไม่สามารถอัปเดตรหัสผ่านได้: ${error.message}`)
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Admin functions for simple password management
export async function adminCreateResidentAccountSimple(unitNumber: string, password: string) {
  try {
    const unitsResult = await getUnitsFromDB()
    
    if (!unitsResult.success) {
      return { success: false, error: `ไม่สามารถเข้าถึงข้อมูลห้องได้: ${unitsResult.error}` }
    }
    
    const units = unitsResult.units
    const unit = units.find(u => u.unit_number === unitNumber)
    
    if (!unit) {
      throw new Error(`ไม่พบห้อง ${unitNumber} ในระบบ`)
    }

    if (unit.password) {
      throw new Error(`ห้อง ${unitNumber} มีรหัสผ่านอยู่แล้ว`)
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('units')
      .update({ password })
      .eq('unit_number', unitNumber)

    if (error) {
      throw new Error(`ไม่สามารถสร้างรหัสผ่านได้: ${error.message}`)
    }

    return {
      success: true,
      message: `สร้างรหัสผ่านสำหรับห้อง ${unitNumber} สำเร็จ`,
      unit: {
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function adminResetResidentPasswordSimple(unitNumber: string, newPassword: string) {
  try {
    const unitsResult = await getUnitsFromDB()
    
    if (!unitsResult.success) {
      return { success: false, error: `ไม่สามารถเข้าถึงข้อมูลห้องได้: ${unitsResult.error}` }
    }
    
    const units = unitsResult.units
    const unit = units.find(u => u.unit_number === unitNumber)
    
    if (!unit) {
      throw new Error(`ไม่พบห้อง ${unitNumber} ในระบบ`)
    }

    if (!unit.password) {
      throw new Error(`ห้อง ${unitNumber} ยังไม่ได้ตั้งรหัสผ่าน`)
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('units')
      .update({ password: newPassword })
      .eq('unit_number', unitNumber)

    if (error) {
      throw new Error(`ไม่สามารถรีเซ็ตรหัสผ่านได้: ${error.message}`)
    }

    return {
      success: true,
      message: `รีเซ็ตรหัสผ่านสำหรับห้อง ${unitNumber} สำเร็จ`,
      unit: {
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function adminDeleteResidentAccountSimple(unitNumber: string) {
  try {
    const unitsResult = await getUnitsFromDB()
    
    if (!unitsResult.success) {
      return { success: false, error: `ไม่สามารถเข้าถึงข้อมูลห้องได้: ${unitsResult.error}` }
    }
    
    const units = unitsResult.units
    const unit = units.find(u => u.unit_number === unitNumber)
    
    if (!unit) {
      throw new Error(`ไม่พบห้อง ${unitNumber} ในระบบ`)
    }

    if (!unit.password) {
      throw new Error(`ห้อง ${unitNumber} ไม่มีรหัสผ่านในระบบ`)
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('units')
      .update({ password: null })
      .eq('unit_number', unitNumber)

    if (error) {
      throw new Error(`ไม่สามารถลบรหัสผ่านได้: ${error.message}`)
    }

    return {
      success: true,
      message: `ลบรหัสผ่านสำหรับห้อง ${unitNumber} สำเร็จ`
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function adminListResidentAccountsSimple() {
  try {
    const unitsResult = await getUnitsFromDB()
    
    if (!unitsResult.success) {
      return { success: false, error: `ไม่สามารถเข้าถึงข้อมูลห้องได้: ${unitsResult.error}` }
    }
    
    const units = unitsResult.units
    
    const accounts = units.map(unit => {
      let authStatus = null
      if (unit.password) {
        authStatus = {
          has_account: true,
          email: unit.owner_email,
          created_at: new Date().toISOString(),
          last_sign_in: null
        }
      }

      return {
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email,
        user_id: unit.password ? 'simple_auth' : null,
        auth_status: authStatus || { has_account: false }
      }
    })

    return {
      success: true,
      accounts
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
