"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, FileImage, Loader2 } from "lucide-react"

interface SlipUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string
  onSuccess: () => void
}

export function SlipUploadDialog({
  open,
  onOpenChange,
  transactionId,
  onSuccess,
}: SlipUploadDialogProps) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
        toast({
          title: "ไฟล์ไม่ถูกต้อง",
          description: "กรุณาเลือกไฟล์ภาพ (JPG, PNG) หรือ PDF",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "ไฟล์ใหญ่เกินไป",
          description: "กรุณาเลือกไฟล์ที่เล็กกว่า 5MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)

      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setPreview(null)
      }
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "กรุณาเลือกไฟล์",
        description: "กรุณาเลือกไฟล์สลิปการชำระเงิน",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('transactionId', transactionId)
      formData.append('file', file)

      const response = await fetch('/api/v1/payments/upload-slip', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error message if available
        if (data.requiresManualSetup && data.instructions) {
          const errorMsg = `${data.error}\n\n${data.instructions}`
          throw new Error(errorMsg)
        }
        throw new Error(data.error || 'Failed to upload slip')
      }

      toast({
        title: "อัพโหลดสำเร็จ",
        description: "สลิปการชำระเงินถูกอัพโหลดแล้ว รอการยืนยันจากเจ้าหน้าที่",
      })

      onSuccess()
      onOpenChange(false)
      setFile(null)
      setPreview(null)
    } catch (error: any) {
      console.error('[Slip Upload] Error:', error)
      
      // If it's a bucket not found error, show more detailed instructions
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        const instructions = error.message.includes('\n') 
          ? error.message 
          : `Storage bucket "payment-slips" ยังไม่ได้สร้าง

กรุณาสร้างใน Supabase Dashboard:
1. ไปที่ Storage > New Bucket
2. ชื่อ: payment-slips (ตั้งเป็น Private)
3. คลิก Create bucket
4. ไปที่ Policies tab สร้าง 3 Policies:
   - INSERT: bucket_id = 'payment-slips'
   - SELECT: bucket_id = 'payment-slips'
   - DELETE: bucket_id = 'payment-slips'

ดูรายละเอียดเพิ่มเติมใน: PAYMENT_SLIPS_BUCKET_SETUP.md`
        
        toast({
          title: "❌ Storage Bucket ยังไม่ได้สร้าง",
          description: instructions,
          variant: "destructive",
          duration: 20000, // Show for 20 seconds
        })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: error.message || "ไม่สามารถอัพโหลดไฟล์ได้",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>อัพโหลดสลิปการชำระเงิน</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>เลือกไฟล์สลิป</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Slip preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-600">{file?.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileImage className="w-16 h-16 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      ลากไฟล์มาวางที่นี่ หรือ
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      เลือกไฟล์
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    รองรับไฟล์ JPG, PNG, PDF (ไม่เกิน 5MB)
                  </p>
                </div>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleUpload}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังอัพโหลด...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                อัพโหลดสลิป
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

