"use server"

import { createClient } from "@/lib/supabase/server"
import { Permission, Role } from "@/lib/types/permissions"

/**
 * Get all permissions in the system
 */
export async function getPermissions(): Promise<{ success: boolean; permissions?: Permission[]; error?: string }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('permissions')
            .select('*')
            .order('module', { ascending: true })
            .order('action', { ascending: true })

        if (error) {
            console.error('[getPermissions] Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, permissions: data as Permission[] }
    } catch (error: any) {
        console.error('[getPermissions] Exception:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(
    roleId: string
): Promise<{ success: boolean; permissions?: Permission[]; error?: string }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('role_permissions')
            .select(`
                permission_id,
                permissions (*)
            `)
            .eq('role_id', roleId)

        if (error) {
            console.error('[getRolePermissions] Error:', error)
            return { success: false, error: error.message }
        }

        const permissions = data?.map((rp: any) => rp.permissions).filter(Boolean) || []
        return { success: true, permissions: permissions as Permission[] }
    } catch (error: any) {
        console.error('[getRolePermissions] Exception:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Update permissions for a role
 * This will replace all existing permissions with the new set
 */
export async function updateRolePermissions(
    roleId: string,
    permissionIds: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        // First, delete all existing permissions for this role
        const { error: deleteError } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', roleId)

        if (deleteError) {
            console.error('[updateRolePermissions] Delete error:', deleteError)
            return { success: false, error: deleteError.message }
        }

        // Then, insert the new permissions
        if (permissionIds.length > 0) {
            const rolePermissions = permissionIds.map(permissionId => ({
                role_id: roleId,
                permission_id: permissionId
            }))

            const { error: insertError } = await supabase
                .from('role_permissions')
                .insert(rolePermissions)

            if (insertError) {
                console.error('[updateRolePermissions] Insert error:', insertError)
                return { success: false, error: insertError.message }
            }
        }

        return { success: true }
    } catch (error: any) {
        console.error('[updateRolePermissions] Exception:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Get all roles with their permissions
 */
export async function getRolesWithPermissions(): Promise<{
    success: boolean;
    roles?: Array<Role & { permissions: Permission[] }>;
    error?: string
}> {
    try {
        const supabase = await createClient()

        // Get all roles
        const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('*')
            .order('level', { ascending: true })

        if (rolesError) {
            console.error('[getRolesWithPermissions] Roles error:', rolesError)
            return { success: false, error: rolesError.message }
        }

        // Get permissions for each role
        const rolesWithPermissions = await Promise.all(
            (rolesData || []).map(async (role) => {
                const { permissions } = await getRolePermissions(role.id)
                return {
                    ...role,
                    permissions: permissions || []
                }
            })
        )

        return { success: true, roles: rolesWithPermissions as Array<Role & { permissions: Permission[] }> }
    } catch (error: any) {
        console.error('[getRolesWithPermissions] Exception:', error)
        return { success: false, error: error.message }
    }
}
