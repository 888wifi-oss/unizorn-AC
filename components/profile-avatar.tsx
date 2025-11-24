"use client"

import { useState, useRef } from "react"
import { useTheme } from "@/lib/context/theme-context"
import { User, Camera, X } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ProfileAvatar() {
  const { settings, setProfileAvatar } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(settings.profileAvatar || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setPreview(result)
        setProfileAvatar(result)
        setIsOpen(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setPreview(null)
    setProfileAvatar('')
    setIsOpen(false)
  }

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const getInitials = () => {
    // Get initials from localStorage resident data
    if (typeof window !== 'undefined') {
      const residentData = localStorage.getItem('residentData')
      if (residentData) {
        try {
          const info = JSON.parse(residentData)
          const name = info.resident_name || info.owner_name || ''
          if (name.length > 0) {
            return name.charAt(0).toUpperCase()
          }
        } catch (error) {
          console.error('Failed to parse resident data:', error)
        }
      }
    }
    return 'U'
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="w-16 h-16 rounded-full overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors">
            {preview ? (
              <Image src={preview} alt="Profile" width={64} height={64} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">{getInitials()}</span>
              </div>
            )}
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัพโหลดรูปโปรไฟล์</DialogTitle>
            <DialogDescription>
              เลือกรูปภาพที่มีขนาดไม่เกิน 5MB
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {preview && (
              <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-gray-200">
                <Image src={preview} alt="Preview" width={128} height={128} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleChooseFile} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                เลือกรูป
              </Button>
              {preview && (
                <Button variant="outline" onClick={handleRemoveAvatar}>
                  <X className="h-4 w-4 mr-2" />
                  ลบรูป
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
