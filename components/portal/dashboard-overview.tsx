"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Receipt, Bell, Package, Wrench } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/date-formatter"

interface DashboardOverviewProps {
    bills: any[]
    announcements: any[]
    parcels: any[]
    maintenanceRequests: any[]
    isLoading: boolean
}

export function DashboardOverview({
    bills,
    announcements,
    parcels,
    maintenanceRequests,
    isLoading
}: DashboardOverviewProps) {

    // Calculate stats
    const outstandingCount = bills?.length || 0
    const pendingParcelsCount = parcels?.filter(p => p.status === 'pending').length || 0
    const activeMaintenanceCount = maintenanceRequests?.filter(m => m.status !== 'completed' && m.status !== 'cancelled').length || 0
    // For announcements, we don't have read status yet, so just show total for now or recent ones
    const announcementCount = announcements?.length || 0

    // Get details for subtitles
    const latestBill = bills?.[0]
    const billSubtitle = latestBill
        ? `ครบกำหนด ${formatDate(latestBill.due_date, 'short')}`
        : "ไม่มีรายการค้าง"

    const parcelSubtitle = pendingParcelsCount > 0
        ? "มาถึงแล้ว"
        : "ไม่มีพัสดุตกค้าง"

    const maintenanceSubtitle = activeMaintenanceCount > 0
        ? "กำลังดำเนินการ"
        : "ไม่มีรายการแจ้งซ่อม"

    const announcementSubtitle = announcementCount > 0
        ? "ประกาศล่าสุด"
        : "ไม่มีประกาศใหม่"

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
        )
    }

    const cards = [
        {
            title: "บิลค้างชำระ",
            count: outstandingCount,
            subtitle: billSubtitle,
            icon: Receipt,
            color: "text-red-600",
            bgColor: "bg-red-50 dark:bg-red-900/20",
            borderColor: "border-red-100 dark:border-red-900/30"
        },
        {
            title: "พัสดุรอรับ",
            count: pendingParcelsCount,
            subtitle: parcelSubtitle,
            icon: Package,
            color: "text-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            borderColor: "border-blue-100 dark:border-blue-900/30"
        },
        {
            title: "ประกาศใหม่",
            count: announcementCount,
            subtitle: announcementSubtitle,
            icon: Bell,
            color: "text-orange-600",
            bgColor: "bg-orange-50 dark:bg-orange-900/20",
            borderColor: "border-orange-100 dark:border-orange-900/30"
        },
        {
            title: "แจ้งซ่อม",
            count: activeMaintenanceCount,
            subtitle: maintenanceSubtitle,
            icon: Wrench,
            color: "text-green-600",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            borderColor: "border-green-100 dark:border-green-900/30"
        }
    ]

    return (
        <div className="space-y-4 mb-6">
            <div>
                <h2 className="text-lg font-bold">ภาพรวม</h2>
                <p className="text-sm text-muted-foreground">สรุปข้อมูลสำคัญของคุณ</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        className={`border shadow-sm hover:shadow-md transition-all duration-300 ${card.borderColor} bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm`}
                    >
                        <CardContent className="p-4 flex flex-col justify-between h-full min-h-[140px]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.bgColor} ${card.color} mb-3`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-1">{card.count}</div>
                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{card.title}</div>
                                <div className="text-xs text-muted-foreground mt-1">{card.subtitle}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
