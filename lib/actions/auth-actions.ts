// lib/actions/auth-actions.ts
"use server"

import { createClient } from '@/lib/supabase/server'

/**
 * Get all users for login selection
 */
export async function getLoginUsers() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        is_active,
        user_roles!inner(
          role:roles(
            id,
            name,
            display_name,
            level
          )
        )
      `)
      .eq('is_active', true)
      .order('full_name')
    
    if (error) throw error
    
    // Transform data to include primary role
    const users = (data || []).map(user => {
      const roles = user.user_roles || []
      const primaryRole = roles.length > 0 ? roles[0].role : null
      
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: primaryRole?.name || 'resident',
        roleDisplay: primaryRole?.display_name || 'Resident',
        roleLevel: primaryRole?.level || 1
      }
    })
    
    return { success: true, users }
  } catch (error: any) {
    console.error('Error getting login users:', error)
    return { success: false, error: error.message, users: [] }
  }
}

/**
 * Login with email/password (Simple validation - no encryption yet)
 */
export async function loginUser(email: string, password: string) {
  const supabase = await createClient()
  
  try {
    // Get user by email
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        password,
        is_active,
        user_roles!inner(
          role:roles(
            id,
            name,
            display_name,
            level
          )
        )
      `)
      .eq('email', email)
      .eq('is_active', true)
      .limit(1)
    
    if (error) throw error
    
    if (!users || users.length === 0) {
      return { 
        success: false, 
        error: 'ไม่พบผู้ใช้นี้ในระบบ' 
      }
    }
    
    const user = users[0]
    
    // Simple password check (no encryption yet)
    if (user.password !== password) {
      return { 
        success: false, 
        error: 'รหัสผ่านไม่ถูกต้อง' 
      }
    }
    
    // Get primary role
    const roles = user.user_roles || []
    const primaryRole = roles.length > 0 ? roles[0].role : null
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: primaryRole?.name || 'resident',
        roleDisplay: primaryRole?.display_name || 'Resident',
        roleLevel: primaryRole?.level || 1
      }
    }
  } catch (error: any) {
    console.error('Error logging in:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const supabase = await createClient()
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        is_active,
        user_roles!inner(
          role:roles(
            id,
            name,
            display_name,
            level
          )
        )
      `)
      .eq('id', userId)
      .eq('is_active', true)
      .limit(1)
    
    if (error) throw error
    
    if (!users || users.length === 0) {
      return { success: false, error: 'User not found' }
    }
    
    const user = users[0]
    const roles = user.user_roles || []
    const primaryRole = roles.length > 0 ? roles[0].role : null
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: primaryRole?.name || 'resident',
        roleDisplay: primaryRole?.display_name || 'Resident',
        roleLevel: primaryRole?.level || 1
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

