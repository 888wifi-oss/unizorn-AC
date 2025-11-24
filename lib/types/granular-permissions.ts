// lib/types/granular-permissions.ts

/**
 * Granular Permission System
 * กำหนดสิทธิ์แบบละเอียดสำหรับแต่ละ Action ในแต่ละโมดูล
 */

export type Action = 'view' | 'add' | 'edit' | 'delete' | 'print' | 'export' | 'approve' | 'assign'

export interface ActionPermissions {
  view: boolean
  add: boolean
  edit: boolean
  delete: boolean
  print: boolean
  export: boolean
  approve?: boolean
  assign?: boolean
}

export interface ModulePermissions {
  module: string
  displayName: string
  canAccess: boolean // สามารถเข้าเมนูได้หรือไม่
  actions: ActionPermissions
}

/**
 * Permission Configuration สำหรับแต่ละ Role
 * กำหนดว่า Role นั้นทำอะไรได้บ้างในแต่ละโมดูล
 */

// =============================================
// SUPER ADMIN - เข้าได้ทุกอย่าง ทำได้ทุกอย่าง
// =============================================
export const SUPER_ADMIN_PERMISSIONS: Record<string, ModulePermissions> = {
  companies: {
    module: 'companies',
    displayName: 'จัดการบริษัท',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  projects: {
    module: 'projects',
    displayName: 'จัดการโครงการ',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  users: {
    module: 'users',
    displayName: 'จัดการผู้ใช้',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  user_groups: {
    module: 'user_groups',
    displayName: 'กลุ่มผู้ใช้งาน',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: false, export: true }
  },
  units: {
    module: 'units',
    displayName: 'ห้องชุด',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  billing: {
    module: 'billing',
    displayName: 'ออกบิล',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  payments: {
    module: 'payments',
    displayName: 'การชำระเงิน',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  maintenance: {
    module: 'maintenance',
    displayName: 'งานแจ้งซ่อม',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true, assign: true }
  },
  parcels: {
    module: 'parcels',
    displayName: 'จัดการพัสดุ',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  announcements: {
    module: 'announcements',
    displayName: 'ประกาศ',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  files: {
    module: 'files',
    displayName: 'เอกสารและไฟล์',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: false, export: true }
  },
  analytics: {
    module: 'analytics',
    displayName: 'การวิเคราะห์ข้อมูล',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: true, export: true }
  },
  chart_of_accounts: {
    module: 'chart_of_accounts',
    displayName: 'ผังบัญชี',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  reports: {
    module: 'reports',
    displayName: 'รายงาน',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: true, export: true }
  }
}

// =============================================
// COMPANY ADMIN - เข้าได้เกือบทั้งหมด ยกเว้น Companies
// =============================================
export const COMPANY_ADMIN_PERMISSIONS: Record<string, ModulePermissions> = {
  companies: {
    module: 'companies',
    displayName: 'จัดการบริษัท',
    canAccess: false, // ❌ ไม่สามารถเข้าได้
    actions: { view: false, add: false, edit: false, delete: false, print: false, export: false }
  },
  projects: {
    module: 'projects',
    displayName: 'จัดการโครงการ',
    canAccess: true,
    actions: { view: true, add: false, edit: true, delete: false, print: true, export: true } // ❌ ไม่สามารถเพิ่มและลบได้
  },
  users: {
    module: 'users',
    displayName: 'จัดการผู้ใช้',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  user_groups: {
    module: 'user_groups',
    displayName: 'กลุ่มผู้ใช้งาน',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: false, export: true }
  },
  units: {
    module: 'units',
    displayName: 'ห้องชุด',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  billing: {
    module: 'billing',
    displayName: 'ออกบิล',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  payments: {
    module: 'payments',
    displayName: 'การชำระเงิน',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  maintenance: {
    module: 'maintenance',
    displayName: 'งานแจ้งซ่อม',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true, assign: true }
  },
  parcels: {
    module: 'parcels',
    displayName: 'จัดการพัสดุ',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  announcements: {
    module: 'announcements',
    displayName: 'ประกาศ',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  files: {
    module: 'files',
    displayName: 'เอกสารและไฟล์',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: false, export: true }
  },
  analytics: {
    module: 'analytics',
    displayName: 'การวิเคราะห์ข้อมูล',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: true, export: true }
  },
  chart_of_accounts: {
    module: 'chart_of_accounts',
    displayName: 'ผังบัญชี',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  reports: {
    module: 'reports',
    displayName: 'รายงาน',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: true, export: true }
  }
}

// =============================================
// PROJECT ADMIN - จัดการโครงการ ไม่ลบบิล/โครงการ
// =============================================
export const PROJECT_ADMIN_PERMISSIONS: Record<string, ModulePermissions> = {
  companies: {
    module: 'companies',
    displayName: 'จัดการบริษัท',
    canAccess: false, // ❌ ไม่สามารถเข้าได้
    actions: { view: false, add: false, edit: false, delete: false, print: false, export: false }
  },
  projects: {
    module: 'projects',
    displayName: 'จัดการโครงการ',
    canAccess: true,
    actions: { view: true, add: false, edit: true, delete: false, print: true, export: true } // ดู+แก้ไขเท่านั้น
  },
  users: {
    module: 'users',
    displayName: 'จัดการผู้ใช้',
    canAccess: false, // ❌ ใช้ team_management แทน
    actions: { view: false, add: false, edit: false, delete: false, print: false, export: false }
  },
  user_groups: {
    module: 'user_groups',
    displayName: 'กลุ่มผู้ใช้งาน',
    canAccess: true, // ✅ เข้าได้
    actions: { view: true, add: true, edit: true, delete: false, print: false, export: true }
  },
  team_management: {
    module: 'team_management',
    displayName: 'จัดการทีมงาน',
    canAccess: true, // ✅ เข้าได้
    actions: { view: true, add: true, edit: true, delete: false, print: false, export: true } // จัดการทีมในโครงการ
  },
  units: {
    module: 'units',
    displayName: 'ห้องชุด',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  billing: {
    module: 'billing',
    displayName: 'ออกบิล',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true } // ไม่สามารถลบบิลได้
  },
  payments: {
    module: 'payments',
    displayName: 'การชำระเงิน',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true }
  },
  maintenance: {
    module: 'maintenance',
    displayName: 'งานแจ้งซ่อม',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true, assign: true }
  },
  parcels: {
    module: 'parcels',
    displayName: 'จัดการพัสดุ',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true }
  },
  announcements: {
    module: 'announcements',
    displayName: 'ประกาศ',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: true, export: true }
  },
  files: {
    module: 'files',
    displayName: 'เอกสารและไฟล์',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: true, print: false, export: true }
  },
  analytics: {
    module: 'analytics',
    displayName: 'การวิเคราะห์ข้อมูล',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: true, export: true }
  },
  chart_of_accounts: {
    module: 'chart_of_accounts',
    displayName: 'ผังบัญชี',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true } // ไม่ลบบัญชี
  },
  reports: {
    module: 'reports',
    displayName: 'รายงาน',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: true, export: true }
  }
}

