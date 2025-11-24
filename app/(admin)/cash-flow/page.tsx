"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getCashFlowStatement } from "@/lib/supabase/actions"
import { Loader2, Search, Printer, FileDown } from "lucide-react"
import { useProjectContext } from "@/lib/contexts/project-context"
import { useCurrency } from "@/lib/currency-formatter"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"

interface CashFlowItem {
    description: string
    amount: number
}

interface CashFlowSection {
    receipts?: CashFlowItem[]
    payments?: CashFlowItem[]
    purchases?: CashFlowItem[]
    sales?: CashFlowItem[]
    proceeds?: CashFlowItem[]
    repayments?: CashFlowItem[]
    net: number
}

interface CashFlowData {
    period: { startDate: string; endDate: string }
    operating: CashFlowSection
    investing: CashFlowSection
    financing: CashFlowSection
    netCashFlow: number
    beginningCash: number
    endingCash: number
}

export default function CashFlowPage() {
    const { selectedProjectId } = useProjectContext()
    const { formatCurrency } = useCurrency()
    const { settings } = useSettings()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<CashFlowData | null>(null)

    // Default to current month
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const [startDate, setStartDate] = useState(firstDay.toISOString().split("T")[0])
    const [endDate, setEndDate] = useState(today.toISOString().split("T")[0])

    const handleGenerate = async () => {
        setIsLoading(true)
        try {
            const result = await getCashFlowStatement(startDate, endDate, selectedProjectId || undefined)
            setData(result)
        } catch (error) {
            console.error("Error generating cash flow statement:", error)
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถสร้างงบกระแสเงินสดได้",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-generate when project changes
    useEffect(() => {
        handleGenerate()
    }, [selectedProjectId])

    const handlePrint = () => {
        window.print()
    }

    const renderSection = (title: string, items: { label: string, amount: number, isNegative?: boolean }[], net: number) => (
        <>
            <TableRow className="bg-muted/50 font-medium">
                <TableCell colSpan={2}>{title}</TableCell>
            </TableRow>
            {items.map((item, index) => (
                <TableRow key={index}>
                    <TableCell className="pl-8">{item.label}</TableCell>
                    <TableCell className="text-right">
                        {item.isNegative ? `(${formatCurrency(item.amount)})` : formatCurrency(item.amount)}
                    </TableCell>
                </TableRow>
            ))}
            <TableRow className="font-semibold border-t-2">
                <TableCell className="pl-8">เงินสดสุทธิจาก{title}</TableCell>
                <TableCell className="text-right">
                    {net < 0 ? `(${formatCurrency(Math.abs(net))})` : formatCurrency(net)}
                </TableCell>
            </TableRow>
        </>
    )

    return (
        <div className="space-y-6">
            <PageHeader
                title="งบกระแสเงินสด"
                subtitle="รายงานการไหลเข้า-ออกของเงินสดแยกตามกิจกรรม"
                action={
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        พิมพ์รายงาน
                    </Button>
                }
            />

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="startDate">ตั้งแต่วันที่</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endDate">ถึงวันที่</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleGenerate} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                            สร้างรายงาน
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {data ? (
                        <div className="print-container space-y-6">
                            <div className="text-center space-y-2 mb-6">
                                <h2 className="text-2xl font-bold">งบกระแสเงินสด</h2>
                                <p className="text-muted-foreground">
                                    สำหรับงวดวันที่ {formatDate(data.period.startDate, "long", settings.yearType)} ถึง {formatDate(data.period.endDate, "long", settings.yearType)}
                                </p>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[70%]">รายการ</TableHead>
                                            <TableHead className="text-right">จำนวนเงิน</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Operating Activities */}
                                        {renderSection(
                                            "กิจกรรมดำเนินงาน",
                                            [
                                                ...(data.operating.receipts || []).map(i => ({ label: i.description, amount: i.amount })),
                                                ...(data.operating.payments || []).map(i => ({ label: i.description, amount: i.amount, isNegative: true }))
                                            ],
                                            data.operating.net
                                        )}

                                        {/* Investing Activities */}
                                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>
                                        {renderSection(
                                            "กิจกรรมลงทุน",
                                            [
                                                ...(data.investing.sales || []).map(i => ({ label: i.description, amount: i.amount })),
                                                ...(data.investing.purchases || []).map(i => ({ label: i.description, amount: i.amount, isNegative: true }))
                                            ],
                                            data.investing.net
                                        )}

                                        {/* Financing Activities */}
                                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>
                                        {renderSection(
                                            "กิจกรรมจัดหาเงิน",
                                            [
                                                ...(data.financing.proceeds || []).map(i => ({ label: i.description, amount: i.amount })),
                                                ...(data.financing.repayments || []).map(i => ({ label: i.description, amount: i.amount, isNegative: true }))
                                            ],
                                            data.financing.net
                                        )}

                                        {/* Summary */}
                                        <TableRow><TableCell colSpan={2} className="h-8 border-b-2"></TableCell></TableRow>

                                        <TableRow className="font-bold text-lg">
                                            <TableCell>เงินสดและรายการเทียบเท่าเงินสดเพิ่มขึ้น (ลดลง) สุทธิ</TableCell>
                                            <TableCell className="text-right">
                                                {data.netCashFlow < 0 ? `(${formatCurrency(Math.abs(data.netCashFlow))})` : formatCurrency(data.netCashFlow)}
                                            </TableCell>
                                        </TableRow>

                                        <TableRow>
                                            <TableCell>บวก เงินสดและรายการเทียบเท่าเงินสดต้นงวด</TableCell>
                                            <TableCell className="text-right">{formatCurrency(data.beginningCash)}</TableCell>
                                        </TableRow>

                                        <TableRow className="font-bold text-lg bg-primary/5">
                                            <TableCell>เงินสดและรายการเทียบเท่าเงินสดปลายงวด</TableCell>
                                            <TableCell className="text-right underline decoration-double underline-offset-4">
                                                {formatCurrency(data.endingCash)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            กรุณาเลือกช่วงวันที่และกด "สร้างรายงาน" เพื่อดูงบกระแสเงินสด
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
