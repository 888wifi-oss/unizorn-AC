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
import { Building, Plus, RefreshCw, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Project, Company } from "@/lib/types/permissions"
import { 
  getProjects, 
  createProject, 
  updateProject, 
  deleteProject 
} from "@/lib/actions/project-actions"
import { getCompanies } from "@/lib/actions/company-actions"
import { getCurrentUserId, getCurrentUser } from "@/lib/utils/mock-auth"
import { canPerformAction } from "@/lib/types/granular-permissions"
import { useProjectContext } from "@/lib/contexts/project-context"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<any | null>(null)
  const [filterCompany, setFilterCompany] = useState<string>("all")
  const [formData, setFormData] = useState<{
    company_id: string
    name: string
    slug: string
    code: string
    address: string
    phone: string
    email: string
    manager_name: string
    manager_phone: string
    manager_email: string
    total_units: number
    total_floors: number
    project_type: "condo" | "apartment" | "office" | "mixed"
  }>({
    company_id: "",
    name: "",
    slug: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    manager_name: "",
    manager_phone: "",
    manager_email: "",
    total_units: 0,
    total_floors: 0,
    project_type: "condo"
  })

  // Get current user ID from mock auth
  const currentUserId = getCurrentUserId()
  const currentUser = getCurrentUser()
  const { selectedProjectId, selectedProject } = useProjectContext()
  
  // Check if user can add projects based on their role
  const canAddProject = canPerformAction(currentUser.role, 'projects', 'add')

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectsResult, companiesResult] = await Promise.all([
        getProjects(currentUserId, filterCompany === "all" ? undefined : filterCompany),
        getCompanies(currentUserId)
      ])

      if (projectsResult.success) {
        let filteredProjects = projectsResult.projects || []
        
        // Filter by selected project (for non-Super Admin)
        if (selectedProjectId && currentUser.role !== 'super_admin') {
          filteredProjects = filteredProjects.filter(p => p.id === selectedProjectId)
        }
        
        setProjects(filteredProjects)
      }
      
      if (companiesResult.success) {
        let filteredCompanies = companiesResult.companies || []
        
        // Filter by selected project's company
        if (selectedProject && currentUser.role !== 'super_admin') {
          filteredCompanies = filteredCompanies.filter(c => 
            c.id === selectedProject?.company_id
          )
        }
        
        setCompanies(filteredCompanies)
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
    console.log('[Projects] useEffect triggered. selectedProjectId:', selectedProjectId, 'filterCompany:', filterCompany)
    loadData()
  }, [filterCompany, selectedProjectId]) // Reload when filter or project changes

  const handleCreate = async () => {
    try {
      if (!formData.company_id || !formData.name || !formData.slug) {
        toast({
          title: "ข้อมูลไม่ครบ",
          description: "กรุณากรอกข้อมูลที่จำเป็น",
          variant: "destructive",
        })
        return
      }

      const result = await createProject(currentUserId, {
        ...formData,
        is_active: true
      })

      if (result.success) {
        toast({
          title: "สร้างโครงการสำเร็จ",
          description: "โครงการใหม่ถูกสร้างเรียบร้อยแล้ว",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadData()
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
    if (!selectedProjectForEdit) return

    try {
      const result = await updateProject(currentUserId, selectedProjectForEdit.id, formData)

      if (result.success) {
        toast({
          title: "แก้ไขสำเร็จ",
          description: "ข้อมูลโครงการถูกแก้ไขเรียบร้อยแล้ว",
        })
        setIsEditDialogOpen(false)
        setSelectedProjectForEdit(null)
        loadData()
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

  const handleDelete = async (projectId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบโครงการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) {
      return
    }

    try {
      const result = await deleteProject(currentUserId, projectId)

      if (result.success) {
        toast({
          title: "ลบสำเร็จ",
          description: "โครงการถูกลบเรียบร้อยแล้ว",
        })
        loadData()
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

  const openEditDialog = (project: any) => {
    setSelectedProjectForEdit(project)
    setFormData({
      company_id: project.company_id,
      name: project.name,
      slug: project.slug,
      code: project.code || "",
      address: project.address || "",
      phone: project.phone || "",
      email: project.email || "",
      manager_name: project.manager_name || "",
      manager_phone: project.manager_phone || "",
      manager_email: project.manager_email || "",
      total_units: project.total_units,
      total_floors: project.total_floors,
      project_type: project.project_type
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      company_id: "",
      name: "",
      slug: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      manager_name: "",
      manager_phone: "",
      manager_email: "",
      total_units: 0,
      total_floors: 0,
      project_type: "condo"
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="จัดการโครงการ" subtitle="ระบบจัดการโครงการในบริษัท" />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการโครงการ"
        subtitle="ระบบจัดการโครงการในบริษัท"
        action={
          <div className="flex gap-2">
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="เลือกบริษัท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกบริษัท</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              รีเฟรช
            </Button>
            {canAddProject && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มโครงการ
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>เพิ่มโครงการใหม่</DialogTitle>
                  <DialogDescription>สร้างโครงการใหม่ในบริษัท</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="company">บริษัท *</Label>
                    <Select 
                      value={formData.company_id} 
                      onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกบริษัท" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">ชื่อโครงการ *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Condo XYZ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="condo-xyz"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">รหัสโครงการ</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="CX001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="project_type">ประเภทโครงการ</Label>
                      <Select 
                        value={formData.project_type} 
                        onValueChange={(value: "condo" | "apartment" | "office" | "mixed") => setFormData({ ...formData, project_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="condo">คอนโด</SelectItem>
                          <SelectItem value="apartment">อพาร์ตเมนต์</SelectItem>
                          <SelectItem value="office">อาคารสำนักงาน</SelectItem>
                          <SelectItem value="mixed">แบบผสม</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Label htmlFor="phone">เบอร์โทร</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="02-123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">อีเมล</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@project.com"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">ข้อมูลผู้จัดการโครงการ</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="manager_name">ชื่อผู้จัดการ</Label>
                        <Input
                          id="manager_name"
                          value={formData.manager_name}
                          onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                          placeholder="นาย..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="manager_phone">เบอร์โทรผู้จัดการ</Label>
                        <Input
                          id="manager_phone"
                          value={formData.manager_phone}
                          onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                          placeholder="081-234-5678"
                        />
                      </div>
                      <div>
                        <Label htmlFor="manager_email">อีเมลผู้จัดการ</Label>
                        <Input
                          id="manager_email"
                          type="email"
                          value={formData.manager_email}
                          onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                          placeholder="manager@project.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="total_units">จำนวนยูนิตทั้งหมด</Label>
                      <Input
                        id="total_units"
                        type="number"
                        value={formData.total_units}
                        onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_floors">จำนวนชั้นทั้งหมด</Label>
                      <Input
                        id="total_floors"
                        type="number"
                        value={formData.total_floors}
                        onChange={(e) => setFormData({ ...formData, total_floors: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreate}>สร้างโครงการ</Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>รายการโครงการทั้งหมด</CardTitle>
          <CardDescription>
            จัดการโครงการในแพลตฟอร์ม ({projects.length} โครงการ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อโครงการ</TableHead>
                <TableHead>บริษัท</TableHead>
                <TableHead>รหัส</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ยูนิต/ชั้น</TableHead>
                <TableHead>ผู้จัดการ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    ไม่มีข้อมูลโครงการ
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{project.company?.name}</div>
                        <code className="text-xs text-gray-500">{project.company?.slug}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {project.code || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.project_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{project.total_units} ยูนิต</div>
                        <div className="text-gray-500">{project.total_floors} ชั้น</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{project.manager_name || '-'}</div>
                        <div className="text-gray-500">{project.manager_phone || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.is_active ? "default" : "secondary"}>
                        {project.is_active ? "เปิดใช้งาน" : "ระงับ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(project)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลโครงการ</DialogTitle>
            <DialogDescription>แก้ไขโครงการ: {selectedProject?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">ชื่อโครงการ *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-code">รหัสโครงการ</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
                <Label htmlFor="edit-phone">เบอร์โทร</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">อีเมล</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">ข้อมูลผู้จัดการโครงการ</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-manager-name">ชื่อผู้จัดการ</Label>
                  <Input
                    id="edit-manager-name"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-manager-phone">เบอร์โทร</Label>
                  <Input
                    id="edit-manager-phone"
                    value={formData.manager_phone}
                    onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-manager-email">อีเมล</Label>
                  <Input
                    id="edit-manager-email"
                    type="email"
                    value={formData.manager_email}
                    onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                  />
                </div>
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
