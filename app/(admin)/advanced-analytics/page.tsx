"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  DollarSign,
  Users,
  Wrench,
  Target,
  Calendar,
  RefreshCw,
  Download
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SimpleChart } from "@/components/charts/simple-chart"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

// Mock data interfaces
interface RevenueData {
  month: string
  revenue: number
  budget: number
  variance: number
  growth: number
}

interface OccupancyData {
  status: string
  count: number
  percentage: number
}

interface MaintenanceData {
  month: string
  requests: number
  completed: number
  pending: number
  avgCompletionTime: number
}

interface FinancialComparison {
  category: string
  current: number
  previous: number
  change: number
  changePercent: number
}

interface ForecastingData {
  month: string
  value: number
  confidence: number
  upperBound: number
  lowerBound: number
}

interface AnalyticsSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  occupancyRate: number
  maintenanceEfficiency: number
  growthRate: number
  forecastAccuracy: number
}

export default function AdvancedAnalyticsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Data states
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([])
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData[]>([])
  const [financialData, setFinancialData] = useState<FinancialComparison[]>([])
  const [forecastData, setForecastData] = useState<ForecastingData[]>([])
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null)

  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mock data generators
  const generateMockRevenueData = (): RevenueData[] => {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    return months.map((month, index) => ({
      month,
      revenue: 500000 + Math.random() * 200000,
      budget: 600000 + Math.random() * 100000,
      variance: (Math.random() - 0.5) * 100000,
      growth: (Math.random() - 0.5) * 20
    }))
  }

  const generateMockOccupancyData = (): OccupancyData[] => {
    return [
      { status: 'occupied', count: 85, percentage: 70 },
      { status: 'vacant', count: 25, percentage: 20 },
      { status: 'maintenance', count: 10, percentage: 10 }
    ]
  }

  const generateMockMaintenanceData = (): MaintenanceData[] => {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    return months.map(month => ({
      month,
      requests: Math.floor(Math.random() * 20) + 5,
      completed: Math.floor(Math.random() * 15) + 3,
      pending: Math.floor(Math.random() * 5) + 1,
      avgCompletionTime: Math.random() * 7 + 1
    }))
  }

  const generateMockFinancialData = (): FinancialComparison[] => {
    return [
      {
        category: 'รายรับ',
        current: 6500000,
        previous: 5800000,
        change: 700000,
        changePercent: 12.1
      },
      {
        category: 'รายจ่าย',
        current: 1950000,
        previous: 1740000,
        change: 210000,
        changePercent: 12.1
      },
      {
        category: 'กำไร',
        current: 4550000,
        previous: 4060000,
        change: 490000,
        changePercent: 12.1
      },
      {
        category: 'งบประมาณ',
        current: 7150000,
        previous: 6380000,
        change: 770000,
        changePercent: 12.1
      },
      {
        category: 'ประสิทธิภาพ',
        current: 85,
        previous: 80,
        change: 5,
        changePercent: 6.25
      }
    ]
  }

  const generateMockForecastData = (): ForecastingData[] => {
    const months = ['01', '02', '03', '04', '05', '06']
    return months.map((month, index) => ({
      month,
      value: 600000 + Math.random() * 100000 + (index * 50000),
      confidence: 0.9 - (index * 0.1),
      upperBound: 700000 + Math.random() * 100000 + (index * 50000),
      lowerBound: 500000 + Math.random() * 100000 + (index * 50000)
    }))
  }

  const generateMockSummaryData = (): AnalyticsSummary => {
    return {
      totalRevenue: 6500000,
      totalExpenses: 1950000,
      netProfit: 4550000,
      occupancyRate: 70,
      maintenanceEfficiency: 85,
      growthRate: 12.1,
      forecastAccuracy: 88
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    setErrors({})

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate mock data
      setRevenueData(generateMockRevenueData())
      setOccupancyData(generateMockOccupancyData())
      setMaintenanceData(generateMockMaintenanceData())
      setFinancialData(generateMockFinancialData())
      setForecastData(generateMockForecastData())
      setSummaryData(generateMockSummaryData())

      setLastRefresh(new Date())
      
      toast({
        title: "โหลดข้อมูลสำเร็จ",
        description: "ข้อมูลการวิเคราะห์ถูกอัปเดตแล้ว",
      })
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

  useEffect(() => {
    console.log('[AdvancedAnalytics] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadAllData()
  }, [selectedYear, selectedProject, selectedProjectId])

  const handleExportAll = () => {
    toast({
      title: "กำลังส่งออกข้อมูล",
      description: "กราฟทั้งหมดจะถูกส่งออกเป็นไฟล์ PNG",
    })
  }

  const getRevenueChartData = () => {
    return revenueData.map(item => ({
      month: item.month,
      value: item.revenue,
      label: item.month
    }))
  }

  const getOccupancyChartData = () => {
    return occupancyData.map(item => ({
      status: item.status,
      count: item.count,
      value: item.count,
      label: item.status
    }))
  }

  const getMaintenanceChartData = () => {
    return maintenanceData.map(item => ({
      month: item.month,
      value: item.requests,
      label: item.month
    }))
  }

  const getFinancialChartData = () => {
    return financialData.map(item => ({
      category: item.category,
      value: item.current,
      label: item.category
    }))
  }

  const getForecastChartData = () => {
    return forecastData.map(item => ({
      month: item.month,
      value: item.value,
      label: item.month
    }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="การวิเคราะห์ข้อมูลขั้นสูง"
        subtitle="กราฟแบบ Interactive, การเปรียบเทียบข้อมูล, และการคาดการณ์"
      />

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            การตั้งค่า
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกโครงการ</SelectItem>
                  <SelectItem value="project1">โครงการ A</SelectItem>
                  <SelectItem value="project2">โครงการ B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={loadAllData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรชข้อมูล
            </Button>

            <Button variant="outline" onClick={handleExportAll}>
              <Download className="w-4 h-4 mr-2" />
              ส่งออกทั้งหมด
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายรับรวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                  minimumFractionDigits: 0
                }).format(summaryData.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                อัตราการเติบโต: {summaryData.growthRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">อัตราการเช่า</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.occupancyRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                ห้องเช่า / ห้องทั้งหมด
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ประสิทธิภาพซ่อม</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.maintenanceEfficiency.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                ซ่อมเสร็จ / คำขอทั้งหมด
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ความแม่นยำคาดการณ์</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.forecastAccuracy.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                ความแม่นยำการคาดการณ์
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">รายรับ</TabsTrigger>
          <TabsTrigger value="occupancy">การเช่า</TabsTrigger>
          <TabsTrigger value="maintenance">ซ่อมบำรุง</TabsTrigger>
          <TabsTrigger value="comparison">เปรียบเทียบ</TabsTrigger>
          <TabsTrigger value="forecast">คาดการณ์</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <SimpleChart
            title="รายรับเปรียบเทียบงบประมาณ"
            description="แสดงรายรับจริงเปรียบเทียบกับงบประมาณที่วางไว้"
            data={getRevenueChartData()}
            loading={loading}
            onRefresh={loadAllData}
            chartType="line"
            onExport={() => {
              toast({
                title: "ส่งออกกราฟรายรับ",
                description: "กราฟถูกบันทึกเป็นไฟล์ PNG แล้ว",
              })
            }}
          />
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-4">
          <SimpleChart
            title="สถานะห้องชุด"
            description="แสดงสัดส่วนห้องเช่า ห้องว่าง และห้องซ่อม"
            data={getOccupancyChartData()}
            loading={loading}
            onRefresh={loadAllData}
            chartType="doughnut"
            onExport={() => {
              toast({
                title: "ส่งออกกราฟการเช่า",
                description: "กราฟถูกบันทึกเป็นไฟล์ PNG แล้ว",
              })
            }}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <SimpleChart
            title="แนวโน้มงานซ่อมบำรุง"
            description="แสดงจำนวนคำขอซ่อมและงานที่เสร็จสิ้น"
            data={getMaintenanceChartData()}
            loading={loading}
            onRefresh={loadAllData}
            chartType="bar"
            onExport={() => {
              toast({
                title: "ส่งออกกราฟซ่อมบำรุง",
                description: "กราฟถูกบันทึกเป็นไฟล์ PNG แล้ว",
              })
            }}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <SimpleChart
            title="เปรียบเทียบผลการดำเนินงาน"
            description="แสดงการเปรียบเทียบระหว่างปีปัจจุบันและปีที่แล้ว"
            data={getFinancialChartData()}
            loading={loading}
            onRefresh={loadAllData}
            chartType="bar"
            onExport={() => {
              toast({
                title: "ส่งออกกราฟเปรียบเทียบ",
                description: "กราฟถูกบันทึกเป็นไฟล์ PNG แล้ว",
              })
            }}
          />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <SimpleChart
            title="การคาดการณ์รายรับ"
            description="แสดงการคาดการณ์รายรับในอนาคต 6 เดือนข้างหน้า"
            data={getForecastChartData()}
            loading={loading}
            onRefresh={loadAllData}
            chartType="line"
            onExport={() => {
              toast({
                title: "ส่งออกกราฟคาดการณ์",
                description: "กราฟถูกบันทึกเป็นไฟล์ PNG แล้ว",
              })
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Last Refresh */}
      <div className="text-sm text-muted-foreground text-center">
        อัปเดตล่าสุด: {lastRefresh.toLocaleString('th-TH')}
      </div>
    </div>
  )
}