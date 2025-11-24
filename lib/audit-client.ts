"use client"

import { createClient } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { useProjectContext } from "@/lib/contexts/project-context"

export type AuditPayload = {
  action: string
  entity_type: string
  entity_id?: string | null
  old_values?: Record<string, any> | null
  new_values?: Record<string, any> | null
}

// Simple client-side audit logger. Gracefully handles missing table/policies.
export async function logAudit(payload: AuditPayload, projectId?: string | null) {
  try {
    const supabase = createClient()
    const user = getCurrentUser()

    const insertData = {
      user_id: user?.id || null,
      company_id: user?.company_id || null,
      project_id: projectId || user?.project_id || null,
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id || null,
      old_values: payload.old_values || null,
      new_values: payload.new_values || null,
    }

    const { error } = await supabase.from("audit_logs").insert([insertData])
    if (error) {
      console.warn("[audit] insert error (ignored):", error.message)
    }
  } catch (err) {
    console.warn("[audit] unexpected error (ignored):", err)
  }
}

