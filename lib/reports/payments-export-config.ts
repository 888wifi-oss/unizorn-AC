import { buildColumnStyles, type PaymentExportColumn } from "@/lib/exports/payments-export"

export type PaymentRecord = {
  id: string
  bill_id: string
  unit_id: string
  amount: number
  payment_method: "cash" | "transfer" | "check" | "credit_card"
  payment_date: string
  reference_number: string | null
  notes?: string | null
  reconciled?: boolean
  reconciliation_date?: string | null
  reconciled_by?: string | null
  reconciled_at?: string | null
  reconciliation_notes?: string | null
  reconciliation_assignee?: string | null
  reconciliation_status?: string | null
  reconciliation_updated_by?: string | null
}

export type BillRecord = {
  id: string
  bill_number?: string | null
  month?: string | null
}

export type UnitRecord = {
  id: string
  unit_number: string
}

export type PaymentExportItem = {
  payment: PaymentRecord
  bill: BillRecord | null
  unitNumber: string
}

export const createPaymentExportItems = ({
  payments,
  bills,
  units,
}: {
  payments: PaymentRecord[]
  bills: BillRecord[]
  units: UnitRecord[]
}): PaymentExportItem[] => {
  const billMap = new Map(bills.map((bill) => [bill.id, bill]))
  const unitMap = new Map(units.map((unit) => [unit.id, unit.unit_number]))

  return payments.map((payment) => ({
    payment,
    bill: billMap.get(payment.bill_id) || null,
    unitNumber: unitMap.get(payment.unit_id) || payment.unit_id,
  }))
}

export const createPaymentExportColumns = ({
  formatDate,
  formatDateTime,
  formatPaymentMethod,
}: {
  formatDate: (date: string) => string
  formatDateTime: (date?: string | null) => string
  formatPaymentMethod: (method: PaymentRecord["payment_method"]) => string
}): PaymentExportColumn<PaymentExportItem>[] => [
  {
    header: "เลขที่อ้างอิง",
    getValue: ({ payment }) => payment.reference_number || "",
    width: 28,
  },
  {
    header: "ใบแจ้งหนี้",
    getValue: ({ bill }) => bill?.bill_number || "",
    width: 32,
  },
  {
    header: "งวดบิล",
    getValue: ({ bill }) => bill?.month || "",
    width: 24,
  },
  {
    header: "เลขห้อง",
    getValue: ({ unitNumber }) => unitNumber,
    width: 24,
  },
  {
    header: "จำนวนเงิน (บาท)",
    getValue: ({ payment }) => Number(payment.amount.toFixed(2)),
    align: "right",
    width: 28,
  },
  {
    header: "วิธีชำระ",
    getValue: ({ payment }) => formatPaymentMethod(payment.payment_method),
    width: 30,
  },
  {
    header: "วันที่ชำระ",
    getValue: ({ payment }) => formatDate(payment.payment_date),
    width: 30,
  },
  {
    header: "หมายเหตุ",
    getValue: ({ payment }) => payment.notes || "",
    width: "wrap",
  },
  {
    header: "สถานะกระทบยอด",
    getValue: ({ payment }) => (payment.reconciled ? "กระทบยอดแล้ว" : "ยังไม่กระทบยอด"),
    width: 36,
  },
  {
    header: "วันที่กระทบยอด",
    getValue: ({ payment }) =>
      payment.reconciliation_date ? formatDate(payment.reconciliation_date as string) : "",
    width: 30,
  },
  {
    header: "เวลาที่กระทบยอด",
    getValue: ({ payment }) => formatDateTime(payment.reconciled_at),
    width: 30,
  },
  {
    header: "ผู้กระทบยอด",
    getValue: ({ payment }) => payment.reconciled_by || "",
    width: 45,
  },
]

export const createPaymentColumnStyles = (columns: PaymentExportColumn<PaymentExportItem>[]) =>
  buildColumnStyles(columns)

