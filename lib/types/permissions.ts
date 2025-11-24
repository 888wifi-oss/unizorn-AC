// lib/types/permissions.ts

export interface Company {
  id: string
  name: string
  slug: string
  logo_url?: string
  address?: string
  phone?: string
  email?: string
  tax_id?: string
  subscription_plan: 'basic' | 'standard' | 'premium' | 'enterprise'
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'expired'
  subscription_expires_at?: string
  max_projects: number
  max_units: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  company_id: string
  name: string
  slug: string
  code?: string
  address?: string
  phone?: string
  email?: string
  manager_name?: string
  manager_phone?: string
  manager_email?: string
  total_units: number
  total_floors: number
  project_type: 'condo' | 'apartment' | 'office' | 'mixed'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  display_name: string
  description?: string
  level: 0 | 1 | 2 | 3 | 4 // 0=SuperAdmin, 1=CompanyAdmin, 2=ProjectAdmin, 3=Staff, 4=Resident
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  display_name: string
  description?: string
  module: string
  action: string
  created_at: string
}

export interface RolePermission {
  id: string
  role_id: string
  permission_id: string
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  company_id?: string
  project_id?: string
  unit_id?: string
  is_active: boolean
  created_at: string
  updated_at: string

  // Joined data
  role?: Role
  company?: Company
  project?: Project
}

export interface AuditLog {
  id: string
  user_id?: string
  company_id?: string
  project_id?: string
  action: string
  entity_type: string
  entity_id?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Permission context
export interface PermissionContext {
  userId: string
  companyId?: string
  projectId?: string
  unitId?: string
  roles: Role[]
  permissions: Permission[]
}

// Permission check result
export interface PermissionCheck {
  allowed: boolean
  reason?: string
}

// Role levels
export enum RoleLevel {
  SUPER_ADMIN = 0,
  COMPANY_ADMIN = 1,
  PROJECT_ADMIN = 2,
  STAFF = 3,
  RESIDENT = 4
}

// Role names
export enum RoleName {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  PROJECT_ADMIN = 'project_admin',
  STAFF = 'staff',
  ENGINEER = 'engineer',
  RESIDENT = 'resident'
}

// Permission names
export type PermissionName =
  // Companies
  | 'companies.view'
  | 'companies.create'
  | 'companies.update'
  | 'companies.delete'
  | 'companies.manage'
  // Projects
  | 'projects.view'
  | 'projects.create'
  | 'projects.update'
  | 'projects.delete'
  | 'projects.manage'
  // Users
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.manage'
  // Units
  | 'units.view'
  | 'units.create'
  | 'units.update'
  | 'units.delete'
  | 'units.import'
  | 'units.export'
  // Residents
  | 'residents.import'
  | 'residents.export'
  // Billing
  | 'billing.view'
  | 'billing.create'
  | 'billing.update'
  | 'billing.delete'
  | 'billing.manage'
  // Maintenance
  | 'maintenance.view'
  | 'maintenance.create'
  | 'maintenance.update'
  | 'maintenance.delete'
  | 'maintenance.assign'
  | 'maintenance.approve'
  // Parcels
  | 'parcels.view'
  | 'parcels.create'
  | 'parcels.update'
  | 'parcels.delete'
  | 'parcels.import'
  | 'parcels.export'
  // Announcements
  | 'announcements.view'
  | 'announcements.create'
  | 'announcements.update'
  | 'announcements.delete'
  // Reports
  | 'reports.view'
  | 'reports.export'
  // Settings
  | 'settings.view'
  | 'settings.update'
  // Payments
  | 'payments.view'
  | 'payments.create'
  | 'payments.update'
  | 'payments.delete'
  | 'payments.manage'
  | 'payments.approve'
  | 'payments.export'

// Enhanced Unit types for new structure
export interface Unit {
  id: string
  unit_number: string
  project_id?: string
  building_id?: string
  floor: number
  size: number
  unit_type: 'condo' | 'apartment' | 'office' | 'studio' | 'penthouse'
  ownership_type: 'freehold' | 'leasehold' | 'rental'
  status: 'occupied' | 'vacant' | 'maintenance' | 'reserved' | 'sold'

  // Owner and Tenant references
  current_owner_id?: string
  current_tenant_id?: string

  // Physical details
  number_of_bedrooms: number
  number_of_bathrooms: number
  furnishing_status: 'furnished' | 'unfurnished' | 'semi_furnished'
  view_type?: 'city_view' | 'pool_view' | 'garden_view' | 'mountain_view'

  // Parking
  parking_space_count: number
  parking_space_number?: string

  // Pricing
  default_rental_price: number
  sale_price: number

  // Legacy fields (for backward compatibility)
  owner_name?: string
  owner_phone?: string
  owner_email?: string
  residents?: number

  // Additional info
  notes?: string
  description?: string
  unit_layout_image_url?: string

  // Timestamps
  created_at: string
  updated_at: string

  // Joined data
  project?: Project
  current_owner?: Owner
  current_tenant?: Tenant
}

export interface Owner {
  id: string
  unit_id: string
  name: string
  national_id?: string
  email?: string
  phone?: string
  address?: string
  is_primary: boolean
  ownership_percentage: number
  owner_occupies: boolean
  start_date: string
  end_date?: string
  notes?: string
  created_at: string
  updated_at: string

  // Joined data
  unit?: Unit
}

export interface Tenant {
  id: string
  unit_id: string
  owner_id?: string
  company_id?: string
  name: string
  national_id?: string
  gender?: 'male' | 'female' | 'other'
  date_of_birth?: string
  email?: string
  phone?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  move_in_date?: string
  move_out_date?: string
  rental_contract_no?: string
  rental_price: number
  deposit_amount: number
  payment_method?: 'cash' | 'bank_transfer' | 'check' | 'credit_card'
  status: 'active' | 'inactive' | 'terminated' | 'pending'
  notes?: string
  created_at: string
  updated_at: string

  // Joined data
  unit?: Unit
  owner?: Owner
  company?: Company
}

export interface TenancyHistory {
  id: string
  unit_id: string
  tenant_id: string
  rental_contract_no?: string
  rental_start_date: string
  rental_end_date?: string
  rental_price: number
  deposit_amount: number
  move_in_date?: string
  move_out_date?: string
  status: 'active' | 'completed' | 'terminated' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string

  // Joined data
  unit?: Unit
  tenant?: Tenant
}

export interface RentalPayment {
  id: string
  tenant_id: string
  unit_id: string
  month: string
  year: number
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  payment_date?: string
  payment_method?: 'cash' | 'bank_transfer' | 'check' | 'credit_card'
  reference_number?: string
  notes?: string
  created_at: string
  updated_at: string

  // Joined data
  tenant?: Tenant
  unit?: Unit
}