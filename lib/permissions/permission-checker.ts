// lib/permissions/permission-checker.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { 
  PermissionContext, 
  PermissionCheck, 
  PermissionName, 
  RoleLevel,
  Role,
  Permission 
} from '@/lib/types/permissions'

/**
 * Get user's permission context
 */
export async function getUserPermissionContext(userId: string, companyId?: string, projectId?: string): Promise<PermissionContext | null> {
  const supabase = await createClient()
  
  try {
    // Get user roles with joined data
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        role:roles(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (rolesError) throw rolesError
    
    if (!userRoles || userRoles.length === 0) {
      return null
    }
    
    // Filter roles by context
    let filteredRoles = userRoles
    if (companyId) {
      filteredRoles = filteredRoles.filter(ur => 
        !ur.company_id || ur.company_id === companyId
      )
    }
    if (projectId) {
      filteredRoles = filteredRoles.filter(ur => 
        !ur.project_id || ur.project_id === projectId
      )
    }
    
    const roles: Role[] = filteredRoles.map(ur => ur.role).filter(Boolean)
    
    // Get permissions for these roles
    const roleIds = roles.map(r => r.id)
    const { data: rolePermissions, error: permsError } = await supabase
      .from('role_permissions')
      .select(`
        permission:permissions(*)
      `)
      .in('role_id', roleIds)
    
    if (permsError) throw permsError
    
    const permissions = (rolePermissions
      ?.map(rp => rp.permission)
      .filter(Boolean) || []) as unknown as Permission[]
    
    // Remove duplicates
    const uniquePermissions = Array.from(
      new Map(permissions.map((p: Permission) => [p.id, p])).values()
    )
    
    return {
      userId,
      companyId,
      projectId,
      roles,
      permissions: uniquePermissions as Permission[]
    }
  } catch (error) {
    console.error('Error getting user permission context:', error)
    return null
  }
}

/**
 * Check if user has specific permission
 */
export async function checkPermission(
  userId: string,
  permissionName: PermissionName,
  companyId?: string,
  projectId?: string
): Promise<PermissionCheck> {
  const context = await getUserPermissionContext(userId, companyId, projectId)
  
  if (!context) {
    return { allowed: false, reason: 'User has no roles assigned' }
  }
  
  // Super Admin has all permissions
  const isSuperAdmin = context.roles.some(r => r.level === RoleLevel.SUPER_ADMIN)
  if (isSuperAdmin) {
    return { allowed: true }
  }
  
  // Check if user has the specific permission
  const hasPermission = context.permissions.some(p => p.name === permissionName)
  
  if (!hasPermission) {
    return { allowed: false, reason: `Missing permission: ${permissionName}` }
  }
  
  return { allowed: true }
}

/**
 * Check if user has any of the specified permissions
 */
export async function checkAnyPermission(
  userId: string,
  permissionNames: PermissionName[],
  companyId?: string,
  projectId?: string
): Promise<PermissionCheck> {
  const context = await getUserPermissionContext(userId, companyId, projectId)
  
  if (!context) {
    return { allowed: false, reason: 'User has no roles assigned' }
  }
  
  // Super Admin has all permissions
  const isSuperAdmin = context.roles.some(r => r.level === RoleLevel.SUPER_ADMIN)
  if (isSuperAdmin) {
    return { allowed: true }
  }
  
  // Check if user has any of the specified permissions
  const hasAnyPermission = permissionNames.some(permName =>
    context.permissions.some(p => p.name === permName)
  )
  
  if (!hasAnyPermission) {
    return { allowed: false, reason: `Missing any of: ${permissionNames.join(', ')}` }
  }
  
  return { allowed: true }
}

/**
 * Check if user has all of the specified permissions
 */
export async function checkAllPermissions(
  userId: string,
  permissionNames: PermissionName[],
  companyId?: string,
  projectId?: string
): Promise<PermissionCheck> {
  const context = await getUserPermissionContext(userId, companyId, projectId)
  
  if (!context) {
    return { allowed: false, reason: 'User has no roles assigned' }
  }
  
  // Super Admin has all permissions
  const isSuperAdmin = context.roles.some(r => r.level === RoleLevel.SUPER_ADMIN)
  if (isSuperAdmin) {
    return { allowed: true }
  }
  
  // Check if user has all of the specified permissions
  const missingPermissions = permissionNames.filter(permName =>
    !context.permissions.some(p => p.name === permName)
  )
  
  if (missingPermissions.length > 0) {
    return { 
      allowed: false, 
      reason: `Missing permissions: ${missingPermissions.join(', ')}` 
    }
  }
  
  return { allowed: true }
}

/**
 * Check if user has specific role
 */
export async function checkRole(
  userId: string,
  roleName: string,
  companyId?: string,
  projectId?: string
): Promise<boolean> {
  const context = await getUserPermissionContext(userId, companyId, projectId)
  
  if (!context) {
    return false
  }
  
  return context.roles.some(r => r.name === roleName)
}

/**
 * Check if user has minimum role level
 */
export async function checkMinRoleLevel(
  userId: string,
  minLevel: RoleLevel,
  companyId?: string,
  projectId?: string
): Promise<boolean> {
  const context = await getUserPermissionContext(userId, companyId, projectId)
  
  if (!context) {
    return false
  }
  
  // Lower number = higher privilege
  return context.roles.some(r => r.level <= minLevel)
}

/**
 * Get user's highest role level
 */
export async function getUserHighestRoleLevel(
  userId: string,
  companyId?: string,
  projectId?: string
): Promise<RoleLevel | null> {
  const context = await getUserPermissionContext(userId, companyId, projectId)
  
  if (!context || context.roles.length === 0) {
    return null
  }
  
  // Get lowest level number (highest privilege)
  const levels = context.roles.map(r => r.level)
  return Math.min(...levels) as RoleLevel
}

/**
 * Check if user can access company
 */
export async function canAccessCompany(
  userId: string,
  companyId: string
): Promise<boolean> {
  const supabase = await createClient()
  
  // Super Admin can access all companies
  if (await checkRole(userId, 'super_admin')) {
    return true
  }
  
  // Check if user has any role in this company
  const { data, error } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .limit(1)
  
  if (error) {
    console.error('Error checking company access:', error)
    return false
  }
  
  return data && data.length > 0
}

/**
 * Check if user can access project
 */
export async function canAccessProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  const supabase = await createClient()
  
  // Super Admin can access all projects
  if (await checkRole(userId, 'super_admin')) {
    return true
  }
  
  // Get project's company
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single()
  
  if (projectError || !project) {
    return false
  }
  
  // Company Admin can access all projects in their company
  if (await checkRole(userId, 'company_admin', project.company_id)) {
    return true
  }
  
  // Check if user has any role in this project
  const { data, error } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .limit(1)
  
  if (error) {
    console.error('Error checking project access:', error)
    return false
  }
  
  return data && data.length > 0
}

