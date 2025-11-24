"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Loader2,
  Calendar,
  Truck,
  AlertCircle,
  Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getParcelsForUnit } from "@/lib/supabase/parcel-actions"
import { Parcel } from "@/lib/types/parcel"
import { generateQRCodeDataURL } from "@/lib/utils/qr-code-export"

interface ParcelViewProps {
  unitNumber: string
}

const translations = {
  th: {
    title: "พัสดุของฉัน",
    subtitle: "จัดการพัสดุที่มาถึง",
    refresh: "รีเฟรช",
    newParcels: "พัสดุใหม่",
    waiting: "รอรับ",
    received: "รับแล้ว",
    thisMonth: "ในเดือนนี้",
    all: "ทั้งหมด",
    allParcels: "พัสดุทั้งหมด",
    noNewParcels: "ไม่มีพัสดุใหม่",
    noPendingParcels: "ยังไม่มีพัสดุที่รอรับ",
    noReceivedParcels: "ยังไม่มีการรับพัสดุ",
    noReceivedParcelsDesc: "ยังไม่มีพัสดุที่รับแล้ว",
    arrivedAt: "มาถึง:",
    details: "รายละเอียด:",
    daysLeft: "เหลือ",
    days: "วัน",
    expired: "หมดอายุแล้ว",
    downloadQR: "ดาวน์โหลด QR Code",
    viewImage: "ดูรูปพัสดุ",
    status: {
      pending: "รอรับ",
      delivered: "ส่งมอบแล้ว",
      picked_up: "รับแล้ว",
      expired: "หมดอายุ"
    }
  },
  en: {
    title: "My Parcels",
    subtitle: "Manage incoming parcels",
    refresh: "Refresh",
    newParcels: "New Parcels",
    waiting: "Waiting",
    received: "Received",
    thisMonth: "This Month",
    all: "All",
    allParcels: "All Parcels",
    noNewParcels: "No New Parcels",
    noPendingParcels: "No pending parcels",
    noReceivedParcels: "No Received Parcels",
    noReceivedParcelsDesc: "No parcels received yet",
    arrivedAt: "Arrived:",
    details: "Details:",
    daysLeft: "",
    days: "days left",
    expired: "Expired",
    downloadQR: "Download QR Code",
    viewImage: "View Parcel Image",
    status: {
      pending: "Waiting",
      delivered: "Delivered",
      picked_up: "Received",
      expired: "Expired"
    }
  }
}

