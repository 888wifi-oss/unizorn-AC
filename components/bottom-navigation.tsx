"use client"

import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  FileText,
  Package,
  MessageSquare,
  Wrench,
  User,
  Home
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/context/theme-context"

import { LucideIcon } from "lucide-react"

interface NavItem {
  icon: LucideIcon
  label: string
  tab: string | null
  exact?: boolean
  badge?: number | null
}

const navItemsThai: NavItem[] = [
  { icon: Home, label: "หน้าแรก", tab: null, exact: true },
  { icon: FileText, label: "บิล", tab: "bills", badge: null },
  { icon: Package, label: "พัสดุ", tab: "parcels", badge: null },
  { icon: MessageSquare, label: "ประกาศ", tab: "announcements", badge: null },
  { icon: Wrench, label: "ซ่อม", tab: "maintenance", badge: null }
]

const navItemsEnglish: NavItem[] = [
  { icon: Home, label: "Home", tab: null, exact: true },
  { icon: FileText, label: "Bills", tab: "bills", badge: null },
  { icon: Package, label: "Parcels", tab: "parcels", badge: null },
  { icon: MessageSquare, label: "News", tab: "announcements", badge: null },
  { icon: Wrench, label: "Repair", tab: "maintenance", badge: null }
]

export default function BottomNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const { theme } = useTheme()
  const [language, setLanguage] = useState<string>('th')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    const updateLanguage = () => {
      const savedLang = localStorage.getItem('portal-language') || 'th'
      setLanguage(savedLang)
    }

    // Initial load
    updateLanguage()

    // Listen for storage changes
    window.addEventListener('storage', updateLanguage)

    // Also check periodically for same-tab changes
    const interval = setInterval(updateLanguage, 500)

    return () => {
      window.removeEventListener('storage', updateLanguage)
      clearInterval(interval)
    }
  }, [])

  const themeColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    pink: 'text-pink-600',
    dark: 'text-gray-800'
  }

  const activeColor = themeColors[theme]

  const navItems = language === 'en' ? navItemsEnglish : navItemsThai

  // Show default during SSR to avoid hydration mismatch
  if (!isMounted) {
    return null
  }

  const isActive = (tab: string | null, exact: boolean = false) => {
    if (exact) {
      return !currentTab
    }
    return currentTab === tab
  }

  const handleNavClick = async (tab: string | null) => {
    console.log('[BottomNav] Clicked tab:', tab)
    console.log('[BottomNav] Current URL before:', window.location.href)

    // Wait for router to update URL
    if (!tab) {
      console.log('[BottomNav] Navigating to /portal/dashboard')
      await router.push("/portal/dashboard", { scroll: false })
    } else {
      console.log('[BottomNav] Navigating to /portal/dashboard?tab=' + tab)
      await router.push(`/portal/dashboard?tab=${tab}`, { scroll: false })
    }

    console.log('[BottomNav] Current URL after:', window.location.href)

    // Trigger custom event to update dashboard
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        console.log('[BottomNav] Triggering urlchange event')
        window.dispatchEvent(new CustomEvent('urlchange'))
      }, 100)
    }
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.tab, item.exact)

          return (
            <button
              key={item.tab || "home"}
              onClick={() => handleNavClick(item.tab)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                active
                  ? activeColor
                  : "text-gray-600 hover:text-gray-700"
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
