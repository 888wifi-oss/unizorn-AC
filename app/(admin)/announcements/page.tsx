"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Pin, PinOff, Image as ImageIcon, FileText, X } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { getAnnouncements, saveAnnouncement, deleteAnnouncement } from "@/lib/supabase/actions"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { Switch } from "@/components/ui/switch"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface Announcement {
  id: string;
  title: string;
  content: string;
  publish_date: string;
  is_pinned: boolean;
  project_id?: string;
  category?: string;
  image_urls?: string[];
  attachments?: string[];
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()
  const { settings } = useSettings()
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_pinned: false,
    publish_date: new Date().toISOString().split("T")[0],
    category: "ทั่วไป",
    image_urls: [] as string[],
    attachments: [] as string[]
  })

  useEffect(() => {
    console.log('[Announcements] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedProjectId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log('[Announcements] Loading announcements...')
      const data = await getAnnouncements()
      setAllAnnouncements(data)
      console.log('[Announcements] Total from DB:', data.length)
      
      // Filter by selected project (for non-Super Admin)
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        const filtered = data.filter(item => item.project_id === selectedProjectId)
        console.log('[Announcements] Filtered:', data.length, '→', filtered.length)
        setAnnouncements(filtered)
      } else {
        console.log('[Announcements] No filtering (Super Admin)')
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('[Announcements] Load error:', error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลประกาศได้", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          setFormData(prev => ({
            ...prev,
            image_urls: [...prev.image_urls, result]
          }))
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, `${file.name}|${result}`]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingId(announcement.id)
      setFormData({
        title: announcement.title,
        content: announcement.content,
        is_pinned: announcement.is_pinned,
        publish_date: announcement.publish_date,
        category: announcement.category || "ทั่วไป",
        image_urls: announcement.image_urls || [],
        attachments: announcement.attachments || []
      })
    } else {
      setEditingId(null)
      setFormData({
        title: "",
        content: "",
        is_pinned: false,
        publish_date: new Date().toISOString().split("T")[0],
        category: "ทั่วไป",
        image_urls: [],
        attachments: []
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกหัวข้อและเนื้อหาประกาศ", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      console.log('[Announcements] Saving with project_id:', selectedProjectId)
      await saveAnnouncement({ 
        id: editingId, 
        ...formData,
        project_id: selectedProjectId  // ✅ เพิ่ม project_id
      })
      await loadData()
      setIsDialogOpen(false)
      toast({ title: "สำเร็จ", description: "บันทึกข้อมูลประกาศเรียบร้อยแล้ว" })
    } catch (error: any) {
      console.error('[Announcements] Save error:', error)
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบประกาศนี้ใช่หรือไม่?")) return
    setIsLoading(true)
    try {
      await deleteAnnouncement(id)
      await loadData()
      toast({ title: "สำเร็จ", description: "ลบประกาศเรียบร้อยแล้ว" })
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="จัดการประกาศ"
        subtitle="สร้างและจัดการประกาศสำหรับแสดงผลใน Resident Portal"
        action={<Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />สร้างประกาศใหม่</Button>}
      />
      <div className="space-y-4">
        {isLoading ? (
          <p>กำลังโหลด...</p>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-lg bg-white">
            <p>ยังไม่มีประกาศ</p>
          </div>
        ) : (
          announcements.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {item.is_pinned && <Pin className="w-5 h-5 text-yellow-500" />}
                      {item.title}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-3 mt-1">
                        <span>หมวดหมู่: <strong>{item.category || 'ทั่วไป'}</strong></span>
                        <span>•</span>
                        <span>เผยแพร่: {formatDate(item.publish_date, "medium", settings.yearType)}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}><Edit className="w-4 h-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap">{item.content}</p>
                {item.image_urls && item.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.image_urls.map((url, idx) => (
                      <div key={idx} className="relative w-32 h-32">
                        <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover rounded" />
                      </div>
                    ))}
                  </div>
                )}
                {item.attachments && item.attachments.length > 0 && (
                  <div className="border-t pt-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      ไฟล์แนบ ({item.attachments.length})
                    </Label>
                    <div className="space-y-1 mt-2">
                      {item.attachments.map((file, idx) => {
                        const [fileName] = file.split('|')
                        return (
                          <div key={idx} className="flex items-center gap-2 text-sm text-blue-600">
                            <FileText className="w-3 h-3" />
                            <span>{fileName}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "แก้ไขประกาศ" : "สร้างประกาศใหม่"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label htmlFor="category">หมวดหมู่ *</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ทั่วไป">ทั่วไป</SelectItem>
                  <SelectItem value="ข่าวประชาสัมพันธ์">ข่าวประชาสัมพันธ์</SelectItem>
                  <SelectItem value="การบำรุงรักษา">การบำรุงรักษา</SelectItem>
                  <SelectItem value="กิจกรรมชุมชน">กิจกรรมชุมชน</SelectItem>
                  <SelectItem value="ประกาศสำคัญ">ประกาศสำคัญ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="title">หัวข้อ *</Label><Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div><Label htmlFor="content">เนื้อหา *</Label><Textarea id="content" rows={8} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} /></div>
            <div>
              <Label>รูปภาพ</Label>
              <div className="mt-2 space-y-2">
                {formData.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="relative w-24 h-24">
                        <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="text-sm" />
              </div>
            </div>
            <div>
              <Label>ไฟล์แนบ</Label>
              <div className="mt-2 space-y-2">
                {formData.attachments.length > 0 && (
                  <div className="space-y-1">
                    {formData.attachments.map((file, index) => {
                      const [fileName] = file.split('|')
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{fileName}</span>
                          <button onClick={() => removeFile(index)} className="text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                <Input type="file" multiple onChange={handleFileUpload} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="publish_date">วันที่เผยแพร่</Label><Input id="publish_date" type="date" value={formData.publish_date} onChange={e => setFormData({...formData, publish_date: e.target.value})} /></div>
                <div className="flex items-center space-x-2 pt-6">
                    <Switch id="is_pinned" checked={formData.is_pinned} onCheckedChange={c => setFormData({...formData, is_pinned: c})} />
                    <Label htmlFor="is_pinned">ปักหมุดประกาศนี้</Label>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={isLoading}>{isLoading ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
