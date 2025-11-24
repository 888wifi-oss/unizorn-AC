"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/page-header"
import { Users, Plus, RefreshCw, Edit, Trash2, Shield, UserPlus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { User, Role, Company, Project } from "@/lib/types/permissions"
import { 
  getUsers, 
  getUserRoles,
  getRoles,
  createUser, 
  updateUser,
  assignRole,
  removeRole
} from "@/lib/actions/user-role-actions"
import { getCompanies } from "@/lib/actions/company-actions"
import { getProjects } from "@/lib/actions/project-actions"
import { getCurrentUserId, getCurrentUser } from "@/lib/utils/mock-auth"
import { useProjectContext } from "@/lib/contexts/project-context"

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userRoles, setUserRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false)
  const [isViewRolesDialogOpen, setIsViewRolesDialogOpen] = useState(false)
  const [userFormData, setUserFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: ""
  })
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null)
  const [newPassword, setNewPassword] = useState("")
  const [roleFormData, setRoleFormData] = useState({
    role_id: "",
    company_id: "all",
    project_ids: [] as string[] // Changed to array for multi-select
  })

  // Get current user ID from mock auth
  const currentUserId = getCurrentUserId()
  const currentUser = getCurrentUser()
  const { selectedProjectId, selectedProject } = useProjectContext()

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersResult, rolesResult, companiesResult, projectsResult] = await Promise.all([
        getUsers(currentUserId),
        getRoles(),
        getCompanies(currentUserId),
        getProjects(currentUserId)
      ])

      if (usersResult.success) {
        let filteredUsers = usersResult.users || []
        console.log('[UserManagement] Users from DB:', filteredUsers.length)
        console.log('[UserManagement] Current role:', currentUser.role)
        console.log('[UserManagement] Selected project:', selectedProjectId)
        
        // Filter by selected project (for non-Super Admin)
        if (selectedProjectId && currentUser.role !== 'super_admin') {
          console.log('[UserManagement] Filtering users for project:', selectedProjectId)
          
          const { getUsersInProject } = await import('@/lib/actions/user-role-actions')
          const projectUsersResult = await getUsersInProject(currentUserId, selectedProjectId)
          
          console.log('[UserManagement] Project users result:', projectUsersResult)
          
          if (projectUsersResult.success && projectUsersResult.userIds) {
            const userIds: string[] = projectUsersResult.userIds
            const beforeFilter = filteredUsers.length
            filteredUsers = filteredUsers.filter(user => 
              userIds.includes(user.id)
            )
            console.log('[UserManagement] Filtered:', beforeFilter, '→', filteredUsers.length)
          }
        } else {
          console.log('[UserManagement] No filtering (Super Admin or no project selected)')
        }
        
        setUsers(filteredUsers)
        console.log('[UserManagement] Final users set:', filteredUsers.length)
      }
      
      if (rolesResult.success) {
        const allRoles = rolesResult.roles || []
        setRoles(allRoles)
        
        // Filter available roles based on current user
        // Only Super Admin can assign Super Admin role
        const isSuperAdmin = currentUser.role === 'super_admin'
        const filteredRoles = isSuperAdmin 
          ? allRoles 
          : allRoles.filter(role => role.name !== 'super_admin')
        
        setAvailableRoles(filteredRoles)
      }
      
      if (companiesResult.success) {
        let filteredCompanies = companiesResult.companies || []
        
        // Filter by selected project's company
        if (selectedProject && currentUser.role !== 'super_admin') {
          filteredCompanies = filteredCompanies.filter(c => 
            c.id === selectedProject.company_id
          )
        }
        
        setCompanies(filteredCompanies)
      }
      
      if (projectsResult.success) {
        let filteredProjects = projectsResult.projects || []
        
        // Filter to show only selected project (for non-Super Admin)
        if (selectedProjectId && currentUser.role !== 'super_admin') {
          filteredProjects = filteredProjects.filter(p => p.id === selectedProjectId)
        }
        
        setProjects(filteredProjects)
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
    console.log('[UserManagement] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedProjectId]) // Reload when project changes

  const handleCreateUser = async () => {
    try {
      if (!userFormData.email || !userFormData.full_name || !userFormData.password) {
        toast({
          title: "ข้อมูลไม่ครบ",
          description: "กรุณากรอกอีเมล, ชื่อ และรหัสผ่าน",
          variant: "destructive",
        })
        return
      }

      const result = await createUser(currentUserId, {
        ...userFormData,
        is_active: true
      })

      if (result.success) {
        toast({
          title: "สร้างผู้ใช้สำเร็จ",
          description: "ผู้ใช้ใหม่ถูกสร้างเรียบร้อยแล้ว",
        })
        setIsCreateUserDialogOpen(false)
        setUserFormData({ email: "", full_name: "", phone: "", password: "" })
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
    try {
      if (!newPassword) {
        toast({
          title: "กรุณากรอกรหัสผ่านใหม่",
          variant: "destructive",
        })
        return
      }

      const { resetUserPassword } = await import('@/lib/actions/user-role-actions')
      const result = await resetUserPassword(currentUserId, selectedUserForReset.id, newPassword)

      if (result.success) {
        toast({
          title: "รีเซ็ตรหัสผ่านสำเร็จ",
          description: `รหัสผ่านของ ${selectedUserForReset.full_name} ถูกรีเซ็ตแล้ว`,
        })
        setIsResetPasswordDialogOpen(false)
        setNewPassword("")
        setSelectedUserForReset(null)
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

  const handleOpenAssignRoleDialog = async (user: User) => {
    setSelectedUser(user)
    
    // Load existing user roles to pre-populate the form
    try {
      const result = await getUserRoles(currentUserId, user.id)
      if (result.success) {
        setUserRoles(result.userRoles || [])
        
        if (result.userRoles && result.userRoles.length > 0) {
          // Get the first active role to pre-populate
          const firstRole = result.userRoles.find((ur: any) => ur.is_active)
          if (firstRole) {
            setRoleFormData({
              role_id: firstRole.role_id,
              company_id: firstRole.company_id || "all",
              project_ids: firstRole.project_id ? [firstRole.project_id] : []
            })
          }
        } else {
          // Reset form if no existing roles
          setRoleFormData({ role_id: "", company_id: "all", project_ids: [] })
        }
      } else {
        setUserRoles([])
        setRoleFormData({ role_id: "", company_id: "all", project_ids: [] })
      }
    } catch (error) {
      console.error('Error loading user roles:', error)
      setUserRoles([])
      setRoleFormData({ role_id: "", company_id: "all", project_ids: [] })
    }
    
    setIsAssignRoleDialogOpen(true)
  }

  const handleAssignRole = async () => {
    if (!selectedUser) return

    try {
      if (!roleFormData.role_id) {
        toast({
          title: "ข้อมูลไม่ครบ",
          description: "กรุณาเลือก Role",
          variant: "destructive",
        })
        return
      }

      // If no projects selected or "all" company, assign role once without project
      if (roleFormData.project_ids.length === 0 || roleFormData.company_id === "all") {
        const result = await assignRole(
          currentUserId,
          selectedUser.id,
          roleFormData.role_id,
          roleFormData.company_id !== "all" ? roleFormData.company_id : undefined,
          undefined
        )

        if (result.success) {
          toast({
            title: "มอบหมาย Role สำเร็จ",
            description: "Role ถูกมอบหมายให้ผู้ใช้เรียบร้อยแล้ว",
          })
          setIsAssignRoleDialogOpen(false)
          setRoleFormData({ role_id: "", company_id: "all", project_ids: [] })
          loadData()
        } else {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: result.error,
            variant: "destructive",
          })
        }
        return
      }

      // Assign role for each selected project
      let successCount = 0
      let failCount = 0

      for (const projectId of roleFormData.project_ids) {
        const result = await assignRole(
          currentUserId,
          selectedUser.id,
          roleFormData.role_id,
          roleFormData.company_id !== "all" ? roleFormData.company_id : undefined,
          projectId
        )

        if (result.success) {
          successCount++
        } else {
          failCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: "มอบหมาย Role สำเร็จ",
          description: `มอบหมายสำเร็จ ${successCount} โครงการ${failCount > 0 ? ` (ล้มเหลว ${failCount} โครงการ)` : ''}`,
        })
        setIsAssignRoleDialogOpen(false)
        setRoleFormData({ role_id: "", company_id: "all", project_ids: [] })
        loadData()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถมอบหมาย Role ให้โครงการใดได้",
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

  const handleViewRoles = async (user: User) => {
    setSelectedUser(user)
    try {
      const result = await getUserRoles(currentUserId, user.id)
      if (result.success) {
        setUserRoles(result.userRoles || [])
        setIsViewRolesDialogOpen(true)
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRemoveRole = async (userRoleId: string) => {
    try {
      const result = await removeRole(currentUserId, userRoleId)
      if (result.success) {
        toast({
          title: "ลบ Role สำเร็จ",
          description: "Role ถูกลบเรียบร้อยแล้ว",
        })
        if (selectedUser) {
          handleViewRoles(selectedUser)
        }
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (level: number) => {
    const colors: Record<number, string> = {
      0: 'bg-red-100 text-red-800',
      1: 'bg-orange-100 text-orange-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-gray-100 text-gray-800'
    }
    return colors[level] || colors[4]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="จัดการผู้ใช้และสิทธิ์" subtitle="ระบบจัดการผู้ใช้และสิทธิ์การเข้าถึง" />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการผู้ใช้และสิทธิ์"
        subtitle="ระบบจัดการผู้ใช้และสิทธิ์การเข้าถึง"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              รีเฟรช
            </Button>
            <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มผู้ใช้
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
                  <DialogDescription>สร้างผู้ใช้ใหม่ในระบบ</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="email">อีเมล *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">ชื่อ-นามสกุล *</Label>
                    <Input
                      id="full_name"
                      value={userFormData.full_name}
                      onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                      placeholder="นาย..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">เบอร์โทร</Label>
                    <Input
                      id="phone"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                      placeholder="081-234-5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">รหัสผ่าน *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      รหัสผ่านสำหรับเข้าสู่ระบบ (ควรมีความยาวอย่างน้อย 8 ตัวอักษร)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateUser}>สร้างผู้ใช้</Button>
                    <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">ผู้ใช้ ({users.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>รายการผู้ใช้ทั้งหมด</CardTitle>
              <CardDescription>จัดการผู้ใช้และมอบหมาย Roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>เบอร์โทร</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        ไม่มีข้อมูลผู้ใช้
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "ใช้งาน" : "ระงับ"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.last_login_at 
                            ? new Date(user.last_login_at).toLocaleDateString('th-TH')
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRoles(user)}
                              title="ดู Roles"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                                onClick={() => handleOpenAssignRoleDialog(user)}
                              title="มอบหมาย Role"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserForReset(user)
                                setIsResetPasswordDialogOpen(true)
                              }}
                              title="รีเซ็ตรหัสผ่าน"
                            >
                              <Edit className="w-4 h-4" />
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
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles ในระบบ</CardTitle>
              <CardDescription>รายการ Roles และสิทธิ์การเข้าถึง</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <h4 className="font-medium">{role.display_name}</h4>
                        <Badge className={getRoleBadgeColor(role.level)}>
                          Level {role.level}
                        </Badge>
                        {role.is_system && (
                          <Badge variant="outline">System</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Role Dialog */}
      <Dialog open={isAssignRoleDialogOpen} onOpenChange={setIsAssignRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>มอบหมาย Role</DialogTitle>
            <DialogDescription>
              มอบหมาย Role ให้ผู้ใช้: {selectedUser?.full_name}
              {userRoles.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <strong>Roles ปัจจุบัน:</strong>
                  <div className="mt-1 space-y-1">
                    {userRoles.map((userRole) => (
                      <div key={userRole.id} className="text-xs">
                        • {userRole.role?.display_name}
                        {userRole.company?.name && ` (${userRole.company.name})`}
                        {userRole.project?.name && ` - ${userRole.project.name}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={roleFormData.role_id} 
                onValueChange={(value) => setRoleFormData({ ...roleFormData, role_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือก Role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.display_name} (Level {role.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentUser.role !== 'super_admin' && (
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Super Admin role สามารถมอบหมายได้โดย Super Admin เท่านั้น
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="company">บริษัท (ไม่บังคับ)</Label>
              <Select 
                value={roleFormData.company_id || "all"} 
                onValueChange={(value) => setRoleFormData({ ...roleFormData, company_id: value === "all" ? "" : value, project_ids: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบริษัท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {roleFormData.company_id && roleFormData.company_id !== "all" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label>โครงการ (ไม่บังคับ - เลือกได้หลายโครงการ)</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const allProjectIds = projects
                          .filter(p => p.company_id === roleFormData.company_id)
                          .map(p => p.id)
                        setRoleFormData({ ...roleFormData, project_ids: allProjectIds })
                      }}
                    >
                      เลือกทั้งหมด
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRoleFormData({ ...roleFormData, project_ids: [] })}
                    >
                      ยกเลิกทั้งหมด
                    </Button>
                  </div>
                </div>
                <Card className="mt-2">
                  <ScrollArea className="h-[200px]">
                    <div className="p-4 space-y-3">
                      {projects
                        .filter(p => p.company_id === roleFormData.company_id)
                        .map((project) => (
                          <div key={project.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={`project-${project.id}`}
                              checked={roleFormData.project_ids.includes(project.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setRoleFormData({
                                    ...roleFormData,
                                    project_ids: [...roleFormData.project_ids, project.id]
                                  })
                                } else {
                                  setRoleFormData({
                                    ...roleFormData,
                                    project_ids: roleFormData.project_ids.filter(id => id !== project.id)
                                  })
                                }
                              }}
                            />
                            <label
                              htmlFor={`project-${project.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {project.name}
                              <p className="text-xs text-muted-foreground mt-1">
                                {project.project_type} • {project.total_units} ยูนิต
                              </p>
                            </label>
                          </div>
                        ))}
                      {projects.filter(p => p.company_id === roleFormData.company_id).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          ไม่มีโครงการในบริษัทนี้
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
                {roleFormData.project_ids.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ✅ เลือกแล้ว {roleFormData.project_ids.length} โครงการ
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAssignRole}>มอบหมาย</Button>
              <Button variant="outline" onClick={() => setIsAssignRoleDialogOpen(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Roles Dialog */}
      <Dialog open={isViewRolesDialogOpen} onOpenChange={setIsViewRolesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roles ของผู้ใช้</DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {userRoles.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                ผู้ใช้ยังไม่มี Role
              </div>
            ) : (
              userRoles.map((userRole) => (
                <div key={userRole.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{userRole.role?.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {userRole.company?.name && `บริษัท: ${userRole.company.name}`}
                      {userRole.project?.name && ` / โครงการ: ${userRole.project.name}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRole(userRole.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
            <DialogDescription>
              กำหนดรหัสผ่านใหม่สำหรับ {selectedUserForReset?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="new_password">รหัสผ่านใหม่ *</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground mt-1">
                รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-900 dark:text-amber-200">
                ⚠️ <strong>คำเตือน:</strong> ผู้ใช้จะต้องใช้รหัสผ่านใหม่นี้ในการเข้าสู่ระบบครั้งถัดไป
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleResetPassword}>รีเซ็ตรหัสผ่าน</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsResetPasswordDialogOpen(false)
                  setNewPassword("")
                  setSelectedUserForReset(null)
                }}
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
