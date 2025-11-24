"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { Users, UserPlus, RefreshCw, Edit, Trash2, Shield, Settings, Eye, Building2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { 
  getUserGroups,
  getUserGroupById,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  setUserGroupPermissions,
  addUserToGroup,
  removeUserFromGroup,
  bulkAddUsersToGroup,
  createPredefinedGroup
} from "@/lib/actions/user-group-actions"
import { getUsers } from "@/lib/actions/user-role-actions"
import { getCompanies } from "@/lib/actions/company-actions"
import { getProjects } from "@/lib/actions/project-actions"
import { getCurrentUserId, getCurrentUser } from "@/lib/utils/mock-auth"
import { useProjectContext } from "@/lib/contexts/project-context"
import { PermissionMatrix } from "@/components/permission-matrix"
import { GroupAssignmentDialog } from "@/components/group-assignment-dialog"
import { PREDEFINED_USER_GROUPS } from "@/lib/types/user-groups"

export default function UserGroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  // Note: selectedProjectId removed - using context instead
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [groupPermissions, setGroupPermissions] = useState<any[]>([])
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    company_id: ""
  })

  const currentUserId = getCurrentUserId()
  const currentUser = getCurrentUser()
  const { selectedProjectId, selectedProject, setSelectedProjectId } = useProjectContext()
  
  // Use context project ID
  const effectiveProjectId = selectedProjectId
  
  // Mock IDs - in production, get from context
  const demoCompanyId = "00000000-0000-0000-0000-000000000010"
  const demoProjectId = "00000000-0000-0000-0000-000000000020"

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersResult, companiesResult, projectsResult] = await Promise.all([
        getUsers(currentUserId),
        getCompanies(currentUserId),
        getProjects(currentUserId)
      ])

      if (usersResult.success) {
        let filteredUsers = usersResult.users || []
        
        // Filter by selected project (for non-Super Admin)
        if (effectiveProjectId && currentUser.role !== 'super_admin') {
          const { getUsersInProject } = await import('@/lib/actions/user-role-actions')
          const projectUsersResult = await getUsersInProject(currentUserId, effectiveProjectId)
          
          if (projectUsersResult.success && projectUsersResult.userIds) {
            const userIds: string[] = projectUsersResult.userIds
            filteredUsers = filteredUsers.filter(user => userIds.includes(user.id))
          }
        }
        
        setUsers(filteredUsers)
      }
      if (companiesResult.success) {
        setCompanies(companiesResult.companies || [])
      }
      if (projectsResult.success) {
        let projectsList = projectsResult.projects || []
        
        // Filter by context project for non-Super Admin
        if (selectedProjectId && currentUser.role !== 'super_admin') {
          projectsList = projectsList.filter(p => p.id === selectedProjectId)
        }
        
        setProjects(projectsList)
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

  const loadGroupsForProject = async (projectId: string) => {
    if (!projectId) return
    
    console.log('[UserGroups] Loading groups for project:', projectId)
    setLoading(true)
    try {
      const groupsResult = await getUserGroups(currentUserId, projectId, demoCompanyId)
      
      if (groupsResult.success) {
        console.log('[UserGroups] Groups loaded:', groupsResult.groups?.length)
        setGroups(groupsResult.groups || [])
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
  
  // Reload when selected project changes
  useEffect(() => {
    console.log('[UserGroups] Selected project changed:', selectedProjectId)
    if (selectedProjectId) {
      loadData()
      loadGroupsForProject(selectedProjectId)
    }
  }, [selectedProjectId])

  const handleCreateGroup = async () => {
    if (!selectedProjectId) {
      toast({
        title: "กรุณาเลือกโครงการ",
        description: "กรุณาเลือกโครงการก่อนสร้างกลุ่ม",
        variant: "destructive",
      })
      return
    }

    try {
      if (!formData.display_name) {
        toast({
          title: "ข้อมูลไม่ครบ",
          description: "กรุณากรอกชื่อกลุ่ม",
          variant: "destructive",
        })
        return
      }

      const result = await createUserGroup(currentUserId, {
        name: formData.name || formData.display_name.toLowerCase().replace(/\s+/g, '_'),
        display_name: formData.display_name,
        description: formData.description,
        company_id: demoCompanyId
      })

      if (result.success) {
        toast({
          title: "สร้างกลุ่มสำเร็จ",
          description: `กลุ่ม ${formData.display_name} ถูกสร้างแล้ว`,
        })
        setIsCreateDialogOpen(false)
        setFormData({ name: "", display_name: "", description: "", company_id: "" })
        loadGroupsForProject(selectedProjectId)
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

  const handleCreatePredefinedGroup = async (groupType: 'accountant' | 'committee' | 'auditor' | 'support_staff' | 'manager_group') => {
    if (!selectedProjectId) {
      toast({
        title: "กรุณาเลือกโครงการ",
        description: "กรุณาเลือกโครงการก่อนสร้างกลุ่ม",
        variant: "destructive",
      })
      return
    }

    try {
      // Get the predefined group configuration
      const config = PREDEFINED_USER_GROUPS[groupType.toUpperCase() as keyof typeof PREDEFINED_USER_GROUPS]
      
      if (!config) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: `ไม่พบการกำหนดค่าสำหรับกลุ่ม ${groupType}`,
          variant: "destructive",
        })
        return
      }

      // Convert modules to permissions format
      const permissions = Object.entries(config.modules).map(([module, perms]) => ({
        module,
        can_access: perms.view,
        can_view: perms.view,
        can_add: perms.add,
        can_edit: perms.edit,
        can_delete: perms.delete,
        can_print: perms.print,
        can_export: perms.export,
        can_approve: false,
        can_assign: false
      }))

      const result = await createPredefinedGroup(
        currentUserId, 
        {
          name: config.name,
          display_name: config.display_name,
          description: config.description,
          role_name: config.baseRole,
          permissions
        },
        demoCompanyId,
        selectedProjectId
      )

      if (result.success) {
        toast({
          title: "สร้างกลุ่มสำเร็จ",
          description: `กลุ่ม "${config.display_name}" พร้อมสิทธิ์เริ่มต้นถูกสร้างแล้ว`,
        })
        loadGroupsForProject(selectedProjectId)
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

  const handleEditGroup = async () => {
    if (!selectedGroup) return

    try {
      const result = await updateUserGroup(currentUserId, selectedGroup.id, {
        display_name: formData.display_name,
        description: formData.description
      })

      if (result.success) {
        toast({
          title: "แก้ไขสำเร็จ",
          description: "ข้อมูลกลุ่มถูกแก้ไขแล้ว",
        })
        setIsEditDialogOpen(false)
        setSelectedGroup(null)
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

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบกลุ่ม "${groupName}"?`)) {
      return
    }

    try {
      const result = await deleteUserGroup(currentUserId, groupId)

      if (result.success) {
        toast({
          title: "ลบสำเร็จ",
          description: `กลุ่ม ${groupName} ถูกลบแล้ว`,
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

  const openEditDialog = (group: any) => {
    setSelectedGroup(group)
    setFormData({
      name: group.name,
      display_name: group.display_name,
      description: group.description || "",
      company_id: group.company_id || ""
    })
    setIsEditDialogOpen(true)
  }

  const openPermissionsDialog = async (group: any) => {
    setSelectedGroup(group)
    
    const result = await getUserGroupById(currentUserId, group.id, selectedProjectId)
    if (result.success) {
      setGroupPermissions(result.permissions || [])
      setIsPermissionsDialogOpen(true)
    } else {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const openAssignmentDialog = async (group: any) => {
    setSelectedGroup(group)
    
    const result = await getUserGroupById(currentUserId, group.id, selectedProjectId)
    if (result.success) {
      setGroupMembers(result.members || [])
      setIsAssignmentDialogOpen(true)
    } else {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedGroup) {
      console.error('No group selected')
      return
    }

    console.log('Saving permissions for group:', selectedGroup.id)
    console.log('Permissions to save:', groupPermissions)

    try {
      // Filter only permissions with can_access = true
      const permissionsToSave = groupPermissions.filter(p => p.can_access)
      
      console.log('Filtered permissions (can_access=true):', permissionsToSave)

      if (permissionsToSave.length === 0) {
        toast({
          title: "ไม่มีสิทธิ์ที่จะบันทึก",
          description: "กรุณาเลือกอย่างน้อย 1 โมดูล",
          variant: "destructive",
        })
        return
      }

      const result = await setUserGroupPermissions(currentUserId, selectedGroup.id, permissionsToSave, selectedProjectId)

      console.log('Save result:', result)

      if (result.success) {
        toast({
          title: "บันทึกสำเร็จ",
          description: `บันทึก ${permissionsToSave.length} โมดูลสำเร็จ`,
        })
        setIsPermissionsDialogOpen(false)
        setSelectedGroup(null)
        loadGroupsForProject(selectedProjectId)
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถบันทึกได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Exception saving permissions:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Keyboard shortcut for save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPermissionsDialogOpen && e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSavePermissions()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPermissionsDialogOpen, selectedGroup, groupPermissions])

  const handleAssignUsers = async (userIds: string[]) => {
    if (!selectedGroup) return

    const result = await bulkAddUsersToGroup(currentUserId, selectedGroup.id, userIds)
    if (!result.success) {
      throw new Error(result.error)
    }
    
    // Refresh members
    const groupResult = await getUserGroupById(currentUserId, selectedGroup.id)
    if (groupResult.success) {
      setGroupMembers(groupResult.members || [])
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!selectedGroup) return

    const result = await removeUserFromGroup(currentUserId, selectedGroup.id, userId)
    if (!result.success) {
      throw new Error(result.error)
    }
    
    // Refresh members
    const groupResult = await getUserGroupById(currentUserId, selectedGroup.id)
    if (groupResult.success) {
      setGroupMembers(groupResult.members || [])
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="กลุ่มผู้ใช้งาน" subtitle="จัดการกลุ่มผู้ใช้และสิทธิ์" />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="กลุ่มผู้ใช้งาน"
        subtitle={selectedProject ? `โครงการ: ${selectedProject.name}` : "จัดการกลุ่มผู้ใช้และกำหนดสิทธิ์แบบกลุ่ม"}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              รีเฟรช
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  สร้างกลุ่มใหม่
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>สร้างกลุ่มผู้ใช้งานใหม่</DialogTitle>
                  <DialogDescription>
                    สร้างกลุ่มผู้ใช้งานและกำหนดสิทธิ์
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="display_name">ชื่อกลุ่ม *</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="เช่น เจ้าหน้าที่บัญชี"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">คำอธิบาย</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="บทบาทและหน้าที่ของกลุ่มนี้"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateGroup}>สร้างกลุ่ม</Button>
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

      {/* Info Card - Current Project */}
      {selectedProject && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">{selectedProject.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedProject.company?.name} • {selectedProject.total_units} ยูนิต • {selectedProject.project_type}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedProjectId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              กรุณาเลือกโครงการเพื่อดูกลุ่มผู้ใช้งาน
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="groups" className="space-y-4">
          <TabsList>
            <TabsTrigger value="groups">กลุ่มในโครงการนี้ ({groups.length})</TabsTrigger>
            <TabsTrigger value="templates">กลุ่มแนะนำ</TabsTrigger>
          </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>รายการกลุ่มผู้ใช้งาน</CardTitle>
              <CardDescription>
                จัดการกลุ่มและสิทธิ์การเข้าถึงโมดูลต่างๆ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อกลุ่ม</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-center">สมาชิก</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        ยังไม่มีกลุ่มผู้ใช้งาน
                      </TableCell>
                    </TableRow>
                  ) : (
                    groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{group.display_name}</div>
                            <div className="text-xs text-muted-foreground">{group.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-md">
                            {group.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{group.member_count || 0} คน</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAssignmentDialog(group)}
                              title="จัดการสมาชิก"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPermissionsDialog(group)}
                              title="กำหนดสิทธิ์"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(group)}
                              title="แก้ไข"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id, group.display_name)}
                              title="ลบ"
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(PREDEFINED_USER_GROUPS).map(([key, config]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {config.display_name}
                    <Badge variant="outline" className={`bg-${config.color}-100`}>
                      {Object.keys(config.modules).length} โมดูล
                    </Badge>
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Base Role:</div>
                      <Badge>{config.baseRole}</Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">โมดูลที่เข้าถึงได้:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(config.modules).slice(0, 5).map(module => (
                          <Badge key={module} variant="secondary" className="text-xs">
                            {module}
                          </Badge>
                        ))}
                        {Object.keys(config.modules).length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{Object.keys(config.modules).length - 5} อื่นๆ
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleCreatePredefinedGroup(key.toLowerCase() as any)}
                    >
                      สร้างกลุ่มนี้
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        </Tabs>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขกลุ่มผู้ใช้งาน</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลกลุ่ม: {selectedGroup?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="edit-display-name">ชื่อกลุ่ม</Label>
              <Input
                id="edit-display-name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">คำอธิบาย</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEditGroup}>บันทึก</Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog - Full Screen */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 gap-0 m-0 rounded-none">
          <DialogHeader className="p-4 pb-3 border-b sticky top-0 bg-background z-20 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl">กำหนดสิทธิ์กลุ่ม: {selectedGroup?.display_name}</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  เลือกโมดูลและสิทธิ์ • คลิกหมวดหมู่เพื่อขยาย/ย่อ • กด Ctrl+S เพื่อบันทึก
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSavePermissions}
                  size="lg"
                  className="min-w-[160px]"
                >
                  💾 บันทึกสิทธิ์
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setIsPermissionsDialogOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsPermissionsDialogOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 p-3 bg-muted/20">
            <PermissionMatrix
              permissions={groupPermissions}
              onChange={setGroupPermissions}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      {selectedGroup && (
        <GroupAssignmentDialog
          isOpen={isAssignmentDialogOpen}
          onClose={() => setIsAssignmentDialogOpen(false)}
          groupId={selectedGroup.id}
          groupName={selectedGroup.display_name}
          currentMembers={groupMembers}
          availableUsers={users}
          onAssign={handleAssignUsers}
          onRemove={handleRemoveUser}
        />
      )}
    </div>
  )
}
