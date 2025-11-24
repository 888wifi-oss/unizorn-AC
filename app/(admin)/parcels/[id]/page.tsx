"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  Package, 
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  QrCode,
  User,
  Phone,
  CreditCard,
  Calendar,
  Truck,
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllParcels } from "@/lib/supabase/parcel-actions"
import { Parcel } from "@/lib/types/parcel"

export default function ParcelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isViewImageDialogOpen, setIsViewImageDialogOpen] = useState(false)

  useEffect(() => {
    loadParcelDetail()
  }, [])

  const loadParcelDetail = async () => {
    setIsLoading(true)
    try {
      const result = await getAllParcels()
      if (result.success && result.parcels) {
        const foundParcel = result.parcels.find(p => p.id === params.id)
        if (foundParcel) {
          setParcel(foundParcel)
        } else {
          toast({
            title: "ไม่พบพัสดุ",
            description: "ไม่พบพัสดุที่ค้นหา",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถโหลดข้อมูลได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />รอรับ</Badge>
      case 'delivered':
        return <Badge variant="outline" className="text-blue-600"><Package className="w-3 h-3 mr-1" />ส่งมอบแล้ว</Badge>
      case 'picked_up':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />รับแล้ว</Badge>
      case 'expired':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />หมดอายุ</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!parcel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบพัสดุ</h2>
        <p className="text-gray-600 mb-4">ไม่พบพัสดุที่ค้นหา</p>
        <Button onClick={() => router.push('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับหน้าแรก
        </Button>
      </div>
    )
  }

  const daysLeft = getDaysUntilExpiry(parcel.expires_at)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button 
          onClick={() => router.push('/parcels')} 
          variant="outline" 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับ
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{parcel.recipient_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Truck className="w-4 h-4" />
                  {parcel.courier_company}
                  {parcel.tracking_number && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {parcel.tracking_number}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                {getStatusBadge(parcel.status)}
                <p className="text-sm text-muted-foreground mt-2">
                  {daysLeft > 0 ? `เหลือ ${daysLeft} วัน` : 'หมดอายุแล้ว'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">วันที่รับ:</span>
                    <span>{formatDate(parcel.received_at)}</span>
                  </div>
                  {parcel.picked_up_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium">วันที่รับแล้ว:</span>
                      <span>{formatDate(parcel.picked_up_at)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">เจ้าหน้าที่รับ:</span>
                    <span>{parcel.staff_received_by}</span>
                  </div>
                  {parcel.staff_delivered_by && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">เจ้าหน้าที่มอบ:</span>
                      <span>{parcel.staff_delivered_by}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">เลขห้อง:</span>
                    <span>{parcel.unit_number}</span>
                  </div>
                  {parcel.picked_up_by && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">ผู้รับ:</span>
                      <span>{parcel.picked_up_by}</span>
                    </div>
                  )}
                  {parcel.picked_up_method && (
                    <div className="flex items-center gap-2 text-sm">
                      {parcel.picked_up_method === 'qr_code' ? <QrCode className="w-4 h-4" /> :
                       parcel.picked_up_method === 'id_card' ? <CreditCard className="w-4 h-4" /> :
                       parcel.picked_up_method === 'phone' ? <Phone className="w-4 h-4" /> :
                       <User className="w-4 h-4" />}
                      <span className="font-medium">วิธีรับ:</span>
                      <span>{
                        parcel.picked_up_method === 'qr_code' ? 'QR Code' :
                        parcel.picked_up_method === 'id_card' ? 'บัตรประจำตัว' :
                        parcel.picked_up_method === 'phone' ? 'เบอร์โทรศัพท์' :
                        parcel.picked_up_method === 'unit_code' ? 'รหัสห้อง' : parcel.picked_up_method
                      }</span>
                    </div>
                  )}
                </div>
              </div>

              {parcel.parcel_description && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">รายละเอียด:</h3>
                  <p className="text-sm text-muted-foreground">{parcel.parcel_description}</p>
                </div>
              )}

              {parcel.parcel_image_url && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium">รูปภาพพัสดุ</h3>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsViewImageDialogOpen(true)
                    }}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    ดูรูปพัสดุ
                  </Button>
                </div>
              )}

              {daysLeft <= 3 && daysLeft > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      กรุณารับพัสดุภายใน {daysLeft} วัน
                    </span>
                  </div>
                </div>
              )}

              {parcel.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">หมายเหตุ:</h3>
                  <p className="text-sm text-muted-foreground">{parcel.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Image Dialog */}
      <Dialog open={isViewImageDialogOpen} onOpenChange={setIsViewImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รูปภาพพัสดุ</DialogTitle>
            <DialogDescription>
              รูปภาพพัสดุที่บันทึกไว้ในระบบ
            </DialogDescription>
          </DialogHeader>
          {parcel.parcel_image_url ? (
            <div className="flex items-center justify-center p-4">
              <img 
                src={parcel.parcel_image_url} 
                alt="Parcel Image" 
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-center text-gray-500">
              ไม่มีรูปภาพ
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewImageDialogOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
















