"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, TrendingUp, AlertTriangle, Users } from "lucide-react"

interface DashboardData {
  totalRevenueThisMonth: number;
  totalUnits: number;
  paidUnitsThisMonth: number;
  totalOutstanding: number;
  overdueUnits: number;
  totalResidents: number;
}

export default function DashboardPageNew() {
  const [data, setData] = useState<DashboardData>({
    totalRevenueThisMonth: 0,
    totalUnits: 0,
    paidUnitsThisMonth: 0,
    totalOutstanding: 0,
    overdueUnits: 0,
    totalResidents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[DashboardPage] Fetching data...')
        setLoading(true)
        
        // Simple mock data for now
        setTimeout(() => {
          setData({
            totalRevenueThisMonth: 150000,
            totalUnits: 50,
            paidUnitsThisMonth: 45,
            totalOutstanding: 50000,
            overdueUnits: 5,
            totalResidents: 120,
          })
          setLoading(false)
          console.log('[DashboardPage] Data loaded successfully')
        }, 1000)
      } catch (error) {
        console.error("[DashboardPage] Error:", error)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const collectionRate = data.totalUnits > 0 
    ? (data.paidUnitsThisMonth / data.totalUnits) * 100 
    : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="แดชบอร์ด" subtitle="ภาพรวมการเงินและการจัดการอาคารชุด" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายรับเดือนนี้</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenueThisMonth)}</div>
            <p className="text-xs text-muted-foreground">รายรับที่บันทึกในเดือนปัจจุบัน</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm处理 font-medium">อัตราการเก็บเงิน (เดือนนี้)</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{data.paidUnitsThisMonth} / {data.totalUnits} ห้อง</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดค้างชำระ (ทั้งหมด)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">จาก {data.overdueUnits} ห้อง</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className=" 문화 font-medium">จำนวนผู้อยู่อาศัย</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalResidents}</div>
            <p className="text-xs text-muted-foreground">รวม {data.totalUnits} ห้อง</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สถิติการใช้งาน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">กราฟแสดงแนวโน้มรายรับ</p>
            <p className="text-sm text-muted-foreground mt-2">จะเพิ่มในภายหลัง</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


