// =============================================
// STAFF - งานประจำวัน ไม่ลบข้อมูล
// =============================================
export const STAFF_PERMISSIONS: Record<string, ModulePermissions> = {
  companies: {
    module: 'companies',
    displayName: 'จัดการบริษัท',
    canAccess: false, // ❌
    actions: { view: false, add: false, edit: false, delete: false, print: false, export: false }
  },
  projects: {
    module: 'projects',
    displayName: 'จัดการโครงการ',
    canAccess: false, // ❌
    actions: { view: false, add: false, edit: false, delete: false, print: false, export: false }
  },
  users: {
    module: 'users',
    displayName: 'จัดการผู้ใช้',
    canAccess: false, // ❌
    actions: { view: false, add: false, edit: false, delete: false, print: false, export: false }
  },
  units: {
    module: 'units',
    displayName: 'ห้องชุด',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: false, export: false } // ดูเท่านั้น
  },
  billing: {
    module: 'billing',
    displayName: 'ออกบิล',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true } // ดู+สร้าง+แก้+พิมพ์+ส่งออก
  },
  payments: {
    module: 'payments',
    displayName: 'การชำระเงิน',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true }
  },
  maintenance: {
    module: 'maintenance',
    displayName: 'งานแจ้งซ่อม',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true, assign: false } // ไม่สามารถมอบหมายได้
  },
  parcels: {
    module: 'parcels',
    displayName: 'จัดการพัสดุ',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true }
  },
  announcements: {
    module: 'announcements',
    displayName: 'ประกาศ',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: true } // ไม่สามารถลบได้
  },
  files: {
    module: 'files',
    displayName: 'เอกสารและไฟล์',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: false, export: true }
  },
  analytics: {
    module: 'analytics',
    displayName: 'การวิเคราะห์ข้อมูล',
    canAccess: false, // ❌ Staff ไม่เข้า Analytics
    actions: { view: false, add: false, edit: false, delete: false, print: false, export: false }
  },
  chart_of_accounts: {
    module: 'chart_of_accounts',
    displayName: 'ผังบัญชี',
    canAccess: false, // ❌ Staff ไม่เข้า Accounting
    actions: { view: false, add: false, edit: false, delete: false, print: false, export: false }
  },
  reports: {
    module: 'reports',
    displayName: 'รายงาน',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: true, export: true } // ดู+พิมพ์+ส่งออกเท่านั้น
  }
}

