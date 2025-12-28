"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, Search, Calendar, Download, Printer, Send, FileStack, CheckSquare, Square, MoreHorizontal, BarChart3 } from "lucide-react"
import { getUnitsFromDB, getBillsFromDB, saveBillToDB, deleteBillFromDB, createBatchBills } from "@/lib/supabase/actions"
import { generateBillPDFV4, PDFLanguage } from "@/lib/pdf-generator-v4"
import { exportObjectsToCSV } from "@/lib/csv-exporter"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/lib/settings-context"
import { formatDate, formatMonthYear } from "@/lib/date-formatter"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { getAccountCodeMapping, BILLING_ACCOUNT_CODES } from "@/lib/utils/billing-accounts"
import { BatchBillingDialog } from "./batch-billing-dialog"
import { BulkOperationsDialog } from "./bulk-operations-dialog"
import { TableSkeleton } from "@/components/skeleton-loader"

export default function BillingPage() {
  const { settings } = useSettings()
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()
  const [bills, setBills] = useState<any[]>([])
  const [allBills, setAllBills] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [allUnits, setAllUnits] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [isBulkOperationsDialogOpen, setIsBulkOperationsDialogOpen] = useState(false)
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set())
  const [batchMonth, setBatchMonth] = useState(new Date().toISOString().slice(0, 7))
  const [editingBill, setEditingBill] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [pdfLanguage, setPdfLanguage] = useState<PDFLanguage>("en")
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    unitId: "",
    month: "",
    commonFee: "",
    waterFee: "",
    electricityFee: "",
    parkingFee: "",
    otherFee: "",
    dueDate: "",
  })

  useEffect(() => {
    console.log('[Billing] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedProjectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [billsData, unitsResult] = await Promise.all([getBillsFromDB(), getUnitsFromDB()])

      // Store all data
      setAllBills(billsData)
      console.log('[Billing] Total bills from DB:', billsData.length)

      if (unitsResult.success) {
        setAllUnits(unitsResult.units || [])
        console.log('[Billing] Total units from DB:', unitsResult.units?.length || 0)
      }

      // Filter by selected project (for non-Super Admin)
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        const filteredBills = billsData.filter((bill: any) => bill.project_id === selectedProjectId)
        const filteredUnits = (unitsResult.units || []).filter((unit: any) => unit.project_id === selectedProjectId)

        console.log('[Billing] Filtered bills:', billsData.length, '→', filteredBills.length)
        console.log('[Billing] Filtered units:', unitsResult.units?.length || 0, '→', filteredUnits.length)

        setBills(filteredBills)
        setUnits(filteredUnits)
      } else {
        console.log('[Billing] No filtering (Super Admin)')
        setBills(billsData)
        setUnits(unitsResult.units || [])
      }
    } catch (error: any) {
      console.error("[Billing] Error loading data:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (bill?: any) => {
    if (bill) {
      setEditingBill(bill)
      setFormData({
        unitId: bill.unit_id,
        month: bill.month,
        commonFee: String(bill.common_fee || 0),
        waterFee: String(bill.water_fee || 0),
        electricityFee: String(bill.electricity_fee || 0),
        parkingFee: String(bill.parking_fee || 0),
        otherFee: String(bill.other_fee || 0),
        dueDate: bill.due_date,
      })
    } else {
      setEditingBill(null)
      const today = new Date()
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
      setFormData({
        unitId: "",
        month: currentMonth,
        commonFee: "",
        waterFee: "0",
        electricityFee: "0",
        parkingFee: "0",
        otherFee: "0",
        dueDate: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const unit = units.find((u) => u.id === formData.unitId)
    if (!unit) return

    setLoading(true)
    try {
      const commonFee = Number.parseFloat(formData.commonFee) || 0
      const waterFee = Number.parseFloat(formData.waterFee) || 0
      const electricityFee = Number.parseFloat(formData.electricityFee) || 0
      const parkingFee = Number.parseFloat(formData.parkingFee) || 0
      const otherFee = Number.parseFloat(formData.otherFee) || 0
      const total = commonFee + waterFee + electricityFee + parkingFee + otherFee

      const bill = {
        id: editingBill?.id || "new",
        unit_id: formData.unitId,
        month: formData.month,
        common_fee: commonFee,
        water_fee: waterFee,
        electricity_fee: electricityFee,
        parking_fee: parkingFee,
        other_fee: otherFee,
        total,
        status: editingBill?.status || "pending",
        due_date: formData.dueDate,
        project_id: unit.project_id || selectedProjectId || null  // ✅ เพิ่ม project_id
      }

      console.log('[Billing] Saving bill with project_id:', bill.project_id)
      await saveBillToDB(bill)
      await loadData()
      setIsDialogOpen(false)
      toast({
        title: "สำเร็จ",
        description: "บันทึกบิลเรียบร้อยแล้ว",
      })
    } catch (error) {
      console.error("[v0] Error saving bill:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกบิลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบบิลนี้ใช่หรือไม่?")) return

    setLoading(true)
    try {
      await deleteBillFromDB(id)
      await loadData()
      toast({
        title: "สำเร็จ",
        description: "ลบบิลเรียบร้อยแล้ว",
      })
    } catch (error) {
      console.error("[v0] Error deleting bill:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบบิลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrintBill = async (bill: any) => {
    const unit = units.find((u) => u.id === bill.unit_id)
    // Use property names that match PDF generator expectations
    const billData = {
      bill_number: bill.bill_number || bill.billNumber || 'N/A',
      month: bill.month,
      due_date: bill.due_date || bill.dueDate,
      common_fee: Number(bill.common_fee || bill.commonFee || 0),
      water_fee: Number(bill.water_fee || bill.waterFee || 0),
      electricity_fee: Number(bill.electricity_fee || bill.electricityFee || 0),
      parking_fee: Number(bill.parking_fee || bill.parkingFee || 0),
      other_fee: Number(bill.other_fee || bill.otherFee || 0),
      total: Number(bill.total || 0),
    }

    // Determine language: Unit preference has priority, fallback to page selector
    const language = unit?.preferred_language || pdfLanguage;
    console.log(`[Billing] Generating PDF for unit ${unit?.unit_number}. Language: ${language} (Preferred: ${unit?.preferred_language}, Page: ${pdfLanguage})`);

    await generateBillPDFV4(billData, unit, settings, language)
    toast({
      title: "สำเร็จ",
      description: "เปิดหน้าต่างพิมพ์บิลแล้ว",
    })
  }

  const handleSendBill = (bill: any) => {
    toast({
      title: "กำลังส่งบิล",
      description: `กำลังส่งบิลไปยังห้อง ${bill.unitNumber}`,
    })
    // In real implementation, this would send email/SMS
  }

  // Memoized export handler
  const handleExport = useCallback(() => {
    const exportData = bills.map((bill) => ({
      เลขห้อง: bill.unitNumber,
      เดือน: formatMonthYear(bill.month, settings.yearType),
      ค่าส่วนกลาง: bill.common_fee,
      ค่าน้ำ: bill.water_fee,
      ค่าไฟ: bill.electricity_fee,
      ค่าจอดรถ: bill.parking_fee,
      อื่นๆ: bill.other_fee,
      รวม: bill.total,
      กำหนดชำระ: formatDate(bill.due_date, settings.dateFormat, settings.yearType),
      สถานะ: bill.status,
    }))
    exportObjectsToCSV(exportData, "bills.csv")
    toast({
      title: "สำเร็จ",
      description: "ส่งออกข้อมูลเรียบร้อยแล้ว",
    })
  }, [bills, settings, toast])

  // Memoized status badge function
  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, any> = {
      pending: { label: "รอชำระ", className: "bg-yellow-100 text-yellow-700" },
      paid: { label: "ชำระแล้ว", className: "bg-green-100 text-green-700" },
      overdue: { label: "เกินกำหนด", className: "bg-red-100 text-red-700" },
    }
    const variant = variants[status]
    return <Badge className={variant.className}>{variant.label}</Badge>
  }, [])

  // Memoized stats calculation
  const stats = useMemo(() => ({
    total: bills.length,
    pending: bills.filter((b) => b.status === "pending").length,
    paid: bills.filter((b) => b.status === "paid").length,
    overdue: bills.filter((b) => b.status === "overdue").length,
    totalAmount: bills.reduce((sum, b) => sum + b.total, 0),
    paidAmount: bills.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.total, 0),
  }), [bills])

  // Memoized filtered bills
  const filteredBills = useMemo(() => {
    if (!searchTerm) return bills
    return bills.filter((bill) =>
      bill.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.bill_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [bills, searchTerm])

  return (
    <div>
      <PageHeader
        title="ออกบิล"
        subtitle="จัดการบิลค่าส่วนกลางและค่าใช้จ่ายอื่นๆ"
        action={
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex gap-2">
              <Select value={pdfLanguage} onValueChange={(value: PDFLanguage) => setPdfLanguage(value)}>
                <SelectTrigger className="w-24 md:w-32">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="th">ไทย</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700" size="sm">
                <Plus className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">สร้างบิลใหม่</span>
                <span className="md:hidden">ใหม่</span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsBatchDialogOpen(true)} variant="outline" size="sm">
                <FileStack className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">สร้างบิลรายเดือน</span>
                <span className="md:hidden">รายเดือน</span>
              </Button>
              {selectedBillIds.size > 0 && (
                <Button
                  onClick={() => setIsBulkOperationsDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <MoreHorizontal className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">จัดการหลายรายการ ({selectedBillIds.size})</span>
                  <span className="md:hidden">({selectedBillIds.size})</span>
                </Button>
              )}
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">ส่งออก</span>
                <span className="md:hidden">Export</span>
              </Button>
              <Button
                onClick={() => window.location.href = '/billing/reports'}
                variant="outline"
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">รายงานและวิเคราะห์</span>
                <span className="md:hidden">รายงาน</span>
              </Button>
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">บิลทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">รอชำระ</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">ชำระแล้ว</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.paid}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">เกินกำหนด</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90">ยอดรวมทั้งหมด</p>
          <p className="text-3xl font-bold mt-2">฿{stats.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90">ยอดที่ชำระแล้ว</p>
          <p className="text-3xl font-bold mt-2">฿{stats.paidAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="ค้นหาห้องชุดหรือเดือน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedBillIds.size === filteredBills.length && filteredBills.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedBillIds(new Set(filteredBills.map(b => b.id)))
                    } else {
                      setSelectedBillIds(new Set())
                    }
                  }}
                />
              </TableHead>
              <TableHead>เลขห้อง</TableHead>
              <TableHead>เดือน</TableHead>
              <TableHead>ค่าส่วนกลาง</TableHead>
              <TableHead>ค่าน้ำ</TableHead>
              <TableHead>ค่าไฟ</TableHead>
              <TableHead>ค่าจอดรถ</TableHead>
              <TableHead>อื่นๆ</TableHead>
              <TableHead>รวม</TableHead>
              <TableHead>กำหนดชำระ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="p-0">
                  <TableSkeleton rows={8} />
                </TableCell>
              </TableRow>
            ) : filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedBillIds.has(bill.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedBillIds)
                        if (checked) {
                          newSelected.add(bill.id)
                        } else {
                          newSelected.delete(bill.id)
                        }
                        setSelectedBillIds(newSelected)
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{bill.unitNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(bill.month, settings.dateFormat, settings.yearType, {
                        year: "numeric",
                        month: "short",
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>฿{(bill.common_fee || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{BILLING_ACCOUNT_CODES.COMMON_FEE}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>฿{(bill.water_fee || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{BILLING_ACCOUNT_CODES.WATER_FEE}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>฿{(bill.electricity_fee || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{BILLING_ACCOUNT_CODES.ELECTRICITY_FEE}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>฿{(bill.parking_fee || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{BILLING_ACCOUNT_CODES.PARKING_FEE}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>฿{(bill.other_fee || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{BILLING_ACCOUNT_CODES.OTHER_FEE}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">฿{(bill.total || 0).toLocaleString()}</TableCell>
                  <TableCell>{formatDate(bill.due_date, settings.dateFormat, settings.yearType)}</TableCell>
                  <TableCell>{getStatusBadge(bill.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.href = `/payments?billId=${bill.id}`
                          }
                        }}
                        title="ชำระ"
                      >
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrintBill(bill)} title="พิมพ์บิล">
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleSendBill(bill)} title="ส่งบิล">
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(bill)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(bill.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBill ? "แก้ไขบิล" : "สร้างบิลใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="unitId">เลือกห้องชุด *</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) => {
                  const unit = units.find((u) => u.id === value)
                  if (unit) {
                    const calculatedCommonFee = (unit.size || 0) * (settings.commonFeeRate || 0)
                    setFormData({
                      ...formData,
                      unitId: value,
                      commonFee: String(calculatedCommonFee),
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกห้องชุด" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_number} - {unit.owner_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">เดือน *</Label>
              <Input
                id="month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="commonFee">
                ค่าส่วนกลาง *
                <span className="text-xs text-gray-500 ml-2">({BILLING_ACCOUNT_CODES.COMMON_FEE})</span>
              </Label>
              <Input
                id="commonFee"
                type="number"
                value={formData.commonFee}
                onChange={(e) => setFormData({ ...formData, commonFee: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="waterFee">
                ค่าน้ำ
                <span className="text-xs text-gray-500 ml-2">({BILLING_ACCOUNT_CODES.WATER_FEE})</span>
              </Label>
              <Input
                id="waterFee"
                type="number"
                value={formData.waterFee}
                onChange={(e) => setFormData({ ...formData, waterFee: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="electricityFee">
                ค่าไฟ
                <span className="text-xs text-gray-500 ml-2">({BILLING_ACCOUNT_CODES.ELECTRICITY_FEE})</span>
              </Label>
              <Input
                id="electricityFee"
                type="number"
                value={formData.electricityFee}
                onChange={(e) => setFormData({ ...formData, electricityFee: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="parkingFee">
                ค่าจอดรถ
                <span className="text-xs text-gray-500 ml-2">({BILLING_ACCOUNT_CODES.PARKING_FEE})</span>
              </Label>
              <Input
                id="parkingFee"
                type="number"
                value={formData.parkingFee}
                onChange={(e) => setFormData({ ...formData, parkingFee: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="otherFee">
                ค่าใช้จ่ายอื่นๆ
                <span className="text-xs text-gray-500 ml-2">({BILLING_ACCOUNT_CODES.OTHER_FEE})</span>
              </Label>
              <Input
                id="otherFee"
                type="number"
                value={formData.otherFee}
                onChange={(e) => setFormData({ ...formData, otherFee: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">กำหนดชำระ *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ยอดรวมทั้งหมด:</span>
              <span className="text-2xl font-bold text-blue-600">
                ฿
                {(
                  (Number.parseFloat(formData.commonFee) || 0) +
                  (Number.parseFloat(formData.waterFee) || 0) +
                  (Number.parseFloat(formData.electricityFee) || 0) +
                  (Number.parseFloat(formData.parkingFee) || 0) +
                  (Number.parseFloat(formData.otherFee) || 0)
                ).toLocaleString()}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Batch Create Dialog */}
      <BatchBillingDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
        month={batchMonth}
        onSuccess={async () => {
          await loadData()
          setBatchMonth(new Date().toISOString().slice(0, 7))
        }}
      />

      {/* Bulk Operations Dialog */}
      <BulkOperationsDialog
        open={isBulkOperationsDialogOpen}
        onOpenChange={setIsBulkOperationsDialogOpen}
        selectedBillIds={Array.from(selectedBillIds)}
        onSuccess={() => {
          loadData()
          setSelectedBillIds(new Set())
        }}
      />
    </div>
  )
}
