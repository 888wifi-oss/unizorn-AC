"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Search, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface ExpenseReport {
  id: string
  report_date: string
  category: string
  amount: number
  description: string
  status: string
  created_by: string
}

export default function ExpenseReportsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [reports, setReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    console.log('[ExpenseReports] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadReports()
  }, [selectedProjectId])

  const loadReports = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockReports: ExpenseReport[] = [
        {
          id: "1",
          report_date: "2024-01-15",
          category: "ค่าซ่อมแซม",
          amount: 15000,
          description: "รายงานรายจ่ายค่าซ่อมแซมประจำเดือน",
          status: "completed",
          created_by: "สมชาย ใจดี"
        },
        {
          id: "2",
          report_date: "2024-01-14",
          category: "ค่าสาธารณูปโภค",
          amount: 25000,
          description: "รายงานรายจ่ายค่าสาธารณูปโภคประจำเดือน",
          status: "pending",
          created_by: "สมหญิง รักดี"
        },
        {
          id: "3",
          report_date: "2024-01-13",
          category: "ค่าบริการ",
          amount: 8000,
          description: "รายงานรายจ่ายค่าบริการประจำเดือน",
          status: "completed",
          created_by: "สมศักดิ์ ดีใจ"
        }
      ]
      setReports(mockReports)
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

  const filteredReports = reports.filter(report => {
    const categoryMatch = filterCategory === "all" || report.category === filterCategory
    const statusMatch = filterStatus === "all" || report.status === filterStatus
    return categoryMatch && statusMatch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600">เสร็จสิ้น</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">รอดำเนินการ</Badge>
      case 'draft':
        return <Badge variant="outline" className="text-gray-600">ร่าง</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalAmount = filteredReports.reduce((sum, report) => sum + report.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="รายงานรายจ่าย"
        subtitle="รายงานสรุปรายจ่ายต่างๆ"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายจ่ายรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">฿{totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              จาก {filteredReports.length} รายการ
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายการเสร็จสิ้น</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              รายการที่เสร็จสิ้นแล้ว
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reports.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              รายการที่รอดำเนินการ
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายงานรายจ่าย</CardTitle>
              <CardDescription>รายงานสรุปรายจ่ายทั้งหมด</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="หมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="ค่าซ่อมแซม">ค่าซ่อมแซม</SelectItem>
                  <SelectItem value="ค่าสาธารณูปโภค">ค่าสาธารณูปโภค</SelectItem>
                  <SelectItem value="ค่าบริการ">ค่าบริการ</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="draft">ร่าง</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                ค้นหา
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                ส่งออก
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่รายงาน</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ผู้สร้าง</TableHead>
                <TableHead>การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{new Date(report.report_date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>{report.category}</TableCell>
                  <TableCell className="text-red-600 font-medium">฿{report.amount.toLocaleString()}</TableCell>
                  <TableCell>{report.description}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{report.created_by}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
