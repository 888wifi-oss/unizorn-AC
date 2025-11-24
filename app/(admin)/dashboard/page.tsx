"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  RefreshCw,
  Plus,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Wallet,
  PiggyBank
} from "lucide-react"
import { getDashboardStats, type DashboardStats } from "@/lib/actions/dashboard-actions"
import { testAvailableTables } from "@/lib/supabase/test-available-tables"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { useToast } from "@/hooks/use-toast"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts"

const COLORS = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  completed: '#10B981',
  failed: '#EF4444'
}

function DashboardContent() {
  const router = useRouter()
  const { toast } = useToast()

  const projectContext = useProjectContext()
  const selectedProjectId = projectContext.selectedProjectId
  const projectLoading = projectContext.loading

  const currentUser = getCurrentUser()

  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [hasError, setHasError] = useState(false)
  const [diagnostics, setDiagnostics] = useState<{ success: boolean; results?: Record<string, { success: boolean; error?: string; count?: number }>; error?: string } | null>(null)
  const [runningDiagnostics, setRunningDiagnostics] = useState(false)
  const loadDashboardDataRef = useRef<() => Promise<void>>(async () => { })
  const latestCallIdRef = useRef(0)
  const loadingLockRef = useRef(false)

  const loadDashboardData = useCallback(async () => {
    if (loadingLockRef.current || refreshing) return

    try {
      const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const callId = ++latestCallIdRef.current
      loadingLockRef.current = true
      setRefreshing(true)
      setHasError(false)

      const result = await getDashboardStats(selectedProjectId || null)

      const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log(`[perf] Dashboard fetch duration: ${Math.round(tEnd - tStart)}ms`)

      if (callId !== latestCallIdRef.current) return

      if (result.success && result.data) {
        setData(result.data)
        setLastUpdated(new Date())
        setLoading(false)
      } else {
        console.error('[Dashboard] Error loading data:', result.error)
        setHasError(true)
        // Set default data on error
        setData({
          totalRevenueThisMonth: 0,
          totalUnits: 0,
          paidUnitsThisMonth: 0,
          collectionRate: 0,
          totalOutstanding: 0,
          overdueUnits: 0,
          totalResidents: 0,
          monthlyRevenue: [],
          recentActivities: [],
          paymentStatusBreakdown: { pending: 0, processing: 0, completed: 0, failed: 0 },
          cashBalance: 0,
          netProfitYTD: 0,
          monthlyFinancials: [],
          expenseBreakdown: []
        })
        setLoading(false)

        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถโหลดข้อมูล Dashboard ได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('[Dashboard] Unexpected error:', error)
      setHasError(true)
      setLoading(false)
    } finally {
      setRefreshing(false)
      loadingLockRef.current = false
    }
  }, [selectedProjectId, toast])

  // Store ref for use in interval
  useEffect(() => {
    loadDashboardDataRef.current = loadDashboardData
  }, [loadDashboardData])

  useEffect(() => {
    // If project is still loading, do nothing
    if (projectLoading) return

    // Load data immediately
    loadDashboardData()
  }, [selectedProjectId, projectLoading, loadDashboardData])

  // Fallback: Force load after 2 seconds if still loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !data) {
        console.log('[Dashboard] Force loading timeout - loading default data')
        setLoading(false)
        setHasError(false)
        setData({
          totalRevenueThisMonth: 0,
          totalUnits: 0,
          paidUnitsThisMonth: 0,
          collectionRate: 0,
          totalOutstanding: 0,
          overdueUnits: 0,
          totalResidents: 0,
          monthlyRevenue: [],
          recentActivities: [],
          paymentStatusBreakdown: {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
          },
          cashBalance: 0,
          netProfitYTD: 0,
          monthlyFinancials: [],
          expenseBreakdown: []
        })
      }
    }, 10000) // Increased to 10 seconds to allow for slower connections

    return () => clearTimeout(timeout)
  }, [loading, data])

  // Auto-refresh every 30 seconds (only if not loading and tab visible)
  useEffect(() => {
    if (loading) return

    const interval = setInterval(() => {
      const isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
      if (isVisible && !refreshing && loadDashboardDataRef.current) {
        console.log('[Dashboard] Auto-refresh triggered')
        loadDashboardDataRef.current()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [loading, refreshing]) // Removed loadDashboardData from dependencies

  // Pause auto-refresh when tab hidden; resume when visible
  useEffect(() => {
    const onVisibility = () => {
      console.log('[Dashboard] visibility change:', document.visibilityState)
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
      return () => document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const chartConfig = {
    revenue: {
      label: "รายรับ",
      color: "hsl(var(--chart-1))",
    },
    expense: {
      label: "รายจ่าย",
      color: "hsl(var(--chart-2))",
    },
  }

  const paymentStatusChartData = data ? [
    { name: 'รอดำเนินการ', value: data.paymentStatusBreakdown.pending, color: COLORS.pending },
    { name: 'กำลังตรวจสอบ', value: data.paymentStatusBreakdown.processing, color: COLORS.processing },
    { name: 'สำเร็จ', value: data.paymentStatusBreakdown.completed, color: COLORS.completed },
    { name: 'ล้มเหลว', value: data.paymentStatusBreakdown.failed, color: COLORS.failed },
  ].filter(item => item.value > 0) : []

  const runDiagnostics = async () => {
    try {
      setRunningDiagnostics(true)
      const res = await testAvailableTables()
      setDiagnostics(res)
    } catch (err: any) {
      setDiagnostics({ success: false, error: err?.message || 'ไม่สามารถตรวจสอบฐานข้อมูลได้' })
    } finally {
      setRunningDiagnostics(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="แดชบอร์ด" subtitle="ภาพรวมการเงินและการจัดการอาคารชุด" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
            {projectLoading && (
              <p className="text-sm text-muted-foreground mt-2">กำลังโหลดข้อมูลโครงการ...</p>
            )}
            {selectedProjectId && (
              <p className="text-xs text-muted-foreground mt-1">Project ID: {selectedProjectId.substring(0, 8)}...</p>
            )}
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runDiagnostics}
                disabled={runningDiagnostics}
              >
                {runningDiagnostics ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    กำลังตรวจสอบฐานข้อมูล
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    ตรวจสอบฐานข้อมูล
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Force default state to bypass prolonged loading
                  setHasError(false)
                  setData({
                    totalRevenueThisMonth: 0,
                    totalUnits: 0,
                    paidUnitsThisMonth: 0,
                    collectionRate: 0,
                    totalOutstanding: 0,
                    overdueUnits: 0,
                    totalResidents: 0,
                    monthlyRevenue: [],
                    recentActivities: [],
                    paymentStatusBreakdown: {
                      pending: 0,
                      processing: 0,
                      completed: 0,
                      failed: 0
                    },
                    cashBalance: 0,
                    netProfitYTD: 0,
                    monthlyFinancials: [],
                    expenseBreakdown: []
                  })
                  setLoading(false)
                }}
              >
                แสดงค่าว่างชั่วคราว
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="แดชบอร์ด" subtitle="ภาพรวมการเงินและการจัดการอาคารชุด" />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {hasError ? "เกิดข้อผิดพลาดในการโหลดข้อมูล" : "กำลังโหลดข้อมูล..."}
              </p>
              {hasError && (
                <p className="text-sm text-red-500 mb-4">
                  กรุณาตรวจสอบ Console เพื่อดูรายละเอียดข้อผิดพลาด
                </p>
              )}
              <Button onClick={() => {
                setLoading(true)
                setHasError(false)
                loadDashboardData()
              }} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                ลองใหม่
              </Button>
              <Button onClick={runDiagnostics} variant="outline" className="mt-4 ml-2" disabled={runningDiagnostics}>
                {runningDiagnostics ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<AlertTriangle className="mr-2 h-4 w-4" />)}
                ตรวจสอบฐานข้อมูล
              </Button>
              {diagnostics && (
                <div className="mt-6 text-left max-w-xl mx-auto">
                  <p className="font-medium">ผลการตรวจสอบตาราง</p>
                  {!diagnostics.success && (
                    <p className="text-sm text-red-500 mt-2">{diagnostics.error || 'ตรวจสอบล้มเหลว'}</p>
                  )}
                  {diagnostics.success && diagnostics.results && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(diagnostics.results).map(([table, res]) => (
                        <div key={table} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{table}</span>
                          {res.success ? (
                            <span className="text-green-600">OK (ตัวอย่าง {res.count || 0})</span>
                          ) : (
                            <span className="text-red-600">{res.error || 'ERROR'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="แดชบอร์ด" subtitle="ภาพรวมการเงินและการจัดการอาคารชุด" />
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={runningDiagnostics}
            title="ตรวจสอบฐานข้อมูล"
          >
            {runningDiagnostics ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                กำลังตรวจสอบฐานข้อมูล
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                ตรวจสอบฐานข้อมูล
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>การดำเนินการที่ใช้บ่อย</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col p-4"
              onClick={() => router.push('/billing')}
            >
              <Plus className="h-5 w-5 mb-2" />
              <span>สร้างบิล</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col p-4"
              onClick={() => router.push('/payments/transactions')}
            >
              <DollarSign className="h-5 w-5 mb-2" />
              <span>จัดการชำระเงิน</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col p-4"
              onClick={() => router.push('/reports')}
            >
              <FileText className="h-5 w-5 mb-2" />
              <span>รายงาน</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col p-4"
              onClick={() => router.push('/analytics')}
            >
              <BarChart className="h-5 w-5 mb-2" />
              <span>วิเคราะห์ข้อมูล</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col p-4"
              onClick={runDiagnostics}
              disabled={runningDiagnostics}
            >
              {runningDiagnostics ? (
                <Loader2 className="h-5 w-5 mb-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-5 w-5 mb-2" />
              )}
              <span>{runningDiagnostics ? 'กำลังตรวจสอบฐานข้อมูล' : 'ตรวจสอบฐานข้อมูล'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เงินสดในมือ</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.cashBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ยอดรวมบัญชีเงินสดและเงินฝาก
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไรสุทธิ (YTD)</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.netProfitYTD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.netProfitYTD)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              รายรับ - รายจ่าย (ตั้งแต่ต้นปี)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดค้างชำระ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              จาก {data.overdueUnits} ห้อง
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราการเก็บเงิน</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.collectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.paidUnitsThisMonth} / {data.totalUnits} ห้อง
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty data helper */}
      {data.totalUnits === 0 && data.recentActivities.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground">ยังไม่มีข้อมูลแสดงบนแดชบอร์ด</p>
              <div className="mt-3 text-sm text-muted-foreground">
                <p>แนะนำขั้นตอนเริ่มต้น:</p>
                <p>1) เพิ่มห้องพักที่หน้า <Button variant="link" className="p-0" onClick={() => router.push('/units')}>Units</Button></p>
                <p>2) สร้างบิลที่หน้า <Button variant="link" className="p-0" onClick={() => router.push('/billing')}>Billing</Button></p>
                <p>3) บันทึกการชำระเงินที่หน้า <Button variant="link" className="p-0" onClick={() => router.push('/payments/transactions')}>Payments</Button></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>ผลประกอบการ 6 เดือนล่าสุด</CardTitle>
            <CardDescription>เปรียบเทียบรายรับ vs รายจ่าย</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data.monthlyFinancials}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" name="รายรับ" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="รายจ่าย" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนค่าใช้จ่ายเดือนนี้</CardTitle>
            <CardDescription>แยกตามหมวดหมู่ (Top 5)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.expenseBreakdown.length > 0 ? (
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }: { category: string; percent: number }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {data.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                ไม่มีข้อมูลค่าใช้จ่ายในเดือนนี้
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>กิจกรรมล่าสุด</CardTitle>
              <CardDescription>บิลและรายการชำระเงินล่าสุด</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/billing')}
            >
              ดูทั้งหมด
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {activity.type === 'bill' ? (
                      <FileText className="h-5 w-5 text-blue-500" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(activity.amount)}</p>
                      <Badge
                        variant={
                          activity.status === 'completed' || activity.status === 'paid'
                            ? 'default'
                            : activity.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="text-xs"
                      >
                        {activity.status === 'completed' || activity.status === 'paid'
                          ? 'สำเร็จ'
                          : activity.status === 'pending'
                            ? 'รอดำเนินการ'
                            : activity.status === 'processing'
                              ? 'กำลังตรวจสอบ'
                              : activity.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              ยังไม่มีกิจกรรมล่าสุด
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Error Boundary Wrapper
export default function DashboardPage() {
  console.log('[DashboardPage] DashboardPage component rendering')

  return (
    <div className="min-h-screen">
      <DashboardContent />
    </div>
  )
}
