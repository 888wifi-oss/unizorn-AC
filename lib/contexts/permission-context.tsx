"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  PermissionContext as PermissionContextType, 
  PermissionName,
  Role,
  Permission,
  Company,
  Project,
  RoleLevel 
} from '@/lib/types/permissions'
import { getUserPermissionContext } from '@/lib/permissions/permission-checker'

interface PermissionProviderProps {
  children: ReactNode
  userId?: string
  companyId?: string
  projectId?: string
}

interface PermissionContextValue {
  context: PermissionContextType | null
  loading: boolean
  hasPermission: (permission: PermissionName) => boolean
  hasAnyPermission: (permissions: PermissionName[]) => boolean
  hasAllPermissions: (permissions: PermissionName[]) => boolean
  hasRole: (roleName: string) => boolean
  hasMinRoleLevel: (minLevel: RoleLevel) => boolean
  isSuperAdmin: boolean
  isCompanyAdmin: boolean
  isProjectAdmin: boolean
  refresh: () => Promise<void>
  currentCompany?: Company
  currentProject?: Project
  setCurrentCompany: (company?: Company) => void
  setCurrentProject: (project?: Project) => void
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined)

export function PermissionProvider({ 
  children, 
  userId, 
  companyId, 
  projectId 
}: PermissionProviderProps) {
  const [context, setContext] = useState<PermissionContextType | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentCompany, setCurrentCompany] = useState<Company | undefined>()
  const [currentProject, setCurrentProject] = useState<Project | undefined>()

  const loadPermissions = async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const permContext = await getUserPermissionContext(userId, companyId, projectId)
      setContext(permContext)
    } catch (error) {
      console.error('Error loading permissions:', error)
      setContext(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [userId, companyId, projectId])

  const hasPermission = (permission: PermissionName): boolean => {
    if (!context) return false
    
    // Super Admin has all permissions
    if (context.roles.some(r => r.level === RoleLevel.SUPER_ADMIN)) {
      return true
    }
    
    return context.permissions.some(p => p.name === permission)
  }

  const hasAnyPermission = (permissions: PermissionName[]): boolean => {
    if (!context) return false
    
    // Super Admin has all permissions
    if (context.roles.some(r => r.level === RoleLevel.SUPER_ADMIN)) {
      return true
    }
    
    return permissions.some(perm => 
      context.permissions.some(p => p.name === perm)
    )
  }

  const hasAllPermissions = (permissions: PermissionName[]): boolean => {
    if (!context) return false
    
    // Super Admin has all permissions
    if (context.roles.some(r => r.level === RoleLevel.SUPER_ADMIN)) {
      return true
    }
    
    return permissions.every(perm => 
      context.permissions.some(p => p.name === perm)
    )
  }

  const hasRole = (roleName: string): boolean => {
    if (!context) return false
    return context.roles.some(r => r.name === roleName)
  }

  const hasMinRoleLevel = (minLevel: RoleLevel): boolean => {
    if (!context) return false
    // Lower number = higher privilege
    return context.roles.some(r => r.level <= minLevel)
  }

  const isSuperAdmin = hasRole('super_admin')
  const isCompanyAdmin = hasRole('company_admin')
  const isProjectAdmin = hasRole('project_admin')

  const value: PermissionContextValue = {
    context,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinRoleLevel,
    isSuperAdmin,
    isCompanyAdmin,
    isProjectAdmin,
    refresh: loadPermissions,
    currentCompany,
    currentProject,
    setCurrentCompany,
    setCurrentProject
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}

// HOC to protect components with permission
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: PermissionName | PermissionName[],
  fallback?: ReactNode
) {
  return function ProtectedComponent(props: P) {
    const { hasPermission, hasAnyPermission, loading } = usePermissions()
    
    if (loading) {
      return <div>Loading...</div>
    }
    
    const allowed = Array.isArray(requiredPermission)
      ? hasAnyPermission(requiredPermission)
      : hasPermission(requiredPermission)
    
    if (!allowed) {
      return fallback || <div>Access Denied</div>
    }
    
    return <Component {...props} />
  }
}

// Component to conditionally render based on permission
interface CanProps {
  permission: PermissionName | PermissionName[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean
}

export function Can({ permission, children, fallback, requireAll = false }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()
  
  if (loading) {
    return null
  }
  
  let allowed = false
  if (Array.isArray(permission)) {
    allowed = requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission)
  } else {
    allowed = hasPermission(permission)
  }
  
  return allowed ? <>{children}</> : <>{fallback || null}</>
}

// Component to conditionally render based on role
interface HasRoleProps {
  role: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export function HasRole({ role, children, fallback }: HasRoleProps) {
  const { hasRole, loading } = usePermissions()
  
  if (loading) {
    return null
  }
  
  const allowed = Array.isArray(role)
    ? role.some(r => hasRole(r))
    : hasRole(role)
  
  return allowed ? <>{children}</> : <>{fallback || null}</>
}
