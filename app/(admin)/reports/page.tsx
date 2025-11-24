"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Building2,
  BarChart3,
  FileSpreadsheet,
  Calendar,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Unit, Bill, Payment } from "@/lib/db-types"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

export default function ReportsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [units, setUnits] = useState<Unit[]>([])
  const [allUnits, setAllUnits] = useState<Unit[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [allBills, setAllBills] = useState<Bill[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    console.log('[Reports] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedProjectId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Build queries with project filtering
      let unitsQuery = supabase.from("units").select("*")
      let billsQuery = supabase.from("bills").select("*")
      let paymentsQuery = supabase.from("payments").select("*")

      if (selectedProjectId && currentUser.role !== 'super_admin') {
        unitsQuery = unitsQuery.eq('project_id', selectedProjectId)
        billsQuery = billsQuery.eq('project_id', selectedProjectId)
        paymentsQuery = paymentsQuery.eq('project_id', selectedProjectId)
      }

      const [unitsRes, billsRes, paymentsRes] = await Promise.all([
        unitsQuery,
        billsQuery,
        paymentsQuery,
      ])

      if (unitsRes.error) throw unitsRes.error
      if (billsRes.error) throw billsRes.error
      if (paymentsRes.error) throw paymentsRes.error

      const unitsData = unitsRes.data || []
      const billsData = billsRes.data || []
      const paymentsData = paymentsRes.data || []

      setAllUnits(unitsData)
      setAllBills(billsData)
      setAllPayments(paymentsData)
      
      console.log('[Reports] Total data from DB:', {
        units: unitsData.length,
        bills: billsData.length,
        payments: paymentsData.length
      })

      // Filter by selected project (for non-Super Admin) - already filtered in query but keep for consistency
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        setUnits(unitsData.filter((u: any) => u.project_id === selectedProjectId))
        setBills(billsData.filter((b: any) => b.project_id === selectedProjectId))
        setPayments(paymentsData.filter((p: any) => p.project_id === selectedProjectId))
      } else {
        setUnits(unitsData)
        setBills(billsData)
        setPayments(paymentsData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredBills = bills.filter((bill) => {
    const billDate = new Date(bill.month)
    return billDate >= new Date(startDate) && billDate <= new Date(endDate)
  })

  const filteredPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.payment_date)
    return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate)
  })

  // Calculate monthly revenue data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthStr = `${selectedYear}-${String(month).padStart(2, "0")}`

    const monthBills = bills.filter((b) => b.month && b.month.startsWith(monthStr))
    const monthPayments = payments.filter((p) => p.payment_date && p.payment_date.startsWith(monthStr))

    return {
      month: new Date(Number(selectedYear), i).toLocaleDateString("th-TH", { month: "short" }),
      รายได้: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      บิลทั้งหมด: monthBills.reduce((sum, b) => sum + (b.total || 0), 0),
      ค้างชำระ: monthBills.filter((b) => b.status !== "paid").reduce((sum, b) => sum + (b.total || 0), 0),
    }
  })

  // Calculate statistics
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalBills = filteredBills.reduce((sum, b) => sum + (b.total || 0), 0)
  const totalUnpaid = filteredBills.filter((b) => b.status !== "paid").reduce((sum, b) => sum + (b.total || 0), 0)
  const collectionRate = totalBills > 0 ? ((totalRevenue / totalBills) * 100).toFixed(1) : "0"

  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthRevenue = payments
    .filter((p) => p.payment_date && p.payment_date.startsWith(thisMonth))
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)
  const lastMonthRevenue = payments
    .filter((p) => p.payment_date && p.payment_date.startsWith(lastMonth))
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const revenueChange =
    lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : "0"

  // Unit status breakdown
  const unitStats = {
    total: units.length,
    occupied: units.filter((u) => u.status === "occupied").length,
    vacant: units.filter((u) => u.status === "vacant").length,
    maintenance: units.filter((u) => u.status === "maintenance").length,
  }

  const unitStatusData = [
    { name: "มีผู้อยู่อาศัย", value: unitStats.occupied, color: "#10b981" },
    { name: "ว่าง", value: unitStats.vacant, color: "#6b7280" },
    { name: "ซ่อมบำรุง", value: unitStats.maintenance, color: "#f59e0b" },
  ]

  // Payment method breakdown
  const paymentMethodStats = {
    cash: filteredPayments.filter((p) => p.payment_method === "cash").length,
    transfer: filteredPayments.filter((p) => p.payment_method === "transfer").length,
    check: filteredPayments.filter((p) => p.payment_method === "check").length,
    credit: filteredPayments.filter((p) => p.payment_method === "credit").length,
  }

  const paymentMethodData = [
    { name: "เงินสด", value: paymentMethodStats.cash, color: "#10b981" },
    { name: "โอนเงิน", value: paymentMethodStats.transfer, color: "#3b82f6" },
    { name: "เช็ค", value: paymentMethodStats.check, color: "#f59e0b" },
    { name: "บัตรเครดิต", value: paymentMethodStats.credit, color: "#8b5cf6" },
  ]

  // Outstanding bills by unit
  const outstandingBills = filteredBills
    .filter((b) => b.status !== "paid")
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .slice(0, 10)

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const value = row[h] || ""
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const exportFinancialSummary = () => {
    const data = monthlyData.map((m) => ({
      เดือน: m.month,
      รายได้: m.รายได้,
      บิลทั้งหมด: m.บิลทั้งหมด,
      ค้างชำระ: m.ค้างชำระ,
    }))

    exportToCSV(data, "สรุปรายได้รายเดือน", ["เดือน", "รายได้", "บิลทั้งหมด", "ค้างชำระ"])

    toast({
      title: "ส่งออกสำเร็จ",
      description: "ส่งออกรายงานสรุปรายได้รายเดือนเรียบร้อยแล้ว",
    })
  }

  const exportOutstandingBills = () => {
    const data = outstandingBills.map((bill) => ({
      เลขห้อง: bill.unit_id,
      เดือน: new Date(bill.month).toLocaleDateString("th-TH", { year: "numeric", month: "long" }),
      จำนวนเงิน: bill.total,
      กำหนดชำระ: new Date(bill.due_date).toLocaleDateString("th-TH"),
      สถานะ: bill.status === "overdue" ? "เกินกำหนด" : "รอชำระ",
    }))

    exportToCSV(data, "บิลค้างชำระ", ["เลขห้อง", "เดือน", "จำนวนเงิน", "กำหนดชำระ", "สถานะ"])

    toast({
      title: "ส่งออกสำเร็จ",
      description: "ส่งออกรายงานบิลค้างชำระเรียบร้อยแล้ว",
    })
  }

  const exportPaymentHistory = () => {
    const data = filteredPayments.map((payment) => ({
      วันที่ชำระ: new Date(payment.payment_date).toLocaleDateString("th-TH"),
      เลขห้อง: payment.unit_id,
      จำนวนเงิน: payment.amount,
      วิธีการชำระ:
        payment.payment_method === "cash"
          ? "เงินสด"
          : payment.payment_method === "transfer"
            ? "โอนเงิน"
            : payment.payment_method === "check"
              ? "เช็ค"
              : "บัตรเครดิต",
      หมายเหตุ: payment.notes || "-",
    }))

    exportToCSV(data, "ประวัติการชำระเงิน", ["วันที่ชำระ", "เลขห้อง", "จำนวนเงิน", "วิธีการชำระ", "หมายเหตุ"])

    toast({
      title: "ส่งออกสำเร็จ",
      description: "ส่งออกรายงานประวัติการชำระเงินเรียบร้อยแล้ว",
    })
  }

  const exportUnitReport = () => {
    const data = units.map((unit) => ({
      เลขห้อง: unit.unit_number,
      ชั้น: unit.floor,
      ขนาด: unit.size,
      เจ้าของ: unit.owner_name,
      เบอร์โทร: unit.owner_phone,
      อีเมล: unit.owner_email || "-",
      สถานะ: unit.status === "occupied" ? "มีผู้อยู่อาศัย" : unit.status === "vacant" ? "ว่าง" : "ซ่อมบำรุง",
      จำนวนผู้อยู่อาศัย: unit.residents || 0,
    }))

    exportToCSV(data, "รายงานห้องชุด", ["เลขห้อง", "ชั้น", "ขนาด", "เจ้าของ", "เบอร์โทร", "อีเมล", "สถานะ", "จำนวนผู้อยู่อาศัย"])

    toast({
      title: "ส่งออกสำเร็จ",
      description: "ส่งออกรายงานห้องชุดเรียบร้อยแล้ว",
    })
  }

  const exportAllReports = () => {
    exportFinancialSummary()
    setTimeout(() => exportOutstandingBills(), 500)
    setTimeout(() => exportPaymentHistory(), 1000)
    setTimeout(() => exportUnitReport(), 1500)

    toast({
      title: "ส่งออกทั้งหมดสำเร็จ",
      description: "ส่งออกรายงานทั้งหมดเรียบร้อยแล้ว",
    })
  }

  const getUnitNumber = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId)
    return unit?.unit_number || unitId
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="รายงาน"
        subtitle="สรุปรายงานทางการเงินและสถิติต่างๆ"
        action={
          <div className="flex gap-2">
            <Button onClick={exportAllReports} variant="default">
              <Download className="w-4 h-4 mr-2" />
              ส่งออกทั้งหมด
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            ช่วงเวลา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">รายได้รวม</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">฿{totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
              {Number.parseFloat(revenueChange) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-xs ${Number.parseFloat(revenueChange) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {revenueChange}% จากเดือนที่แล้ว
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">บิลทั้งหมด</CardTitle>
            <FileText className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">฿{totalBills.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{filteredBills.length} รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ค้างชำระ</CardTitle>
            <FileText className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">฿{totalUnpaid.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              {filteredBills.filter((b) => b.status !== "paid").length} รายการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">อัตราการชำระ</CardTitle>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{collectionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">จากบิลทั้งหมด</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="financial">การเงิน</TabsTrigger>
          <TabsTrigger value="units">ห้องชุด</TabsTrigger>
          <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>รายได้รายเดือน</CardTitle>
                  <div className="flex gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2567</SelectItem>
                        <SelectItem value="2023">2566</SelectItem>
                        <SelectItem value="2022">2565</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={exportFinancialSummary}>
                      <FileSpreadsheet className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    รายได้: {
                      label: "รายได้",
                      color: "hsl(142, 76%, 36%)",
                    },
                    บิลทั้งหมด: {
                      label: "บิลทั้งหมด",
                      color: "hsl(217, 91%, 60%)",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="รายได้" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="บิลทั้งหมด" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>แนวโน้มค้างชำระ</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    ค้างชำระ: {
                      label: "ค้างชำระ",
                      color: "hsl(0, 84%, 60%)",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="ค้างชำระ" stroke="hsl(0, 84%, 60%)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    สถานะห้องชุด
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={exportUnitReport}>
                    <FileSpreadsheet className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ห้องชุดทั้งหมด</span>
                      <span className="font-bold">{unitStats.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">มีผู้อยู่อาศัย</span>
                      <Badge className="bg-green-100 text-green-700">{unitStats.occupied}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ว่าง</span>
                      <Badge className="bg-gray-100 text-gray-700">{unitStats.vacant}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ซ่อมบำรุง</span>
                      <Badge className="bg-yellow-100 text-yellow-700">{unitStats.maintenance}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={unitStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {unitStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    วิธีการชำระเงิน
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={exportPaymentHistory}>
                    <FileSpreadsheet className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">เงินสด</span>
                      <span className="font-bold">{paymentMethodStats.cash} รายการ</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">โอนเงิน</span>
                      <span className="font-bold">{paymentMethodStats.transfer} รายการ</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">เช็ค</span>
                      <span className="font-bold">{paymentMethodStats.check} รายการ</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">บัตรเครดิต</span>
                      <span className="font-bold">{paymentMethodStats.credit} รายการ</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>บิลค้างชำระ</CardTitle>
                <Button size="sm" variant="outline" onClick={exportOutstandingBills}>
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขห้อง</TableHead>
                    <TableHead>เดือน</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>กำหนดชำระ</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        ไม่มีบิลค้างชำระ
                      </TableCell>
                    </TableRow>
                  ) : (
                    outstandingBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{getUnitNumber(bill.unit_id)}</TableCell>
                        <TableCell>
                          {new Date(bill.month).toLocaleDateString("th-TH", { year: "numeric", month: "long" })}
                        </TableCell>
                        <TableCell className="font-bold text-red-600">฿{(bill.total || 0).toLocaleString()}</TableCell>
                        <TableCell>{new Date(bill.due_date).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              bill.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {bill.status === "overdue" ? "เกินกำหนด" : "รอชำระ"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>รายงานห้องชุด</CardTitle>
                <Button size="sm" variant="outline" onClick={exportUnitReport}>
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขห้อง</TableHead>
                    <TableHead>ชั้น</TableHead>
                    <TableHead>ขนาด (ตร.ม.)</TableHead>
                    <TableHead>เจ้าของ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>ผู้อยู่อาศัย</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.unit_number}</TableCell>
                      <TableCell>{unit.floor}</TableCell>
                      <TableCell>{unit.size}</TableCell>
                      <TableCell>{unit.owner_name}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            unit.status === "occupied"
                              ? "bg-green-100 text-green-700"
                              : unit.status === "vacant"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {unit.status === "occupied" ? "มีผู้อยู่อาศัย" : unit.status === "vacant" ? "ว่าง" : "ซ่อมบำรุง"}
                        </Badge>
                      </TableCell>
                      <TableCell>{unit.residents || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>ประวัติการชำระเงิน</CardTitle>
                <Button size="sm" variant="outline" onClick={exportPaymentHistory}>
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่ชำระ</TableHead>
                    <TableHead>เลขห้อง</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>วิธีการชำระ</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        ไม่มีข้อมูลการชำระเงิน
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.slice(0, 20).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell className="font-medium">{getUnitNumber(payment.unit_id)}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          ฿{(payment.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700">
                            {payment.payment_method === "cash"
                              ? "เงินสด"
                              : payment.payment_method === "transfer"
                                ? "โอนเงิน"
                                : payment.payment_method === "check"
                                  ? "เช็ค"
                                  : "บัตรเครดิต"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{payment.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
