"use client"

import { useState, useEffect, useRef } from "react"
import { MaintenanceComment } from "@/lib/types/maintenance"
import { getMaintenanceComments, addMaintenanceComment } from "@/lib/actions/maintenance-actions"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Send, User, UserCircle, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Image from "next/image"

interface MaintenanceCommentsProps {
  maintenanceRequestId: string
  unitNumber: string
  isResident?: boolean
}

export function MaintenanceComments({ maintenanceRequestId, unitNumber, isResident = false }: MaintenanceCommentsProps) {
  const [comments, setComments] = useState<MaintenanceComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const { settings } = useSettings()
  const { toast } = useToast()

  useEffect(() => {
    loadComments()
    // Comment: Remove auto-refresh to prevent constant page reloading
    // Users can manually refresh if needed
  }, [maintenanceRequestId])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const data = await getMaintenanceComments(maintenanceRequestId)
      setComments(data)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          setUploadedImages(prev => [...prev, result])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast({
        title: "กรุณากรอกข้อความ",
        variant: "destructive"
      })
      return
    }

    try {
      await addMaintenanceComment(
        maintenanceRequestId,
        newComment,
        isResident ? unitNumber : 'Staff',
        isResident,
        uploadedImages.length > 0 ? uploadedImages : undefined
      )
      
      setNewComment("")
      setUploadedImages([])
      await loadComments()
      
      toast({
        title: "สำเร็จ",
        description: "เพิ่มคอมเมนต์เรียบร้อยแล้ว"
      })
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-4"><Send className="h-4 w-4 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            ยังไม่มีคอมเมนต์
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={`flex gap-3 ${comment.is_resident ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                comment.is_resident ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
                {comment.is_resident ? (
                  <UserCircle className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div className={`flex-1 ${comment.is_resident ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-lg ${
                  comment.is_resident 
                    ? 'bg-blue-50 text-blue-900' 
                    : 'bg-gray-50 text-gray-900'
                }`}>
                  <p className="font-semibold text-xs mb-1">
                    {comment.is_resident ? unitNumber : 'เจ้าหน้าที่'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                  {comment.image_urls && comment.image_urls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {comment.image_urls.map((url, index) => (
                        <div 
                          key={index} 
                          className="relative w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setViewingImage(url)}
                        >
                          <Image
                            src={url}
                            alt={`Comment image ${index + 1}`}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(comment.created_at, 'short', settings.yearType)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t pt-4 space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="min-h-[80px]"
        />
        
        {/* Image Preview */}
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative w-20 h-20 group">
                <Image
                  src={url}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover rounded"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            เพิ่มรูป
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            <Send className="mr-2 h-4 w-4" />
            ส่ง
          </Button>
        </div>
      </div>

      {/* Image View Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {viewingImage && (
            <div className="relative w-full h-[600px]">
              <Image
                src={viewingImage}
                alt="Viewing image"
                fill
                className="object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewingImage(null)}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

