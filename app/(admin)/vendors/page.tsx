"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getVendorsFromDB, saveVendorToDB, deleteVendorFromDB } from "@/lib/supabase/actions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface Vendor {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  tax_id?: string
  notes?: string
  project_id?: string
}

export default function VendorsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [allVendors, setAllVendors] = useState<Vendor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tax_id: "",
    notes: "",
  })

  useEffect(() => {
    console.log('[Vendors] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadVendors()
  }, [selectedProjectId])

  const loadVendors = async () => {
    setLoading(true)
    try {
      const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const data = await getVendorsFromDB(selectedProjectId || null, currentUser.role !== 'super_admin')
      setAllVendors(data)
      const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log(`[perf] Vendors fetch (${data.length}): ${Math.round(tEnd - tStart)}ms`)
      // Server-side filtering applied; set directly
      setVendors(data)
    } catch (error) {
      console.error("[Vendors] Error loading data:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้ขายได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleOpenDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor)
      setFormData({
        name: vendor.name,
        contact_person: vendor.contact_person || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        address: vendor.address || "",
        tax_id: vendor.tax_id || "",
        notes: vendor.notes || "",
      })
    } else {
      setEditingVendor(null)
      setFormData({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        tax_id: "",
        notes: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: "กรุณากรอกข้อมูล",
        description: "ชื่อผู้ขายเป็นข้อมูลที่จำเป็น",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log('[Vendors] Saving vendor with project_id:', selectedProjectId)
      const vendorData = {
        id: editingVendor?.id || "new",
        name: formData.name,
        contact_person: formData.contact_person || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        tax_id: formData.tax_id || null,
        notes: formData.notes || null,
        project_id: editingVendor?.project_id || selectedProjectId || null,  // ✅ เพิ่ม
      }

      await saveVendorToDB(vendorData)
      await loadVendors()
      setIsDialogOpen(false)
      toast({
        title: "สำเร็จ",
        description: "บันทึกข้อมูลผู้ขายเรียบร้อยแล้ว",
      })
    } catch (error) {
      console.error("[Vendors] Error saving data:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบข้อมูลผู้ขายรายนี้ใช่หรือไม่?")) return

    setLoading(true)
    try {
      await deleteVendorFromDB(id)
      await loadVendors()
      toast({
        title: "สำเร็จ",
        description: "ลบข้อมูลผู้ขายเรียบร้อยแล้ว",
      })
    } catch (error) {
      console.error("[Vendors] Error deleting data:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="รายชื่อผู้ขาย (Vendors)"
        subtitle="จัดการข้อมูลผู้ขายหรือซัพพลายเออร์"
        action={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มผู้ขายใหม่
          </Button>
        }
      />

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="ค้นหาชื่อผู้ขาย หรือผู้ติดต่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อผู้ขาย</TableHead>
              <TableHead>ผู้ติดต่อ</TableHead>
              <TableHead>เบอร์โทร</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>เลขประจำตัวผู้เสียภาษี</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  กำลังโหลดข้อมูล...
                </TableCell>
              </TableRow>
            ) : filteredVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูลผู้ขาย
                </TableCell>
              </TableRow>
            ) : (
              filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.contact_person || "-"}</TableCell>
                  <TableCell>{vendor.phone || "-"}</TableCell>
                  <TableCell>{vendor.email || "-"}</TableCell>
                  <TableCell>{vendor.tax_id || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(vendor)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "แก้ไขข้อมูลผู้ขาย" : "เพิ่มผู้ขายใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="name">ชื่อผู้ขาย / บริษัท *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น บริษัท รักษาความปลอดภัย จำกัด"
              />
            </div>
            <div>
              <Label htmlFor="tax_id">เลขประจำตัวผู้เสียภาษี</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact_person">ชื่อผู้ติดต่อ</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">เบอร์โทร</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">ที่อยู่</Label>
              <Textarea
                id="address"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ข้อมูลเพิ่มเติม เช่น เลขที่บัญชีธนาคาร"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
