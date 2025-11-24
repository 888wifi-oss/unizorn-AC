"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getMaintenanceRequests, updateMaintenanceStatus, createMaintenanceRequest } from "@/lib/supabase/actions"
import { getUnitsWithResidents } from "@/lib/actions/units-actions"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { Plus } from "lucide-react"

interface MaintenanceRequest {
  id: string;
  title: string;
  status: string;
  detailed_status?: string;
  priority: string;
  created_at: string;
  scheduled_at?: string | null;
  units: { unit_number: string; owner_name: string; display_unit_number?: string; };
  project_id?: string;
}

export default function MaintenancePage() {
  const router = useRouter()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [totalRequests, setTotalRequests] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [units, setUnits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const { settings } = useSettings()
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()

  const [formData, setFormData] = useState({
    unit_id: "",
    title: "",
    description: "",
    priority: "medium",
    location: "",
    contact_phone: "",
    request_type: "ช่างส่วนกลาง",
    has_cost: false,
    estimated_cost: ""
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  useEffect(() => {
    console.log('[Maintenance] useEffect triggered. selectedProjectId:', selectedProjectId)
    setCurrentPage(1) // Reset to page 1 on project change
    loadData()
  }, [selectedProjectId, currentPage, pageSize, statusFilter, searchQuery])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load maintenance requests with pagination and filtering
      const { requests: data, total } = await getMaintenanceRequests(
        selectedProjectId || null,
        currentPage,
        pageSize,
        statusFilter,
        searchQuery
      )

      setRequests(data)
      setTotalRequests(total)
      console.log('[Maintenance] Loaded requests:', data.length, 'Total:', total)

      // Load units for the dropdown (only if not loaded or project changed)
      // We can optimize this to load only once per project change, not every page change
      if (units.length === 0) {
        const unitsResult = await getUnitsWithResidents(currentUser.id, selectedProjectId)
        if (unitsResult.success) {
          const simpleUnits = unitsResult.units.map((u: any) => ({
            id: u.id,
            unit_number: u.unit_number,
            project_id: u.project_id,
            owner_name: u.owners?.[0]?.name || '',
            tenant_name: u.tenants?.[0]?.name || ''
          }))
          setUnits(simpleUnits)
        }
      }
    } catch (error) {
      console.error('[Maintenance] Load error:', error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลใบแจ้งซ่อมได้", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [selectedProjectId, currentUser.id, currentPage, pageSize, statusFilter, searchQuery])

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    try {
      // Update both status and detailed_status
      await updateMaintenanceStatus(id, newStatus);

      // Map status to detailed_status
      const statusMap: Record<string, string> = {
        'new': 'new',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled'
      };

      const detailedStatus = statusMap[newStatus] || 'new';

      // Update detailed_status
      const supabase = createClient();
      await supabase
        .from('maintenance_requests')
        .update({ detailed_status: detailedStatus })
        .eq('id', id);

      toast({ title: "สำเร็จ", description: "อัปเดตสถานะเรียบร้อยแล้ว" });
      await loadData(); // ✅ Refresh data
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" });
    }
  }, [loadData])

  const handleOpenDialog = () => {
    setFormData({
      unit_id: "",
      title: "",
      description: "",
      priority: "medium",
      location: "",
      contact_phone: "",
      request_type: "ช่างส่วนกลาง",
      has_cost: false,
      estimated_cost: ""
    })
    setUploadedImages([])
    setIsDialogOpen(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreateRequest = async () => {
    if (!formData.unit_id || !formData.title || !formData.description) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกห้อง หัวเรื่อง และรายละเอียด",
        variant: "destructive"
      })
      return
    }

    if (!selectedProjectId && currentUser.role !== 'super_admin') {
      toast({
        title: "ไม่สามารถสร้างได้",
        description: "กรุณาเลือกโครงการก่อน",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('[Maintenance] Creating request with project_id:', selectedProjectId)
      await createMaintenanceRequest({
        ...formData,
        project_id: selectedProjectId || null,
        request_type: formData.request_type,
        has_cost: formData.has_cost,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : undefined,
        image_urls: uploadedImages.length > 0 ? uploadedImages : undefined,
        detailed_status: 'new'
      })
      toast({
        title: "สำเร็จ",
        description: "สร้างใบแจ้งซ่อมเรียบร้อยแล้ว"
      })
      setIsDialogOpen(false)
      await loadData()
    } catch (error: any) {
      console.error('[Maintenance] Create error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge>ใหม่</Badge>;
      case 'in_progress': return <Badge variant="secondary">กำลังดำเนินการ</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-700">เสร็จสิ้น</Badge>;
      case 'cancelled': return <Badge variant="destructive">ยกเลิก</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  const getDetailedStatusBadge = (detailedStatus?: string) => {
    if (!detailedStatus) return null;

    switch (detailedStatus) {
      case 'new': return <Badge className="bg-blue-100 text-blue-700">ใหม่</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-700">กำลังดำเนินการ</Badge>;
      case 'preparing_materials': return <Badge className="bg-purple-100 text-purple-700">เตรียมวัสดุ</Badge>;
      case 'waiting_technician': return <Badge className="bg-orange-100 text-orange-700">รอช่าง</Badge>;
      case 'fixing': return <Badge className="bg-indigo-100 text-indigo-700">กำลังแก้ไข</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-700">เสร็จสิ้น</Badge>;
      case 'cancelled': return <Badge variant="destructive">ยกเลิก</Badge>;
      default: return <Badge variant="outline">{detailedStatus}</Badge>;
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low': return <Badge variant="outline">ต่ำ</Badge>;
      case 'medium': return <Badge variant="secondary">ปานกลาง</Badge>;
      case 'high': return <Badge variant="destructive">สูง</Badge>;
      default: return null;
    }
  }

  return (
    <div>
      <PageHeader
        title="จัดการงานแจ้งซ่อม"
        subtitle="ดูและจัดการคำร้องแจ้งซ่อมจากลูกบ้าน"
      />

      <div className="mb-4 flex justify-end">
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างใบแจ้งซ่อมใหม่
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>รายการแจ้งซ่อมทั้งหมด</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="ค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px]"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="new">ใหม่</SelectItem>
                <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่แจ้ง</TableHead>
                <TableHead>ห้อง</TableHead>
                <TableHead>เรื่อง</TableHead>
                <TableHead>ความสำคัญ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="p-0 h-24 text-center">กำลังโหลด...</TableCell></TableRow>
              ) : requests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">ไม่พบรายการแจ้งซ่อม</TableCell></TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{formatDate(req.created_at, 'medium', settings.yearType)}</TableCell>
                    <TableCell>{req.units.unit_number} ({req.units.owner_name})</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/maintenance/${req.id}`)}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          {req.title}
                        </button>
                        {req.scheduled_at && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-green-100 text-green-700 text-xs cursor-help">
                                  📅 นัดหมายแล้ว
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>วันที่: {new Date(req.scheduled_at).toLocaleDateString('th-TH')}</p>
                                <p>เวลา: {new Date(req.scheduled_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getDetailedStatusBadge(req.detailed_status)}
                        <Select value={req.status} onValueChange={(newStatus) => handleStatusChange(req.id, newStatus)}>
                          <SelectTrigger className="w-40">
                            <SelectValue>{getStatusBadge(req.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">ใหม่</SelectItem>
                            <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                            <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                            <SelectItem value="cancelled">ยกเลิก</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ก่อนหน้า
            </Button>
            <div className="text-sm text-muted-foreground">
              หน้า {currentPage} จาก {Math.ceil(totalRequests / pageSize)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(totalRequests / pageSize)}
            >
              ถัดไป
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog สำหรับสร้างใบแจ้งซ่อมใหม่ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้างใบแจ้งซ่อมใหม่</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="unit_id">ห้อง *</Label>
              <Select
                value={formData.unit_id}
                onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกห้อง" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.display_unit_number || unit.unit_number} - {unit.owner_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">ความสำคัญ</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">ต่ำ</SelectItem>
                  <SelectItem value="medium">ปานกลาง</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">หัวเรื่อง *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น ก๊อกน้ำรั่ว"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">รายละเอียด *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="อธิบายปัญหาที่พบ..."
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">สถานที่</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="เช่น ห้องน้ำชั้น 2"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_phone">เบอร์ติดต่อ</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="เบอร์โทรศัพท์"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="request_type">ประเภทการซ่อม</Label>
              <Select
                value={formData.request_type}
                onValueChange={(v) => setFormData({ ...formData, request_type: v })}
              >
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
                  id="has_cost"
                  checked={formData.has_cost}
                  onChange={(e) => setFormData({ ...formData, has_cost: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="has_cost" className="cursor-pointer">มีค่าใช้จ่าย</Label>
              </div>
              {formData.has_cost && (
                <div className="grid gap-2">
                  <Label htmlFor="estimated_cost">ค่าใช้จ่ายประมาณ (บาท)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                    placeholder="กรุณาระบุจำนวนเงิน"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>แนบรูปภาพ</Label>
              <div className="space-y-2">
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateRequest} disabled={isLoading}>
              {isLoading ? "กำลังสร้าง..." : "สร้างใบแจ้งซ่อม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
