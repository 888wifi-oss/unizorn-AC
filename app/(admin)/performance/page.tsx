"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { 
  Activity, 
  Zap, 
  Database, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PerformanceStats {
  total: number
  lastHour: number
  lastDay: number
  averageResponseTime: number
  slowestOperations: Array<{
    operation: string
    duration: number
    timestamp: string
  }>
  errorRate: number
  operationsByType: Record<string, {
    count: number
    avgDuration: number
  }>
}

export default function PerformancePage() {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadPerformanceStats = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockStats: PerformanceStats = {
        total: 1250,
        lastHour: 45,
        lastDay: 320,
        averageResponseTime: 245,
        slowestOperations: [
          { operation: "getUserAggregatedPermissions", duration: 2150, timestamp: "2024-01-15T10:30:00Z" },
          { operation: "getBillsOptimized", duration: 1800, timestamp: "2024-01-15T10:25:00Z" },
          { operation: "getUnitsOptimized", duration: 1200, timestamp: "2024-01-15T10:20:00Z" },
          { operation: "setUserGroupPermissions", duration: 950, timestamp: "2024-01-15T10:15:00Z" },
          { operation: "getDashboardStatsOptimized", duration: 800, timestamp: "2024-01-15T10:10:00Z" }
        ],
        errorRate: 2,
        operationsByType: {
          "getUserAggregatedPermissions": { count: 150, avgDuration: 1200 },
          "getBillsOptimized": { count: 200, avgDuration: 450 },
          "getUnitsOptimized": { count: 180, avgDuration: 320 },
          "setUserGroupPermissions": { count: 50, avgDuration: 800 },
          "getDashboardStatsOptimized": { count: 100, avgDuration: 250 }
        }
      }
      
      setStats(mockStats)
      setLastRefresh(new Date())
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลประสิทธิภาพได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPerformanceStats()
    
    // Auto refresh every 30 seconds
    const interval = setInterval(loadPerformanceStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const getPerformanceColor = (duration: number) => {
    if (duration < 500) return "text-green-600"
    if (duration < 1000) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceBadge = (duration: number) => {
    if (duration < 500) return <Badge variant="outline" className="text-green-600">เร็ว</Badge>
    if (duration < 1000) return <Badge variant="outline" className="text-yellow-600">ปานกลาง</Badge>
    return <Badge variant="outline" className="text-red-600">ช้า</Badge>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Dashboard"
        subtitle="ติดตามประสิทธิภาพระบบและฐานข้อมูล"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การดำเนินการทั้งหมด</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              ครั้งที่ผ่านมา
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เวลาตอบสนองเฉลี่ย</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageResponseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">
              มิลลิวินาที
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราข้อผิดพลาด</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.errorRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              ของการดำเนินการทั้งหมด
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การดำเนินการชั่วโมงที่แล้ว</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lastHour || 0}</div>
            <p className="text-xs text-muted-foreground">
              ครั้งในชั่วโมงที่แล้ว
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="slow-queries">การดำเนินการช้า</TabsTrigger>
          <TabsTrigger value="operations">การดำเนินการตามประเภท</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ประสิทธิภาพโดยรวม</CardTitle>
                  <CardDescription>สถิติประสิทธิภาพระบบ</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadPerformanceStats}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  รีเฟรช
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>ประสิทธิภาพโดยรวม</span>
                    <span>{stats?.averageResponseTime || 0}ms</span>
                  </div>
                  <Progress 
                    value={Math.min((stats?.averageResponseTime || 0) / 10, 100)} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>อัตราความสำเร็จ</span>
                    <span>{100 - (stats?.errorRate || 0)}%</span>
                  </div>
                  <Progress 
                    value={100 - (stats?.errorRate || 0)} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slow-queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>การดำเนินการที่ช้าที่สุด</CardTitle>
              <CardDescription>การดำเนินการที่ใช้เวลานานกว่า 1 วินาที</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>การดำเนินการ</TableHead>
                    <TableHead>เวลาที่ใช้</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>เวลา</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.slowestOperations.map((op, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{op.operation}</TableCell>
                      <TableCell className={getPerformanceColor(op.duration)}>
                        {op.duration.toLocaleString()}ms
                      </TableCell>
                      <TableCell>{getPerformanceBadge(op.duration)}</TableCell>
                      <TableCell>{new Date(op.timestamp).toLocaleString('th-TH')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>การดำเนินการตามประเภท</CardTitle>
              <CardDescription>สถิติการดำเนินการแยกตามประเภท</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ประเภทการดำเนินการ</TableHead>
                    <TableHead>จำนวนครั้ง</TableHead>
                    <TableHead>เวลาตอบสนองเฉลี่ย</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats && Object.entries(stats.operationsByType).map(([operation, data]) => (
                    <TableRow key={operation}>
                      <TableCell className="font-medium">{operation}</TableCell>
                      <TableCell>{data.count.toLocaleString()}</TableCell>
                      <TableCell className={getPerformanceColor(data.avgDuration)}>
                        {data.avgDuration.toLocaleString()}ms
                      </TableCell>
                      <TableCell>{getPerformanceBadge(data.avgDuration)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Refresh */}
      <div className="text-sm text-muted-foreground text-center">
        อัปเดตล่าสุด: {lastRefresh.toLocaleString('th-TH')}
      </div>
    </div>
  )
}
