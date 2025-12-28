"use client"

import type React from "react";
import { Building2, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeProvider, useTheme } from "@/lib/context/theme-context";
import { ThemeSelector } from "@/components/theme-selector";
import { PortalSettings } from "@/components/portal-settings";
import { SWRProvider } from "@/lib/providers/swr-provider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function PortalContent({ children }: { children: React.ReactNode }) {
  const [unitNumber, setUnitNumber] = useState("")
  const router = useRouter()
  const { theme } = useTheme()
  const [isLoginPage, setIsLoginPage] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Check if current page is login
    const path = window.location.pathname
    setIsLoginPage(path === '/portal/login')

    const residentDataString = localStorage.getItem("residentData");
    if (residentDataString) {
      try {
        const info = JSON.parse(residentDataString);
        setUnitNumber(info.unit_number || "");
      } catch (error) {
        console.error("Failed to parse resident data:", error);
      }
    }
  }, [])

  // Logo background colors based on theme
  const logoBgColors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    pink: 'bg-pink-600',
    dark: 'bg-gray-800'
  }

  const logoBgClass = logoBgColors[theme]

  // Wait for client-side mount to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // ถ้าเป็นหน้า login ไม่ต้องแสดง header และ navigation
  if (isLoginPage) {
    return (
      <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">
        {children}
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="w-full bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${logoBgClass} rounded-lg flex items-center justify-center`}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-sm text-gray-800 dark:text-gray-100">Unizorn</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Resident Portal</p>
                </div>
              </div>
              {/* Mobile only buttons */}
              <div className="flex items-center gap-2 md:hidden">
                <ThemeSelector />
                <PortalSettings />
                {unitNumber && unitNumber.trim() !== '' && (
                  <div className="relative z-10">
                    <NotificationBell unitNumber={unitNumber} className="h-9 w-9 text-gray-700 dark:text-gray-300" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-700 dark:text-gray-300"
                  onClick={() => {
                    localStorage.removeItem("residentData")
                    window.location.href = "/portal/login"
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop Header - แสดง Notification Bell เท่านั้น */}
          <div className="hidden md:block p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${logoBgClass} rounded-lg flex items-center justify-center`}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">Unizorn</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Resident Portal</p>
                </div>
              </div>
              {/* Desktop: แสดง Bell เท่านั้น เพราะ Dashboard มี controls อื่นแล้ว */}
              <div className="flex items-center gap-4">
                {unitNumber && (
                  <NotificationBell unitNumber={unitNumber} />
                )}
                <a href="/portal/profile" className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                  โปรไฟล์
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto py-4 md:py-8 px-4 md:px-6 pb-20 lg:pb-8">
        {children}
      </main>

      <footer className="hidden md:block w-full text-center p-4 text-xs text-gray-400 border-t bg-white" suppressHydrationWarning>
        &copy; {new Date().getFullYear()} Unizorn. All rights reserved.
      </footer>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />
    </div>
  )
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SWRProvider>
        <PortalContent>
          {children}
        </PortalContent>
      </SWRProvider>
    </ThemeProvider>
  );
}