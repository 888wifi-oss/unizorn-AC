// Notification types
export type NotificationType = 
  | 'payment_due' 
  | 'payment_received' 
  | 'payment_uploaded'
  | 'payment_confirmed'
  | 'payment_rejected'
  | 'payment_pending_review'
  | 'maintenance_update' 
  | 'announcement' 
  | 'bill_generated'

export interface Notification {
  id: string
  user_id?: string
  unit_id?: string
  project_id?: string
  type: NotificationType
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
  expires_at?: string
}
