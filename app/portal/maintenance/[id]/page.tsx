"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { MaintenanceTimeline } from "@/components/maintenance-timeline"
import { MaintenanceComments } from "@/components/maintenance-comments"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { ArrowLeft, Calendar, User, MapPin, Phone } from "lucide-react"
import { Label } from "@/components/ui/label"
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
  created_at: string;
  units?: {
    unit_number: string;
    owner_name: string;
  };
}

export default function MaintenanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const maintenanceRequestId = params.id as string
  
  const [request, setRequest] = useState<MaintenanceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { settings } = useSettings()

  const loadRequest = useCallback(async () => {
    if (!maintenanceRequestId) return
    
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

      // Clean image_urls if it's a string
      if (data.image_urls && typeof data.image_urls === 'string') {
        try {
          data.image_urls = JSON.parse(data.image_urls)
        } catch (e) {
          console.warn('Invalid image_urls:', e)
          data.image_urls = []
        }
      }

      setRequest(data)
    } catch (error: any) {
      console.error('Error loading request:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [maintenanceRequestId, toast])

  useEffect(() => {
    loadRequest()
  }, [loadRequest])

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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
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
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge>{request.units?.unit_number}</Badge>
                  <span className="text-muted-foreground">{request.units?.owner_name}</span>
                </div>
                {getStatusBadge(request.detailed_status)}
                {getPriorityBadge(request.priority)}
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
                {request.request_type && (
                  <div>
                    <Label className="text-muted-foreground">ประเภทการซ่อม</Label>
                    <p className="font-medium">{request.request_type}</p>
                  </div>
                )}
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
                isResident={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

