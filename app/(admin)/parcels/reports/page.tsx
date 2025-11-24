"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package,
  Calendar,
  Download,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  getParcelReports, 
  getDailyParcelStats, 
  getOverdueParcels,
  getParcelEfficiencyMetrics
} from "@/lib/supabase/parcel-reports"
import { ParcelReport, Parcel } from "@/lib/types/parcel"

export default function ParcelReportsPage() {
  const [report, setReport] = useState<ParcelReport | null>(null)
  const [dailyStats, setDailyStats] = useState<any[]>([])
  const [overdueParcels, setOverdueParcels] = useState<Parcel[]>([])
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dateRange, setDateRange] = useState("30")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  
  const { toast } = useToast()

  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      if (dateRange === "custom") {
        if (!customStartDate || !customEndDate) {
          toast({
            title: "ข้อมูลไม่ครบถ้วน",
            description: "กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด",
            variant: "destructive",
          })
          return
        }
        startDate.setTime(new Date(customStartDate).getTime())
        endDate.setTime(new Date(customEndDate).getTime())
      } else {
        startDate.setDate(startDate.getDate() - parseInt(dateRange))
      }

      const [reportResult, dailyResult, overdueResult, efficiencyResult] = await Promise.all([
        getParcelReports(startDate.toISOString(), endDate.toISOString()),
        getDailyParcelStats(parseInt(dateRange)),
        getOverdueParcels(),
        getParcelEfficiencyMetrics()
      ])

      if (reportResult.success) {
        setReport(reportResult.report)
      }
      if (dailyResult.success) {
        setDailyStats(dailyResult.dailyStats)
      }
      if (overdueResult.success) {
        setOverdueParcels(overdueResult.parcels)
      }
      if (efficiencyResult.success) {
        setEfficiencyMetrics(efficiencyResult.metrics)
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportReport = () => {
    if (!report) return
    
    const csvContent = [
      ["รายงานพัสดุ", report.date],
      ["พัสดุทั้งหมด", report.total_parcels],
      ["รอรับ", report.pending_parcels],
      ["ส่งมอบแล้ว", report.delivered_parcels],
      ["รับแล้ว", report.picked_up_parcels],
      ["หมดอายุ", report.expired_parcels],
      [],
      ["บริษัทขนส่งที่ได้รับพัสดุมากที่สุด"],
      ...report.top_courier_companies.map(item => [item.company, item.count]),
      [],
      ["ห้องที่ได้รับพัสดุมากที่สุด"],
      ...report.top_units.map(item => [item.unit_number, item.count])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `parcel-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH')
  }

  const getDaysOverdue = (receivedAt: string) => {
    const received = new Date(receivedAt)
    const now = new Date()
    const diffTime = now.getTime() - received.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="รายงานพัสดุ"
        subtitle="สถิติและรายงานการจัดการพัสดุ"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport} disabled={!report}>
              <Download className="mr-2 h-4 w-4" />
              ส่งออกรายงาน
            </Button>
            <Button onClick={loadReports} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "รีเฟรช"}
            </Button>
          </div>
        }
      />

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>เลือกช่วงเวลา</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="dateRange">ช่วงเวลา</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="30">30 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="90">90 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRange === "custom" && (
              <>
                <div>
                  <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Efficiency Metrics */}
      {efficiencyMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">อัตราการรับพัสดุ</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{efficiencyMetrics.pickup_rate}%</div>
              <p className="text-xs text-muted-foreground">พัสดุที่รับแล้ว</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เวลารับเฉลี่ย</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{efficiencyMetrics.avg_pickup_time_days} วัน</div>
              <p className="text-xs text-muted-foreground">เฉลี่ยต่อพัสดุ</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">อัตราหมดอายุ</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{efficiencyMetrics.expiry_rate}%</div>
              <p className="text-xs text-muted-foreground">พัสดุที่หมดอายุ</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">พัสดุค้าง</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{efficiencyMetrics.overdue_count}</div>
              <p className="text-xs text-muted-foreground">เกิน 7 วัน</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Summary */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">พัสดุทั้งหมด</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.total_parcels}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รอรับ</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{report.pending_parcels}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ส่งมอบแล้ว</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{report.delivered_parcels}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รับแล้ว</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{report.picked_up_parcels}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">หมดอายุ</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{report.expired_parcels}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Courier Companies */}
      {report && report.top_courier_companies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>บริษัทขนส่งที่ได้รับพัสดุมากที่สุด</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>อันดับ</TableHead>
                  <TableHead>บริษัทขนส่ง</TableHead>
                  <TableHead>จำนวนพัสดุ</TableHead>
                  <TableHead>เปอร์เซ็นต์</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.top_courier_companies.map((item, index) => (
                  <TableRow key={item.company}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.company}</TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>
                      {report.total_parcels > 0 
                        ? Math.round((item.count / report.total_parcels) * 100) 
                        : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top Units */}
      {report && report.top_units.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ห้องที่ได้รับพัสดุมากที่สุด</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>อันดับ</TableHead>
                  <TableHead>เลขห้อง</TableHead>
                  <TableHead>จำนวนพัสดุ</TableHead>
                  <TableHead>เปอร์เซ็นต์</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.top_units.map((item, index) => (
                  <TableRow key={item.unit_number}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.unit_number}</TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>
                      {report.total_parcels > 0 
                        ? Math.round((item.count / report.total_parcels) * 100) 
                        : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Overdue Parcels */}
      {overdueParcels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              พัสดุค้างรับเกินกำหนด
            </CardTitle>
            <CardDescription>
              พัสดุที่รอรับเกิน 7 วัน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขห้อง</TableHead>
                  <TableHead>ผู้รับ</TableHead>
                  <TableHead>บริษัทขนส่ง</TableHead>
                  <TableHead>วันที่รับ</TableHead>
                  <TableHead>ค้างรับ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueParcels.map((parcel) => (
                  <TableRow key={parcel.id}>
                    <TableCell className="font-medium">{parcel.unit_number}</TableCell>
                    <TableCell>{parcel.recipient_name}</TableCell>
                    <TableCell>{parcel.courier_company}</TableCell>
                    <TableCell>{formatDate(parcel.received_at)}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {getDaysOverdue(parcel.received_at)} วัน
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
