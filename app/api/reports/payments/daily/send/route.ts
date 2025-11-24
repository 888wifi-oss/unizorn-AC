import { NextResponse } from "next/server"
import { buildPaymentsReportContext, type PaymentsReportFilters } from "@/lib/reports/payments-report"
import { updateScheduleLastRun } from "@/lib/supabase/payments-report-schedule-actions"
import { sendEmailNotification } from "@/lib/email-service"

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || ""

const formatRowsForEmail = (headers: string[], rows: (string | number)[][], limit = 10) => {
  const previewRows = rows.slice(0, limit)
  const headerHtml = headers.map((header) => `<th style="padding:6px 8px;background:#f1f5f9;">${header}</th>`).join("")
  const bodyHtml = previewRows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td style="padding:6px 8px;border-top:1px solid #e2e8f0;">${
            typeof cell === "number"
              ? cell.toLocaleString("th-TH", { minimumFractionDigits: 2 })
              : cell
          }</td>`)
          .join("")}</tr>`,
    )
    .join("")

  return `<table style="border-collapse:collapse;width:100%;margin-top:16px;">${headerHtml ? `<thead><tr>${headerHtml}</tr></thead>` : ""}<tbody>${bodyHtml}</tbody></table>`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const filters: PaymentsReportFilters = {
      projectId: body.projectId ?? null,
      includeLegacy: !!body.includeLegacy,
      dateStart: body.dateStart ?? undefined,
      dateEnd: body.dateEnd ?? undefined,
    }

    const recipients: string[] = Array.isArray(body.recipients)
      ? body.recipients
      : String(body.recipients || "")
          .split(",")
          .map((recipient: string) => recipient.trim())
          .filter(Boolean)

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Recipients required" }, { status: 400 })
    }

    const format: "csv" | "xlsx" = body.format === "xlsx" ? "xlsx" : "csv"
    const scheduleId: string | null = body.scheduleId ?? null

    const context = await buildPaymentsReportContext(filters)
    const headers = context.columns.map((column) => column.header)
    const rows = context.paymentRows.map((row) => headers.map((header) => row[header]))

    const summaryHtml = `
      <p>สวัสดีค่ะ/ครับ</p>
      <p>รายงานการชำระเงินอัตโนมัติประจำวันที่ ${new Date().toLocaleString("th-TH")} มีรายละเอียดดังนี้</p>
      <ul>
        <li>จำนวนรายการทั้งหมด: <strong>${context.items.length.toLocaleString()}</strong></li>
        <li>ยอดรวมทั้งหมด: <strong>${context.items
          .reduce((sum, item) => sum + item.payment.amount, 0)
          .toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong></li>
        <li>กระทบยอดแล้ว: ${context.items.filter((item) => item.payment.reconciled).length.toLocaleString()} รายการ</li>
        <li>ยังไม่กระทบยอด: ${context.items.filter((item) => !item.payment.reconciled).length.toLocaleString()} รายการ</li>
      </ul>
      <p>ตัวอย่างข้อมูลล่าสุด:</p>
      ${formatRowsForEmail(headers, rows)}
      <p style="margin-top:16px;">ดาวน์โหลดไฟล์เต็ม: <a href="${APP_BASE_URL}/api/reports/payments/daily?format=${format}&projectId=${filters.projectId ?? ""}&includeLegacy=${filters.includeLegacy ?? false}">คลิกที่นี่</a></p>
      <p style="margin-top:16px;font-size:12px;color:#64748b;">อีเมลนี้ส่งจากระบบอัตโนมัติ</p>
    `

    const results = await Promise.all(
      recipients.map((recipient) =>
        sendEmailNotification(recipient, "รายงานการชำระเงินอัตโนมัติ", summaryHtml, summaryHtml.replace(/<[^>]*>/g, " ")),
      ),
    )

    const failed = results.find((result) => !result?.success)
    if (failed) {
      throw new Error(failed.error || "ไม่สามารถส่งอีเมลรายงานได้")
    }

    if (scheduleId) {
      await updateScheduleLastRun(scheduleId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[PaymentsReport] send error", error)
    return NextResponse.json({ error: error?.message || "Failed to send report" }, { status: 500 })
  }
}
