"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { Plus, Pencil, Trash2, QrCode, Building2, CreditCard, Wallet } from "lucide-react"

interface PaymentMethod {
  id: string
  project_id?: string
  method_type: string
  method_name: string
  account_number?: string
  account_name?: string
  bank_name?: string
  bank_branch?: string
  qr_code_config?: any
  gateway_config?: any
  is_active: boolean
  is_default: boolean
  display_order: number
}

export default function PaymentMethodsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState({
    method_type: "promptpay",
    method_name: "",
    account_number: "",
    account_name: "",
    bank_name: "",
    bank_branch: "",
    phone_number: "",
    tax_id: "",
    ewallet_id: "",
    is_active: true,
    is_default: false,
    display_order: 0,
  })

  useEffect(() => {
    loadPaymentMethods()
  }, [selectedProjectId])

  const loadPaymentMethods = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('payment_methods')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (selectedProjectId && currentUser.role !== 'super_admin') {
        query = query.eq('project_id', selectedProjectId)
      }

      const { data, error } = await query

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error: any) {
      console.error('[Payment Methods] Error loading:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method)
      setFormData({
        method_type: method.method_type,
        method_name: method.method_name,
        account_number: method.account_number || "",
        account_name: method.account_name || "",
        bank_name: method.bank_name || "",
        bank_branch: method.bank_branch || "",
        phone_number: method.qr_code_config?.phone || "",
        tax_id: method.qr_code_config?.tax_id || "",
        ewallet_id: method.qr_code_config?.ewallet_id || "",
        is_active: method.is_active,
        is_default: method.is_default,
        display_order: method.display_order || 0,
      })
    } else {
      setEditingMethod(null)
      setFormData({
        method_type: "promptpay",
        method_name: "",
        account_number: "",
        account_name: "",
        bank_name: "",
        bank_branch: "",
        phone_number: "",
        tax_id: "",
        ewallet_id: "",
        is_active: true,
        is_default: false,
        display_order: 0,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.method_name.trim()) {
      toast({
        title: "กรุณากรอกชื่อ",
        description: "กรุณากรอกชื่อวิธีการชำระเงิน",
        variant: "destructive",
      })
      return
    }

    try {
      const qrCodeConfig: any = {}
      if (formData.method_type === 'promptpay') {
        if (formData.phone_number) qrCodeConfig.phone = formData.phone_number
        if (formData.tax_id) qrCodeConfig.tax_id = formData.tax_id
        if (formData.ewallet_id) qrCodeConfig.ewallet_id = formData.ewallet_id
      }

      const methodData: any = {
        project_id: selectedProjectId || null,
        method_type: formData.method_type,
        method_name: formData.method_name,
        account_number: formData.account_number || null,
        account_name: formData.account_name || null,
        bank_name: formData.bank_name || null,
        bank_branch: formData.bank_branch || null,
        qr_code_config: Object.keys(qrCodeConfig).length > 0 ? qrCodeConfig : null,
        is_active: formData.is_active,
        is_default: formData.is_default,
        display_order: formData.display_order,
      }

      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(methodData)
          .eq('id', editingMethod.id)

        if (error) throw error

        toast({
          title: "อัพเดทสำเร็จ",
          description: "อัพเดทวิธีการชำระเงินเรียบร้อยแล้ว",
        })
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([methodData])

        if (error) throw error

        toast({
          title: "สร้างสำเร็จ",
          description: "สร้างวิธีการชำระเงินเรียบร้อยแล้ว",
        })
      }

      setIsDialogOpen(false)
      loadPaymentMethods()
    } catch (error: any) {
      console.error('[Payment Methods] Error saving:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกได้",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบวิธีการชำระเงินนี้?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "ลบสำเร็จ",
        description: "ลบวิธีการชำระเงินเรียบร้อยแล้ว",
      })

      loadPaymentMethods()
    } catch (error: any) {
      console.error('[Payment Methods] Error deleting:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบได้",
        variant: "destructive",
      })
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'promptpay':
        return <QrCode className="w-5 h-5" />
      case 'bank_transfer':
        return <Building2 className="w-5 h-5" />
      case 'payment_gateway':
        return <CreditCard className="w-5 h-5" />
      default:
        return <Wallet className="w-5 h-5" />
    }
  }

  const getMethodTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      promptpay: 'PromptPay',
      bank_transfer: 'โอนเงินผ่านธนาคาร',
      payment_gateway: 'Payment Gateway',
      cash: 'เงินสด',
      cheque: 'เช็ค',
    }
    return labels[type] || type
  }

  return (
    <div>
      <PageHeader
        title="วิธีการชำระเงิน"
        subtitle="จัดการวิธีการชำระเงิน (PromptPay, ธนาคาร, Payment Gateway)"
        action={
          <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มวิธีการชำระเงิน
          </Button>
        }
      />

      <div className="bg-white rounded-lg border border-gray-200 mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ประเภท</TableHead>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ข้อมูลบัญชี</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>ค่าเริ่มต้น</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : paymentMethods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              paymentMethods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMethodIcon(method.method_type)}
                      <span>{getMethodTypeLabel(method.method_type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{method.method_name}</TableCell>
                  <TableCell>
                    {method.method_type === 'promptpay' && (
                      <div className="text-sm">
                        {method.qr_code_config?.phone && <div>📱 {method.qr_code_config.phone}</div>}
                        {method.qr_code_config?.tax_id && <div>🆔 {method.qr_code_config.tax_id}</div>}
                      </div>
                    )}
                    {method.method_type === 'bank_transfer' && (
                      <div className="text-sm">
                        {method.bank_name && <div>🏦 {method.bank_name}</div>}
                        {method.account_number && <div>เลขบัญชี: {method.account_number}</div>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {method.is_active ? (
                      <Badge className="bg-green-100 text-green-700">ใช้งาน</Badge>
                    ) : (
                      <Badge variant="secondary">ปิดใช้งาน</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {method.is_default ? (
                      <Badge className="bg-blue-100 text-blue-700">ค่าเริ่มต้น</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(method)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(method.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'แก้ไขวิธีการชำระเงิน' : 'เพิ่มวิธีการชำระเงิน'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>ประเภท *</Label>
              <Select value={formData.method_type} onValueChange={(value) => setFormData({ ...formData, method_type: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promptpay">PromptPay</SelectItem>
                  <SelectItem value="bank_transfer">โอนเงินผ่านธนาคาร</SelectItem>
                  <SelectItem value="payment_gateway">Payment Gateway</SelectItem>
                  <SelectItem value="cash">เงินสด</SelectItem>
                  <SelectItem value="cheque">เช็ค</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>ชื่อวิธีการชำระเงิน *</Label>
              <Input
                value={formData.method_name}
                onChange={(e) => setFormData({ ...formData, method_name: e.target.value })}
                placeholder="เช่น PromptPay - บริษัท ABC"
                className="mt-2"
              />
            </div>

            {formData.method_type === 'promptpay' && (
              <>
                <div>
                  <Label>หมายเลขโทรศัพท์ (PromptPay)</Label>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="0812345678"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">ระบุอย่างน้อย 1 รายการ (โทรศัพท์, เลขประจำตัวผู้เสียภาษี, หรือ e-Wallet)</p>
                </div>
                <div>
                  <Label>เลขประจำตัวผู้เสียภาษี</Label>
                  <Input
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="1234567890123"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>e-Wallet ID</Label>
                  <Input
                    value={formData.ewallet_id}
                    onChange={(e) => setFormData({ ...formData, ewallet_id: e.target.value })}
                    placeholder="E-Wallet ID"
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {formData.method_type === 'bank_transfer' && (
              <>
                <div>
                  <Label>ชื่อธนาคาร *</Label>
                  <Select value={formData.bank_name} onValueChange={(value) => setFormData({ ...formData, bank_name: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="เลือกธนาคาร" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KBANK">กสิกรไทย (KBANK)</SelectItem>
                      <SelectItem value="SCB">ไทยพาณิชย์ (SCB)</SelectItem>
                      <SelectItem value="BBL">กรุงเทพ (BBL)</SelectItem>
                      <SelectItem value="BAY">กรุงไทย (BAY)</SelectItem>
                      <SelectItem value="TMB">ทีเอ็มบี (TMB)</SelectItem>
                      <SelectItem value="CIMB">ซีไอเอ็มบี (CIMB)</SelectItem>
                      <SelectItem value="GSB">ออมสิน (GSB)</SelectItem>
                      <SelectItem value="KTB">กรุงไทย (KTB)</SelectItem>
                      <SelectItem value="TISCO">ทิสโก้ (TISCO)</SelectItem>
                      <SelectItem value="other">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>เลขบัญชี *</Label>
                  <Input
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="1234567890"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>ชื่อบัญชี *</Label>
                  <Input
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    placeholder="ชื่อบัญชี"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>สาขา</Label>
                  <Input
                    value={formData.bank_branch}
                    onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                    placeholder="สาขาธนาคาร"
                    className="mt-2"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <Label>เปิดใช้งาน</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>ตั้งเป็นค่าเริ่มต้น</Label>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>

            <div>
              <Label>ลำดับการแสดงผล</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editingMethod ? 'อัพเดท' : 'สร้าง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

