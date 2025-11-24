import { NextResponse } from "next/server"
import { buildPaymentsReportContext, type PaymentsReportFilters } from "@/lib/reports/payments-report"

const encodeCsvValue = (value: string | number) => {
  const stringValue = typeof value === "number" ? value.toString() : value
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const buildCsv = (headers: string[], rows: (string | number)[][]) => {
  const lines = [headers.map(encodeCsvValue).join(",")]
  for (const row of rows) {
    lines.push(row.map(encodeCsvValue).join(","))
  }
  return lines.join("\r\n")
}

const formatRowsForJson = (rows: (string | number)[][]) =>
  rows.map((row) =>
    row.map((value) => (typeof value === "number" ? value.toLocaleString("th-TH", { minimumFractionDigits: 2 }) : value)),
  )

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const includeLegacy = searchParams.get("includeLegacy") === "true"
  const dateStart = searchParams.get("dateStart") ?? undefined
  const dateEnd = searchParams.get("dateEnd") ?? undefined
  const format = searchParams.get("format") ?? "json"

  const filters: PaymentsReportFilters = {
    projectId,
    includeLegacy,
    dateStart,
    dateEnd,
  }

  try {
    const { items, paymentRows, columns, columnStyles } = await buildPaymentsReportContext(filters)

    const headers = columns.map((column) => column.header)
    const rows = paymentRows.map((row) => headers.map((header) => row[header]))

    if (format === "csv") {
      const csv = buildCsv(headers, rows)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=\"payments-report.csv\"",
        },
      })
    }

    if (format === "xlsx") {
      const XLSX = await import("xlsx")
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payments")
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=\"payments-report.xlsx\"",
        },
      })
    }

    const summary = {
      totalPayments: items.length,
      totalAmount: items.reduce((sum, item) => sum + item.payment.amount, 0),
      reconciled: items.filter((item) => item.payment.reconciled).length,
      unreconciled: items.filter((item) => !item.payment.reconciled).length,
    }

    return NextResponse.json({ filters, summary, headers, rows: formatRowsForJson(rows), columnStyles })
  } catch (error: any) {
    console.error("[PaymentsReport] Error generating report:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to generate payments report" },
      { status: 500 },
    )
  }
}

