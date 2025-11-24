// lib/middleware/route-protection.ts
"use server"

import { redirect } from 'next/navigation'
import { canAccessModule, MODULE_ACCESS_CONFIG } from '@/lib/types/module-permissions'
import { checkPermission, getUserHighestRoleLevel } from '@/lib/permissions/permission-checker'
import { PermissionName, RoleLevel } from '@/lib/types/permissions'

/**
 * Protect route by module access
 */
export async function protectRoute(
  userId: string,
  moduleName: string,
  userRole: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check if user's role can access this module
  if (!canAccessModule(userRole, moduleName)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' cannot access module '${moduleName}'`
    }
  }

  return { allowed: true }
}

/**
 * Protect route by permission
 */
export async function protectRouteByPermission(
  userId: string,
  permission: PermissionName,
  companyId?: string,
  projectId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const check = await checkPermission(userId, permission, companyId, projectId)
  return check
}

/**
 * Protect route by minimum role level
 */
export async function protectRouteByRoleLevel(
  userId: string,
  minLevel: RoleLevel,
  companyId?: string,
  projectId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const userLevel = await getUserHighestRoleLevel(userId, companyId, projectId)

  if (userLevel === null) {
    return { allowed: false, reason: 'User has no roles assigned' }
  }

  // Lower number = higher privilege
  if (userLevel > minLevel) {
    return {
      allowed: false,
      reason: `Insufficient role level: ${userLevel} > ${minLevel}`
    }
  }

  return { allowed: true }
}

/**
 * Get user's accessible routes
 */
export function getAccessibleRoutes(userRole: string, userRoleLevel: number): string[] {
  const routes: string[] = []

  // Add routes based on module access
  Object.entries(MODULE_ACCESS_CONFIG).forEach(([moduleName, config]) => {
    if (config.roles.includes(userRole)) {
      // Map module name to route (you can customize this mapping)
      const routeMap: Record<string, string> = {
        companies: '/companies',
        projects: '/projects',
        user_management: '/user-management',
        api_management: '/api-management',
        dashboard: '/',
        units: '/units',
        announcements: '/announcements',
        maintenance: '/maintenance',
        resident_accounts: '/resident-accounts',
        notifications: '/notifications',
        parcels: '/parcels',
        parcel_reports: '/parcels/reports',
        file_management: '/file-management',
        billing: '/billing',
        payments: '/payments',
        revenue: '/revenue',
        accounts_receivable: '/accounts-receivable',
        expenses: '/expenses',
        fixed_assets: '/fixed-assets',
        depreciation: '/depreciation',
        chart_of_accounts: '/chart-of-accounts',
        journal_vouchers: '/journal-vouchers',
        general_ledger: '/general-ledger',
        revenue_budget: '/revenue-budget',
        expense_budget: '/expense-budget',
        budget_report: '/budget-report',
        revenue_reports: '/revenue-reports',
        financial_statements: '/financial-statements',
        reports: '/reports',
        analytics: '/analytics',
        automation: '/automation',
        theme_settings: '/theme-settings'
      }

      const route = routeMap[moduleName]
      if (route) {
        routes.push(route)
      }
    }
  })

  return routes
}

/**
 * Check if user can access route
 */
export function canAccessRoute(
  route: string,
  userRole: string,
  userRoleLevel: number
): boolean {
  const accessibleRoutes = getAccessibleRoutes(userRole, userRoleLevel)
  return accessibleRoutes.includes(route)
}
