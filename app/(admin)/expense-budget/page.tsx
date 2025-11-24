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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Target, TrendingDown, AlertCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { getExpenseBudgets, saveExpenseBudget, deleteExpenseBudget, getExpenseAccountsFromDB } from "@/lib/supabase/actions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface ExpenseAccount {
  account_code: string
  account_name: string
}

interface BudgetWithActual {
  id: string
  account_code: string
  account_name: string
  year: number
  month: number
  budget_amount: number
  actual_amount: number
  variance: number
  variance_percent: number
  notes?: string
}

export default function ExpenseBudgetPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [budgets, setBudgets] = useState<BudgetWithActual[]>([])
  const [allBudgets, setAllBudgets] = useState<BudgetWithActual[]>([])
  const [accounts, setAccounts] = useState<ExpenseAccount[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    accountCode: "",
    year: selectedYear,
    month: selectedMonth,
    budgetAmount: "",
    notes: "",
  })

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('th-TH', { month: 'long' })
  }))

  useEffect(() => {
    console.log('[ExpenseBudget] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedYear, selectedMonth, selectedProjectId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [accountsData, budgetsData] = await Promise.all([
        getExpenseAccountsFromDB(),
        getExpenseBudgets(selectedYear, selectedMonth, selectedProjectId)
      ])
      setAllBudgets(budgetsData)
      console.log('[ExpenseBudget] Total budgets from DB:', budgetsData.length)

      setAccounts(accountsData)
      setBudgets(budgetsData)
      calculateSummary(budgetsData)
    } catch (error) {
      console.error("[ExpenseBudget] Error loading data:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลได้", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalActual: 0,
    totalVariance: 0,
    achievementRate: 0,
  })

  const calculateSummary = (data: BudgetWithActual[]) => {
    const totalBudget = data.reduce((sum, item) => sum + Number(item.budget_amount), 0)
    const totalActual = data.reduce((sum, item) => sum + Number(item.actual_amount), 0)
    const totalVariance = totalBudget - totalActual
    const achievementRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
    setSummary({ totalBudget, totalActual, totalVariance, achievementRate })
  }

  const handleSave = async () => {
    if (!formData.accountCode || !formData.budgetAmount) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาเลือกบัญชีและกรอกงบประมาณ", variant: "destructive" })
      return
    }
    const amount = parseFloat(formData.budgetAmount)
    if (isNaN(amount) || amount < 0) {
      toast({ title: "จำนวนเงินไม่ถูกต้อง", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      console.log('[ExpenseBudget] Saving budget with project_id:', selectedProjectId)
      await saveExpenseBudget({
        id: editingId,
        account_code: formData.accountCode,
        year: formData.year,
        month: formData.month,
        budget_amount: amount,
        notes: formData.notes,
        project_id: selectedProjectId || null,  // ✅ เพิ่ม project_id
      })
      await loadData()
      setIsDialogOpen(false)
      toast({ title: "สำเร็จ", description: "บันทึกงบประมาณรายจ่ายเรียบร้อยแล้ว" })
    } catch (error: any) {
      console.error("[ExpenseBudget] Error saving budget:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: error.message || "ไม่สามารถบันทึกข้อมูลได้", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (budget: BudgetWithActual) => {
    setEditingId(budget.id)
    setFormData({
      accountCode: budget.account_code,
      year: selectedYear,
      month: selectedMonth,
      budgetAmount: String(budget.budget_amount),
      notes: budget.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบงบประมาณนี้ใช่หรือไม่?")) return
    setIsLoading(true)
    try {
      await deleteExpenseBudget(id)
      await loadData()
      toast({ title: "สำเร็จ", description: "ลบงบประมาณเรียบร้อยแล้ว" })
    } catch (error) {
      console.error("[ExpenseBudget] Error deleting budget:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบข้อมูลได้", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setEditingId(null)
    setFormData({
      accountCode: "",
      budgetAmount: "",
      notes: "",
      year: selectedYear,
      month: selectedMonth,
    })
    setIsDialogOpen(true)
  }

  const exportToCSV = () => {
    if (budgets.length === 0) {
      toast({ title: "ไม่มีข้อมูล", description: "ไม่พบข้อมูลงบประมาณสำหรับส่งออก", variant: "destructive" });
      return;
    }

    const headers = ["รหัสบัญชี", "ชื่อบัญชี", "งบประมาณ", "รายจ่ายจริง", "คงเหลือ", "เปอร์เซ็นต์การใช้", "หมายเหตุ"];
    const rows = budgets.map(b => [
      b.account_code,
      b.account_name,
      b.budget_amount,
      b.actual_amount,
      b.variance,
      b.variance_percent.toFixed(2) + '%',
      b.notes || ''
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" // BOM for Excel
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `งบประมาณรายจ่าย_${selectedYear + 543}-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div>
      <PageHeader title="งบประมาณรายจ่าย" subtitle="จัดการและติดตามงบประมาณรายจ่ายเทียบกับค่าใช้จ่ายจริง" />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">งบประมาณรวม</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{summary.totalBudget.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">เป้าหมายรายจ่าย</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายจ่ายจริง</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{summary.totalActual.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">รายจ่ายที่เกิดขึ้นจริง</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">คงเหลือ</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
                ฿{summary.totalVariance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">งบประมาณ - รายจ่ายจริง</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">อัตราการใช้จ่าย</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.achievementRate.toFixed(1)}%</div>
              <Progress value={Math.min(summary.achievementRate, 100)} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <SelectItem key={y} value={String(y)}>{y + 543}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline"><Download className="mr-2 h-4 w-4" /> ส่งออก CSV</Button>
              <Button onClick={handleOpenDialog}><Plus className="mr-2 h-4 w-4" /> เพิ่มงบประมาณ</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสบัญชี</TableHead>
                  <TableHead>ชื่อบัญชี</TableHead>
                  <TableHead className="text-right">งบประมาณ</TableHead>
                  <TableHead className="text-right">รายจ่ายจริง</TableHead>
                  <TableHead className="text-right">ส่วนต่าง</TableHead>
                  <TableHead className="text-right">% การใช้</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">กำลังโหลดข้อมูล...</TableCell></TableRow>
                ) : budgets.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูลงบประมาณในเดือนนี้</TableCell></TableRow>
                ) : (
                  budgets.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono">{b.account_code}</TableCell>
                      <TableCell>{b.account_name}</TableCell>
                      <TableCell className="text-right">฿{b.budget_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">฿{b.actual_amount.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-semibold ${b.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {b.variance >= 0 ? '+' : ''}฿{b.variance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{b.variance_percent.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "แก้ไขงบประมาณ" : "เพิ่มงบประมาณ"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">ปี</Label>
                <Select value={String(formData.year)} onValueChange={v => setFormData({ ...formData, year: Number(v) })} disabled={!!editingId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <SelectItem key={y} value={String(y)}>{y + 543}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="month">เดือน</Label>
                <Select value={String(formData.month)} onValueChange={v => setFormData({ ...formData, month: Number(v) })} disabled={!!editingId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="accountCode">บัญชีค่าใช้จ่าย *</Label>
              <Select value={formData.accountCode} onValueChange={v => setFormData({ ...formData, accountCode: v })} disabled={!!editingId}>
                <SelectTrigger><SelectValue placeholder="เลือกบัญชี..." /></SelectTrigger>
                <SelectContent>{accounts.map(acc => <SelectItem key={acc.account_code} value={acc.account_code}>{acc.account_code} - {acc.account_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budgetAmount">งบประมาณ *</Label>
              <Input id="budgetAmount" type="number" placeholder="0.00" value={formData.budgetAmount} onChange={e => setFormData({ ...formData, budgetAmount: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea id="notes" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={isLoading}>{isLoading ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

