// lib/types/module-permissions.ts

/**
 * Module Access Control
 * กำหนดว่า Role ไหนสามารถเข้าถึง Module ไหนได้บ้าง
 */

export interface ModuleAccess {
  module: string
  displayName: string
  icon: string
  roles: string[] // Roles that can access this module
  permissions: {
    view?: boolean
    create?: boolean
    update?: boolean
    delete?: boolean
    manage?: boolean
    export?: boolean
    assign?: boolean
  }
}

// Module access configuration
export const MODULE_ACCESS_CONFIG: Record<string, ModuleAccess> = {
  // ================================
  // SYSTEM MODULES (Admin Only)
  // ================================
  companies: {
    module: 'companies',
    displayName: 'จัดการบริษัท',
    icon: 'Building',
    roles: ['super_admin'], // Only Super Admin
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true,
      manage: true
    }
  },
  
  projects: {
    module: 'projects',
    displayName: 'จัดการโครงการ',
    icon: 'Building2',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true, // Company Admin can create
      update: true,
      delete: false, // Only Super Admin via other checks
      manage: true
    }
  },
  
  user_management: {
    module: 'users',
    displayName: 'จัดการผู้ใช้และสิทธิ์',
    icon: 'Shield',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true,
      manage: true
    }
  },
  
  api_management: {
    module: 'api',
    displayName: 'จัดการ API',
    icon: 'Key',
    roles: ['super_admin', 'company_admin'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true
    }
  },

  // ================================
  // CORE MODULES (Project Management)
  // ================================
  dashboard: {
    module: 'dashboard',
    displayName: 'แดชบอร์ด',
    icon: 'LayoutDashboard',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true
    }
  },

  units: {
    module: 'units',
    displayName: 'ห้องชุด',
    icon: 'Building2',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true
    }
  },

  // ================================
  // BILLING & ACCOUNTING
  // ================================
  billing: {
    module: 'billing',
    displayName: 'ออกบิล',
    icon: 'FileText',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: false, // Only admin roles
      export: true
    }
  },

  payments: {
    module: 'payments',
    displayName: 'การชำระเงิน',
    icon: 'CreditCard',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: false
    }
  },

  revenue: {
    module: 'revenue',
    displayName: 'บันทึกรายรับ',
    icon: 'TrendingUp',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: false
    }
  },

  accounts_receivable: {
    module: 'accounts_receivable',
    displayName: 'ลูกหนี้ค้างชำระ',
    icon: 'Receipt',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      export: true
    }
  },

  expenses: {
    module: 'expenses',
    displayName: 'บันทึกรายจ่าย',
    icon: 'TrendingDown',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: false
    }
  },

  // ================================
  // ACCOUNTING (Admin Only)
  // ================================
  fixed_assets: {
    module: 'fixed_assets',
    displayName: 'ทะเบียนทรัพย์สิน',
    icon: 'Package',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true
    }
  },

  depreciation: {
    module: 'depreciation',
    displayName: 'คำนวณค่าเสื่อมราคา',
    icon: 'Calculator',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true
    }
  },

  chart_of_accounts: {
    module: 'chart_of_accounts',
    displayName: 'ผังบัญชี',
    icon: 'BookOpen',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true
    }
  },

  journal_vouchers: {
    module: 'journal_vouchers',
    displayName: 'สมุดรายวันทั่วไป',
    icon: 'BookText',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: false
    }
  },

  general_ledger: {
    module: 'general_ledger',
    displayName: 'สมุดบัญชีแยกประเภท',
    icon: 'BookOpen',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true
    }
  },

  // ================================
  // REPORTS (Admin & Staff)
  // ================================
  revenue_budget: {
    module: 'revenue_budget',
    displayName: 'งบประมาณรายรับ',
    icon: 'Target',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true
    }
  },

  expense_budget: {
    module: 'expense_budget',
    displayName: 'งบประมาณรายจ่าย',
    icon: 'Target',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true
    }
  },

  budget_report: {
    module: 'budget_report',
    displayName: 'รายงานเปรียบเทียบงบ',
    icon: 'ClipboardList',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      export: true
    }
  },

  revenue_reports: {
    module: 'revenue_reports',
    displayName: 'รายงานรายรับ',
    icon: 'PieChart',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      export: true
    }
  },

  financial_statements: {
    module: 'financial_statements',
    displayName: 'รายงานทางการเงิน',
    icon: 'Landmark',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      export: true
    }
  },

  reports: {
    module: 'reports',
    displayName: 'รายงานสรุป',
    icon: 'BarChart3',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      export: true
    }
  },

  // ================================
  // OPERATIONS (Staff Access)
  // ================================
  announcements: {
    module: 'announcements',
    displayName: 'จัดการประกาศ',
    icon: 'Megaphone',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true
    }
  },

  maintenance: {
    module: 'maintenance',
    displayName: 'จัดการงานแจ้งซ่อม',
    icon: 'Wrench',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff', 'engineer', 'resident'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: false,
      assign: true // Project Admin can assign
    }
  },

  parcels: {
    module: 'parcels',
    displayName: 'จัดการพัสดุ',
    icon: 'Package',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: false
    }
  },

  parcel_reports: {
    module: 'parcel_reports',
    displayName: 'รายงานพัสดุ',
    icon: 'BarChart3',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      export: true
    }
  },

  notifications: {
    module: 'notifications',
    displayName: 'จัดการการแจ้งเตือน',
    icon: 'Bell',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true
    }
  },

  resident_accounts: {
    module: 'resident_accounts',
    displayName: 'จัดการบัญชีลูกบ้าน',
    icon: 'Users',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true
    }
  },

  // ================================
  // ADVANCED FEATURES
  // ================================
  file_management: {
    module: 'files',
    displayName: 'จัดการเอกสารและไฟล์',
    icon: 'FolderOpen',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true
    }
  },

  analytics: {
    module: 'analytics',
    displayName: 'การวิเคราะห์ข้อมูล',
    icon: 'TrendingUp',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      export: true
    }
  },

  automation: {
    module: 'automation',
    displayName: 'ระบบอัตโนมัติ',
    icon: 'Settings',
    roles: ['super_admin', 'company_admin', 'project_admin'],
    permissions: {
      view: true,
      create: true,
      update: true,
      delete: true
    }
  },

  theme_settings: {
    module: 'theme',
    displayName: 'การตั้งค่าธีม',
    icon: 'Palette',
    roles: ['super_admin', 'company_admin', 'project_admin', 'staff'],
    permissions: {
      view: true,
      update: true
    }
  }
}

