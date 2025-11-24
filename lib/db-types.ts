export interface Unit {
  id: string
  unit_number: string
  floor: number
  size: number
  owner_name: string
  owner_phone?: string
  owner_email?: string
  residents: number
  status: "occupied" | "vacant" | "maintenance"
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  unit_id: string
  bill_number: string
  month: string
  year: number
  common_fee: number
  water_fee: number
  electricity_fee: number
  parking_fee: number
  other_fee: number
  total: number
  status: "paid" | "pending" | "overdue"
  due_date: string
  created_at: string
  updated_at: string
  units?: Unit
}

export interface Payment {
  id: string
  bill_id: string
  unit_id: string
  amount: number
  payment_date: string
  payment_method: string
  reference_number?: string
  notes?: string
  created_at: string
  updated_at: string
  bills?: Bill
  units?: Unit
  reconciled?: boolean
  reconciliation_date?: string | null
  reconciliation_notes?: string | null
  reconciliation_assignee?: string | null
  reconciliation_status?: "done" | "needs_review" | "pending" | null
  reconciliation_updated_by?: string | null
  reconciled_by?: string | null
  reconciled_at?: string | null
}
