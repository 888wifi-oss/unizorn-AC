"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, FileText, CreditCard, BarChart3, Settings, BookOpen, TrendingUp, Target, Receipt, PieChart, TrendingDown, Landmark, HandCoins, Users, BookText, Package, Calculator, Megaphone, ClipboardList, Wrench, Bell, Palette, FolderOpen, Key, Building, Shield, Gauge, DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"

const mainMenuItems = [
  { icon: LayoutDashboard, label: "แดชบอร์ด", href: "/" },
  { icon: Building2, label: "ห้องชุด", href: "/units" },
  { icon: Megaphone, label: "จัดการประกาศ", href: "/announcements" },
  { icon: Wrench, label: "จัดการงานแจ้งซ่อม", href: "/maintenance" },
  { icon: Users, label: "จัดการบัญชีลูกบ้าน", href: "/resident-accounts" },
  { icon: Bell, label: "จัดการการแจ้งเตือน", href: "/notifications" },
  { icon: Package, label: "จัดการพัสดุ", href: "/parcels" },
  { icon: BarChart3, label: "รายงานพัสดุ", href: "/parcels/reports" },
  { icon: FolderOpen, label: "จัดการเอกสารและไฟล์", href: "/file-management" },
  { icon: Key, label: "จัดการ API", href: "/api-management" },
  { icon: TrendingUp, label: "การวิเคราะห์ข้อมูล", href: "/analytics" },
  { icon: Settings, label: "ระบบอัตโนมัติ", href: "/automation" },
  { icon: Palette, label: "การตั้งค่าธีม", href: "/theme-settings" },
]

const systemMenuItems = [
  { icon: Building, label: "จัดการบริษัท", href: "/companies" },
  { icon: Building2, label: "จัดการโครงการ", href: "/projects" },
  { icon: Shield, label: "จัดการผู้ใช้และสิทธิ์", href: "/user-management" },
  { icon: Key, label: "จัดการสิทธิ์ (Roles)", href: "/settings/roles" },
]
const revenueMenuItems = [
  { icon: FileText, label: "ออกบิล", href: "/billing" },
  { icon: BarChart3, label: "รายงานบิล", href: "/billing/reports" },
  { icon: Bell, label: "แจ้งเตือนการชำระเงิน", href: "/billing/payment-reminders" },
  { icon: Gauge, label: "จัดการมิเตอร์", href: "/utility-meters" },
  { icon: DollarSign, label: "อัตราค่าบริการ", href: "/utility-rates" },
  { icon: CreditCard, label: "การชำระเงิน", href: "/payments" },
  { icon: CreditCard, label: "รายการชำระเงิน", href: "/payments/transactions" },
  { icon: Wallet, label: "วิธีการชำระเงิน", href: "/payment-methods" },
  { icon: FileText, label: "แม่แบบใบแจ้งหนี้", href: "/invoice-templates" },
  { icon: TrendingUp, label: "บันทึกรายรับ", href: "/revenue" },
  { icon: Receipt, label: "ลูกหนี้ค้างชำระ (AR)", href: "/accounts-receivable" },
];
const expenseMenuItems = [
  { icon: Users, label: "รายชื่อผู้ขาย", href: "/vendors" },
  { icon: HandCoins, label: "เจ้าหนี้การค้า (AP)", href: "/accounts-payable" },
  { icon: TrendingDown, label: "บันทึกรายจ่าย", href: "/expenses" },
];
const accountingMenuItems = [
  { icon: Package, label: "ทะเบียนทรัพย์สิน", href: "/fixed-assets" },
  { icon: Calculator, label: "คำนวณค่าเสื่อมราคา", href: "/depreciation" },
  { icon: BookOpen, label: "ผังบัญชี", href: "/chart-of-accounts" },
  { icon: BookText, label: "สมุดรายวันทั่วไป (JV)", href: "/journal-vouchers" },
  { icon: BookOpen, label: "สมุดบัญชีแยกประเภท (GL)", href: "/general-ledger" },
]
const reportMenuItems = [
  { icon: Target, label: "งบประมาณรายรับ", href: "/revenue-budget" },
  { icon: Target, label: "งบประมาณรายจ่าย", href: "/expense-budget" },
  { icon: ClipboardList, label: "รายงานเปรียบเทียบงบ", href: "/budget-report" },
  { icon: PieChart, label: "รายงานรายรับ", href: "/revenue-reports" },
  { icon: Landmark, label: "รายงานทางการเงิน", href: "/financial-statements" },
  { icon: BarChart3, label: "รายงานสรุป", href: "/reports" },
]

export function Sidebar() {
  const pathname = usePathname()

  const NavLink = ({ item }: { item: { icon: any, label: string, href: string } }) => {
    const Icon = item.icon
    const isActive = pathname === item.href
    return (
      <Link href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm", isActive ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-700")}>
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 text-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-blue-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center"><Building2 className="w-6 h-6 text-blue-600" /></div>
          <div><h1 className="font-bold text-lg">Unizorn</h1><p className="text-xs text-blue-200">Accounting System</p></div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
        <div>
          <p className="text-xs text-blue-200 mb-2 px-3 font-semibold">เมนูหลัก</p>
          {mainMenuItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>
        <div>
          <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">รายรับ</p>
          {revenueMenuItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>
        <div>
          <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">รายจ่าย</p>
          {expenseMenuItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>
        <div>
          <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">บัญชี</p>
          {accountingMenuItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>
        <div>
          <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">รายงาน</p>
          {reportMenuItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>
        <div>
          <p className="text-xs text-blue-200 mt-4 mb-2 px-3 font-semibold">ระบบ (System)</p>
          {systemMenuItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>
      </nav>

      <div className="p-4 border-t border-blue-500">
        <Link href="/settings" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm", pathname === "/settings" ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-700")}>
          <Settings className="w-5 h-5" />
          <span className="font-medium">ตั้งค่า</span>
        </Link>
      </div>
    </div>
  )
}

