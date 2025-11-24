"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Printer, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/lib/settings-context"
import { formatDate } from "@/lib/date-formatter"
import { getGeneralLedgerData, getChartOfAccountsFromDB } from "@/lib/supabase/actions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface ChartOfAccount {
  account_code: string
  account_name: string
}

interface GLData {
  summary: {
    beginning: number
    totalDebit: number
    totalCredit: number
    ending: number
  }
  entries: any[]
}

export default function GeneralLedgerPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [glData, setGlData] = useState<GLData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [filters, setFilters] = useState({
    accountCode: "",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })
  const { toast } = useToast()
  const { settings } = useSettings()

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accs = await getChartOfAccountsFromDB()
        setAccounts(accs)
        if (accs.length > 0) {
          setFilters((prev) => ({ ...prev, accountCode: accs[0].account_code }))
        }
      } catch (error) {
        toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดผังบัญชีได้", variant: "destructive" })
      }
    }
    fetchAccounts()
  }, [toast])

  const handleGenerateReport = async () => {
    if (!filters.accountCode) {
      toast({ title: "กรุณาเลือกบัญชี", variant: "destructive" })
      return
    }
    setIsLoading(true)
    setIsDataLoaded(false)
    try {
      console.log('[GeneralLedger] Generating report with project_id:', selectedProjectId)
      const data = await getGeneralLedgerData(filters.accountCode, filters.startDate, filters.endDate, selectedProjectId || undefined)
      setGlData(data)
      setIsDataLoaded(true)
    } catch (error: any) {
      console.error("[GL] Error generating report:", error)
      toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถสร้างรายงานได้: ${error.message}`, variant: "destructive" })
      setGlData(null)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handlePrint = () => {
    window.print()
  }

  const selectedAccount = accounts.find(acc => acc.account_code === filters.accountCode)

  return (
    <div>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
           .no-print {
            display: none;
          }
        }
      `}</style>

      <div className="no-print">
        <PageHeader
          title="สมุดบัญชีแยกประเภท (GL)"
          subtitle="ดูการเคลื่อนไหวของแต่ละบัญชีในผังบัญชี"
        />
      </div>

      <Card className="no-print mb-6">
        <CardHeader>
          <CardTitle>เลือกเงื่อนไข</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <Label htmlFor="accountCode">เลือกบัญชี</Label>
            <Select value={filters.accountCode} onValueChange={(value) => setFilters({ ...filters, accountCode: value })}>
              <SelectTrigger id="accountCode">
                <SelectValue placeholder="เลือกบัญชี..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.account_code} value={acc.account_code}>
                    {acc.account_code} - {acc.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-full md:w-auto">
            <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
            <Input id="startDate" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}/>
          </div>
          <div className="space-y-2 w-full md:w-auto">
            <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
            <Input id="endDate" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}/>
          </div>
          <div>
            <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full md:w-auto">
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? "กำลังโหลด..." : "สร้างรายงาน"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isDataLoaded && glData && (
        <div id="print-section">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold">สมุดบัญชีแยกประเภท - {selectedAccount?.account_name} ({selectedAccount?.account_code})</h2>
                    <p className="text-sm text-muted-foreground">
                        สำหรับช่วงวันที่ {formatDate(filters.startDate, settings.dateFormat, settings.yearType)} ถึง {formatDate(filters.endDate, settings.dateFormat, settings.yearType)}
                    </p>
                </div>
                 <Button onClick={handlePrint} variant="outline" className="no-print">
                    <Printer className="mr-2 h-4 w-4" />
                    พิมพ์รายงาน
                </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <Card className="p-3">
                    <div className="text-muted-foreground">ยอดยกมา</div>
                    <div className="font-bold text-lg">฿{glData.summary.beginning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </Card>
                <Card className="p-3">
                    <div className="text-muted-foreground">เดบิตรวม</div>
                    <div className="font-bold text-lg text-blue-600">฿{glData.summary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </Card>
                 <Card className="p-3">
                    <div className="text-muted-foreground">เครดิตรวม</div>
                    <div className="font-bold text-lg text-red-600">฿{glData.summary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </Card>
                 <Card className="p-3">
                    <div className="text-muted-foreground">ยอดยกไป</div>
                    <div className="font-bold text-lg">฿{glData.summary.ending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </Card>
            </div>

            <div className="bg-white rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">วันที่</TableHead>
                            <TableHead>รายการ</TableHead>
                            <TableHead>เลขที่อ้างอิง</TableHead>
                            <TableHead className="text-right">เดบิต</TableHead>
                            <TableHead className="text-right">เครดิต</TableHead>
                            <TableHead className="text-right">ยอดคงเหลือ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         <TableRow className="bg-muted hover:bg-muted">
                            <TableCell colSpan={5} className="font-bold">ยอดยกมา (Beginning Balance)</TableCell>
                            <TableCell className="text-right font-bold">฿{glData.summary.beginning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        {glData.entries.length > 0 ? (
                            glData.entries.map((entry, index) => (
                                <TableRow key={entry.id + index}>
                                    <TableCell>{formatDate(entry.journal_date, "short", settings.yearType)}</TableCell>
                                    <TableCell>{entry.description}</TableCell>
                                    <TableCell>{entry.reference_number}</TableCell>
                                    <TableCell className="text-right text-blue-600 font-mono">{entry.debit > 0 ? `฿${entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</TableCell>
                                    <TableCell className="text-right text-red-600 font-mono">{entry.credit > 0 ? `฿${entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`: '-'}</TableCell>
                                    <TableCell className="text-right font-medium font-mono">฿{entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                    ไม่พบรายการเคลื่อนไหวในช่วงเวลาที่เลือก
                                </TableCell>
                            </TableRow>
                        )}
                        <TableRow className="bg-muted hover:bg-muted font-bold">
                            <TableCell colSpan={3} className="text-right">ยอดรวมเคลื่อนไหว</TableCell>
                            <TableCell className="text-right font-mono">฿{glData.summary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right font-mono">฿{glData.summary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                         <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 font-extrabold text-base">
                            <TableCell colSpan={5} className="text-right">ยอดยกไป (Ending Balance)</TableCell>
                            <TableCell className="text-right font-mono">฿{glData.summary.ending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
      )}

      {!isDataLoaded && !isLoading && (
         <Card className="mt-6 flex flex-col items-center justify-center h-64 border-dashed">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">กรุณาเลือกบัญชีและช่วงเวลาเพื่อสร้างรายงาน</p>
        </Card>
      )}

    </div>
  )
}

