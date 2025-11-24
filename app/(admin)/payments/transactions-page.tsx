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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { formatDate } from "@/lib/date-formatter"
import { useCurrency } from "@/lib/currency-formatter"
import { useSettings } from "@/lib/settings-context"
import { Search, CheckCircle2, XCircle, Clock, Upload, Eye, AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { SlipUploadDialog } from "./slip-upload-dialog"
import { PaymentMethodsDialog } from "./payment-methods-dialog"

interface PaymentTransaction {
  id: string
  bill_id: string
  payment_method_id: string | null
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  transaction_type: string
  gateway_transaction_id: string | null
  reference_number: string | null
  notes: string | null
  paid_at: string | null
  created_at: string
  bills?: {
    bill_number: string
    month: string
    units?: {
      unit_number: string
      owner_name: string
    }
  }
  payment_methods?: {
    method_name: string
    method_type: string
  }
  payment_confirmations?: Array<{
    id: string
    confirmation_type: string
    confirmation_data: any
    confirmed_at: string
  }>
}

export default function PaymentTransactionsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const { settings } = useSettings()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isSlipUploadDialogOpen, setIsSlipUploadDialogOpen] = useState(false)
  const [isPaymentMethodsDialogOpen, setIsPaymentMethodsDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<{ id: string; amount: number } | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmNotes, setConfirmNotes] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    const ids = filteredTransactions.map((tx) => tx.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    setSelectedIds(allSelected ? [] : ids)
  }

  useEffect(() => {
    loadTransactions()
  }, [selectedProjectId, statusFilter])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      let query = supabase
        .from('payment_transactions')
        .select(`
          id,
          bill_id,
          payment_method_id,
          amount,
          currency,
          status,
          transaction_type,
          gateway_transaction_id,
          reference_number,
          notes,
          paid_at,
          created_at,
          project_id,
          bills!inner(
            id,
            bill_number,
            month,
            units!inner(unit_number, owner_name, project_id)
          ),
          payment_methods(method_name, method_type)
        `)
        .order('created_at', { ascending: false })
        .limit(100)
      
      // Always filter by selectedProjectId when provided to reduce payload
      if (selectedProjectId) {
        query = query.eq('project_id', selectedProjectId)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      const tMid = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('[perf][payments] transactions fetch:', {
        count: data?.length || 0,
        duration_ms: Math.round(tMid - tStart),
        filtered: Boolean(selectedProjectId)
      })

      if (error) throw error
      // Batch load confirmations to avoid N+1 queries
      const ids = (data || []).map((tx: any) => tx.id)
      let confirmationsMap: Record<string, any[]> = {}
      if (ids.length > 0) {
        const cStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const { data: confirmationRows } = await supabase
          .from('payment_confirmations')
          .select('id,payment_transaction_id,confirmation_type,confirmation_data,confirmed_at')
          .in('payment_transaction_id', ids)
          .order('confirmed_at', { ascending: false })
        const confirmationRowsSafe = Array.isArray(confirmationRows) ? confirmationRows : []
        confirmationRowsSafe.forEach((c: any) => {
          const key = c.payment_transaction_id
          if (!confirmationsMap[key]) confirmationsMap[key] = []
          confirmationsMap[key].push(c)
        })
        const cEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
        console.log('[perf][payments] confirmations fetch:', {
          count: Object.values(confirmationsMap).reduce((s, arr) => s + arr.length, 0),
          duration_ms: Math.round(cEnd - cStart)
        })
      }

      const transactionsWithConfirmations = (data || []).map((tx: any) => ({
        ...tx,
        payment_confirmations: confirmationsMap[tx.id] || []
      }))
      const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('[perf][payments] fetch sizes:', { 
        transactions: data?.length || 0, 
        confirmations: Object.values(confirmationsMap).reduce((s, arr) => s + arr.length, 0) 
      })
      console.log(`[perf][payments] transactions page total load: ${Math.round(tEnd - tStart)}ms`)

      setTransactions(transactionsWithConfirmations as PaymentTransaction[])
    } catch (error: any) {
      console.error('[Payment Transactions] Error loading:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async (confirmed: boolean) => {
    if (!selectedTransaction) return

    try {
      const response = await fetch('/api/v1/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          confirmed,
          notes: confirmNotes,
          userId: currentUser.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm payment')
      }

      toast({
        title: confirmed ? "ยืนยันสำเร็จ" : "ปฏิเสธสำเร็จ",
        description: data.message || "ดำเนินการเรียบร้อยแล้ว",
      })

      setIsConfirmDialogOpen(false)
      setConfirmNotes("")
      loadTransactions()
    } catch (error: any) {
      console.error('[Payment Transactions] Error confirming:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถยืนยันได้",
        variant: "destructive",
      })
    }
  }

  const handleBulkConfirm = async (confirmed: boolean) => {
    if (selectedIds.length === 0) return
    try {
      const results = await Promise.allSettled(
        selectedIds.map(async (id) => {
          const response = await fetch('/api/v1/payments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: id,
              confirmed,
              notes: confirmNotes,
              userId: currentUser.id,
            }),
          })
          if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            throw new Error(data.error || 'Failed to confirm payment')
          }
          return true
        })
      )
      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failCount = results.filter((r) => r.status === 'rejected').length
      toast({
        title: confirmed ? 'ยืนยันหลายรายการสำเร็จ' : 'ปฏิเสธหลายรายการสำเร็จ',
        description: `สำเร็จ ${successCount} / ล้มเหลว ${failCount}`,
      })
      setSelectedIds([])
      setConfirmNotes('')
      loadTransactions()
    } catch (error: any) {
      console.error('[Payment Transactions] Error bulk confirming:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถดำเนินการแบบกลุ่มได้',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, any> = {
      pending: <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />รอดำเนินการ</Badge>,
      processing: <Badge className="bg-blue-100 text-blue-700"><Clock className="w-3 h-3 mr-1" />กำลังตรวจสอบ</Badge>,
      completed: <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />สำเร็จ</Badge>,
      failed: <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />ล้มเหลว</Badge>,
      cancelled: <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />ยกเลิก</Badge>,
    }
    return badges[status] || <Badge variant="secondary">{status}</Badge>
  }

  const getMethodTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      promptpay: 'PromptPay',
      bank_transfer: 'โอนเงินผ่านธนาคาร',
      payment_gateway: 'ชำระออนไลน์',
      cash: 'เงินสด',
      cheque: 'เช็ค',
    }
    return labels[type] || type
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.bills?.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.bills?.units?.unit_number?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div>
      <PageHeader
        title="รายการชำระเงิน"
        subtitle="จัดการและตรวจสอบรายการชำระเงินทั้งหมด"
        action={
          <Button 
            onClick={() => {
              // Redirect to Payments page for recording a new payment
              // Future enhancement: open bill selector directly here
              if (typeof window !== 'undefined') {
                window.location.href = '/payments'
              }
            }} 
            className="bg-blue-600 hover:bg-blue-700" 
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            ชำระบิลใหม่
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="ค้นหาเลขที่อ้างอิง, เลขที่บิล, หรือเลขห้อง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="processing">กำลังตรวจสอบ</SelectItem>
                <SelectItem value="completed">สำเร็จ</SelectItem>
                <SelectItem value="failed">ล้มเหลว</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">
          เลือกแล้ว {selectedIds.length} รายการ
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedIds.length === 0}
            onClick={async () => {
              await handleBulkConfirm(false)
            }}
          >
            <XCircle className="w-4 h-4 mr-2" /> ปฏิเสธที่เลือก
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={selectedIds.length === 0}
            onClick={async () => {
              await handleBulkConfirm(true)
            }}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> ยืนยันที่เลือก
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={filteredTransactions.length > 0 && filteredTransactions.every((tx) => selectedIds.includes(tx.id))}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>เลขที่อ้างอิง</TableHead>
              <TableHead>บิล</TableHead>
              <TableHead>ห้องชุด</TableHead>
              <TableHead>วิธีการชำระ</TableHead>
              <TableHead className="text-right">จำนวนเงิน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(tx.id)}
                      onCheckedChange={() => toggleSelect(tx.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {tx.reference_number || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{tx.bills?.bill_number || '-'}</div>
                      <div className="text-gray-500">{tx.bills?.month || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tx.bills?.units?.unit_number || '-'}
                  </TableCell>
                  <TableCell>
                    {tx.payment_methods ? (
                      <span>{getMethodTypeLabel(tx.payment_methods.method_type)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tx.status)}
                  </TableCell>
                  <TableCell>
                    {formatDate(tx.created_at, settings.dateFormat, settings.yearType)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tx.status === 'pending' && tx.payment_methods?.method_type === 'bank_transfer' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTransaction(tx)
                            setIsSlipUploadDialogOpen(true)
                          }}
                          title="อัพโหลดสลิป"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      )}
                      {tx.status === 'processing' && currentUser.role !== 'resident' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTransaction(tx)
                            setIsConfirmDialogOpen(true)
                          }}
                          title="ยืนยันการชำระเงิน"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      {tx.payment_confirmations && tx.payment_confirmations.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // Show slip image
                            const slipUrl = tx.payment_confirmations[0]?.confirmation_data?.file_url
                            if (slipUrl) {
                              window.open(slipUrl, '_blank')
                            }
                          }}
                          title="ดูสลิป"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Slip Upload Dialog */}
      {selectedTransaction && (
        <SlipUploadDialog
          open={isSlipUploadDialogOpen}
          onOpenChange={setIsSlipUploadDialogOpen}
          transactionId={selectedTransaction.id}
          onSuccess={() => {
            loadTransactions()
            setIsSlipUploadDialogOpen(false)
            setSelectedTransaction(null)
          }}
        />
      )}

      {/* Confirm Payment Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTransaction && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">เลขที่อ้างอิง:</span>
                  <span className="font-medium">{selectedTransaction.reference_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวนเงิน:</span>
                  <span className="font-bold text-green-600">{formatCurrency(selectedTransaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">บิล:</span>
                  <span>{selectedTransaction.bills?.bill_number}</span>
                </div>
              </div>
            )}
            <div>
              <Label>หมายเหตุ (ถ้ามี)</Label>
              <Textarea
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม..."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirmPayment(false)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              ปฏิเสธ
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleConfirmPayment(true)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              ยืนยันการชำระเงิน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Methods Dialog (for creating new payment) */}
      {selectedBillForPayment && (
        <PaymentMethodsDialog
          open={isPaymentMethodsDialogOpen}
          onOpenChange={setIsPaymentMethodsDialogOpen}
          billId={selectedBillForPayment.id}
          amount={selectedBillForPayment.amount}
          onPaymentComplete={() => {
            loadTransactions()
            setIsPaymentMethodsDialogOpen(false)
            setSelectedBillForPayment(null)
          }}
        />
      )}
    </div>
  )
}
