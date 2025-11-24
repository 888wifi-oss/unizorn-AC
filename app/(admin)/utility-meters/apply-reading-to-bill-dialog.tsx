"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, FileText, Calendar } from "lucide-react"

interface MeterReading {
  id: string
  reading_date: string
  current_reading: number
  previous_reading: number
  usage_amount: number
  meter_type: string
  unit_number?: string
}

interface Bill {
  id: string
  bill_number: string
  month: string
  total: number
}

interface ApplyReadingToBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meterReadingId: string | null
  unitId: string
  meterType: 'water' | 'electricity'
  onSuccess: () => void
}

export function ApplyReadingToBillDialog({
  open,
  onOpenChange,
  meterReadingId,
  unitId,
  meterType,
  onSuccess,
}: ApplyReadingToBillDialogProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [loadingBills, setLoadingBills] = useState(false)
  const [availableBills, setAvailableBills] = useState<Bill[]>([])
  const [meterReading, setMeterReading] = useState<MeterReading | null>(null)
  const [selectedBillId, setSelectedBillId] = useState<string>("")
  const [action, setAction] = useState<"update" | "create">("update")
  const [month, setMonth] = useState("")

  useEffect(() => {
    if (open && meterReadingId) {
      loadMeterReading()
      loadAvailableBills()
    } else if (open) {
      // Reset form
      setSelectedBillId("")
      setAction("update")
      setMonth("")
    }
  }, [open, meterReadingId, unitId])

  const loadMeterReading = async () => {
    if (!meterReadingId) return

    try {
      const { data, error } = await supabase
        .from('meter_readings')
        .select(`
          *,
          utility_meters!inner(
            meter_type,
            units!inner(unit_number)
          )
        `)
        .eq('id', meterReadingId)
        .single()

      if (error) throw error

      setMeterReading({
        ...data,
        meter_type: data.utility_meters?.meter_type || meterType,
        unit_number: data.utility_meters?.units?.unit_number,
      })

      // Set default month from reading date
      if (data.reading_date) {
        setMonth(data.reading_date.substring(0, 7))
      }
    } catch (error: any) {
      console.error('[Apply to Bill] Error loading meter reading:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลการอ่านมิเตอร์ได้",
        variant: "destructive",
      })
    }
  }

  const loadAvailableBills = async () => {
    setLoadingBills(true)
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('id, bill_number, month, total')
        .eq('unit_id', unitId)
        .eq('status', 'pending')
        .order('month', { ascending: false })
        .limit(10)

      if (error) throw error

      setAvailableBills(data || [])
    } catch (error: any) {
      console.error('[Apply to Bill] Error loading bills:', error)
    } finally {
      setLoadingBills(false)
    }
  }

  const handleApply = async () => {
    if (!meterReadingId) return

    if (action === "update" && !selectedBillId) {
      toast({
        title: "กรุณาเลือกบิล",
        description: "กรุณาเลือกบิลที่ต้องการอัพเดท หรือเลือกสร้างบิลใหม่",
        variant: "destructive",
      })
      return
    }

    if (action === "create" && !month) {
      toast({
        title: "กรุณาระบุเดือน",
        description: "กรุณาระบุเดือนสำหรับบิลใหม่",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/meter-readings/apply-to-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meterReadingId,
          billId: action === "update" ? selectedBillId : null,
          month: action === "create" ? month : undefined,
          createNewBill: action === "create",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply meter reading to bill')
      }

      toast({
        title: "สำเร็จ",
        description: data.action === "created" 
          ? `สร้างบิลใหม่เรียบร้อยแล้ว (${data.bill.bill_number})`
          : `อัพเดทบิลเรียบร้อยแล้ว (${data.bill.bill_number})`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('[Apply to Bill] Error:', error)
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
    return type === 'water' ? 'น้ำ' : 'ไฟฟ้า'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>นำการอ่านมิเตอร์ไปใส่ในบิล</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {meterReading && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <Label className="font-semibold">ข้อมูลการอ่านมิเตอร์</Label>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">ห้องชุด:</span>
                    <span className="ml-2 font-medium">{meterReading.unit_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ประเภท:</span>
                    <span className="ml-2 font-medium">{getMeterTypeLabel(meterReading.meter_type)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">วันที่อ่าน:</span>
                    <span className="ml-2 font-medium">{meterReading.reading_date}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">จำนวนการใช้:</span>
                    <span className="ml-2 font-medium">
                      {meterReading.usage_amount.toLocaleString()} {meterReading.meter_type === 'water' ? 'ลบ.ม.' : 'kWh'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label>เลือกการดำเนินการ</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="updateBill"
                      name="action"
                      value="update"
                      checked={action === "update"}
                      onChange={(e) => setAction(e.target.value as "update")}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="updateBill" className="cursor-pointer flex-1">
                      อัพเดทบิลที่มีอยู่
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="createBill"
                      name="action"
                      value="create"
                      checked={action === "create"}
                      onChange={(e) => setAction(e.target.value as "create")}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="createBill" className="cursor-pointer flex-1">
                      สร้างบิลใหม่
                    </Label>
                  </div>
                </div>
              </div>

              {action === "update" && (
                <div>
                  <Label htmlFor="billSelect">เลือกบิล</Label>
                  {loadingBills ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-500">กำลังโหลดบิล...</span>
                    </div>
                  ) : availableBills.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-2">ไม่มีบิลที่รอดำเนินการ</p>
                  ) : (
                    <Select value={selectedBillId} onValueChange={setSelectedBillId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="เลือกบิล..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBills.map((bill) => (
                          <SelectItem key={bill.id} value={bill.id}>
                            {bill.bill_number} - {bill.month} (฿{bill.total.toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {action === "create" && (
                <div>
                  <Label htmlFor="month">เดือน (YYYY-MM) *</Label>
                  <Input
                    id="month"
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="mt-2"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ระบบจะสร้างบิลใหม่สำหรับเดือนนี้และคำนวณค่าใช้จ่ายจากอัตราค่าบริการ
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading || (action === "update" && !selectedBillId) || (action === "create" && !month)}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                {action === "update" ? "อัพเดทบิล" : "สร้างบิลใหม่"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

