"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Plus, 
  Send, 
  Users, 
  Building2, 
  Megaphone, 
  AlertCircle,
  CheckCircle,
  Wrench,
  Info,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  createUnitNotification, 
  createNotificationForAllUnits,
  createBillDueNotification,
  createPaymentReceivedNotification,
  createMaintenanceUpdateNotification,
  createAnnouncementNotification,
  createBillGeneratedNotification
} from "@/lib/supabase/notification-helpers"
import { createSampleNotifications } from "@/lib/supabase/sample-notifications"
import { getUnitsFromDB } from "@/lib/supabase/actions"
import { getUnitsWithResidents } from "@/lib/actions/units-actions"
import { NotificationType } from "@/lib/types/notification"
import { testNotificationsTable, testUnitsTable } from "@/lib/supabase/test-database"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { useProjectContext } from "@/lib/contexts/project-context"

export default function NotificationManagementPage() {
  const [units, setUnits] = useState<any[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [notificationType, setNotificationType] = useState<NotificationType>("announcement")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [sendToAll, setSendToAll] = useState(false)
  const { toast } = useToast()
  const currentUser = getCurrentUser()
  const { selectedProjectId } = useProjectContext()

  useEffect(() => {
    loadUnits()
  }, [selectedProjectId])

  const loadUnits = async () => {
    try {
      const result = await getUnitsWithResidents(currentUser.id, selectedProjectId || undefined)
      if (result.success) {
        // Transform to simple array for compatibility
        const simpleUnits = result.units.map((u: any) => ({
          id: u.id,
          unit_number: u.unit_number,
          project_id: u.project_id,
          owner_name: u.owners?.[0]?.name || '',
          tenant_name: u.tenants?.[0]?.name || ''
        }))
        setUnits(simpleUnits)
      } else {
        console.error("Error loading units:", result.error)
        setUnits([])
      }
    } catch (error: any) {
      console.error("Error loading units:", error)
      setUnits([])
    }
  }

  const handleCreateNotification = async () => {
    if (!title || !message) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกหัวข้อและข้อความ",
        variant: "destructive"
      })
      return
    }

    if (!sendToAll && !selectedUnit) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกห้องหรือเลือกส่งให้ทุกห้อง",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      let result
      if (sendToAll) {
        result = await createNotificationForAllUnits(notificationType, title, message, undefined, selectedProjectId || undefined)
      } else {
        // Get unit number from selectedUnit (which is unit_id)
        const selectedUnitData = units.find(u => u.id === selectedUnit)
        const unitNumber = selectedUnitData?.unit_number || selectedUnit
        result = await createUnitNotification(unitNumber, notificationType, title, message, undefined, selectedProjectId || undefined)
      }

      if (result.success) {
        toast({
          title: "สำเร็จ",
          description: `ส่งการแจ้งเตือน${sendToAll ? 'ให้ทุกห้อง' : `ให้ห้อง ${selectedUnit}`} เรียบร้อยแล้ว`
        })
        setIsCreateDialogOpen(false)
        setTitle("")
        setMessage("")
        setSelectedUnit("")
        setSendToAll(false)
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSampleNotifications = async () => {
    setIsLoading(true)
    try {
      const result = await createSampleNotifications()
      if (result.success) {
        toast({
          title: "สำเร็จ",
          description: "สร้างการแจ้งเตือนตัวอย่างเรียบร้อยแล้ว"
        })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestDatabase = async () => {
    setIsLoading(true)
    try {
      console.log('Testing database...')
      
      // Test units table
      const unitsResult = await testUnitsTable()
      console.log('Units test result:', unitsResult)
      
      // Test notifications table
      const notificationsResult = await testNotificationsTable()
      console.log('Notifications test result:', notificationsResult)
      
      toast({
        title: "ผลการทดสอบ",
        description: notificationsResult.needsTableCreation 
          ? "ตาราง notifications ยังไม่มี กรุณารัน SQL script"
          : `Units: ${unitsResult.success ? 'OK' : 'ERROR'} | Notifications: ${notificationsResult.success ? 'OK' : 'ERROR'}`,
        variant: notificationsResult.success ? "default" : "destructive",
      })
    } catch (error: any) {
      console.error('Test error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'payment_due': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'payment_received': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'maintenance_update': return <Wrench className="h-4 w-4 text-blue-500" />
      case 'announcement': return <Megaphone className="h-4 w-4 text-purple-500" />
      case 'bill_generated': return <Info className="h-4 w-4 text-orange-500" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'payment_due': return "แจ้งเตือนการชำระเงิน"
      case 'payment_received': return "ยืนยันการรับชำระเงิน"
      case 'maintenance_update': return "อัปเดตสถานะงานซ่อม"
      case 'announcement': return "ประกาศ"
      case 'bill_generated': return "บิลใหม่"
      default: return type
    }
  }

  return (
    <div>
      <PageHeader
        title="จัดการการแจ้งเตือน"
        subtitle="สร้างและส่งการแจ้งเตือนให้ลูกบ้าน"
        action={
          <div className="flex gap-2">
        <Button variant="outline" onClick={handleCreateSampleNotifications} disabled={isLoading}>
          <Bell className="mr-2 h-4 w-4" />
          สร้างตัวอย่าง
        </Button>
        <Button variant="outline" onClick={handleTestDatabase} disabled={isLoading}>
          <Info className="mr-2 h-4 w-4" />
          ทดสอบฐานข้อมูล
        </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              สร้างการแจ้งเตือน
            </Button>
          </div>
        }
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              ส่งให้ห้องเดียว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              สร้างการแจ้งเตือนสำหรับห้องใดห้องหนึ่ง
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-4 w-4" />
              ส่งให้ทุกห้อง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              สร้างการแจ้งเตือนสำหรับทุกห้องในอาคาร
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              ประเภทการแจ้งเตือน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center text-xs">
                <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
                แจ้งเตือนการชำระเงิน
              </div>
              <div className="flex items-center text-xs">
                <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                ยืนยันการรับชำระเงิน
              </div>
              <div className="flex items-center text-xs">
                <Wrench className="mr-1 h-3 w-3 text-blue-500" />
                อัปเดตสถานะงานซ่อม
              </div>
              <div className="flex items-center text-xs">
                <Megaphone className="mr-1 h-3 w-3 text-purple-500" />
                ประกาศ
              </div>
              <div className="flex items-center text-xs">
                <Info className="mr-1 h-3 w-3 text-orange-500" />
                บิลใหม่
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้างการแจ้งเตือน</DialogTitle>
            <DialogDescription>
              สร้างการแจ้งเตือนใหม่สำหรับลูกบ้าน
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">ประเภทการแจ้งเตือน</Label>
                <Select value={notificationType} onValueChange={(value: NotificationType) => setNotificationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">ประกาศ</SelectItem>
                    <SelectItem value="payment_due">แจ้งเตือนการชำระเงิน</SelectItem>
                    <SelectItem value="payment_received">ยืนยันการรับชำระเงิน</SelectItem>
                    <SelectItem value="maintenance_update">อัปเดตสถานะงานซ่อม</SelectItem>
                    <SelectItem value="bill_generated">บิลใหม่</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sendTo">ส่งให้</Label>
                <Select value={sendToAll ? "all" : "single"} onValueChange={(value) => setSendToAll(value === "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">ห้องเดียว</SelectItem>
                    <SelectItem value="all">ทุกห้อง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!sendToAll && (
              <div>
                <Label htmlFor="unit">เลือกห้อง</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกห้อง" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.unit_number}>
                        {unit.unit_number} - {unit.owner_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="title">หัวข้อ</Label>
              <Input
                id="title"
                placeholder="กรอกหัวข้อการแจ้งเตือน"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="message">ข้อความ</Label>
              <Textarea
                id="message"
                placeholder="กรอกข้อความการแจ้งเตือน"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateNotification} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  ส่งการแจ้งเตือน
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
