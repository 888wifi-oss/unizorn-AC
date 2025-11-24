"use client"

import { useState, useEffect, useMemo } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  Calendar,
  Receipt,
  CreditCard,
  Banknote,
  CheckCircle2,
  Lock,
  Unlock,
  FileSpreadsheet,
  ShieldCheck,
  Download,
  FileText,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Bill, Unit } from "@/lib/db-types"
import { useSettings } from "@/lib/settings-context"
import { useSearchParams } from "next/navigation"
import { formatDate } from "@/lib/date-formatter"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { logAudit } from "@/lib/audit-client"
import { buildAutoTableOptions, buildExportRows } from "@/lib/exports/payments-export"
import {
  createPaymentExportColumns,
  createPaymentExportItems,
  createPaymentColumnStyles,
} from "@/lib/reports/payments-export-config"
import {
  deletePaymentReportSchedule,
  getPaymentReportSchedule,
  upsertPaymentReportSchedule,
} from "@/lib/supabase/payments-report-schedule-actions"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { savePayment } from "@/lib/supabase/actions"

type Payment = {
  id: string
  bill_id: string
  unit_id: string
  amount: number
  payment_method: "cash" | "transfer" | "check" | "credit_card"
  payment_date: string
  reference_number: string | null
  notes?: string
  created_at: string
  project_id?: string | null
  reconciled?: boolean
  reconciliation_date?: string | null
  reconciled_by?: string | null
  reconciled_at?: string | null
  reconciliation_notes?: string | null
  reconciliation_assignee?: string | null
  reconciliation_status?: "done" | "needs_review" | "pending" | null
  reconciliation_updated_by?: string | null
}

type PaymentBill = Pick<Bill, "id" | "unit_id" | "total" | "status" | "month" | "created_at"> & {
  project_id?: string | null
  bill_number?: string | null
}

type PaymentUnit = Pick<Unit, "id" | "unit_number"> & {
  project_id?: string | null
}

type SarabunFontWeight = "normal" | "bold"

const SARABUN_FONT_SOURCES: Record<SarabunFontWeight, { url: string; filename: string }> = {
  normal: {
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf",
    filename: "Sarabun-Regular.ttf",
  },
  bold: {
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Bold.ttf",
    filename: "Sarabun-Bold.ttf",
  },
}

const sarabunFontCache: Partial<Record<SarabunFontWeight, Promise<string>>> = {}

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const subArray = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
    binary += String.fromCharCode(...subArray)
  }
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(binary)
  }
  throw new Error("Base64 encoding is not available in this environment")
}

const getSarabunFontBase64 = async (weight: SarabunFontWeight) => {
  if (sarabunFontCache[weight]) return sarabunFontCache[weight]!
  sarabunFontCache[weight] = (async () => {
    const source = SARABUN_FONT_SOURCES[weight]
    if (!source) {
      throw new Error(`Unsupported font weight: ${weight}`)
    }
    try {
      const response = await fetch(source.url)
      if (!response.ok) {
        throw new Error(`Failed to load Sarabun font (${response.status})`)
      }
      const buffer = await response.arrayBuffer()
      return arrayBufferToBase64(buffer)
    } catch (error) {
      sarabunFontCache[weight] = undefined
      throw error
    }
  })()
  return sarabunFontCache[weight]!
}

