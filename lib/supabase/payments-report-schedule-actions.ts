import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type PaymentReportSchedule = {
  id: string
  project_id: string | null
  recipients: string[]
  send_format: "csv" | "xlsx"
  run_time: string
  timezone: string
  include_legacy: boolean
  active: boolean
  last_run_at: string | null
  created_at: string
  updated_at: string
}

type ScheduleInput = {
  projectId: string | null
  recipients: string[]
  sendFormat: "csv" | "xlsx"
  runTime: string
  timezone: string
  includeLegacy: boolean
  active: boolean
}

const table = "payments_report_schedules"

export async function getPaymentReportSchedule(projectId: string | null) {
  const supabase = await createClient()

  const query = projectId
    ? supabase.from(table).select("*").eq("project_id", projectId).maybeSingle()
    : supabase.from(table).select("*").is("project_id", null).maybeSingle()

  const { data, error } = await query

  if (error && error.code !== "PGRST116") {
    throw error
  }

  return (data as PaymentReportSchedule | null) ?? null
}

export async function upsertPaymentReportSchedule(input: ScheduleInput) {
  const admin = createAdminClient()

  const { projectId, recipients, sendFormat, runTime, timezone, includeLegacy, active } = input

  const { data, error } = await admin
    .from(table)
    .upsert(
      {
        project_id: projectId,
        recipients,
        send_format: sendFormat,
        run_time: runTime,
        timezone,
        include_legacy: includeLegacy,
        active,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" },
    )
    .select("*")
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as PaymentReportSchedule
}

export async function deletePaymentReportSchedule(projectId: string | null) {
  const admin = createAdminClient()

  const query = projectId
    ? admin.from(table).delete().eq("project_id", projectId)
    : admin.from(table).delete().is("project_id", null)

  const { error } = await query

  if (error) {
    throw error
  }

  return { success: true }
}

export async function updateScheduleLastRun(id: string) {
  const admin = createAdminClient()

  const { error } = await admin
    .from(table)
    .update({ last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    throw error
  }
}



