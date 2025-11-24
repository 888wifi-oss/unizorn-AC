"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, TrendingUp, BarChart3, PieChart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  PieChart as RePieChart,
  Cell,
} from "recharts"

interface RevenueByAccount {
  account_code: string
  account_name: string
  total_amount: number
  transaction_count: number
  percentage: number
}

interface RevenueByMonth {
  month: string
  amount: number
  budget: number
  variance: number
}

interface RevenueByUnit {
  unit_number: string
  total_amount: number
  transaction_count: number
}

export default function RevenueReportsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [revenueByAccount, setRevenueByAccount] = useState<RevenueByAccount[]>([])
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([])
  const [revenueByUnit, setRevenueByUnit] = useState<RevenueByUnit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 543)
  const { toast } = useToast()

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

  useEffect(() => {
    console.log('[RevenueReports] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedYear, selectedProjectId])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const adYear = selectedYear - 543
      const startDate = `${adYear}-01-01`
      const endDate = `${adYear}-12-31`

      // โหลดรายรับตามบัญชี
      let revenueQuery = supabase
        .from("revenue_journal")
        .select("account_code, amount")
        .gte("journal_date", startDate)
        .lte("journal_date", endDate)
      
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        revenueQuery = revenueQuery.eq('project_id', selectedProjectId)
      }
      
      const { data: revenueData } = await revenueQuery

      const { data: accountsData } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name")
        .like("account_code", "4%")

      if (revenueData && accountsData) {
        const accountMap = new Map<string, { total: number; count: number }>()

        revenueData.forEach((item) => {
          if (!accountMap.has(item.account_code)) {
            accountMap.set(item.account_code, { total: 0, count: 0 })
          }
          const acc = accountMap.get(item.account_code)!
          acc.total += Number(item.amount)
          acc.count += 1
        })

        const totalRevenue = Array.from(accountMap.values()).reduce((sum, item) => sum + item.total, 0)

        const byAccount = Array.from(accountMap.entries())
          .map(([code, data]) => {
            const account = accountsData.find((a) => a.account_code === code)
            return {
              account_code: code,
              account_name: account?.account_name || code,
              total_amount: data.total,
              transaction_count: data.count,
              percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
            }
          })
          .sort((a, b) => b.total_amount - a.total_amount)

        setRevenueByAccount(byAccount)
      }

      // โหลดรายรับตามเดือน
      const monthlyData: RevenueByMonth[] = []
      for (let month = 1; month <= 12; month++) {
        const monthStart = `${adYear}-${String(month).padStart(2, "0")}-01`
        const monthEnd = new Date(adYear, month, 0).toISOString().split("T")[0]

        const { data: monthRevenue } = await supabase
          .from("revenue_journal")
          .select("amount")
          .gte("journal_date", monthStart)
          .lte("journal_date", monthEnd)

        const { data: monthBudget } = await supabase
          .from("revenue_budget")
          .select("budget_amount")
          .eq("year", selectedYear)
          .eq("month", month)

        const actualAmount = monthRevenue?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
        const budgetAmount = monthBudget?.reduce((sum, item) => sum + Number(item.budget_amount), 0) || 0

        monthlyData.push({
          month: `${month}`,
          amount: actualAmount,
          budget: budgetAmount,
          variance: actualAmount - budgetAmount,
        })
      }
      setRevenueByMonth(monthlyData)

      // โหลดรายรับตามห้องชุด
      const { data: unitRevenueData } = await supabase
        .from("revenue_journal")
        .select("unit_id, amount")
        .gte("journal_date", startDate)
        .lte("journal_date", endDate)
        .not("unit_id", "is", null)

      const { data: unitsData } = await supabase.from("units").select("id, unit_number")

      if (unitRevenueData && unitsData) {
        const unitMap = new Map<string, { total: number; count: number }>()

        unitRevenueData.forEach((item) => {
          if (!unitMap.has(item.unit_id)) {
            unitMap.set(item.unit_id, { total: 0, count: 0 })
          }
          const unit = unitMap.get(item.unit_id)!
          unit.total += Number(item.amount)
          unit.count += 1
        })

        const byUnit = Array.from(unitMap.entries())
          .map(([unitId, data]) => {
            const unit = unitsData.find((u) => u.id === unitId)
            return {
              unit_number: unit?.unit_number || "N/A",
              total_amount: data.total,
              transaction_count: data.count,
            }
          })
          .sort((a, b) => b.total_amount - a.total_amount)
          .slice(0, 20) // Top 20

        setRevenueByUnit(byUnit)
      }
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

  const exportByAccount = () => {
    const headers = ["รหัสบัญชี", "ชื่อบัญชี", "ยอดรวม", "จำนวนรายการ", "% ของรายรับรวม"]
    const rows = revenueByAccount.map((item) => [
      item.account_code,
      item.account_name,
      item.total_amount.toLocaleString(),
      item.transaction_count,
      item.percentage.toFixed(2) + "%",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `รายรับตามบัญชี_${selectedYear}.csv`
    link.click()
  }

  const exportByMonth = () => {
    const headers = ["เดือน", "รายรับจริง", "งบประมาณ", "ส่วนต่าง"]
    const rows = revenueByMonth.map((item, index) => [
      `เดือน ${index + 1}`,
      item.amount.toLocaleString(),
      item.budget.toLocaleString(),
      item.variance.toLocaleString(),
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `รายรับรายเดือน_${selectedYear}.csv`
    link.click()
  }

  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

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
      <PageHeader title="รายงานรายรับ" description="รายงานรายรับแยกตามผังบัญชีและมุมมองต่างๆ" />

      <div className="container mx-auto p-6 space-y-6">
        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <Label>เลือกปี:</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[-1, 0, 1].map((offset) => {
                const year = new Date().getFullYear() + 543 + offset
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="account" className="space-y-4">
          <TabsList>
            <TabsTrigger value="account">
              <PieChart className="mr-2 h-4 w-4" />
              ตามบัญชี
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <BarChart3 className="mr-2 h-4 w-4" />
              รายเดือน
            </TabsTrigger>
            <TabsTrigger value="unit">
              <TrendingUp className="mr-2 h-4 w-4" />
              ตามห้องชุด
            </TabsTrigger>
          </TabsList>

          {/* By Account */}
          <TabsContent value="account" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={exportByAccount} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                ส่งออก CSV
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>กราฟสัดส่วนรายรับตามบัญชี</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={revenueByAccount}
                        dataKey="total_amount"
                        nameKey="account_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.account_code}: ${entry.percentage.toFixed(1)}%`}
                      >
                        {revenueByAccount.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>สรุปรายรับตามบัญชี</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รหัส</TableHead>
                        <TableHead>ชื่อบัญชี</TableHead>
                        <TableHead className="text-right">ยอดรวม</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueByAccount.slice(0, 5).map((item) => (
                        <TableRow key={item.account_code}>
                          <TableCell className="font-mono">{item.account_code}</TableCell>
                          <TableCell>{item.account_name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ฿{item.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>รายละเอียดรายรับตามบัญชี</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัสบัญชี</TableHead>
                      <TableHead>ชื่อบัญชี</TableHead>
                      <TableHead className="text-right">ยอดรวม</TableHead>
                      <TableHead className="text-center">จำนวนรายการ</TableHead>
                      <TableHead className="text-right">% ของรายรับรวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByAccount.map((item) => (
                      <TableRow key={item.account_code}>
                        <TableCell className="font-mono">{item.account_code}</TableCell>
                        <TableCell>{item.account_name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ฿{item.total_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">{item.transaction_count}</TableCell>
                        <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Month */}
          <TabsContent value="monthly" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={exportByMonth} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                ส่งออก CSV
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>กราฟเปรียบเทียบรายรับจริง vs งบประมาณ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={(value) => monthNames[Number.parseInt(value) - 1]} />
                    <YAxis tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`} />
                    <Tooltip
                      formatter={(value: number) => `฿${value.toLocaleString()}`}
                      labelFormatter={(label) => `เดือน ${monthNames[Number.parseInt(label as string) - 1]}`}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#3b82f6" name="รายรับจริง" />
                    <Bar dataKey="budget" fill="#10b981" name="งบประมาณ" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>รายละเอียดรายรับรายเดือน</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เดือน</TableHead>
                      <TableHead className="text-right">รายรับจริง</TableHead>
                      <TableHead className="text-right">งบประมาณ</TableHead>
                      <TableHead className="text-right">ส่วนต่าง</TableHead>
                      <TableHead className="text-right">% บรรลุเป้า</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByMonth.map((item, index) => {
                      const achievement = item.budget > 0 ? (item.amount / item.budget) * 100 : 0
                      return (
                        <TableRow key={item.month}>
                          <TableCell>{monthNames[index]}</TableCell>
                          <TableCell className="text-right font-semibold">฿{item.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">฿{item.budget.toLocaleString()}</TableCell>
                          <TableCell
                            className={`text-right font-semibold ${item.variance >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {item.variance >= 0 ? "+" : ""}฿{item.variance.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">{achievement.toFixed(1)}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Unit */}
          <TabsContent value="unit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 20 ห้องชุดที่มีรายรับสูงสุด</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>อันดับ</TableHead>
                      <TableHead>เลขห้อง</TableHead>
                      <TableHead className="text-right">ยอดรวม</TableHead>
                      <TableHead className="text-center">จำนวนรายการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByUnit.map((item, index) => (
                      <TableRow key={item.unit_number}>
                        <TableCell className="font-semibold">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.unit_number}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ฿{item.total_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">{item.transaction_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
