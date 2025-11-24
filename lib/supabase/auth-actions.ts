"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Enhanced security functions for resident authentication
export async function createResidentAccount(email: string, password: string, unitNumber: string) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  
  try {
    // Use Admin API to create user without requiring email confirmation
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (no need for email verification)
      user_metadata: {
        unit_number: unitNumber,
        user_type: 'resident'
      }
    })

    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error("Failed to create user account")
    }

    // Update units table with user_id
    const { error: updateError } = await supabase
      .from('units')
      .update({ 
        user_id: authData.user.id,
        owner_email: email,
        password: null // Remove plain text password
      })
      .eq('unit_number', unitNumber)

    if (updateError) {
      // If update fails, clean up the auth user
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to link account to unit: ${updateError.message}`)
    }

    return {
      success: true,
      user: authData.user,
      message: "Account created successfully"
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function signInResidentWithUsername(username: string, password: string) {
  const supabase = await createClient()
  
  try {
    console.log(`[signInResidentWithUsername] Attempting login for username: ${username}`)
    
    // Try different email formats for username
    const possibleEmails = [
      username, // Direct email if user entered full email
      `${username}@unizorn.local`, // Default format
      `${username}@gmail.com`, // Common email format
      `${username}@hotmail.com`,
      `${username}@yahoo.com`
    ]
    
    console.log(`[signInResidentWithUsername] Trying emails:`, possibleEmails)
    
    let authData = null
    let authError = null
    
    // Try each email format until one works
    for (const email of possibleEmails) {
      console.log(`[signInResidentWithUsername] Trying email: ${email}`)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (!error && data.user) {
        console.log(`[signInResidentWithUsername] Login successful with: ${email}`)
        authData = data
        authError = null
        break
      }
      
      console.log(`[signInResidentWithUsername] Failed with ${email}:`, error?.message)
      authError = error
    }
    
    if (authError) {
      console.log(`[signInResidentWithUsername] All attempts failed. Last error:`, authError.message)
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error("Invalid credentials")
    }

    // Get unit information
    console.log(`[signInResidentWithUsername] Getting unit info for user: ${authData.user.id}`)
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, unit_number, owner_name, owner_email')
      .eq('user_id', authData.user.id)
      .single()

    if (unitError || !unit) {
      console.log(`[signInResidentWithUsername] Unit not found:`, unitError?.message)
      throw new Error("Unit information not found")
    }

    console.log(`[signInResidentWithUsername] Login successful for unit: ${unit.unit_number}`)
    return {
      success: true,
      resident: {
        id: unit.id,
        unit_number: unit.unit_number,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email
      },
      session: authData.session
    }
  } catch (error: any) {
    console.error(`[signInResidentWithUsername] Error:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function signOutResident() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`)
  }
  
  return { success: true }
}

export async function resetResidentPassword(email: string) {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/reset-password`
    })

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`)
    }

    return {
      success: true,
      message: "Password reset email sent"
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function updateResidentPassword(newPassword: string) {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(`Password update failed: ${error.message}`)
    }

    return {
      success: true,
      message: "Password updated successfully"
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Legacy function for backward compatibility (deprecated)
export async function signInResident(unitNumber: string, pass: string): Promise<{ success: boolean; error?: string; resident?: any }> {
  console.warn("⚠️ signInResident with plain text password is deprecated. Use signInResidentWithUsername instead.")
  
  const supabase = await createClient()
  const { data: unit, error } = await supabase.from("units").select("id, unit_number, owner_name, password").eq("unit_number", unitNumber).single()
  if (error || !unit) { return { success: false, error: "ไม่พบเลขห้องนี้ในระบบ" } }
  if (unit.password !== pass) { return { success: false, error: "รหัสผ่านไม่ถูกต้อง" } }
  const { password, ...residentData } = unit
  return { success: true, resident: residentData }
}
