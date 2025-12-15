import { NextResponse } from "next/server"
import {
  deletePaymentReportSchedule,
  getPaymentReportSchedule,
  upsertPaymentReportSchedule,
} from "@/lib/supabase/payments-report-schedule-actions"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  try {
    const schedule = await getPaymentReportSchedule(projectId)
    return NextResponse.json({ schedule })
  } catch (error: any) {
    console.error("[Schedule] GET error", error)
    return NextResponse.json({ error: error?.message || "Failed to load schedule" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const schedule = await upsertPaymentReportSchedule({
      projectId: body.projectId ?? null,
      recipients: Array.isArray(body.recipients)
        ? body.recipients
        : String(body.recipients || "")
            .split(",")
            .map((recipient: string) => recipient.trim())
            .filter(Boolean),
      sendFormat: body.sendFormat === "xlsx" ? "xlsx" : "csv",
      runTime: body.runTime || "08:00",
      timezone: body.timezone || "Asia/Bangkok",
      includeLegacy: !!body.includeLegacy,
      active: body.active ?? true,
    })
    return NextResponse.json({ schedule })
  } catch (error: any) {
    console.error("[Schedule] POST error", error)
    return NextResponse.json({ error: error?.message || "Failed to save schedule" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  try {
    await deletePaymentReportSchedule(projectId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Schedule] DELETE error", error)
    return NextResponse.json({ error: error?.message || "Failed to delete schedule" }, { status: 500 })
  }
}





