"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ModulePermission {
  module: string
  displayName: string
  can_access: boolean
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
  can_print: boolean
  can_import: boolean
  can_export: boolean
  can_approve?: boolean
  can_assign?: boolean
}

interface PermissionMatrixProps {
  permissions: ModulePermission[]
  onChange: (permissions: ModulePermission[]) => void
  readOnly?: boolean
}

const ALL_MODULES = [
  { key: 'dashboard', name: 'แดชบอร์ด', category: 'หลัก' },
  { key: 'units', name: 'ห้องชุด', category: 'หลัก' },
  { key: 'team_management', name: 'จัดการทีมงาน', category: 'หลัก' },
  { key: 'announcements', name: 'ประกาศ', category: 'หลัก' },
  { key: 'maintenance', name: 'งานแจ้งซ่อม', category: 'หลัก' },
  { key: 'resident_accounts', name: 'บัญชีลูกบ้าน', category: 'หลัก' },
  { key: 'notifications', name: 'การแจ้งเตือน', category: 'หลัก' },
  { key: 'parcels', name: 'พัสดุ', category: 'หลัก' },
  { key: 'parcel_reports', name: 'รายงานพัสดุ', category: 'หลัก' },
  { key: 'files', name: 'เอกสารและไฟล์', category: 'หลัก' },

  { key: 'billing', name: 'ออกบิล', category: 'รายรับ' },
  { key: 'payments', name: 'การชำระเงิน', category: 'รายรับ' },
  { key: 'revenue', name: 'บันทึกรายรับ', category: 'รายรับ' },
  { key: 'revenue_journal', name: 'สมุดรายวันรับ', category: 'รายรับ' },
  { key: 'revenue_reports', name: 'รายงานรายรับ', category: 'รายรับ' },
  { key: 'revenue_budget', name: 'งบประมาณรายรับ', category: 'รายรับ' },
  { key: 'accounts_receivable', name: 'ลูกหนี้ค้างชำระ (AR)', category: 'รายรับ' },

  { key: 'expenses', name: 'บันทึกรายจ่าย', category: 'รายจ่าย' },
  { key: 'expense_approval', name: 'อนุมัติรายจ่าย', category: 'รายจ่าย' },
  { key: 'expense_reports', name: 'รายงานรายจ่าย', category: 'รายจ่าย' },
  { key: 'expense_budget', name: 'งบประมาณรายจ่าย', category: 'รายจ่าย' },
  { key: 'vendors', name: 'รายชื่อผู้ขาย', category: 'รายจ่าย' },
  { key: 'accounts_payable', name: 'เจ้าหนี้การค้า (AP)', category: 'รายจ่าย' },

  { key: 'chart_of_accounts', name: 'ผังบัญชี', category: 'บัญชี' },
  { key: 'fixed_assets', name: 'ทะเบียนทรัพย์สิน', category: 'บัญชี' },
  { key: 'depreciation', name: 'คำนวณค่าเสื่อมราคา', category: 'บัญชี' },
  { key: 'journal_vouchers', name: 'สมุดรายวัน', category: 'บัญชี' },
  { key: 'general_ledger', name: 'สมุดบัญชีแยกประเภท', category: 'บัญชี' },
  { key: 'trial_balance', name: 'งบทดลอง', category: 'บัญชี' },
  { key: 'financial_statements', name: 'รายงานทางการเงิน', category: 'บัญชี' },

  { key: 'reports', name: 'รายงาน', category: 'รายงาน' },
  { key: 'analytics', name: 'การวิเคราะห์ข้อมูล', category: 'รายงาน' },
  { key: 'advanced_analytics', name: 'การวิเคราะห์ขั้นสูง', category: 'รายงาน' },
  { key: 'budget_report', name: 'รายงานงบประมาณ', category: 'รายงาน' },

  { key: 'automation', name: 'ระบบอัตโนมัติ', category: 'ตั้งค่า' },
  { key: 'theme_settings', name: 'การตั้งค่าธีม', category: 'ตั้งค่า' },
  { key: 'user_management', name: 'จัดการผู้ใช้', category: 'ตั้งค่า' },
  { key: 'performance', name: 'ประสิทธิภาพระบบ', category: 'ตั้งค่า' },
  { key: 'api', name: 'จัดการ API', category: 'ระบบ' },
  { key: 'companies', name: 'จัดการบริษัท', category: 'ระบบ' },
  { key: 'projects', name: 'จัดการโครงการ', category: 'ระบบ' },
  { key: 'users', name: 'จัดการผู้ใช้และสิทธิ์', category: 'ระบบ' },
  { key: 'user_groups', name: 'กลุ่มผู้ใช้งาน', category: 'ระบบ' }
]

