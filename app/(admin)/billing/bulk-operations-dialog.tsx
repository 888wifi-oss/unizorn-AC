"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2, FileText, Send, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface BulkOperationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedBillIds: string[]
  onSuccess: () => void
}

export function BulkOperationsDialog({
  open,
  onOpenChange,
  selectedBillIds,
  onSuccess,
}: BulkOperationsDialogProps) {
  const { toast } = useToast()
  const [operation, setOperation] = useState<"change_status" | "send" | "export">("change_status")
  const [newStatus, setNewStatus] = useState<string>("pending")
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleExecute = async () => {
    if (selectedBillIds.length === 0) {
      toast({
        title: "กรุณาเลือกบิล",
        description: "กรุณาเลือกบิลอย่างน้อย 1 รายการ",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      let response: Response
      let data: any

      if (operation === "change_status") {
        if (!newStatus) {
          toast({
            title: "กรุณาเลือกสถานะ",
            description: "กรุณาเลือกสถานะใหม่",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        response = await fetch('/api/v1/billing/bulk-update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billIds: selectedBillIds,
            status: newStatus,
          }),
        })
        data = await response.json()
      } else if (operation === "send") {
        response = await fetch('/api/v1/billing/bulk-send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billIds: selectedBillIds,
          }),
        })
        data = await response.json()
      } else {
        // Export
        response = await fetch('/api/v1/billing/bulk-export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billIds: selectedBillIds,
            format: exportFormat,
          }),
        })

        if (exportFormat === 'pdf') {
          // Handle PDF download
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `bills_export_${new Date().toISOString().split('T')[0]}.zip`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)

          toast({
            title: "ส่งออกรายงานสำเร็จ",
            description: `ส่งออก ${selectedBillIds.length} บิลเป็น PDF แล้ว`,
          })

          setLoading(false)
          onOpenChange(false)
          return
        } else {
          // CSV
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `bills_export_${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)

          toast({
            title: "ส่งออกรายงานสำเร็จ",
            description: `ส่งออก ${selectedBillIds.length} บิลเป็น CSV แล้ว`,
          })

          setLoading(false)
          onOpenChange(false)
          return
        }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Operation failed')
      }

      setResult(data)

      toast({
        title: "ดำเนินการสำเร็จ",
        description: data.message || `ดำเนินการกับ ${data.count || selectedBillIds.length} บิลแล้ว`,
      })

      onSuccess()
      setTimeout(() => {
        onOpenChange(false)
        setResult(null)
      }, 2000)
    } catch (error: any) {
      console.error('[Bulk Operations] Error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถดำเนินการได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            จัดการหลายรายการ ({selectedBillIds.length} บิล)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={operation} onValueChange={(value: any) => setOperation(value)}>
            <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="change_status" id="change_status" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="change_status" className="cursor-pointer font-semibold">
                  เปลี่ยนสถานะ
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  เปลี่ยนสถานะบิลหลายรายการพร้อมกัน
                </p>
                {operation === "change_status" && (
                  <div className="mt-3">
                    <Label>สถานะใหม่</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">รอชำระ</SelectItem>
                        <SelectItem value="paid">ชำระแล้ว</SelectItem>
                        <SelectItem value="overdue">เกินกำหนด</SelectItem>
                        <SelectItem value="cancelled">ยกเลิก</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="send" id="send" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="send" className="cursor-pointer font-semibold">
                  ส่งบิล
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  ส่งบิลหลายใบไปยังลูกบ้าน (Email/SMS)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="export" id="export" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="export" className="cursor-pointer font-semibold">
                  ส่งออกรายงาน
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Export หลายบิลพร้อมกันเป็นไฟล์ PDF หรือ CSV
                </p>
                {operation === "export" && (
                  <div className="mt-3">
                    <Label>รูปแบบไฟล์</Label>
                    <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF (หลายไฟล์ใน ZIP)</SelectItem>
                        <SelectItem value="csv">CSV (ไฟล์เดียว)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>

          {result && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">ผลลัพธ์</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>สำเร็จ: {result.count || result.success || 0}</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>ล้มเหลว: {result.failed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleExecute}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading || selectedBillIds.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                {operation === "change_status" && <CheckCircle2 className="w-4 h-4 mr-2" />}
                {operation === "send" && <Send className="w-4 h-4 mr-2" />}
                {operation === "export" && <Download className="w-4 h-4 mr-2" />}
                ดำเนินการ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

