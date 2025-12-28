"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Droplet, Zap, TrendingUp, Calendar, Download, Check, ChevronsUpDown, X, ArrowRight } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

interface UtilityReportsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    meters: any[]
    units: any[]
}

export function UtilityReportsDialog({ open, onOpenChange, meters, units }: UtilityReportsDialogProps) {
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]) // Empty means ALL
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())
    const [startMonth, setStartMonth] = useState<string>("01")
    const [endMonth, setEndMonth] = useState<string>("12")
    const [openCombobox, setOpenCombobox] = useState(false)
    const [tableUtilityType, setTableUtilityType] = useState<"water" | "electricity">("water")

    const allMonths = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

    // Filtered months based on range
    const filteredMonths = useMemo(() => {
        return allMonths.filter(m => parseInt(m) >= parseInt(startMonth) && parseInt(m) <= parseInt(endMonth))
    }, [startMonth, endMonth])

    // 1. Process Data
    const processedData = useMemo(() => {
        // Check if we should use all units or filtered
        const targetUnitIds = selectedUnitIds.length > 0 ? selectedUnitIds : units.map(u => u.id)
        const unitMap = new Map(units.map(u => [u.id, u]))

        const monthlyStats: Record<string, { name: string, water: number, electricity: number }> = {}
        const unitStats: Record<string, {
            unitId: string,
            unitNumber: string,
            totalWater: number,
            totalElectricity: number,
            water: Record<string, number>,
            electricity: Record<string, number>
        }> = {}

        // Init Monthly Stats (Only for filtered months)
        filteredMonths.forEach(m => {
            const monthName = new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleString('th-TH', { month: 'short' })
            monthlyStats[m] = { name: monthName, water: 0, electricity: 0 }
        })

        // Init Unit Stats
        targetUnitIds.forEach(uid => {
            const u = unitMap.get(uid)
            if (u) {
                unitStats[uid] = {
                    unitId: uid,
                    unitNumber: u.unit_number,
                    totalWater: 0,
                    totalElectricity: 0,
                    water: {},
                    electricity: {}
                }
            }
        })

        let grandTotalWater = 0
        let grandTotalElectricity = 0

        // Iterate meters
        meters.forEach(meter => {
            if (!targetUnitIds.includes(meter.unit_id)) return

            const readings = meter.meter_readings || []
            readings.forEach((reading: any) => {
                if (!reading.reading_date) return
                const date = new Date(reading.reading_date)
                if (date.getFullYear().toString() !== year) return

                const month = (date.getMonth() + 1).toString().padStart(2, '0')

                // Skip if month is not in selected range
                if (!filteredMonths.includes(month)) return

                const usage = reading.usage_amount || 0

                // Update Monthly Aggregates
                if (meter.meter_type === 'water') {
                    monthlyStats[month].water += usage
                    grandTotalWater += usage

                    // Update Unit Stats
                    if (unitStats[meter.unit_id]) {
                        unitStats[meter.unit_id].totalWater += usage
                        unitStats[meter.unit_id].water[month] = usage
                    }
                } else if (meter.meter_type === 'electricity') {
                    monthlyStats[month].electricity += usage
                    grandTotalElectricity += usage

                    // Update Unit Stats
                    if (unitStats[meter.unit_id]) {
                        unitStats[meter.unit_id].totalElectricity += usage
                        unitStats[meter.unit_id].electricity[month] = usage
                    }
                }
            })
        })

        // Rank Units for Min/Max insights
        const unitList = Object.values(unitStats).sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))

        // Find Min/Max Water
        const maxWater = Math.max(...unitList.map(u => u.totalWater))
        const minWater = Math.min(...unitList.map(u => u.totalWater).filter(v => v > 0)) || 0

        // Find Min/Max Elec
        const maxElec = Math.max(...unitList.map(u => u.totalElectricity))
        const minElec = Math.min(...unitList.map(u => u.totalElectricity).filter(v => v > 0)) || 0

        // Add insights to each unit
        const unitListWithInsights = unitList.map(u => ({
            ...u,
            isMaxWater: u.totalWater === maxWater && maxWater > 0,
            isMinWater: u.totalWater === minWater && minWater > 0 && u.totalWater > 0,
            isMaxElec: u.totalElectricity === maxElec && maxElec > 0,
            isMinElec: u.totalElectricity === minElec && minElec > 0 && u.totalElectricity > 0,
        }))

        // Prepare Ranking Data (Top 12)
        const waterRanking = [...unitList]
            .sort((a, b) => b.totalWater - a.totalWater)
            .slice(0, 12)
            .map(u => ({ name: u.unitNumber, value: u.totalWater }))

        const elecRanking = [...unitList]
            .sort((a, b) => b.totalElectricity - a.totalElectricity)
            .slice(0, 12)
            .map(u => ({ name: u.unitNumber, value: u.totalElectricity }))

        return {
            monthlyChartData: Object.values(monthlyStats),
            unitTableData: unitListWithInsights,
            waterRanking,
            elecRanking,
            summary: {
                totalWater: grandTotalWater,
                totalElectricity: grandTotalElectricity,
                avgWater: targetUnitIds.length > 0 ? grandTotalWater / targetUnitIds.length : 0,
                avgElectricity: targetUnitIds.length > 0 ? grandTotalElectricity / targetUnitIds.length : 0
            }
        }
    }, [meters, selectedUnitIds, year, units, filteredMonths])

    const handleExport = () => {
        try {
            const wb = XLSX.utils.book_new()

            // Sheet 1: Monthly Summary
            const summaryData = processedData.monthlyChartData.map(item => ({
                'เดือน': item.name,
                'น้ำประปา (ลบ.ม.)': item.water,
                'ไฟฟ้า (หน่วย)': item.electricity,
            }))
            const wsSummary = XLSX.utils.json_to_sheet(summaryData)
            XLSX.utils.book_append_sheet(wb, wsSummary, "รายเดือน (รวม)")

            // Sheet 2: Detailed Breakdown (Water)
            const waterData = processedData.unitTableData.map(item => {
                const row: any = { 'ห้องชุด': item.unitNumber, 'รวม': item.totalWater }
                filteredMonths.forEach(m => {
                    // Get localized Month Name
                    const monthName = new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleString('th-TH', { month: 'short' })
                    row[monthName] = item.water[m] || 0
                })
                return row
            })
            const wsWater = XLSX.utils.json_to_sheet(waterData)
            XLSX.utils.book_append_sheet(wb, wsWater, "น้ำประปา (รายละเอียด)")

            // Sheet 3: Detailed Breakdown (Electricity)
            const elecData = processedData.unitTableData.map(item => {
                const row: any = { 'ห้องชุด': item.unitNumber, 'รวม': item.totalElectricity }
                filteredMonths.forEach(m => {
                    const monthName = new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleString('th-TH', { month: 'short' })
                    row[monthName] = item.electricity[m] || 0
                })
                return row
            })
            const wsElec = XLSX.utils.json_to_sheet(elecData)
            XLSX.utils.book_append_sheet(wb, wsElec, "ไฟฟ้า (รายละเอียด)")

            const fileName = `Utility_Report_${year}_${startMonth}-${endMonth}.xlsx`
            XLSX.writeFile(wb, fileName)
        } catch (error) {
            console.error("Export failed:", error)
            alert("ไม่สามารถ Export ข้อมูลได้")
        }
    }

    const toggleUnit = (unitId: string) => {
        setSelectedUnitIds(current => {
            if (current.includes(unitId)) {
                return current.filter(id => id !== unitId)
            } else {
                return [...current, unitId]
            }
        })
    }

    const getMonthName = (m: string) => {
        return new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleString('th-TH', { month: 'short' })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[100vw] w-screen h-screen flex flex-col p-0 gap-0 sm:max-w-screen sm:h-screen rounded-none">

                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-white">
                    <div className="flex items-center justify-between w-full">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                            รายงานสถิติการใช้สาธารณูปโภค
                        </DialogTitle>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export Excel</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                    <div className="space-y-6 max-w-[1600px] mx-auto">

                        {/* Filters */}
                        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-6 items-end">
                            <div className="flex-1 min-w-[300px]">
                                <label className="text-sm font-medium mb-1.5 block text-slate-600">
                                    ห้องชุด ({selectedUnitIds.length === 0 ? "ทั้งหมด" : selectedUnitIds.length})
                                </label>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCombobox}
                                            className="w-full justify-between"
                                        >
                                            {selectedUnitIds.length === 0
                                                ? "แสดงทั้งหมด"
                                                : `${selectedUnitIds.length} ห้องที่เลือก`}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="ค้นหาห้องชุด..." />
                                            <CommandList>
                                                <CommandEmpty>ไม่พบห้องชุด</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        onSelect={() => setSelectedUnitIds([])}
                                                        className="cursor-pointer font-medium text-blue-600"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedUnitIds.length === 0 ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        แสดงทั้งหมด
                                                    </CommandItem>
                                                    {units.map((unit) => (
                                                        <CommandItem
                                                            key={unit.id}
                                                            value={unit.unit_number}
                                                            onSelect={() => toggleUnit(unit.id)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedUnitIds.includes(unit.id) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {unit.unit_number}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex gap-2 items-end">
                                <div className="w-[110px]">
                                    <label className="text-sm font-medium mb-1.5 block text-slate-600">ตั้งแต่</label>
                                    <Select value={startMonth} onValueChange={(val) => {
                                        setStartMonth(val)
                                        if (parseInt(val) > parseInt(endMonth)) {
                                            setEndMonth(val)
                                        }
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allMonths.map(m => (
                                                <SelectItem key={m} value={m}>{getMonthName(m)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="pb-2 text-slate-400">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                                <div className="w-[110px]">
                                    <label className="text-sm font-medium mb-1.5 block text-slate-600">ถึงเดือน</label>
                                    <Select value={endMonth} onValueChange={(val) => {
                                        setEndMonth(val)
                                        if (parseInt(val) < parseInt(startMonth)) {
                                            setStartMonth(val)
                                        }
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allMonths.map(m => (
                                                <SelectItem key={m} value={m}>{getMonthName(m)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="w-[100px]">
                                <label className="text-sm font-medium mb-1.5 block text-slate-600">ปี</label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2025">2025</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-none pb-0.5">
                                {selectedUnitIds.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedUnitIds([])}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        size="sm"
                                    >
                                        ล้างตัวเลือก
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Summary KPI */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Water */}
                            <Card className="border-blue-100 bg-blue-50/50">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600/80">น้ำประปา (รวมช่วงเวลา)</p>
                                            <h3 className="text-2xl font-bold text-blue-700 mt-1">
                                                {processedData.summary.totalWater.toLocaleString()} <span className="text-sm font-normal">ลบ.ม.</span>
                                            </h3>
                                        </div>
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Droplet className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-100 bg-white">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">เฉลี่ยต่อห้อง (น้ำ)</p>
                                            <h3 className="text-2xl font-bold text-slate-700 mt-1">
                                                {processedData.summary.avgWater.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal">ลบ.ม.</span>
                                            </h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Electricity */}
                            <Card className="border-yellow-100 bg-yellow-50/50">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-yellow-600/80">ไฟฟ้า (รวมช่วงเวลา)</p>
                                            <h3 className="text-2xl font-bold text-yellow-700 mt-1">
                                                {processedData.summary.totalElectricity.toLocaleString()} <span className="text-sm font-normal">หน่วย</span>
                                            </h3>
                                        </div>
                                        <div className="p-2 bg-yellow-100 rounded-lg">
                                            <Zap className="w-5 h-5 text-yellow-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-yellow-100 bg-white">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">เฉลี่ยต่อห้อง (ไฟ)</p>
                                            <h3 className="text-2xl font-bold text-slate-700 mt-1">
                                                {processedData.summary.avgElectricity.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal">หน่วย</span>
                                            </h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Areas */}
                        <Tabs defaultValue="chart" className="w-full">
                            <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
                                <TabsTrigger value="chart">กราฟเปรียบเทียบ (Chart)</TabsTrigger>
                                <TabsTrigger value="table">ตารางแยกห้อง (Table)</TabsTrigger>
                            </TabsList>

                            {/* Chart View */}
                            <TabsContent value="chart" className="space-y-6">

                                {/* Monthly Trend Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Water Trend */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                                <Droplet className="w-4 h-4 text-blue-500" />
                                                แนวโน้มการใช้น้ำ (รายเดือน)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={processedData.monthlyChartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F1F5F9' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="water" fill="#3b82f6" radius={[4, 4, 0, 0]} name="น้ำ (ลบ.ม.)" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    {/* Elec Trend */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-yellow-500" />
                                                แนวโน้มการใช้ไฟ (รายเดือน)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={processedData.monthlyChartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F1F5F9' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="electricity" fill="#eab308" radius={[4, 4, 0, 0]} name="ไฟ (หน่วย)" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Ranking Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Water Ranking */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                                จัดอันดับการใช้น้ำ (Top 12)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[400px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart layout="vertical" data={processedData.waterRanking} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={40} tick={{ fontSize: 11 }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F1F5F9' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="value" fill="#60a5fa" radius={[0, 4, 4, 0]} barSize={20} name="น้ำ (ลบ.ม.)" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    {/* Elec Ranking */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-yellow-500" />
                                                จัดอันดับการใช้ไฟ (Top 12)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[400px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart layout="vertical" data={processedData.elecRanking} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={40} tick={{ fontSize: 11 }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F1F5F9' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="value" fill="#facc15" radius={[0, 4, 4, 0]} barSize={20} name="ไฟ (หน่วย)" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>

                            </TabsContent>

                            {/* Table View */}
                            <TabsContent value="table">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between py-4">
                                        <CardTitle className="text-base font-medium">รายละเอียดรายเดือน</CardTitle>
                                        <div className="flex bg-slate-100 p-1 rounded-lg">
                                            <button
                                                onClick={() => setTableUtilityType("water")}
                                                className={cn(
                                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                    tableUtilityType === "water" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Droplet className="w-4 h-4" />
                                                    น้ำประปา
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setTableUtilityType("electricity")}
                                                className={cn(
                                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                    tableUtilityType === "electricity" ? "bg-white shadow-sm text-yellow-600" : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-4 h-4" />
                                                    ไฟฟ้า
                                                </div>
                                            </button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                    <TableHead className="font-semibold text-slate-700 min-w-[100px] sticky left-0 bg-slate-50 z-10">ห้องชุด</TableHead>
                                                    {filteredMonths.map(m => (
                                                        <TableHead key={m} className="text-center font-medium min-w-[60px]">{getMonthName(m)}</TableHead>
                                                    ))}
                                                    <TableHead className="text-right font-bold min-w-[100px] bg-slate-50 sticky right-0 z-10">รวมช่วงเวลา</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {processedData.unitTableData.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={filteredMonths.length + 2} className="text-center py-8 text-gray-400">
                                                            ไม่พบข้อมูล
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    processedData.unitTableData.map((item) => {
                                                        const isMax = tableUtilityType === "water" ? item.isMaxWater : item.isMaxElec
                                                        const isMin = tableUtilityType === "water" ? item.isMinWater : item.isMinElec
                                                        const total = tableUtilityType === "water" ? item.totalWater : item.totalElectricity

                                                        return (
                                                            <TableRow key={item.unitId} className="group">
                                                                <TableCell className="font-medium sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r">
                                                                    {item.unitNumber}
                                                                    {isMax && <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-1 py-0 h-4">สูงที่สุด</Badge>}
                                                                    {isMin && <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1 py-0 h-4">ต่ำที่สุด</Badge>}
                                                                </TableCell>
                                                                {filteredMonths.map(m => {
                                                                    const val = tableUtilityType === "water" ? item.water[m] : item.electricity[m]
                                                                    return (
                                                                        <TableCell key={m} className="text-center text-slate-600">
                                                                            {val ? val.toLocaleString() : "-"}
                                                                        </TableCell>
                                                                    )
                                                                })}
                                                                <TableCell className={cn(
                                                                    "text-right font-bold border-l sticky right-0 bg-white group-hover:bg-slate-50 z-10",
                                                                    isMax ? "text-red-600 bg-red-50 group-hover:bg-red-50" : "",
                                                                    isMin ? "text-green-600 bg-green-50 group-hover:bg-green-50" : ""
                                                                )}>
                                                                    {total.toLocaleString()}
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                    </div>
                </div>

            </DialogContent>
        </Dialog>
    )
}
