"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/lib/settings-context"
import { useProjectContext } from "@/lib/contexts/project-context"
import { Loader2 } from "lucide-react"

interface Unit {
  id: string
  unit_number: string
  owner_name?: string
  current_owner_id?: string
  current_tenant_id?: string
}

interface Owner {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Tenant {
  id: string
  name: string
  email?: string
  phone?: string
  status: string
}

interface BatchBillingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
  onSuccess: () => void
}

type RecipientType = 'owner' | 'tenant' | 'auto'

export function BatchBillingDialog({
  open,
  onOpenChange,
  month,
  onSuccess,
}: BatchBillingDialogProps) {
  const { settings } = useSettings()
  const { selectedProjectId } = useProjectContext()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [owners, setOwners] = useState<Map<string, Owner>>(new Map())
  const [tenants, setTenants] = useState<Map<string, Tenant[]>>(new Map())
  
  // Recipient settings
  const [commonFeeRecipient, setCommonFeeRecipient] = useState<RecipientType>('auto')
  const [waterFeeRecipient, setWaterFeeRecipient] = useState<RecipientType>('auto')
  const [electricityFeeRecipient, setElectricityFeeRecipient] = useState<RecipientType>('auto')
  const [parkingFeeRecipient, setParkingFeeRecipient] = useState<RecipientType>('auto')
  
  // Meter reading settings
  const [includeMeterReadings, setIncludeMeterReadings] = useState(false)
  const [meterReadingDate, setMeterReadingDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (open) {
      loadUnitsAndRecipients()
    }
  }, [open, selectedProjectId])

  const loadUnitsAndRecipients = async () => {
    setLoading(true)
    try {
      // Load units
      let unitsQuery = supabase
        .from('units')
        .select('id, unit_number, owner_name, current_owner_id, current_tenant_id')
      
      if (selectedProjectId) {
        unitsQuery = unitsQuery.eq('project_id', selectedProjectId)
      }
      
      const { data: unitsData, error: unitsError } = await unitsQuery
      if (unitsError) throw unitsError
      setUnits(unitsData || [])

      // Load owners for all units
      const unitIds = (unitsData || []).map(u => u.id)
      if (unitIds.length > 0) {
        const { data: ownersData } = await supabase
          .from('owners')
          .select('id, name, email, phone, unit_id')
          .in('unit_id', unitIds)
          .eq('is_primary', true)

        const ownersMap = new Map<string, Owner>()
        ownersData?.forEach(owner => {
          ownersMap.set(owner.unit_id, owner)
        })
        setOwners(ownersMap)
      }

      // Load tenants for all units
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('id, name, email, phone, unit_id, status')
        .in('unit_id', unitIds)
        .eq('status', 'active')

      const tenantsMap = new Map<string, Tenant[]>()
      tenantsData?.forEach(tenant => {
        if (!tenantsMap.has(tenant.unit_id)) {
          tenantsMap.set(tenant.unit_id, [])
        }
        tenantsMap.get(tenant.unit_id)!.push(tenant)
      })
      setTenants(tenantsMap)
    } catch (error: any) {
      console.error('[Batch Billing] Error loading data:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBills = async () => {
    setLoading(true)
    try {
      const requestBody = {
        month,
        commonFeeRate: settings.commonFeeRate,
        projectId: selectedProjectId,
        recipientSettings: {
          common_fee: commonFeeRecipient,
          water_fee: waterFeeRecipient,
          electricity_fee: electricityFeeRecipient,
          parking_fee: parkingFeeRecipient,
        },
        meterReadings: includeMeterReadings ? {
          enabled: true,
          reading_date: meterReadingDate,
        } : { enabled: false },
      }
      
      console.log('[Batch Billing] Request:', requestBody)
      
      const response = await fetch('/api/v1/billing/batch-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()
      console.log('[Batch Billing] Response status:', response.status)
      console.log('[Batch Billing] Response data:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to create bills')
      }

      toast({
        title: "สร้างบิลสำเร็จ",
        description: `สร้างบิลใหม่จำนวน ${responseData.count} รายการ`,
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('[Batch Billing] Error:', error)
      console.error('[Batch Billing] Error details:', error.message, error.stack)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างบิลอัตโนมัติได้ กรุณาตรวจสอบ Console สำหรับรายละเอียด",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างบิลอัตโนมัติรายเดือน</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Month Selection */}
          <div>
            <Label>เดือนที่ต้องการสร้างบิล</Label>
            <Input
              type="month"
              value={month}
              disabled
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              ระบบจะสร้างบิลค่าส่วนกลางให้กับทุกห้องที่ยังไม่มีบิลในเดือนที่เลือก
            </p>
          </div>

          {/* Recipient Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">ตั้งค่าผู้รับบิล</h3>
            <p className="text-sm text-gray-600">
              เลือกว่าบิลแต่ละประเภทจะส่งให้เจ้าของหรือผู้เช่า (Auto = ส่งให้ผู้เช่าถ้ามี ไม่เช่นนั้นส่งให้เจ้าของ)
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ค่าส่วนกลาง</Label>
                <RadioGroup
                  value={commonFeeRecipient}
                  onValueChange={(value) => setCommonFeeRecipient(value as RecipientType)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="common-auto" />
                    <Label htmlFor="common-auto" className="font-normal">Auto (แนะนำ)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner" id="common-owner" />
                    <Label htmlFor="common-owner" className="font-normal">เจ้าของ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tenant" id="common-tenant" />
                    <Label htmlFor="common-tenant" className="font-normal">ผู้เช่า</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>ค่าน้ำ</Label>
                <RadioGroup
                  value={waterFeeRecipient}
                  onValueChange={(value) => setWaterFeeRecipient(value as RecipientType)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="water-auto" />
                    <Label htmlFor="water-auto" className="font-normal">Auto (แนะนำ)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner" id="water-owner" />
                    <Label htmlFor="water-owner" className="font-normal">เจ้าของ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tenant" id="water-tenant" />
                    <Label htmlFor="water-tenant" className="font-normal">ผู้เช่า</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>ค่าไฟ</Label>
                <RadioGroup
                  value={electricityFeeRecipient}
                  onValueChange={(value) => setElectricityFeeRecipient(value as RecipientType)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="elec-auto" />
                    <Label htmlFor="elec-auto" className="font-normal">Auto (แนะนำ)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner" id="elec-owner" />
                    <Label htmlFor="elec-owner" className="font-normal">เจ้าของ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tenant" id="elec-tenant" />
                    <Label htmlFor="elec-tenant" className="font-normal">ผู้เช่า</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>ค่าจอดรถ</Label>
                <RadioGroup
                  value={parkingFeeRecipient}
                  onValueChange={(value) => setParkingFeeRecipient(value as RecipientType)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="parking-auto" />
                    <Label htmlFor="parking-auto" className="font-normal">Auto (แนะนำ)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner" id="parking-owner" />
                    <Label htmlFor="parking-owner" className="font-normal">เจ้าของ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tenant" id="parking-tenant" />
                    <Label htmlFor="parking-tenant" className="font-normal">ผู้เช่า</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Meter Readings */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-meters"
                checked={includeMeterReadings}
                onCheckedChange={(checked) => setIncludeMeterReadings(checked as boolean)}
              />
              <Label htmlFor="include-meters" className="font-semibold cursor-pointer">
                รวมการจดเลขมิเตอร์และคำนวณค่าน้ำ/ค่าไฟ
              </Label>
            </div>
            
            {includeMeterReadings && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="meter-date">วันที่จดเลขมิเตอร์</Label>
                <Input
                  id="meter-date"
                  type="date"
                  value={meterReadingDate}
                  onChange={(e) => setMeterReadingDate(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  ระบบจะจดเลขมิเตอร์และคำนวณค่าน้ำ/ค่าไฟอัตโนมัติสำหรับห้องที่มีมิเตอร์
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border-t">
            <h4 className="font-semibold mb-2">สรุปการตั้งค่า</h4>
            <ul className="text-sm space-y-1">
              <li>• ค่าส่วนกลาง: {commonFeeRecipient === 'auto' ? 'Auto (ผู้เช่าถ้ามี)' : commonFeeRecipient === 'owner' ? 'เจ้าของ' : 'ผู้เช่า'}</li>
              <li>• ค่าน้ำ: {waterFeeRecipient === 'auto' ? 'Auto (ผู้เช่าถ้ามี)' : waterFeeRecipient === 'owner' ? 'เจ้าของ' : 'ผู้เช่า'}</li>
              <li>• ค่าไฟ: {electricityFeeRecipient === 'auto' ? 'Auto (ผู้เช่าถ้ามี)' : electricityFeeRecipient === 'owner' ? 'เจ้าของ' : 'ผู้เช่า'}</li>
              <li>• ค่าจอดรถ: {parkingFeeRecipient === 'auto' ? 'Auto (ผู้เช่าถ้ามี)' : parkingFeeRecipient === 'owner' ? 'เจ้าของ' : 'ผู้เช่า'}</li>
              {includeMeterReadings && (
                <li>• จดเลขมิเตอร์: วันที่ {new Date(meterReadingDate).toLocaleDateString('th-TH')}</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleCreateBills} 
            className="bg-blue-600 hover:bg-blue-700" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              'ยืนยันการสร้างบิล'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

