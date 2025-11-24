"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  UploadCloud,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { ReconciliationSummaryCard } from "@/components/reconciliation-summary-card"
import {
  getBankReconciliationMatches,
  createReconciliationMatch,
  updateReconciliationStatus,
  deleteReconciliationMatch,
  getReconciliationSummary,
  bulkUpdateReconciliationStatus,
  exportReconciliationReport,
  type ReconciliationStatus,
  type BankReconciliationMatch,
  type ReconciliationSummary
} from "@/lib/actions/reconciliation-actions"
import { createClient } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/utils/mock-auth"

type BankRow = {
  date: string
  description: string
  amount: number
  reference?: string
  account?: string
}

type PaymentCandidate = {
  id: string
  amount: number
  payment_date: string
  reference_number: string | null
  unit_id: string | null
  bill_id: string | null
  confidence: number
}

export default function BankReconciliationPage() {
  const [bankRows, setBankRows] = useState<BankRow[]>([])
  const [matches, setMatches] = useState<BankReconciliationMatch[]>([])
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null)
  const [candidates, setCandidates] = useState<Record<number, PaymentCandidate[]>>({})
  const [selectedMatchByRow, setSelectedMatchByRow] = useState<Record<number, string>>({})
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus | "all">("all")
  const [minConfidence, setMinConfidence] = useState<number>(0)

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadMatches()
    loadSummary()
  }, [selectedProjectId, statusFilter, dateFrom, dateTo, minConfidence])

  const loadMatches = async () => {
    setLoading(true)
    const result = await getBankReconciliationMatches(
      selectedProjectId || null,
      {
        status: statusFilter === "all" ? undefined : statusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        minConfidence: minConfidence || undefined,
      },
      currentUser.id
    )
    if (result.success && result.data) {
      setMatches(result.data)
    }
    setLoading(false)
  }

  const loadSummary = async () => {
    console.log('Loading summary...', { selectedProjectId, dateFrom, dateTo, userId: currentUser.id })
    const result = await getReconciliationSummary(
      selectedProjectId || null,
      dateFrom || undefined,
      dateTo || undefined,
      currentUser.id
    )
    console.log('Summary result:', result)
    if (result.success && result.data) {
      setSummary(result.data)
    } else {
      console.error('Failed to load summary:', result.error)
    }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const text = String(reader.result || "")
      const rows = parseCSV(text)
      setBankRows(rows)
      toast({
        title: "นำเข้าเรียบร้อย",
        description: `นำเข้ารายการธนาคาร ${rows.length} รายการ`
      })

      // Auto-suggest matches
      await suggestMatches(rows)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string): BankRow[] => {
    const lines = text.split(/\r?\n/).filter(Boolean)
    const result: BankRow[] = []
    // Expect header: date,description,amount,reference,account
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length < 3) continue
      result.push({
        date: cols[0].trim(),
        description: cols[1].trim(),
        amount: Number.parseFloat(cols[2].trim() || '0'),
        reference: (cols[3] || '').trim() || undefined,
        account: (cols[4] || '').trim() || undefined,
      })
    }
    return result
  }

  const calculateMatchConfidence = (
    bankRow: BankRow,
    payment: any
  ): number => {
    let confidence = 0

    // Exact amount match: +40 points
    if (Math.abs(payment.amount - bankRow.amount) < 0.01) {
      confidence += 40
    }

    // Date within 3 days: +30 points
    const bankDate = new Date(bankRow.date).getTime()
    const paymentDate = new Date(payment.payment_date).getTime()
    const daysDiff = Math.abs(bankDate - paymentDate) / (1000 * 60 * 60 * 24)
    if (daysDiff <= 3) {
      confidence += 30
    }

    // Reference number match: +20 points
    if (bankRow.reference && payment.reference_number) {
      if (payment.reference_number.includes(bankRow.reference) ||
        bankRow.reference.includes(payment.reference_number)) {
        confidence += 20
      }
    }

    // Description similarity: +10 points (simple check)
    if (bankRow.description && payment.reference_number) {
      const desc = bankRow.description.toLowerCase()
      const ref = payment.reference_number.toLowerCase()
      if (desc.includes(ref) || ref.includes(desc)) {
        confidence += 10
      }
    }

    return Math.min(confidence, 100)
  }

  const suggestMatches = async (rows: BankRow[]) => {
    const supabase = createClient()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)
    const startISO = startDate.toISOString().split('T')[0]

    let query = supabase
      .from('payments')
      .select('id, amount, payment_date, reference_number, unit_id, bill_id, project_id, reconciled')
      .gte('payment_date', startISO)
      .eq('reconciled', false)

    if (selectedProjectId) {
      query = query.eq('project_id', selectedProjectId)
    }

    const { data: payments } = await query

    const newCandidates: Record<number, PaymentCandidate[]> = {}

    rows.forEach((row, idx) => {
      const rowCandidates = (payments || [])
        .map(p => ({
          ...p,
          confidence: calculateMatchConfidence(row, p)
        }))
        .filter(p => p.confidence >= 30) // Only show candidates with 30%+ confidence
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5) // Top 5 candidates

      newCandidates[idx] = rowCandidates
    })

    setCandidates(newCandidates)
  }

  const selectCandidate = (rowIndex: number, paymentId: string) => {
    setSelectedMatchByRow(prev => ({ ...prev, [rowIndex]: paymentId }))
  }

  const saveMatches = async () => {
    if (!Object.keys(selectedMatchByRow).length) {
      toast({
        title: "ยังไม่มีการเลือกจับคู่",
        description: "โปรดเลือกรายการจับคู่ก่อนบันทึก",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    let successCount = 0

    for (const [rowIdxStr, paymentId] of Object.entries(selectedMatchByRow)) {
      const rowIdx = Number(rowIdxStr)
      const bank = bankRows[rowIdx]
      const candidate = candidates[rowIdx]?.find(c => c.id === paymentId)
      const confidence = candidate?.confidence || 0

      const result = await createReconciliationMatch(
        selectedProjectId || null,
        {
          bank_date: bank.date,
          bank_description: bank.description,
          bank_amount: bank.amount,
          bank_reference: bank.reference,
          bank_account: bank.account,
        },
        paymentId,
        confidence,
        currentUser.id
      )

      if (result.success) {
        successCount++
      }
    }

    toast({
      title: "บันทึกการจับคู่สำเร็จ",
      description: `จำนวน ${successCount} รายการ`
    })

    // Clear and reload
    setBankRows([])
    setSelectedMatchByRow({})
    setCandidates({})
    await loadMatches()
    await loadSummary()
    setLoading(false)
  }

  const handleStatusUpdate = async (matchId: string, status: ReconciliationStatus) => {
    const result = await updateReconciliationStatus(matchId, status, undefined, currentUser.id)
    if (result.success) {
      toast({
        title: "อัปเดตสถานะสำเร็จ"
      })
      await loadMatches()
      await loadSummary()
    }
  }

  const handleBulkApprove = async () => {
    if (selectedMatches.size === 0) return
    const result = await bulkUpdateReconciliationStatus(
      Array.from(selectedMatches),
      "reviewed",
      currentUser.id
    )
    if (result.success) {
      toast({ title: `อนุมัติ ${selectedMatches.size} รายการสำเร็จ` })
      setSelectedMatches(new Set())
      await loadMatches()
      await loadSummary()
    }
  }

  const handleBulkReject = async () => {
    if (selectedMatches.size === 0) return
    const result = await bulkUpdateReconciliationStatus(
      Array.from(selectedMatches),
      "rejected",
      currentUser.id
    )
    if (result.success) {
      toast({ title: `ปฏิเสธ ${selectedMatches.size} รายการสำเร็จ` })
      setSelectedMatches(new Set())
      await loadMatches()
      await loadSummary()
    }
  }

  const handleDelete = async (matchId: string) => {
    if (!confirm("ต้องการลบรายการนี้?")) return
    const result = await deleteReconciliationMatch(matchId, currentUser.id)
    if (result.success) {
      toast({
        title: "ลบรายการสำเร็จ"
      })
      await loadMatches()
      await loadSummary()
    }
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      const result = await exportReconciliationReport(
        selectedProjectId || null,
        {
          status: statusFilter === "all" ? undefined : statusFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
        currentUser.id
      )

      if (result.success && result.data) {
        // Create download link
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export สำเร็จ",
          description: "ดาวน์โหลดไฟล์รายงานเรียบร้อยแล้ว"
        })
      } else {
        toast({
          title: "Export ล้มเหลว",
          description: result.error || "เกิดข้อผิดพลาดในการ Export",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export ล้มเหลว",
        description: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatches(prev => {
      const newSet = new Set(prev)
      if (newSet.has(matchId)) {
        newSet.delete(matchId)
      } else {
        newSet.add(matchId)
      }
      return newSet
    })
  }

  const getStatusBadge = (status: ReconciliationStatus) => {
    const variants: Record<ReconciliationStatus, { variant: any; icon: any; label: string }> = {
      pending: {
        variant: "outline", icon: Clock, label: "รอตรวจสอบ"
      },
      matched: { variant: "default", icon: CheckCircle2, label: "จับคู่แล้ว" },
      reviewed: { variant: "secondary", icon: CheckCircle2, label: "ตรวจสอบแล้ว" },
      rejected: { variant: "destructive", icon: XCircle, label: "ปฏิเสธ" },
    }
    const config = variants[status]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getConfidenceBadge = (confidence: number) => {
    let color = "bg-red-100 text-red-800"
    if (confidence >= 70) color = "bg-green-100 text-green-800"
    else if (confidence >= 50) color = "bg-yellow-100 text-yellow-800"

    return (
      <Badge className={`${color} font-semibold`}>
        {confidence}%
      </Badge>
    )
  }

  const filteredMatches = matches.filter(m =>
  (m.bank_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(m.bank_amount).includes(searchTerm))
  )

  const filteredRows = bankRows.filter(r =>
  (r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.amount).includes(searchTerm))
  )

  return (
    <div>
      <PageHeader
        title="Bank Reconciliation"
        subtitle="นำเข้ารายการเดินบัญชีธนาคารและจับคู่กับการชำระเงิน"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
              <UploadCloud className="w-4 h-4" />
              นำเข้า CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            </label>
            {bankRows.length > 0 && (
              <Button onClick={saveMatches} disabled={loading}>
                บันทึกการจับคู่
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Cards */}
      {summary && <ReconciliationSummaryCard summary={summary} isLoading={loading} />}

      {/* Filters */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label>ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ค้นหา..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>สถานะ</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="pending">รอตรวจสอบ</SelectItem>
                  <SelectItem value="matched">จับคู่แล้ว</SelectItem>
                  <SelectItem value="reviewed">ตรวจสอบแล้ว</SelectItem>
                  <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ตั้งแต่วันที่</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label>ถึงวันที่</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <Label>Confidence ขั้นต่ำ</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSV Import View */}
      {bankRows.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader>
              <CardTitle>รายการธนาคาร ({filteredRows.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>อ้างอิง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((r, i) => (
                      <TableRow key={i} className={selectedMatchByRow[i] ? "bg-green-50" : ""}>
                        <TableCell className="text-sm">{r.date}</TableCell>
                        <TableCell className="text-sm">{r.description}</TableCell>
                        <TableCell className="font-semibold">฿{r.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-gray-500">{r.reference || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>คำแนะนำการจับคู่</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {filteredRows.map((row, idx) => {
                  const rowCandidates = candidates[idx] || []
                  return (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">
                        {row.date} | ฿{row.amount.toLocaleString()} | {row.description}
                      </div>
                      {rowCandidates.length > 0 ? (
                        <div className="space-y-2">
                          {rowCandidates.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded text-xs"
                            >
                              <div className="flex-1">
                                <div className="font-medium">Ref: {c.reference_number || 'N/A'}</div>
                                <div className="text-gray-500">
                                  {c.payment_date} | ฿{c.amount.toLocaleString()}
                                </div>
                              </div>
                              {getConfidenceBadge(c.confidence)}
                              <Button
                                size="sm"
                                variant={selectedMatchByRow[idx] === c.id ? "default" : "outline"}
                                onClick={() => selectCandidate(idx, c.id)}
                              >
                                {selectedMatchByRow[idx] === c.id ? 'เลือกแล้ว' : 'จับคู่'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">ไม่พบผู้สมัครจับคู่</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Existing Matches */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>รายการจับคู่ ({filteredMatches.length})</CardTitle>
              {selectedMatches.size > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={handleBulkApprove}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    อนุมัติ ({selectedMatches.size})
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                    <XCircle className="w-4 h-4 mr-1" />
                    ปฏิเสธ ({selectedMatches.size})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedMatches.size === filteredMatches.length && filteredMatches.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMatches(new Set(filteredMatches.map(m => m.id)))
                        } else {
                          setSelectedMatches(new Set())
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>อ้างอิง</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การกระทำ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedMatches.has(match.id)}
                        onCheckedChange={() => toggleMatchSelection(match.id)}
                      />
                    </TableCell>
                    <TableCell>{match.bank_date}</TableCell>
                    <TableCell className="max-w-xs truncate">{match.bank_description}</TableCell>
                    <TableCell className="font-semibold">฿{match.bank_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-gray-500">{match.bank_reference || '-'}</TableCell>
                    <TableCell>{getConfidenceBadge(match.match_confidence)}</TableCell>
                    <TableCell>{getStatusBadge(match.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {match.status === 'matched' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(match.id, 'reviewed')}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(match.id, 'rejected')}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(match.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
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
