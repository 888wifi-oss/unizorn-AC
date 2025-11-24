"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface MaintenanceSchedule {
  id: string
  title: string
  status: string
  detailed_status: string
  priority: string
  scheduled_at: string | null
  scheduled_duration: number
  appointment_type: string
  reported_by: string
  unit_number: string
  owner_name: string
  owner_email: string
}

export default function MaintenanceCalendarPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { settings } = useSettings()
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [allMaintenanceRequests, setAllMaintenanceRequests] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedRequestId, setSelectedRequestId] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [duration, setDuration] = useState("60")
  const [appointmentType, setAppointmentType] = useState("normal")

  useEffect(() => {
    loadSchedules()
    loadAllMaintenanceRequests()
  }, [])

  const loadSchedules = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('maintenance_schedule_view')
        .select('*')
        .order('scheduled_at', { ascending: true })

      if (error) throw error
      setSchedules(data || [])
    } catch (error: any) {
      console.error('Error loading schedules:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllMaintenanceRequests = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('id, title, units(unit_number, owner_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllMaintenanceRequests(data || [])
    } catch (error: any) {
      console.error('Error loading maintenance requests:', error)
    }
  }

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return schedules.filter(s => s.scheduled_at?.startsWith(dateStr))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleScheduleAppointment = async () => {
    if (!selectedRequestId || !scheduledDate || !scheduledTime) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        variant: "destructive"
      })
      return
    }

    try {
      const supabase = createClient()
      const scheduledAt = `${scheduledDate}T${scheduledTime}:00`
      
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          scheduled_at: scheduledAt,
          scheduled_duration: parseInt(duration),
          appointment_type: appointmentType
        })
        .eq('id', selectedRequestId)

      if (error) throw error

      toast({
        title: "สำเร็จ",
        description: "นัดหมายการซ่อมเรียบร้อยแล้ว"
      })

      setIsDialogOpen(false)
      setSelectedRequestId("")
      setScheduledDate("")
      setScheduledTime("")
      setDuration("60")
      setAppointmentType("normal")
      
      // Send email notification
      const { sendAppointmentEmail } = await import('@/lib/actions/maintenance-actions')
      await sendAppointmentEmail(selectedRequestId)

      await loadSchedules()
      await loadAllMaintenanceRequests()
    } catch (error: any) {
      console.error('Error scheduling appointment:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        variant: "destructive"
      })
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">สูง</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-700">ปานกลาง</Badge>
      case 'low': return <Badge variant="outline">ต่ำ</Badge>
      default: return null
    }
  }

  const getScheduleStatus = (scheduledAt: string | null) => {
    if (!scheduledAt) return 'not_scheduled'
    const scheduled = new Date(scheduledAt)
    const now = new Date()
    if (scheduled > now) return 'upcoming'
    if (scheduled <= now) return 'past'
    return 'past'
  }

  const selectedDateSchedules = getSchedulesForDate(selectedDate)

  // Get previous/next month
  const currentMonth = calendarDate.getMonth()
  const currentYear = calendarDate.getFullYear()

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/maintenance')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ตารางนัดหมายการซ่อม</h1>
            <p className="text-sm text-muted-foreground">
              {currentYear} - {new Date(currentYear, currentMonth, 1).toLocaleDateString('th-TH', { month: 'long' })}
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              นัดหมายใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>นัดหมายการซ่อม</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>รายการซ่อม</Label>
                <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกรายการซ่อม" />
                  </SelectTrigger>
                  <SelectContent>
                    {allMaintenanceRequests.map(request => {
                      const unitInfo = request.units as any
                      return (
                        <SelectItem key={request.id} value={request.id}>
                          {request.title} - {unitInfo?.unit_number || 'N/A'}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>วันที่</Label>
                  <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                </div>
                <div>
                  <Label>เวลา</Label>
                  <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>ระยะเวลา (นาที)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
              <div>
                <Label>ประเภทนัดหมาย</Label>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">ปกติ</SelectItem>
                    <SelectItem value="urgent">ด่วน</SelectItem>
                    <SelectItem value="emergency">ฉุกเฉิน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleScheduleAppointment} className="w-full">
                ยืนยันการนัดหมาย
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>ปฏิทิน</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => {
                    const prevMonth = new Date(calendarDate)
                    prevMonth.setMonth(prevMonth.getMonth() - 1)
                    setCalendarDate(prevMonth)
                  }}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => {
                    const nextMonth = new Date(calendarDate)
                    nextMonth.setMonth(nextMonth.getMonth() + 1)
                    setCalendarDate(nextMonth)
                  }}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date())}>
                    วันนี้
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={calendarDate}
                onMonthChange={setCalendarDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </div>

        {/* Events for Selected Date */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {formatDate(selectedDate.toISOString(), 'medium', settings.yearType)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-sm text-muted-foreground">กำลังโหลด...</div>
              ) : selectedDateSchedules.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  ไม่มีการนัดหมาย
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateSchedules.map(schedule => (
                    <div key={schedule.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{schedule.title}</h4>
                        {getPriorityBadge(schedule.priority)}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>ห้อง: {schedule.unit_number}</p>
                        <p>ผู้แจ้ง: {schedule.reported_by}</p>
                        <p>เวลา: {new Date(schedule.scheduled_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p>ระยะเวลา: {schedule.scheduled_duration} นาที</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getScheduleStatus(schedule.scheduled_at) === 'past' ? 'secondary' : 'default'}>
                            {schedule.detailed_status}
                          </Badge>
                          {schedule.appointment_type === 'urgent' && <Badge variant="destructive">ด่วน</Badge>}
                          {schedule.appointment_type === 'emergency' && <Badge variant="destructive">ฉุกเฉิน</Badge>}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => router.push(`/maintenance/${schedule.id}`)}
                      >
                        ดูรายละเอียดการซ่อม
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>สรุปรายเดือน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ทั้งหมด</span>
                  <span className="font-semibold">{schedules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>ที่ผ่านมาแล้ว</span>
                  <span className="font-semibold text-gray-600">{schedules.filter(s => getScheduleStatus(s.scheduled_at) === 'past').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>ที่กำลังจะมาถึง</span>
                  <span className="font-semibold text-blue-600">{schedules.filter(s => getScheduleStatus(s.scheduled_at) === 'upcoming').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

