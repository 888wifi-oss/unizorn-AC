"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { createClient } from "@/lib/supabase/client"

interface ExpenseApproval {
  id: string
  expense_id: string
  amount: number
  description: string
  requester: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string
  approver?: string
}

export default function ExpenseApprovalPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [expenses, setExpenses] = useState<ExpenseApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseApproval | null>(null)

  useEffect(() => {
    console.log('[ExpenseApproval] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadExpenses()
  }, [selectedProjectId])

  const loadExpenses = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      console.log('[ExpenseApproval] Loading expenses with project_id:', selectedProjectId)

      // Query from expense_journal with project filtering
      let query = supabase
        .from('expense_journal')
        .select(`
          id,
          journal_date,
          account_code,
          description,
          amount,
          reference_number,
          created_at,
          status,
          approved_at,
          approver,
          chart_of_accounts(account_name)
        `)
        .order('journal_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (selectedProjectId && currentUser.role !== 'super_admin') {
        query = query.eq('project_id', selectedProjectId)
      }

      const { data: expenseData, error } = await query

      if (error) throw error

      // Transform to ExpenseApproval format
      const expensesData: ExpenseApproval[] = (expenseData || []).map((item: any, index: number) => ({
        id: item.id,
        expense_id: `EXP${String(index + 1).padStart(3, '0')}`,
        amount: item.amount,
        description: item.description,
        requester: item.created_by || 'System',
        status: (item.status as 'pending' | 'approved' | 'rejected') || 'pending',
        created_at: item.created_at || item.journal_date,
        approved_at: item.approved_at,
        approver: item.approver
      }))

      setExpenses(expensesData)
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('expense_journal')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approver: currentUser.name || 'Admin'
        })
        .eq('id', id)

      if (error) throw error

      setExpenses(prev => prev.map(expense =>
        expense.id === id
          ? { ...expense, status: 'approved' as const, approved_at: new Date().toISOString(), approver: currentUser.name || 'Admin' }
          : expense
      ))

      toast({
        title: "อนุมัติสำเร็จ",
        description: "อนุมัติรายจ่ายเรียบร้อยแล้ว",
      })
    } catch (error) {
      console.error('Error approving expense:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอนุมัติได้",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('expense_journal')
        .update({
          status: 'rejected',
          approver: currentUser.name || 'Admin'
        })
        .eq('id', id)

      if (error) throw error

      setExpenses(prev => prev.map(expense =>
        expense.id === id
          ? { ...expense, status: 'rejected' as const }
          : expense
      ))

      toast({
        title: "ปฏิเสธสำเร็จ",
        description: "ปฏิเสธรายจ่ายเรียบร้อยแล้ว",
      })
    } catch (error) {
      console.error('Error rejecting expense:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถปฏิเสธได้",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />รออนุมัติ</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />อนุมัติแล้ว</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><AlertCircle className="w-3 h-3 mr-1" />ปฏิเสธ</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="อนุมัติรายจ่าย"
        subtitle="จัดการการอนุมัติรายจ่ายต่างๆ"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการรออนุมัติ</CardTitle>
              <CardDescription>รายการรายจ่ายที่รอการอนุมัติ</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                ค้นหา
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                กรอง
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสรายจ่าย</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>ผู้ขออนุมัติ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead>การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.expense_id}</TableCell>
                  <TableCell>฿{expense.amount.toLocaleString()}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.requester}</TableCell>
                  <TableCell>{getStatusBadge(expense.status)}</TableCell>
                  <TableCell>{new Date(expense.created_at).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedExpense(expense)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {expense.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(expense.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(expense.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รายละเอียดรายจ่าย</DialogTitle>
            <DialogDescription>
              รหัส: {selectedExpense?.expense_id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">จำนวนเงิน</Label>
              <div className="col-span-3 font-medium">฿{selectedExpense?.amount.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">รายละเอียด</Label>
              <div className="col-span-3">{selectedExpense?.description}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">ผู้ขออนุมัติ</Label>
              <div className="col-span-3">{selectedExpense?.requester}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">สถานะ</Label>
              <div className="col-span-3">{selectedExpense && getStatusBadge(selectedExpense.status)}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">วันที่สร้าง</Label>
              <div className="col-span-3">
                {selectedExpense?.created_at && new Date(selectedExpense.created_at).toLocaleDateString('th-TH')}
              </div>
            </div>
            {selectedExpense?.approved_at && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">อนุมัติเมื่อ</Label>
                <div className="col-span-3">
                  {new Date(selectedExpense.approved_at).toLocaleDateString('th-TH')} โดย {selectedExpense.approver}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
