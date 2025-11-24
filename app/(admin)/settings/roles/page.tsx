"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Save, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Permission, Role } from "@/lib/types/permissions"
import {
    getPermissions,
    getRolesWithPermissions,
    updateRolePermissions
} from "@/lib/actions/role-permission-actions"

interface RoleWithPermissions extends Role {
    permissions: Permission[]
}

export default function RolePermissionsPage() {
    const [roles, setRoles] = useState<RoleWithPermissions[]>([])
    const [allPermissions, setAllPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [permissionChanges, setPermissionChanges] = useState<Record<string, Set<string>>>({})
    const { toast } = useToast()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [permissionsResult, rolesResult] = await Promise.all([
                getPermissions(),
                getRolesWithPermissions()
            ])

            if (permissionsResult.success) {
                setAllPermissions(permissionsResult.permissions || [])
            }

            if (rolesResult.success) {
                setRoles(rolesResult.roles || [])

                // Initialize permission changes with current state
                const initialChanges: Record<string, Set<string>> = {}
                rolesResult.roles?.forEach(role => {
                    initialChanges[role.id] = new Set(role.permissions.map(p => p.id))
                })
                setPermissionChanges(initialChanges)
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

    const togglePermission = (roleId: string, permissionId: string) => {
        setPermissionChanges(prev => {
            const newChanges = { ...prev }
            if (!newChanges[roleId]) {
                newChanges[roleId] = new Set()
            }

            const rolePermissions = new Set(newChanges[roleId])
            if (rolePermissions.has(permissionId)) {
                rolePermissions.delete(permissionId)
            } else {
                rolePermissions.add(permissionId)
            }

            newChanges[roleId] = rolePermissions
            return newChanges
        })
    }

    const hasPermission = (roleId: string, permissionId: string): boolean => {
        return permissionChanges[roleId]?.has(permissionId) || false
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            let successCount = 0
            let failCount = 0

            for (const [roleId, permissionIds] of Object.entries(permissionChanges)) {
                const result = await updateRolePermissions(roleId, Array.from(permissionIds))
                if (result.success) {
                    successCount++
                } else {
                    failCount++
                }
            }

            if (successCount > 0) {
                toast({
                    title: "บันทึกสำเร็จ",
                    description: `อัปเดตสิทธิ์สำเร็จ ${successCount} Role${failCount > 0 ? ` (ล้มเหลว ${failCount} Role)` : ''}`,
                })
                loadData()
            } else {
                toast({
                    title: "เกิดข้อผิดพลาด",
                    description: "ไม่สามารถบันทึกการเปลี่ยนแปลงได้",
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
            setSaving(false)
        }
    }

    // Group permissions by module
    const groupedPermissions = allPermissions.reduce((acc, permission) => {
        if (!acc[permission.module]) {
            acc[permission.module] = []
        }
        acc[permission.module].push(permission)
        return acc
    }, {} as Record<string, Permission[]>)

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

    const getActionBadgeColor = (action: string) => {
        const colors: Record<string, string> = {
            'view': 'bg-blue-50 text-blue-700 border-blue-200',
            'create': 'bg-green-50 text-green-700 border-green-200',
            'update': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'delete': 'bg-red-50 text-red-700 border-red-200',
            'manage': 'bg-purple-50 text-purple-700 border-purple-200',
            'import': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'export': 'bg-cyan-50 text-cyan-700 border-cyan-200',
            'approve': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
        return colors[action] || 'bg-gray-50 text-gray-700 border-gray-200'
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="จัดการสิทธิ์ (Roles & Permissions)" subtitle="กำหนดสิทธิ์การเข้าถึงสำหรับแต่ละ Role" />
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="จัดการสิทธิ์ (Roles & Permissions)"
                subtitle="กำหนดสิทธิ์การเข้าถึงสำหรับแต่ละ Role"
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadData} disabled={saving}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            รีเฟรช
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                        </Button>
                    </div>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle>Permission Matrix</CardTitle>
                    <CardDescription>
                        ติ๊กเลือกเพื่อกำหนดสิทธิ์ให้กับแต่ละ Role (แถว = Role, คอลัมน์ = Permission)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {Object.entries(groupedPermissions).map(([module, permissions]) => (
                            <div key={module} className="space-y-3">
                                <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    {module}
                                </h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[200px]">Role</TableHead>
                                                {permissions.map(permission => (
                                                    <TableHead key={permission.id} className="text-center">
                                                        <Badge
                                                            variant="outline"
                                                            className={`${getActionBadgeColor(permission.action)} text-xs`}
                                                        >
                                                            {permission.action}
                                                        </Badge>
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {roles.map(role => (
                                                <TableRow key={role.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <span>{role.display_name}</span>
                                                            <Badge className={getRoleBadgeColor(role.level)}>
                                                                L{role.level}
                                                            </Badge>
                                                            {role.is_system && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    System
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    {permissions.map(permission => (
                                                        <TableCell key={permission.id} className="text-center">
                                                            <Checkbox
                                                                checked={hasPermission(role.id, permission.id)}
                                                                onCheckedChange={() => togglePermission(role.id, permission.id)}
                                                                disabled={role.is_system && role.level === 0} // Disable for Super Admin
                                                            />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {roles.some(role => role.is_system && role.level === 0) && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <p className="text-sm text-yellow-800">
                            <strong>หมายเหตุ:</strong> Super Admin (Level 0) มีสิทธิ์เข้าถึงทุกอย่างโดยอัตโนมัติ และไม่สามารถแก้ไขได้
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
