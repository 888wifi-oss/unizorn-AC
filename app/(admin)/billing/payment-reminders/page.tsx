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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { useCurrency } from "@/lib/currency-formatter"
import { 
  Bell, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Send,
  Settings,
  Play
} from "lucide-react"

interface BillForReminder {
  id: string
  bill_number: string
  unit_number: string
  month: string
  due_date: string
  total: number
  status: string
  daysUntilDue: number
  hasNotification: boolean
}

interface ReminderSettings {
  enabled: boolean
  daysBeforeDue: number // จำนวนวันก่อน due date ที่จะส่ง reminder
  autoSend: boolean
}

export default function PaymentRemindersPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const { toast } = useToast()
  const { settings } = useSettings()
  const { formatCurrency } = useCurrency()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [billsForReminder, setBillsForReminder] = useState<BillForReminder[]>([])
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set())
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: true,
    daysBeforeDue: 3,
    autoSend: false,
  })

  useEffect(() => {
    loadReminderSettings()
    loadBillsForReminder()
  }, [selectedProjectId, reminderSettings.daysBeforeDue])

  const loadReminderSettings = async () => {
    try {
      const saved = localStorage.getItem('payment-reminder-settings')
      if (saved) {
        setReminderSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error('[Reminders] Error loading settings:', error)
    }
  }

  const saveReminderSettings = async () => {
    try {
      localStorage.setItem('payment-reminder-settings', JSON.stringify(reminderSettings))
      toast({
        title: "บันทึกการตั้งค่า",
        description: "บันทึกการตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว",
      })
      setIsSettingsDialogOpen(false)
    } catch (error) {
      console.error('[Reminders] Error saving settings:', error)
    }
  }

  const loadBillsForReminder = async () => {
    setLoading(true)
    try {
      const today = new Date()
      const dueDateThreshold = new Date(today)
      dueDateThreshold.setDate(today.getDate() + reminderSettings.daysBeforeDue)

      let billsQuery = supabase
        .from('bills')
        .select(`
          id,
          bill_number,
          month,
          due_date,
          total,
          status,
          units!inner(unit_number, project_id)
        `)
        .eq('status', 'pending')
        .lte('due_date', dueDateThreshold.toISOString().split('T')[0])
        .gte('due_date', today.toISOString().split('T')[0])
        .order('due_date', { ascending: true })

      if (selectedProjectId && currentUser.role !== 'super_admin') {
        billsQuery = billsQuery.eq('units.project_id', selectedProjectId)
      }

      const { data: bills, error } = await billsQuery

      if (error) throw error

      // Check which bills already have notifications
      const billIds = bills?.map(b => b.id) || []
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('data')
        .eq('type', 'payment_due')
        .in('data->bill_id', billIds)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

      const notifiedBillIds = new Set(
        existingNotifications?.map(n => n.data?.bill_id).filter(Boolean) || []
      )

      const processedBills: BillForReminder[] = (bills || []).map((bill: any) => {
        const dueDate = new Date(bill.due_date)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        return {
          id: bill.id,
          bill_number: bill.bill_number,
          unit_number: bill.units?.unit_number || '',
          month: bill.month,
          due_date: bill.due_date,
          total: bill.total,
          status: bill.status,
          daysUntilDue,
          hasNotification: notifiedBillIds.has(bill.id),
        }
      })

      setBillsForReminder(processedBills)
    } catch (error: any) {
      console.error('[Payment Reminders] Error loading bills:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBill = (billId: string) => {
    const newSelected = new Set(selectedBillIds)
    if (newSelected.has(billId)) {
      newSelected.delete(billId)
    } else {
      newSelected.add(billId)
    }
    setSelectedBillIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedBillIds.size === billsForReminder.length) {
      setSelectedBillIds(new Set())
    } else {
      setSelectedBillIds(new Set(billsForReminder.map(b => b.id)))
    }
  }

  const handleSendReminders = async () => {
    if (selectedBillIds.size === 0) {
      toast({
        title: "กรุณาเลือกบิล",
        description: "กรุณาเลือกบิลที่ต้องการส่งการแจ้งเตือน",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/v1/billing/send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billIds: Array.from(selectedBillIds),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reminders')
      }

      toast({
        title: "ส่งการแจ้งเตือนสำเร็จ",
        description: `ส่งการแจ้งเตือนให้ ${data.count || 0} บิลแล้ว`,
      })

      setSelectedBillIds(new Set())
      await loadBillsForReminder()
    } catch (error: any) {
      console.error('[Payment Reminders] Error sending reminders:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถส่งการแจ้งเตือนได้",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSendAll = async () => {
    if (!confirm(`คุณต้องการส่งการแจ้งเตือนให้บิลทั้งหมด ${billsForReminder.length} บิลใช่หรือไม่?`)) {
      return
    }

    setSelectedBillIds(new Set(billsForReminder.map(b => b.id)))
    await handleSendReminders()
  }

  const getDaysUntilDueBadge = (days: number) => {
    if (days < 0) {
      return <Badge variant="destructive">เลยกำหนด</Badge>
    }
    if (days === 0) {
      return <Badge variant="destructive">วันนี้ครบกำหนด</Badge>
    }
    if (days === 1) {
      return <Badge className="bg-orange-100 text-orange-700">เหลือ 1 วัน</Badge>
    }
    if (days <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-700">เหลือ {days} วัน</Badge>
    }
    return <Badge variant="secondary">เหลือ {days} วัน</Badge>
  }

  return (
    <div>
      <PageHeader
        title="การแจ้งเตือนการชำระเงิน"
        subtitle="จัดการการแจ้งเตือนบิลที่ใกล้ครบกำหนดชำระ"
        action={
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsSettingsDialogOpen(true)} 
              variant="outline" 
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              การตั้งค่า
            </Button>
            <Button 
              onClick={handleSendAll} 
              className="bg-blue-600 hover:bg-blue-700" 
              size="sm"
              disabled={billsForReminder.length === 0 || isSending}
            >
              <Send className="w-4 h-4 mr-2" />
              ส่งทั้งหมด ({billsForReminder.length})
            </Button>
          </div>
        }
      />

      {/* Info Card */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                ระบบจะแสดงบิลที่ครบกำหนดชำระภายใน {reminderSettings.daysBeforeDue} วัน
              </p>
              <p className="text-xs text-blue-700 mt-1">
                เลือกบิลที่ต้องการส่งการแจ้งเตือน แล้วกดปุ่ม "ส่งการแจ้งเตือน"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>บิลที่ใกล้ครบกำหนดชำระ</CardTitle>
              <CardDescription>
                {billsForReminder.length} บิลที่ครบกำหนดภายใน {reminderSettings.daysBeforeDue} วัน
              </CardDescription>
            </div>
            {selectedBillIds.size > 0 && (
              <Button
                onClick={handleSendReminders}
                className="bg-green-600 hover:bg-green-700"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Play className="w-4 h-4 mr-2 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    ส่งการแจ้งเตือน ({selectedBillIds.size})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : billsForReminder.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">ไม่มีบิลที่ต้องแจ้งเตือน</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedBillIds.size === billsForReminder.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4"
                    />
                  </TableHead>
                  <TableHead>เลขห้อง</TableHead>
                  <TableHead>เลขที่บิล</TableHead>
                  <TableHead>เดือน</TableHead>
                  <TableHead className="text-right">ยอดชำระ</TableHead>
                  <TableHead>กำหนดชำระ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การแจ้งเตือน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billsForReminder.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedBillIds.has(bill.id)}
                        onChange={() => handleToggleBill(bill.id)}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{bill.unit_number}</TableCell>
                    <TableCell>{bill.bill_number}</TableCell>
                    <TableCell>{bill.month}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(bill.total)}
                    </TableCell>
                    <TableCell>
                      {formatDate(bill.due_date, settings.dateFormat, settings.yearType)}
                    </TableCell>
                    <TableCell>
                      {getDaysUntilDueBadge(bill.daysUntilDue)}
                    </TableCell>
                    <TableCell>
                      {bill.hasNotification ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ส่งแล้ว
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          ยังไม่ส่ง
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>การตั้งค่าการแจ้งเตือน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>เปิดใช้งานการแจ้งเตือน</Label>
                <p className="text-xs text-gray-500">เปิด/ปิดระบบการแจ้งเตือนอัตโนมัติ</p>
              </div>
              <Switch
                checked={reminderSettings.enabled}
                onCheckedChange={(checked) =>
                  setReminderSettings({ ...reminderSettings, enabled: checked })
                }
              />
            </div>

            <div>
              <Label htmlFor="daysBeforeDue">จำนวนวันก่อนครบกำหนด</Label>
              <Select
                value={reminderSettings.daysBeforeDue.toString()}
                onValueChange={(value) =>
                  setReminderSettings({ ...reminderSettings, daysBeforeDue: parseInt(value) })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 วัน</SelectItem>
                  <SelectItem value="3">3 วัน</SelectItem>
                  <SelectItem value="7">7 วัน</SelectItem>
                  <SelectItem value="14">14 วัน</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                ระบบจะแสดงบิลที่ครบกำหนดภายในจำนวนวันที่เลือก
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>ส่งอัตโนมัติ</Label>
                <p className="text-xs text-gray-500">ส่งการแจ้งเตือนอัตโนมัติตามกำหนดเวลา</p>
              </div>
              <Switch
                checked={reminderSettings.autoSend}
                onCheckedChange={(checked) =>
                  setReminderSettings({ ...reminderSettings, autoSend: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={saveReminderSettings} className="bg-blue-600 hover:bg-blue-700">
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

