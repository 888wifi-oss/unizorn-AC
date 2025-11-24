"use client"

import { useState, useEffect, useMemo } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/lib/settings-context"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { createClient } from "@/lib/supabase/client"
import { formatDate, formatMonthYear } from "@/lib/date-formatter"
import { useCurrency } from "@/lib/currency-formatter"
import { Download, FileSpreadsheet, FileText, Calendar, TrendingUp, TrendingDown, DollarSign, Receipt, AlertCircle, CheckCircle2 } from "lucide-react"
import { exportObjectsToCSV } from "@/lib/csv-exporter"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface Bill {
  id: string
  bill_number: string
  month: string
  total: number
  status: string
  common_fee: number
  water_fee: number
  electricity_fee: number
  parking_fee: number
  other_fee: number
  project_id?: string | null
  units?: {
    unit_number: string
  }
}

interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  project_id?: string | null
}

export default function BillingReportsPage() {
  const { settings } = useSettings()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()

  const [bills, setBills] = useState<Bill[]>([])
  const [allBills, setAllBills] = useState<Bill[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    loadData()
  }, [selectedProjectId, dateRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const isRestricted = selectedProjectId && currentUser.role !== 'super_admin'

      // Load bills
      let billsQuery = supabase
        .from('bills')
        .select('id, bill_number, month, total, status, common_fee, water_fee, electricity_fee, parking_fee, other_fee, project_id, units(unit_number)')
        .gte('month', dateRange.start.slice(0, 7))
        .lte('month', dateRange.end.slice(0, 7))
        .order('month', { ascending: false })

      const { data: billsData, error: billsError } = await billsQuery
      if (billsError) throw billsError

      // Load payments
      let paymentsQuery = supabase
        .from('payments')
        .select('id, amount, payment_date, payment_method, project_id')
        .gte('payment_date', dateRange.start)
        .lte('payment_date', dateRange.end)
        .order('payment_date', { ascending: false })

      const { data: paymentsData, error: paymentsError } = await paymentsQuery
      if (paymentsError) throw paymentsError

      setAllBills(billsData || [])
      setAllPayments(paymentsData || [])

      // Filter by project
      if (isRestricted && selectedProjectId) {
        const filteredBills = (billsData || []).filter((bill: Bill) => 
          bill.project_id === selectedProjectId
        )
        const filteredPayments = (paymentsData || []).filter((payment: Payment) => 
          payment.project_id === selectedProjectId
        )
        setBills(filteredBills)
        setPayments(filteredPayments)
      } else {
        setBills(billsData || [])
        setPayments(paymentsData || [])
      }
    } catch (error: any) {
      console.error('[Billing Reports] Error loading data:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBills = bills.length
    const totalAmount = bills.reduce((sum, b) => sum + b.total, 0)
    const paidBills = bills.filter(b => b.status === 'paid')
    const paidAmount = paidBills.reduce((sum, b) => sum + b.total, 0)
    const pendingBills = bills.filter(b => b.status === 'pending')
    const pendingAmount = pendingBills.reduce((sum, b) => sum + b.total, 0)
    const overdueBills = bills.filter(b => b.status === 'overdue')
    const overdueAmount = overdueBills.reduce((sum, b) => sum + b.total, 0)

    const totalPayments = payments.length
    const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amount, 0)

    return {
      totalBills,
      totalAmount,
      paidBills: paidBills.length,
      paidAmount,
      pendingBills: pendingBills.length,
      pendingAmount,
      overdueBills: overdueBills.length,
      overdueAmount,
      totalPayments,
      totalPaymentAmount,
      collectionRate: totalAmount > 0 ? (totalPaymentAmount / totalAmount) * 100 : 0
    }
  }, [bills, payments])

  // Monthly revenue data
  const monthlyRevenue = useMemo(() => {
    const monthMap = new Map<string, { bills: number, payments: number, count: number }>()
    
    bills.forEach(bill => {
      const month = bill.month
      const existing = monthMap.get(month) || { bills: 0, payments: 0, count: 0 }
      existing.bills += bill.total
      existing.count += 1
      monthMap.set(month, existing)
    })

    payments.forEach(payment => {
      const month = payment.payment_date.slice(0, 7)
      const existing = monthMap.get(month) || { bills: 0, payments: 0, count: 0 }
      existing.payments += payment.amount
      monthMap.set(month, existing)
    })

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month: formatMonthYear(month, settings.yearType),
        monthKey: month,
        bills: data.bills,
        payments: data.payments,
        count: data.count,
        outstanding: data.bills - data.payments
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }, [bills, payments, settings.yearType])

  // Revenue by type
  const revenueByType = useMemo(() => {
    return [
      {
        name: 'ค่าส่วนกลาง',
        value: bills.reduce((sum, b) => sum + (b.common_fee || 0), 0),
        color: '#3b82f6'
      },
      {
        name: 'ค่าน้ำ',
        value: bills.reduce((sum, b) => sum + (b.water_fee || 0), 0),
        color: '#06b6d4'
      },
      {
        name: 'ค่าไฟ',
        value: bills.reduce((sum, b) => sum + (b.electricity_fee || 0), 0),
        color: '#f59e0b'
      },
      {
        name: 'ค่าจอดรถ',
        value: bills.reduce((sum, b) => sum + (b.parking_fee || 0), 0),
        color: '#10b981'
      },
      {
        name: 'อื่นๆ',
        value: bills.reduce((sum, b) => sum + (b.other_fee || 0), 0),
        color: '#8b5cf6'
      }
    ].filter(item => item.value > 0)
  }, [bills])

  // Payment methods distribution
  const paymentMethods = useMemo(() => {
    const methodMap = new Map<string, number>()
    payments.forEach(p => {
      const method = p.payment_method || 'unknown'
      methodMap.set(method, (methodMap.get(method) || 0) + p.amount)
    })
    return Array.from(methodMap.entries()).map(([method, amount]) => ({
      name: method === 'cash' ? 'เงินสด' : method === 'transfer' ? 'โอนเงิน' : method === 'check' ? 'เช็ค' : method === 'credit_card' ? 'บัตรเครดิต' : method,
      value: amount
    }))
  }, [payments])

  const handleExportCSV = () => {
    const exportData = bills.map(bill => ({
      'เลขที่บิล': bill.bill_number,
      'เดือน': formatMonthYear(bill.month, settings.yearType),
      'ค่าส่วนกลาง': bill.common_fee || 0,
      'ค่าน้ำ': bill.water_fee || 0,
      'ค่าไฟ': bill.electricity_fee || 0,
      'ค่าจอดรถ': bill.parking_fee || 0,
      'อื่นๆ': bill.other_fee || 0,
      'รวม': bill.total,
      'สถานะ': bill.status === 'paid' ? 'ชำระแล้ว' : bill.status === 'pending' ? 'รอชำระ' : 'เกินกำหนด'
    }))
    exportObjectsToCSV(exportData, `billing-reports-${dateRange.start}-${dateRange.end}.csv`)
    toast({
      title: "สำเร็จ",
      description: "ส่งออกข้อมูลเรียบร้อยแล้ว"
    })
  }

  const handleExportPDF = () => {
    toast({
      title: "กำลังพัฒนา",
      description: "การส่งออก PDF กำลังอยู่ในระหว่างการพัฒนา"
    })
  }

  return (
    <div>
      <PageHeader
        title="รายงานบิลและการวิเคราะห์"
        subtitle="วิเคราะห์ข้อมูลบิลและการชำระเงิน"
        action={
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              ส่งออก CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              ส่งออก PDF
            </Button>
          </div>
        }
      />

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ตัวกรองข้อมูล</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateStart">ตั้งแต่วันที่</Label>
              <Input
                id="dateStart"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dateEnd">ถึงวันที่</Label>
              <Input
                id="dateEnd"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="viewMode">มุมมอง</Label>
              <Select value={viewMode} onValueChange={(value: "monthly" | "yearly") => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บิลทั้งหมด</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBills}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.totalAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ชำระแล้ว</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidBills}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.paidAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค้างชำระ</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingBills + stats.overdueBills}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.pendingAmount + stats.overdueAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราการเก็บเงิน</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.collectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.totalPaymentAmount)} จาก {formatCurrency(stats.totalAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>รายได้รายเดือน</CardTitle>
            <CardDescription>เปรียบเทียบยอดบิลและการชำระเงิน</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">กำลังโหลด...</div>
            ) : monthlyRevenue.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">ไม่มีข้อมูล</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="bills" fill="#3b82f6" name="ยอดบิล" />
                  <Bar dataKey="payments" fill="#10b981" name="ยอดชำระ" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        <Card>
          <CardHeader>
            <CardTitle>รายได้ตามประเภท</CardTitle>
            <CardDescription>แยกตามประเภทค่าใช้จ่าย</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">กำลังโหลด...</div>
            ) : revenueByType.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">ไม่มีข้อมูล</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>บิลค้างชำระ</CardTitle>
          <CardDescription>รายการบิลที่ยังไม่ได้ชำระ</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">กำลังโหลด...</div>
          ) : bills.filter(b => b.status === 'pending' || b.status === 'overdue').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">ไม่มีบิลค้างชำระ</div>
          ) : (
            <div className="space-y-2">
              {bills
                .filter(b => b.status === 'pending' || b.status === 'overdue')
                .slice(0, 10)
                .map(bill => (
                  <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{bill.bill_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatMonthYear(bill.month, settings.yearType)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(bill.total)}</p>
                      <Badge variant={bill.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {bill.status === 'overdue' ? 'เกินกำหนด' : 'รอชำระ'}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
