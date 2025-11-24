export interface AutomationRule {
  id: string
  name: string
  description: string
  type: 'payment_due' | 'maintenance_reminder' | 'parcel_overdue' | 'monthly_report' | 'custom'
  isActive: boolean
  conditions: {
    field: string
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'is_empty'
    value: string | number
  }[]
  actions: {
    type: 'send_notification' | 'send_email' | 'create_task' | 'update_status'
    target: string
    message: string
    data?: any
  }[]
  schedule?: {
    type: 'daily' | 'weekly' | 'monthly' | 'on_event'
    time?: string
    day?: number
  }
  createdAt: string
  updatedAt: string
}

export interface AutomationExecution {
  id: string
  ruleId: string
  status: 'success' | 'failed' | 'running'
  executedAt: string
  results: {
    action: string
    success: boolean
    message: string
    target?: string
  }[]
  error?: string
}
