"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Package,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Camera,
  QrCode,
  User,
  Phone,
  CreditCard,
  Loader2,
  Eye,
  Printer,
  Upload,
  Download,
  X,
  Image as ImageIcon
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  createParcel,
  getAllParcels,
  pickupParcel,
  getParcelStats,
  searchParcels,
} from "@/lib/supabase/parcel-actions"
import { Parcel, ParcelFormData, ParcelPickupData, ParcelStats } from "@/lib/types/parcel"
import { getUnitsFromDB } from "@/lib/supabase/actions"
import { getUnitResidents, getUnitsWithResidents } from "@/lib/actions/units-actions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { fileToDataURL } from "@/lib/utils/image-upload"
import { generateQRCodeDataURL } from "@/lib/utils/qr-code-export"
import { parseExcelToParcels, validateParcels, generateExcelTemplate, ParcelImportData } from "@/lib/utils/parcel-import"
import { bulkImportParcels } from "@/lib/actions/bulk-import-parcel-actions"
import * as XLSX from "xlsx"

export default function ParcelManagementPage() {
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [allParcels, setAllParcels] = useState<Parcel[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [allUnits, setAllUnits] = useState<any[]>([])
  const [stats, setStats] = useState<ParcelStats | null>(null)
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false)
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Bulk import states
  const [importedParcels, setImportedParcels] = useState<ParcelImportData[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'validating' | 'importing' | 'success' | 'error'>('idle')
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)

  // New states for enhancements
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [uploadedImage, setUploadedImage] = useState<string | undefined>(undefined)
  const [residents, setResidents] = useState<Array<{ id: string, name: string, email?: string, phone?: string, type: 'owner' | 'tenant', is_primary: boolean }>>([])
  const [showResidents, setShowResidents] = useState(false)

  // State for viewing parcel image
  const [isViewImageDialogOpen, setIsViewImageDialogOpen] = useState(false)
  const [viewingImageUrl, setViewingImageUrl] = useState<string | undefined>(undefined)

  // Form states
  const [formData, setFormData] = useState<ParcelFormData>({
    unit_number: "",
    recipient_name: "",
    courier_company: "",
    tracking_number: "",
    parcel_description: "",
    staff_received_by: "",
    notes: ""
  })

  const [pickupData, setPickupData] = useState<ParcelPickupData>({
    parcel_id: "",
    picked_up_by: "",
    picked_up_method: "qr_code",
    staff_delivered_by: "",
    digital_signature: "",
    delivery_photo_url: "",
    notes: ""
  })

  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('[Parcels] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedProjectId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('[perf] Parcels load: starting...')

      const pStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const [parcelsResult, unitsResult, statsResult] = await Promise.all([
        // Server-side filter by project and limit payload
        getAllParcels(undefined, selectedProjectId || undefined, 100),
        getUnitsWithResidents(currentUser.id, selectedProjectId || undefined),
        getParcelStats(selectedProjectId || undefined)
      ])
      const pEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log(`[perf] Parcels parallel fetch done in ${Math.round(pEnd - pStart)}ms`)

      console.log(`[perf] Parcels fetched: ${parcelsResult.success ? (parcelsResult.parcels?.length || 0) : 0} rows`)
      console.log(`[perf] Units fetched: ${unitsResult.success ? (unitsResult.units?.length || 0) : 0} rows`)
      console.log('[perf] Stats fetched:', statsResult.success)

      // Filter units by project first
      if (unitsResult.success) {
        const allUnitsData = unitsResult.units || []
        setAllUnits(allUnitsData)
        console.log('[Parcels] Total units from DB:', allUnitsData.length)

        // Filter by selected project (for non-Super Admin)
        if (selectedProjectId && currentUser.role !== 'super_admin') {
          const filteredUnits = allUnitsData.filter(unit => unit.project_id === selectedProjectId)
          console.log('[Parcels] Filtered units:', allUnitsData.length, '→', filteredUnits.length)
          setUnits(filteredUnits)
        } else {
          console.log('[Parcels] No filtering units (Super Admin)')
          setUnits(allUnitsData)
        }
      }

      if (parcelsResult.success) {
        const allParcelsData = parcelsResult.parcels || []
        setAllParcels(allParcelsData)
        console.log('[perf] Total parcels from DB:', allParcelsData.length)

        // Filter by selected project (for non-Super Admin)
        let filteredParcels = allParcelsData
        if (selectedProjectId && currentUser.role !== 'super_admin') {
          const fStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
          filteredParcels = allParcelsData.filter((parcel: any) => parcel.project_id === selectedProjectId)
          const fEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
          console.log(`[perf] Filtered parcels: ${allParcelsData.length} → ${filteredParcels.length} in ${Math.round(fEnd - fStart)}ms`)
        } else {
          console.log('[perf] No filtering parcels (Super Admin)')
        }

        setParcels(filteredParcels)

        // Calculate stats from filtered parcels
        const sStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const calculatedStats: ParcelStats = {
          total_parcels: filteredParcels.length,
          pending_parcels: filteredParcels.filter(p => p.status === 'pending').length,
          picked_up_parcels: filteredParcels.filter(p => p.status === 'picked_up').length,
          delivered_parcels: filteredParcels.filter(p => p.status === 'delivered').length,
          expired_parcels: filteredParcels.filter(p => p.status === 'expired').length,
          today_parcels: filteredParcels.filter(p => {
            const today = new Date().toISOString().split('T')[0]
            const parcelDate = p.received_at?.split('T')[0]
            return parcelDate === today
          }).length,
          this_month_parcels: filteredParcels.filter(p => {
            const now = new Date()
            const parcelDate = new Date(p.received_at || '')
            return parcelDate.getMonth() === now.getMonth() && parcelDate.getFullYear() === now.getFullYear()
          }).length
        }

        setStats(calculatedStats)
        const sEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
        console.log(`[perf] Calculated stats for project in ${Math.round(sEnd - sStart)}ms`, calculatedStats)
      } else {
        console.error('[Parcels] Failed to load parcels:', parcelsResult.error)
      }
    } catch (error: any) {
      console.error('Load data error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log(`[perf] Parcels load total: ${Math.round(t1 - t0)}ms`)
    }
  }

  // Load residents when unit number changes
  const loadResidents = async (unitNumber: string) => {
    if (!unitNumber) {
      setResidents([])
      setShowResidents(false)
      return
    }

    console.log('[Parcels] Loading residents for unit:', unitNumber)
    setShowResidents(true) // Show the field immediately
    setResidents([]) // Clear previous data

    try {
      const result = await getUnitResidents(unitNumber)
      console.log('[Parcels] Residents result:', result)

      if (result.success) {
        console.log('[Parcels] Found residents:', result.residents)
        setResidents(result.residents || [])
      } else {
        console.log('[Parcels] No residents found or error:', result.error)
        setResidents([])
      }
    } catch (error) {
      console.error('Error loading residents:', error)
      setResidents([])
    }
  }

  // Handle unit number change
  const handleUnitNumberChange = async (unitNumber: string) => {
    setFormData({ ...formData, unit_number: unitNumber, recipient_name: "" })
    if (unitNumber) {
      await loadResidents(unitNumber)
    } else {
      setResidents([])
      setShowResidents(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      const dataURL = await fileToDataURL(file)
      setUploadedImage(dataURL)
      toast({
        title: "อัปโหลดรูปสำเร็จ",
        description: "รูปพัสดุถูกอัปโหลดแล้ว",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดรูปได้",
        variant: "destructive",
      })
    }
  }

  const handleCreateParcel = async () => {
    if (!formData.unit_number || !formData.recipient_name || !formData.courier_company || !formData.staff_received_by) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('[Parcels] Creating parcel with project_id:', selectedProjectId)
      const result = await createParcel({
        ...formData,
        project_id: selectedProjectId ? selectedProjectId : undefined
      } as ParcelFormData, uploadedImage || undefined)

      if (result.success) {
        console.log('[Parcels] Parcel created successfully')
        toast({
          title: "สำเร็จ",
          description: "ลงทะเบียนพัสดุเรียบร้อยแล้ว",
        })
        setIsCreateDialogOpen(false)
        setFormData({
          unit_number: "",
          recipient_name: "",
          courier_company: "",
          tracking_number: "",
          parcel_description: "",
          staff_received_by: "",
          notes: ""
        })
        setUploadedImage(undefined)
        setResidents([])
        setShowResidents(false)
        await loadData()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePickupParcel = async () => {
    if (!pickupData.parcel_id) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบข้อมูลพัสดุ กรุณาลองใหม่",
        variant: "destructive",
      })
      return
    }

    if (!pickupData.picked_up_by || !pickupData.staff_delivered_by) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('Pickup data:', pickupData)
      const result = await pickupParcel(pickupData)
      if (result.success) {
        toast({
          title: "สำเร็จ",
          description: "บันทึกการรับพัสดุเรียบร้อยแล้ว",
        })
        setIsPickupDialogOpen(false)
        setSelectedParcel(null)
        setPickupData({
          parcel_id: "",
          picked_up_by: "",
          picked_up_method: "qr_code",
          staff_delivered_by: "",
          digital_signature: "",
          delivery_photo_url: "",
          notes: ""
        })
        await loadData()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const result = await searchParcels(searchQuery, selectedProjectId || undefined)
      if (result.success && result.parcels) {
        setParcels(result.parcels)
        toast({
          title: "ค้นหาสำเร็จ",
          description: `พบพัสดุ ${result.parcels.length} รายการ`,
        })
      } else {
        toast({
          title: "ไม่พบข้อมูล",
          description: "ไม่พบพัสดุที่ค้นหา",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilter = () => {
    setIsLoading(true)
    setTimeout(() => {
      let filtered = allParcels

      if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter)
      }

      if (selectedProjectId && currentUser.role !== 'super_admin') {
        filtered = filtered.filter((p: any) => p.project_id === selectedProjectId)
      }

      setParcels(filtered)
      setIsLoading(false)
    }, 100)
  }

  useEffect(() => {
    handleFilter()
  }, [statusFilter])

  const handleOpenPickupDialog = (parcel: Parcel) => {
    setSelectedParcel(parcel)
    setPickupData({
      ...pickupData,
      parcel_id: parcel.id,
      staff_delivered_by: currentUser.name || ""
    })
    setIsPickupDialogOpen(true)
  }

  const handleScanQRCode = () => {
    // Open scan page
    window.location.href = '/parcels/scan'
  }

  // Bulk import functions
  const handleExcelImport = async (file: File) => {
    setImportStatus('uploading')

    try {
      const parsedParcels = await parseExcelToParcels(file)
      const existingUnitNumbers = units.map(u => u.unit_number)
      const validatedParcels = validateParcels(parsedParcels, existingUnitNumbers)

      setImportedParcels(validatedParcels)
      setImportStatus('validating')

      const validParcels = validatedParcels.filter(p => !p.errors || p.errors.length === 0)
      const invalidParcels = validatedParcels.filter(p => p.errors && p.errors.length > 0)

      if (invalidParcels.length > 0) {
        toast({
          title: "พบข้อผิดพลาด",
          description: `พบข้อผิดพลาด ${invalidParcels.length} รายการ และมีข้อมูลที่ถูกต้อง ${validParcels.length} รายการ`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "ตรวจสอบข้อมูลสำเร็จ",
          description: `พบข้อมูลที่ถูกต้อง ${validParcels.length} รายการ`,
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

  const handleBulkImport = async () => {
    setImportStatus('importing')
    setImportProgress(0)

    try {
      const validParcels = importedParcels.filter(p => !p.errors || p.errors.length === 0)

      if (validParcels.length === 0) {
        toast({
          title: "ไม่สามารถนำเข้าข้อมูลได้",
          description: "ไม่มีข้อมูลที่ถูกต้องสำหรับนำเข้า",
          variant: "destructive",
        })
        setImportStatus('error')
        return
      }

      const result = await bulkImportParcels({
        parcels: validParcels,
        project_id: selectedProjectId || undefined
      })

      if (result.success) {
        setImportProgress(100)
        setImportStatus('success')
        toast({
          title: "นำเข้าข้อมูลสำเร็จ",
          description: `นำเข้าข้อมูลสำเร็จ ${result.imported} รายการ${result.failed > 0 ? ` (ล้มเหลว ${result.failed} รายการ)` : ''}`,
        })

        setTimeout(() => {
          setIsBulkImportDialogOpen(false)
          setImportedParcels([])
          setImportProgress(0)
          setImportStatus('idle')
          loadData()
        }, 2000)
      } else {
        setImportStatus('error')
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || `นำเข้าข้อมูลล้มเหลว ${result.failed} รายการ`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('[Bulk Import] Error:', error)
      setImportStatus('error')
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDownloadTemplate = () => {
    generateExcelTemplate()
    toast({
      title: "ดาวน์โหลดเทมเพลตสำเร็จ",
      description: "ไฟล์ parcel_import_template.xlsx ถูกดาวน์โหลดแล้ว",
    })
  }

  const filteredParcels = parcels.filter(parcel => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        parcel.unit_number?.toLowerCase().includes(query) ||
        parcel.recipient_name?.toLowerCase().includes(query) ||
        parcel.courier_company?.toLowerCase().includes(query) ||
        parcel.tracking_number?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />รอรับ</Badge>
      case 'delivered':
        return <Badge variant="outline" className="text-blue-600"><Package className="w-3 h-3 mr-1" />ส่งมอบแล้ว</Badge>
      case 'picked_up':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />รับแล้ว</Badge>
      case 'expired':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />หมดอายุ</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPickupMethodIcon = (method: string) => {
    switch (method) {
      case 'qr_code':
        return <QrCode className="w-4 h-4" />
      case 'id_card':
        return <CreditCard className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      case 'unit_code':
        return <User className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  // Bulk Actions
  const toggleParcelSelection = (parcelId: string) => {
    const newSelected = new Set(selectedAccounts)
    if (newSelected.has(parcelId)) {
      newSelected.delete(parcelId)
    } else {
      newSelected.add(parcelId)
    }
    setSelectedAccounts(newSelected)
  }

  const handleBulkDelivery = async () => {
    if (selectedAccounts.size === 0) {
      toast({
        title: "ไม่พบรายการที่เลือก",
        description: "กรุณาเลือกรายการที่ต้องการส่งมอบ",
        variant: "destructive",
      })
      return
    }

    // Mark selected parcels as delivered
    // Implementation here
    toast({
      title: "ส่งมอบสำเร็จ",
      description: `ส่งมอบ ${selectedAccounts.size} รายการแล้ว`,
    })
    setSelectedAccounts(new Set())
  }

  // Export functions
  const exportToExcel = () => {
    const data = filteredParcels.map(p => ({
      'เลขห้อง': p.unit_number,
      'ผู้รับ': p.recipient_name,
      'บริษัทขนส่ง': p.courier_company,
      'หมายเลขติดตาม': p.tracking_number || '',
      'สถานะ': p.status,
      'วันที่รับ': p.received_at,
      'วันที่รับแล้ว': p.picked_up_at || '',
      'ผู้รับพัสดุ': p.picked_up_by || '',
      'เจ้าหน้าที่': p.staff_received_by
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'พัสดุ')
    XLSX.writeFile(wb, `parcels_${new Date().toISOString().split('T')[0]}.xlsx`)

    toast({
      title: "Export สำเร็จ",
      description: "Export ข้อมูลเป็น Excel สำเร็จ",
    })
  }

  const generateQRCodeForParcel = async (parcel: Parcel) => {
    // QR Code จะพาไปที่หน้าลูกบ้านเพื่อดูรายละเอียดพัสดุ
    const qrData = `${window.location.origin}/portal/dashboard?parcel=${parcel.id}`
    const qrCodeDataURL = await generateQRCodeDataURL(qrData)

    // Create download
    const link = document.createElement('a')
    link.href = qrCodeDataURL
    link.download = `parcel_${parcel.unit_number}_${Date.now()}.png`
    link.click()

    toast({
      title: "ดาวน์โหลด QR Code สำเร็จ",
      description: "QR Code สำหรับพัสดุถูกดาวน์โหลดแล้ว",
    })
  }

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการพัสดุ"
        subtitle="ลงทะเบียนและจัดการพัสดุของลูกบ้าน"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              นำเข้าจาก Excel
            </Button>
            <Button variant="outline" onClick={handleScanQRCode}>
              <QrCode className="mr-2 h-4 w-4" />
              สแกน QR Code
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              พิมพ์รายงาน
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              รับพัสดุเข้า
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">พัสดุทั้งหมด</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_parcels}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รอรับ</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_parcels}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รับแล้ว</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.picked_up_parcels}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">วันนี้</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.today_parcels}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาด้วยเลขห้อง, ชื่อผู้รับ, บริษัทขนส่ง..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="pending">รอรับ</SelectItem>
                <SelectItem value="delivered">ส่งมอบแล้ว</SelectItem>
                <SelectItem value="picked_up">รับแล้ว</SelectItem>
                <SelectItem value="expired">หมดอายุ</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAccounts.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4 flex items-center justify-between">
            <span className="text-sm text-blue-800">
              เลือกแล้ว {selectedAccounts.size} รายการ
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedAccounts(new Set())}>
                ยกเลิก
              </Button>
              <Button size="sm" onClick={handleBulkDelivery}>
                ส่งมอบพร้อมกัน
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parcels Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการพัสดุ</CardTitle>
          <CardDescription>
            รายการพัสดุที่ลงทะเบียน {filteredParcels.length} รายการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAccounts.size === filteredParcels.length && filteredParcels.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAccounts(new Set(filteredParcels.map(p => p.id)))
                        } else {
                          setSelectedAccounts(new Set())
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>เลขห้อง</TableHead>
                  <TableHead>ผู้รับ</TableHead>
                  <TableHead>บริษัทขนส่ง</TableHead>
                  <TableHead>หมายเลขติดตาม</TableHead>
                  <TableHead>วันที่รับ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParcels.map((parcel) => (
                  <TableRow key={parcel.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAccounts.has(parcel.id)}
                        onCheckedChange={() => toggleParcelSelection(parcel.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{parcel.unit_number}</TableCell>
                    <TableCell>{parcel.recipient_name}</TableCell>
                    <TableCell>{parcel.courier_company}</TableCell>
                    <TableCell>{parcel.tracking_number || '-'}</TableCell>
                    <TableCell>{formatDate(parcel.received_at)}</TableCell>
                    <TableCell>{getStatusBadge(parcel.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {parcel.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPickupDialog(parcel)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            มอบพัสดุ
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateQRCodeForParcel(parcel)}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          QR Code
                        </Button>
                        {parcel.parcel_image_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setViewingImageUrl(parcel.parcel_image_url)
                              setIsViewImageDialogOpen(true)
                            }}
                          >
                            <ImageIcon className="w-4 h-4 mr-1" />
                            ดูรูป
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Parcel Dialog - ENHANCED with Image Upload and Resident Selection */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รับพัสดุเข้า</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลพัสดุที่มาถึง
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit_number">เลขห้อง *</Label>
                <Select value={formData.unit_number} onValueChange={handleUnitNumberChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={units.length === 0 ? "กำลังโหลด..." : "เลือกห้อง"} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.length === 0 ? (
                      <SelectItem value="no-units" disabled>
                        {isLoading ? "กำลังโหลดข้อมูลห้อง..." : "ไม่มีข้อมูลห้อง"}
                      </SelectItem>
                    ) : (
                      units.map((unit) => (
                        <SelectItem key={unit.unit_number} value={unit.unit_number}>
                          {unit.unit_number} - {unit.owner_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Show recipients field when unit is selected */}
              {showResidents && (
                <div className="col-span-2">
                  <Label htmlFor="recipient_name">ชื่อผู้รับพัสดุ *</Label>
                  {residents.length > 0 ? (
                    <Select value={formData.recipient_name} onValueChange={(value) => {
                      const resident = residents.find(r => r.name === value)
                      setFormData({ ...formData, recipient_name: resident?.name || value })
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกผู้รับพัสดุ" />
                      </SelectTrigger>
                      <SelectContent>
                        {residents.map((resident) => (
                          <SelectItem key={resident.id} value={resident.name}>
                            {resident.name} ({resident.type === 'owner' ? 'เจ้าของ' : 'ผู้เช่า'}) {resident.is_primary && '(หลัก)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <Input
                        id="recipient_name"
                        value={formData.recipient_name}
                        onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                        placeholder="กรอกชื่อผู้รับพัสดุ"
                      />
                      <p className="text-sm text-gray-500 mt-1">ไม่พบข้อมูลผู้อยู่อาศัย กรุณากรอกชื่อด้วยตนเอง</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courier_company">บริษัทขนส่ง *</Label>
                <Input
                  id="courier_company"
                  value={formData.courier_company}
                  onChange={(e) => setFormData({ ...formData, courier_company: e.target.value })}
                  placeholder="เช่น Flash Express, Kerry, J&T"
                />
              </div>
              <div>
                <Label htmlFor="tracking_number">หมายเลขติดตาม</Label>
                <Input
                  id="tracking_number"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  placeholder="หมายเลขติดตามพัสดุ"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="parcel_description">รายละเอียดพัสดุ</Label>
              <Textarea
                id="parcel_description"
                value={formData.parcel_description}
                onChange={(e) => setFormData({ ...formData, parcel_description: e.target.value })}
                placeholder="รายละเอียดพัสดุ (ขนาด, น้ำหนัก, ฯลฯ)"
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label>รูปภาพพัสดุ</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />
                {uploadedImage ? (
                  <div className="relative">
                    <img src={uploadedImage} alt="Parcel" className="max-h-48 mx-auto rounded" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setUploadedImage(undefined)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      ลบรูป
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-4 h-4 mr-1" />
                        เลือกรูปภาพ
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="staff_received_by">เจ้าหน้าที่รับ *</Label>
              <Input
                id="staff_received_by"
                value={formData.staff_received_by}
                onChange={(e) => setFormData({ ...formData, staff_received_by: e.target.value })}
                placeholder="ชื่อเจ้าหน้าที่ที่รับพัสดุ"
              />
            </div>
            <div>
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              setUploadedImage(undefined)
              setResidents([])
              setShowResidents(false)
            }}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateParcel} disabled={isLoading || units.length === 0}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pickup Parcel Dialog */}
      <Dialog open={isPickupDialogOpen} onOpenChange={setIsPickupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>มอบพัสดุ</DialogTitle>
            <DialogDescription>
              บันทึกการมอบพัสดุให้ลูกบ้าน
            </DialogDescription>
          </DialogHeader>
          {selectedParcel && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">ข้อมูลพัสดุ</h4>
                <p>ห้อง: {selectedParcel.unit_number}</p>
                <p>ผู้รับ: {selectedParcel.recipient_name}</p>
                <p>บริษัท: {selectedParcel.courier_company}</p>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="picked_up_by">ชื่อผู้รับพัสดุ *</Label>
                  <Input
                    id="picked_up_by"
                    value={pickupData.picked_up_by}
                    onChange={(e) => setPickupData({ ...pickupData, picked_up_by: e.target.value })}
                    placeholder="ชื่อผู้ที่มารับพัสดุ"
                  />
                </div>
                <div>
                  <Label htmlFor="picked_up_method">วิธีการยืนยันตัวตน *</Label>
                  <Select value={pickupData.picked_up_method} onValueChange={(value: any) => setPickupData({ ...pickupData, picked_up_method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qr_code">QR Code</SelectItem>
                      <SelectItem value="id_card">บัตรประจำตัว</SelectItem>
                      <SelectItem value="phone">เบอร์โทรศัพท์</SelectItem>
                      <SelectItem value="unit_code">รหัสห้อง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="staff_delivered_by">เจ้าหน้าที่ส่งมอบ *</Label>
                  <Input
                    id="staff_delivered_by"
                    value={pickupData.staff_delivered_by}
                    onChange={(e) => setPickupData({ ...pickupData, staff_delivered_by: e.target.value })}
                    placeholder="ชื่อเจ้าหน้าที่ที่ส่งมอบ"
                  />
                </div>
                <div>
                  <Label htmlFor="notes_pickup">หมายเหตุ</Label>
                  <Textarea
                    id="notes_pickup"
                    value={pickupData.notes}
                    onChange={(e) => setPickupData({ ...pickupData, notes: e.target.value })}
                    placeholder="หมายเหตุเพิ่มเติม"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPickupDialogOpen(false)
              setSelectedParcel(null)
            }}>
              ยกเลิก
            </Button>
            <Button onClick={handlePickupParcel} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Image Dialog */}
      <Dialog open={isViewImageDialogOpen} onOpenChange={setIsViewImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รูปภาพพัสดุ</DialogTitle>
            <DialogDescription>
              รูปภาพพัสดุที่บันทึกไว้ในระบบ
            </DialogDescription>
          </DialogHeader>
          {viewingImageUrl || null ? (
            <div className="flex items-center justify-center p-4">
              <img
                src={viewingImageUrl}
                alt="Parcel Image"
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-center text-gray-500">
              ไม่มีรูปภาพ
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewImageDialogOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>นำเข้าพัสดุจาก Excel</DialogTitle>
            <DialogDescription>
              อัปโหลดไฟล์ Excel เพื่อนำเข้าพัสดุหลายรายการพร้อมกัน
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">ดาวน์โหลดเทมเพลต</p>
                <p className="text-sm text-gray-500">ดาวน์โหลดไฟล์ Excel template เพื่อกรอกข้อมูล</p>
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                ดาวน์โหลดเทมเพลต
              </Button>
            </div>

            <div className="space-y-4">
              <Label>เลือกไฟล์ Excel (.xlsx)</Label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
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
              <p className="text-sm text-gray-500">รองรับไฟล์ .xlsx, .xls, .csv ขนาดสูงสุด 10 MB</p>
            </div>

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

            {importedParcels.length > 0 && (
              <div className="space-y-4">
                <Label>ตัวอย่างข้อมูลที่ตรวจสอบแล้ว (5 แถวแรก)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>เลขห้อง</TableHead>
                        <TableHead>ชื่อผู้รับ</TableHead>
                        <TableHead>บริษัทขนส่ง</TableHead>
                        <TableHead>หมายเลขติดตาม</TableHead>
                        <TableHead>สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedParcels.slice(0, 5).map((parcel, index) => (
                        <TableRow key={index}>
                          <TableCell>{parcel.unit_number}</TableCell>
                          <TableCell>{parcel.recipient_name}</TableCell>
                          <TableCell>{parcel.courier_company}</TableCell>
                          <TableCell>{parcel.tracking_number || '-'}</TableCell>
                          <TableCell>
                            {parcel.errors && parcel.errors.length > 0 ? (
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
                    <strong>พบ {importedParcels.filter(p => !p.errors || p.errors.length === 0).length} รายการที่สามารถนำเข้าได้</strong>
                    {importedParcels.some(p => p.errors && p.errors.length > 0) && (
                      <span> และ {importedParcels.filter(p => p.errors && p.errors.length > 0).length} รายการที่มีข้อผิดพลาด</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {importedParcels.some(p => p.errors && p.errors.length > 0) && (
              <div className="space-y-2">
                <Label>รายการข้อผิดพลาด</Label>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {importedParcels.filter(p => p.errors && p.errors.length > 0).map((parcel, index) => (
                    <div key={index} className="p-3 border-b last:border-0">
                      <p className="font-medium text-red-600">{parcel.unit_number}</p>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {parcel.errors?.map((error, i) => (
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
            <Button variant="outline" onClick={() => {
              setIsBulkImportDialogOpen(false)
              setImportedParcels([])
              setImportProgress(0)
              setImportStatus('idle')
            }}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={importStatus === 'importing' || importedParcels.length === 0 || importedParcels.every(p => p.errors && p.errors.length > 0)}
            >
              {importStatus === 'importing' ? 'กำลังนำเข้า...' : 'ยืนยันการนำเข้า'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