export default function ParcelView({ unitNumber }: ParcelViewProps) {
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [language, setLanguage] = useState<'th' | 'en'>('th')
  
  useEffect(() => {
    const updateLanguage = () => {
      if (typeof window !== 'undefined') {
        const savedLang = localStorage.getItem('portal-language') || 'th'
        setLanguage(savedLang as 'th' | 'en')
      }
    }
    updateLanguage()
    const interval = setInterval(updateLanguage, 500)
    return () => clearInterval(interval)
  }, [])
  
  const t = translations[language]
  
  // State for viewing parcel image
  const [isViewImageDialogOpen, setIsViewImageDialogOpen] = useState(false)
  const [viewingImageUrl, setViewingImageUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadParcels()
  }, [unitNumber])

  const loadParcels = async () => {
    setIsLoading(true)
    try {
      const result = await getParcelsForUnit(unitNumber)
      if (result.success) {
        setParcels(result.parcels)
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
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
    const statusLabels: Record<string, string> = {
      'pending': t.status.pending,
      'delivered': t.status.delivered,
      'picked_up': t.status.picked_up,
      'expired': t.status.expired
    }
    const statusLabel = statusLabels[status] || status
    
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />{statusLabel}</Badge>
      case 'delivered':
        return <Badge variant="outline" className="text-blue-600"><Package className="w-3 h-3 mr-1" />{statusLabel}</Badge>
      case 'picked_up':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />{statusLabel}</Badge>
      case 'expired':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />{statusLabel}</Badge>
      default:
        return <Badge variant="outline">{statusLabel}</Badge>
    }
  }

  const getPickupMethodIcon = (method: string) => {
    switch (method) {
      case 'qr_code':
        return <QrCode className="w-4 h-4" />
      case 'id_card':
        return <CreditCard className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      case 'unit_code':
        return <User className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const pendingParcels = parcels.filter(p => p.status === 'pending')
  const pickedUpParcels = parcels.filter(p => p.status === 'picked_up')
  const allParcels = parcels

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateQRCodeForParcel = async (parcel: Parcel) => {
    try {
      console.log('[QR] Generating QR Code for parcel:', parcel)
      
      // สร้าง QR Code ที่มีข้อมูลสำหรับระบุตัวตนลูกบ้าน
      const qrData = JSON.stringify({
        unit_number: parcel.unit_number,
        recipient_name: parcel.recipient_name,
        parcel_id: parcel.id,
        timestamp: Date.now()
      })
      
      console.log('[QR] QR Code data:', qrData)
      
      const qrCodeDataURL = await generateQRCodeDataURL(qrData)
      
      console.log('[QR] QR Code generated successfully')
      
      // Create download
      const link = document.createElement('a')
      link.href = qrCodeDataURL
      link.download = `parcel_qr_${parcel.unit_number}_${Date.now()}.png`
      link.click()
      
      toast({
        title: "ดาวน์โหลด QR Code สำเร็จ",
        description: "QR Code สำหรับยืนยันตัวตนเมื่อมารับพัสดุ",
      })
    } catch (error: any) {
      console.error('[QR] Error generating QR Code:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button onClick={loadParcels} disabled={isLoading} variant="outline">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.refresh}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.newParcels}</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingParcels.length}</div>
            <p className="text-xs text-muted-foreground">{t.waiting}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.received}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{pickedUpParcels.length}</div>
            <p className="text-xs text-muted-foreground">{t.thisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.all}</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{allParcels.length}</div>
            <p className="text-xs text-muted-foreground">{t.allParcels}</p>
          </CardContent>
        </Card>
      </div>

      {/* Parcels Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            {t.newParcels} ({pendingParcels.length})
          </TabsTrigger>
          <TabsTrigger value="picked_up">
            {t.received} ({pickedUpParcels.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            {t.all} ({allParcels.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingParcels.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t.noNewParcels}</h3>
                <p className="text-muted-foreground">{t.noPendingParcels}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingParcels.map((parcel) => {
                const daysLeft = getDaysUntilExpiry(parcel.expires_at)
                return (
                  <Card key={parcel.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{parcel.recipient_name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
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
                          <p className="text-sm text-muted-foreground mt-1">
                            {daysLeft > 0 ? `${t.daysLeft} ${daysLeft} ${t.days}` : t.expired}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{t.arrivedAt} {formatDate(parcel.received_at)}</span>
                        </div>
                        {parcel.parcel_description && (
                          <div className="text-sm text-muted-foreground">
                            <strong>{t.details}</strong> {parcel.parcel_description}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {parcel.parcel_image_url && (
                            <>
                              <Camera className="w-4 h-4 text-muted-foreground" />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setViewingImageUrl(parcel.parcel_image_url)
                                  setIsViewImageDialogOpen(true)
                                }}
                              >
                                {t.viewImage}
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateQRCodeForParcel(parcel)}
                            className="ml-2"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {t.downloadQR}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>เจ้าหน้าที่รับ: {parcel.staff_received_by}</span>
                        </div>
                        {daysLeft <= 3 && daysLeft > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                กรุณารับพัสดุภายใน {daysLeft} วัน
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="picked_up" className="space-y-4">
          {pickedUpParcels.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t.noReceivedParcels}</h3>
                <p className="text-muted-foreground">{t.noReceivedParcelsDesc}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pickedUpParcels.map((parcel) => (
                <Card key={parcel.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{parcel.recipient_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Truck className="w-4 h-4" />
                          {parcel.courier_company}
                          {parcel.tracking_number && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {parcel.tracking_number}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(parcel.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>มาถึง: {formatDate(parcel.received_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>รับเมื่อ: {parcel.picked_up_at ? formatDate(parcel.picked_up_at) : '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>ผู้รับ: {parcel.picked_up_by}</span>
                      </div>
                      {parcel.picked_up_method && (
                        <div className="flex items-center gap-2 text-sm">
                          {getPickupMethodIcon(parcel.picked_up_method)}
                          <span>ยืนยันด้วย: {
                            parcel.picked_up_method === 'qr_code' ? 'QR Code' :
                            parcel.picked_up_method === 'id_card' ? 'บัตรประชาชน' :
                            parcel.picked_up_method === 'phone' ? 'เบอร์โทรศัพท์' :
                            parcel.picked_up_method === 'unit_code' ? 'รหัสห้อง' : parcel.picked_up_method
                          }</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>เจ้าหน้าที่มอบ: {parcel.staff_delivered_by}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allParcels.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">ไม่มีพัสดุ</h3>
                <p className="text-muted-foreground">ยังไม่มีพัสดุในระบบ</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allParcels.map((parcel) => (
                <Card key={parcel.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{parcel.recipient_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Truck className="w-4 h-4" />
                          {parcel.courier_company}
                          {parcel.tracking_number && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {parcel.tracking_number}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(parcel.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>มาถึง: {formatDate(parcel.received_at)}</span>
                      </div>
                      {parcel.picked_up_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>รับเมื่อ: {formatDate(parcel.picked_up_at)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>เจ้าหน้าที่รับ: {parcel.staff_received_by}</span>
                      </div>
                      {parcel.staff_delivered_by && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>เจ้าหน้าที่มอบ: {parcel.staff_delivered_by}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Image Dialog */}
      <Dialog open={isViewImageDialogOpen} onOpenChange={setIsViewImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รูปภาพพัสดุ</DialogTitle>
            <DialogDescription>
              รูปภาพพัสดุที่บันทึกไว้ในระบบ
            </DialogDescription>
          </DialogHeader>
          {viewingImageUrl ? (
            <div className="flex items-center justify-center p-4">
              <img 
                src={viewingImageUrl} 
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
