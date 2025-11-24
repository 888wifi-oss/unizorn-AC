// lib/types/units.ts
// Enhanced Unit types based on ERD analysis

export interface Unit {
  id: string
  unit_number: string
  project_id: string
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

// Import Company and Project types
import { Company, Project } from './permissions'

// Unit status enum
export enum UnitStatus {
  OCCUPIED = 'occupied',
  VACANT = 'vacant',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
  SOLD = 'sold'
}

// Unit type enum
export enum UnitType {
  CONDO = 'condo',
  APARTMENT = 'apartment',
  OFFICE = 'office',
  STUDIO = 'studio',
  PENTHOUSE = 'penthouse'
}

// Ownership type enum
export enum OwnershipType {
  FREEHOLD = 'freehold',
  LEASEHOLD = 'leasehold',
  RENTAL = 'rental'
}

// Furnishing status enum
export enum FurnishingStatus {
  FURNISHED = 'furnished',
  UNFURNISHED = 'unfurnished',
  SEMI_FURNISHED = 'semi_furnished'
}

// View type enum
export enum ViewType {
  CITY_VIEW = 'city_view',
  POOL_VIEW = 'pool_view',
  GARDEN_VIEW = 'garden_view',
  MOUNTAIN_VIEW = 'mountain_view'
}

// Payment method enum
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  CREDIT_CARD = 'credit_card'
}

// Tenant status enum
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
  PENDING = 'pending'
}

// Rental payment status enum
export enum RentalPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

// Tenancy history status enum
export enum TenancyHistoryStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled'
}
