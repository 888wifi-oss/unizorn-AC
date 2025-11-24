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
import { Plus, Download, TrendingUp, DollarSign, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface RevenueJournal {
  id: string
  journal_date: string
  account_code: string
  unit_id?: string
  bill_id?: string
  description: string
  amount: number
  reference_number?: string
  created_at: string
  project_id?: string
}

interface ChartOfAccount {
  account_code: string
  account_name: string
  account_type: string
}

interface Unit {
  id: string
  unit_number: string
}

export default function RevenuePage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [revenues, setRevenues] = useState<RevenueJournal[]>([])
  const [allRevenues, setAllRevenues] = useState<RevenueJournal[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(new Date().toISOString().slice(0, 7))
  const { toast} = useToast()
  const { settings } = useSettings()

  const [formData, setFormData] = useState({
    journalDate: new Date().toISOString().split("T")[0],
    accountCode: "",
    unitId: "",
    description: "",
    amount: "",
    referenceNumber: "",
  })

  const [summary, setSummary] = useState({
    totalRevenue: 0,
    revenueCount: 0,
    avgRevenue: 0,
  })

  useEffect(() => {
    loadData()
  }, [selectedPeriod, selectedProjectId])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      // โหลดบัญชีรายรับ (4xxx)
      const { data: accountsData } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name, account_type")
        .like("account_code", "4%")
        .eq("is_active", true)
        .order("account_code")

      if (accountsData) setAccounts(accountsData)

      // โหลดห้องชุด
      let unitsQuery = supabase.from("units").select("id, unit_number").order("unit_number")
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        unitsQuery = unitsQuery.eq('project_id', selectedProjectId)
      }
      const { data: unitsData } = await unitsQuery

      if (unitsData) setUnits(unitsData)

      // โหลดรายรับตามช่วงเวลา
      const [year, month] = selectedPeriod.split("-")
      const startDate = `${year}-${month}-01`
      const endDate = new Date(Number.parseInt(year), Number.parseInt(month), 0).toISOString().split("T")[0]

      let revenueQuery = supabase
        .from("revenue_journal")
        .select("id, journal_date, account_code, unit_id, bill_id, description, amount, reference_number, created_at, project_id")
        .gte("journal_date", startDate)
        .lte("journal_date", endDate)
        .order("journal_date", { ascending: false })
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        revenueQuery = revenueQuery.eq('project_id', selectedProjectId)
      }
      const { data: revenuesData } = await revenueQuery

      if (revenuesData) {
        setAllRevenues(revenuesData)
        setRevenues(revenuesData)
        calculateSummary(revenuesData as RevenueJournal[])
      }
      const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('[perf] Revenue page sizes:', {
        accounts: accountsData?.length || 0,
        units: unitsData?.length || 0,
        revenues: revenuesData?.length || 0,
      })
      console.log(`[perf] Revenue page load duration: ${Math.round(tEnd - tStart)}ms`)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSummary = (data: RevenueJournal[]) => {
    const total = data.reduce((sum, item) => sum + Number(item.amount), 0)
    setSummary({
      totalRevenue: total,
      revenueCount: data.length,
      avgRevenue: data.length > 0 ? total / data.length : 0,
    })
  }

  const handleSave = async () => {
    if (!formData.journalDate || !formData.accountCode || !formData.description || !formData.amount) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "วันที่ รหัสบัญชี รายละเอียด และจำนวนเงิน จำเป็นต้องกรอก",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "จำนวนเงินไม่ถูกต้อง",
        description: "กรุณากรอกจำนวนเงินที่ถูกต้อง",
        variant: "destructive",
      })
      return
    }

    const supabase = createClient()

    try {
      console.log('[Revenue] Saving revenue with project_id:', selectedProjectId)
      const { error } = await supabase.from("revenue_journal").insert({
        journal_date: formData.journalDate,
        account_code: formData.accountCode,
        unit_id: formData.unitId || null,
        description: formData.description,
        amount: amount,
        reference_number: formData.referenceNumber || null,
        project_id: selectedProjectId || null,  // ✅ เพิ่ม project_id
      })

      if (error) throw error

      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกรายรับเรียบร้อยแล้ว",
      })

      setIsDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Error saving revenue:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกรายรับได้",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      journalDate: new Date().toISOString().split("T")[0],
      accountCode: "",
      unitId: "",
      description: "",
      amount: "",
      referenceNumber: "",
    })
  }

  const exportToCSV = () => {
    const headers = ["วันที่", "รหัสบัญชี", "ชื่อบัญชี", "เลขห้อง", "รายละเอียด", "จำนวนเงิน", "เลขที่อ้างอิง"]

    const rows = revenues.map((rev) => {
      const account = accounts.find((a) => a.account_code === rev.account_code)
      const unit = units.find((u) => u.id === rev.unit_id)
      return [
        formatDate(rev.journal_date, settings),
        rev.account_code,
        account?.account_name || "",
        unit?.unit_number || "-",
        rev.description,
        rev.amount.toLocaleString(),
        rev.reference_number || "-",
      ]
    })

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `รายรับ_${selectedPeriod}.csv`
    link.click()
  }

  const getAccountName = (code: string) => {
    return accounts.find((a) => a.account_code === code)?.account_name || code
  }

  const getUnitNumber = (unitId?: string) => {
    if (!unitId) return "-"
    return units.find((u) => u.id === unitId)?.unit_number || "-"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="บันทึกรายรับ" description="บันทึกและจัดการรายรับเชื่อมโยงกับผังบัญชี" />

      <div className="container mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายรับรวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{summary.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">ประจำเดือน {selectedPeriod}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">จำนวนรายการ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.revenueCount}</div>
              <p className="text-xs text-muted-foreground">รายการบันทึก</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายรับเฉลี่ย</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ฿{summary.avgRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground">ต่อรายการ</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Label>เลือกเดือน:</Label>
            <Input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              ส่งออก CSV
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              บันทึกรายรับ
            </Button>
          </div>
        </div>

        {/* Revenue Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายการบันทึกรายรับ</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>รหัสบัญชี</TableHead>
                  <TableHead>ชื่อบัญชี</TableHead>
                  <TableHead>เลขห้อง</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                  <TableHead>เลขที่อ้างอิง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      ไม่มีรายการบันทึกรายรับ
                    </TableCell>
                  </TableRow>
                ) : (
                  revenues.map((revenue) => (
                    <TableRow key={revenue.id}>
                      <TableCell>{formatDate(revenue.journal_date, settings)}</TableCell>
                      <TableCell className="font-mono">{revenue.account_code}</TableCell>
                      <TableCell>{getAccountName(revenue.account_code)}</TableCell>
                      <TableCell>{getUnitNumber(revenue.unit_id)}</TableCell>
                      <TableCell>{revenue.description}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ฿{(revenue.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{revenue.reference_number || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Revenue Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>บันทึกรายรับ</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="journalDate">
                  วันที่ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="journalDate"
                  type="date"
                  value={formData.journalDate}
                  onChange={(e) => setFormData({ ...formData, journalDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountCode">
                  รหัสบัญชีรายรับ <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.accountCode}
                  onValueChange={(value) => setFormData({ ...formData, accountCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบัญชีรายรับ" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.account_code} value={account.account_code}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitId">เลขห้อง (ถ้ามี)</Label>
                <Select value={formData.unitId} onValueChange={(value) => setFormData({ ...formData, unitId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกห้องชุด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ไม่ระบุ</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unit_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  จำนวนเงิน <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                รายละเอียด <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="ระบุรายละเอียดรายรับ"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">เลขที่อ้างอิง</Label>
              <Input
                id="referenceNumber"
                placeholder="เลขที่เอกสาร/ใบเสร็จ"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                resetForm()
              }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
