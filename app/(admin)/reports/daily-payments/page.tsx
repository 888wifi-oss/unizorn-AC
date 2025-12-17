"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Calendar, ArrowLeft, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getDailyPayments, type DailyPayment } from "@/lib/actions/report-actions"
import Link from "next/link"

export default function DailyPaymentsPage() {
    const { selectedProjectId } = useProjectContext()
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [payments, setPayments] = useState<DailyPayment[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        loadData()
    }, [date, selectedProjectId])

    const loadData = async () => {
        setLoading(true)
        try {
            const result = await getDailyPayments(date, selectedProjectId)
            if (result.success && result.data) {
                setPayments(result.data)
            } else {
                throw new Error(result.error || "Failed to load data")
            }
        } catch (error) {
            console.error("Error loading daily payments:", error)
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถโหลดข้อมูลได้",
                variant: "destructive",
            })
            setPayments([])
        } finally {
            setLoading(false)
        }
    }

    const totalAmount = payments.reduce((sum, item) => sum + item.amount, 0)

    const exportCSV = () => {
        const headers = ["วันที่", "เลขที่เอกสาร", "รายการ", "รหัสบัญชี", "ชื่อบัญชี", "จำนวนเงิน"]
        const rows = payments.map((item) => [
            new Date(item.payment_date).toLocaleDateString("th-TH"),
            item.document_no,
            item.description,
            item.account_code,
            item.account_name,
            item.amount.toString()
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
        ].join("\n")

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `รายงานรายวันจ่าย_${date}.csv`
        link.click()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/reports">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <PageHeader
                    title="รายงานรายวันจ่าย"
                    subtitle="แสดงรายละเอียดการจ่ายเงินประจำวัน"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                    <CardContent className="pt-6">
                        <div className="flex items-end gap-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="date">เลือกวันที่</Label>
                                <Input
                                    type="date"
                                    id="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">รวมจ่ายทั้งสิ้น</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">฿{totalAmount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            จาก {payments.length} รายการ
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>รายการจ่ายเงินประจำวันที่ {new Date(date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</CardTitle>
                        <Button variant="outline" onClick={exportCSV} disabled={payments.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            ส่งออก CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>วันที่</TableHead>
                                <TableHead>เลขที่เอกสาร</TableHead>
                                <TableHead>รายการ</TableHead>
                                <TableHead>รหัสบัญชี</TableHead>
                                <TableHead>ชื่อบัญชี</TableHead>
                                <TableHead className="text-right">จำนวนเงิน</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        กำลังโหลดข้อมูล...
                                    </TableCell>
                                </TableRow>
                            ) : payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        ไม่มีรายการจ่ายเงินในวันนี้
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{new Date(item.payment_date).toLocaleDateString("th-TH")}</TableCell>
                                        <TableCell className="font-mono">{item.document_no}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.account_code}</TableCell>
                                        <TableCell>{item.account_name}</TableCell>
                                        <TableCell className="text-right font-medium text-red-600">฿{item.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
