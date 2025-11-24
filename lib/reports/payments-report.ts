import { formatDate } from "@/lib/date-formatter"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  createPaymentExportColumns,
  createPaymentExportItems,
  createPaymentColumnStyles,
  type PaymentExportItem,
  type PaymentRecord,
  type BillRecord,
  type UnitRecord,
} from "./payments-export-config"
import { buildExportRows, type PaymentExportRow } from "@/lib/exports/payments-export"

export type PaymentsReportFilters = {
  projectId?: string | null
  includeLegacy?: boolean
  dateStart?: string
  dateEnd?: string
}

export type PaymentsReportSettings = {
  dateFormat: Parameters<typeof formatDate>[1]
  yearType: Parameters<typeof formatDate>[2]
}

export type PaymentsReportContext = {
  items: PaymentExportItem[]
  paymentRows: PaymentExportRow[]
  columns: ReturnType<typeof createPaymentExportColumns>
  columnStyles: ReturnType<typeof createPaymentColumnStyles>
}

const DEFAULT_SETTINGS: PaymentsReportSettings = {
  dateFormat: "medium",
  yearType: "buddhist",
}

const normalizePayment = (payment: any): PaymentRecord => ({
  id: payment.id,
  bill_id: payment.bill_id,
  unit_id: payment.unit_id,
  amount: payment.amount ?? 0,
  payment_method: payment.payment_method,
  payment_date: payment.payment_date,
  reference_number: payment.reference_number ?? null,
  notes: payment.notes ?? null,
  reconciled: payment.reconciled ?? false,
  reconciliation_date: payment.reconciliation_date ?? null,
  reconciled_by: payment.reconciled_by ?? null,
  reconciled_at: payment.reconciled_at ?? null,
})

const normalizeBill = (bill: any): BillRecord => ({
  id: bill.id,
  bill_number: bill.bill_number ?? null,
  month: bill.month ?? null,
})

const normalizeUnit = (unit: any): UnitRecord => ({
  id: unit.id,
  unit_number: unit.unit_number,
})

export const fetchPaymentsReportData = async (filters: PaymentsReportFilters = {}) => {
  const supabase = createAdminClient()
  const { projectId, includeLegacy = false, dateStart, dateEnd } = filters

  let paymentsQuery = supabase
    .from("payments")
    .select(
      "id,bill_id,unit_id,amount,payment_method,payment_date,reference_number,notes,created_at,reconciled,reconciliation_date,reconciled_by,reconciled_at,project_id",
    )
    .order("payment_date", { ascending: false })

  if (dateStart) {
    paymentsQuery = paymentsQuery.gte("payment_date", dateStart)
  }
  if (dateEnd) {
    paymentsQuery = paymentsQuery.lte("payment_date", dateEnd)
  }
  if (projectId) {
    paymentsQuery = includeLegacy
      ? paymentsQuery.or(`project_id.eq.${projectId},project_id.is.null`)
      : paymentsQuery.eq("project_id", projectId)
  }

  let billsFilter = supabase.from("bills").select("id,unit_id,total,status,month,created_at,project_id,bill_number")
  if (projectId) {
    billsFilter = includeLegacy
      ? billsFilter.or(`project_id.eq.${projectId},project_id.is.null`)
      : billsFilter.eq("project_id", projectId)
  }

  const unitsQuery = supabase.from("units").select("id,unit_number,project_id")
  const unitsFilter = projectId ? unitsQuery.eq("project_id", projectId) : unitsQuery

  const [paymentsResult, billsResult, unitsResult] = await Promise.all([paymentsQuery, billsFilter, unitsFilter])

  if (paymentsResult.error) {
    throw paymentsResult.error
  }
  if (billsResult.error) {
    throw billsResult.error
  }
  if (unitsResult.error) {
    throw unitsResult.error
  }

  return {
    payments: (paymentsResult.data ?? []).map(normalizePayment),
    bills: (billsResult.data ?? []).map(normalizeBill),
    units: (unitsResult.data ?? []).map(normalizeUnit),
  }
}

export const buildPaymentsReportContext = async (
  filters: PaymentsReportFilters = {},
  settings: PaymentsReportSettings = DEFAULT_SETTINGS,
): Promise<PaymentsReportContext> => {
  const dataset = await fetchPaymentsReportData(filters)

  const columns = createPaymentExportColumns({
    formatDate: (date) => formatDate(date, settings.dateFormat, settings.yearType),
    formatDateTime: (value) =>
      value ? formatDate(value, settings.dateFormat, settings.yearType, { hour: "2-digit", minute: "2-digit" }) : "",
    formatPaymentMethod: (method) => {
      const labels = {
        cash: "เงินสด",
        transfer: "โอนเงิน",
        check: "เช็ค",
        credit_card: "บัตรเครดิต",
      } as const
      return labels[method]
    },
  })

  const items = createPaymentExportItems(dataset)
  const paymentRows = buildExportRows({ columns, data: items })
  const columnStyles = createPaymentColumnStyles(columns)

  return {
    items,
    paymentRows,
    columns,
    columnStyles,
  }
}

