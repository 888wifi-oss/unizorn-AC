"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Download,
  KeyRound,
  UserPlus,
  UserMinus,
  Eye,
  EyeOff,
  Home,
  User,
  Calendar,
  CreditCard,
  Building,
  Car,
  Bed,
  Bath,
  DollarSign,
  Upload,
  FileSpreadsheet
} from "lucide-react"
import {
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitOwners,
  createOwner,
  updateOwner,
  deleteOwner,
  getUnitTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  getUnitTenancyHistory,
  getUnitRentalPayments,
  createRentalPayment,
  getUnitsWithResidents
} from "@/lib/actions/units-actions"
import {
  getUnitVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle
} from "@/lib/actions/vehicles-actions"
import {
  getUnitPets,
  createPet,
  updatePet,
  deletePet,
  type Pet
} from "@/lib/actions/pets-actions"
import { parseExcelToUnits, validateUnits, generateExcelTemplate, type UnitImportData } from "@/lib/utils/excel-import"
import { bulkImportUnits } from "@/lib/actions/bulk-import-actions"
import { exportObjectsToCSV } from "@/lib/csv-exporter"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { Unit, Owner, Tenant, TenancyHistory, RentalPayment } from "@/lib/types/permissions"

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Enhanced form data for new structure
  const [formData, setFormData] = useState({
    unit_number: "",
    project_id: "",
    building_id: "",
    floor: "",
    size: "",
    unit_type: "condo",
    ownership_type: "freehold",
    number_of_bedrooms: 1,
    number_of_bathrooms: 1,
    furnishing_status: "unfurnished",
    view_type: "",
    parking_space_count: 0,
    parking_space_number: "",
    default_rental_price: 0,
    sale_price: 0,
    sale_price: 0,
    notes: "",
    description: "",
    preferred_language: "th" as "th" | "en"
  })

  // Owner form data
  const [ownerFormData, setOwnerFormData] = useState({
    name: "",
    national_id: "",
    email: "",
    phone: "",
    address: "",
    is_primary: true,
    ownership_percentage: 100,
    owner_occupies: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    notes: ""
  })

  // Tenant form data
  const [tenantFormData, setTenantFormData] = useState({
    name: "",
    national_id: "",
    gender: "",
    date_of_birth: "",
    email: "",
    phone: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    move_in_date: "",
    move_out_date: "",
    rental_contract_no: "",
    rental_price: 0,
    deposit_amount: 0,
    payment_method: "bank_transfer",
    status: "active",
    notes: ""
  })

  // Dialog states
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false)
  const [isTenantDialogOpen, setIsTenantDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [owners, setOwners] = useState<Owner[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenancyHistory, setTenancyHistory] = useState<TenancyHistory[]>([])
  const [rentalPayments, setRentalPayments] = useState<RentalPayment[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [pets, setPets] = useState<Pet[]>([])

  // Vehicle form data
  const [vehicleFormData, setVehicleFormData] = useState<{
    type: 'car' | 'motorcycle' | 'other'
    license_plate: string
    brand: string
    model: string
    color: string
    owner_name: string
    sticker_number: string
    status: 'active' | 'inactive'
  }>({
    type: 'car',
    license_plate: "",
    brand: "",
    model: "",
    color: "",
    owner_name: "",
    sticker_number: "",
    status: 'active'
  })

  // Pet form data
  const [petFormData, setPetFormData] = useState<{
    type: 'dog' | 'cat' | 'other'
    name: string
    breed: string
    color: string
    weight: number
    vaccination_status: boolean
    notes: string
  }>({
    type: 'dog',
    name: "",
    breed: "",
    color: "",
    weight: 0,
    vaccination_status: false,
    notes: ""
  })

  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false)
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)

  // Import Excel states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importedUnits, setImportedUnits] = useState<any[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'validating' | 'importing' | 'success' | 'error'>('idle')

  useEffect(() => {
    loadUnits()
  }, [selectedProjectId])

  // Handle Excel import
  const handleExcelImport = async (file: File) => {
    setImportStatus('uploading')

    try {
      // Parse Excel file
      const parsedUnits = await parseExcelToUnits(file)

      // Get existing unit numbers
      const existingUnitNumbers = units.map(u => u.unit_number)

      // Validate units
      const validatedUnits = validateUnits(parsedUnits, existingUnitNumbers)

      // Check for errors
      const unitsWithErrors = validatedUnits.filter(u => u.errors && u.errors.length > 0)
      const validUnits = validatedUnits.filter(u => !u.errors || u.errors.length === 0)

      setImportedUnits(validatedUnits)
      setImportStatus('validating')

      // Show validation result
      if (unitsWithErrors.length > 0) {
        toast({
          title: "พบข้อผิดพลาด",
          description: `พบข้อผิดพลาด ${unitsWithErrors.length} รายการ และมีข้อมูลที่ถูกต้อง ${validUnits.length} รายการ`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "ตรวจสอบข้อมูลสำเร็จ",
          description: `พบข้อมูลที่ถูกต้อง ${validUnits.length} รายการ`,
        })
      }

      setImportStatus('idle')
    } catch (error: any) {
      setImportStatus('error')
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Handle import confirmation
  const handleConfirmImport = async () => {
    setImportStatus('importing')
    setImportProgress(0)

    try {
      const validUnits = importedUnits.filter(u => !u.errors || u.errors.length === 0)

      if (validUnits.length === 0) {
        toast({
          title: "ไม่สามารถนำเข้าข้อมูลได้",
          description: "ไม่มีข้อมูลที่ถูกต้องสำหรับนำเข้า",
          variant: "destructive",
        })
        setImportStatus('error')
        return
      }

      const importData = validUnits.map(unit => ({
        unit_number: unit.unit_number,
        type: unit.type,
        floor: unit.floor,
        area: unit.area,
        bedroom: unit.bedroom,
        bathroom: unit.bathroom,
        owner_name: unit.owner_name,
        owner_email: unit.owner_email,
        tenant_name: unit.tenant_name,
        tenant_email: unit.tenant_email,
        status: unit.status,
        rent_price: unit.rent_price,
        project_id: selectedProjectId || ""
      }))

      console.log('[Import] Starting bulk import with data:', importData)

      const result = await bulkImportUnits({ units: importData })

      console.log('[Import] Import result:', result)

      if (result.success) {
        setImportProgress(100)
        setImportStatus('success')
        toast({
          title: "นำเข้าข้อมูลสำเร็จ",
          description: `นำเข้าข้อมูลสำเร็จ ${result.imported} ห้อง${result.failed > 0 ? ` (ล้มเหลว ${result.failed} ห้อง)` : ''}`,
        })

        // Reset and reload after delay
        setTimeout(() => {
          setIsImportDialogOpen(false)
          setImportedUnits([])
          setImportProgress(0)
          setImportStatus('idle')
          loadUnits()
        }, 2000)
      } else {
        setImportStatus('error')
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || `นำเข้าข้อมูลล้มเหลว ${result.failed} ห้อง`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('[Import] Error:', error)
      setImportStatus('error')
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Handle template download
  const handleDownloadTemplate = () => {
    const blob = generateExcelTemplate()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_import_units.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const loadUnits = async () => {
    if (!currentUser?.id) return

    setLoading(true)
    try {
      const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      // Use optimized batch query to load units with all residents in one go
      const result = await getUnitsWithResidents(currentUser.id, selectedProjectId || undefined)
      const tAfterFetch = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('[perf] Units batch fetch result sizes:', {
        units: Array.isArray(result?.units) ? result.units.length : 0,
        owners: Array.isArray(result?.owners) ? result.owners.length : undefined,
        tenants: Array.isArray(result?.tenants) ? result.tenants.length : undefined,
      })
      console.log(`[perf] Units batch fetch duration: ${Math.round(tAfterFetch - tStart)}ms`)

      if (result.success) {
        // Transform data to match Unit interface
        const transformedUnits = result.units.map(unit => ({
          ...unit,
          current_owner: unit.owners?.[0] || null,
          current_tenant: unit.tenants?.[0] || null
        }))

        setUnits(transformedUnits as Unit[])
        const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
        console.log(`[perf] Units total load (fetch+transform+setState): ${Math.round(tEnd - tStart)}ms`)
      } else {
        console.error('[Units] Failed to get units:', result.error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถโหลดข้อมูลห้องชุดได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('[Units] Error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถโหลดข้อมูลห้องชุดได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUnitDetails = async (unit: Unit) => {
    if (!currentUser?.id) return

    try {
      const dStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const [ownersResult, tenantsResult, historyResult, paymentsResult, vehiclesResult, petsResult] = await Promise.all([
        getUnitOwners(currentUser.id, unit.id),
        getUnitTenants(currentUser.id, unit.id),
        getUnitTenancyHistory(currentUser.id, unit.id),
        getUnitRentalPayments(currentUser.id, unit.id),
        getUnitVehicles(currentUser.id, unit.id),
        getUnitPets(currentUser.id, unit.id),
      ])

      if (ownersResult.success) {
        setOwners(ownersResult.owners || [])
      }
      if (tenantsResult.success) {
        setTenants(tenantsResult.tenants || [])
      }
      if (historyResult.success) {
        setTenancyHistory(historyResult.history || [])
      }
      if (paymentsResult.success) {
        setRentalPayments(paymentsResult.payments || [])
      }
      if (vehiclesResult.success) {
        setVehicles(vehiclesResult.vehicles || [])
      }
      if (petsResult.success) {
        setPets(petsResult.pets || [])
      }

      const dEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('[perf] Unit details sizes:', {
        owners: ownersResult.success ? (ownersResult.owners?.length || 0) : 0,
        tenants: tenantsResult.success ? (tenantsResult.tenants?.length || 0) : 0,
        history: historyResult.success ? (historyResult.history?.length || 0) : 0,
        payments: paymentsResult.success ? (paymentsResult.payments?.length || 0) : 0,
      })
      console.log(`[perf] Unit details load duration: ${Math.round(dEnd - dStart)}ms`)
    } catch (error) {
      console.error('Error loading unit details:', error)
    }
  }

  const handleCreateUnit = async () => {
    if (!currentUser?.id) return

    try {
      // Validate required fields
      if (!formData.unit_number.trim()) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณากรอกหมายเลขห้อง",
          variant: "destructive",
        })
        return
      }

      if (!formData.floor || formData.floor.toString().trim() === '') {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณากรอกชั้น",
          variant: "destructive",
        })
        return
      }

      if (!formData.size || formData.size.toString().trim() === '') {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณากรอกขนาดห้อง",
          variant: "destructive",
        })
        return
      }

      const payload = {
        ...formData,
        project_id: selectedProjectId || "",
        floor: parseInt(formData.floor) || 0,
        size: parseFloat(formData.size) || 0,
        number_of_bedrooms: parseInt(formData.number_of_bedrooms.toString()) || 1,
        number_of_bathrooms: parseInt(formData.number_of_bathrooms.toString()) || 1,
        parking_space_count: parseInt(formData.parking_space_count.toString()) || 0,
        default_rental_price: parseFloat(formData.default_rental_price.toString()) || 0,
        sale_price: parseFloat(formData.sale_price.toString()) || 0,
        preferred_language: formData.preferred_language
      }

      let result
      if (editingUnit) {
        result = await updateUnit(currentUser.id, editingUnit.id, payload)
      } else {
        result = await createUnit(currentUser.id, payload)
      }

      if (result.success) {
        toast({
          title: editingUnit ? "แก้ไขห้องชุดสำเร็จ" : "สร้างห้องชุดสำเร็จ",
          description: `ห้องชุด ${formData.unit_number} ${editingUnit ? 'ถูกแก้ไข' : 'ถูกสร้าง'}แล้ว`,
        })
        setIsDialogOpen(false)
        resetForm()
        loadUnits()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างห้องชุดได้",
        variant: "destructive",
      })
    }
  }

  const handleCreateOwner = async () => {
    if (!currentUser?.id || !selectedUnit) return

    try {
      let result
      if (editingOwner) {
        // Update existing owner
        result = await updateOwner(currentUser.id, editingOwner.id, {
          ...ownerFormData,
          ownership_percentage: parseFloat(ownerFormData.ownership_percentage.toString()),
          is_primary: ownerFormData.is_primary,
          owner_occupies: ownerFormData.owner_occupies
        })
      } else {
        // Create new owner
        result = await createOwner(currentUser.id, {
          ...ownerFormData,
          unit_id: selectedUnit.id,
          ownership_percentage: parseFloat(ownerFormData.ownership_percentage.toString()),
          is_primary: ownerFormData.is_primary,
          owner_occupies: ownerFormData.owner_occupies
        })
      }

      if (result.success) {
        toast({
          title: editingOwner ? "แก้ไขเจ้าของสำเร็จ" : "เพิ่มเจ้าของสำเร็จ",
          description: `เจ้าของ ${ownerFormData.name} ${editingOwner ? 'ถูกแก้ไข' : 'ถูกเพิ่ม'} แล้ว`,
        })
        setIsOwnerDialogOpen(false)
        resetOwnerForm()
        setEditingOwner(null)
        loadUnitDetails(selectedUnit)
        loadUnits() // Refresh units to update current_owner
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: editingOwner ? "ไม่สามารถแก้ไขเจ้าของได้" : "ไม่สามารถเพิ่มเจ้าของได้",
        variant: "destructive",
      })
    }
  }

  const handleCreateTenant = async () => {
    if (!currentUser?.id || !selectedUnit) return

    try {
      let result
      if (editingTenant) {
        // Update existing tenant
        result = await updateTenant(currentUser.id, editingTenant.id, {
          ...tenantFormData,
          rental_price: parseFloat(tenantFormData.rental_price.toString()),
          deposit_amount: parseFloat(tenantFormData.deposit_amount.toString())
        })
      } else {
        // Create new tenant
        result = await createTenant(currentUser.id, {
          ...tenantFormData,
          unit_id: selectedUnit.id,
          owner_id: selectedUnit.current_owner_id,
          rental_price: parseFloat(tenantFormData.rental_price.toString()),
          deposit_amount: parseFloat(tenantFormData.deposit_amount.toString())
        })
      }

      if (result.success) {
        toast({
          title: editingTenant ? "แก้ไขผู้เช่าสำเร็จ" : "เพิ่มผู้เช่าสำเร็จ",
          description: `ผู้เช่า ${tenantFormData.name} ${editingTenant ? 'ถูกแก้ไข' : 'ถูกเพิ่ม'} แล้ว`,
        })
        setIsTenantDialogOpen(false)
        resetTenantForm()
        setEditingTenant(null)
        loadUnitDetails(selectedUnit)
        loadUnits() // Refresh units to update current_tenant
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: editingTenant ? "ไม่สามารถแก้ไขผู้เช่าได้" : "ไม่สามารถเพิ่มผู้เช่าได้",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      unit_number: "",
      project_id: "",
      building_id: "",
      floor: "",
      size: "",
      unit_type: "condo",
      ownership_type: "freehold",
      number_of_bedrooms: 1,
      number_of_bathrooms: 1,
      furnishing_status: "unfurnished",
      view_type: "",
      parking_space_count: 0,
      parking_space_number: "",
      default_rental_price: 0,
      sale_price: 0,
      notes: "",
      description: "",
      preferred_language: "th"
    })
  }

  const resetOwnerForm = () => {
    setOwnerFormData({
      name: "",
      national_id: "",
      email: "",
      phone: "",
      address: "",
      is_primary: true,
      ownership_percentage: 100,
      owner_occupies: false,
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      notes: ""
    })
    setEditingOwner(null)
  }

  const resetTenantForm = () => {
    setTenantFormData({
      name: "",
      national_id: "",
      gender: "",
      date_of_birth: "",
      email: "",
      phone: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      move_in_date: "",
      move_out_date: "",
      rental_contract_no: "",
      rental_price: 0,
      deposit_amount: 0,
      payment_method: "bank_transfer",
      status: "active",
      notes: ""
    })
    setEditingTenant(null)
  }

  const handleCreateVehicle = async () => {
    if (!currentUser?.id || !selectedUnit) return

    try {
      let result
      if (editingVehicle) {
        result = await updateVehicle(currentUser.id, editingVehicle.id, {
          ...vehicleFormData,
          type: vehicleFormData.type as any,
          status: vehicleFormData.status as any
        })
      } else {
        result = await createVehicle(currentUser.id, {
          ...vehicleFormData,
          unit_id: selectedUnit.id,
          type: vehicleFormData.type as any,
          status: vehicleFormData.status as any
        })
      }

      if (result.success) {
        toast({
          title: editingVehicle ? "แก้ไขยานพาหนะสำเร็จ" : "เพิ่มยานพาหนะสำเร็จ",
          description: `ยานพาหนะ ${vehicleFormData.license_plate} ${editingVehicle ? 'ถูกแก้ไข' : 'ถูกเพิ่ม'} แล้ว`,
        })
        setIsVehicleDialogOpen(false)
        resetVehicleForm()
        setEditingVehicle(null)
        loadUnitDetails(selectedUnit)
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลยานพาหนะได้",
        variant: "destructive",
      })
    }
  }

  const handleCreatePet = async () => {
    if (!currentUser?.id || !selectedUnit) return

    try {
      let result
      if (editingPet) {
        result = await updatePet(currentUser.id, editingPet.id, {
          ...petFormData,
          type: petFormData.type as any,
          weight: parseFloat(petFormData.weight.toString())
        })
      } else {
        result = await createPet(currentUser.id, {
          ...petFormData,
          unit_id: selectedUnit.id,
          type: petFormData.type as any,
          weight: parseFloat(petFormData.weight.toString())
        })
      }

      if (result.success) {
        toast({
          title: editingPet ? "แก้ไขสัตว์เลี้ยงสำเร็จ" : "เพิ่มสัตว์เลี้ยงสำเร็จ",
          description: `สัตว์เลี้ยง ${petFormData.name} ${editingPet ? 'ถูกแก้ไข' : 'ถูกเพิ่ม'} แล้ว`,
        })
        setIsPetDialogOpen(false)
        resetPetForm()
        setEditingPet(null)
        loadUnitDetails(selectedUnit)
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลสัตว์เลี้ยงได้",
        variant: "destructive",
      })
    }
  }

  const resetVehicleForm = () => {
    setVehicleFormData({
      type: 'car',
      license_plate: "",
      brand: "",
      model: "",
      color: "",
      owner_name: "",
      sticker_number: "",
      status: 'active'
    })
    setEditingVehicle(null)
  }

  const resetPetForm = () => {
    setPetFormData({
      type: 'dog',
      name: "",
      breed: "",
      color: "",
      weight: 0,
      vaccination_status: false,
      notes: ""
    })
    setEditingPet(null)
  }

  const filteredUnits = units.filter(unit =>
    unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.current_owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.current_tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Function to calculate unit status based on owner and tenant
  const calculateUnitStatus = (unit: Unit): string => {
    // Priority 1: Check special statuses (sold, maintenance, reserved)
    if (unit.status === 'sold') {
      return 'sold'
    }

    if (unit.status === 'maintenance') {
      return 'maintenance'
    }

    if (unit.status === 'reserved') {
      return 'reserved'
    }

    // Priority 2: Check if owner occupies the unit themselves
    // This should only show if there's no active tenant
    if (unit.current_owner && unit.current_owner.owner_occupies) {
      // Owner occupies themselves
      if (!unit.current_tenant) {
        return 'owner_occupied'
      }
      // Even if owner occupies, if there's a tenant, check tenant status
      if (unit.current_tenant && unit.current_tenant.status === 'active') {
        return 'rented'
      }
      // Owner occupies but tenant is inactive/terminated
      return 'owner_occupied'
    }

    // Priority 3: Check tenant status
    if (unit.current_tenant) {
      const tenantStatus = unit.current_tenant.status

      // Active tenant = rented
      if (tenantStatus === 'active') {
        return 'rented'
      }

      // Terminated tenant = terminated
      if (tenantStatus === 'terminated') {
        return 'terminated'
      }

      // Inactive or pending tenant = vacant
      if (tenantStatus === 'inactive' || tenantStatus === 'pending') {
        return 'vacant'
      }
    }

    // Priority 4: No owner or no special status = vacant
    // If owner exists but doesn't occupy, it's vacant
    if (unit.current_owner && !unit.current_owner.owner_occupies) {
      return 'vacant'
    }

    // Default: vacant
    return 'vacant'
  }

  const getStatusBadge = (unit: Unit) => {
    const calculatedStatus = calculateUnitStatus(unit)

    const statusMap = {
      owner_occupied: { label: "เจ้าของอยู่เอง", variant: "default" as const, color: "bg-blue-500" },
      rented: { label: "มีผู้เช่า", variant: "default" as const, color: "bg-green-500" },
      vacant: { label: "ว่าง", variant: "secondary" as const, color: "bg-gray-500" },
      terminated: { label: "สิ้นสุดสัญญา", variant: "destructive" as const, color: "bg-red-500" },
      maintenance: { label: "ซ่อมบำรุง", variant: "destructive" as const, color: "bg-orange-500" },
      reserved: { label: "จอง", variant: "outline" as const, color: "bg-yellow-500" },
      sold: { label: "ขายแล้ว", variant: "secondary" as const, color: "bg-gray-600" }
    }

    const statusInfo = statusMap[calculatedStatus as keyof typeof statusMap] || {
      label: calculatedStatus,
      variant: "secondary" as const,
      color: "bg-gray-500"
    }

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getUnitTypeBadge = (unitType: string) => {
    const typeMap = {
      condo: { label: "คอนโด", variant: "default" as const },
      apartment: { label: "อพาร์ตเมนต์", variant: "secondary" as const },
      office: { label: "ออฟฟิศ", variant: "outline" as const },
      studio: { label: "สตูดิโอ", variant: "secondary" as const },
      penthouse: { label: "เพนท์เฮาส์", variant: "default" as const }
    }
    const typeInfo = typeMap[unitType as keyof typeof typeMap] || { label: unitType, variant: "secondary" as const }
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการห้องชุด"
        subtitle="จัดการข้อมูลห้องชุด เจ้าของ และผู้เช่า"
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="ค้นหาห้องชุด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              resetForm()
              setEditingUnit(null)
              setIsDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มห้องชุด
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            นำเข้าจาก Excel
          </Button>
          <Button variant="outline" onClick={() => exportObjectsToCSV(units, 'units')}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {/* Import Excel Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>นำเข้าข้อมูลห้องชุดจาก Excel</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">ดาวน์โหลดเทมเพลต</p>
                <p className="text-sm text-gray-500">ดาวน์โหลดไฟล์ Excel template เพื่อกรอกข้อมูล</p>
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                ดาวน์โหลดเทมเพลต
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <Label>เลือกไฟล์ Excel (.xlsx)</Label>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="w-full"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "ไฟล์ใหญ่เกินไป",
                        description: "ขนาดไฟล์สูงสุด 10 MB",
                        variant: "destructive",
                      })
                      return
                    }
                    handleExcelImport(file)
                  }
                }}
              />
              <p className="text-sm text-gray-500">รองรับไฟล์ .xlsx และ .csv ขนาดสูงสุด 10 MB</p>
            </div>

            {/* Import Progress */}
            {importStatus !== 'idle' && (
              <div className="space-y-2">
                <Label>สถานะการนำเข้า</Label>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${importStatus === 'success' ? 'bg-green-600' :
                      importStatus === 'error' ? 'bg-red-600' :
                        'bg-blue-600'
                      }`}
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {importStatus === 'uploading' && 'กำลังอัปโหลดไฟล์...'}
                  {importStatus === 'validating' && 'กำลังตรวจสอบข้อมูล...'}
                  {importStatus === 'importing' && 'กำลังนำเข้าข้อมูล...'}
                  {importStatus === 'success' && 'นำเข้าข้อมูลสำเร็จ'}
                  {importStatus === 'error' && 'เกิดข้อผิดพลาด'}
                </p>
              </div>
            )}

            {/* Imported Units Preview */}
            {importedUnits.length > 0 && (
              <div className="space-y-4">
                <Label>ตัวอย่างข้อมูลที่ตรวจสอบแล้ว (5 แถวแรก)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>หมายเลขห้อง</TableHead>
                        <TableHead>ประเภท</TableHead>
                        <TableHead>ชั้น</TableHead>
                        <TableHead>ขนาด</TableHead>
                        <TableHead>เจ้าของ</TableHead>
                        <TableHead>สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedUnits.slice(0, 5).map((unit, index) => (
                        <TableRow key={index}>
                          <TableCell>{unit.unit_number}</TableCell>
                          <TableCell>{unit.type}</TableCell>
                          <TableCell>{unit.floor}</TableCell>
                          <TableCell>{unit.area}</TableCell>
                          <TableCell>{unit.owner_name}</TableCell>
                          <TableCell>
                            {unit.errors && unit.errors.length > 0 ? (
                              <Badge variant="destructive">มีข้อผิดพลาด</Badge>
                            ) : (
                              <Badge variant="default">ถูกต้อง</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>พบ {importedUnits.filter(u => !u.errors || u.errors.length === 0).length} ห้องที่สามารถนำเข้าได้</strong>
                    {importedUnits.some(u => u.errors && u.errors.length > 0) && (
                      <span> และ {importedUnits.filter(u => u.errors && u.errors.length > 0).length} ห้องที่มีข้อผิดพลาด</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Error Report */}
            {importedUnits.some(u => u.errors && u.errors.length > 0) && (
              <div className="space-y-2">
                <Label>รายการข้อผิดพลาด</Label>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {importedUnits.filter(u => u.errors && u.errors.length > 0).map((unit, index) => (
                    <div key={index} className="p-3 border-b last:border-0">
                      <p className="font-medium text-red-600">{unit.unit_number}</p>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {unit.errors?.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={importStatus === 'importing' || importedUnits.length === 0 || importedUnits.every(u => u.errors && u.errors.length > 0)}
            >
              {importStatus === 'importing' ? 'กำลังนำเข้า...' : 'ยืนยันการนำเข้า'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Units Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการห้องชุด</CardTitle>
          <CardDescription>
            แสดงข้อมูลห้องชุดทั้งหมด {filteredUnits.length} ห้อง
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หมายเลขห้อง</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ชั้น</TableHead>
                <TableHead>ขนาด (ตร.ม.)</TableHead>
                <TableHead>ห้องนอน/น้ำ</TableHead>
                <TableHead>เจ้าของ</TableHead>
                <TableHead>ผู้เช่า</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ราคาเช่า</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unit_number}</TableCell>
                  <TableCell>{getUnitTypeBadge(unit.unit_type)}</TableCell>
                  <TableCell>{unit.floor}</TableCell>
                  <TableCell>{unit.size}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Bed className="w-3 h-3" />
                      <span>{unit.number_of_bedrooms}</span>
                      <Bath className="w-3 h-3 ml-2" />
                      <span>{unit.number_of_bathrooms}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {unit.current_owner ? (
                      <div>
                        <div className="font-medium">{unit.current_owner.name}</div>
                        <div className="text-sm text-gray-500">{unit.current_owner.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">ไม่มีเจ้าของ</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {unit.current_tenant ? (
                      <div>
                        <div className="font-medium">{unit.current_tenant.name}</div>
                        <div className="text-sm text-gray-500">{unit.current_tenant.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">ไม่มีผู้เช่า</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(unit)}</TableCell>
                  <TableCell>
                    {unit.default_rental_price && unit.default_rental_price > 0 ? (
                      <div className="flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        <span>{(unit.default_rental_price || 0).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUnit(unit)
                          loadUnitDetails(unit)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUnit(unit)
                          setFormData({
                            unit_number: unit.unit_number,
                            project_id: unit.project_id || "",
                            building_id: unit.building_id || "",
                            floor: unit.floor.toString(),
                            size: unit.size.toString(),
                            unit_type: unit.unit_type,
                            ownership_type: unit.ownership_type,
                            number_of_bedrooms: unit.number_of_bedrooms,
                            number_of_bathrooms: unit.number_of_bathrooms,
                            furnishing_status: unit.furnishing_status,
                            view_type: unit.view_type || "",
                            parking_space_count: unit.parking_space_count,
                            parking_space_number: unit.parking_space_number || "",
                            default_rental_price: unit.default_rental_price,
                            sale_price: unit.sale_price,
                            sale_price: unit.sale_price,
                            notes: unit.notes || "",
                            description: unit.description || "",
                            preferred_language: unit.preferred_language || "th"
                          })
                          setIsDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unit Details Dialog */}
      <Dialog open={!!selectedUnit} onOpenChange={() => setSelectedUnit(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดห้องชุด {selectedUnit?.unit_number}</DialogTitle>
          </DialogHeader>

          {selectedUnit && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
                <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
                <TabsTrigger value="owners">เจ้าของ</TabsTrigger>
                <TabsTrigger value="tenants">ผู้เช่า</TabsTrigger>
                <TabsTrigger value="history">ประวัติ</TabsTrigger>
                <TabsTrigger value="vehicles">ยานพาหนะ</TabsTrigger>
                <TabsTrigger value="pets">สัตว์เลี้ยง</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ข้อมูลห้องชุด</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>หมายเลขห้อง:</strong> {selectedUnit.unit_number}</div>
                      <div><strong>ประเภท:</strong> {getUnitTypeBadge(selectedUnit.unit_type)}</div>
                      <div><strong>ชั้น:</strong> {selectedUnit.floor}</div>
                      <div><strong>ขนาด:</strong> {selectedUnit.size} ตร.ม.</div>
                      <div><strong>ห้องนอน:</strong> {selectedUnit.number_of_bedrooms} ห้อง</div>
                      <div><strong>ห้องน้ำ:</strong> {selectedUnit.number_of_bathrooms} ห้อง</div>
                      <div><strong>สถานะการตกแต่ง:</strong> {selectedUnit.furnishing_status}</div>
                      <div><strong>ที่จอดรถ:</strong> {selectedUnit.parking_space_count} คัน</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ข้อมูลการเงิน</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>ราคาเช่า:</strong> {(selectedUnit.default_rental_price || 0).toLocaleString()} บาท</div>
                      <div><strong>ราคาขาย:</strong> {(selectedUnit.sale_price || 0).toLocaleString()} บาท</div>
                      <div><strong>สถานะ:</strong> {getStatusBadge(selectedUnit)}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="owners" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">เจ้าของห้องชุด</h3>
                  <Button
                    onClick={() => {
                      resetOwnerForm()
                      setIsOwnerDialogOpen(true)
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    เพิ่มเจ้าของ
                  </Button>
                </div>

                <div className="space-y-2">
                  {owners.map((owner) => (
                    <Card key={owner.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{owner.name}</div>
                            <div className="text-sm text-gray-500">{owner.email}</div>
                            <div className="text-sm text-gray-500">{owner.phone}</div>
                            <div className="text-sm">
                              <Badge variant={owner.is_primary ? "default" : "secondary"}>
                                {owner.is_primary ? "เจ้าของหลัก" : "เจ้าของร่วม"}
                              </Badge>
                              <span className="ml-2">{owner.ownership_percentage}%</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setOwnerFormData({
                                  name: owner.name,
                                  national_id: owner.national_id || "",
                                  email: owner.email || "",
                                  phone: owner.phone || "",
                                  address: owner.address || "",
                                  is_primary: owner.is_primary,
                                  ownership_percentage: owner.ownership_percentage,
                                  owner_occupies: owner.owner_occupies || false,
                                  start_date: owner.start_date,
                                  end_date: owner.end_date || "",
                                  notes: owner.notes || ""
                                })
                                setEditingOwner(owner)
                                setIsOwnerDialogOpen(true)
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`ต้องการลบเจ้าของ ${owner.name}?`)) {
                                  const result = await deleteOwner(currentUser.id, owner.id)
                                  if (result.success) {
                                    toast({
                                      title: "ลบเจ้าของสำเร็จ",
                                      description: `เจ้าของ ${owner.name} ถูกลบแล้ว`,
                                    })
                                    loadUnitDetails(selectedUnit)
                                    loadUnits()
                                  } else {
                                    toast({
                                      title: "เกิดข้อผิดพลาด",
                                      description: result.error,
                                      variant: "destructive",
                                    })
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tenants" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">ผู้เช่า</h3>
                  <Button
                    onClick={() => {
                      resetTenantForm()
                      setIsTenantDialogOpen(true)
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    เพิ่มผู้เช่า
                  </Button>
                </div>

                <div className="space-y-2">
                  {tenants.map((tenant) => (
                    <Card key={tenant.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{tenant.email}</div>
                            <div className="text-sm text-gray-500">{tenant.phone}</div>
                            <div className="text-sm">
                              <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                                {tenant.status}
                              </Badge>
                              <span className="ml-2">ค่าเช่า: {(tenant.rental_price || 0).toLocaleString()} บาท</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTenantFormData({
                                  name: tenant.name,
                                  national_id: tenant.national_id || "",
                                  gender: tenant.gender || "",
                                  date_of_birth: tenant.date_of_birth || "",
                                  email: tenant.email || "",
                                  phone: tenant.phone || "",
                                  address: tenant.address || "",
                                  emergency_contact_name: tenant.emergency_contact_name || "",
                                  emergency_contact_phone: tenant.emergency_contact_phone || "",
                                  move_in_date: tenant.move_in_date || "",
                                  move_out_date: tenant.move_out_date || "",
                                  rental_contract_no: tenant.rental_contract_no || "",
                                  rental_price: tenant.rental_price,
                                  deposit_amount: tenant.deposit_amount,
                                  payment_method: tenant.payment_method || "bank_transfer",
                                  status: tenant.status,
                                  notes: tenant.notes || ""
                                })
                                setEditingTenant(tenant)
                                setIsTenantDialogOpen(true)
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`ต้องการลบผู้เช่า ${tenant.name}?`)) {
                                  const result = await deleteTenant(currentUser.id, tenant.id)
                                  if (result.success) {
                                    toast({
                                      title: "ลบผู้เช่าสำเร็จ",
                                      description: `ผู้เช่า ${tenant.name} ถูกลบแล้ว`,
                                    })
                                    loadUnitDetails(selectedUnit)
                                    loadUnits()
                                  } else {
                                    toast({
                                      title: "เกิดข้อผิดพลาด",
                                      description: result.error,
                                      variant: "destructive",
                                    })
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <h3 className="text-lg font-semibold">ประวัติการเช่า</h3>
                <div className="space-y-2">
                  {tenancyHistory.map((history) => (
                    <Card key={history.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{history.tenant?.name}</div>
                            <div className="text-sm text-gray-500">
                              {history.rental_start_date} - {history.rental_end_date || 'ปัจจุบัน'}
                            </div>
                            <div className="text-sm">
                              <Badge variant={history.status === 'active' ? 'default' : 'secondary'}>
                                {history.status}
                              </Badge>
                              <span className="ml-2">ค่าเช่า: {(history.rental_price || 0).toLocaleString()} บาท</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="vehicles" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">ยานพาหนะ</h3>
                  <Button
                    onClick={() => {
                      resetVehicleForm()
                      setIsVehicleDialogOpen(true)
                    }}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    เพิ่มยานพาหนะ
                  </Button>
                </div>

                <div className="space-y-2">
                  {vehicles.map((vehicle) => (
                    <Card key={vehicle.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {vehicle.license_plate} ({vehicle.type === 'car' ? 'รถยนต์' : vehicle.type === 'motorcycle' ? 'มอเตอร์ไซค์' : 'อื่นๆ'})
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.brand} {vehicle.model} {vehicle.color}
                            </div>
                            {vehicle.sticker_number && (
                              <div className="text-sm text-gray-500">สติ๊กเกอร์: {vehicle.sticker_number}</div>
                            )}
                            <div className="text-sm">
                              <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                                {vehicle.status === 'active' ? 'ใช้งาน' : 'ยกเลิก'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVehicleFormData({
                                  type: vehicle.type,
                                  license_plate: vehicle.license_plate,
                                  brand: vehicle.brand || "",
                                  model: vehicle.model || "",
                                  color: vehicle.color || "",
                                  owner_name: vehicle.owner_name || "",
                                  sticker_number: vehicle.sticker_number || "",
                                  status: vehicle.status
                                })
                                setEditingVehicle(vehicle)
                                setIsVehicleDialogOpen(true)
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`ต้องการลบยานพาหนะ ${vehicle.license_plate}?`)) {
                                  const result = await deleteVehicle(currentUser.id, vehicle.id)
                                  if (result.success) {
                                    toast({
                                      title: "ลบยานพาหนะสำเร็จ",
                                      description: `ยานพาหนะ ${vehicle.license_plate} ถูกลบแล้ว`,
                                    })
                                    loadUnitDetails(selectedUnit)
                                  } else {
                                    toast({
                                      title: "เกิดข้อผิดพลาด",
                                      description: result.error,
                                      variant: "destructive",
                                    })
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pets" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">สัตว์เลี้ยง</h3>
                  <Button
                    onClick={() => {
                      resetPetForm()
                      setIsPetDialogOpen(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มสัตว์เลี้ยง
                  </Button>
                </div>

                <div className="space-y-2">
                  {pets.map((pet) => (
                    <Card key={pet.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {pet.name} ({pet.type === 'dog' ? 'สุนัข' : pet.type === 'cat' ? 'แมว' : 'อื่นๆ'})
                            </div>
                            <div className="text-sm text-gray-500">
                              พันธุ์: {pet.breed || '-'} สี: {pet.color || '-'}
                            </div>
                            <div className="text-sm text-gray-500">
                              น้ำหนัก: {pet.weight} กก.
                            </div>
                            <div className="text-sm mt-1">
                              <Badge variant={pet.vaccination_status ? 'default' : 'destructive'}>
                                {pet.vaccination_status ? 'ฉีดวัคซีนแล้ว' : 'ยังไม่ฉีดวัคซีน'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPetFormData({
                                  type: pet.type,
                                  name: pet.name,
                                  breed: pet.breed || "",
                                  color: pet.color || "",
                                  weight: pet.weight || 0,
                                  vaccination_status: pet.vaccination_status,
                                  notes: pet.notes || ""
                                })
                                setEditingPet(pet)
                                setIsPetDialogOpen(true)
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`ต้องการลบสัตว์เลี้ยง ${pet.name}?`)) {
                                  const result = await deletePet(currentUser.id, pet.id)
                                  if (result.success) {
                                    toast({
                                      title: "ลบสัตว์เลี้ยงสำเร็จ",
                                      description: `สัตว์เลี้ยง ${pet.name} ถูกลบแล้ว`,
                                    })
                                    loadUnitDetails(selectedUnit)
                                  } else {
                                    toast({
                                      title: "เกิดข้อผิดพลาด",
                                      description: result.error,
                                      variant: "destructive",
                                    })
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Unit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "แก้ไขห้องชุด" : "เพิ่มห้องชุดใหม่"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_number">หมายเลขห้อง *</Label>
              <Input
                id="unit_number"
                value={formData.unit_number}
                onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                placeholder="เช่น A-101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">ชั้น *</Label>
              <Input
                id="floor"
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">ขนาด (ตร.ม.) *</Label>
              <Input
                id="size"
                type="number"
                step="0.1"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="45.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_type">ประเภทห้อง</Label>
              <Select value={formData.unit_type} onValueChange={(value) => setFormData({ ...formData, unit_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="condo">คอนโด</SelectItem>
                  <SelectItem value="apartment">อพาร์ตเมนต์</SelectItem>
                  <SelectItem value="office">ออฟฟิศ</SelectItem>
                  <SelectItem value="studio">สตูดิโอ</SelectItem>
                  <SelectItem value="penthouse">เพนท์เฮาส์</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_bedrooms">จำนวนห้องนอน</Label>
              <Input
                id="number_of_bedrooms"
                type="number"
                value={formData.number_of_bedrooms}
                onChange={(e) => setFormData({ ...formData, number_of_bedrooms: parseInt(e.target.value) })}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_bathrooms">จำนวนห้องน้ำ</Label>
              <Input
                id="number_of_bathrooms"
                type="number"
                value={formData.number_of_bathrooms}
                onChange={(e) => setFormData({ ...formData, number_of_bathrooms: parseInt(e.target.value) })}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_rental_price">ราคาเช่าเริ่มต้น</Label>
              <Input
                id="default_rental_price"
                type="number"
                value={formData.default_rental_price}
                onChange={(e) => setFormData({ ...formData, default_rental_price: parseFloat(e.target.value) })}
                placeholder="15000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_price">ราคาขาย</Label>
              <Input
                id="sale_price"
                type="number"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
                placeholder="2500000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">บันทึกเพิ่มเติม</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="บันทึกเพิ่มเติม..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_language">ภาษาสำหรับเอกสาร</Label>
            <Select value={formData.preferred_language} onValueChange={(value: "th" | "en") => setFormData({ ...formData, preferred_language: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="th">ไทย</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateUnit}>
              {editingUnit ? "อัปเดต" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Owner Dialog */}
      <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOwner ? "แก้ไขเจ้าของ" : "เพิ่มเจ้าของ"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="owner_name">ชื่อเจ้าของ *</Label>
              <Input
                id="owner_name"
                value={ownerFormData.name}
                onChange={(e) => setOwnerFormData({ ...ownerFormData, name: e.target.value })}
                placeholder="ชื่อ-นามสกุล"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_email">อีเมล</Label>
                <Input
                  id="owner_email"
                  type="email"
                  value={ownerFormData.email}
                  onChange={(e) => setOwnerFormData({ ...ownerFormData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="owner_phone"
                  value={ownerFormData.phone}
                  onChange={(e) => setOwnerFormData({ ...ownerFormData, phone: e.target.value })}
                  placeholder="081-234-5678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership_percentage">สัดส่วนการเป็นเจ้าของ (%)</Label>
              <Input
                id="ownership_percentage"
                type="number"
                value={ownerFormData.ownership_percentage}
                onChange={(e) => setOwnerFormData({ ...ownerFormData, ownership_percentage: parseFloat(e.target.value) })}
                placeholder="100"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="owner_occupies"
                checked={ownerFormData.owner_occupies}
                onChange={(e) => setOwnerFormData({ ...ownerFormData, owner_occupies: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="owner_occupies" className="cursor-pointer">
                เจ้าของพักเอง (ไม่ได้ให้เช่า)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOwnerDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateOwner}>
              {editingOwner ? "อัปเดต" : "เพิ่มเจ้าของ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tenant Dialog */}
      <Dialog open={isTenantDialogOpen} onOpenChange={setIsTenantDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTenant ? "แก้ไขผู้เช่า" : "เพิ่มผู้เช่า"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_name">ชื่อผู้เช่า *</Label>
              <Input
                id="tenant_name"
                value={tenantFormData.name}
                onChange={(e) => setTenantFormData({ ...tenantFormData, name: e.target.value })}
                placeholder="ชื่อ-นามสกุล"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant_email">อีเมล</Label>
                <Input
                  id="tenant_email"
                  type="email"
                  value={tenantFormData.email}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="tenant_phone"
                  value={tenantFormData.phone}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, phone: e.target.value })}
                  placeholder="081-234-5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rental_price">ค่าเช่า (บาท) *</Label>
                <Input
                  id="rental_price"
                  type="number"
                  value={tenantFormData.rental_price}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, rental_price: parseFloat(e.target.value) })}
                  placeholder="15000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_amount">เงินมัดจำ (บาท)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  value={tenantFormData.deposit_amount}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, deposit_amount: parseFloat(e.target.value) })}
                  placeholder="30000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="move_in_date">วันที่ย้ายเข้า</Label>
                <Input
                  id="move_in_date"
                  type="date"
                  value={tenantFormData.move_in_date}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, move_in_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="move_out_date">วันที่ย้ายออก</Label>
                <Input
                  id="move_out_date"
                  type="date"
                  value={tenantFormData.move_out_date}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, move_out_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_status">สถานะผู้เช่า</Label>
              <Select
                value={tenantFormData.status}
                onValueChange={(value) => setTenantFormData({ ...tenantFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">กำลังเช่า (Active)</SelectItem>
                  <SelectItem value="inactive">เลิกเช่า (Inactive)</SelectItem>
                  <SelectItem value="terminated">ยกเลิกสัญญา (Terminated)</SelectItem>
                  <SelectItem value="pending">รออนุมัติ (Pending)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTenantDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateTenant}>
              {editingTenant ? "อัปเดต" : "เพิ่มผู้เช่า"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Dialog */}
      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "แก้ไขยานพาหนะ" : "เพิ่มยานพาหนะ"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">ประเภท</Label>
              <Select
                value={vehicleFormData.type}
                onValueChange={(value: any) => setVehicleFormData({ ...vehicleFormData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">รถยนต์</SelectItem>
                  <SelectItem value="motorcycle">รถจักรยานยนต์</SelectItem>
                  <SelectItem value="other">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_plate">ทะเบียนรถ *</Label>
              <Input
                id="license_plate"
                value={vehicleFormData.license_plate}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, license_plate: e.target.value })}
                placeholder="กข 1234"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">ยี่ห้อ</Label>
                <Input
                  id="brand"
                  value={vehicleFormData.brand}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, brand: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">รุ่น</Label>
                <Input
                  id="model"
                  value={vehicleFormData.model}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value })}
                  placeholder="Camry"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">สี</Label>
                <Input
                  id="color"
                  value={vehicleFormData.color}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, color: e.target.value })}
                  placeholder="ขาว"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sticker_number">เลขสติ๊กเกอร์</Label>
                <Input
                  id="sticker_number"
                  value={vehicleFormData.sticker_number}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, sticker_number: e.target.value })}
                  placeholder="S-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_status">สถานะ</Label>
              <Select
                value={vehicleFormData.status}
                onValueChange={(value: any) => setVehicleFormData({ ...vehicleFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">ใช้งาน</SelectItem>
                  <SelectItem value="inactive">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateVehicle}>
              {editingVehicle ? "อัปเดต" : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pet Dialog */}
      <Dialog open={isPetDialogOpen} onOpenChange={setIsPetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPet ? "แก้ไขสัตว์เลี้ยง" : "เพิ่มสัตว์เลี้ยง"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pet_type">ประเภท</Label>
              <Select
                value={petFormData.type}
                onValueChange={(value: any) => setPetFormData({ ...petFormData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">สุนัข</SelectItem>
                  <SelectItem value="cat">แมว</SelectItem>
                  <SelectItem value="other">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pet_name">ชื่อสัตว์เลี้ยง *</Label>
              <Input
                id="pet_name"
                value={petFormData.name}
                onChange={(e) => setPetFormData({ ...petFormData, name: e.target.value })}
                placeholder="ชื่อสัตว์เลี้ยง"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pet_breed">สายพันธุ์</Label>
                <Input
                  id="pet_breed"
                  value={petFormData.breed}
                  onChange={(e) => setPetFormData({ ...petFormData, breed: e.target.value })}
                  placeholder="สายพันธุ์"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pet_color">สี</Label>
                <Input
                  id="pet_color"
                  value={petFormData.color}
                  onChange={(e) => setPetFormData({ ...petFormData, color: e.target.value })}
                  placeholder="สี"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pet_weight">น้ำหนัก (กก.)</Label>
              <Input
                id="pet_weight"
                type="number"
                step="0.1"
                value={petFormData.weight}
                onChange={(e) => setPetFormData({ ...petFormData, weight: parseFloat(e.target.value) })}
                placeholder="0.0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="vaccination_status"
                checked={petFormData.vaccination_status}
                onChange={(e) => setPetFormData({ ...petFormData, vaccination_status: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="vaccination_status" className="cursor-pointer">
                ฉีดวัคซีนแล้ว
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pet_notes">หมายเหตุ</Label>
              <Input
                id="pet_notes"
                value={petFormData.notes}
                onChange={(e) => setPetFormData({ ...petFormData, notes: e.target.value })}
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPetDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreatePet}>
              {editingPet ? "อัปเดต" : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