// =============================================
// ENGINEER - เฉพาะงานซ่อมเท่านั้น
// =============================================
export const ENGINEER_PERMISSIONS: Record<string, ModulePermissions> = {
  // Engineer เข้าได้เฉพาะ Maintenance
  maintenance: {
    module: 'maintenance',
    displayName: 'งานแจ้งซ่อม',
    canAccess: true,
    actions: { view: true, add: true, edit: true, delete: false, print: true, export: false, assign: false }
  },
  // โมดูลอื่น ๆ ทั้งหมด ไม่สามารถเข้าได้
  companies: { module: 'companies', displayName: 'จัดการบริษัท', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  projects: { module: 'projects', displayName: 'จัดการโครงการ', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  users: { module: 'users', displayName: 'จัดการผู้ใช้', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  units: { module: 'units', displayName: 'ห้องชุด', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  billing: { module: 'billing', displayName: 'ออกบิล', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  payments: { module: 'payments', displayName: 'การชำระเงิน', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  parcels: { module: 'parcels', displayName: 'จัดการพัสดุ', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  announcements: { module: 'announcements', displayName: 'ประกาศ', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  files: { module: 'files', displayName: 'เอกสารและไฟล์', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  analytics: { module: 'analytics', displayName: 'การวิเคราะห์ข้อมูล', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  chart_of_accounts: { module: 'chart_of_accounts', displayName: 'ผังบัญชี', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  reports: { module: 'reports', displayName: 'รายงาน', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } }
}

// =============================================
// RESIDENT - Portal เท่านั้น (ดูข้อมูลของตนเอง)
// =============================================
export const RESIDENT_PERMISSIONS: Record<string, ModulePermissions> = {
  billing: {
    module: 'billing',
    displayName: 'บิลของฉัน',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: true, export: false } // ดู+พิมพ์เท่านั้น
  },
  payments: {
    module: 'payments',
    displayName: 'การชำระเงิน',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: true, export: false }
  },
  maintenance: {
    module: 'maintenance',
    displayName: 'แจ้งซ่อม',
    canAccess: true,
    actions: { view: true, add: true, edit: false, delete: false, print: false, export: false } // ดู+แจ้งซ่อมเท่านั้น
  },
  parcels: {
    module: 'parcels',
    displayName: 'พัสดุของฉัน',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: false, export: false } // ดูเท่านั้น
  },
  announcements: {
    module: 'announcements',
    displayName: 'ประกาศ',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: false, export: false } // ดูเท่านั้น
  },
  files: {
    module: 'files',
    displayName: 'เอกสาร',
    canAccess: true,
    actions: { view: true, add: false, edit: false, delete: false, print: false, export: false } // ดูเท่านั้น
  },
  // ทุกโมดูลอื่น ไม่สามารถเข้าได้
  companies: { module: 'companies', displayName: 'จัดการบริษัท', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  projects: { module: 'projects', displayName: 'จัดการโครงการ', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  users: { module: 'users', displayName: 'จัดการผู้ใช้', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  units: { module: 'units', displayName: 'ห้องชุด', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  analytics: { module: 'analytics', displayName: 'การวิเคราะห์ข้อมูล', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  chart_of_accounts: { module: 'chart_of_accounts', displayName: 'ผังบัญชี', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } },
  reports: { module: 'reports', displayName: 'รายงาน', canAccess: false, actions: { view: false, add: false, edit: false, delete: false, print: false, export: false } }
}

// =============================================
// ROLE PERMISSIONS MAP
// =============================================
export const ROLE_PERMISSIONS_MAP: Record<string, Record<string, ModulePermissions>> = {
  super_admin: SUPER_ADMIN_PERMISSIONS,
  company_admin: COMPANY_ADMIN_PERMISSIONS,
  project_admin: PROJECT_ADMIN_PERMISSIONS,
  staff: STAFF_PERMISSIONS,
  engineer: ENGINEER_PERMISSIONS,
  resident: RESIDENT_PERMISSIONS
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Get module permissions for specific role
 */
export function getModulePermissionsForRole(roleName: string, moduleName: string): ModulePermissions | null {
  const rolePermissions = ROLE_PERMISSIONS_MAP[roleName]
  if (!rolePermissions) return null
  
  return rolePermissions[moduleName] || null
}

/**
 * Check if role can perform action in module
 */
export function canPerformAction(
  roleName: string,
  moduleName: string,
  action: Action
): boolean {
  const modulePerms = getModulePermissionsForRole(roleName, moduleName)
  if (!modulePerms || !modulePerms.canAccess) return false
  
  return modulePerms.actions[action] || false
}

/**
 * Get all accessible modules for role
 */
export function getAccessibleModulesForRole(roleName: string): ModulePermissions[] {
  const rolePermissions = ROLE_PERMISSIONS_MAP[roleName]
  if (!rolePermissions) return []
  
  return Object.values(rolePermissions).filter(module => module.canAccess)
}

/**
 * Get allowed actions for module
 */
export function getAllowedActions(roleName: string, moduleName: string): Action[] {
  const modulePerms = getModulePermissionsForRole(roleName, moduleName)
  if (!modulePerms || !modulePerms.canAccess) return []
  
  const allowedActions: Action[] = []
  Object.entries(modulePerms.actions).forEach(([action, allowed]) => {
    if (allowed) {
      allowedActions.push(action as Action)
    }
  })
  
  return allowedActions
}
