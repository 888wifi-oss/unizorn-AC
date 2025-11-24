"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, AlertTriangle, Clock, DollarSign, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { Badge } from "@/components/ui/badge"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface ARItem {
  unit_id: string
  unit_number: string
  owner_name: string
  total_outstanding: number
  current: number
  days_30: number
  days_60: number
  days_90: number
  days_over_90: number
  oldest_bill_date?: string
  bill_count: number
}

interface OutstandingBill {
  id: string
  bill_number: string
  unit_id: string
  unit_number: string
  month: string
  total: number
  due_date: string
  days_overdue: number
  status: string
}

export default function AccountsReceivablePage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [arItems, setArItems] = useState<ARItem[]>([])
  const [outstandingBills, setOutstandingBills] = useState<OutstandingBill[]>([])
  const [allOutstandingBills, setAllOutstandingBills] = useState<OutstandingBill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { settings } = useSettings()

  const [summary, setSummary] = useState({
    totalAR: 0,
    totalUnits: 0,
    current: 0,
    days_30: 0,
    days_60: 0,
    days_90: 0,
    days_over_90: 0,
    collectionRate: 0,
  })

  useEffect(() => {
    console.log('[AccountsReceivable] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedProjectId])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // โหลดบิลค้างชำระทั้งหมด
      let billsQuery = supabase
        .from("bills")
        .select("*, units(unit_number, owner_name)")
        .in("status", ["unpaid", "pending"])
        .order("due_date")
      
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        billsQuery = billsQuery.eq('project_id', selectedProjectId)
      }
      
      const { data: billsData } = await billsQuery

      if (billsData) {
        setAllOutstandingBills(billsData as any)
        console.log('[AccountsReceivable] Total bills from DB:', billsData.length)
        
        // Filter by selected project (for non-Super Admin) - already filtered in query but keep for consistency
        let filteredBills = billsData
        if (selectedProjectId && currentUser.role !== 'super_admin') {
          filteredBills = billsData.filter((bill: any) => bill.project_id === selectedProjectId)
          console.log('[AccountsReceivable] Filtered bills:', billsData.length, '→', filteredBills.length)
        }
        
        // คำนวณอายุลูกหนี้
        const today = new Date()
        const billsWithAging = filteredBills.map((bill: any) => {
          const dueDate = new Date(bill.due_date)
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

          return {
            id: bill.id,
            bill_number: bill.bill_number,
            unit_id: bill.unit_id,
            unit_number: bill.units?.unit_number || "N/A",
            month: bill.month,
            total: bill.total,
            due_date: bill.due_date,
            days_overdue: Math.max(0, daysOverdue),
            status: bill.status,
          }
        })

        setOutstandingBills(billsWithAging)

        // จัดกลุ่มตามห้องชุด
        const arByUnit = new Map<string, ARItem>()

        billsWithAging.forEach((bill) => {
          if (!arByUnit.has(bill.unit_id)) {
            arByUnit.set(bill.unit_id, {
              unit_id: bill.unit_id,
              unit_number: bill.unit_number,
              owner_name: billsData.find((b: any) => b.unit_id === bill.unit_id)?.units?.owner_name || "N/A",
              total_outstanding: 0,
              current: 0,
              days_30: 0,
              days_60: 0,
              days_90: 0,
              days_over_90: 0,
              bill_count: 0,
            })
          }

          const item = arByUnit.get(bill.unit_id)!
          item.total_outstanding += bill.total
          item.bill_count += 1

          // จัดกลุ่มตามอายุ
          if (bill.days_overdue === 0) {
            item.current += bill.total
          } else if (bill.days_overdue <= 30) {
            item.days_30 += bill.total
          } else if (bill.days_overdue <= 60) {
            item.days_60 += bill.total
          } else if (bill.days_overdue <= 90) {
            item.days_90 += bill.total
          } else {
            item.days_over_90 += bill.total
          }

          // หาบิลเก่าสุด
          if (!item.oldest_bill_date || bill.due_date < item.oldest_bill_date) {
            item.oldest_bill_date = bill.due_date
          }
        })

        const arArray = Array.from(arByUnit.values())
        setArItems(arArray)
        calculateSummary(arArray, billsData)
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

  const calculateSummary = (arData: ARItem[], allBills: any[]) => {
    const totalAR = arData.reduce((sum, item) => sum + item.total_outstanding, 0)
    const current = arData.reduce((sum, item) => sum + item.current, 0)
    const days_30 = arData.reduce((sum, item) => sum + item.days_30, 0)
    const days_60 = arData.reduce((sum, item) => sum + item.days_60, 0)
    const days_90 = arData.reduce((sum, item) => sum + item.days_90, 0)
    const days_over_90 = arData.reduce((sum, item) => sum + item.days_over_90, 0)

    // คำนวณอัตราการเก็บเงิน (สมมติว่ามีบิลทั้งหมด)
    const totalBills = allBills.length
    const paidBills = allBills.filter((b: any) => b.status === "paid").length
    const collectionRate = totalBills > 0 ? (paidBills / totalBills) * 100 : 0

    setSummary({
      totalAR,
      totalUnits: arData.length,
      current,
      days_30,
      days_60,
      days_90,
      days_over_90,
      collectionRate,
    })
  }

  const filteredARItems = arItems.filter(
    (item) =>
      item.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredBills = outstandingBills.filter(
    (bill) =>
      bill.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const exportAgingReport = () => {
    const headers = [
      "เลขห้อง",
      "ชื่อเจ้าของ",
      "ยอดค้างรวม",
      "ปัจจุบัน",
      "1-30 วัน",
      "31-60 วัน",
      "61-90 วัน",
      "มากกว่า 90 วัน",
      "จำนวนบิล",
    ]

    const rows = arItems.map((item) => [
      item.unit_number,
      item.owner_name,
      item.total_outstanding.toLocaleString(),
      item.current.toLocaleString(),
      item.days_30.toLocaleString(),
      item.days_60.toLocaleString(),
      item.days_90.toLocaleString(),
      item.days_over_90.toLocaleString(),
      item.bill_count,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `รายงานอายุลูกหนี้_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const exportOutstandingBills = () => {
    const headers = ["เลขที่บิล", "เลขห้อง", "เดือน", "ยอดเงิน", "วันครบกำหนด", "จำนวนวันค้าง", "สถานะ"]

    const rows = outstandingBills.map((bill) => [
      bill.bill_number,
      bill.unit_number,
      bill.month,
      bill.total.toLocaleString(),
      formatDate(bill.due_date, settings),
      bill.days_overdue,
      bill.status === "unpaid" ? "ยังไม่ชำระ" : "รอชำระ",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `รายงานบิลค้างชำระ_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
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
      <PageHeader title="ลูกหนี้ค้างชำระ (AR)" description="ติดตามและวิเคราะห์ลูกหนี้ค้างชำระตามอายุ" />

      <div className="container mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ลูกหนี้รวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">฿{summary.totalAR.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">ยอดค้างชำระทั้งหมด</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">จำนวนห้องค้างชำระ</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalUnits}</div>
              <p className="text-xs text-muted-foreground">ห้องที่มียอดค้าง</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ค้างเกิน 90 วัน</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">฿{summary.days_over_90.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">ต้องติดตามเร่งด่วน</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">อัตราการเก็บเงิน</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.collectionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">บิลที่ชำระแล้ว</p>
            </CardContent>
          </Card>
        </div>

        {/* Aging Summary */}
        <Card>
          <CardHeader>
            <CardTitle>สรุปอายุลูกหนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">ปัจจุบัน</div>
                <div className="text-xl font-bold text-green-600">฿{summary.current.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">1-30 วัน</div>
                <div className="text-xl font-bold text-yellow-600">฿{summary.days_30.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">31-60 วัน</div>
                <div className="text-xl font-bold text-orange-600">฿{summary.days_60.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">61-90 วัน</div>
                <div className="text-xl font-bold text-red-600">฿{summary.days_90.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-red-100 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">&gt; 90 วัน</div>
                <div className="text-xl font-bold text-red-700">฿{summary.days_over_90.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="ค้นหาเลขห้อง, ชื่อเจ้าของ, เลขที่บิล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="aging" className="space-y-4">
          <TabsList>
            <TabsTrigger value="aging">รายงานอายุลูกหนี้</TabsTrigger>
            <TabsTrigger value="bills">รายการบิลค้างชำระ</TabsTrigger>
          </TabsList>

          <TabsContent value="aging" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={exportAgingReport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                ส่งออกรายงาน
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขห้อง</TableHead>
                      <TableHead>ชื่อเจ้าของ</TableHead>
                      <TableHead className="text-right">ยอดค้างรวม</TableHead>
                      <TableHead className="text-right">ปัจจุบัน</TableHead>
                      <TableHead className="text-right">1-30 วัน</TableHead>
                      <TableHead className="text-right">31-60 วัน</TableHead>
                      <TableHead className="text-right">61-90 วัน</TableHead>
                      <TableHead className="text-right">&gt; 90 วัน</TableHead>
                      <TableHead className="text-center">จำนวนบิล</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredARItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          ไม่มีลูกหนี้ค้างชำระ
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredARItems.map((item) => (
                        <TableRow key={item.unit_id}>
                          <TableCell className="font-medium">{item.unit_number}</TableCell>
                          <TableCell>{item.owner_name}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            ฿{item.total_outstanding.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">฿{item.current.toLocaleString()}</TableCell>
                          <TableCell className="text-right">฿{item.days_30.toLocaleString()}</TableCell>
                          <TableCell className="text-right">฿{item.days_60.toLocaleString()}</TableCell>
                          <TableCell className="text-right">฿{item.days_90.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-destructive">
                            ฿{item.days_over_90.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item.bill_count}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={exportOutstandingBills} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                ส่งออกรายงาน
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขที่บิล</TableHead>
                      <TableHead>เลขห้อง</TableHead>
                      <TableHead>เดือน</TableHead>
                      <TableHead className="text-right">ยอดเงิน</TableHead>
                      <TableHead>วันครบกำหนด</TableHead>
                      <TableHead className="text-center">จำนวนวันค้าง</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          ไม่มีบิลค้างชำระ
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-mono">{bill.bill_number}</TableCell>
                          <TableCell className="font-medium">{bill.unit_number}</TableCell>
                          <TableCell>{bill.month}</TableCell>
                          <TableCell className="text-right font-semibold">฿{bill.total.toLocaleString()}</TableCell>
                          <TableCell>{formatDate(bill.due_date, settings)}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                bill.days_overdue === 0
                                  ? "secondary"
                                  : bill.days_overdue <= 30
                                    ? "default"
                                    : bill.days_overdue <= 60
                                      ? "default"
                                      : "destructive"
                              }
                            >
                              {bill.days_overdue} วัน
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={bill.status === "unpaid" ? "destructive" : "secondary"}>
                              {bill.status === "unpaid" ? "ยังไม่ชำระ" : "รอชำระ"}
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
        </Tabs>
      </div>
    </div>
  )
}
