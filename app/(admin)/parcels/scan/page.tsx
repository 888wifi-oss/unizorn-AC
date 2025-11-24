"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  QrCode,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  Camera,
  Keyboard
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllParcels } from "@/lib/supabase/parcel-actions"
import { Parcel } from "@/lib/types/parcel"

export default function ScanParcelQRPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const manualInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check if there's QR code data in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const data = params.get('data')
      if (data) {
        setQrData(data)
        parseQRCode(data)
      } else {
        // Show manual input option
        setShowManualInput(true)
        setIsLoading(false)
      }
    }
  }, [])

  const handleManualInput = () => {
    const value = manualInputRef.current?.value
    if (value) {
      try {
        setQrData(value)
        parseQRCode(value)
        setShowManualInput(false)
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณากรอกข้อมูล QR Code ให้ถูกต้อง",
          variant: "destructive",
        })
      }
    }
  }

  const parseQRCode = async (data: string) => {
    try {
      console.log('[Scan] Raw QR data:', data)
      
      const parsed = JSON.parse(data)
      console.log('[Scan] Parsed QR Code:', parsed)

      // Validate required fields
      if (!parsed.parcel_id) {
        setError("ข้อมูล QR Code ไม่ถูกต้อง: ไม่พบ parcel_id")
        setIsLoading(false)
        return
      }

      // Get parcel details
      setIsLoading(true)
      const result = await getAllParcels()
      console.log('[Scan] All parcels:', result)
      
      if (result.success && result.parcels) {
        const foundParcel = result.parcels.find(p => p.id === parsed.parcel_id)
        console.log('[Scan] Found parcel:', foundParcel)
        
        if (foundParcel) {
          setParcel(foundParcel)
          
          // Verify that the name matches
          if (foundParcel.recipient_name !== parsed.recipient_name) {
            setError("ชื่อผู้รับไม่ตรงกับในระบบ")
            setIsLoading(false)
            return
          }
          
          // Check if parcel is already picked up
          if (foundParcel.status === 'picked_up') {
            setError("พัสดุนี้ได้รับแล้ว")
          } else if (foundParcel.status !== 'pending') {
            setError(`พัสดุอยู่ในสถานะ: ${foundParcel.status}`)
          }
        } else {
          console.log('[Scan] Parcel not found. Looking for:', parsed.parcel_id)
          setError("ไม่พบพัสดุในระบบ กรุณาตรวจสอบ ID: " + parsed.parcel_id)
        }
      } else {
        setError("ไม่สามารถโหลดข้อมูลพัสดุได้: " + result.error)
      }
    } catch (error: any) {
      console.error('[Scan] Parse error:', error)
      setError("ไม่สามารถอ่านข้อมูล QR Code ได้: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePickup = () => {
    if (!parcel) return
    // Navigate to pickup page with parcel data
    router.push(`/parcels/deliver?parcel=${parcel.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-center text-gray-600">กำลังตรวจสอบข้อมูล QR Code...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showManualInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-600" />
              <CardTitle>สแกน QR Code</CardTitle>
            </div>
            <CardDescription>
              กรอกข้อมูลจาก QR Code ที่ลูกบ้านแสดง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  ref={manualInputRef}
                  type="text"
                  placeholder="วางข้อมูลจาก QR Code ที่นี่"
                  className="font-mono text-sm"
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text')
                    if (pasted) {
                      setTimeout(() => handleManualInput(), 100)
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push('/parcels')}
                  variant="outline"
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleManualInput}
                  className="flex-1"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  ตรวจสอบ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-center text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/parcels')} variant="outline">
              กลับหน้าพัสดุ
            </Button>
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
            <Package className="w-16 h-16 text-gray-400 mb-4" />
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
              <QrCode className="w-6 h-6 text-blue-600" />
              <CardTitle>ข้อมูลผู้รับพัสดุ</CardTitle>
            </div>
            <CardDescription>
              ตรวจสอบข้อมูลผู้ที่มารับพัสดุ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">เลขห้อง</p>
                  <p className="text-lg font-semibold">{parcel.unit_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ชื่อผู้รับ</p>
                  <p className="text-lg font-semibold">{parcel.recipient_name}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">รายละเอียดพัสดุ</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">บริษัทขนส่ง:</span>
                    <span className="text-sm font-medium">{parcel.courier_company}</span>
                  </div>
                  {parcel.tracking_number && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">หมายเลขติดตาม:</span>
                      <span className="text-sm font-medium">{parcel.tracking_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">วันที่รับ:</span>
                    <span className="text-sm font-medium">
                      {new Date(parcel.received_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">สถานะ</p>
                {parcel.status === 'pending' ? (
                  <Badge variant="outline" className="text-yellow-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    รอรับ
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {parcel.status}
                  </Badge>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push('/parcels')}
                    variant="outline"
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handlePickup}
                    disabled={parcel.status !== 'pending'}
                    className="flex-1"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    มอบพัสดุ
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
