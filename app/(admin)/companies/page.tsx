"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { Building2, Plus, RefreshCw, Edit, Trash2, CheckCircle, XCircle, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Company } from "@/lib/types/permissions"
import { 
  getCompanies, 
  createCompany, 
  updateCompany, 
  deleteCompany,
  toggleCompanyStatus 
} from "@/lib/actions/company-actions"
import { getCurrentUserId, getCurrentUser } from "@/lib/utils/mock-auth"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

export default function CompaniesPage() {
  const router = useRouter()
  const currentUser = getCurrentUser()
  
  // Only Super Admin can access this page
  useEffect(() => {
    if (currentUser.role !== 'super_admin') {
      router.push('/projects')
    }
  }, [currentUser.role, router])
  
  // Show access denied if not Super Admin
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="space-y-6">
        <PageHeader title="จัดการบริษัท" subtitle="ระบบจัดการบริษัททั้งหมด" />
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-amber-100 dark:bg-amber-900 rounded-full">
                  <AlertCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">ไม่มีสิทธิ์เข้าถึง</h3>
              <p className="text-muted-foreground">
                เฉพาะ Super Admin เท่านั้นที่สามารถเข้าถึงหน้าจัดการบริษัทได้
              </p>
              <Button onClick={() => router.push('/projects')}>
                กลับไปหน้าจัดการโครงการ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
    subscription_plan: "basic",
    max_projects: 1,
    max_units: 100
  })

  // Get current user ID from mock auth
  const currentUserId = getCurrentUserId()

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const result = await getCompanies(currentUserId)
      if (result.success) {
        setCompanies(result.companies || [])
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
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleCreate = async () => {
    try {
      const result = await createCompany(currentUserId, {
        ...formData,
        is_active: true
      })

      if (result.success) {
        toast({
          title: "สร้างบริษัทสำเร็จ",
          description: "บริษัทใหม่ถูกสร้างเรียบร้อยแล้ว",
        })
        setIsCreateDialogOpen(false)
        setFormData({
          name: "",
          slug: "",
          email: "",
          phone: "",
          address: "",
          tax_id: "",
          subscription_plan: "basic",
          max_projects: 1,
          max_units: 100
        })
        loadCompanies()
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
    }
  }

  const handleEdit = async () => {
    if (!selectedCompany) return

    try {
      const result = await updateCompany(currentUserId, selectedCompany.id, formData)

      if (result.success) {
        toast({
          title: "แก้ไขสำเร็จ",
          description: "ข้อมูลบริษัทถูกแก้ไขเรียบร้อยแล้ว",
        })
        setIsEditDialogOpen(false)
        setSelectedCompany(null)
        loadCompanies()
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
    }
  }

  const handleDelete = async (companyId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบบริษัทนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) {
      return
    }

    try {
      const result = await deleteCompany(currentUserId, companyId)

      if (result.success) {
        toast({
          title: "ลบสำเร็จ",
          description: "บริษัทถูกลบเรียบร้อยแล้ว",
        })
        loadCompanies()
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
    }
  }

  const handleToggleStatus = async (companyId: string, isActive: boolean) => {
    try {
      const result = await toggleCompanyStatus(currentUserId, companyId, !isActive)

      if (result.success) {
        toast({
          title: "อัปเดตสถานะสำเร็จ",
          description: `บริษัท${!isActive ? 'เปิดใช้งาน' : 'ระงับ'}เรียบร้อยแล้ว`,
        })
        loadCompanies()
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
    }
  }

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company)
    setFormData({
      name: company.name,
      slug: company.slug,
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      tax_id: company.tax_id || "",
      subscription_plan: company.subscription_plan,
      max_projects: company.max_projects,
      max_units: company.max_units
    })
    setIsEditDialogOpen(true)
  }

  const getSubscriptionBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-yellow-100 text-yellow-800'
    }
    return colors[plan] || colors.basic
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="จัดการบริษัท" subtitle="ระบบจัดการบริษัทในแพลตฟอร์ม (Super Admin)" />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการบริษัท"
        subtitle="ระบบจัดการบริษัทในแพลตฟอร์ม (Super Admin)"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadCompanies}>
              <RefreshCw className="mr-2 h-4 w-4" />
              รีเฟรช
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มบริษัท
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>เพิ่มบริษัทใหม่</DialogTitle>
                  <DialogDescription>สร้างบริษัทใหม่ในระบบ</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">ชื่อบริษัท *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="ABC Property Management"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="abc-property"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">อีเมล</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@abc.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">เบอร์โทร</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="02-123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">ที่อยู่</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 ถนน..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tax_id">เลขประจำตัวผู้เสียภาษี</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                        placeholder="0123456789012"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subscription_plan">แผนการใช้งาน</Label>
                      <Select 
                        value={formData.subscription_plan} 
                        onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_projects">จำนวนโครงการสูงสุด</Label>
                      <Input
                        id="max_projects"
                        type="number"
                        value={formData.max_projects}
                        onChange={(e) => setFormData({ ...formData, max_projects: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_units">จำนวนยูนิตสูงสุด</Label>
                      <Input
                        id="max_units"
                        type="number"
                        value={formData.max_units}
                        onChange={(e) => setFormData({ ...formData, max_units: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreate}>สร้างบริษัท</Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>รายการบริษัททั้งหมด</CardTitle>
          <CardDescription>
            จัดการบริษัทที่ใช้งานแพลตฟอร์ม ({companies.length} บริษัท)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อบริษัท</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>แผนการใช้งาน</TableHead>
                <TableHead>โครงการ/ยูนิต</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    ไม่มีข้อมูลบริษัท
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{company.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSubscriptionBadge(company.subscription_plan)}>
                        {company.subscription_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>โครงการ: {company.max_projects}</div>
                        <div>ยูนิต: {company.max_units}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.is_active ? "default" : "secondary"}>
                        {company.is_active ? "เปิดใช้งาน" : "ระงับ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(company.created_at).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(company.id, company.is_active)}
                        >
                          {company.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(company)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(company.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลบริษัท</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลบริษัท: {selectedCompany?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">ชื่อบริษัท *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">Slug *</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">อีเมล</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">เบอร์โทร</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">ที่อยู่</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-subscription">แผนการใช้งาน</Label>
                <Select 
                  value={formData.subscription_plan} 
                  onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-max-projects">จำนวนโครงการสูงสุด</Label>
                <Input
                  id="edit-max-projects"
                  type="number"
                  value={formData.max_projects}
                  onChange={(e) => setFormData({ ...formData, max_projects: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEdit}>บันทึก</Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
