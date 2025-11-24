"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Search, Droplet, Zap, Flame } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"

interface UtilityRate {
  id: string
  project_id?: string | null
  meter_type: 'water' | 'electricity' | 'gas'
  rate_name: string
  rate_per_unit: number
  minimum_charge: number
  maximum_charge?: number | null
  effective_date: string
  expiry_date?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  project_name?: string
}

export default function UtilityRatesPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const { toast } = useToast()
  const { settings } = useSettings()
  const supabase = createClient()
  
  const [rates, setRates] = useState<UtilityRate[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingRate, setEditingRate] = useState<UtilityRate | null>(null)
  
  const [formData, setFormData] = useState({
    projectId: selectedProjectId || "all",
    meterType: "water" as "water" | "electricity" | "gas",
    rateName: "",
    ratePerUnit: "",
    minimumCharge: "",
    maximumCharge: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    isActive: true,
  })

  useEffect(() => {
    loadProjects()
    loadRates()
  }, [selectedProjectId])

  const loadProjects = async () => {
    try {
      const pStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      let projectsQuery = supabase
        .from('projects')
        .select('id, name')
        .order('name')
      
      if (currentUser.role !== 'super_admin') {
        // For non-super-admin, only show accessible projects
        // This should be filtered by user permissions in real implementation
        projectsQuery = projectsQuery.eq('id', selectedProjectId || '')
      }
      
      const { data: projectsData } = await projectsQuery
      setProjects(projectsData || [])
      const pEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log(`[perf] UtilityRates projects fetch (${projectsData?.length || 0}): ${Math.round(pEnd - pStart)}ms`)
    } catch (error: any) {
      console.error('[Utility Rates] Error loading projects:', error)
    }
  }

  const loadRates = async () => {
    setLoading(true)
    try {
      const rStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      let ratesQuery = supabase
        .from('utility_rates')
        .select(`
          id, project_id, meter_type, rate_name, rate_per_unit, minimum_charge, maximum_charge, effective_date, expiry_date, is_active, created_at, updated_at,
          projects(name)
        `)
        .order('effective_date', { ascending: false })
        .order('meter_type', { ascending: true })
        .limit(200)

      if (selectedProjectId && currentUser.role !== 'super_admin') {
        ratesQuery = ratesQuery.eq('project_id', selectedProjectId)
      }
      
      const { data: ratesData, error } = await ratesQuery
      if (error) throw error

      const processedRates = (ratesData || []).map((rate: any) => ({
        ...rate,
        project_name: rate.projects?.name || 'ทุกโครงการ',
      }))

      setRates(processedRates)
      const rEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log(`[perf] UtilityRates rates fetch (${ratesData?.length || 0}): ${Math.round(rEnd - rStart)}ms`)
    } catch (error: any) {
      console.error('[Utility Rates] Error loading rates:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (rate?: UtilityRate) => {
    if (rate) {
      setEditingRate(rate)
      setFormData({
        projectId: rate.project_id || selectedProjectId || "all",
        meterType: rate.meter_type,
        rateName: rate.rate_name,
        ratePerUnit: rate.rate_per_unit.toString(),
        minimumCharge: rate.minimum_charge.toString(),
        maximumCharge: rate.maximum_charge?.toString() || "",
        effectiveDate: rate.effective_date,
        expiryDate: rate.expiry_date || "",
        isActive: rate.is_active,
      })
    } else {
      setEditingRate(null)
      setFormData({
        projectId: selectedProjectId || "all",
        meterType: "water",
        rateName: "",
        ratePerUnit: "",
        minimumCharge: "",
        maximumCharge: "",
        effectiveDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
        isActive: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSaveRate = async () => {
    if (!formData.rateName || !formData.ratePerUnit) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Convert "all" to null for database (means all projects)
      const projectId = formData.projectId === "all" ? null : formData.projectId
      
      const rateData: any = {
        project_id: projectId || null,
        meter_type: formData.meterType,
        rate_name: formData.rateName,
        rate_per_unit: parseFloat(formData.ratePerUnit),
        minimum_charge: parseFloat(formData.minimumCharge) || 0,
        maximum_charge: formData.maximumCharge ? parseFloat(formData.maximumCharge) : null,
        effective_date: formData.effectiveDate,
        expiry_date: formData.expiryDate || null,
        is_active: formData.isActive,
      }

      if (editingRate) {
        const { error } = await supabase
          .from('utility_rates')
          .update(rateData)
          .eq('id', editingRate.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('utility_rates')
          .insert([rateData])

        if (error) throw error
      }

      toast({
        title: "สำเร็จ",
        description: editingRate ? "แก้ไขอัตราค่าบริการเรียบร้อยแล้ว" : "เพิ่มอัตราค่าบริการเรียบร้อยแล้ว",
      })
      setIsDialogOpen(false)
      await loadRates()
    } catch (error: any) {
      console.error('[Utility Rates] Error saving rate:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRate = async (id: string) => {
    if (!confirm("คุณต้องการลบอัตราค่าบริการนี้ใช่หรือไม่?")) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('utility_rates')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "สำเร็จ",
        description: "ลบอัตราค่าบริการเรียบร้อยแล้ว",
      })
      await loadRates()
    } catch (error: any) {
      console.error('[Utility Rates] Error deleting rate:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบอัตราค่าบริการได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getMeterIcon = (type: string) => {
    switch (type) {
      case 'water':
        return <Droplet className="w-5 h-5 text-blue-500" />
      case 'electricity':
        return <Zap className="w-5 h-5 text-yellow-500" />
      case 'gas':
        return <Flame className="w-5 h-5 text-orange-500" />
      default:
        return null
    }
  }

  const getMeterTypeLabel = (type: string) => {
    switch (type) {
      case 'water':
        return 'น้ำ'
      case 'electricity':
        return 'ไฟฟ้า'
      case 'gas':
        return 'แก๊ส'
      default:
        return type
    }
  }

  const filteredRates = rates.filter((rate) => {
    const matchesSearch = 
      rate.rate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || rate.meter_type === filterType
    return matchesSearch && matchesType
  })

  // Get active rate for current date
  const getActiveRateStatus = (rate: UtilityRate) => {
    const today = new Date().toISOString().split("T")[0]
    const effectiveDate = rate.effective_date
    const expiryDate = rate.expiry_date

    if (!rate.is_active) return { label: "ไม่ใช้งาน", color: "bg-gray-100 text-gray-700" }
    if (effectiveDate > today) return { label: "รอเริ่มใช้", color: "bg-yellow-100 text-yellow-700" }
    if (expiryDate && expiryDate < today) return { label: "หมดอายุ", color: "bg-red-100 text-red-700" }
    return { label: "ใช้งาน", color: "bg-green-100 text-green-700" }
  }

  return (
    <div>
      <PageHeader
        title="จัดการอัตราค่าบริการ"
        subtitle="กำหนดอัตราค่าน้ำ/ไฟฟ้า/แก๊ส ตามโครงการ"
        action={
          <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มอัตราใหม่
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ค้นหาชื่ออัตราหรือโครงการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="water">น้ำ</SelectItem>
                <SelectItem value="electricity">ไฟฟ้า</SelectItem>
                <SelectItem value="gas">แก๊ส</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>โครงการ</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>ชื่ออัตรา</TableHead>
              <TableHead>อัตราต่อหน่วย</TableHead>
              <TableHead>ขั้นต่ำ</TableHead>
              <TableHead>สูงสุด</TableHead>
              <TableHead>วันที่เริ่มใช้</TableHead>
              <TableHead>วันที่หมดอายุ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : filteredRates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              filteredRates.map((rate) => {
                const status = getActiveRateStatus(rate)
                return (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.project_name || "ทุกโครงการ"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMeterIcon(rate.meter_type)}
                        <span>{getMeterTypeLabel(rate.meter_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{rate.rate_name}</TableCell>
                    <TableCell>
                      ฿{rate.rate_per_unit.toLocaleString()} / {rate.meter_type === 'water' ? 'ลบ.ม.' : 'kWh'}
                    </TableCell>
                    <TableCell>
                      {rate.minimum_charge > 0 ? `฿${rate.minimum_charge.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {rate.maximum_charge ? `฿${rate.maximum_charge.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {formatDate(rate.effective_date, settings.dateFormat, settings.yearType)}
                    </TableCell>
                    <TableCell>
                      {rate.expiry_date 
                        ? formatDate(rate.expiry_date, settings.dateFormat, settings.yearType)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${status.color}`}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(rate)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRate(rate.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRate ? "แก้ไขอัตราค่าบริการ" : "เพิ่มอัตราค่าบริการใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="projectId">โครงการ</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                disabled={!!selectedProjectId && currentUser.role !== 'super_admin'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกโครงการ (ว่าง = ทุกโครงการ)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกโครงการ</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="meterType">ประเภท *</Label>
              <Select
                value={formData.meterType}
                onValueChange={(value: any) => setFormData({ ...formData, meterType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">น้ำ</SelectItem>
                  <SelectItem value="electricity">ไฟฟ้า</SelectItem>
                  <SelectItem value="gas">แก๊ส</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="rateName">ชื่ออัตรา *</Label>
              <Input
                id="rateName"
                value={formData.rateName}
                onChange={(e) => setFormData({ ...formData, rateName: e.target.value })}
                placeholder="อัตราค่าน้ำประจำปี 2568"
              />
            </div>
            <div>
              <Label htmlFor="ratePerUnit">อัตราต่อหน่วย (฿) *</Label>
              <Input
                id="ratePerUnit"
                type="number"
                step="0.01"
                value={formData.ratePerUnit}
                onChange={(e) => setFormData({ ...formData, ratePerUnit: e.target.value })}
                placeholder="15.50"
              />
            </div>
            <div>
              <Label htmlFor="minimumCharge">ค่าบริการขั้นต่ำ (฿)</Label>
              <Input
                id="minimumCharge"
                type="number"
                step="0.01"
                value={formData.minimumCharge}
                onChange={(e) => setFormData({ ...formData, minimumCharge: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="maximumCharge">ค่าบริการสูงสุด (฿)</Label>
              <Input
                id="maximumCharge"
                type="number"
                step="0.01"
                value={formData.maximumCharge}
                onChange={(e) => setFormData({ ...formData, maximumCharge: e.target.value })}
                placeholder="ว่าง = ไม่จำกัด"
              />
            </div>
            <div>
              <Label htmlFor="effectiveDate">วันที่เริ่มใช้ *</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">วันที่หมดอายุ</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                placeholder="ว่าง = ไม่จำกัด"
              />
            </div>
            <div className="col-span-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                เปิดใช้งาน
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveRate} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

