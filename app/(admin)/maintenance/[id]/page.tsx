"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { MaintenanceTimeline } from "@/components/maintenance-timeline"
import { MaintenanceComments } from "@/components/maintenance-comments"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateMaintenanceStatusDetailed } from "@/lib/actions/maintenance-actions"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { ArrowLeft, Calendar, User, MapPin, Phone } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface MaintenanceRequest {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  status: string;
  detailed_status: string;
  priority: string;
  location?: string;
  contact_phone?: string;
  reported_by?: string;
  request_type?: string;
  has_cost?: boolean;
  estimated_cost?: number;
  technician_assigned?: string;
  notes?: string;
  image_urls?: string[];
  scheduled_at?: string | null;
  created_at: string;
  units?: {
    unit_number: string;
    owner_name: string;
  };
}

export default function MaintenanceDetailPage() {
  const params = useParams()
  const maintenanceRequestId = params.id as string
  
  const [request, setRequest] = useState<MaintenanceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedDetailedStatus, setSelectedDetailedStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [technician, setTechnician] = useState("")
  const [editRequestType, setEditRequestType] = useState("")
  const [editHasCost, setEditHasCost] = useState(false)
  const [editEstimatedCost, setEditEstimatedCost] = useState("")
  
  const { toast } = useToast()
  const { settings } = useSettings()

  useEffect(() => {
    if (maintenanceRequestId) {
      loadRequest()
    }
  }, [maintenanceRequestId])

  const loadRequest = async () => {
    const supabase = createClient()
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          units (
            unit_number,
            owner_name
          )
        `)
        .eq('id', maintenanceRequestId)
        .single()

      if (error) throw error

      setRequest(data)
      setSelectedStatus(data.status)
      setSelectedDetailedStatus(data.detailed_status || 'new')
      setTechnician(data.technician_assigned || '')
      setEditRequestType(data.request_type || 'ช่างส่วนกลาง')
      setEditHasCost(data.has_cost || false)
      setEditEstimatedCost(data.estimated_cost?.toString() || '')
    } catch (error) {
      console.error('Error loading request:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!request) return

    setIsUpdating(true)
    const supabase = createClient()
    try {
      // Update with request type and cost
      await supabase
        .from('maintenance_requests')
        .update({ 
          request_type: editRequestType,
          has_cost: editHasCost,
          estimated_cost: editEstimatedCost ? parseFloat(editEstimatedCost) : null
        })
        .eq('id', request.id)

      await updateMaintenanceStatusDetailed(
        request.id,
        selectedStatus,
        selectedDetailedStatus,
        'staff',
        notes
      )
      
      toast({
        title: "สำเร็จ",
        description: "อัปเดตสถานะเรียบร้อยแล้ว"
      })
      
      await loadRequest()
      setNotes("")
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge className="bg-blue-100 text-blue-700">ใหม่</Badge>
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-700">กำลังดำเนินการ</Badge>
      case 'preparing_materials': return <Badge className="bg-purple-100 text-purple-700">เตรียมวัสดุ</Badge>
      case 'waiting_technician': return <Badge className="bg-orange-100 text-orange-700">รอช่าง</Badge>
      case 'fixing': return <Badge className="bg-indigo-100 text-indigo-700">กำลังแก้ไข</Badge>
      case 'completed': return <Badge className="bg-green-100 text-green-700">เสร็จสิ้น</Badge>
      case 'cancelled': return <Badge variant="destructive">ยกเลิก</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low': return <Badge variant="outline">ต่ำ</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-700">ปานกลาง</Badge>
      case 'high': return <Badge variant="destructive">สูง</Badge>
      default: return null
    }
  }

  if (isLoading || !request) {
    return <div className="flex items-center justify-center py-20">กำลังโหลด...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/maintenance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">รายละเอียดการแจ้งซ่อม</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Info */}
          <Card>
            <CardHeader>
              <CardTitle>{request.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge>{request.units?.unit_number}</Badge>
                  <span className="text-muted-foreground">{request.units?.owner_name}</span>
                </div>
                {getStatusBadge(request.detailed_status)}
                {getPriorityBadge(request.priority)}
                {request.scheduled_at && (
                  <Badge className="bg-blue-100 text-blue-700">
                    📅 มีการนัดหมาย - {new Date(request.scheduled_at).toLocaleDateString('th-TH')} เวลา {new Date(request.scheduled_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">รายละเอียดปัญหา</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.description}</p>
              </div>

              {request.image_urls && request.image_urls.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">รูปภาพ</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {request.image_urls.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={url}
                          alt={`Request image ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">ประเภทการซ่อม</Label>
                  <p className="font-medium">{request.request_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">มีค่าใช้จ่าย</Label>
                  <p className="font-medium">{request.has_cost ? 'ใช่' : 'ไม่'}</p>
                </div>
                {request.estimated_cost && (
                  <div>
                    <Label className="text-muted-foreground">ค่าใช้จ่ายประมาณ</Label>
                    <p className="font-medium">{request.estimated_cost.toLocaleString()} บาท</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(request.created_at, 'medium', settings.yearType)}
                </div>
                {request.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {request.location}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>เส้นทางการสถานะ</CardTitle>
            </CardHeader>
            <CardContent>
              <MaintenanceTimeline maintenanceRequestId={request.id} />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>การติดต่อ</CardTitle>
            </CardHeader>
            <CardContent>
              <MaintenanceComments 
                maintenanceRequestId={request.id}
                unitNumber={request.units?.unit_number || ''}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>อัปเดตสถานะ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>สถานะ</Label>
                <Select value={selectedDetailedStatus} onValueChange={setSelectedDetailedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">ใหม่</SelectItem>
                    <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="preparing_materials">เตรียมวัสดุ</SelectItem>
                    <SelectItem value="waiting_technician">รอช่าง</SelectItem>
                    <SelectItem value="fixing">กำลังแก้ไข</SelectItem>
                    <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>ประเภทการซ่อม</Label>
                <Select value={editRequestType} onValueChange={setEditRequestType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ช่างส่วนกลาง">ช่างส่วนกลาง</SelectItem>
                    <SelectItem value="ซ่อมนอก">ซ่อมนอก</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-has-cost"
                    checked={editHasCost}
                    onChange={(e) => setEditHasCost(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-has-cost" className="cursor-pointer">มีค่าใช้จ่าย</Label>
                </div>
                {editHasCost && (
                  <div>
                    <Label>ค่าใช้จ่ายประมาณ (บาท)</Label>
                    <Input
                      type="number"
                      value={editEstimatedCost}
                      onChange={(e) => setEditEstimatedCost(e.target.value)}
                      placeholder="กรุณาระบุจำนวนเงิน"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>หมายเหตุ</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เพิ่มหมายเหตุ..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleStatusUpdate} 
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? 'กำลังอัปเดต...' : 'อัปเดตสถานะ'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

