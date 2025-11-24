"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Download, TrendingDown, DollarSign, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { getExpensesFromDB, saveExpenseToDB } from "@/lib/supabase/actions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface ExpenseJournal {
  id: string
  journal_date: string
  account_code: string
  vendor?: string
  description: string
  amount: number
  reference_number?: string
  created_at: string
  project_id?: string
  status?: 'pending' | 'approved' | 'rejected'
}

interface ChartOfAccount {
  account_code: string
  account_name: string
}

export default function ExpensesPage() {
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()
  const [expenses, setExpenses] = useState<ExpenseJournal[]>([])
  const [allExpenses, setAllExpenses] = useState<ExpenseJournal[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(new Date().toISOString().slice(0, 7))
  const { toast } = useToast()
  const { settings } = useSettings()

  const [formData, setFormData] = useState({
    journalDate: new Date().toISOString().split("T")[0],
    accountCode: "",
    vendor: "",
    description: "",
    amount: "",
    referenceNumber: "",
  })

  const [summary, setSummary] = useState({
    totalExpense: 0,
    expenseCount: 0,
    avgExpense: 0,
  })

  useEffect(() => {
    console.log('[Expenses] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadInitialData()
  }, [selectedProjectId])

  useEffect(() => {
    loadExpenses()
  }, [selectedPeriod, selectedProjectId])

  const loadInitialData = async () => {
    setIsLoading(true)
    const supabase = createClient()
    try {
      const { data: accountsData } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name")
        .like("account_code", "5%")
        .eq("is_active", true)
        .order("account_code")
      if (accountsData) setAccounts(accountsData)
      await loadExpenses()
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลเริ่มต้นได้", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const loadExpenses = async () => {
    setIsLoading(true)
    try {
      const data = await getExpensesFromDB(selectedPeriod, selectedProjectId)
      setAllExpenses(data)
      console.log('[Expenses] Total expenses from DB:', data.length)

      // Filter by selected project (for non-Super Admin)
      let filtered = data
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        filtered = data.filter((expense: any) => expense.project_id === selectedProjectId)
        console.log('[Expenses] Filtered expenses:', data.length, '→', filtered.length)
      } else {
        console.log('[Expenses] No filtering (Super Admin)')
      }

      setExpenses(filtered)
      calculateSummary(filtered)
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลรายจ่ายได้", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSummary = (data: ExpenseJournal[]) => {
    const total = data.reduce((sum, item) => sum + Number(item.amount), 0)
    setSummary({
      totalExpense: total,
      expenseCount: data.length,
      avgExpense: data.length > 0 ? total / data.length : 0,
    })
  }

  const handleSave = async () => {
    if (!formData.journalDate || !formData.accountCode || !formData.description || !formData.amount) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบถ้วน", variant: "destructive" })
      return
    }

    try {
      console.log('[Expenses] Saving expense with project_id:', selectedProjectId)
      await saveExpenseToDB({
        journal_date: formData.journalDate,
        account_code: formData.accountCode,
        vendor: formData.vendor || null,
        description: formData.description,
        project_id: selectedProjectId || null,
        amount: Number(formData.amount),
        reference_number: formData.referenceNumber || null,
      })
      toast({ title: "บันทึกสำเร็จ", description: "บันทึกรายจ่ายเรียบร้อยแล้ว" })
      setIsDialogOpen(false)
      resetForm()
      loadExpenses()
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกรายจ่ายได้", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setFormData({
      journalDate: new Date().toISOString().split("T")[0],
      accountCode: "",
      vendor: "",
      description: "",
      amount: "",
      referenceNumber: "",
    })
  }

  const getAccountName = (code: string) => accounts.find((a) => a.account_code === code)?.account_name || code

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="บันทึกรายจ่าย" description="บันทึกและจัดการค่าใช้จ่ายต่างๆ ของนิติบุคคล" />
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายจ่ายรวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">฿{summary.totalExpense.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">ประจำเดือน {selectedPeriod}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">จำนวนรายการ</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.expenseCount}</div>
              <p className="text-xs text-muted-foreground">รายการบันทึก</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายจ่ายเฉลี่ย</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{summary.avgExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground">ต่อรายการ</p>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Label>เลือกเดือน:</Label>
            <Input type="month" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="w-40" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> ส่งออก CSV</Button>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> บันทึกรายจ่าย</Button>
          </div>
        </div>
        <Card>
          <CardHeader><CardTitle>รายการบันทึกรายจ่าย</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>รหัสบัญชี</TableHead>
                  <TableHead>ชื่อบัญชี</TableHead>
                  <TableHead>จ่ายให้/ผู้ขาย</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center">กำลังโหลด...</TableCell></TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center">ไม่มีรายการ</TableCell></TableRow>
                ) : (
                  expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>{formatDate(exp.journal_date, settings)}</TableCell>
                      <TableCell className="font-mono">{exp.account_code}</TableCell>
                      <TableCell>{getAccountName(exp.account_code)}</TableCell>
                      <TableCell>{exp.vendor || "-"}</TableCell>
                      <TableCell>{exp.description}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${exp.status === 'approved' ? 'bg-green-100 text-green-800' :
                            exp.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                          {exp.status === 'approved' ? 'อนุมัติแล้ว' :
                            exp.status === 'rejected' ? 'ปฏิเสธ' : 'รออนุมัติ'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">฿{exp.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>บันทึกรายจ่าย</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="journalDate">วันที่ <span className="text-destructive">*</span></Label>
                <Input id="journalDate" type="date" value={formData.journalDate} onChange={(e) => setFormData({ ...formData, journalDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountCode">รหัสบัญชีรายจ่าย <span className="text-destructive">*</span></Label>
                <Select value={formData.accountCode} onValueChange={(value) => setFormData({ ...formData, accountCode: value })}>
                  <SelectTrigger><SelectValue placeholder="เลือกบัญชีรายจ่าย" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.account_code} value={acc.account_code}>{acc.account_code} - {acc.account_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">จ่ายให้/ผู้ขาย</Label>
                <Input id="vendor" placeholder="เช่น บริษัท รักษาความสะอาด จำกัด" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">จำนวนเงิน <span className="text-destructive">*</span></Label>
                <Input id="amount" type="number" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด <span className="text-destructive">*</span></Label>
              <Textarea id="description" placeholder="ระบุรายละเอียดรายจ่าย" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">เลขที่อ้างอิง</Label>
              <Input id="referenceNumber" placeholder="เลขที่ใบแจ้งหนี้/ใบกำกับภาษี" value={formData.referenceNumber} onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
