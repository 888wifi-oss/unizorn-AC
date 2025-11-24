"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Search, Download, CheckCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/lib/settings-context"
import { formatDate } from "@/lib/date-formatter"
import {
  getApInvoices,
  getVendorsFromDB,
  getExpenseAccountsFromDB,
  saveApInvoice,
  deleteApInvoice,
  payApInvoice,
} from "@/lib/supabase/actions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface Vendor {
  id: string
  name: string
}

interface ExpenseAccount {
  account_code: string
  account_name: string
}

interface APInvoice {
  id: string
  vendor_id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  amount: number
  status: "unpaid" | "paid"
  notes?: string
  vendors?: { name: string }
  payment_date?: string
}

export default function AccountsPayablePage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [invoices, setInvoices] = useState<APInvoice[]>([])
  const [allInvoices, setAllInvoices] = useState<APInvoice[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [expenseAccounts, setExpenseAccounts] = useState<ExpenseAccount[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<APInvoice | null>(null)
  const [invoiceToPay, setInvoiceToPay] = useState<APInvoice | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { settings } = useSettings()

  const [formData, setFormData] = useState({
    vendorId: "",
    invoiceNumber: "",
    amount: "",
    invoiceDate: "",
    dueDate: "",
    notes: "",
  })

  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    expenseAccountCode: "",
  })

  useEffect(() => {
    console.log('[AccountsPayable] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadInitialData()
  }, [selectedProjectId])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [invoicesData, vendorsData, expenseAccountsData] = await Promise.all([
        getApInvoices(),
        getVendorsFromDB(),
        getExpenseAccountsFromDB(),
      ])
      setAllInvoices(invoicesData)
      console.log('[AccountsPayable] Total invoices from DB:', invoicesData.length)
      
      // Filter by selected project (for non-Super Admin)
      let filtered = invoicesData
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        filtered = invoicesData.filter((invoice: any) => invoice.project_id === selectedProjectId)
        console.log('[AccountsPayable] Filtered invoices:', invoicesData.length, '→', filtered.length)
      } else {
        console.log('[AccountsPayable] No filtering (Super Admin)')
      }
      
      setInvoices(filtered)
      setVendors(vendorsData)
      setExpenseAccounts(expenseAccountsData)
    } catch (error) {
      console.error("[AP] Error loading initial data:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลเริ่มต้นได้", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.vendors && invoice.vendors.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleOpenDialog = (invoice?: APInvoice) => {
    if (invoice) {
      setEditingInvoice(invoice)
      setFormData({
        vendorId: invoice.vendor_id,
        invoiceNumber: invoice.invoice_number,
        amount: String(invoice.amount),
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        notes: invoice.notes || "",
      })
    } else {
      setEditingInvoice(null)
      setFormData({
        vendorId: "",
        invoiceNumber: "",
        amount: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        notes: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    // --- VALIDATION ---
    if (!formData.vendorId || !formData.invoiceNumber || !formData.amount || !formData.invoiceDate || !formData.dueDate) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่มีเครื่องหมาย * ทั้งหมด",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "จำนวนเงินไม่ถูกต้อง",
        description: "กรุณากรอกจำนวนเงินเป็นตัวเลขที่มากกว่า 0",
        variant: "destructive",
      })
      return
    }

    // --- CLIENT-SIDE DUPLICATE CHECK (NEW) ---
    if (!editingInvoice) {
      const isDuplicate = invoices.some(
        (inv) => inv.vendor_id === formData.vendorId && inv.invoice_number === formData.invoiceNumber
      )
      if (isDuplicate) {
        toast({
          title: "ข้อมูลซ้ำกัน",
          description: "เลขที่ใบแจ้งหนี้สำหรับผู้ขายรายนี้มีอยู่แล้วในระบบ",
          variant: "destructive",
        })
        return // Stop execution before calling server
      }
    }

    // --- SAVE DATA ---
    setLoading(true)
    try {
      console.log('[AccountsPayable] Saving invoice with project_id:', selectedProjectId)
      const invoiceData = {
        id: editingInvoice?.id || null,
        vendor_id: formData.vendorId,
        invoice_number: formData.invoiceNumber,
        invoice_date: formData.invoiceDate,
        due_date: formData.dueDate,
        amount: amount,
        status: editingInvoice?.status || "unpaid",
        notes: formData.notes || null,
        project_id: selectedProjectId || null,  // ✅ เพิ่ม project_id
      }
      await saveApInvoice(invoiceData)
      await loadInitialData()
      setIsDialogOpen(false)
      toast({ title: "สำเร็จ", description: "บันทึกข้อมูลใบแจ้งหนี้เรียบร้อยแล้ว" })
    } catch (error: any) {
      console.error("[AP] Error saving invoice:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบใบแจ้งหนี้ฉบับนี้ใช่หรือไม่?")) return
    setLoading(true)
    try {
      await deleteApInvoice(id)
      await loadInitialData()
      toast({ title: "สำเร็จ", description: "ลบข้อมูลใบแจ้งหนี้เรียบร้อยแล้ว" })
    } catch (error) {
      console.error("[AP] Error deleting invoice:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบข้อมูลได้", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPayDialog = (invoice: APInvoice) => {
    setInvoiceToPay(invoice)
    setPaymentData({
      paymentDate: new Date().toISOString().split("T")[0],
      expenseAccountCode: "",
    })
    setIsPayDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!invoiceToPay || !paymentData.paymentDate || !paymentData.expenseAccountCode) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาเลือกวันที่ชำระและบัญชีค่าใช้จ่าย", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      await payApInvoice(invoiceToPay.id, paymentData.paymentDate, paymentData.expenseAccountCode)
      await loadInitialData()
      setIsPayDialogOpen(false)
      toast({
        title: "สำเร็จ",
        description: `บันทึกการชำระเงินสำหรับใบแจ้งหนี้ #${invoiceToPay.invoice_number} เรียบร้อยแล้ว`,
      })
    } catch (error) {
      console.error("[AP] Error paying invoice:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกการชำระเงินได้", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date().toISOString().split("T")[0]
    if (status === "paid") {
      return <Badge className="bg-green-100 text-green-700">ชำระแล้ว</Badge>
    }
    if (dueDate < today) {
      return <Badge className="bg-red-100 text-red-700">เกินกำหนด</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-700">ยังไม่ชำระ</Badge>
  }

  return (
    <div>
      <PageHeader
        title="เจ้าหนี้การค้า (AP)"
        subtitle="บันทึกและติดตามใบแจ้งหนี้จากผู้ขาย"
        action={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            บันทึกใบแจ้งหนี้
          </Button>
        }
      />

      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ค้นหาเลขที่ใบแจ้งหนี้ หรือชื่อผู้ขาย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ผู้ขาย</TableHead>
              <TableHead>เลขที่ใบแจ้งหนี้</TableHead>
              <TableHead>วันที่เอกสาร</TableHead>
              <TableHead>วันครบกำหนด</TableHead>
              <TableHead className="text-right">จำนวนเงิน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  กำลังโหลดข้อมูล...
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.vendors?.name || "N/A"}</TableCell>
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>{formatDate(invoice.invoice_date, settings.dateFormat, settings.yearType)}</TableCell>
                  <TableCell>{formatDate(invoice.due_date, settings.dateFormat, settings.yearType)}</TableCell>
                  <TableCell className="text-right font-semibold">฿{invoice.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status, invoice.due_date)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.status === "unpaid" && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenPayDialog(invoice)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          จ่ายเงิน
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(invoice)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id)}>
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

      {/* Dialog for Add/Edit Invoice */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "แก้ไขใบแจ้งหนี้" : "บันทึกใบแจ้งหนี้ใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="vendorId">ผู้ขาย *</Label>
              <Select value={formData.vendorId} onValueChange={(value) => setFormData({ ...formData, vendorId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้ขาย" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invoiceNumber">เลขที่ใบแจ้งหนี้ *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="amount">จำนวนเงิน *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="invoiceDate">วันที่เอกสาร *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">วันครบกำหนดชำระ *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Payment */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div>
            <p>
              คุณกำลังจะชำระเงินสำหรับใบแจ้งหนี้ <strong>#{invoiceToPay?.invoice_number}</strong>
            </p>
            <p>
              ผู้ขาย: <strong>{invoiceToPay?.vendors?.name}</strong>
            </p>
            <p className="text-xl font-bold">
              ยอดชำระ: <strong>฿{invoiceToPay?.amount ? invoiceToPay.amount.toLocaleString() : '0'}</strong>
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="paymentDate">วันที่ชำระ *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expenseAccountCode">บันทึกเป็นค่าใช้จ่าย *</Label>
                <Select
                  value={paymentData.expenseAccountCode}
                  onValueChange={(value) => setPaymentData({ ...paymentData, expenseAccountCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบัญชีค่าใช้จ่าย" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseAccounts.map((acc) => (
                      <SelectItem key={acc.account_code} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleConfirmPayment} disabled={loading}>
              {loading ? "กำลังบันทึก..." : "ยืนยันการชำระเงิน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

