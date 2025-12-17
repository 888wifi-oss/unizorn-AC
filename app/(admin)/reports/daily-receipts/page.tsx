"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Search, Calendar, FileText, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getDailyReceipts, type DailyReceipt } from "@/lib/actions/report-actions"
import Link from "next/link"

export default function DailyReceiptsPage() {
    const { selectedProjectId } = useProjectContext()
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [receipts, setReceipts] = useState<DailyReceipt[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        loadData()
    }, [date, selectedProjectId])

    const loadData = async () => {
        setLoading(true)
        try {
            const result = await getDailyReceipts(date, selectedProjectId)
            if (result.success && result.data) {
                setReceipts(result.data)
            } else {
                throw new Error(result.error || "Failed to load data")
            }
        } catch (error) {
            console.error("Error loading daily receipts:", error)
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถโหลดข้อมูลได้",
                variant: "destructive",
            })
            setReceipts([])
        } finally {
            setLoading(false)
        }
    }

    const totalAmount = receipts.reduce((sum, item) => sum + item.amount, 0)

    const exportCSV = () => {
        const headers = ["วันที่", "เลขที่อ้างอิง", "เลขที่บิล", "ห้องชุด", "ผู้ชำระ", "วิธีชำระ", "จำนวนเงิน", "หมายเหตุ"]
        const rows = receipts.map((item) => [
            new Date(item.payment_date).toLocaleDateString("th-TH") + " " + new Date(item.payment_date).toLocaleTimeString("th-TH"),
            item.receipt_number,
            item.bill_number,
            item.unit_number,
            item.payer_name,
            item.payment_method === 'transfer' ? 'โอนเงิน' : item.payment_method === 'cash' ? 'เงินสด' : item.payment_method,
            item.amount.toString(),
            item.notes
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
        ].join("\n")

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `รายงานรายวันรับ_${date}.csv`
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
                    title="รายงานรายวันรับ"
                    subtitle="แสดงรายละเอียดการรับเงินประจำวัน"
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
                        <CardTitle className="text-sm font-medium">รวมรับทั้งสิ้น</CardTitle>
                        <FileText className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">฿{totalAmount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            จาก {receipts.length} รายการ
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>รายการรับเงินประจำวันที่ {new Date(date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</CardTitle>
                        <Button variant="outline" onClick={exportCSV} disabled={receipts.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            ส่งออก CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>เวลา</TableHead>
                                <TableHead>เลขที่อ้างอิง</TableHead>
                                <TableHead>เลขที่บิล</TableHead>
                                <TableHead>ห้องชุด</TableHead>
                                <TableHead>ผู้ชำระ</TableHead>
                                <TableHead>วิธีชำระ</TableHead>
                                <TableHead className="text-right">จำนวนเงิน</TableHead>
                                <TableHead>หมายเหตุ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        กำลังโหลดข้อมูล...
                                    </TableCell>
                                </TableRow>
                            ) : receipts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        ไม่มีรายการรับเงินในวันนี้
                                    </TableCell>
                                </TableRow>
                            ) : (
                                receipts.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{new Date(item.payment_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                        <TableCell className="font-mono">{item.receipt_number}</TableCell>
                                        <TableCell className="font-mono">{item.bill_number}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.unit_number}</Badge>
                                        </TableCell>
                                        <TableCell>{item.payer_name}</TableCell>
                                        <TableCell>
                                            {item.payment_method === 'transfer' && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">โอนเงิน</Badge>}
                                            {item.payment_method === 'cash' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">เงินสด</Badge>}
                                            {item.payment_method !== 'transfer' && item.payment_method !== 'cash' && <Badge variant="secondary">{item.payment_method}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">฿{item.amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{item.notes}</TableCell>
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
