// lib/actions/user-group-actions.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { checkPermission, canAccessProject, canAccessCompany, canManageProject, getUserAccessibleProjects } from '@/lib/permissions/permission-checker'
import { revalidatePath } from 'next/cache'
import { UserGroup, UserGroupPermission, UserGroupMember } from '@/lib/types/user-groups'

/**
 * Get all user groups (Global Groups - no project filtering)
 */
export async function getUserGroups(userId: string, projectId?: string, companyId?: string) {
  const supabase = await createClient()
  
  try {
    let query = supabase
      .from('user_groups')
      .select(`
        id,
        name,
        display_name,
        description,
        role_id,
        company_id,
        is_active,
        created_at,
        updated_at,
        role:roles(name, display_name, level)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    // No project filtering needed - groups are now global
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    
    const { data: groups, error } = await query
    
    if (error) throw error
    
    // Get member counts for each group
    const groupsWithCounts = await Promise.all(
      (groups || []).map(async (group) => {
        const { count } = await supabase
          .from('user_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_group_id', group.id)
          .eq('is_active', true)
        
        return {
          ...group,
          member_count: count || 0
        }
      })
    )
    
    return { success: true, groups: groupsWithCounts }
  } catch (error: any) {
    console.error('[getUserGroups] Error:', error)
    return { success: false, error: error.message, groups: [] }
  }
}

/**
 * Get user group by ID
 */
export async function getUserGroupById(userId: string, groupId: string, projectId?: string) {
  const supabase = await createClient()
  
  try {
    const { data: group, error } = await supabase
      .from('user_groups')
      .select(`
        id,
        name,
        display_name,
        description,
        role_id,
        company_id,
        is_active,
        created_at,
        updated_at,
        role:roles(name, display_name, level)
      `)
      .eq('id', groupId)
      .single()
    
    if (error) throw error
    
    // Get permissions for this group
    let permissionsQuery = supabase
      .from('user_group_permissions')
      .select('*')
      .eq('user_group_id', groupId)
    
    if (projectId) {
      permissionsQuery = permissionsQuery.eq('project_id', projectId)
    }
    
    const { data: permissions, error: permsError } = await permissionsQuery
    
    if (permsError) {
      console.error('[getUserGroupById] Permissions error:', permsError)
    }
    
    // Get members for this group
    const { data: members, error: membersError } = await supabase
      .from('user_group_members')
      .select(`
        id,
        user_id,
        is_active,
        created_at,
        user:users(
          id,
          email,
          full_name,
          phone
        )
      `)
      .eq('user_group_id', groupId)
      .eq('is_active', true)
    
    if (membersError) {
      console.error('[getUserGroupById] Members error:', membersError)
    }
    
    return { 
      success: true, 
      group,
      permissions: permissions || [],
      members: members || []
    }
  } catch (error: any) {
    console.error('[getUserGroupById] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create user group (Global Group)
 */
export async function createUserGroup(
  userId: string,
  groupData: {
    name: string
    display_name: string
    description?: string
    role_id?: string
    company_id?: string
  }
) {
  const supabase = await createClient()
  
  try {
    const { data: group, error } = await supabase
      .from('user_groups')
      .insert([{
        name: groupData.name,
        display_name: groupData.display_name,
        description: groupData.description,
        role_id: groupData.role_id,
        company_id: groupData.company_id,
        is_active: true
      }])
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/user-groups')
    return { success: true, group }
  } catch (error: any) {
    console.error('[createUserGroup] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update user group
 */
export async function updateUserGroup(
  userId: string,
  groupId: string,
  groupData: {
    name?: string
    display_name?: string
    description?: string
    role_id?: string
    company_id?: string
  }
) {
  const supabase = await createClient()
  
  try {
    const { data: group, error } = await supabase
      .from('user_groups')
      .update(groupData)
      .eq('id', groupId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/user-groups')
    return { success: true, group }
  } catch (error: any) {
    console.error('[updateUserGroup] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete user group
 */
export async function deleteUserGroup(userId: string, groupId: string) {
  const supabase = await createClient()
  
  try {
    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('user_groups')
      .update({ is_active: false })
      .eq('id', groupId)
    
    if (error) throw error
    
    revalidatePath('/user-groups')
    return { success: true }
  } catch (error: any) {
    console.error('[deleteUserGroup] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Set user group permissions (with project_id)
 */
export async function setUserGroupPermissions(
  userId: string,
  groupId: string,
  permissions: UserGroupPermission[],
  projectId: string
) {
  const supabase = await createClient()
  
  try {
    // Check if user can manage this project
    const canManage = await canManageProject(userId, projectId)
    if (!canManage) {
      return { success: false, error: 'No permission to manage this project' }
    }
    
    // Delete existing permissions for this group and project
    await supabase
      .from('user_group_permissions')
      .delete()
      .eq('user_group_id', groupId)
      .eq('project_id', projectId)
    
    // Insert new permissions (remove displayName field and add id)
    const permissionsWithProject = permissions.map(perm => {
      const { displayName, id, ...permissionData } = perm as any
      return {
        id: crypto.randomUUID(), // Generate new UUID for id
        ...permissionData,
        user_group_id: groupId,
        project_id: projectId
      }
    })
    
    const { error } = await supabase
      .from('user_group_permissions')
      .insert(permissionsWithProject)
    
    if (error) throw error
    
    revalidatePath('/user-groups')
    return { success: true }
  } catch (error: any) {
    console.error('[setUserGroupPermissions] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Add user to group (Global Group - no project_id needed)
 */
export async function addUserToGroup(
  userId: string,
  groupId: string,
  targetUserId: string
) {
  const supabase = await createClient()
  
  try {
    // Check if already exists
    const { data: existing } = await supabase
      .from('user_group_members')
      .select('id, is_active')
      .eq('user_group_id', groupId)
      .eq('user_id', targetUserId)
      .single()
    
    if (existing) {
      // Reactivate if exists but inactive
      if (!existing.is_active) {
        const { error } = await supabase
          .from('user_group_members')
          .update({ is_active: true })
          .eq('id', existing.id)
        
        if (error) throw error
      }
    } else {
      // Insert new member
      const { error } = await supabase
        .from('user_group_members')
        .insert([{
          user_group_id: groupId,
          user_id: targetUserId,
          is_active: true
        }])
      
      if (error) throw error
    }
    
    revalidatePath('/user-groups')
    return { success: true }
  } catch (error: any) {
    console.error('[addUserToGroup] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove user from group
 */
export async function removeUserFromGroup(
  userId: string,
  groupId: string,
  targetUserId: string
) {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('user_group_members')
      .update({ is_active: false })
      .eq('user_group_id', groupId)
      .eq('user_id', targetUserId)
    
    if (error) throw error
    
    revalidatePath('/user-groups')
    return { success: true }
  } catch (error: any) {
    console.error('[removeUserFromGroup] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Bulk add users to group (Global Group)
 */
export async function bulkAddUsersToGroup(
  userId: string,
  groupId: string,
  userIds: string[]
) {
  const supabase = await createClient()
  
  try {
    const memberships = userIds.map(uid => ({
      user_group_id: groupId,
      user_id: uid,
      is_active: true
    }))
    
    const { error } = await supabase
      .from('user_group_members')
      .upsert(memberships, { 
        onConflict: 'user_group_id,user_id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    
    revalidatePath('/user-groups')
    return { success: true }
  } catch (error: any) {
    console.error('[bulkAddUsersToGroup] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's groups (with project filtering)
 */
export async function getUserGroupsForUser(
  userId: string,
  targetUserId: string,
  projectId: string
) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('user_group_members')
      .select(`
        id,
        is_active,
        created_at,
        user_groups!inner (
          id,
          name,
          display_name,
          description
        )
      `)
      .eq('user_id', targetUserId)
      .eq('is_active', true)
    
    if (error) throw error
    
    return { success: true, groups: data || [] }
  } catch (error: any) {
    console.error('[getUserGroupsForUser] Error:', error)
    return { success: false, error: error.message, groups: [] }
  }
}

/**
 * Get user's permissions from groups in a specific project
 * Updated to support Global Groups with project-specific permissions
 */
export async function getUserAggregatedPermissions(userId: string, projectId?: string) {
  const supabase = await createClient()
  
  try {
    console.log('[getUserAggregatedPermissions] ===== START =====')
    console.log('[getUserAggregatedPermissions] userId:', userId)
    console.log('[getUserAggregatedPermissions] projectId:', projectId)

    // Get all groups that user is member of with permissions
    const { data: memberships, error } = await supabase
      .from('user_group_members')
      .select(`
        user_group_id,
        user_groups!inner (
          id,
          name,
          user_group_permissions (
            module,
            can_access,
            can_view,
            can_add,
            can_edit,
            can_delete,
            can_print,
            can_export,
            can_approve,
            can_assign,
            project_id
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    console.log('[getUserAggregatedPermissions] Query result:', { memberships, error })

    if (error) {
      console.error('[getUserAggregatedPermissions] Database error:', error)
      return { success: false, error: error.message, permissions: [] }
    }

    if (!memberships || memberships.length === 0) {
      console.log('[getUserAggregatedPermissions] No group memberships found for user:', userId)
      return { success: true, permissions: [] }
    }

    console.log('[getUserAggregatedPermissions] Found memberships:', memberships.length)

    // Aggregate permissions from all groups
    const aggregatedPermissions: Record<string, any> = {}

    memberships.forEach((membership: any) => {
      const group = membership.user_groups
      console.log('[getUserAggregatedPermissions] Processing group:', group?.name, 'permissions:', group?.user_group_permissions?.length)
      
      if (group && group.user_group_permissions) {
        // Filter permissions based on projectId
        let relevantPermissions = group.user_group_permissions
        
        if (projectId === null) {
          // When projectId is null, only show global permissions
          relevantPermissions = group.user_group_permissions.filter((perm: any) => perm.project_id === null)
          console.log('[getUserAggregatedPermissions] Filtering for global permissions only')
        } else if (projectId) {
          // When projectId is provided, show both project-specific and global permissions
          relevantPermissions = group.user_group_permissions.filter((perm: any) => 
            perm.project_id === projectId || perm.project_id === null
          )
          console.log('[getUserAggregatedPermissions] Filtering for project:', projectId, 'and global permissions')
        }
        
        console.log('[getUserAggregatedPermissions] Relevant permissions for project', projectId, ':', relevantPermissions.length)
        
        relevantPermissions.forEach((perm: any) => {
          const module = perm.module
          console.log('[getUserAggregatedPermissions] Processing permission:', perm)
          
          if (!aggregatedPermissions[module]) {
            aggregatedPermissions[module] = {
              module,
              can_access: false,
              can_view: false,
              can_add: false,
              can_edit: false,
              can_delete: false,
              can_print: false,
              can_export: false,
              can_approve: false,
              can_assign: false
            }
          }

          // Use OR logic - if any group allows it, user can do it
          aggregatedPermissions[module].can_access = aggregatedPermissions[module].can_access || perm.can_access
          aggregatedPermissions[module].can_view = aggregatedPermissions[module].can_view || perm.can_view
          aggregatedPermissions[module].can_add = aggregatedPermissions[module].can_add || perm.can_add
          aggregatedPermissions[module].can_edit = aggregatedPermissions[module].can_edit || perm.can_edit
          aggregatedPermissions[module].can_delete = aggregatedPermissions[module].can_delete || perm.can_delete
          aggregatedPermissions[module].can_print = aggregatedPermissions[module].can_print || perm.can_print
          aggregatedPermissions[module].can_export = aggregatedPermissions[module].can_export || perm.can_export
          aggregatedPermissions[module].can_approve = aggregatedPermissions[module].can_approve || perm.can_approve
          aggregatedPermissions[module].can_assign = aggregatedPermissions[module].can_assign || perm.can_assign
        })
      }
    })

    const permissions = Object.values(aggregatedPermissions)
    console.log('[getUserAggregatedPermissions] ===== FINAL RESULT =====')
    console.log('[getUserAggregatedPermissions] Aggregated permissions:', permissions.length, 'modules for project:', projectId)
    console.log('[getUserAggregatedPermissions] Permissions:', permissions)
    console.log('[getUserAggregatedPermissions] ===== END =====')

    return { success: true, permissions }

  } catch (error) {
    console.error('[getUserAggregatedPermissions] Exception:', error)
    return { success: false, error: 'Failed to get user permissions', permissions: [] }
  }
}

/**
 * Get user group permissions for a specific project
 */
export async function getUserGroupPermissionsInProject(
  userId: string,
  targetUserId: string,
  projectId: string
) {
  const supabase = await createClient()
  
  try {
    // Get all group permissions for this user in this project
    const { data, error } = await supabase
      .rpc('get_user_group_permissions_in_project', {
        p_user_id: targetUserId,
        p_project_id: projectId
      })
    
    if (error) throw error
    
    return { success: true, permissions: data || [] }
  } catch (error: any) {
    console.error('[getUserGroupPermissionsInProject] Error:', error)
    return { success: false, error: error.message, permissions: [] }
  }
}

/**
 * Create predefined user group
 */
export async function createPredefinedGroup(
  userId: string,
  config: {
    name: string
    display_name: string
    description: string
    role_name: string
    permissions: UserGroupPermission[]
  },
  companyId: string,
  projectId: string
) {
  const supabase = await createClient()
  
  try {
    // Get role by name
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('name', config.role_name)
      .single()
    
    if (!role) {
      return { success: false, error: 'Role not found' }
    }
    
    // Create group
    const { data: group, error: groupError } = await supabase
      .from('user_groups')
      .insert([{
        name: config.name,
        display_name: config.display_name,
        description: config.description,
        role_id: role.id,
        company_id: companyId,
        is_active: true
      }])
      .select()
      .single()

    if (groupError) throw groupError
    
    // Set permissions for this project
    const permissionsWithProject = config.permissions.map(perm => {
      const { id, ...permissionData } = perm as any
      return {
        id: crypto.randomUUID(), // Generate new UUID for id
        ...permissionData,
        user_group_id: group.id,
        project_id: projectId
      }
    })
    
    const { error: permError } = await supabase
      .from('user_group_permissions')
      .insert(permissionsWithProject)
    
    if (permError) throw permError
    
    revalidatePath('/user-groups')
    return { success: true, group }
  } catch (error: any) {
    console.error('[createPredefinedGroup] Error:', error)
    return { success: false, error: error.message }
  }
}