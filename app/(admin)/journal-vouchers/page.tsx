"use client"

import { useState, useEffect, useMemo } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/lib/settings-context"
import { formatDate } from "@/lib/date-formatter"
import { getJournalVouchers, getChartOfAccountsFromDB } from "@/lib/supabase/actions"
import { Badge } from "@/components/ui/badge"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface JournalEntry {
  id: string;
  journal_date: string;
  account_code: string;
  description: string;
  reference_number: string | null;
  debit: number;
  credit: number;
  journal_type: 'revenue' | 'expense';
}

interface ChartOfAccount {
  account_code: string;
  account_name: string;
}

export default function JournalVoucherPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })
  const { toast } = useToast()
  const { settings } = useSettings()

  useEffect(() => {
    console.log('[JournalVouchers] useEffect triggered. selectedProjectId:', selectedProjectId)
    const fetchInitialData = async () => {
      try {
        const accs = await getChartOfAccountsFromDB()
        setAccounts(accs)
        await handleFetchEntries()
      } catch (error) {
        toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลเริ่มต้นได้", variant: "destructive" })
      }
    }
    fetchInitialData()
  }, [selectedProjectId])
  
  const handleFetchEntries = async () => {
    setIsLoading(true)
    try {
      console.log('[JournalVouchers] Fetching entries with project_id:', selectedProjectId)
      const data = await getJournalVouchers(filters.startDate, filters.endDate, selectedProjectId || undefined)
      setEntries(data)
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถโหลดข้อมูลได้: ${error.message}`, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }
  
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    return entries.filter(entry => 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [entries, searchTerm])

  const getAccountName = (code: string) => accounts.find(a => a.account_code === code)?.account_name || code

  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        acc.debit += entry.debit;
        acc.credit += entry.credit;
        return acc;
      },
      { debit: 0, credit: 0 }
    );
  }, [filteredEntries]);

  return (
    <div>
      <PageHeader
        title="สมุดรายวันทั่วไป (JV)"
        subtitle="แสดงรายการเคลื่อนไหวทางบัญชีทั้งหมด (รายรับ-รายจ่าย)"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ตัวกรองข้อมูล</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
                <Label htmlFor="searchTerm">ค้นหารายการ</Label>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                   <Input 
                      id="searchTerm" 
                      placeholder="ค้นหาตามรายละเอียด, เลขที่อ้างอิง..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                   />
                </div>
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
                <Button onClick={handleFetchEntries} disabled={isLoading} className="w-full md:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  {isLoading ? "กำลังค้นหา..." : "ค้นหา"}
                </Button>
            </div>
        </CardContent>
      </Card>
      
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">วันที่</TableHead>
              <TableHead>เลขที่บัญชี</TableHead>
              <TableHead>ชื่อบัญชี</TableHead>
              <TableHead>รายการ</TableHead>
              <TableHead className="text-right">เดบิต</TableHead>
              <TableHead className="text-right">เครดิต</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">กำลังโหลดข้อมูล...</TableCell>
              </TableRow>
            ) : filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">ไม่พบข้อมูลในช่วงเวลาที่เลือก</TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry, index) => (
                <TableRow key={entry.id + index}>
                  <TableCell>{formatDate(entry.journal_date, "short", settings.yearType)}</TableCell>
                  <TableCell className="font-mono">{entry.account_code}</TableCell>
                  <TableCell>{getAccountName(entry.account_code)}</TableCell>
                  <TableCell>
                    <div>{entry.description}</div>
                    {entry.reference_number && <div className="text-xs text-muted-foreground">Ref: {entry.reference_number}</div>}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-600">
                    {entry.debit > 0 ? `฿${entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    {entry.credit > 0 ? `฿${entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && filteredEntries.length > 0 && (
              <TableRow className="bg-gray-100 dark:bg-gray-800 font-bold text-base">
                <TableCell colSpan={4} className="text-right">ยอดรวม</TableCell>
                <TableCell className="text-right font-mono">฿{totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right font-mono">฿{totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
