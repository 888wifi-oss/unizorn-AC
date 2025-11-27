"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, AlertCircle, CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"
import { useProjectContext } from "@/lib/contexts/project-context"

interface ExcelImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    meters: any[] // Pass existing meters for validation
}

interface ImportRow {
    unit_number: string
    meter_type: string
    meter_number: string
    previous_reading: number
    current_reading: number | string
    reading_date: string
    status: 'valid' | 'invalid'
    error?: string
    meter_id?: string
}

export function ExcelImportDialog({ open, onOpenChange, onSuccess, meters }: ExcelImportDialogProps) {
    const { toast } = useToast()
    const supabase = createClient()
    const { selectedProjectId } = useProjectContext()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<ImportRow[]>([])
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [summary, setSummary] = useState({ valid: 0, invalid: 0 })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setAnalyzing(true)
        setParsedData([])

        try {
            const data = await selectedFile.arrayBuffer()
            const workbook = XLSX.read(data)
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

            const processedRows: ImportRow[] = jsonData.map((row: any) => {
                const meterNumber = String(row['Meter Number'] || row['meter_number'] || '').trim()
                const currentReadingRaw = row['Current Reading'] || row['current_reading']
                const readingDateRaw = row['Reading Date'] || row['reading_date']

                // Find matching meter
                const meter = meters.find(m => m.meter_number.toLowerCase() === meterNumber.toLowerCase())

                let status: 'valid' | 'invalid' = 'valid'
                let error = ''

                if (!meter) {
                    status = 'invalid'
                    error = 'Meter not found'
                } else if (!currentReadingRaw && currentReadingRaw !== 0) {
                    // Allow 0 as a reading
                    status = 'invalid'
                    error = 'Missing current reading'
                } else {
                    const current = Number(currentReadingRaw)
                    const previous = meter.latest_reading?.current_reading || 0

                    if (isNaN(current)) {
                        status = 'invalid'
                        error = 'Invalid number'
                    } else if (current < previous) {
                        status = 'invalid'
                        error = `Reading < Previous (${previous})`
                    }
                }

                // Parse date (default to today if missing or invalid)
                let readingDate = new Date().toISOString().split('T')[0]
                if (readingDateRaw) {
                    // Handle Excel date serial number if necessary, or string
                    if (typeof readingDateRaw === 'number') {
                        // Excel date serial to JS Date
                        const date = new Date(Math.round((readingDateRaw - 25569) * 86400 * 1000));
                        readingDate = date.toISOString().split('T')[0]
                    } else {
                        // Try parsing string
                        const date = new Date(readingDateRaw)
                        if (!isNaN(date.getTime())) {
                            readingDate = date.toISOString().split('T')[0]
                        }
                    }
                }

                return {
                    unit_number: row['Unit Number'] || meter?.unit_number || 'Unknown',
                    meter_type: row['Meter Type'] || meter?.meter_type || 'Unknown',
                    meter_number: meterNumber,
                    previous_reading: meter?.latest_reading?.current_reading || 0,
                    current_reading: currentReadingRaw,
                    reading_date: readingDate,
                    status,
                    error,
                    meter_id: meter?.id
                }
            })

            setParsedData(processedRows)
            setSummary({
                valid: processedRows.filter(r => r.status === 'valid').length,
                invalid: processedRows.filter(r => r.status === 'invalid').length
            })

        } catch (error) {
            console.error('Error parsing Excel:', error)
            toast({
                title: "Error parsing file",
                description: "Please ensure the file is a valid Excel file.",
                variant: "destructive"
            })
        } finally {
            setAnalyzing(false)
        }
    }

    const handleImport = async () => {
        const validRows = parsedData.filter(r => r.status === 'valid')
        if (validRows.length === 0) return

        setLoading(true)
        try {
            const readingsToInsert = validRows.map(row => ({
                meter_id: row.meter_id,
                reading_date: row.reading_date,
                previous_reading: row.previous_reading,
                current_reading: Number(row.current_reading),
                usage_amount: Number(row.current_reading) - row.previous_reading,
                reading_type: 'regular',
                notes: 'Imported via Excel'
            }))

            const { error } = await supabase
                .from('meter_readings')
                .insert(readingsToInsert)

            if (error) throw error

            toast({
                title: "Import Successful",
                description: `Successfully imported ${validRows.length} readings.`,
            })
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Import error:', error)
            toast({
                title: "Import Failed",
                description: error.message || "Failed to save readings.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setFile(null)
        setParsedData([])
        setSummary({ valid: 0, invalid: 0 })
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) reset()
            onOpenChange(val)
        }}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Meter Readings from Excel</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
                    {!file ? (
                        <div
                            className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileSpreadsheet className="w-12 h-12 mb-4 text-green-600" />
                            <p className="text-lg font-medium">Click to upload Excel file</p>
                            <p className="text-sm">.xlsx or .xls files</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <span className="font-medium">{summary.valid} Valid</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        <span className="font-medium">{summary.invalid} Invalid</span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={reset}>
                                    Change File
                                </Button>
                            </div>

                            <div className="border rounded-md flex-1 overflow-hidden">
                                <ScrollArea className="h-[50vh]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Meter No.</TableHead>
                                                <TableHead>Prev</TableHead>
                                                <TableHead>Current</TableHead>
                                                <TableHead>Usage</TableHead>
                                                <TableHead>Message</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analyzing ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-8">
                                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                                        <span className="text-xs text-gray-500 mt-2 block">Analyzing file...</span>
                                                    </TableCell>
                                                </TableRow>
                                            ) : parsedData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                        No data found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                parsedData.map((row, i) => (
                                                    <TableRow key={i} className={row.status === 'invalid' ? 'bg-red-50' : ''}>
                                                        <TableCell>
                                                            {row.status === 'valid' ? (
                                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-red-600" />
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{row.unit_number}</TableCell>
                                                        <TableCell>{row.meter_type}</TableCell>
                                                        <TableCell>{row.meter_number}</TableCell>
                                                        <TableCell>{row.previous_reading}</TableCell>
                                                        <TableCell className="font-bold">{row.current_reading}</TableCell>
                                                        <TableCell>
                                                            {row.status === 'valid' && !isNaN(Number(row.current_reading))
                                                                ? Number(row.current_reading) - row.previous_reading
                                                                : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-red-600 text-xs">{row.error}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={loading || summary.valid === 0}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            `Confirm Import (${summary.valid})`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
