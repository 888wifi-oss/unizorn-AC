"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, BarChart2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/lib/currency-formatter"
import { getBudgetVsActualReport } from "@/lib/supabase/actions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface BudgetReportItem {
  account_code: string;
  account_name: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
}

export default function BudgetReportPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [reportData, setReportData] = useState<BudgetReportItem[]>([])
  const [allReportData, setAllReportData] = useState<BudgetReportItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 543)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()

  const months = Array.from({ length: 12 }, (_, i) => ({ 
    value: i + 1, 
    label: new Date(0, i).toLocaleString('th-TH', { month: 'long' }) 
  }))

  const handleGenerateReport = async () => {
    setIsLoading(true)
    try {
      const data = await getBudgetVsActualReport(selectedYear, selectedMonth)
      setAllReportData(data)
      console.log('[BudgetReport] Total report data from DB:', data.length)
      
      // Filter by selected project (for non-Super Admin)
      let filtered = data
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        filtered = data.filter((item: any) => item.project_id === selectedProjectId)
        console.log('[BudgetReport] Filtered report data:', data.length, '→', filtered.length)
      } else {
        console.log('[BudgetReport] No filtering (Super Admin)')
      }
      
      setReportData(filtered)
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    console.log('[BudgetReport] useEffect triggered. selectedProjectId:', selectedProjectId)
    handleGenerateReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, selectedProjectId]);

  const totals = reportData.reduce(
    (acc, item) => ({
      budget: acc.budget + item.budget_amount,
      actual: acc.actual + item.actual_amount,
      variance: acc.variance + item.variance,
    }),
    { budget: 0, actual: 0, variance: 0 }
  );

  return (
    <div>
      <PageHeader
        title="รายงานเปรียบเทียบงบประมาณ"
        subtitle="เปรียบเทียบงบประมาณรายจ่ายกับค่าใช้จ่ายที่เกิดขึ้นจริง"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>เลือกงวดบัญชี:</Label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{Array.from({length: 5}, (_, i) => new Date().getFullYear() + 543 - i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <Button onClick={() => {}} variant="outline" disabled><Download className="mr-2 h-4 w-4" /> ส่งออก (เร็วๆ นี้)</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสบัญชี</TableHead>
                <TableHead>ชื่อบัญชี</TableHead>
                <TableHead className="text-right">งบประมาณ</TableHead>
                <TableHead className="text-right">จ่ายจริง</TableHead>
                <TableHead className="text-right">ผลต่าง</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">กำลังสร้างรายงาน...</TableCell></TableRow>
              ) : reportData.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">ไม่พบข้อมูลในเดือนที่เลือก</TableCell></TableRow>
              ) : (
                <>
                  {reportData.map((item) => (
                    <TableRow key={item.account_code}>
                      <TableCell className="font-mono">{item.account_code}</TableCell>
                      <TableCell className="font-medium">{item.account_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.budget_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.actual_amount)}</TableCell>
                      <TableCell className={`text-right font-semibold ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.variance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted hover:bg-muted font-bold text-base">
                    <TableCell colSpan={2} className="text-right">ยอดรวม</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.budget)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.actual)}</TableCell>
                    <TableCell className={`text-right ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totals.variance)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
