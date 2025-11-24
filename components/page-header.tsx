"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/lib/settings-context"
import { formatDate } from "@/lib/date-formatter"

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const { settings } = useSettings()
  const [displayDate, setDisplayDate] = useState("")

  // useEffect จะทำงานเฉพาะฝั่ง Client เท่านั้น
  useEffect(() => {
    // เพิ่มการตรวจสอบว่า settings มีข้อมูลแล้วหรือยัง
    if (settings) {
      const today = formatDate(new Date(), settings.dateFormat, settings.yearType, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      setDisplayDate(today)
    }
  }, [settings])

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {action}
        <div className="text-right">
          <p className="text-xs text-gray-500">วันที่</p>
          {/* แสดงวันที่จาก state เพื่อป้องกัน Hydration Error */}
          <p className="text-sm font-medium text-gray-900 min-h-[1.25rem]">{displayDate}</p>
        </div>
      </div>
    </div>
  )
}

