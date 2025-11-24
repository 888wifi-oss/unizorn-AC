// lib/hooks/use-module-permissions.ts
"use client"

import { useMemo } from 'react'
import { usePermissions } from '@/lib/contexts/permission-context'
import { 
  canPerformAction, 
  getAllowedActions, 
  getModulePermissionsForRole,
  Action 
} from '@/lib/types/granular-permissions'

/**
 * Hook สำหรับตรวจสอบสิทธิ์ในโมดูลปัจจุบัน
 */
export function useModulePermissions(moduleName: string) {
  const { context, loading } = usePermissions()
  
  const primaryRole = context?.roles[0]?.name || 'resident'
  
  const permissions = useMemo(() => {
    const modulePerms = getModulePermissionsForRole(primaryRole, moduleName)
    
    if (!modulePerms || !modulePerms.canAccess) {
      return {
        canAccess: false,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canPrint: false,
        canExport: false,
        canApprove: false,
        canAssign: false,
        allowedActions: [] as Action[]
      }
    }
    
    return {
      canAccess: true,
      canView: modulePerms.actions.view,
      canAdd: modulePerms.actions.add,
      canEdit: modulePerms.actions.edit,
      canDelete: modulePerms.actions.delete,
      canPrint: modulePerms.actions.print,
      canExport: modulePerms.actions.export,
      canApprove: modulePerms.actions.approve || false,
      canAssign: modulePerms.actions.assign || false,
      allowedActions: getAllowedActions(primaryRole, moduleName)
    }
  }, [primaryRole, moduleName])
  
  return {
    ...permissions,
    loading,
    role: primaryRole
  }
}

/**
 * Hook สำหรับตรวจสอบ action เดียว
 */
export function useCanPerformAction(moduleName: string, action: Action): boolean {
  const { context } = usePermissions()
  const primaryRole = context?.roles[0]?.name || 'resident'
  
  return canPerformAction(primaryRole, moduleName, action)
}

/**
 * Hook สำหรับดูสิทธิ์ทั้งหมดในโมดูล
 */
export function useModuleActions(moduleName: string) {
  const permissions = useModulePermissions(moduleName)
  
  return {
    actions: permissions.allowedActions,
    count: permissions.allowedActions.length,
    hasAnyAction: permissions.allowedActions.length > 0,
    isReadOnly: permissions.canView && !permissions.canAdd && !permissions.canEdit && !permissions.canDelete
  }
}
