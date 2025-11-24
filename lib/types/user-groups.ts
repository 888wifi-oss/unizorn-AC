// lib/types/user-groups.ts

export interface UserGroup {
  id: string
  name: string
  display_name: string
  description?: string
  role_id?: string
  company_id?: string
  project_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Joined data
  role?: {
    name: string
    display_name: string
    level: number
  }
  member_count?: number
}

export interface UserGroupPermission {
  id: string
  user_group_id: string
  module: string
  can_access: boolean
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
  can_print: boolean
  can_export: boolean
  can_approve: boolean
  can_assign: boolean
  created_at: string
  updated_at: string
}

export interface UserGroupMember {
  id: string
  user_group_id: string
  user_id: string
  is_active: boolean
  created_at: string
  
  // Joined data
  user?: {
    email: string
    full_name: string
    phone?: string
  }
}

/**
 * Predefined User Groups Configuration
 */
export const PREDEFINED_USER_GROUPS = {
  ACCOUNTANT: {
    name: 'accountant',
    display_name: 'เจ้าหน้าที่บัญชี',
    description: 'ฝ่ายบัญชี/การเงิน - บันทึกรายรับ-รายจ่าย สร้างใบแจ้งหนี้',
    baseRole: 'staff',
    icon: 'Calculator',
    color: 'blue',
    modules: {
      billing: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      payments: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      revenue: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      expenses: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      chart_of_accounts: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      journal_vouchers: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      general_ledger: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      financial_statements: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      reports: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      vendors: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      accounts_payable: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      expense_approval: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      expense_reports: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      revenue_journal: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      trial_balance: { view: true, add: false, edit: false, delete: false, print: true, export: true }
    }
  },
  
  COMMITTEE: {
    name: 'committee',
    display_name: 'กรรมการอาคารชุด',
    description: 'กรรมการนิติบุคคล - ดูรายงานและงบการเงินเท่านั้น',
    baseRole: 'resident',
    icon: 'Shield',
    color: 'purple',
    modules: {
      reports: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      financial_statements: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      revenue_reports: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      budget_report: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      analytics: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      expense_reports: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      trial_balance: { view: true, add: false, edit: false, delete: false, print: true, export: true }
    }
  },
  
  AUDITOR: {
    name: 'auditor',
    display_name: 'ผู้ตรวจสอบบัญชี',
    description: 'ผู้ตรวจสอบภายนอก - เข้าถึงงบการเงินอย่างเดียว ไม่สามารถแก้ไข',
    baseRole: 'resident',
    icon: 'FileSearch',
    color: 'orange',
    modules: {
      financial_statements: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      general_ledger: { view: true, add: false, edit: false, delete: false, print: true, export: true },
      journal_vouchers: { view: true, add: false, edit: false, delete: false, print: true, export: false },
      chart_of_accounts: { view: true, add: false, edit: false, delete: false, print: true, export: false },
      trial_balance: { view: true, add: false, edit: false, delete: false, print: true, export: true }
    }
  },
  
  SUPPORT_STAFF: {
    name: 'support_staff',
    display_name: 'เจ้าหน้าที่ทั่วไป',
    description: 'เจ้าหน้าที่อาคารที่ไม่เกี่ยวบัญชี - พัสดุ/แจ้งซ่อมเท่านั้น',
    baseRole: 'staff',
    icon: 'UserCog',
    color: 'green',
    modules: {
      parcels: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      maintenance: { view: true, add: true, edit: true, delete: false, print: true, export: true },
      announcements: { view: true, add: true, edit: true, delete: false, print: true, export: false },
      files: { view: true, add: true, edit: true, delete: false, print: false, export: true },
      vendors: { view: true, add: false, edit: false, delete: false, print: true, export: true }
    }
  },
  
  MANAGER: {
    name: 'manager_group',
    display_name: 'ผู้จัดการระบบ',
    description: 'กลุ่มผู้จัดการระบบที่มีสิทธิ์เข้าถึงทุกโมดูลยกเว้นการจัดการระบบหลัก',
    baseRole: 'staff',
    icon: 'Settings',
    color: 'red',
    modules: {
      api: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      dashboard: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      units: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      team_management: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      announcements: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      maintenance: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      resident_accounts: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      notifications: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      parcels: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      parcel_reports: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      files: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      billing: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      payments: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      revenue: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      accounts_receivable: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      expenses: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      fixed_assets: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      depreciation: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      chart_of_accounts: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      journal_vouchers: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      general_ledger: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      revenue_budget: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      expense_budget: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      budget_report: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      revenue_reports: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      financial_statements: { view: true, add: true, edit: true, delete: true, print: true, export: true },
        reports: { view: true, add: true, edit: true, delete: true, print: true, export: true },
        analytics: { view: true, add: true, edit: true, delete: true, print: true, export: true },
        advanced_analytics: { view: true, add: false, edit: false, delete: false, print: true, export: true },
        automation: { view: true, add: true, edit: true, delete: true, print: true, export: true },
        theme_settings: { view: true, add: true, edit: true, delete: true, print: true, export: true },
        user_management: { view: true, add: true, edit: true, delete: true, print: true, export: true },
        performance: { view: true, add: false, edit: false, delete: false, print: true, export: true },
        revenue_journal: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      expense_approval: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      expense_reports: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      trial_balance: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      vendors: { view: true, add: true, edit: true, delete: true, print: true, export: true },
      accounts_payable: { view: true, add: true, edit: true, delete: true, print: true, export: true }
    }
  }
}

/**
 * Get user group permissions
 */
export function getUserGroupModules(groupName: string): string[] {
  const group = Object.values(PREDEFINED_USER_GROUPS).find(g => g.name === groupName)
  if (!group) return []
  
  return Object.keys(group.modules)
}

/**
 * Check if user group can access module
 */
export function userGroupCanAccessModule(groupName: string, moduleName: string): boolean {
  const group = Object.values(PREDEFINED_USER_GROUPS).find(g => g.name === groupName)
  if (!group) return false
  
  return moduleName in group.modules
}
