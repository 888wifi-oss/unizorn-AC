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
  Scale, 
  Search, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { createClient } from "@/lib/supabase/client"

interface TrialBalanceItem {
  account_code: string
  account_name: string
  debit_balance: number
  credit_balance: number
  account_type: string
}

export default function TrialBalancePage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    console.log('[TrialBalance] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadTrialBalance()
  }, [asOfDate, selectedProjectId])

  const loadTrialBalance = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      console.log('[TrialBalance] Loading trial balance with project_id:', selectedProjectId)
      
      // Query from general_ledger_view with project filtering
      let query = supabase
        .from('general_ledger_view')
        .select('account_code, account_name, debit, credit, account_type')
        .lte('journal_date', asOfDate)
      
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        query = query.eq('project_id', selectedProjectId)
      }
      
      const { data: transactions, error } = await query
      
      if (error) throw error
      
      // Aggregate by account
      const accountMap = new Map<string, TrialBalanceItem>()
      
      transactions?.forEach((tx: any) => {
        if (!accountMap.has(tx.account_code)) {
          accountMap.set(tx.account_code, {
            account_code: tx.account_code,
            account_name: tx.account_name || tx.account_code,
            debit_balance: 0,
            credit_balance: 0,
            account_type: tx.account_type || 'อื่นๆ'
          })
        }
        const item = accountMap.get(tx.account_code)!
        item.debit_balance += tx.debit || 0
        item.credit_balance += tx.credit || 0
      })
      
      const trialBalanceData = Array.from(accountMap.values())
        .filter(item => item.debit_balance > 0 || item.credit_balance > 0)
        .sort((a, b) => a.account_code.localeCompare(b.account_code))
      
      setTrialBalance(trialBalanceData)
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

  const filteredTrialBalance = trialBalance.filter(item => {
    return filterType === "all" || item.account_type === filterType
  })

  const totalDebit = filteredTrialBalance.reduce((sum, item) => sum + item.debit_balance, 0)
  const totalCredit = filteredTrialBalance.reduce((sum, item) => sum + item.credit_balance, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case 'สินทรัพย์':
        return <Badge variant="outline" className="text-blue-600">สินทรัพย์</Badge>
      case 'หนี้สิน':
        return <Badge variant="outline" className="text-red-600">หนี้สิน</Badge>
      case 'ส่วนของเจ้าของ':
        return <Badge variant="outline" className="text-green-600">ส่วนของเจ้าของ</Badge>
      case 'รายได้':
        return <Badge variant="outline" className="text-purple-600">รายได้</Badge>
      case 'รายจ่าย':
        return <Badge variant="outline" className="text-orange-600">รายจ่าย</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="งบทดลอง"
        subtitle="รายงานงบทดลองตามวันที่"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดเดบิตรวม</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">฿{totalDebit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ยอดเดบิตทั้งหมด
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดเครดิตรวม</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">฿{totalCredit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ยอดเครดิตทั้งหมด
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สถานะงบ</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {isBalanced ? 'สมดุล' : 'ไม่สมดุล'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isBalanced ? 'งบสมดุลแล้ว' : 'งบไม่สมดุล'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>งบทดลอง</CardTitle>
              <CardDescription>งบทดลอง ณ วันที่ {new Date(asOfDate).toLocaleDateString('th-TH')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <div>
                <Label htmlFor="asOfDate">ณ วันที่</Label>
                <Input 
                  id="asOfDate" 
                  type="date" 
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-40"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="ประเภทบัญชี" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="สินทรัพย์">สินทรัพย์</SelectItem>
                  <SelectItem value="หนี้สิน">หนี้สิน</SelectItem>
                  <SelectItem value="ส่วนของเจ้าของ">ส่วนของเจ้าของ</SelectItem>
                  <SelectItem value="รายได้">รายได้</SelectItem>
                  <SelectItem value="รายจ่าย">รายจ่าย</SelectItem>
                </SelectContent>
              </Select>
              
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
                <TableHead>รหัสบัญชี</TableHead>
                <TableHead>ชื่อบัญชี</TableHead>
                <TableHead>ประเภทบัญชี</TableHead>
                <TableHead className="text-right">ยอดเดบิต</TableHead>
                <TableHead className="text-right">ยอดเครดิต</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrialBalance.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.account_code}</TableCell>
                  <TableCell>{item.account_name}</TableCell>
                  <TableCell>{getAccountTypeBadge(item.account_type)}</TableCell>
                  <TableCell className="text-right">
                    {item.debit_balance > 0 ? `฿${item.debit_balance.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.credit_balance > 0 ? `฿${item.credit_balance.toLocaleString()}` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableHeader>
              <TableRow className="font-bold">
                <TableCell colSpan={3}>รวม</TableCell>
                <TableCell className="text-right text-blue-600">฿{totalDebit.toLocaleString()}</TableCell>
                <TableCell className="text-right text-red-600">฿{totalCredit.toLocaleString()}</TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