export function PermissionMatrix({ permissions, onChange, readOnly = false }: PermissionMatrixProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['หลัก', 'รายรับ', 'รายจ่าย', 'บัญชี', 'รายงาน', 'ตั้งค่า', 'ระบบ'])
  const [viewMode, setViewMode] = useState<'compact' | 'full'>('compact')

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const expandAll = () => {
    const allCategories = Array.from(new Set(ALL_MODULES.map(m => m.category)))
    setExpandedCategories(allCategories)
  }

  const collapseAll = () => {
    setExpandedCategories([])
  }

  const getPermission = (moduleKey: string): ModulePermission => {
    const existing = permissions.find(p => p.module === moduleKey)
    if (existing) return existing

    const module = ALL_MODULES.find(m => m.key === moduleKey)
    return {
      module: moduleKey,
      displayName: module?.name || moduleKey,
      can_access: false,
      can_view: false,
      can_add: false,
      can_edit: false,
      can_delete: false,
      can_print: false,
      can_import: false,
      can_export: false,
      can_approve: false,
      can_assign: false
    }
  }

  const updatePermission = (moduleKey: string, field: keyof ModulePermission, value: boolean) => {
    if (readOnly) return

    const updatedPermissions = permissions.map(p =>
      p.module === moduleKey ? { ...p, [field]: value } : p
    )

    const exists = permissions.some(p => p.module === moduleKey)
    if (!exists) {
      const module = ALL_MODULES.find(m => m.key === moduleKey)
      updatedPermissions.push({
        module: moduleKey,
        displayName: module?.name || moduleKey,
        can_access: field === 'can_access' ? value : false,
        can_view: field === 'can_view' ? value : false,
        can_add: field === 'can_add' ? value : false,
        can_edit: field === 'can_edit' ? value : false,
        can_delete: field === 'can_delete' ? value : false,
        can_print: field === 'can_print' ? value : false,
        can_import: field === 'can_import' ? value : false,
        can_export: field === 'can_export' ? value : false,
        can_approve: field === 'can_approve' ? value : false,
        can_assign: field === 'can_assign' ? value : false
      })
    }

    onChange(updatedPermissions)
  }

  const toggleAllPermissions = (moduleKey: string, enable: boolean) => {
    if (readOnly) return

    const module = ALL_MODULES.find(m => m.key === moduleKey)
    const updatedPermissions = permissions.filter(p => p.module !== moduleKey)

    if (enable) {
      updatedPermissions.push({
        module: moduleKey,
        displayName: module?.name || moduleKey,
        can_access: true,
        can_view: true,
        can_add: true,
        can_edit: true,
        can_delete: false,
        can_print: true,
        can_import: false,
        can_export: true,
        can_approve: false,
        can_assign: false
      })
    }

    onChange(updatedPermissions)
  }

  const categories = Array.from(new Set(ALL_MODULES.map(m => m.category)))

  // Count enabled modules
  const enabledModulesCount = ALL_MODULES.filter(m => {
    const perm = getPermission(m.key)
    return perm.can_access
  }).length

  return (
    <div className="space-y-2">
      <Card className="border border-blue-200 bg-blue-50/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">สรุป:</span>
              <Badge variant="default" className="px-3 py-1">
                {enabledModulesCount} / {ALL_MODULES.length} โมดูล
              </Badge>
              {enabledModulesCount > 0 && (
                <Badge variant="outline" className="px-2 py-1">
                  {Math.round((enabledModulesCount / ALL_MODULES.length) * 100)}%
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                ↓ ขยาย
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                ↑ ย่อ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {categories.map(category => {
          const modulesInCategory = ALL_MODULES.filter(m => m.category === category)
          const isExpanded = expandedCategories.includes(category)

          const enabledCount = modulesInCategory.filter(m => {
            const perm = getPermission(m.key)
            return perm.can_access
          }).length

          return (
            <Card key={category} className="border">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">{isExpanded ? '▼' : '▶'}</span>
                  <div className="font-semibold">{category}</div>
                  <Badge variant="outline" className="ml-2">
                    {enabledCount} / {modulesInCategory.length}
                  </Badge>
                </div>
                <Badge variant={enabledCount > 0 ? "default" : "secondary"}>
                  {modulesInCategory.length}
                </Badge>
              </div>

              {isExpanded && (
                <div className="border-t">
                  <div>
                    <table className="w-full text-sm min-w-[900px]">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2.5 font-bold border-r w-[20%]">
                            <div>โมดูล</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>เข้า</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>ดู</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>เพิ่ม</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>แก้</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>ลบ</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>พิมพ์</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>นำเข้า</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>ส่งออก</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>อนุมัติ</div>
                          </th>
                          <th className="text-center p-2.5 font-normal w-[8%]">
                            <div>ทั้งหมด</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {modulesInCategory.map((module, idx) => {
                          const perm = getPermission(module.key)
                          const isEnabled = perm.can_access

                          return (
                            <tr
                              key={module.key}
                              className={`border-t hover:bg-muted/30 transition-colors ${isEnabled ? 'bg-blue-50/50' : ''
                                }`}
                            >
                              <td className="p-2.5 font-bold border-r">
                                <div className="flex items-center gap-2">
                                  {isEnabled && <span className="text-blue-600">●</span>}
                                  <span>{module.name}</span>
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_access}
                                    onCheckedChange={(checked) => updatePermission(module.key, 'can_access', checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_view}
                                    onCheckedChange={(checked) => updatePermission(module.key, 'can_view', checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_add}
                                    onCheckedChange={(checked) => updatePermission(module.key, 'can_add', checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_edit}
                                    onCheckedChange={(checked) => updatePermission(module.key, 'can_edit', checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_delete}
                                    onCheckedChange={(checked) => updatePermission(module.key, 'can_delete', checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_print}
                                    onCheckedChange={(checked) => updatePermission(module.key, 'can_print', checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_import}
                                    onCheckedChange={(checked) => updatePermission(module.key, 'can_import', checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_export}
                                    onCheckedChange={(checked) => updatePermission(module.key, 'can_export', checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_approve || false}
                                    onCheckedChange={(checked) => updatePermission(module.key, 'can_approve', checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>

                              <td className="text-center p-2.5">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={perm.can_access && perm.can_view && perm.can_add && perm.can_edit && perm.can_print && perm.can_import && perm.can_export}
                                    onCheckedChange={(checked) => toggleAllPermissions(module.key, checked as boolean)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