/**
 * Get list of projects that user can access
 */
export async function getUserAccessibleProjects(userId: string): Promise<string[]> {
  const supabase = await createClient()
  
  try {
    // Super Admin can access all projects
    const isSuperAdmin = await checkRole(userId, 'super_admin')
    if (isSuperAdmin) {
      const { data: allProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('is_active', true)
      
      return (allProjects || []).map(p => p.id)
    }
    
    // Get user's roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        project_id,
        company_id,
        role:roles(name, level)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (!userRoles || userRoles.length === 0) {
      return []
    }
    
    const accessibleProjectIds = new Set<string>()
    
    // Check each role
    for (const userRole of userRoles) {
      const role = userRole.role
      
      if (!role) continue
      
      // If user has project-specific role, add that project
      if (userRole.project_id) {
        accessibleProjectIds.add(userRole.project_id)
      }
      
      // If user is company_admin, add all projects in that company
      if (role.name === 'company_admin' && userRole.company_id) {
        const { data: companyProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('company_id', userRole.company_id)
          .eq('is_active', true)
        
        if (companyProjects) {
          companyProjects.forEach(p => accessibleProjectIds.add(p.id))
        }
      }
      
      // If user is project_admin, add all projects in that company
      if (role.name === 'project_admin' && userRole.company_id) {
        const { data: companyProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('company_id', userRole.company_id)
          .eq('is_active', true)
        
        if (companyProjects) {
          companyProjects.forEach(p => accessibleProjectIds.add(p.id))
        }
      }
      
      // If user is staff, add all projects in that company (if company_id exists)
      if (role.name === 'staff' && userRole.company_id) {
        const { data: companyProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('company_id', userRole.company_id)
          .eq('is_active', true)
        
        if (companyProjects) {
          companyProjects.forEach(p => accessibleProjectIds.add(p.id))
        }
      }
    }
    
    return Array.from(accessibleProjectIds)
  } catch (error) {
    console.error('Error getting user accessible projects:', error)
    return []
  }
}

/**
 * Check if user can manage project (edit/manage settings)
 */
export async function canManageProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  const supabase = await createClient()
  
  // Super Admin can manage all projects
  if (await checkRole(userId, 'super_admin')) {
    return true
  }
  
  // Get project's company
  const { data: project } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single()
  
  if (!project) return false
  
  // Company Admin can manage all projects in their company
  if (await checkRole(userId, 'company_admin', project.company_id)) {
    return true
  }
  
  // Project Admin can manage their specific project
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .limit(1)
    .single()
  
  return (userRole as any)?.role?.name === 'project_admin'
}
