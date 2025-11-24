"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

interface Unit {
  id: string
  unit_number: string
  project_id?: string
}

interface BatchAddMetersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BatchAddMetersDialog({ open, onOpenChange, onSuccess }: BatchAddMetersDialogProps) {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const { toast } = useToast()
  const supabase = createClient()

  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [formData, setFormData] = useState({
    meterType: "water" as "water" | "electricity" | "gas",
    meterNumberPrefix: "",
    meterLocation: "",
    isActive: true,
    generateNumbers: true,
    startNumber: 1,
  })

  const [result, setResult] = useState<{
    success: number
    failed: number
    duplicates: number
    errors: string[]
  } | null>(null)

  useEffect(() => {
    if (open) {
      loadUnits()
      // Reset form when dialog opens
      setSelectedUnits(new Set())
      setFormData({
        meterType: "water",
        meterNumberPrefix: "",
        meterLocation: "",
        isActive: true,
        generateNumbers: true,
        startNumber: 1,
      })
      setResult(null)
      setSearchTerm("")
    }
  }, [open, selectedProjectId])

  // Reload units when meter type changes
  useEffect(() => {
    if (open && formData.meterType) {
      loadUnits()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.meterType, open])

  const loadUnits = async (meterTypeOverride?: string) => {
    const meterType = meterTypeOverride || formData.meterType
    setLoadingUnits(true)
    try {
      let unitsQuery = supabase
        .from('units')
        .select('id, unit_number, project_id')
        .order('unit_number')
      
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        unitsQuery = unitsQuery.eq('project_id', selectedProjectId)
      }
      
      const { data: unitsData, error } = await unitsQuery
      if (error) throw error

      // Filter out units that already have this type of meter
      const { data: existingMeters } = await supabase
        .from('utility_meters')
        .select('unit_id, meter_type')
        .eq('meter_type', meterType)
        .eq('is_active', true)

      const unitsWithMeter = new Set(
        existingMeters?.map((em: any) => em.unit_id) || []
      )

      setUnits((unitsData || []).filter((u: Unit) => !unitsWithMeter.has(u.id)))
    } catch (error: any) {
      console.error('[Batch Add Meters] Error loading units:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลห้องชุดได้",
        variant: "destructive",
      })
    } finally {
      setLoadingUnits(false)
    }
  }

  const handleSelectAll = () => {
    const filtered = filteredUnits
    if (selectedUnits.size === filtered.length) {
      setSelectedUnits(new Set())
    } else {
      setSelectedUnits(new Set(filtered.map(u => u.id)))
    }
  }

  const handleToggleUnit = (unitId: string) => {
    const newSelected = new Set(selectedUnits)
    if (newSelected.has(unitId)) {
      newSelected.delete(unitId)
    } else {
      newSelected.add(unitId)
    }
    setSelectedUnits(newSelected)
  }

  const filteredUnits = units.filter((unit) =>
    unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async () => {
    if (selectedUnits.size === 0) {
      toast({
        title: "กรุณาเลือกห้องชุด",
        description: "เลือกห้องชุดที่ต้องการเพิ่มมิเตอร์",
        variant: "destructive",
      })
      return
    }

    if (formData.generateNumbers && !formData.meterNumberPrefix) {
      toast({
        title: "กรุณากรอก prefix",
        description: "กรุณากรอก prefix สำหรับเลขมิเตอร์",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const selectedUnitsList = Array.from(selectedUnits)
      const sortedUnits = selectedUnitsList
        .map(id => units.find(u => u.id === id))
        .filter((u): u is Unit => u !== undefined)
        .sort((a, b) => a.unit_number.localeCompare(b.unit_number))

      const metersToCreate = sortedUnits.map((unit, index) => {
        let meterNumber: string
        if (formData.generateNumbers) {
          const number = formData.startNumber + index
          meterNumber = `${formData.meterNumberPrefix}${String(number).padStart(3, '0')}`
        } else {
          // If not generating, use prefix + unit number
          meterNumber = `${formData.meterNumberPrefix}${unit.unit_number}`
        }

        return {
          unit_id: unit.id,
          meter_type: formData.meterType,
          meter_number: meterNumber,
          meter_location: formData.meterLocation || null,
          is_active: formData.isActive,
        }
      })

      const response = await fetch('/api/v1/utility-meters/batch-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meters: metersToCreate,
          projectId: selectedProjectId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create meters')
      }

      setResult({
        success: data.count || 0,
        failed: data.errors?.length || 0,
        duplicates: data.duplicates || 0,
        errors: data.errors || [],
      })

      if (data.count > 0) {
        toast({
          title: "เพิ่มมิเตอร์สำเร็จ",
          description: `เพิ่มมิเตอร์สำเร็จ ${data.count} ตัว${data.duplicates > 0 ? `, ข้าม ${data.duplicates} ตัวที่มีอยู่แล้ว` : ''}`,
        })
        onSuccess()
      } else if (data.duplicates > 0) {
        toast({
          title: "ไม่มีมิเตอร์ใหม่",
          description: `มิเตอร์ทั้งหมดมีอยู่แล้ว (${data.duplicates} ตัว)`,
          variant: "destructive",
        })
      }

      // Reload units to update the list (remove units with meters)
      await loadUnits()
    } catch (error: any) {
      console.error('[Batch Add Meters] Error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถเพิ่มมิเตอร์ได้",
        variant: "destructive",
      })
      setResult({
        success: 0,
        failed: selectedUnits.size,
        duplicates: 0,
        errors: [error.message || "Unknown error"],
      })
    } finally {
      setLoading(false)
    }
  }

  const getMeterTypeLabel = (type: string) => {
    switch (type) {
      case 'water': return 'น้ำ'
      case 'electricity': return 'ไฟฟ้า'
      case 'gas': return 'แก๊ส'
      default: return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>เพิ่มมิเตอร์แบบ Batch</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Form Settings */}
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div>
              <Label htmlFor="meterType">ประเภทมิเตอร์ *</Label>
              <Select
                value={formData.meterType}
                onValueChange={(value: any) => {
                  setFormData({ ...formData, meterType: value })
                  // Reload units with new meter type
                  loadUnits(value)
                }}
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
              <Label htmlFor="meterLocation">ตำแหน่ง</Label>
              <Input
                id="meterLocation"
                value={formData.meterLocation}
                onChange={(e) => setFormData({ ...formData, meterLocation: e.target.value })}
                placeholder="หน้าห้องชุด"
              />
            </div>

            <div>
              <Label htmlFor="meterNumberPrefix">Prefix เลขมิเตอร์ *</Label>
              <Input
                id="meterNumberPrefix"
                value={formData.meterNumberPrefix}
                onChange={(e) => setFormData({ ...formData, meterNumberPrefix: e.target.value })}
                placeholder="WM-" 
                disabled={!formData.generateNumbers}
              />
              <p className="text-xs text-gray-500 mt-1">
                ตัวอย่าง: {formData.meterNumberPrefix || "WM-"}001, {formData.meterNumberPrefix || "WM-"}002, ...
              </p>
            </div>

            <div>
              <Label htmlFor="startNumber">เลขเริ่มต้น</Label>
              <Input
                id="startNumber"
                type="number"
                value={formData.startNumber}
                onChange={(e) => setFormData({ ...formData, startNumber: parseInt(e.target.value) || 1 })}
                min={1}
                disabled={!formData.generateNumbers}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="generateNumbers"
                checked={formData.generateNumbers}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, generateNumbers: checked as boolean })
                }
              />
              <Label htmlFor="generateNumbers" className="cursor-pointer">
                สร้างเลขมิเตอร์อัตโนมัติ (ตามลำดับ)
              </Label>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                เปิดใช้งานทันที
              </Label>
            </div>
          </div>

          {/* Unit Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>เลือกห้องชุด ({selectedUnits.size} / {filteredUnits.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredUnits.length === 0}
              >
                {selectedUnits.size === filteredUnits.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </Button>
            </div>
            <Input
              placeholder="ค้นหาห้องชุด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <ScrollArea className="h-64 border rounded-md p-2">
              {loadingUnits ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">กำลังโหลด...</span>
                </div>
              ) : filteredUnits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'ไม่พบห้องชุดที่ค้นหา' : 'ไม่พบห้องชุด (อาจมีมิเตอร์อยู่แล้วทั้งหมด)'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleToggleUnit(unit.id)}
                    >
                      <Checkbox
                        checked={selectedUnits.has(unit.id)}
                        onCheckedChange={() => handleToggleUnit(unit.id)}
                      />
                      <Label className="cursor-pointer flex-1">
                        {unit.unit_number}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Result Summary */}
          {result && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">ผลลัพธ์</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>สำเร็จ: {result.success}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>ล้มเหลว: {result.failed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">ซ้ำ: {result.duplicates}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading || selectedUnits.size === 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังเพิ่ม...
              </>
            ) : (
              `เพิ่ม ${selectedUnits.size} มิเตอร์`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