/**
 * Check if role can access module
 */
export function canAccessModule(roleName: string, moduleName: string): boolean {
  const moduleConfig = MODULE_ACCESS_CONFIG[moduleName]
  if (!moduleConfig) return false
  
  return moduleConfig.roles.includes(roleName)
}

/**
 * Get accessible modules for role
 */
export function getAccessibleModules(roleName: string): ModuleAccess[] {
  return Object.values(MODULE_ACCESS_CONFIG).filter(module =>
    module.roles.includes(roleName)
  )
}

/**
 * Get module permissions for role
 */
export function getModulePermissions(roleName: string, moduleName: string) {
  const moduleConfig = MODULE_ACCESS_CONFIG[moduleName]
  if (!moduleConfig || !moduleConfig.roles.includes(roleName)) {
    return null
  }
  
  return moduleConfig.permissions
}

/**
 * Module groups for sidebar
 */
export const MODULE_GROUPS = {
  system: {
    label: 'ระบบ (System)',
    modules: ['companies', 'projects', 'user_management', 'api_management'],
    minRoleLevel: 0 // Super Admin and above
  },
  core: {
    label: 'เมนูหลัก',
    modules: ['dashboard', 'units', 'announcements', 'maintenance', 'resident_accounts', 'notifications', 'parcels', 'parcel_reports', 'file_management'],
    minRoleLevel: 2 // Project Admin and above
  },
  billing: {
    label: 'รายรับ',
    modules: ['billing', 'payments', 'revenue', 'accounts_receivable'],
    minRoleLevel: 2 // Project Admin and above
  },
  accounting: {
    label: 'บัญชี',
    modules: ['fixed_assets', 'depreciation', 'chart_of_accounts', 'journal_vouchers', 'general_ledger'],
    minRoleLevel: 2 // Project Admin and above
  },
  reports: {
    label: 'รายงาน',
    modules: ['revenue_budget', 'expense_budget', 'budget_report', 'revenue_reports', 'financial_statements', 'reports'],
    minRoleLevel: 2 // Project Admin and above
  },
  advanced: {
    label: 'ขั้นสูง',
    modules: ['analytics', 'automation', 'theme_settings'],
    minRoleLevel: 2 // Project Admin and above
  }
}
