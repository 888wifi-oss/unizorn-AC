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
import { Users, UserPlus, RefreshCw, Edit, UserX, KeyRound, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { 
  getProjectTeam, 
  addTeamMember, 
  updateTeamMember,
  disableTeamMember,
  resetTeamMemberPassword,
  getTeamStats,
  TeamMember 
} from "@/lib/actions/team-actions"
import { getCurrentUserId, getCurrentUser } from "@/lib/utils/mock-auth"
import { useProjectContext } from "@/lib/contexts/project-context"

export default function TeamManagementPage() {
  const { selectedProjectId, selectedProject } = useProjectContext()
  const [team, setTeam] = useState<TeamMember[]>([])
  const [stats, setStats] = useState({ total: 0, staff: 0, engineer: 0, resident: 0 })
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "staff",
    unit_number: ""
  })
  const [newPassword, setNewPassword] = useState("")

  // Get current user and project context
  const currentUserId = getCurrentUserId()
  const currentUser = getCurrentUser()
  
  // Use selectedProjectId from context instead of hardcoded
  const currentProjectId = selectedProjectId || null
  const currentCompanyId = selectedProject?.company_id || null

  const loadData = async () => {
    if (!currentProjectId) {
      console.log('[TeamManagement] No project selected, skipping load')
      return
    }
    
    setLoading(true)
    try {
      console.log('[TeamManagement] Loading team for project:', currentProjectId)
      const [teamResult, statsResult] = await Promise.all([
        getProjectTeam(currentUserId, currentProjectId),
        getTeamStats(currentUserId, currentProjectId)
      ])

      if (teamResult.success) {
        setTeam(teamResult.team || [])
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: teamResult.error,
          variant: "destructive",
        })
      }

      if (statsResult.success) {
        setStats(statsResult.stats || { total: 0, staff: 0, engineer: 0, resident: 0 })
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
    console.log('[TeamManagement] useEffect triggered. selectedProjectId:', selectedProjectId)
    if (selectedProjectId) {
      loadData()
    }
  }, [selectedProjectId])

  const handleAddMember = async () => {
    try {
      if (!formData.email || !formData.full_name || !formData.role) {
        toast({
          title: "ข้อมูลไม่ครบ",
          description: "กรุณากรอกอีเมล, ชื่อ, และเลือกตำแหน่ง",
          variant: "destructive",
        })
        return
      }

      // Validate resident requires unit number
      if (formData.role === 'resident' && !formData.unit_number) {
        toast({
          title: "ข้อมูลไม่ครบ",
          description: "กรุณาระบุเลขห้องสำหรับลูกบ้าน",
          variant: "destructive",
        })
        return
      }

      if (!currentProjectId) {
        toast({
          title: "ไม่สามารถเพิ่มทีมงานได้",
          description: "กรุณาเลือกโครงการก่อน",
          variant: "destructive",
        })
        return
      }

      const result = await addTeamMember(
        currentUserId,
        currentProjectId,
        currentCompanyId,
        {
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role as 'staff' | 'engineer' | 'resident',
          unit_number: formData.unit_number
        }
      )

      if (result.success) {
        toast({
          title: "เพิ่มทีมงานสำเร็จ",
          description: "ทีมงานใหม่ถูกเพิ่มเรียบร้อยแล้ว",
        })
        setIsAddDialogOpen(false)
        setFormData({
          email: "",
          full_name: "",
          phone: "",
          role: "staff",
          unit_number: ""
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

  const handleEditMember = async () => {
    if (!selectedMember) return

    try {
      const result = await updateTeamMember(
        currentUserId,
        currentProjectId,
        selectedMember.id,
        {
          full_name: formData.full_name,
          phone: formData.phone,
          unit_number: formData.unit_number
        }
      )

      if (result.success) {
        toast({
          title: "แก้ไขสำเร็จ",
          description: "ข้อมูลทีมงานถูกแก้ไขเรียบร้อยแล้ว",
        })
        setIsEditDialogOpen(false)
        setSelectedMember(null)
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

  const handleDisableMember = async (memberId: string, memberName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะปิดใช้งาน account ของ ${memberName}?`)) {
      return
    }

    try {
      const result = await disableTeamMember(currentUserId, currentProjectId, memberId)

      if (result.success) {
        toast({
          title: "ปิดใช้งานสำเร็จ",
          description: "Account ถูกปิดใช้งานเรียบร้อยแล้ว",
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

  const handleResetPassword = async () => {
    if (!selectedMember) return

    try {
      if (!newPassword || newPassword.length < 6) {
        toast({
          title: "รหัสผ่านไม่ถูกต้อง",
          description: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
          variant: "destructive",
        })
        return
      }

      const result = await resetTeamMemberPassword(
        currentUserId,
        currentProjectId,
        selectedMember.id,
        newPassword
      )

      if (result.success) {
        toast({
          title: "รีเซตรหัสผ่านสำเร็จ",
          description: "รหัสผ่านใหม่ถูกตั้งเรียบร้อยแล้ว",
        })
        setIsResetPasswordDialogOpen(false)
        setSelectedMember(null)
        setNewPassword("")
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

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setFormData({
      email: member.email,
      full_name: member.full_name,
      phone: member.phone || "",
      role: member.role_name,
      unit_number: member.unit_number || ""
    })
    setIsEditDialogOpen(true)
  }

  const openResetPasswordDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setNewPassword("")
    setIsResetPasswordDialogOpen(true)
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      staff: 'bg-green-100 text-green-800',
      engineer: 'bg-purple-100 text-purple-800',
      resident: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || colors.resident
  }

  // Filter team
  const filteredTeam = team.filter(member => {
    const matchRole = filterRole === "all" || member.role_name === filterRole
    const matchSearch = !searchTerm || 
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.unit_number && member.unit_number.includes(searchTerm))
    
    return matchRole && matchSearch
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="จัดการทีมงาน" subtitle="จัดการทีมงานในโครงการ (Project Admin)" />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการทีมงาน"
        subtitle={`โครงการ: Demo Project • Role: ${currentUser.role}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              รีเฟรช
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  เพิ่มทีมงาน
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เพิ่มทีมงานใหม่</DialogTitle>
                  <DialogDescription>
                    เพิ่มพนักงานหรือลูกบ้านในโครงการ
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="role">ตำแหน่ง *</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData({ ...formData, role: value, unit_number: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">เจ้าหน้าที่ (Staff)</SelectItem>
                        <SelectItem value="engineer">ช่างซ่อม (Engineer)</SelectItem>
                        <SelectItem value="resident">ลูกบ้าน (Resident)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ ไม่สามารถเพิ่ม Admin roles ได้ในหน้านี้
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="email">อีเมล *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="full_name">ชื่อ-นามสกุล *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="นาย..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">เบอร์โทร</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="081-234-5678"
                    />
                  </div>

                  {formData.role === 'resident' && (
                    <div>
                      <Label htmlFor="unit_number">เลขห้อง *</Label>
                      <Input
                        id="unit_number"
                        value={formData.unit_number}
                        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                        placeholder="101"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleAddMember}>เพิ่มทีมงาน</Button>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ทีมงานทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              เจ้าหน้าที่
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.staff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ช่างซ่อม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.engineer}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ลูกบ้าน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.resident}</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการทีมงานในโครงการ</CardTitle>
          <CardDescription>
            จัดการทีมงานและลูกบ้านในโครงการ ({filteredTeam.length} คน)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="ค้นหาชื่อ, อีเมล, หรือเลขห้อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="staff">เจ้าหน้าที่</SelectItem>
                <SelectItem value="engineer">ช่างซ่อม</SelectItem>
                <SelectItem value="resident">ลูกบ้าน</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>เลขห้อง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeam.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {searchTerm || filterRole !== "all" 
                      ? "ไม่พบข้อมูลที่ค้นหา" 
                      : "ยังไม่มีทีมงานในโครงการ"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeam.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.role_name)}>
                        {member.role_display_name}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.unit_number || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "ใช้งาน" : "ปิด"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(member)}
                          title="แก้ไข"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openResetPasswordDialog(member)}
                          title="รีเซตรหัสผ่าน"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisableMember(member.id, member.full_name)}
                          title="ปิดใช้งาน"
                        >
                          <UserX className="w-4 h-4 text-red-500" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลทีมงาน</DialogTitle>
            <DialogDescription>
              แก้ไข: {selectedMember?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="edit-full-name">ชื่อ-นามสกุล</Label>
              <Input
                id="edit-full-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
            {formData.role === 'resident' && (
              <div>
                <Label htmlFor="edit-unit">เลขห้อง</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleEditMember}>บันทึก</Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รีเซตรหัสผ่าน</DialogTitle>
            <DialogDescription>
              รีเซตรหัสผ่านสำหรับ: {selectedMember?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleResetPassword}>รีเซตรหัสผ่าน</Button>
              <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
