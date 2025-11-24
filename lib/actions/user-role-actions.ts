// lib/actions/user-role-actions.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { checkPermission, getUserAccessibleProjects } from '@/lib/permissions/permission-checker'
import { User, UserRole, Role } from '@/lib/types/permissions'
import { revalidatePath } from 'next/cache'

/**
 * Get all users (filtered by admin's scope)
 */
export async function getUsers(userId: string, companyId?: string, projectId?: string) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(userId, 'users.view', companyId, projectId)
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    // Check if user is Super Admin
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    const isSuperAdmin = adminRoles?.some((ur: any) => ur.role?.name === 'super_admin')
    
    // If Super Admin, return all users
    if (isSuperAdmin) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, users: data || [] }
    }
    
    // For Company Admin and Project Admin, filter users by accessible companies/projects
    const { data: userCompanyRoles } = await supabase
      .from('user_roles')
      .select('company_id, project_id, project:projects(company_id)')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (!userCompanyRoles || userCompanyRoles.length === 0) {
      return { success: true, users: [] }
    }
    
    // Get unique company IDs from user's roles
    const userCompanyIds = Array.from(new Set(
      userCompanyRoles
        .map((ur: any) => ur.company_id || ur.project?.company_id)
        .filter(Boolean)
    ))
    
    // Get accessible project IDs
    const accessibleProjectIds = await getUserAccessibleProjects(userId)
    
    if (userCompanyIds.length === 0 && accessibleProjectIds.length === 0) {
      return { success: true, users: [] }
    }
    
    // Get users who have roles in the same companies or projects
    let query = supabase
      .from('user_roles')
      .select('user_id')
      .eq('is_active', true)
    
    // Build OR condition: company_id IN (...) OR project_id IN (...)
    if (userCompanyIds.length > 0 && accessibleProjectIds.length > 0) {
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('is_active', true)
        .or(`company_id.in.(${userCompanyIds.join(',')}),project_id.in.(${accessibleProjectIds.join(',')})`)
      
      const accessibleUserIds = Array.from(new Set(
        (userRolesData || []).map((ur: any) => ur.user_id).filter(Boolean)
      ))
      
      if (accessibleUserIds.length === 0) {
        return { success: true, users: [] }
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', accessibleUserIds)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, users: data || [] }
    } else if (accessibleProjectIds.length > 0) {
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('project_id', accessibleProjectIds)
        .eq('is_active', true)
      
      const accessibleUserIds = Array.from(new Set(
        (userRolesData || []).map((ur: any) => ur.user_id).filter(Boolean)
      ))
      
      if (accessibleUserIds.length === 0) {
        return { success: true, users: [] }
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', accessibleUserIds)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, users: data || [] }
    }
    
    return { success: true, users: [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get user roles
 */
export async function getUserRoles(userId: string, targetUserId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        role:roles(*),
        company:companies(id, name),
        project:projects(id, name)
      `)
      .eq('user_id', targetUserId)
      .eq('is_active', true)
    
    if (error) throw error
    
    return { success: true, userRoles: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get all roles
 */
export async function getRoles() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('level')
    
    if (error) throw error
    
    return { success: true, roles: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Create user
 */
export async function createUser(adminUserId: string, userData: Partial<User>) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(adminUserId, 'users.create')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/users')
    return { success: true, user: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update user
 */
export async function updateUser(adminUserId: string, targetUserId: string, userData: Partial<User>) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(adminUserId, 'users.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', targetUserId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/users')
    return { success: true, user: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Assign role to user
 */
export async function assignRole(
  adminUserId: string,
  targetUserId: string,
  roleId: string,
  companyId?: string,
  projectId?: string,
  unitId?: string
) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(adminUserId, 'users.manage', companyId, projectId)
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .insert([{
        user_id: targetUserId,
        role_id: roleId,
        company_id: companyId || null,
        project_id: projectId || null,
        unit_id: unitId || null,
        is_active: true
      }])
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/users')
    return { success: true, userRole: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Remove role from user
 */
export async function removeRole(adminUserId: string, userRoleId: string) {
  const supabase = await createClient()
  
  try {
    // Get user role details
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('company_id, project_id')
      .eq('id', userRoleId)
      .single()
    
    const check = await checkPermission(
      adminUserId, 
      'users.manage', 
      userRole?.company_id, 
      userRole?.project_id
    )
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', userRoleId)
    
    if (error) throw error
    
    revalidatePath('/users')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get role permissions
 */
export async function getRolePermissions(roleId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permission:permissions(*)
      `)
      .eq('role_id', roleId)
    
    if (error) throw error
    
    return { success: true, permissions: data?.map(rp => rp.permission).filter(Boolean) || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get users in specific project
 */
export async function getUsersInProject(userId: string, projectId: string) {
  const supabase = await createClient()
  
  try {
    // Get users who have roles in this project
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('project_id', projectId)
      .eq('is_active', true)
    
    if (userRolesError) throw userRolesError
    
    const userIds = Array.from(new Set(
      (userRolesData || []).map((ur: any) => ur.user_id).filter(Boolean)
    ))
    
    if (userIds.length === 0) {
      return { success: true, userIds: [] }
    }
    
    return { success: true, userIds }
  } catch (error: any) {
    return { success: false, error: error.message, userIds: [] }
  }
}

/**
 * Reset user password (Admin only)
 */
export async function resetUserPassword(adminUserId: string, targetUserId: string, newPassword: string) {
  const supabase = await createClient()
  
  try {
    // Check if admin has permission
    const check = await checkPermission(adminUserId, 'users.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    // Update password (plain text for now - should be hashed in production)
    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', targetUserId)
    
    if (error) throw error
    
    revalidatePath('/user-management')
    return { success: true, message: 'Password reset successfully' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
