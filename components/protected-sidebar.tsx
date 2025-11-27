// components/protected-sidebar.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { getAccessibleModulesForRole, canPerformAction } from "@/lib/types/granular-permissions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getUserAggregatedPermissions } from "@/lib/actions/user-group-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, LogOut, Settings, User } from "lucide-react"

interface MenuItem {
  icon: keyof typeof Icons
  label: string
  href: string
  module: string
  minActions?: string[] // Actions ขั้นต่ำที่ต้องมีจึงจะแสดงเมนู
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

export function ProtectedSidebar() {
  const pathname = usePathname()
  const currentUser = getCurrentUser()
  const [visibleMenus, setVisibleMenus] = useState<Record<string, boolean>>({})
  const { selectedProject, availableProjects, setSelectedProjectId } = useProjectContext()
  const [loading, setLoading] = useState(true)

  const [isMounted, setIsMounted] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "เมนูหลัก": true,
    "รายรับ": true,
    "รายจ่าย": false,
    "บัญชี": false,
    "รายงาน": false,
    "ขั้นสูง": false,
    "ระบบ (System)": false
  })

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    loadUserPermissions()
  }, [currentUser.id, selectedProject?.id])

  const loadUserPermissions = async () => {
    setLoading(true)
    const projectId = selectedProject?.id || null
    console.log('[ProtectedSidebar] ===== START LOADING PERMISSIONS =====')
    console.log('[ProtectedSidebar] User:', {
      id: currentUser.id,
      email: currentUser.email,
      full_name: currentUser.full_name,
      role: currentUser.role
    })
    console.log('[ProtectedSidebar] Project:', {
      id: projectId,
      name: selectedProject?.name
    })

    try {
      // Special handling for Super Admin - show all menus
      if (currentUser.role === 'super_admin') {
        console.log('[ProtectedSidebar] Super Admin detected - showing all menus')
        const allModules = [
          'companies', 'projects', 'users', 'user_groups', 'api',
          'dashboard', 'units', 'team_management', 'announcements', 'maintenance',
          'resident_accounts', 'notifications', 'parcels', 'parcel_reports', 'files',
          'billing', 'payments', 'revenue', 'accounts_receivable', 'expenses',
          'fixed_assets', 'depreciation', 'chart_of_accounts', 'journal_vouchers', 'general_ledger',
          'revenue_budget', 'expense_budget', 'budget_report', 'revenue_reports', 'financial_statements',
          'reports', 'analytics', 'automation', 'theme_settings', 'user_management',
          'revenue_journal', 'expense_approval', 'expense_reports', 'trial_balance', 'vendors',
          'system'
        ]

        const visibleMenus: Record<string, boolean> = {}
        allModules.forEach(module => {
          visibleMenus[module] = true
        })

        console.log('[ProtectedSidebar] Super Admin visible menus:', visibleMenus)
        console.log('[ProtectedSidebar] Super Admin total visible menu count:', Object.keys(visibleMenus).length)
        setVisibleMenus(visibleMenus)
        return
      }

      // Get all permissions (Role + User Group) from database
      let allModuleNames = new Set<string>()

      if (currentUser.id && currentUser.id !== 'guest') {
        try {
          console.log('[ProtectedSidebar] Calling getUserAggregatedPermissions with:', {
            userId: currentUser.id,
            projectId: projectId
          })

          const result = await getUserAggregatedPermissions(currentUser.id, projectId)

          console.log('[ProtectedSidebar] getUserAggregatedPermissions result:', result)

          if (result.success && result.permissions && result.permissions.length > 0) {
            console.log('[ProtectedSidebar] User Group permissions loaded:', result.permissions.length, 'modules')
            result.permissions.forEach((perm: any) => {
              console.log('[ProtectedSidebar] Processing permission:', perm)
              if (perm.can_access || perm.can_view) {
                allModuleNames.add(perm.module)
                console.log('[ProtectedSidebar] Added module:', perm.module)
              }
            })
            console.log('[ProtectedSidebar] Final modules from User Group:', Array.from(allModuleNames))
            console.log('[ProtectedSidebar] Total modules count:', allModuleNames.size)
          } else {
            console.log('[ProtectedSidebar] No User Group permissions found:', result)
            console.log('[ProtectedSidebar] This user has no User Group permissions - menus will be hidden')
          }
        } catch (error) {
          console.error('[ProtectedSidebar] Error loading User Group permissions:', error)
          console.log('[ProtectedSidebar] Error occurred - menus will be hidden')
        }
      } else {
        console.log('[ProtectedSidebar] Guest user - using role-based permissions only')
        const roleModules = getAccessibleModulesForRole(currentUser.role)
        roleModules.forEach(m => {
          if (m.canAccess) {
            allModuleNames.add(m.module)
          }
        })
        console.log('[ProtectedSidebar] Role-based permissions:', Array.from(allModuleNames))
      }

      // Set visible modules
      const visible: Record<string, boolean> = {}

      console.log('[ProtectedSidebar] ===== PERMISSION MERGE =====')
      console.log('[ProtectedSidebar] All modules from database:', Array.from(allModuleNames))
      console.log('[ProtectedSidebar] Total modules count:', allModuleNames.size)

      // Set all modules as visible
      allModuleNames.forEach(moduleName => {
        visible[moduleName] = true
      })

      console.log('[ProtectedSidebar] Final visible modules:', Object.keys(visible).length, Object.keys(visible))

      console.log('[ProtectedSidebar] ===== FINAL RESULT =====')
      console.log('[ProtectedSidebar] Setting visibleMenus state with:', Object.keys(visible).length, 'modules')
      console.log('[ProtectedSidebar] ===== END LOADING PERMISSIONS =====')
      setVisibleMenus(visible)
    } catch (error) {
      console.error('[ProtectedSidebar] Error loading permissions:', error)
      // Fallback to role-based only
      const roleModules = getAccessibleModulesForRole(currentUser.role)
      const visible: Record<string, boolean> = {}
      roleModules.forEach(m => {
        visible[m.module] = true
      })
      setVisibleMenus(visible)
      console.log('[ProtectedSidebar] Fallback to role-based:', Object.keys(visible).length)
    } finally {
      setLoading(false)
    }
  }

  // Define all menu groups (no minRoleLevel - use User Group permissions instead)
  const menuGroups: MenuGroup[] = [
    {
      label: 'ระบบ (System)',
      items: [
        { icon: 'Building', label: "จัดการบริษัท", href: "/companies", module: "companies", minActions: ['view'] },
        { icon: 'Building2', label: "จัดการโครงการ", href: "/projects", module: "projects", minActions: ['view'] },
        { icon: 'Shield', label: "จัดการผู้ใช้และสิทธิ์", href: "/user-management", module: "users", minActions: ['view'] },
        { icon: 'Users', label: "กลุ่มผู้ใช้งาน", href: "/user-groups", module: "user_groups", minActions: ['view'] },
        { icon: 'Key', label: "จัดการ API", href: "/api-management", module: "api", minActions: ['view'] },
        { icon: 'Database', label: "ย้ายข้อมูล (Migration)", href: "/settings/migration", module: "system", minActions: ['view'] },
      ]
    },
    {
      label: 'เมนูหลัก',
      items: [
        { icon: 'LayoutDashboard', label: "แดชบอร์ด", href: "/", module: "dashboard", minActions: ['view'] },
        { icon: 'Building2', label: "ห้องชุด", href: "/units", module: "units", minActions: ['view'] },
        { icon: 'Users', label: "จัดการทีมงาน", href: "/team-management", module: "team_management", minActions: ['view'] },
        { icon: 'Megaphone', label: "จัดการประกาศ", href: "/announcements", module: "announcements", minActions: ['view'] },
        { icon: 'Wrench', label: "จัดการงานแจ้งซ่อม", href: "/maintenance", module: "maintenance", minActions: ['view'] },
        { icon: 'Calendar', label: "ปฏิทินนัดหมายซ่อม", href: "/maintenance/calendar", module: "maintenance", minActions: ['view'] },
        { icon: 'Users', label: "จัดการบัญชีลูกบ้าน", href: "/resident-accounts", module: "resident_accounts", minActions: ['view'] },
        { icon: 'Bell', label: "จัดการการแจ้งเตือน", href: "/notifications", module: "notifications", minActions: ['view'] },
        { icon: 'Package', label: "จัดการพัสดุ", href: "/parcels", module: "parcels", minActions: ['view'] },
        { icon: 'BarChart3', label: "รายงานพัสดุ", href: "/parcels/reports", module: "parcel_reports", minActions: ['view'] },
        { icon: 'FolderOpen', label: "จัดการเอกสารและไฟล์", href: "/file-management", module: "files", minActions: ['view'] },
      ]
    },
    {
      label: 'รายรับ',
      items: [
        { icon: 'FileText', label: "ออกบิล", href: "/billing", module: "billing", minActions: ['view'] },
        { icon: 'BarChart3', label: "รายงานบิล", href: "/billing/reports", module: "billing", minActions: ['view'] },
        { icon: 'Bell', label: "แจ้งเตือนการชำระเงิน", href: "/billing/payment-reminders", module: "billing", minActions: ['view'] },
        { icon: 'Gauge', label: "จัดการมิเตอร์", href: "/utility-meters", module: "billing", minActions: ['view'] },
        { icon: 'DollarSign', label: "อัตราค่าบริการ", href: "/utility-rates", module: "billing", minActions: ['view'] },
        { icon: 'CreditCard', label: "การชำระเงิน", href: "/payments", module: "payments", minActions: ['view'] },
        { icon: 'Scale', label: "การกระทบยอด", href: "/payments/bank-reconciliation", module: "payments", minActions: ['view'] },
        { icon: 'CreditCard', label: "รายการชำระเงิน", href: "/payments/transactions", module: "payments", minActions: ['view'] },
        { icon: 'Wallet', label: "วิธีการชำระเงิน", href: "/payment-methods", module: "payments", minActions: ['view'] },
        { icon: 'FileText', label: "แม่แบบใบแจ้งหนี้", href: "/invoice-templates", module: "billing", minActions: ['view'] },
        { icon: 'TrendingUp', label: "บันทึกรายรับ", href: "/revenue", module: "revenue", minActions: ['view'] },
        { icon: 'Receipt', label: "ลูกหนี้ค้างชำระ (AR)", href: "/accounts-receivable", module: "accounts_receivable", minActions: ['view'] },
      ]
    },
    {
      label: 'รายจ่าย',
      items: [
        { icon: 'Users', label: "รายชื่อผู้ขาย", href: "/vendors", module: "vendors", minActions: ['view'] },
        { icon: 'HandCoins', label: "เจ้าหนี้การค้า (AP)", href: "/accounts-payable", module: "accounts_payable", minActions: ['view'] },
        { icon: 'TrendingDown', label: "บันทึกรายจ่าย", href: "/expenses", module: "expenses", minActions: ['view'] },
        { icon: 'CheckCircle', label: "อนุมัติรายจ่าย", href: "/expense-approval", module: "expense_approval", minActions: ['view'] },
        { icon: 'BarChart3', label: "รายงานรายจ่าย", href: "/expense-reports", module: "expense_reports", minActions: ['view'] },
      ]
    },
    {
      label: 'บัญชี',
      items: [
        { icon: 'Package', label: "ทะเบียนทรัพย์สิน", href: "/fixed-assets", module: "fixed_assets", minActions: ['view'] },
        { icon: 'Calculator', label: "คำนวณค่าเสื่อมราคา", href: "/depreciation", module: "depreciation", minActions: ['view'] },
        { icon: 'BookOpen', label: "ผังบัญชี", href: "/chart-of-accounts", module: "chart_of_accounts", minActions: ['view'] },
        { icon: 'BookText', label: "สมุดรายวันทั่วไป (JV)", href: "/journal-vouchers", module: "journal_vouchers", minActions: ['view'] },
        { icon: 'BookOpen', label: "สมุดบัญชีแยกประเภท (GL)", href: "/general-ledger", module: "general_ledger", minActions: ['view'] },
        { icon: 'TrendingUp', label: "บันทึกรายรับ", href: "/revenue-journal", module: "revenue_journal", minActions: ['view'] },
        { icon: 'Scale', label: "งบทดลอง", href: "/trial-balance", module: "trial_balance", minActions: ['view'] },
      ]
    },
    {
      label: 'รายงาน',
      items: [
        { icon: 'Target', label: "งบประมาณรายรับ", href: "/revenue-budget", module: "revenue_budget", minActions: ['view'] },
        { icon: 'Target', label: "งบประมาณรายจ่าย", href: "/expense-budget", module: "expense_budget", minActions: ['view'] },
        { icon: 'ClipboardList', label: "รายงานเปรียบเทียบงบ", href: "/budget-report", module: "budget_report", minActions: ['view'] },
        { icon: 'PieChart', label: "รายงานรายรับ", href: "/revenue-reports", module: "revenue_reports", minActions: ['view'] },
        { icon: 'Landmark', label: "รายงานทางการเงิน", href: "/financial-statements", module: "financial_statements", minActions: ['view'] },
        { icon: 'Banknote', label: "งบกระแสเงินสด", href: "/cash-flow", module: "financial_statements", minActions: ['view'] },
        { icon: 'BarChart3', label: "รายงานสรุป", href: "/reports", module: "reports", minActions: ['view'] },
        { icon: 'TrendingUp', label: "การวิเคราะห์ขั้นสูง", href: "/advanced-analytics", module: "advanced_analytics", minActions: ['view'] },
      ]
    },
    {
      label: 'ขั้นสูง',
      items: [
        { icon: 'TrendingUp', label: "การวิเคราะห์ข้อมูล", href: "/analytics", module: "analytics", minActions: ['view'] },
        { icon: 'Settings', label: "ระบบอัตโนมัติ", href: "/automation", module: "automation", minActions: ['view'] },
        { icon: 'Palette', label: "การตั้งค่าธีม", href: "/theme-settings", module: "theme_settings", minActions: ['view'] },
        { icon: 'Users', label: "จัดการผู้ใช้", href: "/user-management", module: "user_management", minActions: ['view'] },
        { icon: 'Activity', label: "ประสิทธิภาพระบบ", href: "/performance", module: "performance", minActions: ['view'] },
      ]
    }
  ]

  // No need for role level - use User Group permissions instead

  // Debug logging for User Group permissions
  console.log('[ProtectedSidebar] ===== USER GROUP PERMISSIONS DEBUG =====')
  console.log('[ProtectedSidebar] User role:', currentUser.role)
  console.log('[ProtectedSidebar] Visible menus:', Object.keys(visibleMenus).filter(key => visibleMenus[key]))
  console.log('[ProtectedSidebar] ===== END DEBUG =====')

  // Check if menu item should be visible
  const isMenuItemVisible = (item: MenuItem): boolean => {
    // Check module access
    if (!visibleMenus[item.module]) {
      console.log('[ProtectedSidebar] Menu item not visible:', item.module, 'not in visibleMenus:', Object.keys(visibleMenus))
      return false
    }

    // For User Group permissions, we trust the permissions from getUserAggregatedPermissions
    // which already checks can_access and can_view, so we don't need to check minActions again
    console.log('[ProtectedSidebar] Menu item visible:', item.module)
    return true
  }

  // Check if menu group should be visible
  const isMenuGroupVisible = (group: MenuGroup): boolean => {
    // Check if at least one item is visible (based on User Group permissions)
    const visibleItems = group.items.filter(isMenuItemVisible)
    console.log('[ProtectedSidebar] Group visible:', group.label, 'visibleItems:', visibleItems.length, 'of', group.items.length)
    return visibleItems.length > 0
  }

  const NavLink = ({ item }: { item: MenuItem }) => {
    const IconComponent = Icons[item.icon] as Icons.LucideIcon
    const isActive = pathname === item.href

    if (!isMenuItemVisible(item)) {
      return null
    }

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
          isActive
            ? "bg-blue-800 text-white"
            : "text-blue-100 hover:bg-blue-700"
        )}
      >
        <IconComponent className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </Link>
    )
  }

  // Count visible menus
  const visibleMenuCount = menuGroups.reduce((count, group) => {
    if (!isMenuGroupVisible(group)) return count
    const groupCount = group.items.filter(isMenuItemVisible).length
    console.log('[ProtectedSidebar] Group count:', group.label, '=', groupCount)
    return count + groupCount
  }, 0)

  console.log('[ProtectedSidebar] Total visible menu count:', visibleMenuCount)
  console.log('[ProtectedSidebar] visibleMenus state:', Object.keys(visibleMenus).length, Object.keys(visibleMenus))

  // Prevent hydration mismatch - show loading state during SSR
  if (!isMounted) {
    return (
      <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 text-white h-screen fixed left-0 top-0 flex flex-col" suppressHydrationWarning>
        {/* Header */}
        <div className="p-6 border-b border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Icons.Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Unizorn</h1>
              <p className="text-xs text-blue-200">Smart Living Management</p>
            </div>
          </div>
        </div>
        {/* Loading state */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <Icons.Loader2 className="w-6 h-6 animate-spin text-blue-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 text-white h-screen fixed left-0 top-0 flex flex-col" suppressHydrationWarning>
      {/* Header */}
      <div className="p-6 border-b border-blue-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Icons.Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Unizorn</h1>
            <p className="text-xs text-blue-200">Smart Living Management</p>
          </div>
        </div>
      </div>

      {/* Project Selector (for non-Super Admin) */}
      {currentUser.role !== 'super_admin' && availableProjects.length > 0 && (
        <div className="px-3 py-2 border-b border-blue-500 bg-blue-800/20">
          <Select value={selectedProject?.id || ""} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="bg-blue-950/40 text-white border-blue-500/30 h-8 text-xs focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="เลือกโครงการ">
                {selectedProject ? (
                  <div className="flex items-center gap-2 text-left overflow-hidden">
                    <Icons.Building2 className="w-3 h-3 shrink-0 text-blue-200" />
                    <span className="truncate font-medium">{selectedProject.name}</span>
                  </div>
                ) : (
                  "เลือกโครงการ"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{project.name}</span>
                    {project.company?.name && (
                      <span className="text-xs text-muted-foreground">
                        {project.company.name}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 min-h-0">
        <div className="space-y-2 py-2">
          {menuGroups.map((group, index) => {
            const isVisible = isMenuGroupVisible(group)
            if (!isVisible) return null

            const visibleItems = group.items.filter(isMenuItemVisible)
            const isOpen = openGroups[group.label] ?? true

            return (
              <Collapsible
                key={index}
                open={isOpen}
                onOpenChange={() => toggleGroup(group.label)}
                className="space-y-1"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-blue-200 hover:text-white transition-colors">
                  {group.label}
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-blue-500 bg-blue-800/30">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border-2 border-blue-400">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-600 text-white font-bold">
              {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser.full_name || 'User'}</p>
            <p className="text-xs text-blue-200 truncate capitalize">{currentUser.role.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-medium",
              pathname === "/settings"
                ? "bg-blue-700 text-white"
                : "bg-blue-800/50 text-blue-100 hover:bg-blue-700"
            )}
          >
            <Settings className="w-4 h-4" />
            <span>ตั้งค่า</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-medium bg-red-900/30 text-red-200 hover:bg-red-900/50 hover:text-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span>ออก</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