export default function PaymentsPage() {
  const { settings } = useSettings()
  const { toast } = useToast()
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()
  const searchParams = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [bills, setBills] = useState<PaymentBill[]>([])
  const [allBills, setAllBills] = useState<PaymentBill[]>([])
  const [units, setUnits] = useState<PaymentUnit[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateStart, setDateStart] = useState<string>("")
  const [dateEnd, setDateEnd] = useState<string>("")
  const [includeLegacy, setIncludeLegacy] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pdfOrientation, setPdfOrientation] = useState<"portrait" | "landscape">("landscape")
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    recipients: "",
    sendFormat: "csv" as "csv" | "xlsx",
    runTime: "08:00",
    timezone: "Asia/Bangkok",
    includeLegacy: false,
    active: true,
    scheduleId: null as string | null,
    lastRunAt: null as string | null,
  })
  const [selectedReconcile, setSelectedReconcile] = useState<Payment | null>(null)
  const [reconcileNotes, setReconcileNotes] = useState("")
  const [reconcileAssignee, setReconcileAssignee] = useState<string>("")
  const [reconcileStatus, setReconcileStatus] = useState<"done" | "needs_review" | "pending">("done")
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([])
  const [formData, setFormData] = useState({
    billId: "",
    amount: "",
    paymentMethod: "cash" as Payment["payment_method"],
    paymentDate: "",
    referenceNumber: "",
    notes: "",
    vatPercent: "0",
    whtPercent: "0",
    requiresApproval: false,
  })
  const [lockedMonth, setLockedMonth] = useState<string | null>(null)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<"all" | Payment["payment_method"]>("all")
  const [reconciledFilter, setReconciledFilter] = useState<"all" | "reconciled" | "unreconciled">("all")
  const [minAmount, setMinAmount] = useState<string>("")
  const [maxAmount, setMaxAmount] = useState<string>("")
  const [updatingReconcileId, setUpdatingReconcileId] = useState<string | null>(null)

  useEffect(() => {
    console.log(
      '[Payments] useEffect triggered. selectedProjectId:',
      selectedProjectId,
      'dateStart:',
      dateStart,
      'dateEnd:',
      dateEnd,
      'includeLegacy:',
      includeLegacy
    )
    loadData()
  }, [selectedProjectId, dateStart, dateEnd, includeLegacy])

  useEffect(() => {
    if (isScheduleDialogOpen) {
      loadSchedule()
    }
  }, [isScheduleDialogOpen, selectedProjectId])

  const loadData = async () => {
    const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const supabase = createClient()
    const isRestricted = selectedProjectId && currentUser.role !== 'super_admin'

    // Load payments (no default limit; use optional date range filters)
    let paymentsQuery = supabase
      .from("payments")
      .select("id,bill_id,unit_id,amount,payment_method,payment_date,reference_number,notes,created_at,reconciled,reconciliation_date,reconciled_by,reconciled_at,project_id,reconciliation_notes,reconciliation_assignee,reconciliation_status,reconciliation_updated_by")
      .order("payment_date", { ascending: false })
    if (dateStart) {
      paymentsQuery = paymentsQuery.gte('payment_date', dateStart)
    }
    if (dateEnd) {
      paymentsQuery = paymentsQuery.lte('payment_date', dateEnd)
    }
    const { data: paymentsData, error: paymentsError } = await paymentsQuery
    if (paymentsError) {
      console.error("[Payments] Error loading payments:", paymentsError)
    }

    // Load bills (last 12 months, minimal columns)
    let billsQuery = supabase
      .from("bills")
      .select("id,unit_id,total,status,month,created_at,project_id,bill_number")
      .order("created_at", { ascending: false })
    const { data: billsData, error: billsError } = await billsQuery
    if (billsError) {
      console.error("[Payments] Error loading bills:", billsError)
    }

    // Load units (minimal columns)
    let unitsQuery = supabase.from("units").select("id,unit_number,project_id")
    const { data: unitsData, error: unitsError } = await unitsQuery
    if (unitsError) {
      console.error("[Payments] Error loading units:", unitsError)
    }

    // Store all data
    const normalizedPayments = (paymentsData || []) as Payment[]
    const normalizedBills = (billsData || []) as PaymentBill[]
    const normalizedUnits = (unitsData || []) as PaymentUnit[]
    const billProjectMap = new Map(normalizedBills.map((bill) => [bill.id, bill.project_id ?? null]))
    const enrichedPayments = normalizedPayments.map((payment) => {
      const inferredProject = payment.project_id ?? billProjectMap.get(payment.bill_id) ?? null
      return { ...payment, project_id: inferredProject }
    }) as Payment[]
    setAllPayments(enrichedPayments)
    setAllBills(normalizedBills)
    console.log('[Payments] Total payments from DB:', paymentsData?.length || 0)
    console.log('[Payments] Total bills from DB:', billsData?.length || 0)

    // Since we applied server-side filters, just set data
    console.log('[perf] Payments page fetch sizes:', {
      payments: paymentsData?.length || 0,
      bills: billsData?.length || 0,
      units: unitsData?.length || 0
    })
    const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
    console.log(`[perf] Payments page load duration: ${Math.round(tEnd - tStart)}ms`)

    const filteredPayments = isRestricted
      ? enrichedPayments.filter((payment) => {
        if (!selectedProjectId) return true
        if (payment.project_id === selectedProjectId) return true
        if (includeLegacy && !payment.project_id) return true
        return false
      })
      : enrichedPayments

    const filteredBills = isRestricted
      ? normalizedBills.filter((bill) => {
        if (!selectedProjectId) return true
        if (bill.project_id === selectedProjectId) return true
        if (includeLegacy && !bill.project_id) return true
        return false
      })
      : normalizedBills

    const filteredUnits = isRestricted
      ? normalizedUnits.filter((unit) => {
        if (!selectedProjectId) return true
        if (unit.project_id === selectedProjectId) return true
        if (includeLegacy && !unit.project_id) return true
        return false
      })
      : normalizedUnits

    setPayments(filteredPayments)
    setBills(filteredBills)
    setUnits(filteredUnits)
  }

  // Period Lock persistence (localStorage for now; server/table can be added later)
  useEffect(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const key = selectedProjectId ? `period_lock_ar_${selectedProjectId}_${currentMonth}` : `period_lock_ar_${currentMonth}`
    const value = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    setLockedMonth(value ? currentMonth : null)
  }, [selectedProjectId])

  const togglePeriodLock = () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const key = selectedProjectId ? `period_lock_ar_${selectedProjectId}_${currentMonth}` : `period_lock_ar_${currentMonth}`
    if (lockedMonth) {
      window.localStorage.removeItem(key)
      setLockedMonth(null)
      toast({ title: "ปลดล็อกงวดบัญชีแล้ว", description: `งวด ${currentMonth} สามารถบันทึกได้` })
      logAudit({ action: 'period_unlock', entity_type: 'accounts_receivable', new_values: { month: currentMonth } }, selectedProjectId || null)
    } else {
      window.localStorage.setItem(key, 'locked')
      setLockedMonth(currentMonth)
      toast({ title: "ล็อกงวดบัญชีแล้ว", description: `งวด ${currentMonth} ถูกปิดไม่ให้บันทึก` })
      logAudit({ action: 'period_lock', entity_type: 'accounts_receivable', new_values: { month: currentMonth } }, selectedProjectId || null)
    }
  }

  const getUnitNumber = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId)
    return unit?.unit_number || unitId
  }

  const getBillDetails = (billId: string) => {
    return bills.find((b) => b.id === billId) || null
  }

  const formatCurrency = (value: number) => {
    return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return ""
    return formatDate(value, "medium", settings.yearType, { hour: "2-digit", minute: "2-digit" })
  }

  function getPaymentMethodIcon(method: Payment["payment_method"]) {
    const icons = {
      cash: <Banknote className="w-4 h-4" />,
      transfer: <CreditCard className="w-4 h-4" />,
      check: <Receipt className="w-4 h-4" />,
      credit_card: <CreditCard className="w-4 h-4" />,
    }
    return icons[method]
  }

  function getPaymentMethodLabel(method: Payment["payment_method"]) {
    const labels = {
      cash: "เงินสด",
      transfer: "โอนเงิน",
      check: "เช็ค",
      credit_card: "บัตรเครดิต",
    } as const
    return labels[method]
  }

  const paymentExportColumns = useMemo(
    () =>
      createPaymentExportColumns({
        formatDate: (date) => formatDate(date, settings.dateFormat, settings.yearType),
        formatDateTime,
        formatPaymentMethod: getPaymentMethodLabel,
      }),
    [settings.dateFormat, settings.yearType],
  )

  const paymentExportItems = useMemo(
    () =>
      createPaymentExportItems({
        payments: payments,
        bills: bills.map((bill) => ({ id: bill.id, bill_number: bill.bill_number, month: bill.month })),
        units: units.map((unit) => ({ id: unit.id, unit_number: unit.unit_number })),
      }),
    [payments, bills, units],
  )

  const paymentColumnStyles = useMemo(() => createPaymentColumnStyles(paymentExportColumns), [paymentExportColumns])

  const buildPaymentRows = () => buildExportRows({ columns: paymentExportColumns, data: paymentExportItems })

  const loadSchedule = async () => {
    setScheduleLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedProjectId) params.set("projectId", selectedProjectId)
      const response = await fetch(`/api/reports/payments/schedules?${params.toString()}`)
      if (!response.ok) throw new Error("ไม่สามารถโหลดกำหนดการได้")
      const { schedule } = await response.json()
      if (schedule) {
        setScheduleForm({
          recipients: (schedule.recipients || []).join(", "),
          sendFormat: schedule.send_format,
          runTime: schedule.run_time || "08:00",
          timezone: schedule.timezone || "Asia/Bangkok",
          includeLegacy: schedule.include_legacy,
          active: schedule.active,
          scheduleId: schedule.id,
          lastRunAt: schedule.last_run_at,
        })
      } else {
        setScheduleForm({
          recipients: "",
          sendFormat: "csv",
          runTime: "08:00",
          timezone: "Asia/Bangkok",
          includeLegacy: false,
          active: true,
          scheduleId: null,
          lastRunAt: null,
        })
      }
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error?.message || "โหลดกำหนดการไม่สำเร็จ", variant: "destructive" })
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleSaveSchedule = async () => {
    try {
      const body = {
        projectId: selectedProjectId,
        recipients: scheduleForm.recipients,
        sendFormat: scheduleForm.sendFormat,
        runTime: scheduleForm.runTime,
        timezone: scheduleForm.timezone,
        includeLegacy: scheduleForm.includeLegacy,
        active: scheduleForm.active,
      }
      const response = await fetch(`/api/reports/payments/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error("บันทึกกำหนดการไม่สำเร็จ")
      toast({ title: "บันทึกสำเร็จ", description: "อัปเดตกำหนดการรายงานแล้ว" })
      await loadSchedule()
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error?.message || "ไม่สามารถบันทึกได้", variant: "destructive" })
    }
  }

  const handleDeleteSchedule = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedProjectId) params.set("projectId", selectedProjectId)
      const response = await fetch(`/api/reports/payments/schedules?${params.toString()}`, { method: "DELETE" })
      if (!response.ok) throw new Error("ลบกำหนดการไม่สำเร็จ")
      toast({ title: "ลบสำเร็จ", description: "ลบกำหนดการเรียบร้อย" })
      await loadSchedule()
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error?.message || "ไม่สามารถลบได้", variant: "destructive" })
    }
  }

  const handleSendScheduleNow = async () => {
    try {
      const response = await fetch(`/api/reports/payments/daily/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          includeLegacy: scheduleForm.includeLegacy,
          recipients: scheduleForm.recipients,
          format: scheduleForm.sendFormat,
          scheduleId: scheduleForm.scheduleId,
        }),
      })
      if (!response.ok) throw new Error("ไม่สามารถส่งรายงานได้")
      toast({ title: "ส่งรายงานแล้ว", description: "ส่งข้อมูลไปยังผู้รับเรียบร้อย" })
      if (scheduleForm.scheduleId) {
        await loadSchedule()
      }
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error?.message || "ส่งรายงานไม่สำเร็จ", variant: "destructive" })
    }
  }

  const getExportFilename = (extension: string) => {
    const now = new Date()
    return `payments_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(
      2,
      "0",
    )}.${extension}`
  }

  const downloadCsv = (content: string, filename: string) => {
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportCsv = () => {
    if (payments.length === 0) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "ไม่มีรายการให้ส่งออก โปรดปรับตัวกรองหรือบันทึกรายการก่อน",
        variant: "destructive",
      })
      return
    }

    const toCsvValue = (value: string | number | null | undefined) => {
      if (value === null || value === undefined) return ""
      const stringValue = typeof value === "number" ? value.toFixed(2) : String(value)
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const rows = buildPaymentRows()
    const csvContent = [
      paymentExportColumns.map((column) => toCsvValue(column.header)).join(","),
      ...rows.map((row) => paymentExportColumns.map((column) => toCsvValue(row[column.header])).join(",")),
    ].join("\r\n")

    const filename = getExportFilename("csv")
    downloadCsv(csvContent, filename)
    toast({
      title: "ส่งออกสำเร็จ",
      description: `บันทึกไฟล์ ${filename} เรียบร้อยแล้ว`,
    })
  }

  const handleExportXlsx = async () => {
    if (payments.length === 0) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "ไม่มีรายการให้ส่งออก โปรดปรับตัวกรองหรือบันทึกรายการก่อน",
        variant: "destructive",
      })
      return
    }

    try {
      const XLSX = await import("xlsx")
      const rows = buildPaymentRows()
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: paymentExportColumns.map((column) => column.header) })
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payments")
      const filename = getExportFilename("xlsx")
      XLSX.writeFile(workbook, filename)
      toast({
        title: "ส่งออกสำเร็จ",
        description: `บันทึกไฟล์ ${filename} เรียบร้อยแล้ว`,
      })
    } catch (error: any) {
      console.error("[Payments] XLSX export error:", error)
      toast({
        title: "ไม่สามารถส่งออกได้",
        description: error?.message || "เกิดข้อผิดพลาดระหว่างการสร้างไฟล์ XLSX",
        variant: "destructive",
      })
    }
  }

  const handleExportPdf = async () => {
    if (payments.length === 0) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "ไม่มีรายการให้ส่งออก โปรดปรับตัวกรองหรือบันทึกรายการก่อน",
        variant: "destructive",
      })
      return
    }

    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ])
      const [regularFont, boldFont] = await Promise.all([
        getSarabunFontBase64("normal"),
        getSarabunFontBase64("bold"),
      ])
      const doc = new jsPDF({ orientation: pdfOrientation })
      doc.addFileToVFS(SARABUN_FONT_SOURCES.normal.filename, regularFont)
      doc.addFont(SARABUN_FONT_SOURCES.normal.filename, "Sarabun", "normal")
      doc.addFileToVFS(SARABUN_FONT_SOURCES.bold.filename, boldFont)
      doc.addFont(SARABUN_FONT_SOURCES.bold.filename, "Sarabun", "bold")
      doc.setFont("Sarabun", "bold")
      doc.setFontSize(16)
      doc.text("รายงานการชำระเงิน", 14, 18)
      doc.setFont("Sarabun", "normal")
      doc.setFontSize(10)
      const reportGeneratedAt = formatDate(new Date(), settings.dateFormat, settings.yearType)
      doc.text(`วันที่ออกรายงาน: ${reportGeneratedAt}`, 14, 26)
      doc.text(
        `จำนวนรายการทั้งหมด: ${stats.total.toLocaleString()} | ยอดรวม: ${formatCurrency(stats.totalAmount)}`,
        14,
        32,
      )
      doc.text(
        `กระทบยอดแล้ว: ${reconciliationSummary.reconciledCount.toLocaleString()} รายการ (${formatCurrency(reconciliationSummary.reconciledAmount)})`,
        14,
        38,
      )
      doc.text(
        `ยังไม่กระทบยอด: ${reconciliationSummary.unreconciledCount.toLocaleString()} รายการ (${formatCurrency(reconciliationSummary.unreconciledAmount)})`,
        14,
        44,
      )

      const rows = buildPaymentRows()
      const tableRows = rows.map((row) =>
        paymentExportColumns.map((column) => {
          const value = row[column.header]
          if (typeof value === "number") {
            return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
          return value
        }),
      )
      const autoTableOptions = buildAutoTableOptions({
        columns: paymentExportColumns.map((column) => column.header),
        rows: tableRows,
        columnStyles: paymentColumnStyles,
      })
      autoTableOptions.startY = pdfOrientation === "portrait" ? 62 : 52
      autoTableOptions.styles = { ...autoTableOptions.styles, font: "Sarabun", fontSize: 9 } as any
      autoTableOptions.headStyles = { ...autoTableOptions.headStyles, fontStyle: "bold" } as any

      const autoTableFn =
        typeof autoTableModule === "function"
          ? autoTableModule
          : typeof autoTableModule.default === "function"
            ? autoTableModule.default
            : null
      const autoTableApi =
        typeof (doc as any).autoTable === "function" ? (doc as any).autoTable.bind(doc) : null

      const runAutoTable = autoTableFn
        ? () => autoTableFn(doc, autoTableOptions)
        : autoTableApi
          ? () => autoTableApi(autoTableOptions)
          : null

      if (!runAutoTable) {
        throw new Error("jspdf-autotable is not available")
      }

      runAutoTable()
      const filename = getExportFilename("pdf")
      doc.save(filename)
      toast({
        title: "ส่งออกสำเร็จ",
        description: `บันทึกไฟล์ ${filename} เรียบร้อยแล้ว`,
      })
    } catch (error: any) {
      console.error("[Payments] PDF export error:", error)
      toast({
        title: "ไม่สามารถส่งออกได้",
        description: error?.message || "เกิดข้อผิดพลาดระหว่างการสร้างไฟล์ PDF",
        variant: "destructive",
      })
    }
  }

  const handleToggleReconciliation = async (payment: Payment) => {
    setUpdatingReconcileId(payment.id)
    try {
      const supabase = createClient()
      const now = new Date()
      const today = now.toISOString().split("T")[0]
      if (payment.reconciled) {
        const { error } = await supabase
          .from("payments")
          .update({
            reconciled: false,
            reconciliation_date: null,
            reconciled_by: null,
            reconciled_at: null,
          })
          .eq("id", payment.id)
        if (error) throw error
        toast({
          title: "ยกเลิกการกระทบยอดแล้ว",
          description: `ยกเลิกสำหรับเลขที่อ้างอิง ${payment.reference_number || payment.id}`,
        })
      } else {
        const { error } = await supabase
          .from("payments")
          .update({
            reconciled: true,
            reconciliation_date: today,
            reconciled_by: currentUser?.id || null,
            reconciled_at: now.toISOString(),
          })
          .eq("id", payment.id)
        if (error) throw error
        toast({
          title: "กระทบยอดแล้ว",
          description: `ทำรายการเรียบร้อยสำหรับเลขที่อ้างอิง ${payment.reference_number || payment.id}`,
        })
      }
      await logAudit(
        {
          action: payment.reconciled ? "payment_unreconciled" : "payment_reconciled",
          entity_type: "payment",
          entity_id: payment.id,
          new_values: payment.reconciled
            ? null
            : {
              reconciled: true,
              reconciliation_date: today,
            },
        },
        selectedProjectId || null,
      )
      loadData()
    } catch (error: any) {
      console.error("[Payments] Reconcile toggle error:", error)
      toast({
        title: "ไม่สามารถอัปเดตได้",
        description: error.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะการกระทบยอด",
        variant: "destructive",
      })
    } finally {
      setUpdatingReconcileId(null)
    }
  }

  const openReconcileDialog = (payment: Payment) => {
    setSelectedReconcile(payment)
    setReconcileNotes(payment.reconciliation_notes || "")
    setReconcileAssignee(payment.reconciliation_assignee || "")
    setReconcileStatus(payment.reconciliation_status || (payment.reconciled ? "done" : "pending"))
  }

  const handleSaveReconciliationDetails = async (statusOverride?: "done" | "needs_review" | "pending") => {
    if (!selectedReconcile) return
    try {
      const response = await fetch(`/api/payments/${selectedReconcile.id}/reconcile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reconciled: selectedReconcile.reconciled,
          reconciliation_notes: reconcileNotes.trim() || null,
          reconciliation_assignee: reconcileAssignee.trim() || null,
          reconciliation_status: statusOverride ?? reconcileStatus,
          reconciled_by: currentUser?.id,
          reconciliation_updated_by: currentUser?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("ไม่สามารถบันทึกข้อมูลได้")
      }

      toast({ title: "บันทึกสำเร็จ", description: "อัปเดตรายละเอียดการกระทบยอดแล้ว" })
      const { payment } = await response.json()
      setSelectedReconcile(null)
      setPayments((prev) => prev.map((item) => (item.id === payment.id ? payment : item)))
      loadData()
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error?.message || "ไม่สามารถบันทึกได้", variant: "destructive" })
    }
  }

  const unpaidBills = bills.filter((b) => b.status !== "paid")

  const filteredPayments = payments.filter((payment) => {
    const unitNumber = getUnitNumber(payment.unit_id)
    const referenceNumber = payment.reference_number?.toLowerCase() || ""
    const matchesSearch = (
      unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referenceNumber.includes(searchTerm.toLowerCase())
    )
    const matchesMethod = paymentMethodFilter === "all" ? true : payment.payment_method === paymentMethodFilter
    const isReconciled = !!payment.reconciled
    const matchesReconciled =
      reconciledFilter === "all"
        ? true
        : reconciledFilter === "reconciled"
          ? isReconciled
          : !isReconciled
    const minAmountValue = Number.parseFloat(minAmount || "0")
    const maxAmountValue = Number.parseFloat(maxAmount || "0")
    const matchesMin = minAmount.trim()
      ? payment.amount >= (Number.isNaN(minAmountValue) ? 0 : minAmountValue)
      : true
    const matchesMax = maxAmount.trim()
      ? payment.amount <= (Number.isNaN(maxAmountValue) ? Number.POSITIVE_INFINITY : maxAmountValue)
      : true
    return matchesSearch && matchesMethod && matchesReconciled && matchesMin && matchesMax
  })

  const paymentMethodOrder: Payment["payment_method"][] = ["cash", "transfer", "check", "credit_card"]

  const methodSummaries = paymentMethodOrder.map((method) => {
    const methodPayments = filteredPayments.filter((payment) => payment.payment_method === method)
    return {
      method,
      label: getPaymentMethodLabel(method),
      count: methodPayments.length,
      amount: methodPayments.reduce((sum, payment) => sum + payment.amount, 0),
    }
  })

  const reconciledPayments = filteredPayments.filter((payment) => payment.reconciled)
  const unreconciledPayments = filteredPayments.filter((payment) => !payment.reconciled)
  const filteredTotalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)

  const reconciliationSummary = {
    reconciledCount: reconciledPayments.length,
    reconciledAmount: reconciledPayments.reduce((sum, payment) => sum + payment.amount, 0),
    unreconciledCount: unreconciledPayments.length,
    unreconciledAmount: unreconciledPayments.reduce((sum, payment) => sum + payment.amount, 0),
  }

  const handleOpenDialog = async () => {
    const today = new Date().toISOString().split("T")[0]

    const supabase = createClient()
    const { data: lastPayment } = await supabase
      .from("payments")
      .select("reference_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let newReceiptNum = "RC-001"
    if (lastPayment?.reference_number) {
      const lastNum = Number.parseInt(lastPayment.reference_number.split("-")[1]) || 0
      newReceiptNum = `RC-${String(lastNum + 1).padStart(3, "0")}`
    }

    setFormData({
      billId: "",
      amount: "",
      paymentMethod: "cash",
      paymentDate: today,
      referenceNumber: newReceiptNum,
      notes: "",
      vatPercent: "0",
      whtPercent: "0",
      requiresApproval: false,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    // Validation
    if (!formData.billId || !formData.amount || !formData.paymentDate || !formData.referenceNumber) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    const bill = bills.find((b) => b.id === formData.billId)
    if (!bill) return

    // Period lock enforcement
    const paymentMonth = formData.paymentDate?.slice(0, 7)
    if (lockedMonth && paymentMonth === lockedMonth) {
      toast({
        title: "งวดบัญชีถูกล็อก",
        description: `ไม่สามารถบันทึกการชำระเงินในงวด ${lockedMonth} ได้`,
        variant: "destructive",
      })
      return
    }

    // Insert payment using Server Action (handles GL integration)
    console.log('[Payments] Creating payment with project_id:', bill.project_id || selectedProjectId)

    const paymentData = {
      amount: Number.parseFloat(formData.amount),
      payment_method: formData.paymentMethod,
      payment_date: formData.paymentDate,
      reference_number: formData.referenceNumber,
      notes: buildNotesWithTaxesAndApproval(formData),
      unit_id: bill.unit_id,
    }

    try {
      await savePayment(paymentData, formData.billId, bill.project_id || selectedProjectId || null);
    } catch (paymentError: any) {
      console.error("[v0] Payment error:", paymentError)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกการชำระเงินได้: ${paymentError.message}`,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "บันทึกสำเร็จ",
      description: "บันทึกการชำระเงินเรียบร้อยแล้ว",
    })

    // Audit logs
    await logAudit({
      action: 'payment_created',
      entity_type: 'payment',
      entity_id: formData.billId,
      new_values: { amount: Number.parseFloat(formData.amount), method: formData.paymentMethod, reference: formData.referenceNumber, date: formData.paymentDate }
    }, bill.project_id || selectedProjectId || null)

    await logAudit({
      action: 'bill_marked_paid',
      entity_type: 'bill',
      entity_id: formData.billId,
    }, bill.project_id || selectedProjectId || null)

    if (formData.requiresApproval) {
      await logAudit({ action: 'approval_requested', entity_type: 'payment', entity_id: formData.billId }, bill.project_id || selectedProjectId || null)
    }

    loadData()
    setIsDialogOpen(false)
  }

  const buildNotesWithTaxesAndApproval = (fd: typeof formData) => {
    const base = fd.notes?.trim() || ''
    const vat = Number.parseFloat(fd.vatPercent || '0')
    const wht = Number.parseFloat(fd.whtPercent || '0')
    const flags: string[] = []
    if (vat > 0) flags.push(`VAT ${vat}%`)
    if (wht > 0) flags.push(`WHT ${wht}%`)
    if (fd.requiresApproval) flags.push('status: pending_approval')
    return [base, flags.join(' | ')].filter(Boolean).join(' \n') || null
  }

  const stats = {
    total: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payments.filter((p) => {
      const paymentDate = new Date(p.payment_date)
      const now = new Date()
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
    }).length,
    thisMonthAmount: payments
      .filter((p) => {
        const paymentDate = new Date(p.payment_date)
        const now = new Date()
        return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, p) => sum + p.amount, 0),
  }

  // Auto-open dialog when arriving with billId in URL and prefill form
  useEffect(() => {
    const billIdParam = searchParams.get('billId')
    if (!billIdParam) return
    if (!bills || bills.length === 0) return
    const bill = bills.find((b) => b.id === billIdParam)
    if (!bill) return

      ; (async () => {
        const today = new Date().toISOString().split("T")[0]
        const supabase = createClient()
        const { data: lastPayment } = await supabase
          .from("payments")
          .select("reference_number")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        let newReceiptNum = "RC-001"
        if (lastPayment?.reference_number) {
          const lastNum = Number.parseInt(lastPayment.reference_number.split("-")[1]) || 0
          newReceiptNum = `RC-${String(lastNum + 1).padStart(3, "0")}`
        }

        setFormData({
          billId: bill.id,
          amount: String(bill.total || 0),
          paymentMethod: "cash",
          paymentDate: today,
          referenceNumber: newReceiptNum,
          notes: "",
          vatPercent: "0",
          whtPercent: "0",
          requiresApproval: false,
        })
        setIsDialogOpen(true)
      })()
  }, [searchParams, bills])

  return (
    <div>
      <PageHeader
        title="การชำระเงิน"
        subtitle="บันทึกและจัดการการชำระเงินของลูกบ้าน"
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={togglePeriodLock} variant={lockedMonth ? "destructive" : "outline"} size="sm">
              {lockedMonth ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
              {lockedMonth ? `ปลดล็อกงวด (${lockedMonth})` : "ล็อกงวดบัญชี (เดือนนี้)"}
            </Button>
            <Button
              onClick={() => window.location.href = '/payments/transactions'}
              variant="outline"
              size="sm"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              รายการชำระเงิน
            </Button>
            <Button
              onClick={() => window.location.href = '/payments/bank-reconciliation'}
              variant="outline"
              size="sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Bank Reconciliation
            </Button>
            <Button
              onClick={handleExportCsv}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              ส่งออก CSV
            </Button>
            <Button
              onClick={handleExportXlsx}
              variant="outline"
              size="sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              ส่งออก XLSX
            </Button>
            <Button
              onClick={handleExportPdf}
              variant="outline"
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              ส่งออก PDF
            </Button>
            <Button
              onClick={() => setIsScheduleDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              ตั้งค่ารายงานอัตโนมัติ
            </Button>
            <Select value={pdfOrientation} onValueChange={(value) => setPdfOrientation(value as "portrait" | "landscape")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="แนวนอน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">แนวนอน (Landscape)</SelectItem>
                <SelectItem value="portrait">แนวตั้ง (Portrait)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleOpenDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              บันทึกการชำระเงิน
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">การชำระทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">ยอดรวมทั้งหมด</p>
          <p className="text-2xl font-bold text-green-600 mt-1">฿{stats.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">การชำระเดือนนี้</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.thisMonth}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">ยอดเดือนนี้</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">฿{stats.thisMonthAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">สรุปตามวิธีชำระ (ตามตัวกรอง)</h3>
              <p className="text-sm text-gray-500">ยอดรวม: {formatCurrency(filteredTotalAmount)}</p>
            </div>
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
              {filteredPayments.length} รายการ
            </Badge>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {methodSummaries.map((summary) => (
              <div key={summary.method} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="p-2 rounded-md bg-white border border-gray-200">
                      {getPaymentMethodIcon(summary.method)}
                    </div>
                    <span className="font-medium text-gray-700">{summary.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{summary.count} รายการ</span>
                </div>
                <p className="text-xl font-semibold text-gray-900 mt-3">{formatCurrency(summary.amount)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900">สถานะการกระทบยอด (ตามตัวกรอง)</h3>
          <p className="text-sm text-gray-500">ช่วยให้เห็นยอดที่ต้องติดตามต่อ</p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">กระทบยอดแล้ว</p>
              <p className="text-2xl font-bold text-emerald-900 mt-2">{reconciliationSummary.reconciledCount} รายการ</p>
              <p className="text-sm text-emerald-700 mt-1">{formatCurrency(reconciliationSummary.reconciledAmount)}</p>
            </div>
            <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-700">ยังไม่กระทบยอด</p>
              <p className="text-2xl font-bold text-amber-900 mt-2">{reconciliationSummary.unreconciledCount} รายการ</p>
              <p className="text-sm text-amber-700 mt-1">{formatCurrency(reconciliationSummary.unreconciledAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unpaid Bills Alert */}
      {unpaidBills.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-900">มีบิลที่ยังไม่ได้ชำระ</h3>
              <p className="text-sm text-yellow-700 mt-1">
                มีบิลที่ยังไม่ได้ชำระทั้งหมด {unpaidBills.length} รายการ กรุณาบันทึกการชำระเงิน
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="ค้นหาห้องชุดหรือเลขที่อ้างอิง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateStart">ตั้งแต่วันที่</Label>
            <Input
              id="dateStart"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dateEnd">ถึงวันที่</Label>
            <Input
              id="dateEnd"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="paymentMethodFilter">วิธีชำระ</Label>
            <Select
              value={paymentMethodFilter}
              onValueChange={(value: "all" | Payment["payment_method"]) => setPaymentMethodFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="cash">เงินสด</SelectItem>
                <SelectItem value="transfer">โอนเงิน</SelectItem>
                <SelectItem value="check">เช็ค</SelectItem>
                <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reconciledFilter">สถานะการกระทบยอด</Label>
            <Select
              value={reconciledFilter}
              onValueChange={(value: "all" | "reconciled" | "unreconciled") => setReconciledFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="reconciled">กระทบยอดแล้ว</SelectItem>
                <SelectItem value="unreconciled">ยังไม่กระทบยอด</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="minAmount">ยอดขั้นต่ำ</Label>
              <Input
                id="minAmount"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="maxAmount">ยอดสูงสุด</Label>
              <Input
                id="maxAmount"
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input
            id="includeLegacy"
            type="checkbox"
            checked={includeLegacy}
            onChange={(e) => setIncludeLegacy(e.target.checked)}
          />
          <Label htmlFor="includeLegacy" className="cursor-pointer">รวมข้อมูลเก่า (ไม่มีโครงการ)</Label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เลขที่อ้างอิง</TableHead>
              <TableHead>ใบแจ้งหนี้</TableHead>
              <TableHead>เลขห้อง</TableHead>
              <TableHead>จำนวนเงิน</TableHead>
              <TableHead>วิธีชำระ</TableHead>
              <TableHead>วันที่ชำระ</TableHead>
              <TableHead>หมายเหตุ</TableHead>
              <TableHead>กระทบยอด</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">ดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => {
              const bill = getBillDetails(payment.bill_id)
              return (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-gray-400" />
                      {payment.reference_number || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{bill?.bill_number || "-"}</span>
                      <span className="text-xs text-gray-500">{bill?.month ? `งวด ${bill.month}` : ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getUnitNumber(payment.unit_id)}</TableCell>
                  <TableCell className="font-bold text-green-600">฿{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.payment_method)}
                      <span>{getPaymentMethodLabel(payment.payment_method)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(payment.payment_date, settings.dateFormat, settings.yearType)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{payment.notes || "-"}</TableCell>
                  <TableCell>
                    {payment.reconciliation_status === "needs_review" ? (
                      <Badge className="bg-amber-100 text-amber-700" title={payment.reconciliation_notes || undefined}>
                        ⚠️ ต้องตรวจสอบ
                      </Badge>
                    ) : payment.reconciled ? (
                      <Badge className="bg-emerald-100 text-emerald-700" title={payment.reconciliation_notes || undefined}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        กระทบยอดแล้ว
                        {payment.reconciliation_date
                          ? ` (${formatDate(payment.reconciliation_date as string, settings.dateFormat, settings.yearType)})`
                          : ""}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-700 border-gray-300 bg-gray-50" title={payment.reconciliation_notes || undefined}>
                        ยังไม่กระทบยอด
                      </Badge>
                    )}
                    {payment.reconciliation_assignee && (
                      <p className="text-xs text-gray-500 mt-1">ผู้รับผิดชอบ: {payment.reconciliation_assignee}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      ชำระแล้ว
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="inline-flex items-center gap-2"
                      onClick={() => openReconcileDialog(payment)}
                    >
                      <FileText className="w-4 h-4" />
                      รายละเอียด
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`inline-flex items-center gap-2 border ${payment.reconciled
                          ? "border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          : "border-sky-600 text-sky-700 hover:bg-sky-50"
                        }`}
                      onClick={() => handleToggleReconciliation(payment)}
                      disabled={updatingReconcileId === payment.id}
                    >
                      {updatingReconcileId === payment.id ? (
                        "กำลังอัปเดต..."
                      ) : payment.reconciled ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          ยกเลิก
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          กระทบยอด
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>บันทึกการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="billId">เลือกบิลที่ต้องการชำระ *</Label>
              <Select
                value={formData.billId}
                onValueChange={(value) => {
                  const bill = bills.find((b) => b.id === value)
                  setFormData({
                    ...formData,
                    billId: value,
                    amount: bill?.total.toString() || "",
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบิล" />
                </SelectTrigger>
                <SelectContent>
                  {unpaidBills.map((bill) => (
                    <SelectItem key={bill.id} value={bill.id}>
                      {getUnitNumber(bill.unit_id)} - {bill.month} (฿{(bill.total || 0).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unpaidBills.length === 0 && <p className="text-sm text-gray-500 mt-1">ไม่มีบิลที่รอชำระ</p>}
            </div>
            <div>
              <Label htmlFor="amount">จำนวนเงิน *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">วิธีชำระ *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: Payment["payment_method"]) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">เงินสด</SelectItem>
                  <SelectItem value="transfer">โอนเงิน</SelectItem>
                  <SelectItem value="check">เช็ค</SelectItem>
                  <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentDate">วันที่ชำระ *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="referenceNumber">เลขที่อ้างอิง *</Label>
              <Input
                id="referenceNumber"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="RC-001"
              />
            </div>
            <div>
              <Label htmlFor="vatPercent">VAT (%)</Label>
              <Input
                id="vatPercent"
                type="number"
                value={formData.vatPercent}
                onChange={(e) => setFormData({ ...formData, vatPercent: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="whtPercent">WHT (%)</Label>
              <Input
                id="whtPercent"
                type="number"
                value={formData.whtPercent}
                onChange={(e) => setFormData({ ...formData, whtPercent: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                id="requiresApproval"
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
              />
              <Label htmlFor="requiresApproval" className="cursor-pointer flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> ส่งอนุมัติ (Workflow)
              </Label>
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                rows={3}
              />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ยอดที่ต้องชำระ:</span>
              <span className="text-2xl font-bold text-green-600">
                ฿{Number.parseFloat(formData.amount || "0").toLocaleString()}
              </span>
            </div>
            {(Number(formData.vatPercent) > 0 || Number(formData.whtPercent) > 0) && (
              <div className="mt-2 text-xs text-gray-600">
                ภาษี: VAT {formData.vatPercent || 0}% | WHT {formData.whtPercent || 0}% (บันทึกในหมายเหตุ)
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              บันทึกการชำระเงิน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ตั้งค่ารายงานการชำระเงินอัตโนมัติ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {scheduleLoading ? (
              <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="scheduleRecipients">อีเมลผู้รับ (คั่นด้วยเครื่องหมายคอมมา)</Label>
                  <Textarea
                    id="scheduleRecipients"
                    rows={3}
                    value={scheduleForm.recipients}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, recipients: e.target.value }))}
                    placeholder="accounting@condo.com, manager@condo.com"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleFormat">รูปแบบไฟล์</Label>
                    <Select
                      value={scheduleForm.sendFormat}
                      onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, sendFormat: value as "csv" | "xlsx" }))}
                    >
                      <SelectTrigger id="scheduleFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xlsx">XLSX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">เวลาที่ต้องการส่ง (HH:MM)</Label>
                    <Input
                      id="scheduleTime"
                      type="time"
                      value={scheduleForm.runTime}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, runTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTimezone">โซนเวลา</Label>
                    <Input
                      id="scheduleTimezone"
                      value={scheduleForm.timezone}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, timezone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={scheduleForm.includeLegacy}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, includeLegacy: e.target.checked }))}
                      />
                      <span>รวมข้อมูลเก่า (ไม่มีโครงการ)</span>
                    </Label>
                    <Label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={scheduleForm.active}
                        onChange={(e) => setScheduleForm((prev) => ({ ...prev, active: e.target.checked }))}
                      />
                      <span>เปิดใช้งานกำหนดการ</span>
                    </Label>
                  </div>
                </div>
                {scheduleForm.lastRunAt && (
                  <p className="text-xs text-gray-500">
                    ส่งล่าสุดเมื่อ {new Date(scheduleForm.lastRunAt).toLocaleString("th-TH")}
                  </p>
                )}
              </>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                ปิด
              </Button>
              <Button onClick={handleSaveSchedule} className="bg-blue-600 hover:bg-blue-700" disabled={scheduleLoading}>
                บันทึกกำหนดการ
              </Button>
            </div>
            <div className="flex gap-2">
              {scheduleForm.scheduleId && (
                <Button variant="outline" onClick={handleDeleteSchedule} disabled={scheduleLoading}>
                  ลบกำหนดการ
                </Button>
              )}
              <Button onClick={handleSendScheduleNow} disabled={!scheduleForm.recipients || scheduleLoading}>
                ส่งรายงานตอนนี้
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconciliation Details Dialog */}
      <Dialog
        open={!!selectedReconcile}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReconcile(null)
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>จัดการรายละเอียดการกระทบยอด</DialogTitle>
            {selectedReconcile && (
              <p className="text-sm text-gray-500">
                เลขที่อ้างอิง: <strong>{selectedReconcile.reference_number || selectedReconcile.id}</strong>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reconcileStatus">สถานะ</Label>
                <Select
                  value={reconcileStatus}
                  onValueChange={(value: "done" | "needs_review" | "pending") => setReconcileStatus(value)}
                >
                  <SelectTrigger id="reconcileStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="done">เสร็จสิ้น</SelectItem>
                    <SelectItem value="needs_review">รอตรวจสอบ</SelectItem>
                    <SelectItem value="pending">อยู่ระหว่างดำเนินการ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reconcileAssignee">ผู้รับผิดชอบ</Label>
                <Input
                  id="reconcileAssignee"
                  value={reconcileAssignee}
                  onChange={(e) => setReconcileAssignee(e.target.value)}
                  placeholder="อีเมลหรือชื่อผู้ดูแล"
                />
                <p className="text-xs text-gray-500 mt-1">ระบุชื่อ/อีเมล (ไม่บังคับ)</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reconcileNotes">หมายเหตุ</Label>
              <Textarea
                id="reconcileNotes"
                rows={4}
                value={reconcileNotes}
                onChange={(e) => setReconcileNotes(e.target.value)}
                placeholder="บันทึกเพิ่มเติมเกี่ยวกับการตรวจสอบหรือข้อสังเกต"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setSelectedReconcile(null)}>
              ยกเลิก
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSaveReconciliationDetails("needs_review")}
                className="border-amber-500 text-amber-600"
              >
                ทำเครื่องหมายว่าต้องตรวจสอบ
              </Button>
              <Button onClick={() => handleSaveReconciliationDetails()} className="bg-blue-600 hover:bg-blue-700">
                บันทึก
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
