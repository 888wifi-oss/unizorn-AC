// lib/types/billing.ts
// Enhanced Billing System Types

export interface BillCategory {
  id: string
  name: string
  display_name: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BillItem {
  id: string
  bill_id: string
  category_id?: string
  item_name: string
  description?: string
  quantity: number
  unit_price: number
  amount: number
  is_taxable: boolean
  tax_rate: number
  tax_amount: number
  created_at: string
  updated_at: string
  
  // Joined data
  category?: BillCategory
}

export interface UtilityMeter {
  id: string
  unit_id: string
  meter_type: 'water' | 'electricity' | 'gas'
  meter_number: string
  meter_location?: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Joined data
  unit?: Unit
  latest_reading?: MeterReading
}

export interface MeterReading {
  id: string
  meter_id: string
  reading_date: string
  previous_reading: number
  current_reading: number
  usage_amount: number
  unit_of_measure: 'cubic_meter' | 'kwh' | 'liter' | 'unit'
  reading_type: 'regular' | 'estimated' | 'corrected'
  reader_name?: string
  notes?: string
  created_at: string
  updated_at: string
  
  // Joined data
  meter?: UtilityMeter
}

export interface UtilityRate {
  id: string
  meter_type: 'water' | 'electricity' | 'gas'
  rate_name: string
  rate_per_unit: number
  minimum_charge: number
  maximum_charge?: number
  effective_date: string
  expiry_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: string
  name: string
  display_name: string
  description?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaymentSchedule {
  id: string
  bill_id: string
  installment_number: number
  due_date: string
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paid_date?: string
  paid_amount: number
  created_at: string
  updated_at: string
  
  // Joined data
  bill?: Bill
}

export interface BillTemplate {
  id: string
  name: string
  description?: string
  bill_type: 'monthly' | 'quarterly' | 'yearly' | 'one_time'
  template_data: any // JSONB data
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BillNotification {
  id: string
  bill_id: string
  notification_type: 'due_soon' | 'overdue' | 'payment_received' | 'payment_reminder'
  notification_date: string
  notification_method: 'email' | 'sms' | 'line' | 'push'
  recipient_email?: string
  recipient_phone?: string
  message: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  sent_at?: string
  created_at: string
  updated_at: string
  
  // Joined data
  bill?: Bill
}

// Enhanced Bill interface
export interface Bill {
  id: string
  unit_id: string
  bill_number: string
  month: string
  year: number
  bill_type: 'monthly' | 'quarterly' | 'yearly' | 'one_time'
  billing_period_start?: string
  billing_period_end?: string
  issue_date: string
  due_date: string
  payment_terms: number
  
  // Legacy fields (for backward compatibility)
  common_fee: number
  water_fee: number
  electricity_fee: number
  parking_fee: number
  other_fee: number
  
  // Enhanced fields
  tax_rate: number
  tax_amount: number
  discount_amount: number
  late_fee: number
  previous_balance: number
  total: number
  final_amount: number
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid'
  notes?: string
  
  created_at: string
  updated_at: string
  
  // Joined data
  unit?: Unit
  items?: BillItem[]
  payments?: Payment[]
  schedules?: PaymentSchedule[]
  notifications?: BillNotification[]
}

// Enhanced Payment interface
export interface Payment {
  id: string
  bill_id: string
  unit_id: string
  amount: number
  payment_date: string
  payment_method: string
  payment_method_id?: string
  reference_number?: string
  bank_name?: string
  account_number?: string
  transaction_id?: string
  receipt_url?: string
  processed_by?: string
  processed_at?: string
  notes?: string
  created_at: string
  updated_at: string
  
  // Joined data
  bill?: Bill
  unit?: Unit
  payment_method_detail?: PaymentMethod
}

// Import Unit type
import { Unit } from './units'

// Enums
export enum BillType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ONE_TIME = 'one_time'
}

export enum BillStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  PARTIALLY_PAID = 'partially_paid'
}

export enum MeterType {
  WATER = 'water',
  ELECTRICITY = 'electricity',
  GAS = 'gas'
}

export enum ReadingType {
  REGULAR = 'regular',
  ESTIMATED = 'estimated',
  CORRECTED = 'corrected'
}

export enum UnitOfMeasure {
  CUBIC_METER = 'cubic_meter',
  KWH = 'kwh',
  LITER = 'liter',
  UNIT = 'unit'
}

export enum NotificationType {
  DUE_SOON = 'due_soon',
  OVERDUE = 'overdue',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_REMINDER = 'payment_reminder'
}

export enum NotificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  LINE = 'line',
  PUSH = 'push'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentScheduleStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

// Bill calculation helpers
export interface BillCalculation {
  subtotal: number
  tax_amount: number
  discount_amount: number
  late_fee: number
  previous_balance: number
  total: number
  final_amount: number
}

// Meter reading calculation
export interface MeterCalculation {
  previous_reading: number
  current_reading: number
  usage_amount: number
  rate_per_unit: number
  amount: number
}

// Payment summary
export interface PaymentSummary {
  total_billed: number
  total_paid: number
  total_outstanding: number
  overdue_amount: number
  payment_count: number
  last_payment_date?: string
}
