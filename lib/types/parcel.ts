// lib/types/parcel.ts

export type ParcelStatus = 'pending' | 'delivered' | 'picked_up' | 'expired'

export type PickupMethod = 'qr_code' | 'id_card' | 'phone' | 'unit_code'

export interface Parcel {
  id: string
  unit_number: string
  recipient_name: string
  courier_company: string
  tracking_number?: string
  parcel_image_url?: string
  parcel_description?: string
  status: ParcelStatus
  received_at: string
  picked_up_at?: string
  picked_up_by?: string
  picked_up_method?: PickupMethod
  staff_received_by: string
  staff_delivered_by?: string
  digital_signature?: string
  delivery_photo_url?: string
  notes?: string
  created_at: string
  updated_at: string
  expires_at: string
  project_id?: string  // ✅ เพิ่มสำหรับ multi-project support
}

export interface ParcelAuthorization {
  id: string
  parcel_id: string
  authorized_by_unit_number: string
  authorized_person_name: string
  authorized_person_phone?: string
  authorized_person_id_card?: string
  authorization_code: string
  is_used: boolean
  used_at?: string
  created_at: string
  expires_at: string
}

export interface ParcelFormData {
  unit_number: string
  recipient_name: string
  courier_company: string
  tracking_number?: string
  parcel_description?: string
  staff_received_by: string
  notes?: string
  project_id?: string  // ✅ เพิ่มสำหรับ multi-project support
}

export interface ParcelPickupData {
  parcel_id: string
  picked_up_by: string
  picked_up_method: PickupMethod
  staff_delivered_by: string
  digital_signature?: string
  delivery_photo_url?: string
  notes?: string
}

export interface ParcelStats {
  total_parcels: number
  pending_parcels: number
  delivered_parcels: number
  picked_up_parcels: number
  expired_parcels: number
  today_parcels: number
  this_month_parcels: number
}

export interface ParcelReport {
  date: string
  total_parcels: number
  pending_parcels: number
  delivered_parcels: number
  picked_up_parcels: number
  expired_parcels: number
  top_courier_companies: Array<{
    company: string
    count: number
  }>
  top_units: Array<{
    unit_number: string
    count: number
  }>
}
