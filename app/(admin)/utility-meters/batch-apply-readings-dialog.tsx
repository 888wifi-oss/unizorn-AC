"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, FileText, Calendar, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"

interface MeterReading {
  id: string
  reading_date: string
  current_reading: number
  previous_reading: number
  usage_amount: number
  meter_type: string
  unit_number?: string
  bill_id?: string | null
  meter_number?: string
}

interface BatchApplyReadingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BatchApplyReadingsDialog({
  open,
  onOpenChange,
  onSuccess,
}: BatchApplyReadingsDialogProps) {
  const { toast } = useToast()
  const { settings } = useSettings()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [loadingReadings, setLoadingReadings] = useState(false)
  const [availableReadings, setAvailableReadings] = useState<MeterReading[]>([])
  const [selectedReadingIds, setSelectedReadingIds] = useState<Set<string>>(new Set())
  const [batchAction, setBatchAction] = useState<"auto" | "update_existing" | "create_new">("auto")
  const [defaultMonth, setDefaultMonth] = useState("")
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (open) {
      loadAvailableReadings()
      setDefaultMonth(new Date().toISOString().split("T")[0].substring(0, 7))
      setSelectedReadingIds(new Set())
      setResult(null)
      setBatchAction("auto")
    }
  }, [open])

  const loadAvailableReadings = async () => {
    setLoadingReadings(true)
    try {
      const { data, error } = await supabase
        .from('meter_readings')
        .select(`
          *,
          utility_meters!inner(
            meter_type,
            meter_number,
            units!inner(unit_number)
          )
        `)
        .is('bill_id', null) // Only unlinked readings
        .order('reading_date', { ascending: false })
        .limit(100)

      if (error) throw error

      const processedReadings = (data || []).map((reading: any) => ({
        id: reading.id,
        reading_date: reading.reading_date,
        current_reading: reading.current_reading,
        previous_reading: reading.previous_reading,
        usage_amount: reading.usage_amount,
        meter_type: reading.utility_meters?.meter_type || 'water',
        unit_number: reading.utility_meters?.units?.unit_number,
        meter_number: reading.utility_meters?.meter_number,
        bill_id: reading.bill_id,
      }))

      setAvailableReadings(processedReadings)
    } catch (error: any) {
      console.error('[Batch Apply] Error loading readings:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลการอ่านมิเตอร์ได้",
        variant: "destructive",
      })
    } finally {
      setLoadingReadings(false)
    }
  }

  const handleToggleReading = (readingId: string) => {
    const newSelected = new Set(selectedReadingIds)
    if (newSelected.has(readingId)) {
      newSelected.delete(readingId)
    } else {
      newSelected.add(readingId)
    }
    setSelectedReadingIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedReadingIds.size === availableReadings.length) {
      setSelectedReadingIds(new Set())
    } else {
      setSelectedReadingIds(new Set(availableReadings.map(r => r.id)))
    }
  }

  const handleApply = async () => {
    if (selectedReadingIds.size === 0) {
      toast({
        title: "กรุณาเลือกการอ่านมิเตอร์",
        description: "กรุณาเลือกอย่างน้อย 1 รายการ",
        variant: "destructive",
      })
      return
    }

    if (batchAction === "create_new" && !defaultMonth) {
      toast({
        title: "กรุณาระบุเดือน",
        description: "กรุณาระบุเดือนสำหรับบิลใหม่",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/v1/meter-readings/batch-apply-to-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meterReadingIds: Array.from(selectedReadingIds),
          batchAction,
          defaultMonth: batchAction === "create_new" ? defaultMonth : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to batch apply meter readings')
      }

      setResult(data)

      toast({
        title: "ดำเนินการเสร็จสิ้น",
        description: `สำเร็จ ${data.summary.success} รายการ, ล้มเหลว ${data.summary.failed} รายการ, ข้าม ${data.summary.skipped} รายการ`,
      })

      await loadAvailableReadings() // Reload to refresh list
      onSuccess()
    } catch (error: any) {
      console.error('[Batch Apply] Error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถเชื่อมต่อการอ่านมิเตอร์กับบิลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getMeterTypeLabel = (type: string) => {
    return type === 'water' ? 'น้ำ' : type === 'electricity' ? 'ไฟฟ้า' : 'แก๊ส'
  }

  const selectedReadings = availableReadings.filter(r => selectedReadingIds.has(r.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>นำการอ่านมิเตอร์หลายรายการไปใส่ในบิล (Batch)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Settings */}
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div>
              <Label>การดำเนินการ</Label>
              <Select value={batchAction} onValueChange={(value: any) => setBatchAction(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (อัพเดทถ้ามีบิล สร้างใหม่ถ้าไม่มี)</SelectItem>
                  <SelectItem value="update_existing">อัพเดทบิลที่มีอยู่เท่านั้น</SelectItem>
                  <SelectItem value="create_new">สร้างบิลใหม่ทั้งหมด</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {batchAction === "create_new" && (
              <div>
                <Label>เดือนสำหรับบิลใหม่ (YYYY-MM) *</Label>
                <Input
                  type="month"
                  value={defaultMonth}
                  onChange={(e) => setDefaultMonth(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
            )}

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={availableReadings.length === 0}
              >
                {selectedReadingIds.size === availableReadings.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </Button>
            </div>
          </div>

          {/* Readings List */}
          <div>
            <Label>การอ่านมิเตอร์ที่ยังไม่ได้ใส่บิล ({selectedReadingIds.size} / {availableReadings.length} เลือก)</Label>
            <ScrollArea className="h-96 border rounded-md mt-2">
              {loadingReadings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">กำลังโหลด...</span>
                </div>
              ) : availableReadings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  ไม่มีการอ่านมิเตอร์ที่ยังไม่ได้ใส่บิล
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedReadingIds.size === availableReadings.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>ห้องชุด</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>เลขมิเตอร์</TableHead>
                      <TableHead>วันที่อ่าน</TableHead>
                      <TableHead>เลขล่าสุด</TableHead>
                      <TableHead>การใช้</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableReadings.map((reading) => (
                      <TableRow key={reading.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedReadingIds.has(reading.id)}
                            onCheckedChange={() => handleToggleReading(reading.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{reading.unit_number}</TableCell>
                        <TableCell>{getMeterTypeLabel(reading.meter_type)}</TableCell>
                        <TableCell>{reading.meter_number || '-'}</TableCell>
                        <TableCell>
                          {formatDate(reading.reading_date, settings.dateFormat, settings.yearType)}
                        </TableCell>
                        <TableCell>{reading.current_reading.toLocaleString()}</TableCell>
                        <TableCell>
                          {reading.usage_amount.toLocaleString()} {reading.meter_type === 'water' ? 'ลบ.ม.' : 'kWh'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>

          {/* Preview Summary */}
          {selectedReadings.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">สรุปการเลือก</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">จำนวนรายการ:</span>
                  <span className="ml-2 font-medium">{selectedReadings.length}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">น้ำ:</span>
                  <span className="ml-2 font-medium">
                    {selectedReadings.filter(r => r.meter_type === 'water').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ไฟฟ้า:</span>
                  <span className="ml-2 font-medium">
                    {selectedReadings.filter(r => r.meter_type === 'electricity').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ห้องชุด:</span>
                  <span className="ml-2 font-medium">
                    {new Set(selectedReadings.map(r => r.unit_number)).size}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">ผลลัพธ์</h4>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>สำเร็จ: {result.summary.success}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>ล้มเหลว: {result.summary.failed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span>ข้าม: {result.summary.skipped}</span>
                </div>
                <div>
                  <span>ทั้งหมด: {result.summary.total}</span>
                </div>
              </div>

              {result.results.failed.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 text-sm max-h-32 overflow-y-auto">
                  <strong>รายการที่ล้มเหลว:</strong>
                  <ul className="mt-1 list-disc list-inside">
                    {result.results.failed.slice(0, 5).map((f: any, idx: number) => (
                      <li key={idx}>{f.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ปิด
          </Button>
          <Button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading || selectedReadingIds.size === 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                นำไปใส่บิล ({selectedReadingIds.size} รายการ)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

