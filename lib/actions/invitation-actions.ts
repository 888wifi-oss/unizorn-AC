"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAccountUltraSimple } from "@/lib/supabase/ultra-simple-auth"
import crypto from "crypto"

/**
 * Generate invitation code/link for resident to create their own account
 */
export async function generateInvitationCode(unitId: string, email?: string) {
  const supabase = await createClient()
  
  try {
    // Get unit information
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, unit_number, owner_name, owner_email')
      .eq('id', unitId)
      .single()
    
    if (unitError || !unit) {
      return { success: false, error: "ไม่พบข้อมูลห้องชุด" }
    }
    
    // Check if unit already has an account
    if (unit.user_id) {
      return { success: false, error: "ห้องชุดนี้มีบัญชีอยู่แล้ว" }
    }
    
    // Generate unique invitation code
    const invitationCode = crypto.randomBytes(8).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Valid for 7 days
    
    // Store invitation in database
    const { error: insertError } = await supabase
      .from('invitations')
      .insert({
        unit_id: unitId,
        code: invitationCode,
        email: email || unit.owner_email,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
    
    if (insertError) {
      return { success: false, error: `เกิดข้อผิดพลาด: ${insertError.message}` }
    }
    
    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/portal/register?code=${invitationCode}`
    
    return {
      success: true,
      invitationCode,
      invitationLink,
      unit: {
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        email: email || unit.owner_email
      },
      expiresAt: expiresAt.toISOString()
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Verify invitation code and get unit information
 */
export async function verifyInvitationCode(code: string) {
  const supabase = await createClient()
  
  try {
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        *,
        unit:units(
          id,
          unit_number,
          owner_name,
          owner_email
        )
      `)
      .eq('code', code)
      .eq('status', 'pending')
      .single()
    
    if (error || !invitation) {
      return { success: false, error: "รหัสเชิญไม่ถูกต้องหรือหมดอายุ" }
    }
    
    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return { success: false, error: "รหัสเชิญหมดอายุแล้ว" }
    }
    
    return {
      success: true,
      invitation,
      unit: invitation.unit
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create account from invitation
 */
export async function createAccountFromInvitation(
  code: string,
  username: string,
  password: string,
  email?: string
) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  
  try {
    // Verify invitation
    const verifyResult = await verifyInvitationCode(code)
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error }
    }
    
    const { unit } = verifyResult
    
    // Check if unit already has account
    if (unit.user_id) {
      return { success: false, error: "ห้องชุดนี้มีบัญชีอยู่แล้ว" }
    }
    
    // Create auth user with username as email (or use provided email)
    const userEmail = email || unit.owner_email || `${username}@unizorn.local`
    
    // Mark invitation as used
    await supabase
      .from('invitations')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('code', code)
    
    // Create account with ultra simple system
    console.log('[createAccountFromInvitation] Creating account with ultra simple system...')
    const createResult = await createAccountUltraSimple(username, password, unit.id)
    
    if (!createResult.success) {
      throw new Error(createResult.error)
    }
    
    console.log('[createAccountFromInvitation] Account created successfully')
    
    return {
      success: true,
      message: "สร้างบัญชีสำเร็จ"
    }
  } catch (error: any) {
    console.error('[createAccountFromInvitation] Full error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Get invitation history for a unit
 */
export async function getInvitationHistory(unitId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return {
      success: true,
      invitations: data || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      invitations: []
    }
  }
}

