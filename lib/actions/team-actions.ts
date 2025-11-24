// lib/actions/team-actions.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { checkPermission, canAccessProject } from '@/lib/permissions/permission-checker'
import { revalidatePath } from 'next/cache'

export interface TeamMember {
  id: string
  email: string
  full_name: string
  phone?: string
  role_name: string
  role_display_name: string
  unit_number?: string
  is_active: boolean
  created_at: string
}

/**
 * Get project team members
 */
export async function getProjectTeam(userId: string, projectId: string) {
  const supabase = await createClient()
  
  try {
    // Check if user can access this project
    const canAccess = await canAccessProject(userId, projectId)
    if (!canAccess) {
      return { success: false, error: 'No access to this project' }
    }
    
    // Get team members (users with roles in this project)
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        unit_id,
        is_active,
        user:users(id, email, full_name, phone),
        role:roles(name, display_name, level),
        unit:units(unit_number)
      `)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Transform to TeamMember format
    const teamMembers: TeamMember[] = (userRoles || []).map((ur: any) => ({
      id: ur.user_id,
      email: ur.user?.email || '',
      full_name: ur.user?.full_name || '',
      phone: ur.user?.phone,
      role_name: ur.role?.name || '',
      role_display_name: ur.role?.display_name || '',
      unit_number: ur.unit?.unit_number,
      is_active: ur.is_active,
      created_at: ur.user?.created_at || ''
    }))
    
    // Filter out admin roles (Project Admin shouldn't see other admins)
    const nonAdminTeam = teamMembers.filter(member => 
      !['super_admin', 'company_admin', 'project_admin'].includes(member.role_name)
    )
    
    return { success: true, team: nonAdminTeam }
  } catch (error: any) {
    console.error('Error getting project team:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Add team member (Staff, Engineer, or Resident)
 */
export async function addTeamMember(
  adminUserId: string,
  projectId: string,
  companyId: string,
  memberData: {
    email: string
    full_name: string
    phone?: string
    role: 'staff' | 'engineer' | 'resident'
    unit_number?: string
  }
) {
  const supabase = await createClient()
  
  try {
    // Check permission
    const canAccess = await canAccessProject(adminUserId, projectId)
    if (!canAccess) {
      return { success: false, error: 'No access to this project' }
    }
    
    // Prevent adding admin roles
    if (['super_admin', 'company_admin', 'project_admin'].includes(memberData.role)) {
      return { success: false, error: 'Cannot add admin roles from Team Management' }
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', memberData.email)
      .single()
    
    let userId: string
    
    if (existingUser) {
      // User already exists, just assign role
      userId = existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          email: memberData.email,
          full_name: memberData.full_name,
          phone: memberData.phone,
          is_active: true
        }])
        .select()
        .single()
      
      if (userError) throw userError
      userId = newUser.id
    }
    
    // Get role ID
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('name', memberData.role)
      .single()
    
    if (!role) {
      return { success: false, error: 'Role not found' }
    }
    
    // Get unit ID if resident
    let unitId: string | undefined
    if (memberData.role === 'resident' && memberData.unit_number) {
      const { data: unit } = await supabase
        .from('units')
        .select('id')
        .eq('unit_number', memberData.unit_number)
        .single()
      
      unitId = unit?.id
    }
    
    // Assign role to project
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: userId,
        role_id: role.id,
        company_id: companyId,
        project_id: projectId,
        unit_id: unitId,
        is_active: true
      }])
      .select()
      .single()
    
    if (roleError) throw roleError
    
    revalidatePath('/team-management')
    return { success: true, userRole }
  } catch (error: any) {
    console.error('Error adding team member:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update team member
 */
export async function updateTeamMember(
  adminUserId: string,
  projectId: string,
  memberId: string,
  memberData: {
    full_name?: string
    phone?: string
    unit_number?: string
  }
) {
  const supabase = await createClient()
  
  try {
    const canAccess = await canAccessProject(adminUserId, projectId)
    if (!canAccess) {
      return { success: false, error: 'No access to this project' }
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(memberData)
      .eq('id', memberId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/team-management')
    return { success: true, member: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Disable team member
 */
export async function disableTeamMember(
  adminUserId: string,
  projectId: string,
  memberId: string
) {
  const supabase = await createClient()
  
  try {
    const canAccess = await canAccessProject(adminUserId, projectId)
    if (!canAccess) {
      return { success: false, error: 'No access to this project' }
    }
    
    // Disable user
    const { error: userError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', memberId)
    
    if (userError) throw userError
    
    // Disable all user roles in this project
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', memberId)
      .eq('project_id', projectId)
    
    if (roleError) throw roleError
    
    revalidatePath('/team-management')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Reset team member password
 */
export async function resetTeamMemberPassword(
  adminUserId: string,
  projectId: string,
  memberId: string,
  newPassword: string
) {
  const supabase = await createClient()
  
  try {
    const canAccess = await canAccessProject(adminUserId, projectId)
    if (!canAccess) {
      return { success: false, error: 'No access to this project' }
    }
    
    // For simple auth, update password directly
    // In production, hash the password first
    const { error } = await supabase
      .from('users')
      .update({ password_hash: newPassword }) // Should be hashed!
      .eq('id', memberId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get team statistics
 */
export async function getTeamStats(userId: string, projectId: string) {
  const supabase = await createClient()
  
  try {
    const canAccess = await canAccessProject(userId, projectId)
    if (!canAccess) {
      return { success: false, error: 'No access to this project' }
    }
    
    // Get counts by role
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role:roles(name, display_name)
      `)
      .eq('project_id', projectId)
      .eq('is_active', true)
    
    if (error) throw error
    
    // Count by role
    const stats = {
      total: data?.length || 0,
      staff: data?.filter((ur: any) => ur.role?.name === 'staff').length || 0,
      engineer: data?.filter((ur: any) => ur.role?.name === 'engineer').length || 0,
      resident: data?.filter((ur: any) => ur.role?.name === 'resident').length || 0
    }
    
    return { success: true, stats }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
