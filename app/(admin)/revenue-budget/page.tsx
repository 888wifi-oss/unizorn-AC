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
import { Plus, Download, Edit, Trash2, TrendingUp, Target, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { getRevenueBudgets, saveRevenueBudget, deleteRevenueBudget, getRevenueAccountsFromDB } from "@/lib/supabase/actions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface RevenueAccount {
  account_code: string
  account_name: string
}

interface BudgetWithActual {
  id: string
  account_code: string
  year: number
  month: number
  budget_amount: number
  notes?: string
  actual_amount: number
  variance: number
  variance_percent: number
  account_name: string
}

export default function RevenueBudgetPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [budgets, setBudgets] = useState<BudgetWithActual[]>([])
  const [allBudgets, setAllBudgets] = useState<BudgetWithActual[]>([])
  const [accounts, setAccounts] = useState<RevenueAccount[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 543)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    accountCode: "",
    year: selectedYear,
    month: selectedMonth,
    budgetAmount: "",
    notes: "",
  })

  const [summary, setSummary] = useState({ totalBudget: 0, totalActual: 0, totalVariance: 0, achievementRate: 0 })

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('th-TH', { month: 'long' })
  }))

  useEffect(() => {
    console.log('[RevenueBudget] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedYear, selectedMonth, selectedProjectId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [budgetsData, accountsData] = await Promise.all([
        getRevenueBudgets(selectedYear, selectedMonth, selectedProjectId),
        getRevenueAccountsFromDB()
      ]);
      setAllBudgets(budgetsData)
      console.log('[RevenueBudget] Total budgets from DB:', budgetsData.length)

      setBudgets(budgetsData)
      setAccounts(accountsData)
      calculateSummary(budgetsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลได้", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSummary = (data: BudgetWithActual[]) => {
    const totalBudget = data.reduce((sum, item) => sum + Number(item.budget_amount), 0)
    const totalActual = data.reduce((sum, item) => sum + Number(item.actual_amount), 0)
    const totalVariance = totalActual - totalBudget
    const achievementRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
    setSummary({ totalBudget, totalActual, totalVariance, achievementRate })
  }

  const handleOpenDialog = (budget?: BudgetWithActual) => {
    if (budget) {
      setEditingId(budget.id);
      setFormData({
        accountCode: budget.account_code,
        year: budget.year,
        month: budget.month,
        budgetAmount: String(budget.budget_amount),
        notes: budget.notes || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        accountCode: "",
        year: selectedYear,
        month: selectedMonth,
        budgetAmount: "",
        notes: "",
      });
    }
    setIsDialogOpen(true);
  }

  const handleSave = async () => {
    if (!formData.accountCode || !formData.budgetAmount) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบถ้วน", description: "กรุณาเลือกบัญชีและกรอกงบประมาณ", variant: "destructive" })
      return
    }
    const amount = parseFloat(formData.budgetAmount)
    if (isNaN(amount) || amount < 0) {
      toast({ title: "จำนวนเงินไม่ถูกต้อง", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      console.log('[RevenueBudget] Saving budget with project_id:', selectedProjectId)
      await saveRevenueBudget({
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
      toast({ title: "สำเร็จ", description: "บันทึกงบประมาณเรียบร้อยแล้ว" })
    } catch (error: any) {
      console.error("Error saving budget:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: error.message || "ไม่สามารถบันทึกข้อมูลได้", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบงบประมาณนี้ใช่หรือไม่?")) return
    try {
      await deleteRevenueBudget(id)
      toast({ title: "ลบสำเร็จ", description: "ลบงบประมาณเรียบร้อยแล้ว" })
      loadData()
    } catch (error) {
      console.error("Error deleting budget:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบงบประมาณได้", variant: "destructive" })
    }
  }

  const exportToCSV = () => {
    if (budgets.length === 0) {
      toast({ title: "ไม่มีข้อมูล", description: "ไม่พบข้อมูลงบประมาณสำหรับส่งออก", variant: "destructive" });
      return;
    }

    const headers = ["รหัสบัญชี", "ชื่อบัญชี", "งบประมาณ", "รายรับจริง", "ส่วนต่าง", "เปอร์เซ็นต์บรรลุเป้า", "หมายเหตุ"];
    const rows = budgets.map(b => [
      b.account_code,
      `"${b.account_name.replace(/"/g, '""')}"`,
      b.budget_amount,
      b.actual_amount,
      b.variance,
      b.variance_percent.toFixed(2) + '%',
      `"${(b.notes || '').replace(/"/g, '""')}"`
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `งบประมาณรายรับ_${selectedYear}-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="งบประมาณรายรับ" subtitle="จัดการและติดตามงบประมาณรายรับเทียบกับรายรับจริง" />

      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">งบประมาณรวม</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">฿{summary.totalBudget.toLocaleString()}</div><p className="text-xs text-muted-foreground">เป้าหมายรายรับ</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">รายรับจริง</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">฿{summary.totalActual.toLocaleString()}</div><p className="text-xs text-muted-foreground">รายรับที่เกิดขึ้นจริง</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">ส่วนต่าง</CardTitle><AlertCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${summary.totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}>{summary.totalVariance >= 0 ? "+" : ""}฿{summary.totalVariance.toLocaleString()}</div><p className="text-xs text-muted-foreground">จริง - งบประมาณ</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">% บรรลุเป้า</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.achievementRate.toFixed(1)}%</div><Progress value={Math.min(summary.achievementRate, 100)} className="mt-2" /></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Label>ปี:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{[0, 1, 2].map((offset) => { const year = new Date().getFullYear() + 543 - offset; return (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>) })}</SelectContent></Select>
            <Label>เดือน:</Label>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{months.map((month) => (<SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>))}</SelectContent></Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline"><Download className="mr-2 h-4 w-4" />ส่งออก CSV</Button>
            <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />เพิ่มงบประมาณ</Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>งบประมาณรายรับ vs รายรับจริง</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>รหัสบัญชี</TableHead><TableHead>ชื่อบัญชี</TableHead><TableHead className="text-right">งบประมาณ</TableHead><TableHead className="text-right">รายรับจริง</TableHead><TableHead className="text-right">ส่วนต่าง</TableHead><TableHead className="text-right">% บรรลุ</TableHead><TableHead className="text-center">จัดการ</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? (<TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">กำลังโหลด...</TableCell></TableRow>) : budgets.length === 0 ? (<TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">ไม่มีงบประมาณในเดือนนี้</TableCell></TableRow>) : (
                  budgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell className="font-mono">{budget.account_code}</TableCell>
                      <TableCell>{budget.account_name}</TableCell>
                      <TableCell className="text-right">฿{budget.budget_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">฿{budget.actual_amount.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-semibold ${budget.variance >= 0 ? "text-green-600" : "text-red-600"}`}>{budget.variance >= 0 ? "+" : ""}฿{budget.variance.toLocaleString()}</TableCell>
                      <TableCell className="text-right"><span className={`font-semibold ${budget.variance_percent >= 100 ? "text-green-600" : ""}`}>{budget.variance_percent.toFixed(1)}%</span></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(budget)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(budget.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "แก้ไขงบประมาณ" : "เพิ่มงบประมาณ"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">ปี</Label>
                <Select value={String(formData.year)} onValueChange={v => setFormData({ ...formData, year: Number(v) })} disabled={!!editingId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + 543 - i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">เดือน</Label>
                <Select value={String(formData.month)} onValueChange={v => setFormData({ ...formData, month: Number(v) })} disabled={!!editingId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountCode">บัญชีรายรับ *</Label>
              <Select value={formData.accountCode} onValueChange={v => setFormData({ ...formData, accountCode: v })} disabled={!!editingId}>
                <SelectTrigger><SelectValue placeholder="เลือกบัญชี..." /></SelectTrigger>
                <SelectContent>{accounts.map(acc => <SelectItem key={acc.account_code} value={acc.account_code}>{acc.account_code} - {acc.account_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetAmount">งบประมาณ *</Label>
              <Input id="budgetAmount" type="number" placeholder="0.00" value={formData.budgetAmount} onChange={e => setFormData({ ...formData, budgetAmount: e.target.value })} />
            </div>
            <div className="space-y-2">
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

