"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Search, Calendar, Droplet, Zap, Users, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"
import { BatchAddMetersDialog } from "./batch-add-dialog"
import { BatchApplyReadingsDialog } from "./batch-apply-readings-dialog"
import { ApplyReadingToBillDialog } from "./apply-reading-to-bill-dialog"
import { ExcelImportDialog } from "./excel-import-dialog"
import { calculateUtilityCost } from "@/lib/utils/meter-calculations"
import * as XLSX from "xlsx"
import { Download, Upload } from "lucide-react"

interface UtilityMeter {
  id: string
  unit_id: string
  meter_type: 'water' | 'electricity' | 'gas'
  meter_number: string
  meter_location?: string
  is_active: boolean
  unit_number?: string
  latest_reading?: MeterReading
}

interface MeterReading {
  id: string
  meter_id: string
  reading_date: string
  previous_reading: number
  current_reading: number
  usage_amount: number
  reading_type: 'regular' | 'estimated' | 'corrected'
  reader_name?: string
  notes?: string
  bill_id?: string | null
}

export default function UtilityMetersPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const { toast } = useToast()
  const { settings } = useSettings()
  const supabase = createClient()

  const [meters, setMeters] = useState<UtilityMeter[]>([])
  const [allMeters, setAllMeters] = useState<UtilityMeter[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [isBatchApplyDialogOpen, setIsBatchApplyDialogOpen] = useState(false)
  const [isReadingDialogOpen, setIsReadingDialogOpen] = useState(false)
  const [isApplyToBillDialogOpen, setIsApplyToBillDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedMeter, setSelectedMeter] = useState<UtilityMeter | null>(null)
  const [selectedMeterReadingId, setSelectedMeterReadingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingMeter, setEditingMeter] = useState<UtilityMeter | null>(null)

  const [formData, setFormData] = useState({
    unitId: "",
    meterType: "water" as "water" | "electricity" | "gas",
    meterNumber: "",
    meterLocation: "",
    isActive: true,
  })

  const [readingFormData, setReadingFormData] = useState({
    readingDate: new Date().toISOString().split("T")[0],
    currentReading: "",
    readingType: "regular" as "regular" | "estimated" | "corrected",
    readerName: "",
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [selectedProjectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const perfStart = performance.now()
      // Load meters with units and latest readings (select only used columns)
      let metersQuery = supabase
        .from('utility_meters')
        .select(`
          id, unit_id, meter_type, meter_number, meter_location, is_active,
          units!inner(unit_number, project_id),
          meter_readings!meter_readings_meter_id_fkey(
            id,
            reading_date,
            current_reading,
            usage_amount,
            reading_type,
            bill_id
          )
        `)
        .order('meter_type', { ascending: true })
        .order('meter_number', { ascending: true })

      // Server-side project filter to reduce payload
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        metersQuery = metersQuery.eq('units.project_id', selectedProjectId)
      }

      const { data: metersData, error: metersError } = await metersQuery
      const perfFetchMs = Math.round(perfStart ? performance.now() - perfStart : 0)
      console.log(`[perf] UtilityMeters loadData: fetched ${metersData?.length || 0} meters in ${perfFetchMs}ms`)

      if (metersError) throw metersError

      const perfProcessStart = performance.now()
      // Process data
      const processedMeters = (metersData || []).map((meter: any) => {
        const readings = meter.meter_readings || []
        const latestReading = readings
          .sort((a: any, b: any) =>
            new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
          )[0]

        return {
          ...meter,
          unit_number: meter.units?.unit_number,
          latest_reading: latestReading,
        }
      })
      const perfProcessMs = Math.round(perfProcessStart ? performance.now() - perfProcessStart : 0)
      console.log(`[perf] UtilityMeters loadData: processed ${processedMeters.length} meters in ${perfProcessMs}ms`)

      setAllMeters(processedMeters)

      // Client-side fallback filter (should be already filtered server-side)
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        const perfFilterStart = performance.now()
        const filtered = processedMeters.filter((m: any) =>
          m.units?.project_id === selectedProjectId
        )
        const perfFilterMs = Math.round(perfFilterStart ? performance.now() - perfFilterStart : 0)
        console.log(`[perf] UtilityMeters loadData: client filter kept ${filtered.length} in ${perfFilterMs}ms`)
        setMeters(filtered)
      } else {
        setMeters(processedMeters)
      }

      // Load units for form
      let unitsQuery = supabase
        .from('units')
        .select('id, unit_number')
        .order('unit_number')

      if (selectedProjectId && currentUser.role !== 'super_admin') {
        unitsQuery = unitsQuery.eq('project_id', selectedProjectId)
      }

      const perfUnitsStart = performance.now()
      const { data: unitsData } = await unitsQuery
      const perfUnitsMs = Math.round(perfUnitsStart ? performance.now() - perfUnitsStart : 0)
      console.log(`[perf] UtilityMeters loadData: fetched ${unitsData?.length || 0} units in ${perfUnitsMs}ms`)
      setUnits(unitsData || [])
    } catch (error: any) {
      console.error('[Utility Meters] Error loading data:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (meter?: UtilityMeter) => {
    if (meter) {
      setEditingMeter(meter)
      setFormData({
        unitId: meter.unit_id,
        meterType: meter.meter_type,
        meterNumber: meter.meter_number,
        meterLocation: meter.meter_location || "",
        isActive: meter.is_active,
      })
    } else {
      setEditingMeter(null)
      setFormData({
        unitId: "",
        meterType: "water",
        meterNumber: "",
        meterLocation: "",
        isActive: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSaveMeter = async () => {
    if (!formData.unitId || !formData.meterNumber) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (editingMeter) {
        const { error } = await supabase
          .from('utility_meters')
          .update({
            unit_id: formData.unitId,
            meter_type: formData.meterType,
            meter_number: formData.meterNumber,
            meter_location: formData.meterLocation,
            is_active: formData.isActive,
          })
          .eq('id', editingMeter.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('utility_meters')
          .insert([{
            unit_id: formData.unitId,
            meter_type: formData.meterType,
            meter_number: formData.meterNumber,
            meter_location: formData.meterLocation,
            is_active: formData.isActive,
          }])

        if (error) throw error
      }

      toast({
        title: "สำเร็จ",
        description: editingMeter ? "แก้ไขมิเตอร์เรียบร้อยแล้ว" : "เพิ่มมิเตอร์เรียบร้อยแล้ว",
      })
      setIsDialogOpen(false)
      await loadData()
    } catch (error: any) {
      console.error('[Utility Meters] Error saving meter:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMeter = async (id: string) => {
    if (!confirm("คุณต้องการลบมิเตอร์นี้ใช่หรือไม่?")) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('utility_meters')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "สำเร็จ",
        description: "ลบมิเตอร์เรียบร้อยแล้ว",
      })
      await loadData()
    } catch (error: any) {
      console.error('[Utility Meters] Error deleting meter:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบมิเตอร์ได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReadingDialog = (meter: UtilityMeter) => {
    setSelectedMeter(meter)
    const previousReading = meter.latest_reading?.current_reading || 0
    setReadingFormData({
      readingDate: new Date().toISOString().split("T")[0],
      currentReading: "",
      readingType: "regular",
      readerName: "",
      notes: "",
    })
    setIsReadingDialogOpen(true)
  }

  const handleSaveReading = async () => {
    if (!selectedMeter || !readingFormData.currentReading) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกเลขมิเตอร์",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const currentReading = Number.parseFloat(readingFormData.currentReading)
      const previousReading = selectedMeter.latest_reading?.current_reading || 0
      const usageAmount = Math.max(0, currentReading - previousReading)

      // Get unit's project_id for rate calculation
      const { data: unitData } = await supabase
        .from('units')
        .select('project_id')
        .eq('id', selectedMeter.unit_id)
        .single()

      // Calculate cost using utility rates (with project_id support)
      const costResult = await calculateUtilityCost(
        selectedMeter.meter_type,
        usageAmount,
        readingFormData.readingDate,
        supabase,
        unitData?.project_id || selectedProjectId || null
      )

      const finalCost = costResult.cost || 0

      // Create meter reading
      const { data: readingData, error: readingError } = await supabase
        .from('meter_readings')
        .insert([{
          meter_id: selectedMeter.id,
          reading_date: readingFormData.readingDate,
          previous_reading: previousReading,
          current_reading: currentReading,
          usage_amount: usageAmount,
          reading_type: readingFormData.readingType,
          reader_name: readingFormData.readerName || null,
          notes: readingFormData.notes || null,
        }])
        .select()
        .single()

      if (readingError) throw readingError

      toast({
        title: "บันทึกการอ่านมิเตอร์สำเร็จ",
        description: `การใช้: ${usageAmount} ${selectedMeter.meter_type === 'water' ? 'ลบ.ม.' : 'kWh'}, ค่าที่คำนวณได้: ฿${finalCost.toLocaleString()}`,
      })

      setIsReadingDialogOpen(false)
      await loadData()
    } catch (error: any) {
      console.error('[Utility Meters] Error saving reading:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกการอ่านมิเตอร์ได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportTemplate = () => {
    try {
      const exportData = filteredMeters.map(meter => ({
        'Unit Number': meter.unit_number,
        'Meter Type': meter.meter_type,
        'Meter Number': meter.meter_number,
        'Previous Reading': meter.latest_reading?.current_reading || 0,
        'Previous Date': meter.latest_reading?.reading_date || '-',
        'Current Reading': '', // Empty for user to fill
        'Reading Date': new Date().toISOString().split('T')[0], // Default to today
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Meter Readings")

      // Auto-width columns
      const wscols = [
        { wch: 15 }, // Unit
        { wch: 10 }, // Type
        { wch: 15 }, // Meter No
        { wch: 15 }, // Prev Reading
        { wch: 15 }, // Prev Date
        { wch: 15 }, // Current Reading
        { wch: 15 }, // Reading Date
      ]
      ws['!cols'] = wscols

      XLSX.writeFile(wb, `meter_readings_template_${new Date().toISOString().split('T')[0]}.xlsx`)

      toast({
        title: "Export Successful",
        description: "Template downloaded successfully.",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Could not generate Excel file.",
        variant: "destructive"
      })
    }
  }

  const filteredMeters = meters.filter((meter) =>
    meter.unit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meter.meter_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getMeterIcon = (type: string) => {
    switch (type) {
      case 'water':
        return <Droplet className="w-5 h-5 text-blue-500" />
      case 'electricity':
        return <Zap className="w-5 h-5 text-yellow-500" />
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />
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

  return (
    <div>
      <PageHeader
        title="จัดการมิเตอร์"
        subtitle="จัดการและจดเลขมิเตอร์น้ำ/ไฟฟ้า"
        action={
          <div className="flex gap-2">
            <Button
              onClick={handleExportTemplate}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Template
            </Button>
            <Button
              onClick={() => setIsImportDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Readings
            </Button>
            <Button
              onClick={() => setIsBatchApplyDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              นำไปใส่บิลแบบ Batch
            </Button>
            <Button
              onClick={() => setIsBatchDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Users className="w-4 h-4 mr-2" />
              เพิ่มแบบ Batch
            </Button>
            <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มมิเตอร์
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="ค้นหาห้องชุดหรือเลขมิเตอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ห้องชุด</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>เลขมิเตอร์</TableHead>
              <TableHead>ตำแหน่ง</TableHead>
              <TableHead>การอ่านล่าสุด</TableHead>
              <TableHead>เลขมิเตอร์ล่าสุด</TableHead>
              <TableHead>การใช้</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : filteredMeters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              filteredMeters.map((meter) => (
                <TableRow key={meter.id}>
                  <TableCell className="font-medium">{meter.unit_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMeterIcon(meter.meter_type)}
                      <span>{getMeterTypeLabel(meter.meter_type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{meter.meter_number}</TableCell>
                  <TableCell>{meter.meter_location || "-"}</TableCell>
                  <TableCell>
                    {meter.latest_reading?.reading_date
                      ? formatDate(meter.latest_reading.reading_date, settings.dateFormat, settings.yearType)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {meter.latest_reading?.current_reading
                      ? meter.latest_reading.current_reading.toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {meter.latest_reading?.usage_amount
                      ? `${meter.latest_reading.usage_amount.toLocaleString()} ${meter.meter_type === 'water' ? 'ลบ.ม.' : 'kWh'}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${meter.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                      }`}>
                      {meter.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenReadingDialog(meter)}
                        title="จดเลขมิเตอร์"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                      {meter.latest_reading && !meter.latest_reading.bill_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedMeter(meter)
                            setSelectedMeterReadingId(meter.latest_reading!.id)
                            setIsApplyToBillDialogOpen(true)
                          }}
                          title="นำไปใส่บิล"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(meter)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMeter(meter.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Meter Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMeter ? "แก้ไขมิเตอร์" : "เพิ่มมิเตอร์ใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="unitId">ห้องชุด *</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) => setFormData({ ...formData, unitId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกห้องชุด" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_number}
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
            <div>
              <Label htmlFor="meterNumber">เลขมิเตอร์ *</Label>
              <Input
                id="meterNumber"
                value={formData.meterNumber}
                onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
                placeholder="WM-001"
              />
            </div>
            <div>
              <Label htmlFor="meterLocation">ตำแหน่ง</Label>
              <Input
                id="meterLocation"
                value={formData.meterLocation}
                onChange={(e) => setFormData({ ...formData, meterLocation: e.target.value })}
                placeholder="หน้าห้องชุด"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveMeter} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meter Reading Dialog */}
      <Dialog open={isReadingDialogOpen} onOpenChange={setIsReadingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>จดเลขมิเตอร์</DialogTitle>
          </DialogHeader>
          {selectedMeter && (
            <div className="space-y-4 py-4">
              <div>
                <Label>ห้องชุด</Label>
                <Input value={selectedMeter.unit_number} disabled />
              </div>
              <div>
                <Label>ประเภท</Label>
                <Input value={getMeterTypeLabel(selectedMeter.meter_type)} disabled />
              </div>
              <div>
                <Label>เลขมิเตอร์</Label>
                <Input value={selectedMeter.meter_number} disabled />
              </div>
              <div>
                <Label>เลขมิเตอร์ครั้งล่าสุด</Label>
                <Input
                  value={selectedMeter.latest_reading?.current_reading || 0}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="readingDate">วันที่อ่าน *</Label>
                <Input
                  id="readingDate"
                  type="date"
                  value={readingFormData.readingDate}
                  onChange={(e) => setReadingFormData({ ...readingFormData, readingDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="currentReading">เลขมิเตอร์ปัจจุบัน *</Label>
                <Input
                  id="currentReading"
                  type="number"
                  value={readingFormData.currentReading}
                  onChange={(e) => setReadingFormData({ ...readingFormData, currentReading: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="readingType">ประเภทการอ่าน</Label>
                <Select
                  value={readingFormData.readingType}
                  onValueChange={(value: any) => setReadingFormData({ ...readingFormData, readingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">ปกติ</SelectItem>
                    <SelectItem value="estimated">ประมาณการ</SelectItem>
                    <SelectItem value="corrected">แก้ไข</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="readerName">ผู้อ่าน</Label>
                <Input
                  id="readerName"
                  value={readingFormData.readerName}
                  onChange={(e) => setReadingFormData({ ...readingFormData, readerName: e.target.value })}
                  placeholder="ชื่อผู้อ่านมิเตอร์"
                />
              </div>
              <div>
                <Label htmlFor="notes">บันทึกเพิ่มเติม</Label>
                <Textarea
                  id="notes"
                  value={readingFormData.notes}
                  onChange={(e) => setReadingFormData({ ...readingFormData, notes: e.target.value })}
                  placeholder="บันทึกเพิ่มเติม..."
                  rows={3}
                />
              </div>
              {readingFormData.currentReading && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">การคำนวณ:</div>
                  <div className="flex justify-between">
                    <span>การใช้:</span>
                    <span className="font-bold">
                      {Math.max(0, Number.parseFloat(readingFormData.currentReading) - (selectedMeter.latest_reading?.current_reading || 0)).toLocaleString()}{" "}
                      {selectedMeter.meter_type === 'water' ? 'ลบ.ม.' : 'kWh'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReadingDialogOpen(false)} disabled={loading}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveReading} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Add Meters Dialog */}
      <BatchAddMetersDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
        onSuccess={loadData}
      />

      {/* Batch Apply Readings Dialog */}
      <BatchApplyReadingsDialog
        open={isBatchApplyDialogOpen}
        onOpenChange={setIsBatchApplyDialogOpen}
        onSuccess={loadData}
      />

      {/* Apply Reading to Bill Dialog */}
      {selectedMeter && selectedMeterReadingId && (
        <ApplyReadingToBillDialog
          open={isApplyToBillDialogOpen}
          onOpenChange={setIsApplyToBillDialogOpen}
          meterReadingId={selectedMeterReadingId}
          unitId={selectedMeter.unit_id}
          meterType={selectedMeter.meter_type === 'gas' ? 'electricity' : selectedMeter.meter_type}
          onSuccess={loadData}
        />
      )}

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={loadData}
        meters={allMeters}
      />
    </div>
  )
}
