// components/reconciliation-summary-card.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle, AlertCircle, TrendingUp } from "lucide-react"
import type { ReconciliationSummary } from "@/lib/actions/reconciliation-actions"

interface ReconciliationSummaryCardProps {
    summary: ReconciliationSummary
    isLoading?: boolean
}

export function ReconciliationSummaryCard({ summary, isLoading }: ReconciliationSummaryCardProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const stats = [
        {
            title: "ทั้งหมด",
            value: summary.total_transactions,
            icon: TrendingUp,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            description: "รายการทั้งหมด",
        },
        {
            title: "จับคู่แล้ว",
            value: summary.matched_count,
            icon: CheckCircle2,
            color: "text-green-600",
            bgColor: "bg-green-50",
            description: `฿${summary.total_matched_amount.toLocaleString()}`,
        },
        {
            title: "รอตรวจสอบ",
            value: summary.pending_count,
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
            description: `฿${summary.total_pending_amount.toLocaleString()}`,
        },
        {
            title: "ตรวจสอบแล้ว",
            value: summary.reviewed_count,
            icon: CheckCircle2,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            description: "ผ่านการตรวจสอบ",
        },
        {
            title: "ปฏิเสธ",
            value: summary.rejected_count,
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
            description: "ไม่ถูกต้อง",
        },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                                {stat.value.toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-500">{stat.description}</p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
