"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Package,
  Loader2,
  CheckCircle,
  AlertCircle,
  QrCode
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllParcels, pickupParcel } from "@/lib/supabase/parcel-actions"
import { Parcel, ParcelPickupData } from "@/lib/types/parcel"
import { getCurrentUser } from "@/lib/utils/mock-auth"

export default function DeliverParcelPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentUser = getCurrentUser()

  const [pickupData, setPickupData] = useState<ParcelPickupData>({
    parcel_id: "",
    picked_up_by: "",
    picked_up_method: "qr_code",
    staff_delivered_by: "",
    digital_signature: "",
    delivery_photo_url: "",
    notes: ""
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const parcelId = params.get('parcel')
      if (parcelId) {
        loadParcel(parcelId)
      } else {
        setIsLoading(false)
      }
    }
  }, [])

  const loadParcel = async (parcelId: string) => {
    setIsLoading(true)
    try {
      const result = await getAllParcels()
      if (result.success && result.parcels) {
        const foundParcel = result.parcels.find(p => p.id === parcelId)
        if (foundParcel) {
          setParcel(foundParcel)
          setPickupData({
            ...pickupData,
            parcel_id: foundParcel.id,
            picked_up_by: foundParcel.recipient_name, // Auto-fill from QR code
            staff_delivered_by: currentUser.name || ""
          })
        }
      }
    } catch (error: any) {
      console.error('Error loading parcel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!pickupData.picked_up_by || !pickupData.staff_delivered_by) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await pickupParcel(pickupData)
      if (result.success) {
        toast({
          title: "สำเร็จ",
          description: "บันทึกการรับพัสดุเรียบร้อยแล้ว",
        })
        setTimeout(() => {
          router.push('/parcels')
        }, 1500)
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
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-center text-gray-600">กำลังโหลดข้อมูล...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!parcel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบพัสดุ</h2>
            <p className="text-center text-gray-600 mb-4">ไม่พบพัสดุในระบบ</p>
            <Button onClick={() => router.push('/parcels')} variant="outline">
              กลับหน้าพัสดุ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-6 h-6 text-blue-600" />
              <CardTitle>มอบพัสดุ</CardTitle>
            </div>
            <CardDescription>
              บันทึกการมอบพัสดุให้ลูกบ้าน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Parcel Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">เลขห้อง:</span>
                  <span className="text-sm font-medium">{parcel.unit_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ผู้รับ (จาก QR Code):</span>
                  <span className="text-sm font-medium">{parcel.recipient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">บริษัทขนส่ง:</span>
                  <span className="text-sm font-medium">{parcel.courier_company}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="picked_up_by">ชื่อผู้รับพัสดุ *</Label>
                  <Input
                    id="picked_up_by"
                    value={pickupData.picked_up_by}
                    onChange={(e) => setPickupData({...pickupData, picked_up_by: e.target.value})}
                    placeholder="ชื่อผู้ที่มารับพัสดุ"
                  />
                </div>

                <div>
                  <Label htmlFor="picked_up_method">วิธีการยืนยันตัวตน *</Label>
                  <Select 
                    value={pickupData.picked_up_method} 
                    onValueChange={(value: any) => setPickupData({...pickupData, picked_up_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qr_code">QR Code (สแกนแล้ว)</SelectItem>
                      <SelectItem value="id_card">บัตรประจำตัว</SelectItem>
                      <SelectItem value="phone">เบอร์โทรศัพท์</SelectItem>
                      <SelectItem value="unit_code">รหัสห้อง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="staff_delivered_by">เจ้าหน้าที่ส่งมอบ *</Label>
                  <Input
                    id="staff_delivered_by"
                    value={pickupData.staff_delivered_by}
                    onChange={(e) => setPickupData({...pickupData, staff_delivered_by: e.target.value})}
                    placeholder="ชื่อเจ้าหน้าที่ที่ส่งมอบ"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">หมายเหตุ</Label>
                  <Textarea
                    id="notes"
                    value={pickupData.notes}
                    onChange={(e) => setPickupData({...pickupData, notes: e.target.value})}
                    placeholder="หมายเหตุเพิ่มเติม"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => router.push('/parcels')}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      ยืนยันการมอบ
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
















