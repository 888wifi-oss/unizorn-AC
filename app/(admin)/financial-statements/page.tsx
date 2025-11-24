"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getIncomeStatementData, getBalanceSheetData } from "@/lib/supabase/actions"
import { Loader2, Search, Printer } from "lucide-react"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

// Safe number formatting function
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "0.00"
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2 })
}

interface IncomeStatementData {
  revenues: { account_code: string; account_name: string; total: number }[]
  expenses: { account_code: string; account_name: string; total: number }[]
  totalRevenue: number
  totalExpense: number
  netIncome: number
}

interface BalanceSheetData {
  assets: { account_code: string; account_name: string; total: number }[],
  liabilities: { account_code: string; account_name: string; total: number }[],
  equity: { account_code: string; account_name: string; total: number }[],
  totalAssets: number,
  totalLiabilities: number,
  totalEquity: number
}


export default function FinancialStatementsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  // State for Income Statement
  const [isISLoading, setIsISLoading] = useState(false)
  const [incomeStatementData, setIncomeStatementData] = useState<IncomeStatementData | null>(null)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])

  // State for Balance Sheet
  const [isBSLoading, setIsBSLoading] = useState(false)
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null)
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0])

  const { toast } = useToast()

  useEffect(() => {
    console.log('[FinancialStatements] useEffect triggered. selectedProjectId:', selectedProjectId)
  }, [selectedProjectId])

  const handleGenerateIS = async () => {
    setIsISLoading(true)
    setIncomeStatementData(null)
    try {
      console.log('[FinancialStatements] Generating Income Statement with project_id:', selectedProjectId)
      const data = await getIncomeStatementData(startDate, endDate, selectedProjectId || undefined)
      setIncomeStatementData(data)
    } catch (error) {
      console.error("Error generating income statement:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถสร้างงบกำไรขาดทุนได้", variant: "destructive" })
    } finally {
      setIsISLoading(false)
    }
  }

  const handleGenerateBS = async () => {
    setIsBSLoading(true)
    setBalanceSheetData(null)
    try {
      console.log('[FinancialStatements] Generating Balance Sheet with project_id:', selectedProjectId)
      const data = await getBalanceSheetData(asOfDate, selectedProjectId || undefined)
      setBalanceSheetData(data)
    } catch (error) {
      console.error("Error generating balance sheet:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถสร้างงบดุลได้", variant: "destructive" })
    } finally {
      setIsBSLoading(false)
    }
  }

  const handlePrint = (reportId: string, title: string, period: string) => {
    const printWindow = window.open('', '_blank');
    const reportContent = document.getElementById(reportId)?.innerHTML;

    printWindow?.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .final-total { font-size: 1.1em; font-weight: bold; border-top: 2px solid black; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>${period}</p>
          </div>
          ${reportContent}
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.focus();
    setTimeout(() => { printWindow?.print(); }, 500);
  }

  return (
    <div>
      <PageHeader title="รายงานทางการเงิน" subtitle="สร้างงบกำไรขาดทุนและงบดุล" />

      <Tabs defaultValue="income-statement">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income-statement">งบกำไรขาดทุน</TabsTrigger>
          <TabsTrigger value="balance-sheet">งบดุล</TabsTrigger>
        </TabsList>

        {/* Income Statement Tab */}
        <TabsContent value="income-statement">
          <Card>
            <CardHeader>
              <CardTitle>สร้างงบกำไรขาดทุน</CardTitle>
              <CardDescription>เลือกช่วงวันที่เพื่อดูผลประกอบการ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <Button onClick={handleGenerateIS} disabled={isISLoading} className="gap-2">
                  {isISLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  สร้างรายงาน
                </Button>
                {incomeStatementData && (
                  <Button onClick={() => handlePrint('is-report', 'งบกำไรขาดทุน', `สำหรับช่วงวันที่ ${new Date(startDate).toLocaleDateString("th-TH")} ถึง ${new Date(endDate).toLocaleDateString("th-TH")}`)} variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" /> พิมพ์
                  </Button>
                )}
              </div>

              {isISLoading && <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

              {incomeStatementData && (
                <div id="is-report">
                  {/* Revenue */}
                  <h3 className="text-lg font-semibold mb-2">รายรับ</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>ชื่อบัญชี</TableHead><TableHead className="text-right">จำนวนเงิน</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {incomeStatementData.revenues.map(item => <TableRow key={item.account_code}><TableCell>{item.account_code} - {item.account_name}</TableCell><TableCell className="text-right">{formatCurrency(item.total)}</TableCell></TableRow>)}
                      <TableRow className="total-row"><TableCell className="font-bold">รายรับรวม</TableCell><TableCell className="text-right font-bold">{formatCurrency(incomeStatementData.totalRevenue)}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                  {/* Expenses */}
                  <h3 className="text-lg font-semibold mt-6 mb-2">ค่าใช้จ่าย</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>ชื่อบัญชี</TableHead><TableHead className="text-right">จำนวนเงิน</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {incomeStatementData.expenses.map(item => <TableRow key={item.account_code}><TableCell>{item.account_code} - {item.account_name}</TableCell><TableCell className="text-right">{formatCurrency(item.total)}</TableCell></TableRow>)}
                      <TableRow className="total-row"><TableCell className="font-bold">ค่าใช้จ่ายรวม</TableCell><TableCell className="text-right font-bold">{formatCurrency(incomeStatementData.totalExpense)}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                  {/* Net Income */}
                  <div className={`flex justify-between items-center p-4 mt-6 rounded-lg final-total ${incomeStatementData.netIncome >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <span className="text-lg">กำไร (ขาดทุน) สุทธิ</span>
                    <span className="text-lg">{formatCurrency(incomeStatementData.netIncome)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet Tab */}
        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle>สร้างงบดุล (งบแสดงฐานะการเงิน)</CardTitle>
              <CardDescription>เลือกวันที่เพื่อดูฐานะทางการเงิน ณ วันนั้น</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6">
                <div className="grid gap-2">
                  <Label htmlFor="asOfDate">ข้อมูล ณ วันที่</Label>
                  <Input id="asOfDate" type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
                </div>
                <Button onClick={handleGenerateBS} disabled={isBSLoading} className="gap-2">
                  {isBSLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  สร้างรายงาน
                </Button>
                {balanceSheetData && (
                  <Button onClick={() => handlePrint('bs-report', 'งบดุล', `ณ วันที่ ${new Date(asOfDate).toLocaleDateString("th-TH")}`)} variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" /> พิมพ์
                  </Button>
                )}
              </div>

              {isBSLoading && <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

              {balanceSheetData && (
                <div id="bs-report">
                  {/* Assets */}
                  <h3 className="text-lg font-semibold mb-2">สินทรัพย์ (Assets)</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>ชื่อบัญชี</TableHead><TableHead className="text-right">จำนวนเงิน</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {balanceSheetData.assets.map(item => <TableRow key={item.account_code}><TableCell>{item.account_code} - {item.account_name}</TableCell><TableCell className="text-right">{formatCurrency(item.total)}</TableCell></TableRow>)}
                      <TableRow className="total-row"><TableCell className="font-bold">รวมสินทรัพย์</TableCell><TableCell className="text-right font-bold">{formatCurrency(balanceSheetData.totalAssets)}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                  {/* Liabilities */}
                  <h3 className="text-lg font-semibold mt-6 mb-2">หนี้สิน (Liabilities)</h3>
                  <Table>
                    <TableBody>
                      {balanceSheetData.liabilities.length === 0 ? <TableRow><TableCell colSpan={2}>ไม่มีรายการหนี้สิน</TableCell></TableRow> : balanceSheetData.liabilities.map(item => <TableRow key={item.account_code}><TableCell>{item.account_code} - {item.account_name}</TableCell><TableCell className="text-right">{formatCurrency(item.total)}</TableCell></TableRow>)}
                      <TableRow className="total-row"><TableCell className="font-bold">รวมหนี้สิน</TableCell><TableCell className="text-right font-bold">{formatCurrency(balanceSheetData.totalLiabilities)}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                  {/* Equity */}
                  <h3 className="text-lg font-semibold mt-6 mb-2">ส่วนของทุน (Equity)</h3>
                  <Table>
                    <TableBody>
                      {balanceSheetData.equity.map(item => <TableRow key={item.account_code}><TableCell>{item.account_code} - {item.account_name}</TableCell><TableCell className="text-right">{formatCurrency(item.total)}</TableCell></TableRow>)}
                      <TableRow className="total-row"><TableCell className="font-bold">รวมส่วนของทุน</TableCell><TableCell className="text-right font-bold">{formatCurrency(balanceSheetData.totalEquity)}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                  {/* Total Liabilities & Equity */}
                  <div className="flex justify-between items-center p-4 mt-6 rounded-lg final-total bg-blue-50 text-blue-800">
                    <span className="text-lg">รวมหนี้สินและส่วนของทุน</span>
                    <span className="text-lg">{formatCurrency((balanceSheetData.totalLiabilities || 0) + (balanceSheetData.totalEquity || 0))}</span>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

