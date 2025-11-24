"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  Wrench, 
  Bell,
  RefreshCw,
  Download,
  Calendar,
  DollarSign,
  Home,
  Clock
} from "lucide-react"
import { getAdvancedAnalytics } from "@/lib/supabase/analytics-actions"
import { useSettings } from "@/lib/settings-context"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { AnalyticsData } from "@/lib/types/analytics"
import { testAnalyticsTables } from "@/lib/supabase/test-analytics"
import { testAnalyticsConnection } from "@/lib/supabase/test-analytics-connection"
import { testAvailableTables } from "@/lib/supabase/test-available-tables"
import { exportToCSVWithThaiSupport } from "@/lib/utils/csv-export"
import { toast } from "@/hooks/use-toast"

// Simple chart components (we'll use basic HTML/CSS for now)
const SimpleBarChart = ({ data, title, color = "bg-blue-500" }: { 
  data: Array<{ [key: string]: any }>, 
  title: string, 
  color?: string 
}) => {
  const maxValue = Math.max(...data.map(d => d.amount || d.count || 0))
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-600">{title}</h4>
      <div className="space-y-1">
        {data.slice(0, 5).map((item, index) => {
          const value = item.amount || item.count || 0
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
          const label = item.month || item.unit || item.category || item.courier || item.type || 'ไม่ระบุ'
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-20 text-xs text-gray-600 truncate">{label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-16 text-xs text-gray-600 text-right">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = "text-blue-600",
  bgColor = "bg-blue-50"
}: {
  title: string
  value: string | number
  change?: { value: number; type: 'increase' | 'decrease' }
  icon: any
  color?: string
  bgColor?: string
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {change && (
              <div className="flex items-center mt-1">
                {change.type === 'increase' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                  {change.value}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${bgColor}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { settings } = useSettings()

  const loadAnalytics = async () => {
    if (loading) {
      // ป้องกันการเรียกซ้อน
    }
    setLoading(true)
    const tStart = Date.now()
    try {
      const projectId = selectedProjectId || null
      const restrictToProject = currentUser.role !== 'super_admin'
      const result = await getAdvancedAnalytics(projectId, restrictToProject)
      if (result.success && result.data) {
        setAnalyticsData(result.data)
        setLastUpdated(new Date())
        console.log('[perf][analytics] page fetch success:', { duration_ms: Date.now() - tStart, projectId, restrictToProject })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถโหลดข้อมูลได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('[analytics] load error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      console.log('[perf][analytics] total load:', { duration_ms: Date.now() - tStart })
      setLoading(false)
    }
  }

  const handleTestTables = async () => {
    setLoading(true)
    try {
      const result = await testAnalyticsTables()
      if (result.success && result.results) {
        const failedTables = Object.entries(result.results)
          .filter(([_, result]) => !result.success)
          .map(([table, result]) => `${table}: ${result.error}`)
        
        if (failedTables.length > 0) {
          toast({
            title: "ตารางที่มีปัญหา",
            description: failedTables.join(', '),
            variant: "destructive",
          })
        } else {
          toast({
            title: "ทดสอบสำเร็จ",
            description: "ตารางทั้งหมดพร้อมใช้งาน",
          })
        }
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถทดสอบตารางได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setLoading(true)
    try {
      const result = await testAnalyticsConnection()
      if (result.success) {
        toast({
          title: "เชื่อมต่อสำเร็จ",
          description: result.message || "การเชื่อมต่อฐานข้อมูลทำงานได้ปกติ",
        })
      } else {
        toast({
          title: "เชื่อมต่อล้มเหลว",
          description: result.error || "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestAvailableTables = async () => {
    setLoading(true)
    try {
      const result = await testAvailableTables()
      if (result.success && result.results) {
        const availableTables = Object.entries(result.results)
          .filter(([_, result]) => result.success)
          .map(([table, _]) => table)
        
        const unavailableTables = Object.entries(result.results)
          .filter(([_, result]) => !result.success)
          .map(([table, result]) => `${table}: ${result.error}`)
        
        if (unavailableTables.length > 0) {
          toast({
            title: "ตารางที่มีปัญหา",
            description: unavailableTables.join(', '),
            variant: "destructive",
          })
        } else {
          toast({
            title: "ทดสอบสำเร็จ",
            description: `ตารางทั้งหมดพร้อมใช้งาน: ${availableTables.join(', ')}`,
          })
        }
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถทดสอบตารางได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('[Analytics] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadAnalytics()
  }, [selectedProjectId])

  const exportToCSV = () => {
    if (!analyticsData) return
    
    const csvData = [
      ['รายงานการวิเคราะห์ข้อมูล', ''],
      ['วันที่อัปเดต', lastUpdated?.toLocaleDateString('th-TH') || ''],
      [''],
      ['ข้อมูลทางการเงิน', ''],
      ['รายได้รวม', analyticsData.financial.totalRevenue.toLocaleString()],
      ['ค่าใช้จ่ายรวม', analyticsData.financial.totalExpenses.toLocaleString()],
      ['กำไรสุทธิ', analyticsData.financial.netProfit.toLocaleString()],
      [''],
      ['ข้อมูลห้องชุด', ''],
      ['ห้องทั้งหมด', analyticsData.units.totalUnits.toString()],
      ['ห้องที่อยู่อาศัย', analyticsData.units.occupiedUnits.toString()],
      ['ห้องว่าง', analyticsData.units.vacantUnits.toString()],
      ['ห้องซ่อมบำรุง', analyticsData.units.maintenanceUnits.toString()],
      ['อัตราการเข้าอยู่', `${analyticsData.units.occupancyRate.toFixed(1)}%`],
      [''],
      ['ข้อมูลพัสดุ', ''],
      ['พัสดุทั้งหมด', analyticsData.parcels.totalParcels.toString()],
      ['พัสดุรอรับ', analyticsData.parcels.pendingParcels.toString()],
      ['พัสดุรับแล้ว', analyticsData.parcels.pickedUpParcels.toString()],
      ['พัสดุเกินกำหนด', analyticsData.parcels.overdueParcels.toString()],
      [''],
      ['ข้อมูลการซ่อมบำรุง', ''],
      ['คำขอทั้งหมด', analyticsData.maintenance.totalRequests.toString()],
      ['คำขอที่รอดำเนินการ', analyticsData.maintenance.pendingRequests.toString()],
      ['คำขอที่เสร็จสิ้น', analyticsData.maintenance.completedRequests.toString()],
      ['เวลาดำเนินการเฉลี่ย', `${analyticsData.maintenance.averageResolutionTime.toFixed(1)} วัน`],
      [''],
      ['ข้อมูลการแจ้งเตือน', ''],
      ['การแจ้งเตือนทั้งหมด', analyticsData.notifications.totalNotifications.toString()],
      ['การแจ้งเตือนที่ยังไม่อ่าน', analyticsData.notifications.unreadNotifications.toString()],
    ]
    
    const filename = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`
    const success = exportToCSVWithThaiSupport(csvData, filename)
    
    if (success) {
      toast({
        title: 'ส่งออกสำเร็จ',
        description: 'ไฟล์ CSV ถูกส่งออกเรียบร้อยแล้ว',
      })
    } else {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกไฟล์ CSV ได้',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="การวิเคราะห์ข้อมูลขั้นสูง"
          subtitle="ภาพรวมและสถิติของระบบ"
        />
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="การวิเคราะห์ข้อมูลขั้นสูง"
          subtitle="ภาพรวมและสถิติของระบบ"
          action={
            <Button onClick={loadAnalytics}>
              <RefreshCw className="mr-2 h-4 w-4" />
              โหลดใหม่
            </Button>
          }
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">ไม่สามารถโหลดข้อมูลได้</p>
            <Button onClick={loadAnalytics} className="mt-4">
              ลองใหม่
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="การวิเคราะห์ข้อมูลขั้นสูง"
        subtitle="ภาพรวมและสถิติของระบบ"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTestConnection} disabled={loading}>
              <BarChart3 className="mr-2 h-4 w-4" />
              ทดสอบการเชื่อมต่อ
            </Button>
            <Button variant="outline" onClick={handleTestAvailableTables} disabled={loading}>
              <BarChart3 className="mr-2 h-4 w-4" />
              ทดสอบตารางที่มีอยู่
            </Button>
            <Button variant="outline" onClick={handleTestTables} disabled={loading}>
              <BarChart3 className="mr-2 h-4 w-4" />
              ทดสอบตาราง
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              ส่งออก CSV
            </Button>
            <Button onClick={loadAnalytics} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
        }
      />

      {lastUpdated && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH')}</span>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="financial">การเงิน</TabsTrigger>
          <TabsTrigger value="units">ห้องชุด</TabsTrigger>
          <TabsTrigger value="parcels">พัสดุ</TabsTrigger>
          <TabsTrigger value="maintenance">ซ่อมบำรุง</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="รายได้รวม"
              value={`฿${analyticsData.financial.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <MetricCard
              title="ห้องทั้งหมด"
              value={analyticsData.units.totalUnits}
              icon={Home}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <MetricCard
              title="พัสดุทั้งหมด"
              value={analyticsData.parcels.totalParcels}
              icon={Package}
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
            <MetricCard
              title="คำขอซ่อมบำรุง"
              value={analyticsData.maintenance.totalRequests}
              icon={Wrench}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  สถิติสำคัญ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">อัตราการเข้าอยู่</span>
                  <Badge variant="outline">{analyticsData.units.occupancyRate.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">กำไรสุทธิ</span>
                  <Badge variant={analyticsData.financial.netProfit >= 0 ? "default" : "destructive"}>
                    ฿{analyticsData.financial.netProfit.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">พัสดุเกินกำหนด</span>
                  <Badge variant={analyticsData.parcels.overdueParcels > 0 ? "destructive" : "default"}>
                    {analyticsData.parcels.overdueParcels} รายการ
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">เวลาดำเนินการเฉลี่ย</span>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {analyticsData.maintenance.averageResolutionTime.toFixed(1)} วัน
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  การแจ้งเตือน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ทั้งหมด</span>
                  <span className="font-medium">{analyticsData.notifications.totalNotifications}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ยังไม่อ่าน</span>
                  <Badge variant={analyticsData.notifications.unreadNotifications > 0 ? "destructive" : "default"}>
                    {analyticsData.notifications.unreadNotifications}
                  </Badge>
                </div>
                <SimpleBarChart 
                  data={analyticsData.notifications.notificationsByType} 
                  title="ประเภทการแจ้งเตือน"
                  color="bg-yellow-500"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="รายได้รวม"
              value={`฿${analyticsData.financial.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <MetricCard
              title="ค่าใช้จ่ายรวม"
              value={`฿${analyticsData.financial.totalExpenses.toLocaleString()}`}
              icon={TrendingDown}
              color="text-red-600"
              bgColor="bg-red-50"
            />
            <MetricCard
              title="กำไรสุทธิ"
              value={`฿${analyticsData.financial.netProfit.toLocaleString()}`}
              icon={analyticsData.financial.netProfit >= 0 ? TrendingUp : TrendingDown}
              color={analyticsData.financial.netProfit >= 0 ? "text-green-600" : "text-red-600"}
              bgColor={analyticsData.financial.netProfit >= 0 ? "bg-green-50" : "bg-red-50"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>รายได้รายเดือน</CardTitle>
                <CardDescription>12 เดือนล่าสุด</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.financial.monthlyRevenue} 
                  title="รายได้"
                  color="bg-green-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ค่าใช้จ่ายรายเดือน</CardTitle>
                <CardDescription>12 เดือนล่าสุด</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.financial.monthlyExpenses} 
                  title="ค่าใช้จ่าย"
                  color="bg-red-500"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>รายได้ตามห้อง</CardTitle>
                <CardDescription>10 ห้องที่มีรายได้สูงสุด</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.financial.revenueByUnit} 
                  title="รายได้"
                  color="bg-blue-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ค่าใช้จ่ายตามหมวดหมู่</CardTitle>
                <CardDescription>หมวดหมู่ค่าใช้จ่าย</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.financial.expenseCategories} 
                  title="ค่าใช้จ่าย"
                  color="bg-orange-500"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="ห้องทั้งหมด"
              value={analyticsData.units.totalUnits}
              icon={Home}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <MetricCard
              title="ห้องที่อยู่อาศัย"
              value={analyticsData.units.occupiedUnits}
              icon={Users}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <MetricCard
              title="ห้องว่าง"
              value={analyticsData.units.vacantUnits}
              icon={Home}
              color="text-gray-600"
              bgColor="bg-gray-50"
            />
            <MetricCard
              title="ห้องซ่อมบำรุง"
              value={analyticsData.units.maintenanceUnits}
              icon={Wrench}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ห้องตามชั้น</CardTitle>
                <CardDescription>จำนวนห้องในแต่ละชั้น</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.units.unitsByFloor} 
                  title="จำนวนห้อง"
                  color="bg-blue-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>สถานะห้อง</CardTitle>
                <CardDescription>การกระจายสถานะห้อง</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.units.unitsByStatus} 
                  title="จำนวนห้อง"
                  color="bg-green-500"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parcels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="พัสดุทั้งหมด"
              value={analyticsData.parcels.totalParcels}
              icon={Package}
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
            <MetricCard
              title="รอรับ"
              value={analyticsData.parcels.pendingParcels}
              icon={Clock}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
            />
            <MetricCard
              title="รับแล้ว"
              value={analyticsData.parcels.pickedUpParcels}
              icon={TrendingUp}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <MetricCard
              title="เกินกำหนด"
              value={analyticsData.parcels.overdueParcels}
              icon={TrendingDown}
              color="text-red-600"
              bgColor="bg-red-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>พัสดุรายเดือน</CardTitle>
                <CardDescription>12 เดือนล่าสุด</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.parcels.parcelsByMonth} 
                  title="จำนวนพัสดุ"
                  color="bg-purple-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ห้องที่รับพัสดุมากที่สุด</CardTitle>
                <CardDescription>10 ห้องแรก</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.parcels.topReceivingUnits} 
                  title="จำนวนพัสดุ"
                  color="bg-blue-500"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>บริษัทขนส่งที่ใช้มากที่สุด</CardTitle>
              <CardDescription>10 บริษัทแรก</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart 
                data={analyticsData.parcels.topCouriers} 
                title="จำนวนพัสดุ"
                color="bg-green-500"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="คำขอทั้งหมด"
              value={analyticsData.maintenance.totalRequests}
              icon={Wrench}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
            <MetricCard
              title="รอดำเนินการ"
              value={analyticsData.maintenance.pendingRequests}
              icon={Clock}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
            />
            <MetricCard
              title="เสร็จสิ้น"
              value={analyticsData.maintenance.completedRequests}
              icon={TrendingUp}
              color="text-green-600"
              bgColor="bg-green-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>คำขอตามหมวดหมู่</CardTitle>
                <CardDescription>หมวดหมู่การซ่อมบำรุง</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.maintenance.requestsByCategory} 
                  title="จำนวนคำขอ"
                  color="bg-orange-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>คำขอรายเดือน</CardTitle>
                <CardDescription>12 เดือนล่าสุด</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={analyticsData.maintenance.requestsByMonth} 
                  title="จำนวนคำขอ"
                  color="bg-blue-500"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
