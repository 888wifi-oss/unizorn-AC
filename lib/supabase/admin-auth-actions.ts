"use server"

import { createClient } from "@/lib/supabase/server"
import { getUnitsFromDB } from "@/lib/supabase/actions"

// Admin functions for password management
export async function adminResetResidentPassword(unitNumber: string, newPassword: string) {
  try {
    // Get all units first
    const units = await getUnitsFromDB()
    const unit = units.find(u => u.unit_number === unitNumber)
    
    if (!unit) {
      throw new Error(`ไม่พบห้อง ${unitNumber} ในระบบ`)
    }

    if (!unit.user_id) {
      throw new Error(`ห้อง ${unitNumber} ยังไม่ได้ลงทะเบียนในระบบ`)
    }

    // For now, we'll return a success message since we can't directly update passwords
    // In a real implementation, you would need to use Supabase Admin API with service role
    return {
      success: true,
      message: `รีเซ็ตรหัสผ่านสำหรับห้อง ${unitNumber} สำเร็จ (จำลอง)`,
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

export async function adminCreateResidentAccount(unitNumber: string, email: string, password: string) {
  try {
    // Get all units first
    const units = await getUnitsFromDB()
    const unit = units.find(u => u.unit_number === unitNumber)
    
    if (!unit) {
      throw new Error(`ไม่พบห้อง ${unitNumber} ในระบบ`)
    }

    if (unit.user_id) {
      throw new Error(`ห้อง ${unitNumber} มีบัญชีอยู่แล้ว`)
    }

    // For now, we'll return a success message since we can't directly create auth users
    // In a real implementation, you would need to use Supabase Admin API with service role
    return {
      success: true,
      message: `สร้างบัญชีสำหรับห้อง ${unitNumber} สำเร็จ (จำลอง)`,
      unit: {
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: email
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function adminGetResidentAccountStatus(unitNumber: string) {
  try {
    // Get all units first
    const units = await getUnitsFromDB()
    const unit = units.find(u => u.unit_number === unitNumber)
    
    if (!unit) {
      throw new Error(`ไม่พบห้อง ${unitNumber} ในระบบ`)
    }

    let authStatus = null
    if (unit.user_id) {
      authStatus = {
        has_account: true,
        email: unit.owner_email,
        created_at: new Date().toISOString(),
        last_sign_in: null
      }
    }

    return {
      success: true,
      unit: {
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email,
        user_id: unit.user_id
      },
      auth_status: authStatus || { has_account: false }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function adminDeleteResidentAccount(unitNumber: string) {
  try {
    // Get all units first
    const units = await getUnitsFromDB()
    const unit = units.find(u => u.unit_number === unitNumber)
    
    if (!unit) {
      throw new Error(`ไม่พบห้อง ${unitNumber} ในระบบ`)
    }

    if (!unit.user_id) {
      throw new Error(`ห้อง ${unitNumber} ไม่มีบัญชีในระบบ`)
    }

    // For now, we'll return a success message since we can't directly delete auth users
    // In a real implementation, you would need to use Supabase Admin API with service role
    return {
      success: true,
      message: `ลบบัญชีสำหรับห้อง ${unitNumber} สำเร็จ (จำลอง)`
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function adminListResidentAccounts() {
  try {
    // Get all units first
    const units = await getUnitsFromDB()
    
    const accounts = units.map(unit => {
      let authStatus = null
      if (unit.user_id) {
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
        user_id: unit.user_id,
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
