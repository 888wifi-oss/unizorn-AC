// components/dynamic-sidebar.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"
import { MODULE_ACCESS_CONFIG, canAccessModule } from "@/lib/types/module-permissions"

interface MenuItem {
  icon: LucideIcon
  label: string
  href: string
  module: string
}

interface DynamicSidebarProps {
  userRole: string // User's primary role name
  userRoleLevel: number // User's role level (0-4)
}

export function DynamicSidebar({ userRole, userRoleLevel }: DynamicSidebarProps) {
  const pathname = usePathname()
  const [accessibleModules, setAccessibleModules] = useState<string[]>([])

  useEffect(() => {
    // Get all modules user can access
    const modules = Object.keys(MODULE_ACCESS_CONFIG).filter(moduleName =>
      canAccessModule(userRole, moduleName)
    )
    setAccessibleModules(modules)
  }, [userRole])

  // Define menu structure with module names
  const menuStructure = {
    system: {
      label: 'ระบบ (System)',
      show: userRoleLevel <= 1, // Super Admin or Company Admin
      items: [
        { icon: Icons.Building, label: "จัดการบริษัท", href: "/companies", module: "companies" },
        { icon: Icons.Building2, label: "จัดการโครงการ", href: "/projects", module: "projects" },
        { icon: Icons.Shield, label: "จัดการผู้ใช้และสิทธิ์", href: "/user-management", module: "user_management" },
        { icon: Icons.Key, label: "จัดการ API", href: "/api-management", module: "api_management" },
      ]
    },
    main: {
      label: 'เมนูหลัก',
      show: userRoleLevel <= 3, // Admin + Staff
      items: [
        { icon: Icons.LayoutDashboard, label: "แดชบอร์ด", href: "/", module: "dashboard" },
        { icon: Icons.Building2, label: "ห้องชุด", href: "/units", module: "units" },
        { icon: Icons.Megaphone, label: "จัดการประกาศ", href: "/announcements", module: "announcements" },
        { icon: Icons.Wrench, label: "จัดการงานแจ้งซ่อม", href: "/maintenance", module: "maintenance" },
        { icon: Icons.Users, label: "จัดการบัญชีลูกบ้าน", href: "/resident-accounts", module: "resident_accounts" },
        { icon: Icons.Bell, label: "จัดการการแจ้งเตือน", href: "/notifications", module: "notifications" },
        { icon: Icons.Package, label: "จัดการพัสดุ", href: "/parcels", module: "parcels" },
        { icon: Icons.BarChart3, label: "รายงานพัสดุ", href: "/parcels/reports", module: "parcel_reports" },
        { icon: Icons.FolderOpen, label: "จัดการเอกสารและไฟล์", href: "/file-management", module: "file_management" },
      ]
    },
    revenue: {
      label: 'รายรับ',
      show: userRoleLevel <= 3, // Admin + Staff
      items: [
        { icon: Icons.FileText, label: "ออกบิล", href: "/billing", module: "billing" },
        { icon: Icons.BarChart3, label: "รายงานบิล", href: "/billing/reports", module: "billing" },
        { icon: Icons.Bell, label: "แจ้งเตือนการชำระเงิน", href: "/billing/payment-reminders", module: "billing" },
        { icon: Icons.Gauge, label: "จัดการมิเตอร์", href: "/utility-meters", module: "billing" },
        { icon: Icons.DollarSign, label: "อัตราค่าบริการ", href: "/utility-rates", module: "billing" },
        { icon: Icons.CreditCard, label: "การชำระเงิน", href: "/payments", module: "payments" },
        { icon: Icons.Scale, label: "การกระทบยอด", href: "/payments/bank-reconciliation", module: "payments" },
        { icon: Icons.CreditCard, label: "รายการชำระเงิน", href: "/payments/transactions", module: "payments" },
        { icon: Icons.Wallet, label: "วิธีการชำระเงิน", href: "/payment-methods", module: "payments" },
        { icon: Icons.TrendingUp, label: "บันทึกรายรับ", href: "/revenue", module: "revenue" },
        { icon: Icons.Receipt, label: "ลูกหนี้ค้างชำระ (AR)", href: "/accounts-receivable", module: "accounts_receivable" },
      ]
    },
    expense: {
      label: 'รายจ่าย',
      show: userRoleLevel <= 2, // Admin only
      items: [
        { icon: Icons.TrendingDown, label: "บันทึกรายจ่าย", href: "/expenses", module: "expenses" },
      ]
    },
    accounting: {
      label: 'บัญชี',
      show: userRoleLevel <= 2, // Admin only
      items: [
        { icon: Icons.Package, label: "ทะเบียนทรัพย์สิน", href: "/fixed-assets", module: "fixed_assets" },
        { icon: Icons.Calculator, label: "คำนวณค่าเสื่อมราคา", href: "/depreciation", module: "depreciation" },
        { icon: Icons.BookOpen, label: "ผังบัญชี", href: "/chart-of-accounts", module: "chart_of_accounts" },
        { icon: Icons.BookText, label: "สมุดรายวันทั่วไป (JV)", href: "/journal-vouchers", module: "journal_vouchers" },
        { icon: Icons.BookOpen, label: "สมุดบัญชีแยกประเภท (GL)", href: "/general-ledger", module: "general_ledger" },
      ]
    },
    reports: {
      label: 'รายงาน',
      show: userRoleLevel <= 3, // Admin + Staff (some reports)
      items: [
        { icon: Icons.Target, label: "งบประมาณรายรับ", href: "/revenue-budget", module: "revenue_budget" },
        { icon: Icons.Target, label: "งบประมาณรายจ่าย", href: "/expense-budget", module: "expense_budget" },
        { icon: Icons.ClipboardList, label: "รายงานเปรียบเทียบงบ", href: "/budget-report", module: "budget_report" },
        { icon: Icons.PieChart, label: "รายงานรายรับ", href: "/revenue-reports", module: "revenue_reports" },
        { icon: Icons.Landmark, label: "รายงานทางการเงิน", href: "/financial-statements", module: "financial_statements" },
        { icon: Icons.BarChart3, label: "รายงานสรุป", href: "/reports", module: "reports" },
      ]
    },
    advanced: {
      label: 'ขั้นสูง',
      show: userRoleLevel <= 2, // Admin only
      items: [
        { icon: Icons.TrendingUp, label: "การวิเคราะห์ข้อมูล", href: "/analytics", module: "analytics" },
        { icon: Icons.Settings, label: "ระบบอัตโนมัติ", href: "/automation", module: "automation" },
        { icon: Icons.Palette, label: "การตั้งค่าธีม", href: "/theme-settings", module: "theme_settings" },
      ]
    }
  }

  const NavLink = ({ item }: { item: MenuItem }) => {
    const Icon = item.icon
    const isActive = pathname === item.href

    // Check if user can access this module
    if (!accessibleModules.includes(item.module)) {
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
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 text-white h-screen fixed left-0 top-0 flex flex-col">
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

      <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
        {/* System Menu */}
        {menuStructure.system.show && (
          <div>
            <p className="text-xs text-blue-200 mb-2 px-3 font-semibold">
              {menuStructure.system.label}
            </p>
            {menuStructure.system.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        {/* Main Menu */}
        {menuStructure.main.show && (
          <div>
            <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">
              {menuStructure.main.label}
            </p>
            {menuStructure.main.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        {/* Revenue Menu */}
        {menuStructure.revenue.show && (
          <div>
            <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">
              {menuStructure.revenue.label}
            </p>
            {menuStructure.revenue.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        {/* Expense Menu */}
        {menuStructure.expense.show && (
          <div>
            <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">
              {menuStructure.expense.label}
            </p>
            {menuStructure.expense.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        {/* Accounting Menu */}
        {menuStructure.accounting.show && (
          <div>
            <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">
              {menuStructure.accounting.label}
            </p>
            {menuStructure.accounting.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        {/* Reports Menu */}
        {menuStructure.reports.show && (
          <div>
            <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">
              {menuStructure.reports.label}
            </p>
            {menuStructure.reports.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        {/* Advanced Menu */}
        {menuStructure.advanced.show && (
          <div>
            <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">
              {menuStructure.advanced.label}
            </p>
            {menuStructure.advanced.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-blue-500">
        <div className="text-xs text-blue-200 mb-2">
          <div>Role: <span className="font-semibold">{userRole}</span></div>
          <div>Level: <span className="font-semibold">{userRoleLevel}</span></div>
          <div>Modules: <span className="font-semibold">{accessibleModules.length}</span></div>
        </div>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
            pathname === "/settings"
              ? "bg-blue-800 text-white"
              : "text-blue-100 hover:bg-blue-700"
          )}
        >
          <Icons.Settings className="w-5 h-5" />
          <span className="font-medium">ตั้งค่า</span>
        </Link>
      </div>
    </div>
  )
}
